---
aliases:
  - Find-InterestingDomainAcl
  - Bulk ACL Audit
  - ACE Filtering
  - Custom ACL Scripts
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
  - "[[AD - ACL Enumeration]]"
---
# AD - ACL Enumeration - ACE Filtering & Bulk Audit

***

## PowerView Find-InterestingDomainAcl

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Find-InterestingDomainAcl` | Pre-filtered dangerous ACEs | Quick. |
| `Find-InterestingDomainAcl -ResolveGUIDs` | Resolve right GUIDs | Standard. |
| Default filter excludes: BUILTIN, NT AUTHORITY, Domain Admins | Standard | Standard. |
| `-DomainController DC` | Specific DC | Adjacent. |
| `-Domain dom.local` | Cross-domain | Adjacent. |
| Filter principals via `IdentityReferenceClass` | user/group/computer | Standard. |
| Output: per-ACE entry | Standard | Standard. |
| Combine with priv group filter | Targeted | Strategy. |
| Bulk forest-wide | Per-domain | Adjacent. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Modern alternative: BloodHound | Visual | Tool. |
| Cross-correlate with priv | Standard | Audit. |
| Output to CSV | Reportable | Standard. |
| Customize output via Select | Standard | Standard. |
| Verbose | Debug | Standard. |
^ad-bulk-findacl

### Find-InterestingDomainAcl

```powershell
Import-Module .\PowerView.ps1

# Default
Find-InterestingDomainAcl -ResolveGUIDs |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights

# Filter to user-only modifiers
Find-InterestingDomainAcl -ResolveGUIDs |
  Where IdentityReferenceClass -eq "user" |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType

# Cross-correlate with privileged
Find-InterestingDomainAcl -ResolveGUIDs |
  Where {
    $_.IdentityReferenceClass -eq "user" -and
    -not (Get-DomainUser -Identity $_.IdentityReferenceName).adminCount
  } |
  Where {(Get-DomainUser -Identity $_.IdentityReferenceName).enabled -eq $true} |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights
```

___

## Custom Bulk Audit Scripts

| **Audit** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Per-OU iteration | Standard | Standard. |
| Per-object class iteration | User, Computer, Group, OU | Standard. |
| Per-attribute filtering | Specific rights | Standard. |
| Recursive group expansion | Effective principals | Standard. |
| Cross-correlate with priv | adminCount, MemberOf | Standard. |
| Output CSV | Reportable | Standard. |
| Forest-wide via foreach | Multi-domain | Adjacent. |
| Stale ACE detection | whenChanged comparison | Edge. |
| Anomaly detection (recent changes) | Audit | Defender adjacent. |
| Custom risk scoring | Per-org | Edge. |
| Compliance baseline comparison | Standard | Adjacent. |
| BloodHound + Cypher alternative | Modern | Tool. |
| Linux equivalent via bloodyAD + scripting | Cross-platform | Standard. |
| Performance: limit attribute returns | Optimization | Standard. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
^ad-bulk-custom

### Custom audit script

```powershell
# Comprehensive ACL audit
$dangerousRights = "GenericAll","GenericWrite","WriteDACL","WriteOwner",
                    "ExtendedRight","AllExtendedRights","WriteProperty"

$exemptPrincipals = "Domain Admins","Enterprise Admins","Administrators",
                     "SYSTEM","BUILTIN","Authenticated Users","Domain Controllers",
                     "Self","Domain Computers"

$audit = @()
Get-ADObject -Filter * -SearchBase "DC=dom,DC=local" -SearchScope Subtree |
  ForEach-Object {
    $dn = $_.DistinguishedName
    $class = $_.ObjectClass
    
    try {
      Get-Acl "AD:$dn" -ErrorAction SilentlyContinue | 
        Select -ExpandProperty Access |
        Where {
          $_.AccessControlType -eq "Allow" -and
          ($_.ActiveDirectoryRights -match ($dangerousRights -join "|")) -and
          $_.IdentityReference.Value -notmatch ($exemptPrincipals -join "|")
        } |
        ForEach-Object {
          $audit += [PSCustomObject]@{
            ObjectDN = $dn
            ObjectClass = $class
            Principal = $_.IdentityReference
            Rights = $_.ActiveDirectoryRights
            Inherited = $_.IsInherited
            ObjectType = $_.ObjectType
          }
        }
    } catch {}
  }

$audit | Export-Csv "acl_audit.csv" -NoTypeInformation
$audit | Group-Object ObjectClass | Select Count,Name | Sort Count -Descending
```

___

## BloodHound Bulk Cypher

| **Query Type** | **Use** | **Notas** |
|:---:|:---:|:---:|
| ShortestPath to DA | Standard | Standard. |
| AllShortestPaths to DA | All paths | Standard. |
| Per-principal exposure | "What can X reach?" | Strategy. |
| Per-target inbound | "Who can compromise X?" | Strategy. |
| Foreign principal paths | Cross-trust | Critical. |
| ACL-only paths | Filter edge types | Standard. |
| Custom analytics scripts | DIY Cypher | Tool. |
| BloodHound CE built-in queries | Pre-defined | Tool. |
| Per-domain ingest required | Standard | Adjacent. |
| Multi-domain analysis | Forest-wide | Standard. |
| Compliance baseline queries | Standard | Adjacent. |
| Stale ACE detection (whenChanged) | Edge | Edge. |
| Recent activity correlation | Defender adjacent | Adjacent. |
| Custom edges via post-processing | Edge | Edge. |
| Modern BHCE 6.x: improved analytics | Modern | Tool. |
| Compliance: documented Cypher baselines | Standard | Adjacent. |
^ad-bulk-bhcypher

### Bulk Cypher queries

```cypher
// All non-DA users with dangerous ACL paths to high-value
MATCH (u:User)
WHERE u.adminCount = false AND u.enabled = true
MATCH p=shortestPath((u)-[*1..]->(target {highvalue: true}))
WHERE length(p) <= 5
RETURN u.name, length(p), target.name LIMIT 50

// Foreign principals with privileged ACL
MATCH (u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner]->(target)
WHERE u.domain <> target.domain AND target.highvalue = true
RETURN u.name, u.domain, target.name, target.domain

// Top 20 most-exposed users (paths from many sources)
MATCH (u:User {enabled: true})
WHERE u.adminCount = true
WITH u, COUNT { (other)-[*1..]->(u) } AS exposure
WHERE exposure > 0
RETURN u.name, exposure ORDER BY exposure DESC LIMIT 20
```

___

## Foreign Principal Audit

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Foreign user with priv ACE on local object | Cross-trust | Critical. |
| Foreign group with priv ACE | Same | Critical. |
| Foreign computer with priv ACE | Edge | Edge. |
| Pre-merger leftover | Common | Audit. |
| Cross-trust ACL inheritance | Inherited | Standard. |
| BloodHound foreign edges | Visual | Tool. |
| Cypher: cross-domain ACL | Standard | Tool. |
| Detection: foreign ACL grants | Defender | Adjacent. |
| Audit: per-trust ACL review | Standard | Compliance. |
| Cleanup post-merger | Standard | Adjacent. |
| Modern: Selective Auth + ACL minimal | Hardening | Standard. |
| Cross-correlate with FSP | Standard | Audit. |
| Trust account ACL | Cross-trust | Standard. |
| sIDHistory in ACL | Edge | Edge. |
| Compliance: documented cross-trust ACL | Standard | Adjacent. |
| Per-trust risk score | Per-org | Edge. |
^ad-bulk-foreign

### Foreign ACL audit

```powershell
$localDomain = (Get-ADDomain).Name

Get-DomainObjectAcl -SearchBase "DC=$localDomain,DC=local" -ResolveGUIDs |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|ExtendedRight" -and
    $_.IdentityReferenceDomain -ne $localDomain -and
    $_.IdentityReferenceDomain -ne ""
  } |
  Select ObjectDN,IdentityReferenceName,IdentityReferenceDomain,ActiveDirectoryRights
```

___

## Stale / Old ACE Detection

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| ACE granted years ago | whenChanged on object | Edge. |
| ACE for disabled / deleted user | Stale principal | Audit. |
| ACE for unresolvable SID (deleted account) | Direct stale | Standard. |
| Pre-migration ACEs | Old context | Audit. |
| Stale group with old members + priv ACE | Cumulative risk | Audit. |
| BloodHound stale principals | Visual | Tool. |
| Cypher: ACEs from inactive users | Custom | Tool. |
| Detection: per-quarter audit | Compliance | Standard. |
| Cleanup: remove stale ACEs | Hygiene | Standard. |
| Modern: continuous monitoring | Defender | Modern. |
| Cross-correlate user activity | Standard | Audit. |
| Per-OU stale ACE | Granular | Standard. |
| Per-tier stale ACE | Tiered model | Standard. |
| Audit: ACEs >180 days unchanged | Age-based | Audit. |
| Detection: ACE creation events | Defender | Adjacent. |
| Compliance: ACE lifecycle management | Standard | Adjacent. |
^ad-bulk-stale

### Stale ACE detection

```powershell
# Find ACEs referencing deleted/unresolvable principals
Get-ADObject -Filter * -Properties nTSecurityDescriptor |
  ForEach-Object {
    $dn = $_.DistinguishedName
    $acl = Get-Acl "AD:$dn" -ErrorAction SilentlyContinue
    if ($acl) {
      $acl.Access | Where {
        $_.IdentityReference.Value -match "^S-\d-\d-\d+" # Unresolved SID
      } | ForEach-Object {
        [PSCustomObject]@{
          Object = $dn
          UnresolvedSID = $_.IdentityReference.Value
          Rights = $_.ActiveDirectoryRights
        }
      }
    }
  }

# Find ACEs for disabled users
Get-ADUser -Filter {Enabled -eq $false} | ForEach-Object {
  $sid = $_.SID.Value
  $userName = $_.SamAccountName
  
  # Search for ACEs referencing this user (slow in large envs)
  Get-DomainObjectAcl -SearchBase "DC=dom,DC=local" -ResolveGUIDs |
    Where {$_.SecurityIdentifier -eq $sid} |
    Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights
}
```

___

## Per-Quarter Compliance Audit

| **Audit Scope** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Domain root DACL | Standard | Standard. |
| AdminSDHolder DACL | Standard | Standard. |
| Privileged groups DACL | DA, EA, Schema, etc. | Standard. |
| All Tier 0 user DACL | Per-user | Standard. |
| All Tier 0 OU DACL | Per-OU | Standard. |
| All GPO DACL | Per-GPO | Standard. |
| All ADCS template DACL | Per-template | Standard. |
| Foreign principal ACEs | Cross-trust | Critical. |
| Stale ACE detection | Standard | Adjacent. |
| Compliance baseline diff | Per-quarter | Standard. |
| Documentation of changes | Standard | Standard. |
| Defender: continuous monitoring | Adjacent | Adjacent. |
| BloodHound continuous | Modern | Tool. |
| PingCastle / Purple Knight | Defender | Standard. |
| ADRecon ACL section | Comprehensive | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
^ad-bulk-quarterly

### Quarterly audit script

```powershell
# Comprehensive quarterly ACL audit
$auditDate = Get-Date
$report = @()

# 1. Domain root
$domDN = (Get-ADDomain).DistinguishedName
$report += [PSCustomObject]@{
  Audit = "Domain Root"
  Object = $domDN
  Findings = (Get-Acl "AD:$domDN").Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users|Domain Controllers|Self"
    } | Measure-Object | Select -ExpandProperty Count
}

# 2. AdminSDHolder
$asdh = "CN=AdminSDHolder,CN=System,$domDN"
$report += [PSCustomObject]@{
  Audit = "AdminSDHolder"
  Object = $asdh
  Findings = (Get-Acl "AD:$asdh").Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users"
    } | Measure-Object | Select -ExpandProperty Count
}

# 3. Privileged groups
$privGroups = "Domain Admins","Enterprise Admins","Schema Admins","Administrators"
foreach ($g in $privGroups) {
  $gDN = (Get-ADGroup $g -ErrorAction SilentlyContinue).DistinguishedName
  if ($gDN) {
    $report += [PSCustomObject]@{
      Audit = "Group: $g"
      Object = $gDN
      Findings = (Get-Acl "AD:$gDN").Access |
        Where {
          $_.AccessControlType -eq "Allow" -and
          $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
        } | Measure-Object | Select -ExpandProperty Count
    }
  }
}

$report | Format-Table -AutoSize
$report | Export-Csv "quarterly_acl_audit_$($auditDate.ToString('yyyyMMdd')).csv" -NoTypeInformation
```

___

## OPSEC Considerations

| **Aspect** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Bulk LDAP queries = SIEM flag | Defender | Adjacent. |
| Per-object targeted | Stealthier | OPSEC. |
| BloodHound passive collection | Less suspicious | OPSEC. |
| Modify operations = critical alert | Defender | Adjacent. |
| Read operations = less suspicious | Standard | OPSEC. |
| Detection: Event 4662 | Per-object access | Defender. |
| Bulk SD reads | Anomaly | Defender ML. |
| Time-of-day pacing | Match legit pattern | Stealth. |
| Authenticated baseline | Standard | Reliable. |
| Anonymous attempts (limited) | Edge | Edge. |
| Cleanup: revert modifications | Standard | OPSEC. |
| Stealth: minimal footprint | Best | OPSEC. |
| Detection: per-domain ACL events | Defender | Adjacent. |
| Detection: cross-domain queries | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit log retention | Standard | Adjacent. |
^ad-bulk-opsec

### OPSEC-aware bulk audit

```bash
# Targeted high-value objects only (preferred OPSEC)
DC="dc01.dom.local"
USER="user"; PASS="pass"

# Domain root (single query)
ldapsearch -h $DC -D "dom\\$USER" -w $PASS \
  -b "DC=dom,DC=local" -s base "(objectClass=*)" nTSecurityDescriptor

# AdminSDHolder
ldapsearch -h $DC -D "dom\\$USER" -w $PASS \
  -b "CN=AdminSDHolder,CN=System,DC=dom,DC=local" -s base "(objectClass=*)" nTSecurityDescriptor

# Avoid bulk subtree query unless needed
# ldapsearch ... -s subtree (LOUD)
```

***
