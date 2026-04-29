---
aliases:
  - Non-Default DCSync
  - DCSync Audit
  - Service Accounts DCSync
  - Exchange Legacy DCSync
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
  - "[[AD - DCSync Rights Discovery]]"
---
# AD - DCSync Rights Discovery - Default vs Non-Default Holders

***

## Expected Default Holders

| **Principal** | **Domain** | **Notas** |
|:---:|:---:|:---:|
| Domain Admins (RID 512) | Per-domain | Standard. |
| Enterprise Admins (RID 519) | Forest root only | Standard. |
| Administrators (BUILTIN, RID 544) | Per-domain | Standard. |
| Domain Controllers (RID 516) | Per-domain DC accounts | Standard. |
| Enterprise Read-only Domain Controllers (RID 498) | Forest | Filtered. |
| SYSTEM | Per-DC | Standard. |
| Self (computer self-replication) | DC accounts | Standard. |
| Cross-domain trust DCs | Edge | Adjacent. |
| Cert Publishers (some envs) | NO default | Audit. |
| Pre-Windows 2000 (legacy) | NO default | Audit. |
| Backup Operators | NO default | Audit. |
| Server Operators | NO default | Audit. |
| Account Operators | NO default | Audit. |
| Per-tier custom group | NO default | Audit. |
| Service accounts | NO default | Audit. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-dcsyncdef-defaults

### Default holders verification

```powershell
$expected = @("Domain Admins","Enterprise Admins","Administrators","Domain Controllers",
              "Enterprise Read-only Domain Controllers","SYSTEM")

$dcsyncRights = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
)

Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {$_.AccessControlType -eq "Allow" -and $_.ObjectType -in $dcsyncRights} |
  ForEach-Object {
    $name = $_.IdentityReference.Value -replace ".*\\",""
    if ($expected -notcontains $name) {
      [PSCustomObject]@{
        Principal = $_.IdentityReference
        Right = $_.ObjectType
        Status = "NON-DEFAULT (audit)"
      }
    }
  }
```

___

## Common Misconfigurations (Non-Default)

| **Misconfig** | **Origin** | **Notas** |
|:---:|:---:|:---:|
| Service account with DCSync | Common | Audit. |
| Cert Publishers with DCSync | Legacy ADCS | Audit. |
| Backup Operators with DCSync (rare) | Misconfig | Audit. |
| Custom Tier 0 group | Per-org | Audit. |
| Cross-trust principal | Cross-forest | Critical. |
| Stale ACE (old admin) | Migration leftover | Audit. |
| Disabled user with DCSync | Stale | Audit. |
| Authenticated Users (CRITICAL misconfig) | Anyone in domain DCSync | Critical. |
| Domain Users (CRITICAL) | Same | Critical. |
| Foreign principal | Cross-trust | Critical. |
| Service Principal Account | Edge | Audit. |
| MSA / gMSA with DCSync | Edge | Audit. |
| Application service account | Common abuse target | Audit. |
| Migration leftover | Old delegation | Standard. |
| Per-OU DCSync inheritance | Edge — usually domain-wide | Edge. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-dcsyncdef-misconfigs

### Common misconfig detection

```powershell
$dcsyncHolders = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    )
  }

# Filter for non-tier 0 holders
$dcsyncHolders | Where {
  $_.IdentityReference.Value -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|Domain Controllers|Read-only Domain Controllers"
} | Select IdentityReference,ObjectType
```

___

## Exchange Legacy DCSync (Pre-2019 Patch)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Exchange Trusted Subsystem | Pre-2019 had WriteDACL on domain | Critical legacy. |
| Exchange Windows Permissions | Same | Critical legacy. |
| Exchange Servers | Pre-2019 had DCSync | Patched. |
| CVE-2019-1040 patch | Mitigation | Adjacent. |
| Exchange RBAC split permission model | Modern | Standard. |
| Modern Exchange 2019+ | Hardened | Standard. |
| Hybrid Exchange (on-prem + Online) | Edge | Adjacent. |
| Exchange On-Premises servers Tier 0 | Best practice | Hardening. |
| Detection: Exchange-related ACL changes | Defender | Adjacent. |
| Audit: Exchange group membership | Standard | Compliance. |
| Microsoft KB on Exchange permissions | Reference | Adjacent. |
| ProxyShell / ProxyNotShell adjacent | Exchange RCE | Adjacent. |
| Detection: Exchange anomaly | Defender | Adjacent. |
| Modern: extreme caution | Standard | Hardening. |
| Cross-correlate Exchange with priv | Standard | Audit. |
| Adjacent: Exchange exploitation hub | Cross-ref | Adjacent. |
^ad-dcsyncdef-exchange

### Exchange DCSync audit

```powershell
# Check Exchange group DCSync
$exchangeGroups = @("Exchange Trusted Subsystem","Exchange Windows Permissions","Exchange Servers")

foreach ($g in $exchangeGroups) {
  try {
    $sid = (Get-ADGroup $g -ErrorAction SilentlyContinue).SID.Value
    if ($sid) {
      $hasACE = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
        Select -ExpandProperty Access |
        Where {
          $_.IdentityReference.Value -match "$g" -and
          $_.ObjectType -in @(
            "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
            "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
          )
        }
      if ($hasACE) {
        Write-Warning "$g HAS DCSync rights — patch CVE-2019-1040"
      }
    }
  } catch {}
}
```

___

## Custom Tier 0 Groups with DCSync

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| "Tier0 Admins" custom group | Per-org | Audit. |
| "Domain Replication" custom group | Per-org | Audit. |
| "Backup DCSync" custom | Edge | Audit. |
| Cross-correlate adminCount | Standard | Audit. |
| Custom group + DCSync = Tier 0 marker | Audit | Standard. |
| Stale custom groups | Old delegation | Audit. |
| Service accounts in custom group | Common misconfig | Audit. |
| Recursive nesting | Hidden | Standard. |
| Per-tier model alignment | Standard | Compliance. |
| Documentation: known Tier 0 groups | Standard | Adjacent. |
| BloodHound HighValue tag | Adjacent | Tool. |
| Detection: priv group adds | Defender | Adjacent. |
| Audit: per-custom group review | Standard | Compliance. |
| Modern: minimize custom groups | Best practice | Standard. |
| Cleanup: stale custom groups | Standard | Adjacent. |
| Cross-correlate with ACL chains | Standard | Audit. |
^ad-dcsyncdef-custom

### Custom Tier 0 audit

```powershell
# Find all groups with DCSync rights
$dcsyncGroups = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    )
  } |
  ForEach-Object {
    try {
      $obj = Get-ADObject -LDAPFilter "(|(samAccountName=$($_.IdentityReference -replace '.*\\',''))" -Properties ObjectClass -ErrorAction SilentlyContinue
      if ($obj.ObjectClass -eq "group") { $obj.Name }
    } catch {}
  }

# Recursive expand each group
foreach ($g in $dcsyncGroups) {
  Write-Host "`n=== $g ==="
  Get-ADGroupMember $g -Recursive -ErrorAction SilentlyContinue |
    Select Name,SamAccountName,ObjectClass
}
```

___

## Cross-Trust DCSync

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Foreign principal with DCSync | Cross-trust risk | Critical. |
| Foreign group recursive members | Cross-trust | Critical. |
| Cross-trust trust account with DCSync | Edge | Critical. |
| Inter-forest DCSync | Forest takeover path | Critical. |
| SID Filtering matters | Cross-trust defense | Standard. |
| `iss` validation matters | Cross-trust auth | Adjacent. |
| Modern Microsoft patches | Cross-forest TGT delegation off | Standard. |
| Detection: foreign source IP | Defender | Adjacent. |
| Audit: cross-trust ACL | Standard | Compliance. |
| Stale cross-trust permissions | Audit | Standard. |
| Migration leftover | Common | Audit. |
| BloodHound foreign DCSync paths | Modern | Tool. |
| Cross-correlate with FSP | Standard | Audit. |
| Cleanup: revert cross-trust | Standard | Adjacent. |
| Modern: extreme audit cross-forest | Best practice | Standard. |
| Compliance: documented cross-trust ACE | Standard | Adjacent. |
^ad-dcsyncdef-crosstrust

### Cross-trust DCSync detection

```powershell
$localDomain = (Get-ADDomain).Name

Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    ) -and
    $_.IdentityReference.Value -notmatch "^${localDomain}\\" -and
    $_.IdentityReference.Value -notmatch "^BUILTIN\\" -and
    $_.IdentityReference.Value -notmatch "^NT AUTHORITY"
  } |
  Select IdentityReference,ObjectType
# Output: foreign principals with DCSync (CRITICAL)
```

___

## Stale ACE Detection

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Disabled user with DCSync | Audit | Standard. |
| Deleted account (unresolvable SID) | Direct stale | Standard. |
| Old service account migrated | Stale | Audit. |
| Cross-trust legacy | Migration leftover | Audit. |
| Pre-2019 Exchange | Patched but ACE remains | Audit. |
| Stale Tier 1 groups in DCSync | Old delegation | Audit. |
| `whenChanged` analysis | Age-based | Edge. |
| Compliance: per-quarter stale audit | Standard | Adjacent. |
| Cleanup: remove stale ACEs | Hygiene | Standard. |
| Detection: ACE inactivity (no replication events) | Edge | Defender. |
| Audit log retention | Standard | Adjacent. |
| Modern continuous monitoring | Defender | Standard. |
| Cross-correlate user activity | Standard | Audit. |
| Per-tier stale review | Standard | Compliance. |
| Documentation: ACE lifecycle | Standard | Adjacent. |
| Removal cleanup workflow | Standard | Adjacent. |
^ad-dcsyncdef-stale

### Stale ACE detection

```powershell
$dcsyncACEs = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    )
  }

foreach ($ace in $dcsyncACEs) {
  $sid = $ace.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value
  
  # Try resolve to AD object
  try {
    $obj = Get-ADObject -Filter {ObjectSid -eq $sid} -Properties Enabled,LastLogonDate
    if (-not $obj) {
      Write-Host "STALE: $($ace.IdentityReference) (object deleted)"
    } elseif ($obj.Enabled -eq $false) {
      Write-Host "STALE: $($obj.Name) (disabled)"
    }
  } catch {
    Write-Host "STALE: $sid (unresolvable)"
  }
}
```

___

## Continuous Audit & Detection

| **Strategy** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Per-quarter manual audit | Standard | Compliance. |
| Microsoft Defender for Identity | Continuous | Modern. |
| BloodHound CE 6.x continuous | Modern | Tool. |
| PingCastle scheduled | Defender | Standard. |
| Purple Knight scheduled | Defender | Standard. |
| Custom audit cron | Operational | Standard. |
| Detection: domain root ACL modify | Critical alert | Defender. |
| Detection: replication anomaly | Defender ML | Modern. |
| Source IP audit | DC-only whitelist | Standard. |
| Honeypot accounts: alert on read | Defender plant | Detection. |
| krbtgt access alert | Critical | Defender. |
| Compliance: documented baseline | Standard | Adjacent. |
| Per-quarter compliance report | Standard | Adjacent. |
| Modern: extreme alerting | Critical | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| Audit log retention | Standard | Adjacent. |
^ad-dcsyncdef-continuous

### Audit baseline script

```powershell
function Audit-DCSyncRights {
  $expectedDefaults = @(
    "Domain Admins","Enterprise Admins","Administrators",
    "Domain Controllers","Enterprise Read-only Domain Controllers","SYSTEM"
  )
  
  $dcsyncRights = @(
    "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
    "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
  )
  
  $report = @()
  
  Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
    Select -ExpandProperty Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.ObjectType -in $dcsyncRights
    } |
    ForEach-Object {
      $name = $_.IdentityReference.Value -replace ".*\\",""
      $isDefault = $expectedDefaults -contains $name
      
      $report += [PSCustomObject]@{
        Principal = $_.IdentityReference
        Right = $_.ObjectType
        IsDefault = $isDefault
        Status = if ($isDefault) {"OK"} else {"AUDIT"}
      }
    }
  
  return $report
}

Audit-DCSyncRights | Format-Table -AutoSize
```

***
