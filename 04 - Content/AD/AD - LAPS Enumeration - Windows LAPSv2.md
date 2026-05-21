---
aliases:
  - LAPSv2
  - msLAPS-Password
  - Windows LAPS
  - DPAPI-NG LAPS
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - LAPS Enumeration]]"
---
# AD - LAPS Enumeration - Windows LAPSv2

***

## LAPSv2 Architecture

| **Atributo** | **Significado** | **Cuándo** |
|:---:|:---:|:---:|
| `msLAPS-Password` | Cleartext password (JSON: `{"n":"user","p":"pass","t":"timestamp"}`) | Si encryption disabled (legacy mode). |
| `msLAPS-EncryptedPassword` | DPAPI-NG encrypted blob | Default modern (Win11/Server 2022+). |
| `msLAPS-EncryptedPasswordHistory` | History encrypted (config GPO) | Audit / rollback. |
| `msLAPS-EncryptedDSRMPassword` | DSRM password (DCs) | Edge — DC LAPS. |
| `msLAPS-PasswordExpirationTime` | FILETIME expiration | Trigger rotation. |
| Min OS | Win11 22H2, Server 2019/2022 con KB5025229+ | Compatibility. |
^ad-lapsv2-arch

**Improvements vs LAPSv1:**
- DPAPI-NG encryption (key derivado de un security principal/group).
- Password history.
- Cloud backup (Entra ID / Azure AD).
- Native Windows (no MSI).
- DSRM password support en DCs.

___

## Cleartext vs Encrypted

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer <host> -Pr msLAPS-Password` | Cleartext JSON si encryption disabled | Default Win11 builds antiguos / config legacy. |
| `Get-ADComputer <host> -Pr msLAPS-EncryptedPassword` | Blob encrypted DPAPI-NG | Default modern. |
| `Get-LapsADPassword <host> -AsPlainText` (Win LAPS module) | Decrypt + return cleartext (si tenés perms) | Native modern. |
| `nxc smb <host> -u u -p p --laps` | Auto-detect v1/v2 + decrypt | Quick. |
^ad-lapsv2-encryption

**Caveat decryption:** DPAPI-NG keys derivan de un AD security principal (group o user). Solo principals listados en GPO `EncryptionPrincipal` pueden decrypt. ACL LDAP read != decrypt capability.

___

## LAPSv2 Read & Decrypt

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-LapsADPassword <host>` | Read LAPSv2 (auto-decrypt si possible) | RSAT-friendly. |
| `Get-LapsADPassword <host> -AsPlainText` | Cleartext output | Direct use. |
| `Get-LapsADPassword <host> -IncludeHistory` | + history | Forensics. |
| `Get-LapsADPassword <host> -DSRMPassword` | DSRM pwd (DCs) | DC recovery. |
| `nxc smb <host> -u u -p p --laps` | Auto v1/v2 + decrypt | Linux-friendly. |
| `pyLAPS.py -d corp.local -u u -p pass --action get -c <host>` | Linux read v1 | LAPSv1 only. |
| `LAPSv2-Reader.py` (en desarrollo) | Linux DPAPI-NG decrypt | Edge — modern Linux. |
^ad-lapsv2-read

```powershell
# Win LAPS module read + history
Install-Module Microsoft.LAPS  # si no está
Import-Module LAPS

Get-LapsADPassword DC01 -AsPlainText -IncludeHistory
# Output: ComputerName, Account, Password, PasswordUpdateTime, ExpirationTime
```

```bash
# netexec (auto-detect)
nxc smb hosts.txt -u user -p pass --laps
```

___

## Azure AD Backup Mode

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-LapsAADPassword -DeviceIds <id>` | Read LAPS desde Entra ID | Cloud-joined devices. |
| `az graph query -q "Resources \| where ['type'] == 'microsoft.devices/devices'"` (Azure CLI) | Devices Entra-joined | Cloud inventory. |
| Intune Portal → Devices → `<device>` → Local admin password | GUI | Manual review. |
^ad-lapsv2-azuread

**Cuando:** GPO `BackupDirectory = "Azure AD"`. Useful para Entra-joined devices sin AD on-prem. Atacante con `User.Read.All` + `Device.Read.All` + `LapsAdmin` puede leer.

___

## LAPSv2 ACL & Permissions

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-LapsADExtendedRights -Identity "OU=X,DC=corp,DC=local"` | Quien puede leer LAPSv2 | Per-OU audit. |
| `Set-LapsADComputerSelfPermission -Identity <OU>` | Grant computer self-write (priv) | Setup. |
| `Set-LapsADReadPasswordPermission -Identity <OU> -AllowedPrincipals <Group>` | Grant read (priv) | Hardening. |
| `Set-LapsADResetPasswordPermission -Identity <OU> -AllowedPrincipals <Group>` | Grant reset (priv) | Force rotation. |
| `(Get-Acl "AD:<computer-DN>").Access \| ? ObjectType -in (LAPS GUIDs)` | DACL específica | Detail. |
^ad-lapsv2-acl

**Schema GUIDs LAPSv2:**
- `msLAPS-Password`: `2c5d6c4f-8a35-441f-a04d-7f6b5e6b1f88`
- `msLAPS-EncryptedPassword`: `3a8f3a8f-...` (variable per env, query schema).

```powershell
# Find OUs delegando read a non-Tier 0
Find-LapsADExtendedRights -Identity (Get-ADDomain).DistinguishedName |
  Where { $_.ExtendedRightHolders -notmatch "Domain Admins|Enterprise Admins|SYSTEM" } |
  Select ObjectDN,@{n='Readers';e={$_.ExtendedRightHolders -join '; '}}
```

___

## LAPSv2 GPO Settings

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPRegistryValue -Name <gpo> -Key "HKLM\Software\Microsoft\Windows\CurrentVersion\LAPS\Config"` | Settings LAPSv2 | GPO audit. |
| `Get-GPRegistryValue ... -ValueName "BackupDirectory"` | Target backup (1=Entra ID, 2=AD) | Mode check. |
| `Get-GPRegistryValue ... -ValueName "PasswordComplexity"` | Complexity setting | Audit. |
| `Get-GPRegistryValue ... -ValueName "PasswordLength"` | Min length | Audit. |
| `Get-GPRegistryValue ... -ValueName "PasswordAgeDays"` | Rotation period | Audit. |
| `Get-GPRegistryValue ... -ValueName "ADEncryptionPrincipal"` | Principal con decrypt rights | DPAPI-NG audit. |
| `Get-GPRegistryValue ... -ValueName "ADBackupDSRMPassword"` | DSRM mode (DCs) | Edge. |
^ad-lapsv2-gpo

```powershell
# Audit all LAPS-related GPOs
Get-GPO -All | % {
  $g = $_
  try {
    $cfg = Get-GPRegistryValue -Name $g.DisplayName -Key "HKLM\Software\Microsoft\Windows\CurrentVersion\LAPS\Config" -EA Stop
    if ($cfg) {
      [PSCustomObject]@{
        GPO = $g.DisplayName
        Settings = $cfg | Out-String
      }
    }
  } catch {}
}
```

___

## LAPSv2 Misconfigurations

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `Find-LapsADExtendedRights -Identity (Get-ADDomain).DistinguishedName \| ? ExtendedRightHolders -match "Authenticated Users\|Domain Users\|Everyone"` | Wide read access | **CRITICAL**. |
| `Get-GPRegistryValue ... -ValueName "ADPasswordEncryptionEnabled" \| ? Value -eq 0` | Encryption disabled (cleartext storage) | Audit. |
| `Get-GPRegistryValue ... -ValueName "ADPasswordEncryptionPrincipal" \| ? Value -match "Authenticated Users\|Domain"` | Decrypt principal demasiado amplio | Audit. |
| `Get-ADComputer -Filter * -Pr msLAPS-PasswordExpirationTime \| ? {$_.'msLAPS-PasswordExpirationTime' -lt (Get-Date).ToFileTime() - (90*864000000000)}` | Pwds no rotados >90d | Stale. |
| Computers sin LAPSv1 ni LAPSv2 | Coverage gap | Audit. |
^ad-lapsv2-misconfig

***
