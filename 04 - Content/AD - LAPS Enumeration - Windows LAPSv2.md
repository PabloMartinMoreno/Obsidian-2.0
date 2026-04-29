---
aliases:
  - LAPSv2
  - msLAPS-Password
  - Windows LAPS
  - msLAPS-EncryptedPassword
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - LAPS Enumeration]]"
---
# AD - LAPS Enumeration - Windows LAPSv2 (Modern)

***

## LAPSv2 Architecture

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `msLAPS-Password` | Cleartext password | Direct (if not encrypted). |
| `msLAPS-EncryptedPassword` | Encrypted password (binary blob) | Modern hardening. |
| `msLAPS-PasswordExpirationTime` | FILETIME expiration | Adjacent. |
| `msLAPS-EncryptedPasswordHistory` | Password history (encrypted) | Adjacent. |
| `msLAPS-EncryptedDSRMPassword` | DSRM password (encrypted) | Edge — DSRM management. |
| `msLAPS-EncryptedDSRMPasswordHistory` | DSRM history | Edge. |
| Per-computer attributes | Standard | Standard. |
| Stored on Computer object | LDAP location | Standard. |
| Native Server 2022+ / Win 11 22H2+ | No extra install | Standard. |
| Windows LAPS via Windows Update | Modern | Standard. |
| Schema extension: built-in modern | Server 2022+ | Standard. |
| Schema extension: manual `Update-LapsADSchema` | Older systems | Edge. |
| GPO ADMX template | LAPSv2-specific | Standard. |
| Backup: AD or Azure AD | Configurable | Modern feature. |
| Encryption: per-principal SID | Specific principal can decrypt | Hardening. |
| Default: cleartext (msLAPS-Password) | If not configured to encrypt | Standard. |
| Modern best: encrypted always | Hardening | Best practice. |
^ad-lapsv2-arch

### LAPSv2 schema check

```powershell
# Modern LAPS attributes
$schemaPath = "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)"

Get-ADObject -SearchBase $schemaPath -Filter "Name -like 'msLAPS-*'" |
  Select Name,DistinguishedName

# Expected modern attributes:
# msLAPS-Password
# msLAPS-EncryptedPassword
# msLAPS-PasswordExpirationTime
# msLAPS-EncryptedPasswordHistory
# msLAPS-EncryptedDSRMPassword
# msLAPS-EncryptedDSRMPasswordHistory
```

___

## Cleartext vs Encrypted LAPSv2

| **Mode** | **Attribute** | **Notas** |
|:---:|:---:|:---:|
| Cleartext | `msLAPS-Password` only | Default — same as LAPSv1. |
| Encrypted | `msLAPS-EncryptedPassword` only | Modern hardening. |
| Mixed | Both attrs (transition) | Edge. |
| GPO setting "Password Encryption Principal" | Specifies decryptor | Modern. |
| Default principal: Domain Admins | Standard | Standard. |
| Custom principal | Per-OU configurable | Standard. |
| Encryption: AES with derived key | Crypto | Standard. |
| Decryption requires principal access | Group membership | Standard. |
| `Get-LapsADPassword` decrypts auto | Native PowerShell | Standard. |
| Atacante reads encrypted blob | Useless without key | Standard. |
| Atacante in encryption principal group | Can decrypt | Privilege path. |
| Per-OU different principals | Granular | Standard. |
| Audit: who can decrypt | Compliance | Standard. |
| Detection: bulk LAPS read events | Defender | Adjacent. |
| Cleartext LAPSv2 = back to LAPSv1 risk | Audit | Audit. |
| Modern best: always encrypted | Hardening | Standard. |
^ad-lapsv2-encryption

### LAPSv2 encryption mode detection

```powershell
# Find computers using cleartext LAPSv2 (msLAPS-Password)
Get-ADComputer -Filter * -Properties msLAPS-Password,msLAPS-EncryptedPassword |
  Where {$_.'msLAPS-Password'} |
  Select Name,@{n='Cleartext';e={$_.'msLAPS-Password' -ne $null}}

# Find computers using encrypted LAPSv2 (msLAPS-EncryptedPassword)
Get-ADComputer -Filter * -Properties msLAPS-EncryptedPassword |
  Where {$_.'msLAPS-EncryptedPassword'} |
  Select Name,@{n='Encrypted';e={$_.'msLAPS-EncryptedPassword' -ne $null}}

# Mode summary
$total = Get-ADComputer -Filter * -Properties msLAPS-Password,msLAPS-EncryptedPassword
$cleartext = ($total | Where 'msLAPS-Password').Count
$encrypted = ($total | Where 'msLAPS-EncryptedPassword').Count
Write-Host "Cleartext LAPSv2: $cleartext"
Write-Host "Encrypted LAPSv2: $encrypted"
```

___

## LAPSv2 Read & Decrypt

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-LapsADPassword -Identity host` | Native PowerShell decrypt | Standard. |
| `Get-LapsADPassword -Identity host -AsPlainText` | Cleartext output | Standard. |
| `Get-LapsADPassword -Identity host -Domain dom` | Cross-domain | Adjacent. |
| `Get-LapsADPassword -Identity host -DomainController DC` | Specific DC | Adjacent. |
| Native module: `WindowsLAPS.PS` | Auto-installed Server 2022+ | Standard. |
| Decrypts automatically if authorized | Standard | Standard. |
| Atacante non-authorized: encrypted blob useless | Standard | Standard. |
| Bulk read | iterate all computers | Standard. |
| netexec LAPSv2 support | `nxc smb hosts -u u -p p --laps` | Standard. |
| BloodHound `ReadLAPSPassword` edge | Modern collection | Tool. |
| `LapsToolkit` (community) | Helper | Adjacent. |
| Per-host decrypt audit | Standard | Standard. |
| Decryption logging (defender) | Modern | Adjacent. |
| Detection: bulk decrypt events | Defender SIEM | Adjacent. |
| Cross-correlate with priv | Decryptors in priv groups | Audit. |
| Hidden encrypted password (no decryption) | Atacante read fails | Standard. |
^ad-lapsv2-read

### LAPSv2 decrypt

```powershell
# Native PowerShell (Windows LAPS)
Get-LapsADPassword -Identity WS01

# Output:
# ComputerName : WS01
# DistinguishedName : CN=WS01,CN=Computers,DC=dom,DC=local
# Account : Administrator
# Password : System.Security.SecureString
# PasswordUpdateTime : 2024-01-15 03:45:23
# ExpirationTimestamp : 2024-02-14 03:45:23
# Source : EncryptedPassword

# Cleartext output
(Get-LapsADPassword -Identity WS01 -AsPlainText).Password

# Bulk all computers
Get-ADComputer -Filter * | ForEach-Object {
  try {
    $pwd = Get-LapsADPassword -Identity $_ -AsPlainText -ErrorAction SilentlyContinue
    if ($pwd) {
      [PSCustomObject]@{
        Computer = $_.Name
        Password = $pwd.Password
        Source = $pwd.Source
      }
    }
  } catch {}
}
```

```bash
# netexec
nxc smb hosts.txt -u user -p pass --laps

# Modern netexec supports both LAPSv1 + LAPSv2 read
```

___

## Azure AD Backup Mode

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| LAPSv2 supports Azure AD backup | Modern feature | Standard. |
| Hybrid identity | Azure AD Connect | Adjacent. |
| Cloud-only Azure AD joined devices | No on-prem AD | Edge. |
| Per-device Azure AD backup | Configurable | Standard. |
| Read via Microsoft Graph API | Azure AD admin | Modern. |
| `Get-LapsAADPassword` cmdlet | Modern | Adjacent. |
| Roles required | Cloud Device Admin or Intune Admin | Adjacent. |
| Atacante with Azure AD compromise | Cross-cloud read | Edge. |
| BloodHound Azure AD support | AzureHound | Tool. |
| Audit: cloud-stored LAPS passwords | Compliance | Standard. |
| Detection: Microsoft Graph audit logs | Modern | Defender. |
| Hybrid hub: AD Connect impacts | Edge | Adjacent. |
| Modern enterprise: hybrid LAPS | Standard | Adjacent. |
| Cross-tenant edge | Edge | Edge. |
| GDAP cross-tenant access | Edge | Edge. |
| Azure AD specific tooling | AzureHound, ROADtools | Adjacent. |
^ad-lapsv2-azuread

### Azure AD LAPS query

```powershell
# Azure AD LAPS module
Connect-AzureAD

# Read LAPSv2 from Azure AD
Get-LapsAADPassword -DeviceIds <device-id> -IncludePasswords

# Or via Graph
$token = Get-MsalToken -ClientId <id> -Scopes "DeviceLocalCredential.Read.All"
Invoke-RestMethod -Uri "https://graph.microsoft.com/beta/directory/deviceLocalCredentials/<device-id>" -Headers @{Authorization="Bearer $($token.AccessToken)"}
```

___

## LAPSv2 ACL & Permissions

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| Per-computer DACL | Standard | Standard. |
| `msLAPS-Password` ACL | Cleartext read | Granular. |
| `msLAPS-EncryptedPassword` ACL | Read encrypted blob | Adjacent. |
| Encryption principal SID | Decrypts encrypted | Modern. |
| `Find-LapsADExtendedRights` | Native helper | Standard. |
| Per-OU LAPS readers audit | Standard | Standard. |
| Default Confidential flag | Modern default | Hardening. |
| `searchFlags & 128 = set` | Confidential | Standard. |
| Cross-correlate ACL with encryption principal | Critical audit | Standard. |
| Atacante in group + encryption principal | Decryption viable | Critical. |
| Audit: minimal LAPS readers | Best practice | Standard. |
| Detection: ACL modify on LAPS attrs | Defender | Adjacent. |
| BloodHound `ReadLAPSPassword` edge | Visual | Tool. |
| Cross-correlate with priv | LAPS readers in priv groups | Audit. |
| Modern: per-principal encryption | Granular hardening | Best practice. |
| Tier 0 admins decrypt everything | Standard | Standard. |
^ad-lapsv2-acl

### LAPSv2 ACL audit

```powershell
# Native LAPSv2 helper
Find-LapsADExtendedRights -Identity "OU=Workstations,DC=dom,DC=local"

# Manual ACL audit
$ou = "OU=Workstations,DC=dom,DC=local"

Get-ADComputer -SearchBase $ou -Filter * | ForEach-Object {
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  $readers = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "ReadProperty|GenericAll|AllExtendedRights")
  }
  [PSCustomObject]@{
    Computer = $_.Name
    Readers = ($readers.IdentityReference | Sort -Unique) -join '; '
  }
}
```

___

## LAPSv2 GPO Settings

| **Setting** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Backup directory | AD or Azure AD | Choice. |
| Password encryption principal | SID for decryption | Critical. |
| Password complexity | Length, char types | Standard. |
| Password length | Default 14 modern | Standard. |
| Password age | Default 30 days | Standard. |
| Post-authentication actions | Reset on use, etc. | Modern feature. |
| Allow encryption when password is decrypted | Edge | Edge. |
| Account name | RID 500 or custom | Standard. |
| Custom local account | Per-org policy | Edge. |
| Backup DSRM password | Edge — DC management | Edge. |
| Encrypted password history | Modern feature | Standard. |
| Per-OU policy variation | Granular | Standard. |
| Detection: GPO LAPS modify events | Defender | Adjacent. |
| Compliance: encrypted always | Best practice | Standard. |
| Audit: backup destination per OU | Standard | Adjacent. |
| Audit: encryption principal Tier 0 | Standard | Hardening. |
^ad-lapsv2-gpo

### LAPSv2 GPO recon

```powershell
# Find LAPSv2 GPOs
Get-GPO -All | Where {$_.DisplayName -match "LAPS|Local Admin"} |
  ForEach-Object {
    $gpo = $_
    $report = Get-GPOReport -Guid $gpo.Id -ReportType XML
    [PSCustomObject]@{
      DisplayName = $gpo.DisplayName
      Id = $gpo.Id
      LinkedOUs = (Select-Xml -Content $report -XPath "//LinksTo/SOMPath" |
                   ForEach-Object { $_.Node.InnerText }) -join '; '
    }
  }
```

___

## LAPSv2 Misconfigurations

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Cleartext mode (no encryption) | Same as LAPSv1 risk | Audit. |
| Encryption principal too broad | Many can decrypt | Risk. |
| Encryption principal = Authenticated Users | Critical misconfig | Critical. |
| Confidential flag not set | Authenticated Users may read | Critical. |
| Per-OU GPO gap | Coverage holes | Audit. |
| Domain Controllers OU has LAPS | Edge — usually excluded | Audit. |
| Migration leftover LAPSv1 | Mixed mode | Edge. |
| Password complexity disabled | Common dictionary | Audit. |
| Short min length | <14 modern | Audit. |
| Long max age (>90 days) | Stale passwords | Audit. |
| Backup destination not set | Edge | Edge. |
| Custom account weak permissions | Edge | Edge. |
| BackupOperators / ServerOperators in encryption principal | Tier 0 conflation | Audit. |
| Cross-OU broad read | Indirect | Audit. |
| Detection: LAPSv2 GPO change events | Defender | Adjacent. |
| Compliance: encryption always | Best practice | Standard. |
^ad-lapsv2-misconfig

### LAPSv2 misconfig audit

```powershell
# Confidential flag check
$msLAPSPwd = Get-ADObject -SearchBase "CN=Schema,..." `
  -Filter "Name -eq 'msLAPS-Password'" -Properties searchFlags

if (($msLAPSPwd.searchFlags -band 128) -eq 0) {
  Write-Warning "msLAPS-Password Confidential flag NOT set"
}

# Find computers using cleartext LAPSv2 (no encryption)
$cleartextHosts = Get-ADComputer -Filter * `
  -Properties msLAPS-Password,msLAPS-EncryptedPassword |
  Where {$_.'msLAPS-Password' -and -not $_.'msLAPS-EncryptedPassword'}

if ($cleartextHosts) {
  Write-Warning "$($cleartextHosts.Count) computers using LAPSv2 cleartext (no encryption)"
}

# Find LAPS-set computers in DC OU (should be excluded)
Get-ADComputer -SearchBase "OU=Domain Controllers,DC=dom,DC=local" -Filter * `
  -Properties msLAPS-Password,msLAPS-EncryptedPassword,ms-Mcs-AdmPwd |
  Where {$_.'msLAPS-Password' -or $_.'msLAPS-EncryptedPassword' -or $_.'ms-Mcs-AdmPwd'} |
  Select Name,DNSHostName
```

***
