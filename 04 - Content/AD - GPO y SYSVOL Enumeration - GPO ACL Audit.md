---
aliases:
  - GPO ACL Audit
  - GPO Modify Rights
  - WriteGPLink
  - GPO Owner
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
  - "[[AD - GPO y SYSVOL Enumeration]]"
---
# AD - GPO & SYSVOL Enumeration - GPO ACL Audit

***

## GPO Object DACL

| **Right** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| GenericAll on GPO | Full control | Critical. |
| GenericWrite on GPO | Modify settings | Critical. |
| WriteDACL on GPO | Self-grant | Critical. |
| WriteOwner on GPO | 2-step | Adjacent. |
| Apply Group Policy | Standard read | Standard. |
| `gpcFileSysPath` modify | SYSVOL files | Adjacent. |
| Per-GPO DACL granular | Standard | Standard. |
| Default holders: Domain Admins, Enterprise Admins, Group Policy Creator Owners (creator) | Standard | Standard. |
| BloodHound `GenericAll`, `GenericWrite`, `WriteDacl`, `WriteOwner`, `Owns` on GPO | Standard | Tool. |
| `WriteGPLink` separate edge | Adjacent | Tool. |
| Cross-correlate with linked OUs | Critical | Audit. |
| Modify GPO + linked Tier 0 OU = Tier 0 compromise | Standard chain | Critical. |
| Detection: GPO ACL modify (Event 5136) | Defender | Adjacent. |
| Modern: minimal modify rights | Hardening | Standard. |
| Per-quarter GPO ACL audit | Standard | Compliance. |
^ad-gpoacl-rights

### GPO DACL audit

```powershell
Get-GPO -All | ForEach-Object {
  $gpo = $_
  $aclPath = "AD:CN={$($gpo.Id)},CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)"
  
  $nonDefault = (Get-Acl $aclPath).Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner") -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  }
  
  if ($nonDefault) {
    [PSCustomObject]@{
      GPO = $gpo.DisplayName
      Id = $gpo.Id
      NonDefaultModifiers = ($nonDefault.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## GPO Owner

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| GPO Owner | nTSecurityDescriptor.Owner | Standard. |
| Owner has implicit modify rights | Standard | Standard. |
| Default: creator (Group Policy Creator Owners group) | Standard | Standard. |
| BloodHound `Owns` edge | Visual | Tool. |
| `Get-GPO -DisplayName X | Select Owner` | RSAT | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| Stale ownership (old admin) | Audit | Standard. |
| Modify ownership: take ownership | Adjacent privesc | Adjacent. |
| Per-GPO ownership audit | Standard | Compliance. |
| Detection: ownership change events | Defender | Adjacent. |
| Modern: documented per-GPO owner | Standard | Compliance. |
| Compliance: minimal modify rights | Best practice | Standard. |
| Per-quarter ownership audit | Standard | Compliance. |
| BloodHound modify owner edges | Modern | Tool. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-gpoacl-owner

### GPO ownership audit

```powershell
# All GPO owners
Get-GPO -All | Select DisplayName,Owner |
  Where Owner -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM"
```

___

## WriteGPLink ACE

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| WriteGPLink = modify gPLink on OU | Adjacent | Standard. |
| Per-OU `gPLink` attribute | Direct | Standard. |
| Atacante can link new GPO to OU | Standard | Critical. |
| Atacante can unlink existing | Adjacent | Edge. |
| Atacante can enforce/disable links | Edge | Adjacent. |
| Combined with GPO modify = mass compromise | Standard chain | Critical. |
| Combined with GPO Creator Owners = create + link | Standard | Critical. |
| BloodHound `WriteGPLink` edge | Modern | Tool. |
| Per-OU ACL audit | Standard | Compliance. |
| Detection: gPLink modify events | Defender | Adjacent. |
| Modern: minimal modify rights | Best practice | Standard. |
| Per-quarter audit | Standard | Compliance. |
| Cross-correlate with priv tier | Standard | Audit. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Stale WriteGPLink | Audit | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-gpoacl-writegplink

### WriteGPLink audit

```powershell
$writeGPLinkGUID = "f30e3bbe-9ff0-11d1-b603-0000f80367c1"  # gPLink attribute

Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $dn = $_.DistinguishedName
  $acl = Get-Acl "AD:$dn"
  
  $writeGPLink = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    (
      ($_.ActiveDirectoryRights -match "WriteProperty" -and $_.ObjectType -eq $writeGPLinkGUID) -or
      $_.ActiveDirectoryRights -match "GenericAll|GenericWrite"
    ) -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  }
  
  if ($writeGPLink) {
    [PSCustomObject]@{
      OU = $_.Name
      Modifiers = ($writeGPLink.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## Group Policy Creator Owners Group

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Group Policy Creator Owners | RID 520 | Standard. |
| Members can create new GPOs | Standard | Standard. |
| Creator becomes GPO owner | Standard | Standard. |
| Default: empty | Best practice | Standard. |
| Members audit | Standard | Compliance. |
| Combined with WriteGPLink = mass compromise | Standard chain | Critical. |
| BloodHound priv group analysis | Standard | Tool. |
| Cross-correlate with WriteGPLink ACE | Standard | Audit. |
| Detection: GPO creation events (4719) | Defender | Adjacent. |
| Modern: minimal members | Best practice | Standard. |
| Per-quarter membership audit | Standard | Compliance. |
| Stale members | Audit | Standard. |
| Cleanup: empty group | Hygiene | Standard. |
| Cross-correlate priv tier | Standard | Audit. |
| Adjacent: Groups Enumeration hub | Cross-ref | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-gpoacl-gpocreator

### GPO Creator Owners audit

```powershell
# Members
Get-ADGroupMember "Group Policy Creator Owners" -Recursive |
  Select Name,SamAccountName,ObjectClass

# Default empty - any member is potential audit risk
```

___

## ACL Inheritance from Domain Root

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-GPO inheritance from container | `CN=Policies,CN=System,DC=...` | Standard. |
| Modify on Policies container = all GPOs | Critical | Critical. |
| Default: Domain Admins, Enterprise Admins | Standard | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| BloodHound container ACL edges | Modern | Tool. |
| Detection: container ACL modify | Defender | Adjacent. |
| Modern: minimal modify rights | Best practice | Standard. |
| Per-quarter container ACL audit | Standard | Compliance. |
| Stale container ACE | Audit | Standard. |
| Cleanup: minimal | Hygiene | Standard. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate cross-trust | Standard | Audit. |
| Modern: continuous monitoring | Defender | Standard. |
| Audit log retention | Standard | Adjacent. |
| Modern: extreme alerting | Best practice | Standard. |
^ad-gpoacl-inherit

### Container ACL audit

```powershell
$containerDN = "CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)"

(Get-Acl "AD:$containerDN").Access | Where {
  $_.AccessControlType -eq "Allow" -and
  ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|CreateChild") -and
  $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users|Domain Controllers"
}
```

___

## SYSVOL File Permissions

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| SYSVOL = NTFS share | Standard | Standard. |
| Per-GPO directory ACL | NTFS-level | Standard. |
| `\\dom\SYSVOL\dom\Policies\<GUID>\` | Standard path | Standard. |
| Default: Authenticated Users Read | Standard | Permissive. |
| Modify: Domain Admins, Enterprise Admins, Group Policy Creator Owners | Standard | Standard. |
| Atacante write SYSVOL = modify GPO content | Standard chain | Critical. |
| `Get-Acl \\dom\SYSVOL\dom\Policies\GUID\` | Native | Standard. |
| icacls native | Adjacent | Standard. |
| Cross-correlate with AD GPO ACL | Standard | Audit. |
| BloodHound SYSVOL ACL adjacent | Edge | Tool. |
| Detection: SYSVOL modify events | Defender | Adjacent. |
| Modern: minimal modify rights | Best practice | Standard. |
| Per-quarter SYSVOL audit | Standard | Compliance. |
| Stale SYSVOL ACE | Audit | Standard. |
| Cleanup: minimal | Hygiene | Standard. |
| Cross-correlate per-DC SYSVOL | Replicated | Standard. |
^ad-gpoacl-sysvol

### SYSVOL ACL audit

```powershell
# Per-GPO SYSVOL DACL
$gpoPath = "\\dom.local\SYSVOL\dom.local\Policies"

Get-ChildItem $gpoPath -Directory | ForEach-Object {
  $acl = Get-Acl $_.FullName
  $nonDefault = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.FileSystemRights -match "FullControl|Write|Modify") -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  }
  
  if ($nonDefault) {
    [PSCustomObject]@{
      GPO = $_.Name
      Modifiers = ($nonDefault.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## Cross-Correlate with Linked Tier 0 OUs

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| GPO modify + linked Tier 0 OU | CRITICAL | Critical. |
| GPO modify + linked DC OU | CRITICAL | Critical. |
| GPO modify + linked Servers OU | High | Audit. |
| GPO modify + linked Workstations OU | Medium-High | Audit. |
| Helpdesk with GPO modify rights | Cross-tier | Critical. |
| Service account with GPO modify | Common | Audit. |
| BloodHound priv GPO paths | Modern | Tool. |
| Cypher: paths via GPO to highvalue | Custom | Tool. |
| Detection: Tier 0 GPO modify | Defender critical | Defender. |
| Modern: extreme alerting | Best practice | Standard. |
| Per-quarter Tier 0 GPO audit | Standard | Compliance. |
| Modern: minimal modify Tier 0 | Best practice | Standard. |
| Cross-correlate GPO link enforced | Adjacent | Audit. |
| Cleanup: stale Tier 0 GPO ACE | Hygiene | Standard. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Compliance: documented Tier 0 baseline | Standard | Adjacent. |
^ad-gpoacl-tier0

### Tier 0 GPO modify audit (cross-correlate)

```powershell
# Find GPOs linked to Tier 0 OUs (DC, custom Tier 0)
$tier0OUs = "OU=Domain Controllers,$((Get-ADDomain).DistinguishedName)",
            "OU=Tier 0,$((Get-ADDomain).DistinguishedName)"

foreach ($ou in $tier0OUs) {
  $linkedGPOs = (Get-GPInheritance -Target $ou -ErrorAction SilentlyContinue).GpoLinks
  
  foreach ($link in $linkedGPOs) {
    $gpo = Get-GPO -Guid $link.GpoId
    $aclPath = "AD:CN={$($gpo.Id)},CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)"
    
    $modifiers = (Get-Acl $aclPath).Access | Where {
      $_.AccessControlType -eq "Allow" -and
      ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner") -and
      $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
    }
    
    if ($modifiers) {
      [PSCustomObject]@{
        GPO = $gpo.DisplayName
        LinkedTier0OU = $ou
        NonDefaultModifiers = $modifiers.IdentityReference -join '; '
      }
    }
  }
}
```

___

## BloodHound GPO Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `GpLink` | OU → GPO | Standard. |
| `Owns` on GPO | Implicit modify | Standard. |
| `WriteOwner` on GPO | 2-step | Standard. |
| `WriteDacl` on GPO | Modify ACL | Standard. |
| `GenericAll` on GPO | Full | Standard. |
| `GenericWrite` on GPO | Modify settings | Standard. |
| `WriteGPLink` on OU | Modify GPO link | Modern. |
| `WriteSpn` on Computer (adjacent) | Edge | Adjacent. |
| Cypher: paths via GPO | Custom | Tool. |
| Cross-correlate with linked OUs | Standard | Tool. |
| BHCE 5.x+ GPO support | Modern | Tool. |
| Visual graph | Helpful | Standard. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Compliance: GPO baseline | Standard | Adjacent. |
^ad-gpoacl-bh

### BloodHound GPO queries

```cypher
// All GPO modify paths
MATCH (u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(g:GPO)
RETURN u.name, g.name

// GPOs linked to highvalue OUs
MATCH (g:GPO)-[:GpLink]->(ou:OU)-[:Contains*1..]->(c:Computer {highvalue: true})
RETURN g.name, ou.name, c.name

// Owned principal can modify GPO linked to highvalue
MATCH (u {owned: true})-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|MemberOf*1..]->(g:GPO)
MATCH (g)-[:GpLink]->(ou:OU)-[:Contains*1..]->(target {highvalue: true})
RETURN u.name, g.name, ou.name, target.name
```

___

## Mitigations

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Strict GPO ACL | Best practice | Hardening. |
| Empty Group Policy Creator Owners | Best practice | Standard. |
| Minimal Tier 0 GPO modify | Best practice | Hardening. |
| Per-OU minimal WriteGPLink | Best practice | Hardening. |
| Detection: GPO modify events | Defender | Adjacent. |
| Microsoft Defender for Identity GPO alerts | Modern | Defender. |
| BloodHound continuous GPO audit | Modern | Tool. |
| PingCastle / Purple Knight GPO | Defender | Standard. |
| Per-quarter GPO ACL review | Standard | Compliance. |
| Documented per-GPO purpose | Standard | Compliance. |
| Stale GPO cleanup | Hygiene | Standard. |
| Modern: continuous monitoring | Defender | Standard. |
| Audit log retention | Standard | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate per-tier | Standard | Audit. |
| Modern: extreme alerting Tier 0 | Critical | Standard. |
^ad-gpoacl-mitigations

### Hardening commands

```powershell
# Audit Group Policy Creator Owners (should be empty)
Get-ADGroupMember "Group Policy Creator Owners" -Recursive

# Tighten Tier 0 GPO ACL (remove non-Tier 0 modifiers)
# Manual review per-GPO

# Detection: enable GPO change auditing
# Audit Policy: Audit Object Access → Directory Service Changes → Success
```

***
