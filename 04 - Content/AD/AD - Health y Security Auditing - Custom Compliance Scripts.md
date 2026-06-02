---
aliases:
  - Custom Compliance Scripts
  - PowerShell AD Audit
  - RSAT compliance
  - AD baseline scripts
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Health y Security Auditing]]"
---
# AD - Health & Security Auditing - Custom Compliance Scripts

---

## Stale accounts

| **Comando** | **Qué obtenés** | **Threshold típico** |
|:---:|:---:|:---:|
| `Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -UsersOnly` | Users inactivos 90d | 90d cleanup. |
| `Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -ComputersOnly` | Computers inactivos | 90d disable. |
| `Search-ADAccount -PasswordNeverExpires -UsersOnly` | Sin expiración | Excepción documentada. |
| `Search-ADAccount -PasswordNotRequired` | Sin password requerido | Crítico. |
| `Search-ADAccount -LockedOut` | Lockeados ahora | Triage. |
| `Get-ADUser -Filter {Enabled -eq $true -and PasswordLastSet -lt (Get-Date).AddYears(-1)}` | Passwords >1 año | Forzar rotación. |
| `Get-ADUser -Filter * -Pr LastLogonDate \| ? { $_.LastLogonDate -lt (Get-Date).AddDays(-180) }` | Last logon >180d | Disable. |
^ad-custom-stale

```powershell
# Cleanup recurrente — disable stale + log
$Stale = Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -UsersOnly -ResultPasswordNeverExpires:$false
$Stale | Disable-ADAccount -WhatIf  # quitar -WhatIf cuando OK
$Stale | Export-Csv "stale-disabled-$(Get-Date -F yyyy-MM-dd).csv" -NoTypeInformation
```

---

## Privileged audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Domain Admins" -Recursive` | DAs efectivos | Audit semanal. |
| `Get-ADGroupMember "Enterprise Admins" -Recursive` | EAs (forest-wide) | Audit semanal. |
| `Get-ADGroupMember "Schema Admins" -Recursive` | Schema (debería estar vacío) | Audit. |
| `Get-ADUser -Filter {AdminCount -eq 1}` | Cuentas con AdminSDHolder | Audit completo. |
| `Get-ADGroup -Filter {AdminCount -eq 1}` | Groups con AdminSDHolder | Audit. |
| `Get-ADObject "CN=AdminSDHolder,CN=System,DC=corp,DC=local" -Pr nTSecurityDescriptor` | DACL del template | Detectar persistence. |
| `(Get-ADGroup "Pre-Windows 2000 Compatible Access" -Pr Members).Members` | Pre-W2K group | Debe estar vacío. |
| `Get-ADGroup "Protected Users" -Pr Members` | Cuentas protegidas | Audit Tier 0. |
^ad-custom-priv

```powershell
# Snapshot priv groups con timestamp
$Priv = "Domain Admins","Enterprise Admins","Schema Admins","Administrators","Account Operators","Backup Operators"
foreach ($g in $Priv) {
    Get-ADGroupMember $g -Recursive |
        Select-Object @{N='Group';E={$g}},SamAccountName,objectClass |
        Export-Csv "priv-$(Get-Date -F yyyy-MM-dd).csv" -Append -NoTypeInformation
}
```

---

## Password policy

| **Comando** | **Qué obtenés** | **Compliance check** |
|:---:|:---:|:---:|
| `Get-ADDefaultDomainPasswordPolicy` | Política default | Min length ≥14. |
| `Get-ADFineGrainedPasswordPolicy -Filter *` | PSOs | Per priv tier. |
| `Get-ADUserResultantPasswordPolicy -Identity user` | Policy efectiva | Por usuario. |
| `Get-ADDomain \| Select PasswordPolicy*,LockoutPolicy*` | Lockout policy | Threshold ≥5. |
^ad-custom-pwpolicy

---

## Kerberos health

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser krbtgt -Pr PasswordLastSet,msDS-KeyVersionNumber` | krbtgt age + KVNO | >180d = reset. |
| `Get-ADDomainController -Filter * \| Select Name,OperatingSystem,IPv4Address` | DCs + OS | Audit OS legacy. |
| `Get-ADUser -Filter {ServicePrincipalName -ne "$null"} -Pr ServicePrincipalName` | SPNs (kerberoastable) | Audit. |
| `Get-ADUser -Filter {AdminCount -eq 1 -and ServicePrincipalName -ne "$null"}` | Priv kerberoastable | Crítico. |
| `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}` | AS-REProastable | Audit. |
| `Get-ADUser -Filter {UseDESKeyOnly -eq $true}` | DES only | Legacy crítico. |
^ad-custom-krb

```powershell
# krbtgt reset (2x con 24h gap)
# Microsoft script: https://github.com/microsoft/New-KrbtgtKeys.ps1
.\New-KrbtgtKeys.ps1 -OperationalMode -Confirm:$false -OneStep
# wait 24h, replication-cycle x2
.\New-KrbtgtKeys.ps1 -OperationalMode -Confirm:$false -OneStep
```

---

## Delegation audit

| **Comando** | **Qué obtenés** | **Riesgo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true}` | Unconstrained | Crítico (no DC). |
| `Get-ADUser -Filter {TrustedForDelegation -eq $true}` | User UD | Crítico. |
| `Get-ADComputer -Filter {TrustedToAuthForDelegation -eq $true} -Pr msDS-AllowedToDelegateTo` | Constrained S4U | Audit. |
| `Get-ADComputer -Filter * -Pr msDS-AllowedToActOnBehalfOfOtherIdentity \| ? {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'}` | RBCD | Audit. |
^ad-custom-deleg

---

## ADCS audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-CertificationAuthority` (PSPKI) | CAs activas | Inventory. |
| `Get-CertificateTemplate \| ? { $_.EnrollmentFlag -match 'IncludeSymmetricAlgorithms' }` | Templates risky | Audit. |
| `certutil -dsTemplate` | Templates desde DS | Audit raw. |
| `certutil -CAInfo` | CA flags (incluye `EDITF_ATTRIBUTESUBJECTALTNAME2`) | ESC6 check. |
| `Get-CertificateTemplate \| Get-CertificateTemplateAcl` | DACLs templates | ESC4 check. |
^ad-custom-adcs

---

## ACL anomalies

| **Comando** | **Qué obtenés** | **Riesgo** |
|:---:|:---:|:---:|
| `Get-ACL "AD:$((Get-ADDomain).DistinguishedName)" \| Select -Expand Access \| ? {$_.IdentityReference -match 'Authenticated Users\|Everyone\|Domain Users'}` | ACEs amplios root | Crítico. |
| `Get-ACL "AD:CN=AdminSDHolder,CN=System,$((Get-ADDomain).DistinguishedName)"` | DACL AdminSDHolder | Persistence check. |
| `Import-Module ActiveDirectoryRights; Get-ADObjectAcl` | DACLs por objeto | Audit. |
^ad-custom-acl

---

## GPO audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPO -All` | Inventory GPOs | Baseline. |
| `Get-GPOReport -All -ReportType Xml -Path C:\audit\gpos.xml` | XML para parseo | Audit. |
| `findstr /S cpassword \\$env:USERDNSDOMAIN\sysvol` | GPP cpassword | MS14-025. |
| `Get-GPO -All \| % { Get-GPPermission -Guid $_.Id -All }` | DACLs per-GPO | ACL audit. |
^ad-custom-gpo

---

## LAPS audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwdExpirationTime \| ? {$_.'ms-Mcs-AdmPwdExpirationTime'}` | LAPSv1 coverage | Coverage check. |
| `Get-ADComputer -Filter * -Pr msLAPS-PasswordExpirationTime \| ? {$_.'msLAPS-PasswordExpirationTime'}` | LAPSv2 coverage | Coverage. |
| `Get-LapsADExtendedRights -Identity "OU=Servers,DC=corp,DC=local"` | Quien puede leer LAPS | Audit ACL. |
^ad-custom-laps

---

## Trust audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * -Pr SIDFilteringForestAware,SIDFilteringQuarantined,TGTDelegation` | Trust attributes | Cross-forest audit. |
| `Get-ADTrust -Filter * \| ? { $_.SIDFilteringQuarantined -eq $false }` | SID Filter off | Crítico. |
| `Get-ADTrust -Filter * \| ? { $_.TGTDelegation -eq $true }` | TGT Delegation on | Crítico (CVE-2019-0683). |
^ad-custom-trust

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| New-KrbtgtKeys.ps1 | `https://github.com/microsoft/New-KrbtgtKeys.ps1` |
| PSPKI module | `https://www.pkisolutions.com/tools/pspki/` |
| ActiveDirectoryRights module | `https://www.powershellgallery.com/packages/ActiveDirectoryRights` |
| AD Module RSAT | Built-in Win10/11 + RSAT feature |
| GPRegistryPolicy | `https://github.com/PowerShell/GPRegistryPolicy` |
^ad-custom-resources

---
