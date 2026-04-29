---
aliases:
  - LAPS ACL Audit
  - LAPS Readers
  - Find-AdmPwdExtendedRights
  - LAPS Permission Discovery
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
  - "[[AD - ACL Enumeration]]"
---
# AD - LAPS Enumeration - LAPS Permission Audit

***

## Required Permissions for LAPS Read

| **Permission** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| `ReadProperty` on `ms-Mcs-AdmPwd` | LAPSv1 read | Granular. |
| `ReadProperty` on `msLAPS-Password` | LAPSv2 cleartext read | Granular. |
| `ReadProperty` on `msLAPS-EncryptedPassword` | LAPSv2 encrypted blob read | Granular. |
| `Control Access` extended right | Bypass Confidential flag | Specific. |
| `GenericAll` on computer | Full control = all reads | ACL combo. |
| `GenericRead` on computer | Read all attributes | ACL combo. |
| `AllExtendedRights` | All extended rights including LAPS | Often-overlooked. |
| Decryption: encryption principal SID member | LAPSv2 encrypted | Standard. |
| Inherited from OU | Per-OU permission | Standard. |
| Per-computer override | Edge | Edge. |
| `Self` extended right | Computer reads own | Edge. |
| Cross-OU inheritance unintended | Audit risk | Audit. |
| Modern: Confidential flag default | LAPSv2 standard | Hardening. |
| Default Authenticated Users blocked | Standard | Standard. |
| Best practice: minimal readers | Tier 0 + per-tier helpdesk | Standard. |
| Audit: BloodHound `ReadLAPSPassword` edge | Modern | Tool. |
^ad-laps-perm-required

### Permission required check

```powershell
# Check Confidential flag (CONFIDENTIAL = 128)
$lapsAttrs = "ms-Mcs-AdmPwd","msLAPS-Password","msLAPS-EncryptedPassword"

foreach ($attr in $lapsAttrs) {
  $obj = Get-ADObject -SearchBase "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)" `
    -Filter "Name -eq '$attr'" -Properties searchFlags
  if ($obj) {
    $confidential = ($obj.searchFlags -band 128) -ne 0
    Write-Host "$attr Confidential: $confidential"
  }
}
```

___

## Per-Computer ACL Audit

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=host,..."` | RSAT ACL | Standard. |
| Filter `ReadProperty` on LAPS attrs | Specific | Standard. |
| `dsacls "CN=host,..."` | Native | Adjacent. |
| LAPS attribute GUID for filter | Specific GUID per attr | LDAP. |
| `Get-ObjectAcl -DistinguishedName host -ResolveGUIDs` | PowerView | Adjacent. |
| `Find-AdmPwdExtendedRights` | LAPSv1 native helper | Standard. |
| `Find-LapsADExtendedRights` | LAPSv2 native helper | Modern. |
| Bulk audit per-OU | Standard | Standard. |
| Authenticated Users in ACL | Risk audit | Critical. |
| Cross-correlate with priv group | Standard | Audit. |
| Per-OU inheritance impact | Standard | Standard. |
| Per-host explicit override | Edge | Edge. |
| BloodyAD ACL audit | LDAP modify | Adjacent. |
| `bloodyAD --resolve-sd` | Decoded SDDL | Linux. |
| Detection: LAPS ACL modify events | Defender | Adjacent. |
| Audit: minimal readers | Best practice | Standard. |
^ad-laps-perm-acl

### ACL audit per-OU

```powershell
$ou = "OU=Workstations,DC=dom,DC=local"

# All computers in OU + their LAPS readers
Get-ADComputer -SearchBase $ou -Filter * | ForEach-Object {
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  $readers = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "ReadProperty|GenericAll|GenericRead|AllExtendedRights") -and
    $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins"
  }
  
  if ($readers) {
    [PSCustomObject]@{
      Computer = $_.Name
      Readers = ($readers.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

```bash
# Linux LDAP via bloodyAD
bloodyAD --host DC -d dom -u user -p pass \
  get object "CN=WS01,CN=Computers,DC=dom,DC=local" --resolve-sd
```

___

## Native LAPS Helper Tools

| **Comando** | **Function** | **Notas** |
|:---:|:---:|:---:|
| `Find-AdmPwdExtendedRights -Identity OU` | LAPSv1 readers | Native. |
| `Find-LapsADExtendedRights -Identity OU` | LAPSv2 readers | Native. |
| `Set-AdmPwdReadPasswordPermission` | LAPSv1 grant | Privileged. |
| `Set-LapsADReadPasswordPermission` | LAPSv2 grant | Privileged. |
| `Set-AdmPwdResetPasswordPermission` | LAPSv1 reset | Privileged. |
| `Set-LapsADResetPasswordPermission` | LAPSv2 reset | Privileged. |
| `Set-AdmPwdComputerSelfPermission` | Computer self-update | Privileged. |
| `Update-AdmPwdADSchema` | LAPSv1 schema extension | Privileged. |
| `Update-LapsADSchema` | LAPSv2 schema extension | Privileged. |
| Module: `AdmPwd.PS` (LAPSv1) | Install with LAPS MSI | Standard. |
| Module: `LAPS` (LAPSv2 native) | Server 2022+ | Standard. |
| Per-OU enumeration | Standard | Standard. |
| Recursive enumeration | Edge | Edge. |
| Audit output | LDIF/CSV | Standard. |
| Modern best: native LAPS module | Standard | Standard. |
| Compliance: periodic audit | Standard | Adjacent. |
^ad-laps-perm-native

### Native helpers

```powershell
# LAPSv1 (legacy)
Import-Module AdmPwd.PS

# Find readers per OU
Find-AdmPwdExtendedRights -Identity "OU=Workstations,DC=dom,DC=local" |
  Select ObjectDN,ExtendedRightHolder

# Per-OU recursive (manual)
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $rights = Find-AdmPwdExtendedRights -Identity $_ -ErrorAction SilentlyContinue
  if ($rights) {
    [PSCustomObject]@{
      OU = $_.Name
      Readers = ($rights.ExtendedRightHolder | Sort -Unique) -join '; '
    }
  }
}
```

```powershell
# LAPSv2 (modern)
Import-Module LAPS

Find-LapsADExtendedRights -Identity "OU=Workstations,DC=dom,DC=local"
```

___

## Recursive Group Membership Analysis

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| LAPS ACE granted to group | Members can read | Standard. |
| Recursive expansion required | Nested groups | Standard. |
| `Get-ADGroupMember -Recursive` | RSAT recursive | Standard. |
| Foreign principals in reader group | Cross-trust read | Critical. |
| Service accounts as readers | Common | Audit. |
| BloodHound `ReadLAPSPassword` edge | Visualizes recursive | Tool. |
| Cross-correlate effective LAPS readers | Per-tier model | Standard. |
| Tier 0 admins typically read all | Best practice | Standard. |
| Helpdesk groups read workstations | Tiered | Best practice. |
| Stale group members | Audit | Standard. |
| Custom IT support groups | Per-org | Edge. |
| Vendor/contractor groups with read | Cross-org risk | Audit. |
| Authenticated Users in reader chain | Critical | Detection. |
| Pre-Windows 2000 group | Edge legacy | Edge. |
| Cross-OU inheritance | Indirect | Standard. |
| Audit: per-OU effective readers (recursive) | Standard | Compliance. |
^ad-laps-perm-recursive

### Recursive readers per-OU

```powershell
$ou = "OU=Workstations,DC=dom,DC=local"

# Step 1: Find groups with LAPS read on OU
$readers = Find-LapsADExtendedRights -Identity $ou |
  Select -ExpandProperty ExtendedRightHolder |
  Sort -Unique

# Step 2: Resolve to recursive members
$effectiveUsers = @{}
foreach ($principal in $readers) {
  if ($principal -match "^Group:\s*(.*)") {
    $groupName = $Matches[1]
    Get-ADGroupMember $groupName -Recursive | ForEach-Object {
      $effectiveUsers[$_.SamAccountName] = $_
    }
  }
}

# Step 3: Display effective users
$effectiveUsers.Values | Select Name,SamAccountName,@{n='Source';e={"LAPS reader on $ou"}}
```

___

## BloodHound LAPS Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `ReadLAPSPassword` | Direct LAPS read permission | Standard. |
| `MemberOf` → group with LAPS read | Indirect | Standard. |
| `GenericAll` → computer | Full control = LAPS read | ACL combo. |
| `GenericRead` → computer | Read all attrs | ACL combo. |
| `AllExtendedRights` → computer | Includes LAPS | Standard. |
| Cypher: find LAPS readers | `MATCH (u)-[:ReadLAPSPassword]->(c:Computer)` | Custom. |
| Cypher: cross-correlate priv | `WHERE u.adminCount=true` | Targeted. |
| Cypher: privileged reader paths | Multi-edge chains | Standard. |
| Cypher: foreign LAPS readers | Cross-trust | Critical. |
| BloodHound CE 5.x+ improved LAPS | Modern | Tool. |
| Per-domain ingest | Multi-domain LAPS | Adjacent. |
| Visual: LAPS reader graph | Useful | Standard. |
| Custom analytics scripts | Cypher | Tool. |
| Per-OU LAPS coverage | Custom | Standard. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Audit baseline | BloodHound CE | Standard. |
^ad-laps-perm-bh

### BloodHound LAPS Cypher

```cypher
// All LAPS readers
MATCH p=(u)-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer)
RETURN p

// Privileged users with LAPS read access (CRITICAL audit)
MATCH (u:User {adminCount: true})
MATCH p=(u)-[:MemberOf|ReadLAPSPassword*1..]->(c:Computer)
RETURN u.name, c.name, p

// Foreign principals reading LAPS (cross-trust)
MATCH (u)-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer)
WHERE u.domain <> c.domain
RETURN u.name, c.name

// Authenticated Users with LAPS read (CRITICAL misconfig)
MATCH (u {name: "AUTHENTICATED USERS@DOM.LOCAL"})
MATCH p=(u)-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer)
RETURN p
```

___

## LAPS Permissions Misconfigurations

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Authenticated Users with LAPS read | Anyone in domain reads | Critical. |
| Domain Users with LAPS read | Same | Critical. |
| Confidential flag not set | Authenticated Users default read | Critical. |
| Helpdesk group with read on Tier 0 OU | Cross-tier | Critical. |
| Service account as reader | Common audit finding | Audit. |
| Vendor/contractor read | Cross-org | Audit. |
| Stale group members | Old delegations | Audit. |
| Cross-OU inheritance unintended | Indirect | Audit. |
| Per-host explicit grant outside policy | Anomaly | Detection. |
| Empty reader list (no one reads) | Edge | Audit. |
| Encryption principal too broad | LAPSv2 specific | Audit. |
| Encryption principal = Domain Users | Critical | Critical. |
| Per-OU encryption principal mismatch | Migration leftover | Edge. |
| Foreign principals in reader chain | Cross-trust | Critical. |
| Stale stored LAPS passwords | Old read activity | Audit. |
| Detection: LAPS read by non-tier-aligned principal | Defender | Adjacent. |
^ad-laps-perm-misconfig

### LAPS permission misconfig detection

```powershell
# Find computers where Authenticated Users can read LAPS
Get-ADComputer -Filter * | ForEach-Object {
  $dn = $_.DistinguishedName
  $acl = Get-Acl "AD:$dn"
  
  $authUsersRead = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -eq "NT AUTHORITY\Authenticated Users" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericRead|ReadProperty|AllExtendedRights")
  }
  
  if ($authUsersRead) {
    Write-Host "[!] $($_.Name) — Authenticated Users have LAPS read access" -ForegroundColor Red
  }
}

# Find computers where service accounts read LAPS
Get-ADComputer -Filter * | ForEach-Object {
  $dn = $_.DistinguishedName
  $acl = Get-Acl "AD:$dn"
  
  $svcReaders = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -match "svc-|service|backup" -and
    ($_.ActiveDirectoryRights -match "ReadProperty|GenericAll|AllExtendedRights")
  }
  
  if ($svcReaders) {
    [PSCustomObject]@{
      Computer = $_.Name
      ServiceReaders = ($svcReaders.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## LAPS Read Detection (Defender Side)

| **Event** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Event ID 4662 (Object access) | Per-attribute access | Defender. |
| Filter: ms-Mcs-AdmPwd or msLAPS-Password GUID | Specific LAPS reads | Filter. |
| Sysmon Event ID 11 | File creation | Adjacent. |
| Sysmon Event ID 17/18 | Pipe events | Adjacent. |
| BloodHound collection events | Atacante recon | Detection. |
| Bulk LAPS reads | Anomaly | Defender. |
| Single-user multiple host reads | Pattern | Detection. |
| Cross-OU LAPS reads | Audit anomaly | Defender. |
| Authenticated Users LAPS read | Critical alert | Defender. |
| Atacante OPSEC: low-frequency reads | Standard | OPSEC. |
| Defender for Identity LAPS alerts | Modern | Defender. |
| Sentinel SIEM rules | Cloud SIEM | Modern. |
| ATA legacy alerts | Legacy | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Honeypot computers (LAPS read alert) | Defender plant | Detection. |
| Detection: LAPS GPO modify events | Edge | Defender. |
^ad-laps-perm-detection

### Defender event filters

```
Event Viewer:
- Security log
- Filter: Event ID 4662
- Detail: Properties contain "LAPS attribute GUID"

LAPSv1 GUID: 4f80a5cc-d4d0-4bcf-bcc9-97e0e4d1f1e1 (typical)
LAPSv2 GUID: dependent on schema extension

Sysmon LAPS-aware rules:
- Custom Sysmon config to flag specific GUID accesses
- High-volume LAPS reads = alert
```

___

## Audit Best Practices

| **Practice** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Periodic LAPS reader audit | Quarterly | Standard. |
| Compliance: minimal readers | Best practice | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| Document expected readers | Per-OU baseline | Standard. |
| Anomaly detection: deviation from baseline | Defender | Adjacent. |
| Removal cleanup | Stale delegations | Hygiene. |
| Modern best: encryption + minimal principals | Standard | Hardening. |
| Migration audit: LAPSv1 → LAPSv2 | Per-org | Adjacent. |
| Compliance frameworks (PCI / NIST) | Per-standard | Standard. |
| Tiered admin model | Microsoft | Standard. |
| BloodHound continuous audit | Modern | Tool. |
| PingCastle LAPS section | Defender | Standard. |
| Purple Knight LAPS | Defender | Standard. |
| Defender for Identity continuous | Cloud | Modern. |
| Custom audit scripts | DIY | Standard. |
| Compliance reports | Per-org | Adjacent. |
^ad-laps-perm-audit

### Audit script (comprehensive)

```powershell
# LAPS comprehensive audit report
$ous = Get-ADOrganizationalUnit -Filter *

$report = @()
foreach ($ou in $ous) {
  $computers = Get-ADComputer -SearchBase $ou.DistinguishedName -Filter * `
    -Properties ms-Mcs-AdmPwd,msLAPS-Password,msLAPS-EncryptedPassword
  
  if ($computers.Count -gt 0) {
    $lapsv1 = ($computers | Where 'ms-Mcs-AdmPwd').Count
    $lapsv2_clear = ($computers | Where 'msLAPS-Password').Count
    $lapsv2_enc = ($computers | Where 'msLAPS-EncryptedPassword').Count
    
    # Per-OU readers
    $readers = $computers | ForEach-Object {
      (Get-Acl "AD:$($_.DistinguishedName)").Access | Where {
        $_.ActiveDirectoryRights -match "ReadProperty|GenericAll|AllExtendedRights"
      } | Select -ExpandProperty IdentityReference
    } | Sort -Unique
    
    $report += [PSCustomObject]@{
      OU = $ou.Name
      Total = $computers.Count
      LAPSv1 = $lapsv1
      LAPSv2Clear = $lapsv2_clear
      LAPSv2Encrypted = $lapsv2_enc
      ReadersCount = $readers.Count
      ReadersList = ($readers | Where {$_ -notmatch "BUILTIN|NT AUTHORITY|SYSTEM"}) -join '; '
    }
  }
}

$report | Format-Table -AutoSize
$report | Export-Csv laps_audit.csv -NoTypeInformation
```

***
