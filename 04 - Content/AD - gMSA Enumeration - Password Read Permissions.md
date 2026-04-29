---
aliases:
  - msDS-GroupMSAMembership
  - gMSA Password Readers
  - PrincipalsAllowedToRetrieveManagedPassword
  - gMSA ACL
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
  - "[[AD - gMSA Enumeration]]"
---
# AD - gMSA Enumeration - Password Read Permissions

***

## msDS-GroupMSAMembership Attribute

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `msDS-GroupMSAMembership` | Security descriptor (SDDL) | Critical attr. |
| Defines who can read gMSA password | Directly | Standard. |
| `PrincipalsAllowedToRetrieveManagedPassword` | RSAT-friendly equivalent | Standard. |
| Per-gMSA setting | Granular | Standard. |
| Common values: groups, computers, users | Flexible | Standard. |
| Computer accounts as readers | gMSA bound to host | Standard. |
| Group readers | Members can read | Standard. |
| User readers | Edge — direct user | Edge. |
| Authenticated Users as reader | Critical misconfig | Critical. |
| Domain Computers as reader | Audit risk | Audit. |
| Per-OU group readers | Common pattern | Standard. |
| Cross-correlate group with priv | Standard | Audit. |
| Modify requires write permission | Privileged | Standard. |
| `Set-ADServiceAccount -PrincipalsAllowedToRetrieveManagedPassword` | RSAT modify | Privileged. |
| Detection: msDS-GroupMSAMembership modify events | Defender | Adjacent. |
| BloodHound `ReadGMSAPassword` edge | Modern | Tool. |
^ad-gmsa-perm-membership

### msDS-GroupMSAMembership inspection

```powershell
# Per-gMSA password readers
Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword |
  Select Name,SamAccountName,
    @{n='Readers';e={$_.PrincipalsAllowedToRetrieveManagedPassword -join '; '}}

# Specific gMSA detail
Get-ADServiceAccount -Identity gMSA-svc01 -Properties * |
  Select Name,PrincipalsAllowedToRetrieveManagedPassword,HostComputers,ServicePrincipalNames
```

```bash
# LDAP raw (decoded SDDL)
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=gMSA-svc01,CN=Managed Service Accounts,DC=dom,DC=local" \
  -s base "(objectClass=*)" msDS-GroupMSAMembership

# Decode SDDL via bloodyAD
bloodyAD --host DC -d dom -u user -p pass \
  get object "CN=gMSA-svc01,..." --resolve-sd
```

___

## Recursive Group Expansion for Readers

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Reader = group | Members + nested members can read | Standard. |
| `Get-ADGroupMember -Recursive` | Resolve transitive | Standard. |
| Foreign principals in reader chain | Cross-trust read | Critical. |
| Service accounts as transitive readers | Common audit | Audit. |
| Stale members | Old delegations | Audit. |
| BloodHound `ReadGMSAPassword` edge | Visualizes recursive | Tool. |
| Cross-correlate with priv | Standard | Audit. |
| Tier 0 admins typically | Best practice | Standard. |
| Custom IT support groups | Common | Edge. |
| Authenticated Users in chain | Critical misconfig | Critical. |
| Per-tier reader audit | Tiered model | Standard. |
| Computer accounts as readers | Standard | Standard. |
| Cluster members reading | Edge | Edge. |
| Detection: recursive ACL changes | Defender | Adjacent. |
| Audit: minimal reader principals | Best practice | Standard. |
| Compliance: documented readers | Standard | Compliance. |
^ad-gmsa-perm-recursive

### Recursive readers per gMSA

```powershell
$gmsa = Get-ADServiceAccount -Identity gMSA-svc01 -Properties PrincipalsAllowedToRetrieveManagedPassword

$effectiveReaders = @{}
foreach ($principal in $gmsa.PrincipalsAllowedToRetrieveManagedPassword) {
  try {
    $obj = Get-ADObject -Identity $principal -Properties ObjectClass -ErrorAction SilentlyContinue
    if ($obj.ObjectClass -eq "group") {
      Get-ADGroupMember $obj -Recursive | ForEach-Object {
        $effectiveReaders[$_.SamAccountName] = $_
      }
    } else {
      $effectiveReaders[$obj.Name] = $obj
    }
  } catch {}
}

$effectiveReaders.Values | Select Name,SamAccountName,ObjectClass
```

___

## ACL on gMSA Object Itself

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-gMSA DACL | Standard | Standard. |
| Read attributes | Authenticated Users default | Standard. |
| Read msDS-ManagedPassword | Restricted via msDS-GroupMSAMembership | Standard. |
| Modify gMSA ACL = privesc | Add self to readers | ACL Abuse. |
| `Get-Acl "AD:CN=gMSA,..."` | RSAT | Standard. |
| `WriteProperty msDS-GroupMSAMembership` | Modify readers | Critical. |
| `GenericAll` on gMSA | Full control = read | Privesc combo. |
| `GenericWrite` on gMSA | Modify membership | Privesc combo. |
| `WriteDACL` on gMSA | Self-grant Generic All | Two-step. |
| ACL inheritance from container | Standard | Standard. |
| Per-OU ACL impact | Adjacent | Adjacent. |
| Detection: gMSA ACL modify | Defender | Adjacent. |
| BloodHound gMSA ACL edges | Modern | Tool. |
| Cross-correlate with priv | Standard | Audit. |
| Compliance: minimal modify rights | Best practice | Standard. |
| Audit: stale ACL changes | Standard | Standard. |
^ad-gmsa-perm-acl

### gMSA DACL audit

```powershell
$gmsa = "CN=gMSA-svc01,CN=Managed Service Accounts,DC=dom,DC=local"

# Full DACL
Get-Acl "AD:$gmsa" | Select -ExpandProperty Access |
  Where AccessControlType -eq "Allow" |
  Select IdentityReference,ActiveDirectoryRights,InheritanceType

# Filter for dangerous rights
Get-Acl "AD:$gmsa" | Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|WriteProperty") -and
    $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins"
  }
```

___

## Computer Accounts as Readers

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Computer hosting gMSA reads password | Standard | Standard. |
| Per-host computer account | `<hostname>$` | Standard. |
| Multiple computers reading same gMSA | Cluster scenario | Standard. |
| `Get-ADServiceAccount -Properties HostComputers` | Direct query | Standard. |
| Atacante with computer admin → gMSA | Local admin = gMSA password | Standard. |
| LSASS dump on computer reading gMSA | Mimikatz | Adjacent. |
| Computer account hash | Itself reads gMSA via auth | Standard. |
| Bulk computers reading gMSA | Wide attack surface | Audit. |
| Atacante in computer account context | Read gMSA | Standard. |
| `runas /netonly /user:dom\computer$` (with hash) | Edge | Edge. |
| BloodHound computer→gMSA edges | Visual | Tool. |
| Cross-correlate with computer priv | Tier model | Audit. |
| Modern: dMSA delegated | Edge new | Adjacent. |
| Detection: computer-context gMSA reads | Defender | Adjacent. |
| Audit: which computers read | Standard | Standard. |
| Compliance: minimal hosts | Best practice | Standard. |
^ad-gmsa-perm-computers

### Computer readers audit

```powershell
# Per-gMSA host computers
Get-ADServiceAccount -Filter * -Properties HostComputers |
  Select Name,@{n='Hosts';e={$_.HostComputers -join '; '}}

# Compromise host → gMSA password access
# As Computer Admin/SYSTEM:
# Install-ADServiceAccount gMSA-svc01
# Test-ADServiceAccount gMSA-svc01 → True if can read password
```

___

## Privileged gMSA Identification

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| gMSA in DA / EA / Schema Admins | Critical privesc | Critical. |
| gMSA with adminCount=1 | Tier 0 marker | Privileged. |
| gMSA with TRUSTED_FOR_DELEGATION | UD | Critical. |
| gMSA with constrained delegation | Privileged | Standard. |
| gMSA with high SPN count | Common service | Adjacent. |
| gMSA reading other gMSAs | Cascading | Edge. |
| Cross-correlate gMSA member of priv group | Standard | Audit. |
| Stale privileged gMSAs | Old delegation | Audit. |
| gMSA in Backup Operators | DC privesc path | Critical. |
| gMSA in Server Operators | DC privesc path | Critical. |
| gMSA in Account Operators | Tier 1 privesc | Audit. |
| Foreign gMSA in priv groups | Cross-trust | Critical. |
| BloodHound priv gMSA query | Cypher | Tool. |
| Audit: gMSA tier alignment | Best practice | Standard. |
| Detection: gMSA priv group adds | Defender | Adjacent. |
| Compliance: minimal privileged gMSAs | Standard | Standard. |
^ad-gmsa-perm-privileged

### Privileged gMSA audit

```powershell
# All gMSAs + their privileged group memberships
Get-ADServiceAccount -Filter * -Properties MemberOf,AdminCount,UserAccountControl |
  ForEach-Object {
    $gmsa = $_
    $privGroups = $gmsa.MemberOf | ForEach-Object {
      $g = Get-ADGroup $_ -Properties AdminCount -ErrorAction SilentlyContinue
      if ($g.AdminCount -eq 1) { $g.Name }
    }
    
    if ($privGroups) {
      [PSCustomObject]@{
        gMSA = $gmsa.SamAccountName
        AdminCount = $gmsa.AdminCount
        UAC = $gmsa.UserAccountControl
        PrivGroups = $privGroups -join '; '
      }
    }
  }
```

___

## BloodHound gMSA Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `ReadGMSAPassword` | Direct gMSA password read | Modern edge. |
| `MemberOf` → group → gMSA | Indirect via group | Standard. |
| `GenericAll` → gMSA | Full control = read | Privesc combo. |
| `GenericWrite` → gMSA | Modify readers | Privesc combo. |
| `WriteDACL` → gMSA | Self-grant | Privesc combo. |
| Cypher: find gMSA readers | `MATCH (u)-[:ReadGMSAPassword]->(g)` | Standard. |
| Cypher: privileged readers | `WHERE u.adminCount=true` | Targeted. |
| Cypher: cross-trust readers | `WHERE u.domain<>g.domain` | Critical. |
| BloodHound CE 5.x+ gMSA support | Modern | Tool. |
| RustHound gMSA collection | Modern | Tool. |
| BloodHound.py gMSA | `-c GMSA` | Linux. |
| Per-domain ingest | Multi-domain | Adjacent. |
| Custom Cypher analytics | Standard | Tool. |
| Visual graph | Helpful | Standard. |
| Detection: BloodHound collection | Defender | Adjacent. |
| Audit baseline | Modern | Standard. |
^ad-gmsa-perm-bh

### BloodHound gMSA Cypher

```cypher
// All gMSA readers
MATCH p=(u)-[:ReadGMSAPassword|MemberOf*1..]->(g:User)
WHERE g.gmsa = true
RETURN p

// Privileged users with gMSA read
MATCH (u:User {adminCount: true})
MATCH p=(u)-[:MemberOf|ReadGMSAPassword*1..]->(g:User)
WHERE g.gmsa = true
RETURN u.name, g.name, p

// Path: owned → gMSA → privileged group via gMSA
MATCH (owned {owned: true}), (g:User)
WHERE g.gmsa = true
MATCH p1=shortestPath((owned)-[:ReadGMSAPassword|MemberOf*1..]->(g))
MATCH p2=shortestPath((g)-[:MemberOf*1..]->(:Group {name: "DOMAIN ADMINS@DOM.LOCAL"}))
RETURN p1, p2
```

___

## Common Misconfigurations

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Authenticated Users in PrincipalsAllowedToRetrieveManagedPassword | Anyone reads gMSA | Critical. |
| Domain Users as readers | Same | Critical. |
| Domain Computers as readers | All hosts | Audit. |
| gMSA in DA / EA | Privileged service account | Audit. |
| Helpdesk reading Tier 0 gMSA | Cross-tier | Critical. |
| Service accounts as readers | Common practice | Audit. |
| Stale group members | Old delegations | Audit. |
| Per-host explicit override | Edge | Edge. |
| Cross-trust gMSA read | Forest-wide risk | Critical. |
| GenericAll on gMSA via group | ACL combo | Critical. |
| Modify rights too broad | Account Operators etc | Audit. |
| KDS Root Key access too broad | Forest-wide | Audit. |
| Detection: Authenticated Users reader | Defender alert | Critical. |
| Detection: gMSA ACL modify | Defender | Adjacent. |
| Compliance: documented + minimal | Standard | Standard. |
| Audit: tier alignment | Best practice | Standard. |
^ad-gmsa-perm-misconfig

### Misconfig detection

```powershell
# gMSAs with Authenticated Users in readers (CRITICAL)
Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword |
  Where {
    $_.PrincipalsAllowedToRetrieveManagedPassword -match "Authenticated Users|Domain Users"
  } |
  Select Name,SamAccountName,PrincipalsAllowedToRetrieveManagedPassword

# gMSAs with broad service group readers
Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword |
  ForEach-Object {
    $gmsa = $_
    $broadReaders = $gmsa.PrincipalsAllowedToRetrieveManagedPassword |
      Where {$_ -match "Domain Computers|Authenticated Users"}
    if ($broadReaders) {
      [PSCustomObject]@{
        gMSA = $gmsa.Name
        BroadReaders = $broadReaders -join '; '
      }
    }
  }

# gMSAs in privileged groups
Get-ADServiceAccount -Filter * -Properties MemberOf |
  ForEach-Object {
    $privMembers = $_.MemberOf | Where {
      $_ -match "Domain Admins|Enterprise Admins|Schema Admins"
    }
    if ($privMembers) {
      [PSCustomObject]@{
        gMSA = $_.Name
        PrivGroups = $privMembers -join '; '
      }
    }
  }
```

***
