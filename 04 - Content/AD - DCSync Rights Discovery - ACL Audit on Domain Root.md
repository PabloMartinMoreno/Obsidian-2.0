---
aliases:
  - Domain Root ACL Audit
  - Replication GUID Filter
  - DCSync ACL Discovery
  - dsacls Replication
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
# AD - DCSync Rights Discovery - ACL Audit on Domain Root

***

## PowerShell DCSync Audit

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-Acl "AD:$((Get-ADDomain).DistinguishedName)"` | Domain root ACL | Standard. |
| Filter `ObjectType` GUIDs | Specific to DCSync | Standard. |
| Filter `ActiveDirectoryRights` ExtendedRight | Adjacent | Standard. |
| `Get-DomainObjectAcl -ResolveGUIDs` (PowerView) | Resolved | Standard. |
| Cross-correlate with default holders list | Audit | Standard. |
| Per-domain audit (forest-wide) | foreach loop | Adjacent. |
| Authenticated baseline | Standard | Reliable. |
| `Get-ADObject -Properties nTSecurityDescriptor` | Raw SD | Adjacent. |
| Native dsacls | `dsacls "DC=dom,DC=local"` | Adjacent. |
| Filter findstr "Replication" | Native filter | Standard. |
| RSAT preferred for production | Standard | Standard. |
| Custom audit script | DIY | Standard. |
| Output to file | CSV | Reportable. |
| Detection: DCSync ACL audit | Audit log | Adjacent. |
| Compliance: per-quarter | Standard | Adjacent. |
| Modern: continuous baseline | Defender | Standard. |
^ad-dcsyncacl-pwsh

### Comprehensive DCSync ACL audit

```powershell
$dcsyncRights = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",  # Get-Changes
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2",  # Get-Changes-All
  "89e95b76-444d-4c62-991a-0facbeda640c"   # Get-Changes-In-Filtered-Set
)

$rightLabels = @{
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2" = "Get-Changes"
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2" = "Get-Changes-All"
  "89e95b76-444d-4c62-991a-0facbeda640c" = "Get-Changes-In-Filtered-Set"
}

# Forest-wide audit
$forest = Get-ADForest
foreach ($d in $forest.Domains) {
  Write-Host "`n=== $d ==="
  $domDN = (Get-ADDomain -Identity $d).DistinguishedName
  
  Get-Acl "AD:$domDN" -ErrorAction SilentlyContinue |
    Select -ExpandProperty Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.ObjectType -in $dcsyncRights
    } |
    Select IdentityReference,
      @{n='Right';e={$rightLabels[$_.ObjectType.Guid]}},
      InheritanceType
}
```

___

## PowerView DCSync ACL

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs` | Resolved DACL | Standard. |
| Filter `ObjectAceType` to GUIDs | Standard | Standard. |
| `Find-InterestingDomainAcl` | Pre-filter | Standard. |
| `Get-NetGroupMember "Domain Admins" -Recurse` | Recursive members | Adjacent. |
| `Get-DomainTrust` | Cross-trust check | Adjacent. |
| Cross-correlate with priv groups | Standard | Audit. |
| Bulk forest-wide | Adjacent | Standard. |
| Adversary tool focus | Red team | Standard. |
| Modern: BloodHound preferred | Standard | Tool. |
| pywerview Linux equivalent | Adjacent | Adjacent. |
| Custom function wrappers | DIY | Edge. |
| OPSEC: in-memory load | Defender evasion | Adjacent. |
| Detection: PowerView signatures | Defender | Adjacent. |
| Cleanup: post-engagement | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Compliance: documented findings | Standard | Adjacent. |
^ad-dcsyncacl-pv

### PowerView DCSync audit

```powershell
Import-Module .\PowerView.ps1

# Find DCSync ACEs on domain root
Get-DomainObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ObjectAceType -match "Replicating Directory Changes"} |
  Select IdentityReferenceName,ObjectAceType,ActiveDirectoryRights

# Cross-correlate with priv group
$dcsyncPrincipals = Get-DomainObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ObjectAceType -match "Replicating Directory Changes"} |
  Select -ExpandProperty IdentityReferenceName -Unique

foreach ($p in $dcsyncPrincipals) {
  Write-Host "`n=== $p ==="
  try {
    Get-DomainObject -Identity $p | Select Name,SamAccountName,@{n='AdminCount';e={$_.adminCount}}
  } catch {}
}
```

___

## Linux DCSync ACL Audit

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `bloodyAD --resolve-sd` | Decoded DACL | Standard. |
| `ldapsearch nTSecurityDescriptor` | Raw SD | Standard. |
| `nxc ldap DC --query` | Custom LDAP | Adjacent. |
| Filter for replication GUIDs | Standard | Standard. |
| `bloodhound-python -c ACL` | Linux BH | Standard. |
| Custom Python with ldap3 | DIY | Edge. |
| `pywerview get-objectacl` | Linux PowerView | Adjacent. |
| `windapsearch --custom` | Adjacent | Edge. |
| Modern Linux: bloodyAD preferred | Standard | Standard. |
| Authenticated bind | Standard | Reliable. |
| LDAPS encryption | Modern | Standard. |
| Cross-domain via GC | Edge | Adjacent. |
| Output JSON | Parseable | Standard. |
| Cross-correlate with audit baseline | Standard | Compliance. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
^ad-dcsyncacl-linux

### Linux DCSync audit

```bash
# bloodyAD (decoded SDDL)
bloodyAD --host DC -d dom -u user -p pass \
  get object "DC=dom,DC=local" --resolve-sd | \
  grep -E "1131f6aa|1131f6ad|89e95b76"

# ldapsearch raw
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "DC=dom,DC=local" -s base \
  "(objectClass=*)" nTSecurityDescriptor

# bloodhound-python with ACL
bloodhound-python -d dom.local -u user -p pass -ns DC -c All --zip
```

___

## BloodHound DCSync Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `GetChanges` edge | Get-Changes right | Standard. |
| `GetChangesAll` edge | Get-Changes-All right | Standard. |
| `GetChangesInFilteredSet` edge | Filtered set (RODC) | Edge. |
| BloodHound CE 5.x+ | Modern | Tool. |
| Cypher: find DCSync paths | Standard | Tool. |
| Cypher: shortest path to DCSync | Path analysis | Standard. |
| Cross-correlate with priv | Standard | Tool. |
| BHCE 6.x improved | Modern | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| Visual graph | Helpful | Standard. |
| Custom analytics | Cypher | Tool. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Audit baseline via Cypher | Standard | Compliance. |
| Modern: continuous monitoring | Defender | Standard. |
| Cross-trust DCSync paths | Forest-wide | Adjacent. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
^ad-dcsyncacl-bh

### BloodHound DCSync queries

```cypher
// All principals with direct DCSync rights
MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)
RETURN u.name, d.name

// All paths to DCSync (recursive via groups)
MATCH p=(u {owned: true})-[:MemberOf|GetChanges|GetChangesAll*1..]->(d:Domain)
RETURN p

// Non-default DCSync holders
MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE NOT u.name IN ["DOMAIN ADMINS@DOM.LOCAL", "ENTERPRISE ADMINS@DOM.LOCAL", 
                      "ADMINISTRATORS@DOM.LOCAL", "DOMAIN CONTROLLERS@DOM.LOCAL"]
RETURN u.name, u.objectid

// Foreign DCSync (cross-trust)
MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE u.domain <> d.name
RETURN u.name, u.domain, d.name
```

___

## Native dsacls

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `dsacls "DC=dom,DC=local"` | Native ACL | Standard. |
| `dsacls "DC=dom,DC=local" /S` | Include inherited | Standard. |
| `dsacls "DC=dom,DC=local" | findstr /i "Replicat"` | Filter | Standard. |
| Native Windows utility | Always available | Standard. |
| Output: per-line ACE | Readable | Standard. |
| Filter via findstr or grep | Standard | Standard. |
| `dsacls /G principal:rights` | Grant (privileged) | Privileged. |
| `dsacls /R principal` | Revoke (privileged) | Privileged. |
| Adjacent: PowerShell preferred | Modern | Adjacent. |
| Output redirect to file | Standard | Standard. |
| Cross-correlate with PowerView | Adjacent | Standard. |
| Compatibility: legacy systems | Standard | Standard. |
| Detection: dsacls events | Edge | Adjacent. |
| Audit: per-domain | Standard | Compliance. |
| Modern: PowerShell + RSAT | Preferred | Standard. |
| Per-DC dsacls output diff | Edge | Edge. |
^ad-dcsyncacl-dsacls

### dsacls usage

```cmd
:: All ACEs on domain root
dsacls "DC=dom,DC=local"

:: Filter for replication rights
dsacls "DC=dom,DC=local" /S | findstr /i "Replicating Directory"

:: Output:
::  Allow BUILTIN\Administrators
::                                  Replicating Directory Changes
::                                  Replicating Directory Changes All
::  Allow DOM\Domain Controllers
::                                  Replicating Directory Changes
::                                  Replicating Directory Changes All
::  Allow DOM\Enterprise Admins
::                                  ...

:: Look for non-default principals
```

___

## Per-Quarter Compliance Audit

| **Step** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| 1. Run audit script | Standard | Standard. |
| 2. Compare to documented baseline | Standard | Compliance. |
| 3. Identify deviations | Audit | Standard. |
| 4. Investigate non-default | Standard | Audit. |
| 5. Cleanup stale ACEs | Hygiene | Standard. |
| 6. Document changes | Compliance | Standard. |
| 7. Update baseline | Standard | Adjacent. |
| Defender: continuous between audits | Modern | Standard. |
| BloodHound recurring | Modern | Tool. |
| PingCastle scheduled | Defender | Standard. |
| Purple Knight scheduled | Defender | Standard. |
| Microsoft Defender for Identity | Real-time | Modern. |
| Custom cron audit | Operational | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| Per-trust audit | Cross-forest | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-dcsyncacl-quarterly

### Quarterly audit script

```powershell
function Invoke-DCSyncAudit {
  param(
    [string[]]$Domains = (Get-ADForest).Domains,
    [string[]]$ExpectedDefaults = @(
      "Domain Admins","Enterprise Admins","Administrators",
      "Domain Controllers","Enterprise Read-only Domain Controllers","SYSTEM"
    )
  )
  
  $report = @()
  
  $dcsyncRights = @(
    "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
    "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
  )
  
  foreach ($d in $Domains) {
    $domDN = (Get-ADDomain -Identity $d).DistinguishedName
    
    Get-Acl "AD:$domDN" -ErrorAction SilentlyContinue |
      Select -ExpandProperty Access |
      Where {$_.AccessControlType -eq "Allow" -and $_.ObjectType -in $dcsyncRights} |
      ForEach-Object {
        $name = $_.IdentityReference.Value -replace ".*\\",""
        $isDefault = $ExpectedDefaults -contains $name
        
        $report += [PSCustomObject]@{
          Domain = $d
          Principal = $_.IdentityReference
          Right = $_.ObjectType
          Inherited = $_.IsInherited
          Status = if ($isDefault) {"DEFAULT"} else {"NON-DEFAULT"}
        }
      }
  }
  
  return $report
}

# Run
$audit = Invoke-DCSyncAudit
$audit | Where Status -eq "NON-DEFAULT" | Format-Table -AutoSize
$audit | Export-Csv "dcsync_audit_$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation
```

***
