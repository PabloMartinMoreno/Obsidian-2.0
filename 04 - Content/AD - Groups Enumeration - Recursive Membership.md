---
aliases:
  - Nested Groups
  - tokenGroups
  - Recursive Group Member
  - Group Expansion
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
  - "[[AD - Groups Enumeration]]"
---
# AD - Groups Enumeration - Recursive Membership

***

## Direct vs Recursive Membership

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Direct membership | `member` attribute | Standard. |
| Direct via memberOf | Reverse-link | Adjacent. |
| Recursive (transitive) | Nested → flattened | Privilege analysis. |
| `tokenGroups` (computed) | Transitive groups | Read-only. |
| `tokenGroupsGlobalAndUniversal` | All transitive forest-wide | Read-only. |
| `Get-ADGroupMember -Recursive` | RSAT recursive | Standard. |
| `Get-NetGroupMember -Recurse` (PowerView) | Adversary | Same. |
| `Get-DomainGroupMember -Recurse` (PowerView v3) | Adjacent | Standard. |
| LDAP recursive filter | `:1.2.840.113556.1.4.1941:=` | OID. |
| Token expansion at logon | Standard Kerberos | Standard. |
| Token bloat issue | Many SIDs slow logon | Performance. |
| Bouncing token check | Per-resource | Adjacent. |
| `whoami /groups` | Local effective | Per-user. |
| Cross-domain recursive | Universal groups required | Adjacent. |
| Cross-trust recursive | Forest trust + transitive | Edge. |
| Detection: bulk recursive query | Defender SIEM | Adjacent. |
^ad-recursive-direct

### Recursive query examples

```powershell
# RSAT recursive
Get-ADGroupMember "Domain Admins" -Recursive | Select Name,SamAccountName,ObjectClass

# tokenGroups (computed) — needs specific user
Get-ADUser jsmith -Properties tokenGroups | 
  Select -ExpandProperty tokenGroups |
  ForEach-Object {(New-Object System.Security.Principal.SecurityIdentifier($_)).Translate([System.Security.Principal.NTAccount])}

# tokenGroupsGlobalAndUniversal (cross-domain)
Get-ADUser jsmith -Properties tokenGroupsGlobalAndUniversal |
  Select -ExpandProperty tokenGroupsGlobalAndUniversal
```

```bash
# LDAP recursive filter (OID 1.2.840.113556.1.4.1941)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(memberOf:1.2.840.113556.1.4.1941:=CN=Domain Admins,CN=Users,DC=dom,DC=local)" \
  samAccountName
```

___

## Nested Group Patterns

| **Pattern** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Tier 0 contains Tier 1 contains Tier 2 | Standard tiering | Hardening pattern. |
| Privileged group via 3+ nesting levels | Hidden privilege | Audit risk. |
| Cross-domain via Universal groups | Forest-wide membership | Standard. |
| Distribution group as member | Edge — invalid for security | Edge. |
| Circular nesting | A→B→A | Detect with cycle. |
| Self-membership (rare) | Edge | Edge. |
| Foreign Security Principal in chain | Cross-trust | Adjacent. |
| Computer in security group | Edge — usually OK | Standard. |
| User as primary group of another | `primaryGroupID` | Edge. |
| Service account in admin chain | Common audit finding | Critical. |
| Stale users in nested admin chain | Old privilege | Audit. |
| Recursive admin discovery | BloodHound | Visual. |
| Empty nested groups | Nested but no members | Audit. |
| GPO-linked groups recursive | GPO inheritance | Adjacent. |
| ACL on group object | Adjacent | Adjacent. |
| Cross-OU privileged | OU + group + recursive | Comprehensive. |
^ad-recursive-patterns

### Nested chain analysis

```powershell
# Find all groups containing user (recursive up)
function Get-RecursiveGroupMembership {
  param([string]$User)
  $direct = Get-ADUser $User -Properties MemberOf | Select -ExpandProperty MemberOf
  $all = New-Object System.Collections.Generic.HashSet[string]
  $queue = New-Object System.Collections.Generic.Queue[string]
  
  $direct | ForEach-Object { $queue.Enqueue($_); [void]$all.Add($_) }
  
  while ($queue.Count -gt 0) {
    $group = $queue.Dequeue()
    $parents = (Get-ADGroup $group -Properties MemberOf).MemberOf
    foreach ($p in $parents) {
      if ($all.Add($p)) { $queue.Enqueue($p) }
    }
  }
  return $all
}

Get-RecursiveGroupMembership -User "jsmith"
```

```bash
# LDAP recursive parent groups (memberOf chain)
ldapsearch -h DC -D 'dom\u' -w pass -b "CN=jsmith,CN=Users,DC=dom,DC=local" \
  -s base "(objectClass=*)" \
  "memberOf;range=0-*"

# All groups recursively containing user
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(member:1.2.840.113556.1.4.1941:=CN=jsmith,CN=Users,DC=dom,DC=local)" \
  cn distinguishedName
```

___

## Foreign Security Principals (FSP)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| FSP container | `CN=ForeignSecurityPrincipals,DC=dom,DC=local` | Standard. |
| Stored as objects with foreign SID | Cross-trust | Standard. |
| `objectClass=foreignSecurityPrincipal` | Class | Direct. |
| Foreign user in local group | Creates FSP entry | Standard. |
| Foreign group nested in local | Creates FSP entry | Standard. |
| FSP DN = foreign SID | `CN=S-1-5-21-...,CN=ForeignSecurityPrincipals,...` | Standard. |
| Resolve FSP SID via cross-trust LDAP | Adjacent | Standard. |
| Resolve via .NET Translate | Local resolution | Standard. |
| Find-ForeignUser (PowerView) | Foreign users in local groups | Adversary. |
| Find-ForeignGroup (PowerView) | Foreign groups | Same. |
| Cross-trust audit | Cross-forest | Standard. |
| Bidirectional trust = bidirectional FSP | Standard | Standard. |
| External trust limits FSP | Specific scope | Edge. |
| Authenticated Users SID = S-1-5-11 | Always present | Standard. |
| NT AUTHORITY\\* SIDs | System-built-in | Standard. |
| Cross-forest privileged FSP | Critical risk | Audit. |
^ad-recursive-fsp

### FSP enumeration

```powershell
# All FSPs
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=dom,DC=local" -Filter * |
  Select Name,DistinguishedName

# Resolve FSP SIDs
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=dom,DC=local" -Filter * |
  ForEach-Object {
    $sid = $_.Name
    try {
      $resolved = (New-Object System.Security.Principal.SecurityIdentifier($sid)).Translate([System.Security.Principal.NTAccount])
      [PSCustomObject]@{ SID = $sid; Name = $resolved }
    } catch {
      [PSCustomObject]@{ SID = $sid; Name = "UNRESOLVABLE" }
    }
  }

# PowerView
Find-ForeignUser
Find-ForeignGroup

# Cross-trust members in privileged groups (CRITICAL audit)
$privGroups = @("Domain Admins","Enterprise Admins","Schema Admins","Administrators")
foreach ($g in $privGroups) {
  Get-ADGroupMember $g -Recursive | 
    Where {$_.distinguishedName -match "ForeignSecurityPrincipals"}
}
```

___

## tokenGroups Calculation

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `tokenGroups` | Transitive direct + nested groups | Computed. |
| `tokenGroupsGlobalAndUniversal` | Forest-wide via GC | Computed. |
| `tokenGroupsNoGCAcceptable` | Filtered subset | Edge. |
| Computed at query time | Not stored | Standard. |
| Returns SIDs (not names) | Resolve separately | Standard. |
| Per-user query | Specific user | Standard. |
| Performance impact | Heavy LDAP query | Adjacent. |
| Privilege required | Authenticated read | Standard. |
| Always includes `Authenticated Users` SID | Standard | Standard. |
| `Everyone` SID conditional | Edge | Standard. |
| Cross-domain via tokenGroupsGlobalAndUniversal | Forest-wide | Standard. |
| Token bloat manifest at logon | Performance | Adjacent. |
| Compare to `whoami /groups` | Per-session | Adjacent. |
| Useful for impersonation planning | Token scope | Strategy. |
| BloodHound uses tokenGroups | Tool | Adjacent. |
| Detection: bulk tokenGroups query | Defender | Adjacent. |
^ad-recursive-tokengroups

### tokenGroups query

```powershell
# Per-user transitive groups
$user = "jsmith"
$adUser = Get-ADUser $user -Properties tokenGroups
$adUser.tokenGroups | ForEach-Object {
  try {
    [PSCustomObject]@{
      SID = $_.Value
      Name = (New-Object System.Security.Principal.SecurityIdentifier($_)).Translate([System.Security.Principal.NTAccount])
    }
  } catch {
    [PSCustomObject]@{ SID = $_.Value; Name = "UNRESOLVABLE" }
  }
}

# Forest-wide
Get-ADUser $user -Properties tokenGroupsGlobalAndUniversal | 
  Select -ExpandProperty tokenGroupsGlobalAndUniversal
```

___

## primaryGroupID Edge Cases

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `primaryGroupID` attribute | RID of "primary group" | Numeric. |
| Default: 513 (Domain Users) | Standard | Standard. |
| 515 = Domain Computers (computer objects) | Computer default | Standard. |
| 514 = Domain Guests | Guest default | Standard. |
| 516 = Domain Controllers (DC computer accounts) | DC default | Standard. |
| 521 = Read-only DC | RODC default | Standard. |
| Membership not visible in `member` attribute | Implicit | Important. |
| Stealth membership trick | Set primaryGroupID = priv RID | Edge legacy. |
| `Get-ADUser ... -Properties primaryGroupID` | Direct | Standard. |
| Cross-correlate with group membership | Detection | Standard. |
| User with primaryGroupID=512 but not in DA member | Membership without enumeration | Detection. |
| Modern Windows blocks this trick | Hardened | Standard. |
| Detection: primaryGroupID change | Audit event | Defender. |
| Per-user different primary | Edge | Edge. |
| BloodHound considers primaryGroupID | Tool | Adjacent. |
| Audit: non-default primaryGroupID | Suspicious | Audit. |
^ad-recursive-primary

### primaryGroupID audit

```powershell
# Non-default primary group (513 = Domain Users)
Get-ADUser -Filter * -Properties PrimaryGroupID | 
  Where {$_.PrimaryGroupID -ne 513} |
  Select Name,SamAccountName,PrimaryGroupID

# Users with primaryGroupID=512 (DA via primary — stealth)
Get-ADUser -Filter {PrimaryGroupID -eq 512} -Properties PrimaryGroupID
```

___

## Group Membership Audit (Bulk)

| **Audit Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Foreign principals in priv groups | Cross-trust risk | Critical. |
| Service accounts in DA | Common misconfig | Critical. |
| Stale users in priv groups | Old privilege | Audit. |
| Empty privileged groups | Best practice (EA, Schema) | Defense. |
| Recently added members | Possible attacker plant | Defender. |
| Computer accounts in priv groups | Edge | Investigate. |
| Distribution group nested in security | Edge invalid | Edge. |
| Disabled accounts in priv groups | Re-enable risk | Audit. |
| Multiple admins per group | Concentration risk | Strategy. |
| Single admin (lone wolf) | Bus factor | Operational. |
| Unauth bulk query of members | Detection signal | Defender. |
| BloodHound HighValue tag | Auto-marked | Tool. |
| AdminSDHolder propagated | Tier 0 marker | Standard. |
| Cross-OU group references | Broad scope | Audit. |
| Group ACL allowing add | ACL abuse path | Privesc. |
| Group descriptions with creds | Free-text leak | Common. |
^ad-recursive-audit

### Comprehensive group audit

```powershell
# All privileged groups recursive members + flags
$privGroups = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
              "Account Operators","Backup Operators","Server Operators","Print Operators"

$report = @()
foreach ($g in $privGroups) {
  Get-ADGroupMember $g -Recursive -ErrorAction SilentlyContinue | 
    Get-ADUser -Properties Description,LastLogonDate,Enabled,ServicePrincipalName,whenCreated -ErrorAction SilentlyContinue |
    ForEach-Object {
      $report += [PSCustomObject]@{
        Group = $g
        Name = $_.Name
        SamAccountName = $_.SamAccountName
        Enabled = $_.Enabled
        IsService = $null -ne $_.ServicePrincipalName
        LastLogon = $_.LastLogonDate
        Created = $_.whenCreated
        Description = $_.Description
      }
    }
}
$report | Export-Csv priv_audit.csv -NoTypeInformation
```

***
