---
aliases:
  - PSO
  - Fine-Grained Password Policy
  - msDS-PasswordSettings
  - Password Settings Container
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
  - "[[AD - Password Policy Enumeration]]"
---
# AD - Password Policy Enumeration - Fine-Grained Password Policies (PSO)

***

## PSO Overview

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| PSO = Password Settings Object | Per-user/group policy | Modern. |
| Introduced Server 2008 | Domain functional level required | Standard. |
| Container DN | `CN=Password Settings Container,CN=System,DC=...` | Storage. |
| Object class | `msDS-PasswordSettings` | LDAP. |
| Per-PSO precedence | Lower number wins | Standard. |
| Multiple PSOs per user | Conflict resolved by precedence | Standard. |
| Group-based or user-based | Granular | Flexible. |
| Override default domain policy | Per-target | Standard. |
| Required Domain Functional Level | 2008+ | Edge. |
| AD CS / ADFS not affected | Only AD passwords | Adjacent. |
| `msDS-PSOApplied` on user | Reverse-link to PSO | Standard. |
| `Get-ADFineGrainedPasswordPolicy` | RSAT | Standard. |
| `Get-ADUserResultantPasswordPolicy` | Effective policy | Standard. |
| Authenticated read default | Standard | Standard. |
| BloodHound PSO awareness | Modern | Tool. |
| Audit per-PSO weakness | Risk indicator | Standard. |
^ad-pso-overview

### PSO discovery

```powershell
# All PSOs
Get-ADFineGrainedPasswordPolicy -Filter * | Select Name,Precedence,AppliesTo

# Specific PSO detail
Get-ADFineGrainedPasswordPolicy -Identity "Tier0_PSO" -Properties *
```

```bash
# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Password Settings Container,CN=System,DC=dom,DC=local" \
  -s onelevel \
  "(objectClass=msDS-PasswordSettings)" \
  cn msDS-PasswordSettingsPrecedence msDS-PSOAppliesTo \
  msDS-MinimumPasswordLength msDS-PasswordHistoryLength \
  msDS-LockoutThreshold msDS-LockoutDuration \
  msDS-MaximumPasswordAge msDS-MinimumPasswordAge \
  msDS-PasswordComplexityEnabled msDS-PasswordReversibleEncryptionEnabled
```

___

## PSO Critical Attributes

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `msDS-PasswordSettingsPrecedence` | Lower = wins on conflict | Critical. |
| `msDS-PSOAppliesTo` | DNs of users/groups | Scope. |
| `msDS-MinimumPasswordLength` | Min length | Direct. |
| `msDS-PasswordHistoryLength` | History count | Direct. |
| `msDS-LockoutThreshold` | Failed attempts | Direct. |
| `msDS-LockoutDuration` | FILETIME ticks negative | Decode. |
| `msDS-LockoutObservationWindow` | Reset window | Adjacent. |
| `msDS-MaximumPasswordAge` | Max age (FILETIME) | Decode. |
| `msDS-MinimumPasswordAge` | Min age (FILETIME) | Decode. |
| `msDS-PasswordComplexityEnabled` | Boolean | Standard. |
| `msDS-PasswordReversibleEncryptionEnabled` | Boolean — vuln if true | Critical. |
| `objectGUID` | Unique ID | Standard. |
| `whenCreated` | Audit | Adjacent. |
| `whenChanged` | Modification audit | Adjacent. |
| `description` | Free-text | Audit. |
| ACL on PSO object | Read controls | Granular. |
^ad-pso-attrs

### PSO detail audit

```powershell
# All PSO settings
Get-ADFineGrainedPasswordPolicy -Filter * -Properties * |
  Select Name,Precedence,
    @{n='Subjects';e={$_.AppliesTo -join '; '}},
    MinPasswordLength,
    LockoutThreshold,
    LockoutDuration,
    LockoutObservationWindow,
    PasswordHistoryCount,
    MaxPasswordAge,
    MinPasswordAge,
    ComplexityEnabled,
    ReversibleEncryptionEnabled
```

```bash
# Per-PSO deep query
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Tier0_PSO,CN=Password Settings Container,CN=System,DC=dom,DC=local" \
  -s base "(objectClass=*)" "*"
```

___

## PSO Scope (msDS-PSOAppliesTo)

| **Pattern** | **Scope** | **Notas** |
|:---:|:---:|:---:|
| Group DN | All members + nested | Standard. |
| User DN | Single user | Standard. |
| Multiple values | Comma-separated DNs | Standard. |
| Tier 0 group PSO | Strict (DA, EA, etc.) | Standard. |
| Service Account group PSO | Often laxer | Audit. |
| Privileged group with weak PSO | Critical risk | Detection. |
| Empty `msDS-PSOAppliesTo` | PSO not applied to anyone | Edge. |
| `msDS-PSOApplied` on user | Reverse direction | Standard. |
| Per-user PSO via direct DN | Standard | Granular. |
| Nested groups expansion | Recursive | Standard. |
| Cross-domain not supported | Per-domain | Standard. |
| BloodHound PSO support | Modern | Tool. |
| Default scope: Tier 0 typically | Best practice | Standard. |
| Service accounts often in laxer PSO | Common practice | Audit. |
| Custom HR/Finance PSO | Per-business unit | Common. |
| Find weakest PSO | Spray candidate | Strategy. |
^ad-pso-scope

### Scope analysis

```powershell
# Per-PSO subjects
Get-ADFineGrainedPasswordPolicy -Filter * | ForEach-Object {
  $pso = $_
  Write-Host "`n=== $($pso.Name) (Precedence: $($pso.Precedence)) ==="
  Write-Host "MinLen: $($pso.MinPasswordLength), Lockout: $($pso.LockoutThreshold), Complexity: $($pso.ComplexityEnabled)"
  Write-Host "Applies to:"
  Get-ADFineGrainedPasswordPolicySubject -Identity $pso |
    Select Name,SamAccountName,ObjectClass
}
```

___

## Resultant Password Policy (Per-User Effective)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADUserResultantPasswordPolicy` | Effective policy for user | Standard. |
| Resolution algorithm | Lowest precedence PSO wins | Standard. |
| If no PSO applies | Default Domain Policy | Fallback. |
| `msDS-PSOApplied` on user | Reverse reference | LDAP. |
| Direct user PSO | Higher precedence than group | Standard. |
| Multiple group PSOs | Lowest precedence wins | Standard. |
| Tier 0 expected: strictest PSO | Best practice | Standard. |
| Spray strategy: target weakest PSO subject | Per-user PSO | Strategy. |
| Service account PSO often laxer | Common audit finding | Audit. |
| Per-user query | Specific user | Standard. |
| Forest-wide cross-domain not supported | Per-domain | Standard. |
| BloodHound PSO edges | Modern collection | Tool. |
| Audit: every privileged user has strict PSO | Compliance | Standard. |
| Detection: PSO modify event | Defender | Adjacent. |
| Read permission: authenticated default | Standard | Standard. |
| Hardening: restrict read of PSO | Edge | Defense. |
^ad-pso-resultant

### Per-user effective policy

```powershell
# Specific user
Get-ADUserResultantPasswordPolicy -Identity jsmith |
  Select Name,Precedence,MinPasswordLength,LockoutThreshold,ComplexityEnabled

# All privileged users + their effective policy
$priv = Get-ADUser -Filter {AdminCount -eq 1}
foreach ($u in $priv) {
  $pol = Get-ADUserResultantPasswordPolicy -Identity $u -ErrorAction SilentlyContinue
  if ($pol) {
    [PSCustomObject]@{
      User = $u.SamAccountName
      AppliedPSO = $pol.Name
      MinLen = $pol.MinPasswordLength
      Lockout = $pol.LockoutThreshold
      Complexity = $pol.ComplexityEnabled
    }
  } else {
    [PSCustomObject]@{
      User = $u.SamAccountName
      AppliedPSO = "DEFAULT (no PSO)"
    }
  }
}
```

___

## PSO Misconfigurations

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Service account PSO with min length 6 | Spray-friendly | Critical. |
| Tier 0 PSO weak | Direct privesc spray | Critical. |
| ReversibleEncryption enabled in PSO | DCSync recovers cleartext | Critical. |
| Lockout disabled in PSO | Free brute force | Critical. |
| Lockout threshold = 0 (no lockout) | Same | Critical. |
| Complexity disabled | Common dictionary words | Audit. |
| Long max age (e.g., 999 days) | Stale passwords | Audit. |
| Empty subjects (orphaned PSO) | Edge | Edge. |
| Multiple overlapping PSOs | Confusing precedence | Audit. |
| User in multiple groups with conflicting PSOs | Lowest precedence wins | Standard. |
| PSO on Authenticated Users (overly broad) | Edge misconfig | Audit. |
| PSO ACL too permissive | Anyone can read | Adjacent. |
| Hidden PSOs (ACL deny) | Edge | Detection. |
| Detection: PSO modify events | Defender | Adjacent. |
| Audit: weakest PSO vs Tier 0 | Compliance | Standard. |
| Audit: legacy PSOs from migrations | Standard | Audit. |
^ad-pso-misconfig

### PSO weakness detection

```powershell
# Find weak PSOs (vulnerable settings)
Get-ADFineGrainedPasswordPolicy -Filter * | ForEach-Object {
  $weak = @()
  if ($_.MinPasswordLength -lt 8) { $weak += "MIN_LENGTH<8" }
  if (-not $_.ComplexityEnabled) { $weak += "COMPLEXITY_OFF" }
  if ($_.ReversibleEncryptionEnabled) { $weak += "REVERSIBLE_ENC" }
  if ($_.LockoutThreshold -eq 0) { $weak += "NO_LOCKOUT" }
  if ($_.LockoutThreshold -gt 50) { $weak += "HIGH_LOCKOUT_THRESHOLD" }
  
  if ($weak) {
    [PSCustomObject]@{
      PSO = $_.Name
      Precedence = $_.Precedence
      Weaknesses = $weak -join ', '
      MinLength = $_.MinPasswordLength
      Lockout = $_.LockoutThreshold
      Complexity = $_.ComplexityEnabled
    }
  }
}
```

___

## PSO Read Permission ACL

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Default read: Authenticated Users | Standard | Permissive. |
| `Read msDS-PasswordSettings` ACL | Per-PSO control | Granular. |
| Hidden PSOs via ACL deny | Edge | Detection. |
| Modify PSO requires write permission | Privileged | Standard. |
| Per-PSO ACL audit | Standard | Defender. |
| `Get-Acl "AD:CN=Tier0_PSO,..."` | RSAT | Standard. |
| `dsacls` on PSO | Native | Adjacent. |
| BloodHound PSO ACL edges | Modern | Tool. |
| Authenticated Users read = standard | Default | Common. |
| Restrict to specific groups | Hardening | Defense. |
| Per-user read for own PSO | Standard | Standard. |
| Cross-domain PSO read | Edge | Adjacent. |
| Detection: ACL modify on PSO | Defender | Adjacent. |
| Modify ACL = privesc adjacent | ACL Abuse hub | Adjacent. |
| Hidden PSOs = audit findings | Compliance | Standard. |
| Backup of PSO config | Standard | Adjacent. |
^ad-pso-acl

### PSO ACL audit

```powershell
# Per-PSO DACL
Get-ADFineGrainedPasswordPolicy -Filter * | ForEach-Object {
  $dn = $_.DistinguishedName
  Write-Host "`n=== $($_.Name) ==="
  Get-Acl "AD:$dn" |
    Select -ExpandProperty Access |
    Where {$_.AccessControlType -eq "Allow"} |
    Select IdentityReference,ActiveDirectoryRights |
    Where IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins"
}
```

___

## Anonymous PSO Discovery (Limited)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Anonymous LDAP read of PSOs | Often blocked | Edge. |
| RPC `getdompwinfo` shows DEFAULT only | Not PSO | Standard. |
| Authenticated read typical | Standard | Standard. |
| `nxc ldap DC -u '' -p ''` PSO query | Limited | Edge. |
| Modern Server 2019+ | Anonymous typically blocked | Hardened. |
| Legacy: anonymous LDAP often allowed | Audit | Edge. |
| Cross-trust PSO read | Edge | Adjacent. |
| Forest-wide PSO query via GC | Edge | Edge. |
| BloodHound passive discovery | Authenticated required | Tool. |
| Manual pattern matching from kerbrute | Indirect inference | OPSEC win. |
| Lockout test = infer PSO via spray response | Indirect | Edge. |
| Spray pacing based on observed lockout | Per-user response | Strategy. |
| Detection: PSO read events | Defender | Adjacent. |
| Audit: ACL allows anonymous | Critical risk | Defender. |
| Pre-auth based inference | Limited info | Edge. |
| Bulk-based timing inference | Edge OPSEC | Edge. |
^ad-pso-anonymous

### Anonymous PSO probe

```bash
# Try anonymous LDAP for PSO container
ldapsearch -x -h DC \
  -b "CN=Password Settings Container,CN=System,DC=dom,DC=local" \
  -s onelevel \
  "(objectClass=msDS-PasswordSettings)" \
  cn

# Usually returns "Operations error" (auth required)
# If returns data → anonymous misconfig (rare)

# Authenticated baseline
nxc ldap DC -u user -p pass --query "(objectClass=msDS-PasswordSettings)" "*"
```

***
