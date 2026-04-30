---
aliases:
  - DCSync Misconfigurations
  - Service Account DCSync
  - Authenticated Users DCSync
  - Cross-Trust DCSync
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
# AD - DCSync Rights Discovery - Common Misconfigs

***

## Authenticated Users / Domain Users

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Authenticated Users with DCSync | Anyone in domain dumps NTDS | Critical. |
| Domain Users with DCSync | Same | Critical. |
| Pre-Windows 2000 group | Edge legacy | Critical. |
| Everyone (S-1-1-0) | Critical | Critical. |
| Anonymous Logon | Edge — should be impossible | Critical. |
| Implicit "Self" too broad | Edge | Edge. |
| Bypass Confidential flag | Adjacent | Adjacent. |
| Detection: any of above | Defender critical alert | Standard. |
| Modern: should never exist | Hardening | Standard. |
| Investigation: who granted? | Audit trail | Compliance. |
| Cleanup: revert immediately | Standard | OPSEC. |
| Defender: continuous alerting | Modern | Standard. |
| Microsoft Defender for Identity | Modern | Defender. |
| BloodHound CRITICAL flag | Tool | Tool. |
| Compliance violation | All standards | Adjacent. |
| Audit log retention | Forensic | Adjacent. |
^ad-dcsyncmisc-authusers

### Critical detection

```powershell
# CRITICAL audit: Authenticated Users / Domain Users with DCSync
$dcsyncRights = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
)

Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in $dcsyncRights -and
    $_.IdentityReference -match "Authenticated Users|Domain Users|Everyone|Anonymous|Pre-Windows 2000"
  } |
  Select IdentityReference,ObjectType
# Any output = CRITICAL — entire domain compromised by any user
```

___

## Service Accounts with DCSync

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Service account direct DCSync ACE | Common misconfig | Critical. |
| Service account in priv group | Indirect DCSync | Critical. |
| Backup software service account | Common pattern | Audit. |
| Monitoring tool service account | Common pattern | Audit. |
| Backup Operators with DCSync (rare) | Edge | Critical. |
| Service account with adminCount=1 | Tier 0 marker | Audit. |
| Stale service accounts | Old delegations | Audit. |
| LAPS-managed service account | Edge | Edge. |
| gMSA in DA | Privileged service | Critical. |
| Cleartext service password leakage | Adjacent | Adjacent. |
| Detection: service account DCSync events | Defender | Adjacent. |
| Audit: minimal service account priv | Best practice | Standard. |
| Compliance: documented service accounts | Standard | Adjacent. |
| Cross-correlate with Kerberoast | Crackable | Strategy. |
| Modern: gMSA preferred | Hardening | Standard. |
| Cleanup: rotate post-engagement | Standard | OPSEC. |
^ad-dcsyncmisc-svc

### Service account DCSync detection

```powershell
# Service accounts (SPN-bound) with DCSync rights
$svcAccounts = Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties ServicePrincipalName

foreach ($svc in $svcAccounts) {
  $sid = $svc.SID.Value
  $hasDCSync = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
    Select -ExpandProperty Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.ObjectType -in $dcsyncRights
    } |
    Where {
      try { $_.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -eq $sid } catch { $false }
    }
  
  if ($hasDCSync) {
    Write-Host "[!] Service account with DCSync: $($svc.SamAccountName)" -ForegroundColor Red
  }
  
  # Recursive check via groups
  $groups = Get-ADPrincipalGroupMembership $svc -ErrorAction SilentlyContinue
  foreach ($g in $groups) {
    $gSid = $g.SID.Value
    $groupDCSync = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
      Select -ExpandProperty Access |
      Where {$_.ObjectType -in $dcsyncRights} |
      Where {
        try { $_.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -eq $gSid } catch { $false }
      }
    if ($groupDCSync) {
      Write-Host "[!] Service account $($svc.SamAccountName) inherits DCSync via group $($g.Name)" -ForegroundColor Yellow
    }
  }
}
```

___

## Exchange Legacy DCSync (CVE-2019-1040)

| **Group** | **Pre-2019 Right** | **Notas** |
|:---:|:---:|:---:|
| Exchange Trusted Subsystem | WriteDACL on domain | Patched. |
| Exchange Windows Permissions | WriteDACL on domain | Patched. |
| Exchange Servers | DCSync indirect | Patched. |
| Exchange Enterprise Servers | Forest-wide | Patched. |
| ExchangeLegacyInterop | Legacy | Edge. |
| Adjacent: ProxyShell / ProxyNotShell | Exchange RCE | Adjacent. |
| Modern Exchange split permission | Hardened | Standard. |
| Patch CVE-2019-1040 | Mitigation | Standard. |
| Detection: Exchange ACL changes | Defender | Adjacent. |
| Audit: Exchange group membership | Standard | Compliance. |
| Cleanup: hardened permissions | Standard | Adjacent. |
| Microsoft KB on Exchange permissions | Reference | Adjacent. |
| Cross-correlate Exchange compromise | Adjacent | Audit. |
| Hybrid Exchange (on-prem + cloud) | Adjacent | Adjacent. |
| Modern: Exchange Online minimizes risk | Cloud | Modern. |
| Compliance: Exchange tier isolation | Standard | Adjacent. |
^ad-dcsyncmisc-exchange

### Exchange DCSync audit

```powershell
$exchangeGroups = @("Exchange Trusted Subsystem","Exchange Windows Permissions",
                     "Exchange Servers","Exchange Enterprise Servers")

foreach ($g in $exchangeGroups) {
  try {
    $sid = (Get-ADGroup $g -ErrorAction SilentlyContinue).SID.Value
    if ($sid) {
      $hasDCSync = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
        Select -ExpandProperty Access |
        Where {$_.ObjectType -in $dcsyncRights}
      
      if ($hasDCSync) {
        Write-Warning "Exchange group $g may have DCSync — verify CVE-2019-1040 patch"
      }
    }
  } catch {}
}
```

___

## Cross-Trust DCSync (Foreign Principals)

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Foreign user with DCSync ACE | Cross-forest privesc | Critical. |
| Foreign group with DCSync ACE | Same | Critical. |
| Foreign computer with DCSync | Edge | Critical. |
| Cross-domain (intra-forest) DCSync | Forest-wide impact | Critical. |
| Inter-forest DCSync | Forest takeover path | Critical. |
| SID Filtering disabled | Cross-forest defense gap | Critical. |
| Migration leftover from merger | Common audit | Audit. |
| BloodHound foreign DCSync paths | Modern visualization | Tool. |
| Detection: cross-forest replication | Defender | Adjacent. |
| Modern: post-2019 patch limits cross-forest | Standard | Adjacent. |
| Audit: per-trust ACL review | Standard | Compliance. |
| Cleanup: revert cross-trust | Standard | Adjacent. |
| Compliance: documented cross-trust | Standard | Adjacent. |
| Cross-correlate with FSP | Standard | Audit. |
| Trust account ACL audit | Cross-trust | Standard. |
| sIDHistory in DCSync chain | Edge | Edge. |
^ad-dcsyncmisc-crosstrust

### Cross-trust DCSync detection

```powershell
$localDomain = (Get-ADDomain).Name

Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in $dcsyncRights -and
    $_.IdentityReference.Value -notmatch "^${localDomain}\\" -and
    $_.IdentityReference.Value -notmatch "^BUILTIN\\" -and
    $_.IdentityReference.Value -notmatch "^NT AUTHORITY"
  } |
  Select IdentityReference,ObjectType
# Output: foreign principals with DCSync (CRITICAL)
```

___

## Stale ACE / Disabled Principals

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| ACE for disabled user | Stale principal | Audit. |
| ACE for unresolvable SID (deleted) | Direct stale | Standard. |
| Old service account migrated | Stale | Audit. |
| Pre-merger ACEs | Old context | Audit. |
| Stale group with old members | Cumulative risk | Audit. |
| `whenChanged` analysis | Age-based | Edge. |
| Compliance: per-quarter stale audit | Standard | Adjacent. |
| Cleanup: remove stale ACEs | Hygiene | Standard. |
| Detection: ACE inactivity | Edge | Defender. |
| Audit log retention | Standard | Adjacent. |
| Modern continuous monitoring | Defender | Standard. |
| Cross-correlate user activity | Standard | Audit. |
| Per-tier stale review | Standard | Compliance. |
| Documentation: ACE lifecycle | Standard | Adjacent. |
| Removal cleanup workflow | Standard | Adjacent. |
| Defender: stale principal alerts | Modern | Standard. |
^ad-dcsyncmisc-stale

### Stale DCSync ACE detection

```powershell
$dcsyncACEs = Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {$_.ObjectType -in $dcsyncRights}

foreach ($ace in $dcsyncACEs) {
  try {
    $sid = $ace.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value
    $obj = Get-ADObject -Filter {ObjectSid -eq $sid} -Properties Enabled,LastLogonDate -ErrorAction SilentlyContinue
    
    if (-not $obj) {
      Write-Host "STALE: $($ace.IdentityReference) (deleted/unresolvable)" -ForegroundColor Red
    } elseif ($obj.Enabled -eq $false) {
      Write-Host "STALE: $($obj.Name) (disabled)" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "STALE: $($ace.IdentityReference) (error resolving)" -ForegroundColor Red
  }
}
```

___

## Recursive Group Membership Hidden DCSync

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| User in group → group has DCSync | Indirect | Common. |
| Multi-level nesting | Hidden privilege | Audit risk. |
| Foreign principal in nested chain | Cross-trust | Critical. |
| Service account in nested chain | Common | Audit. |
| BloodHound recursive expansion | Visual | Tool. |
| `Get-ADGroupMember -Recursive` | RSAT | Standard. |
| LDAP recursive filter | `:1.2.840.113556.1.4.1941:=` | OID. |
| Stale members in nested groups | Old delegation | Audit. |
| Cross-OU group references | Indirect | Standard. |
| Per-tier nesting audit | Tier 0 isolation | Best practice. |
| Detection: nested DCSync via priv group | Defender | Adjacent. |
| Audit: per-quarter recursive review | Standard | Compliance. |
| Compliance: documented baseline | Standard | Adjacent. |
| BloodHound priv path queries | Modern | Tool. |
| Cypher: paths to DCSync edges | Custom | Tool. |
| Cleanup: stale group members | Standard | Adjacent. |
^ad-dcsyncmisc-recursive

### Recursive DCSync detection

```cypher
// All paths to DCSync (BloodHound)
MATCH p=(u {owned: true})-[:MemberOf|GetChanges|GetChangesAll*1..]->(d:Domain)
RETURN p

// Non-default principals via group nesting
MATCH (u)-[:MemberOf*1..]->(g:Group)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE u.adminCount = false
RETURN u.name, g.name, d.name

// Foreign principals with DCSync via nesting (cross-trust)
MATCH (u)-[:MemberOf*1..]->(g:Group)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE u.domain <> d.name
RETURN u.name, u.domain, g.name, d.name
```

___

## AdminSDHolder ACL Modify (Tier 0 Persistence)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| AdminSDHolder template | Per-domain | Standard. |
| Modify ACL = propagate via SDProp | Every 60min | Standard. |
| Add DCSync to AdminSDHolder | Persistent backdoor | Critical. |
| WriteDACL on AdminSDHolder | Tier 0 control | Critical. |
| WriteOwner on AdminSDHolder | 2-step backdoor | Critical. |
| Detection: AdminSDHolder ACL modify | Defender critical alert | Defender. |
| Stealthier than direct ACE | OPSEC | Edge. |
| BloodHound AdminSDHolder analysis | Modern | Tool. |
| Modify protected groups via SDProp | Standard mechanism | Standard. |
| Cleanup: revert AdminSDHolder ACL | Standard | OPSEC. |
| Compliance: per-quarter AdminSDHolder audit | Standard | Adjacent. |
| Modern: extreme alerting | Critical | Standard. |
| Modern: monitor AdminSDHolder 24x7 | Defender | Standard. |
| Adjacent: AdminSDHolder Abuse hub | Cross-ref | Adjacent. |
| Audit log retention | Forensic | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
^ad-dcsyncmisc-asdh

### AdminSDHolder DCSync audit

```powershell
$asdh = "CN=AdminSDHolder,CN=System,$((Get-ADDomain).DistinguishedName)"

Get-Acl "AD:$asdh" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in $dcsyncRights
  } |
  Select IdentityReference,ObjectType,InheritanceType
# Any non-default DCSync ACE here = persistent backdoor
```

___

## Per-Trust DCSync Audit

| **Trust Type** | **DCSync Risk** | **Notas** |
|:---:|:---:|:---:|
| Intra-forest trust | SID Filtering off default | Standard. |
| External trust | SID Filtering on default | Hardened. |
| Forest trust | SID Filtering on default | Hardened. |
| Realm trust (MIT KDC) | Edge | Edge. |
| Trust account SD | Standard | Standard. |
| Cross-trust principals with DCSync | Critical | Audit. |
| Per-trust attribute audit | Standard | Compliance. |
| BloodHound trust + DCSync paths | Modern | Tool. |
| Detection: cross-forest replication | Defender | Adjacent. |
| Modern: post-2019 patches | Standard | Hardening. |
| TGT delegation cross-forest disabled default | Modern | Standard. |
| Cleanup: revert cross-trust ACE | Standard | Adjacent. |
| Compliance: documented cross-trust | Standard | Adjacent. |
| Cross-correlate trust attributes | Standard | Audit. |
| sIDHistory abuse adjacent | Edge | Adjacent. |
| Modern: minimal cross-trust ACE | Best practice | Standard. |
^ad-dcsyncmisc-pertrust

### Per-trust DCSync audit

```powershell
$trusts = Get-ADTrust -Filter *

foreach ($t in $trusts) {
  Write-Host "`n=== Trust: $($t.Target) ($($t.Direction)) ==="
  Write-Host "SID Filtering: $($t.SIDFilteringForestAware)"
  Write-Host "Quarantined: $($t.SIDFilteringQuarantined)"
  
  # Find principals from this trust with DCSync
  $trustDomain = $t.Target -replace "\.","\\"
  
  Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
    Select -ExpandProperty Access |
    Where {
      $_.ObjectType -in $dcsyncRights -and
      $_.IdentityReference.Value -match $trustDomain
    } |
    Select IdentityReference,ObjectType
}
```

***
