---
aliases:
  - Domain Root ACL
  - AdminSDHolder Audit
  - DA Group ACL
  - ADCS Template ACL
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
# AD - ACL Enumeration - Object-Specific Audits

***

## Domain Root Object

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `DC=dom,DC=local` | Domain root | Top tier. |
| Default ACEs: DA, EA, Administrators, SYSTEM | Standard | Standard. |
| DCSync rights here | GetChanges + GetChangesAll | Critical. |
| WriteOwner here = ultimate Tier 0 | Critical | Critical. |
| WriteDACL here = grant DCSync | Critical | Critical. |
| GenericAll here = forest control | Critical | Critical. |
| Cross-correlate non-default principals | Audit | Standard. |
| BloodHound highvalue domain object | Visual | Tool. |
| Default Authenticated Users: Read | Standard | Standard. |
| Domain Computers: GenericAll on self | Edge | Standard. |
| Detection: ACL modify on domain root | Defender | Critical alert. |
| Modern: extreme minimal modify | Hardening | Standard. |
| Audit: every change reviewed | Compliance | Standard. |
| Forest root vs child domain root | Both critical | Adjacent. |
| Cross-trust read | Standard | Adjacent. |
| Modern: monitor 24x7 | Defender | Standard. |
^ad-objspec-domainroot

### Domain root audit

```powershell
# Domain root DACL (CRITICAL audit)
$domDN = (Get-ADDomain).DistinguishedName
Get-Acl "AD:$domDN" | Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Domain Controllers|Authenticated Users|Self"
  } |
  Select IdentityReference,ActiveDirectoryRights,InheritanceType,ObjectType
```

___

## Privileged Groups (DA, EA, Schema)

| **Group** | **Critical ACEs** | **Notas** |
|:---:|:---:|:---:|
| Domain Admins | Member attribute write = Add to DA | Critical. |
| Enterprise Admins | Forest-wide privilege | Critical. |
| Schema Admins | Schema modification | Critical. |
| Built-in Administrators | Per-host admin | Critical. |
| AdminSDHolder propagation | Standard | Adjacent. |
| Default holders: SYSTEM, EA, DA | Standard | Standard. |
| Cross-correlate non-default | Audit | Standard. |
| Stale modify rights | Audit | Standard. |
| Service accounts with member write | Common misconfig | Audit. |
| BloodHound `AddMember`/`AddSelf`/`GenericAll` edges | Tool | Standard. |
| `Member` attribute writes | AddMember | Standard. |
| `Self` extended right on group | AddSelf | Standard. |
| Modify rights via group nesting | Recursive | Standard. |
| Detection: priv group ACL modify | Defender | Critical alert. |
| Modern: minimal modify rights | Hardening | Standard. |
| Audit: per-group baseline | Compliance | Standard. |
^ad-objspec-privgroups

### Priv group ACL audit

```powershell
# DA group DACL
$daDN = (Get-ADGroup "Domain Admins").DistinguishedName
Get-Acl "AD:$daDN" | Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  } |
  Select IdentityReference,ActiveDirectoryRights

# EA + Schema (forest root only)
$forestRoot = (Get-ADForest).RootDomain
@("Enterprise Admins", "Schema Admins") | ForEach-Object {
  $g = Get-ADGroup -Identity $_ -Server $forestRoot
  Get-Acl "AD:$($g.DistinguishedName)" | Select -ExpandProperty Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
    } |
    Select @{n='Group';e={$_.IdentityReference}},IdentityReference,ActiveDirectoryRights
}
```

___

## AdminSDHolder Object

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `CN=AdminSDHolder,CN=System,DC=...` | DACL template | Standard. |
| SDProp process | Every 60min | Standard. |
| Propagates DACL to protected groups + members | Standard | Standard. |
| Protected groups list (default) | DA, EA, Schema, Administrators, Account Operators, Backup Operators, Server Operators, Print Operators, Replicators, Domain Controllers | Standard. |
| Modify AdminSDHolder ACL = persistent Tier 0 control | Critical | Critical. |
| BloodHound `WriteDacl` on AdminSDHolder | Visual | Tool. |
| Default holders: SYSTEM, DA, EA | Standard | Standard. |
| Cross-correlate non-default | Critical audit | Critical. |
| Detection: AdminSDHolder ACL modify | Defender | Critical alert. |
| Persistence: add ACE to AdminSDHolder | Stealth backdoor | Critical. |
| Modern: monitor 24x7 | Defender | Standard. |
| Audit: per-quarter | Compliance | Standard. |
| `dsHeuristics` flag controls auto-propagation | Edge | Edge. |
| Per-domain AdminSDHolder | Each domain | Standard. |
| Cross-domain SDProp | Edge | Edge. |
| Recovery: revert AdminSDHolder to baseline | Standard | Adjacent. |
^ad-objspec-adminsdholder

### AdminSDHolder audit

```powershell
# AdminSDHolder DACL (CRITICAL audit)
$asdh = "CN=AdminSDHolder,CN=System,$((Get-ADDomain).DistinguishedName)"

Get-Acl "AD:$asdh" | Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users"
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType

# Any non-default ACE = potential persistence backdoor
```

```cypher
// BloodHound
MATCH (u)-[:WriteDacl|WriteOwner|GenericAll]->(asdh)
WHERE asdh.name = "ADMINSDHOLDER@DOM.LOCAL"
RETURN u.name
```

___

## Computer Objects

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-computer DACL | Standard | Standard. |
| GenericAll on computer = full | Reset pwd, modify attrs | Privesc. |
| `WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity` = RBCD | Critical | Standard. |
| `WriteProperty msDS-KeyCredentialLink` = Shadow Cred | Modern | Standard. |
| `WriteProperty servicePrincipalName` = Targeted Kerberoast | Standard | Standard. |
| `ReadProperty ms-Mcs-AdmPwd` / `msLAPS-Password` = LAPS | Adjacent | Standard. |
| BloodHound computer ACL edges | Modern | Tool. |
| Self extended right (computer) = computer modifies own attrs | Standard | Standard. |
| Default: computer modifies own KeyCredentialLink | Self | Standard. |
| Cross-correlate priv computer | Tier 0 (DCs) | Critical. |
| DC computer ACL = forest control | Critical | Critical. |
| Stale ACE | Audit | Standard. |
| Per-host explicit override | Edge | Edge. |
| Modern: minimal computer ACE | Best practice | Standard. |
| Audit: bulk computer ACL | Compliance | Standard. |
| Detection: ACL modify on computers | Defender | Adjacent. |
^ad-objspec-computers

### Computer ACL audit

```powershell
# DC computer ACL (CRITICAL)
Get-ADComputer -Filter {OperatingSystem -like "*Server*" -and PrimaryGroupID -eq 516} |
  ForEach-Object {
    $dn = $_.DistinguishedName
    Write-Host "`n=== $($_.Name) ==="
    Get-Acl "AD:$dn" | Select -ExpandProperty Access |
      Where {
        $_.AccessControlType -eq "Allow" -and
        $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
      } |
      Select IdentityReference,ActiveDirectoryRights
  }

# All computers with msDS-AllowedToActOnBehalfOfOtherIdentity write rights
Get-ADComputer -Filter * | ForEach-Object {
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  $rbcdWrite = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ActiveDirectoryRights -match "WriteProperty|GenericAll|GenericWrite"
  }
  if ($rbcdWrite -and $rbcdWrite.IdentityReference -notmatch "Domain Admins|SYSTEM") {
    [PSCustomObject]@{
      Computer = $_.Name
      Modifiers = ($rbcdWrite.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## OU Objects

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-OU DACL | Granular | Standard. |
| GenericAll on OU = full control of contents | Standard | Privesc. |
| `WriteProperty gPLink` = modify GPO links | GPO Abuse | Standard. |
| CreateChild = create user/computer/group | Edge privesc | Edge. |
| WriteProperty Gpc-File-Sys-Path | SYSVOL modify | Edge. |
| BloodHound OU ACL edges | Modern | Tool. |
| Per-OU GPO inheritance impact | Standard | Standard. |
| Stale OU permissions | Audit | Standard. |
| Helpdesk per-OU delegation | Standard | Standard. |
| Tier-aware OU ACL | Best practice | Standard. |
| Detection: OU ACL modify | Defender | Adjacent. |
| Modern: minimal modify rights | Hardening | Standard. |
| Cross-OU inheritance | Standard | Standard. |
| Audit: per-OU baseline | Compliance | Standard. |
| Per-tier OU separation | Microsoft model | Standard. |
| Foreign principals on OU | Cross-trust | Critical. |
^ad-objspec-ous

### OU ACL audit

```powershell
# All OUs with non-default ACEs
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $dn = $_.DistinguishedName
  $acl = Get-Acl "AD:$dn"
  $nonDefault = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|CreateChild|WriteProperty") -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users"
  }
  if ($nonDefault) {
    [PSCustomObject]@{
      OU = $_.Name
      Modifiers = ($nonDefault.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## Group Policy Objects (GPOs)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| GPO ACL | Per-GPO | Standard. |
| GenericAll on GPO = modify settings | Standard | Privesc. |
| `WriteProperty gPCFileSysPath` | Edge | Edge. |
| Linked OUs determine scope | Standard | Standard. |
| Default Domain Policy GPO | Critical | Standard. |
| Domain Controllers Policy GPO | Critical | Standard. |
| BloodHound GPO ACL edges | Modern | Tool. |
| Cross-correlate with linked OUs | Standard | Tool. |
| Helpdesk GPO modify | Common misconfig | Audit. |
| Per-GPO ACL audit | Standard | Standard. |
| Stale GPO ownership | Audit | Standard. |
| Detection: GPO ACL modify | Defender | Adjacent. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Modern: minimal modify rights | Hardening | Standard. |
| GPO Creator Owners group → new GPO ownership | Standard | Standard. |
| Compliance: GPO change review | Standard | Adjacent. |
^ad-objspec-gpos

### GPO ACL audit

```powershell
Get-GPO -All | ForEach-Object {
  $gpo = $_
  $aclPath = "AD:CN={$($gpo.Id)},CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)"
  $acl = Get-Acl $aclPath
  
  $nonDefault = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner") -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users"
  }
  
  if ($nonDefault) {
    [PSCustomObject]@{
      GPO = $gpo.DisplayName
      Id = $gpo.Id
      Modifiers = ($nonDefault.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## ADCS Templates & CA Objects

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Cert Template ACL | Per-template | Standard. |
| `Enroll` permission | Required to request cert | Standard. |
| `AutoEnroll` permission | Auto-enrollment | Adjacent. |
| `WriteProperty` on template = ESC4 | Modify template config | Critical. |
| Vulnerable templates: ESC1, ESC2, ESC3, etc. | Standard | Standard. |
| CA object ACL | `CN=Enterprise CA,CN=Public Key Services,...` | Standard. |
| `Manage CA` permission | ESC7 | Critical. |
| `Manage Certificates` permission | ESC7 | Critical. |
| BloodHound ADCS edges | Modern (BHCE 5.x+) | Tool. |
| `certipy find -vulnerable` | Bulk audit | Standard. |
| Cross-correlate priv | Standard | Standard. |
| NTAuthCertificates ACL | ESC11 | Critical. |
| Cert Publishers group | Adjacent | Adjacent. |
| Detection: ADCS ACL modify | Defender | Adjacent. |
| Adjacent: ADCS Enumeration hub | Cross-ref | Adjacent. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
^ad-objspec-adcs

### ADCS ACL audit

```bash
# Certipy bulk vulnerable scan
certipy find -u user -p pass -dc-ip DC -vulnerable -enabled

# Output: ESC1-ESC15 vulnerable templates + CA misconfigs
```

```powershell
# Per-template DACL (manual)
$templatePath = "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local"
Get-ChildItem "AD:$templatePath" | ForEach-Object {
  Get-Acl "AD:$($_.DistinguishedName)" |
    Select -ExpandProperty Access |
    Where {
      $_.ActiveDirectoryRights -match "WriteProperty|GenericAll|GenericWrite|WriteDACL"
    }
}
```

___

## Bulk Forest-Wide Audit

| **Audit** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Per-domain bulk | Standard | Adjacent. |
| Forest-wide via foreach | Iterate domains | Standard. |
| `Find-InterestingDomainAcl` per domain | PowerView | Adjacent. |
| Custom Cypher BloodHound | Forest-wide | Tool. |
| ADRecon ACL section | Per-domain | Standard. |
| PingCastle ACL findings | Defender | Standard. |
| Purple Knight ACL | Defender | Standard. |
| Microsoft Defender for Identity | Modern detection | Defender. |
| Compliance: documented baseline | Standard | Adjacent. |
| Stale ACE detection | Audit | Standard. |
| Per-quarter audit | Standard ops | Adjacent. |
| Cross-trust ACL | Forest-wide | Adjacent. |
| Foreign principals in ACL | Critical | Audit. |
| Detection: bulk ACL changes | Defender ML | Modern. |
| Audit log retention | Standard | Adjacent. |
| BloodHound continuous | Modern | Tool. |
^ad-objspec-bulk

### Forest-wide audit

```powershell
$forest = Get-ADForest

foreach ($d in $forest.Domains) {
  Write-Host "`n=== $d ==="
  
  $domDN = (Get-ADDomain -Identity $d).DistinguishedName
  
  # Domain root
  $rootAcl = Get-Acl "AD:$domDN" | Select -ExpandProperty Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner|ExtendedRight") -and
      $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users|Domain Controllers"
    }
  
  if ($rootAcl) {
    Write-Host "Domain root non-default ACEs:"
    $rootAcl | Select IdentityReference,ActiveDirectoryRights | Format-Table
  }
  
  # AdminSDHolder per domain
  $asdh = "CN=AdminSDHolder,CN=System,$domDN"
  $asdhAcl = Get-Acl "AD:$asdh" | Select -ExpandProperty Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Authenticated Users"
    }
  
  if ($asdhAcl) {
    Write-Host "AdminSDHolder non-default ACEs:"
    $asdhAcl | Select IdentityReference,ActiveDirectoryRights | Format-Table
  }
}
```

***
