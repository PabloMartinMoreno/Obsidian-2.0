---
aliases:
  - OU Tree Enumeration
  - AD Containers
  - Default Containers
  - Tier 0 OU Discovery
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
  - "[[AD - Hosts Enumeration]]"
---
# AD - Hosts Enumeration - OUs & Containers

***

## OU Tree Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADOrganizationalUnit -Filter *` | All OUs | RSAT. |
| `Get-ADOrganizationalUnit -Filter * -SearchScope OneLevel` | Top-level only | Initial overview. |
| `Get-ADOrganizationalUnit -Filter * | Sort DistinguishedName` | Sorted tree | Hierarchy view. |
| `Get-ADObject -Filter "objectClass -eq 'organizationalUnit'"` | Generic obj filter | Alt. |
| `Get-NetOU` (PowerView) | Adversary | Same. |
| `Get-DomainOU` (PowerView v3) | Newer | Adjacent. |
| `dsquery ou -limit 0` | Legacy | All OUs. |
| `ldapsearch -h DC -D u -w p -b "DC=dom,DC=local" "(objectClass=organizationalUnit)" ou distinguishedName` | Linux | Direct. |
| `nxc ldap DC -u u -p p --query "(objectClass=organizationalUnit)" "ou,distinguishedName"` | netexec | Quick. |
| `windapsearch -d <dom> --dc-ip DC -u user -p pass --ous` | Wrapper | Helper. |
| `Get-ADObject -SearchBase "OU=X,DC=dom,DC=local" -Filter * -SearchScope OneLevel` | Per-OU contents | Drilldown. |
| OU tree depth | Indicates org complexity | Fingerprint. |
| Naming patterns | "Servers", "Workstations", "Tier0" — design intent | Recon. |
| Empty OUs (suspicious) | Possible staging or legacy | Audit. |
| OUs with descriptions | Free-text notes — may leak info | Read all. |
| Protected OUs | `ProtectedFromAccidentalDeletion` flag | Defender care. |
^ad-ou-tree

### Full OU map

```powershell
# RSAT
Get-ADOrganizationalUnit -Filter * |
  Select Name,DistinguishedName,Description |
  Sort DistinguishedName

# Tree visualization (depth-aware)
Get-ADOrganizationalUnit -Filter * |
  ForEach-Object {
    $depth = ($_.DistinguishedName -split ',OU=').Count - 1
    "{0}{1}" -f ('  ' * $depth), $_.Name
  }
```

```bash
# LDAP raw
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "DC=dom,DC=local" -s subtree \
  "(objectClass=organizationalUnit)" \
  ou distinguishedName description
```

___

## Default Containers (Built-in)

| **Container** | **DN** | **Notas** |
|:---:|:---:|:---:|
| Users (default) | `CN=Users,DC=dom,DC=local` | Default user create location (NOT an OU). |
| Computers (default) | `CN=Computers,DC=dom,DC=local` | Default computer join location (NOT an OU). |
| Domain Controllers | `OU=Domain Controllers,DC=dom,DC=local` | DC location (real OU). |
| Builtin | `CN=Builtin,DC=dom,DC=local` | Built-in groups (Admins, Backup Ops, etc). |
| ForeignSecurityPrincipals | `CN=ForeignSecurityPrincipals,DC=dom,DC=local` | Cross-trust SIDs. |
| LostAndFound | `CN=LostAndFound,DC=dom,DC=local` | Orphaned objects. |
| System | `CN=System,DC=dom,DC=local` | System config (DNS, Policies, etc). |
| Configuration | `CN=Configuration,DC=dom,DC=local` (forest-level) | Forest-wide config. |
| Schema | `CN=Schema,CN=Configuration,DC=dom,DC=local` | Schema definitions. |
| Sites | `CN=Sites,CN=Configuration,DC=dom,DC=local` | Replication topology. |
| Services | `CN=Services,CN=Configuration,DC=dom,DC=local` | App-specific (Exchange, ADFS, ADCS). |
| NTDS Quotas | `CN=NTDS Quotas,DC=dom,DC=local` | Replication quotas. |
| Program Data | `CN=Program Data,DC=dom,DC=local` | App data. |
| Managed Service Accounts | `CN=Managed Service Accounts,DC=dom,DC=local` | gMSA/sMSA storage. |
| AdminSDHolder | `CN=AdminSDHolder,CN=System,DC=dom,DC=local` | DACL template para Tier 0. |
| Policies | `CN=Policies,CN=System,DC=dom,DC=local` | GPO storage. |
^ad-ou-defaults

### Default container visit

```powershell
# Built-in groups (high-value)
Get-ADObject -SearchBase "CN=Builtin,DC=dom,DC=local" -Filter * |
  Where ObjectClass -eq "group" |
  Select Name,DistinguishedName

# AdminSDHolder DACL (Tier 0 template)
Get-Acl "AD:CN=AdminSDHolder,CN=System,DC=dom,DC=local" |
  Select -ExpandProperty Access |
  Where {$_.AccessControlType -eq "Allow"} |
  Select IdentityReference,ActiveDirectoryRights
```

___

## OU Contents Enumeration

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "OU=X" -SearchScope OneLevel -Filter *` | Direct children | One-level. |
| `Get-ADObject -SearchBase "OU=X" -SearchScope Subtree -Filter *` | All descendants | Full subtree. |
| `Get-ADUser -SearchBase "OU=X"` | Users in OU | Filter user only. |
| `Get-ADComputer -SearchBase "OU=X"` | Computers in OU | Filter computer only. |
| `Get-ADGroup -SearchBase "OU=X"` | Groups in OU | Filter group only. |
| `dsquery * -limit 0 -filter "(distinguishedName=*OU=X*)"` | Legacy | Generic. |
| `ldapsearch -b "OU=X,DC=dom,DC=local" "(objectClass=*)"` | Linux | Direct. |
| `nxc ldap DC -u u -p p --query "(distinguishedName=*OU=X*)" "*"` | netexec | Wrapper. |
| Pivot per-OU | Find tier 0 OU → enum members | Targeted. |
| Service Accounts OU | Common naming | Tier 1 candidates. |
| Tier 0 OU | Domain Controllers + admin tier | High-value. |
| Disabled Accounts OU | Common dump | Audit reactivation. |
| Test/Lab OU | Often weaker policies | Recon for test creds. |
| Workstations OU | Bulk computers — initial foothold | Lateral targets. |
| External OU | Trust-related | Cross-domain. |
| Guest accounts OU | Anonymous-like accounts | Audit. |
^ad-ou-contents

### Per-OU drilldown

```powershell
# Recursive contents of specific OU
$ou = "OU=Tier 0 Admins,OU=Admin,DC=dom,DC=local"
Get-ADObject -SearchBase $ou -SearchScope Subtree -Filter * |
  Group-Object ObjectClass

# Privileged users by OU
Get-ADUser -SearchBase $ou -Filter * -Properties MemberOf,Description |
  Select Name,Description,@{n='Groups';e={$_.MemberOf -replace 'CN=([^,]+).*','$1' -join ', '}}
```

___

## OU Permissions & GPO Inheritance

| **Concepto** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| OU DACL | `Get-Acl "AD:OU=X,DC=dom,DC=local"` | Delegated rights. |
| Dangerous OU permissions | `GenericAll`, `GenericWrite`, `WriteDACL` | Ver [[AD - ACL Enumeration]]. |
| Linked GPOs | `Get-GPInheritance -Target "OU=X,DC=dom,DC=local"` | GPO mapping. |
| Block inheritance | `BlockInheritance=$true` | Defensive flag. |
| GPO link order | Lower link order = applied later (wins) | Conflict resolution. |
| Enforced GPOs | `Enforced=$true` | Override block. |
| Inherited GPOs | Travels down OU tree | Standard. |
| Parent → child GPO chain | Recursive policy app | Recon. |
| ACL on `gPLink` attribute | Modify linked GPOs | Privileged. |
| `gpcFileSysPath` resolves to SYSVOL | Where GPO files live | Path. |
| Modify GPO via OU permissions | Indirect path | Common abuse. |
| `Get-ADObject -SearchBase "OU=X" -Properties gPLink` | Check GPO attachments | Direct. |
| RSoP (Resultant Set of Policy) | `gpresult /h report.html` per host | Effective policy. |
| Group Policy Modeling | `Get-GPResultantSetOfPolicy` | Predict impact. |
| Per-OU Tier classification | Tier 0/1/2 design (OU-based) | Strategy. |
| LAPS rotation per-OU | LAPS GPO scope | Cred path adjacent. |
^ad-ou-permissions

### OU + GPO mapping

```powershell
# All OUs with their linked GPOs
Get-ADOrganizationalUnit -Filter * -Properties gPLink |
  Where {$_.gPLink} |
  Select Name,DistinguishedName,@{n='GPOs';e={
    ($_.gPLink -split '\]\[' | ForEach-Object {
      if ($_ -match '\{([\w-]+)\}') {
        (Get-GPO -Guid $matches[1] -ErrorAction SilentlyContinue).DisplayName
      }
    }) -join '; '
  }}

# OUs with delegated permissions to non-admin principals
Get-ADOrganizationalUnit -Filter * |
  ForEach-Object {
    Get-Acl "AD:$($_.DistinguishedName)" |
      Select -ExpandProperty Access |
      Where {
        $_.AccessControlType -eq "Allow" -and
        $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins" -and
        $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner"
      } |
      Select @{n='OU';e={$_.DistinguishedName}},IdentityReference,ActiveDirectoryRights
  }
```

___

## Naming Conventions / Fingerprint

| **Pattern** | **Indicator** | **Notas** |
|:---:|:---:|:---:|
| `T0`, `Tier0`, `Tier 0` | Tier 0 admin OU | Tiered admin model. |
| `Servers`, `Server Computers` | Server OU | Tier 1+. |
| `Workstations`, `Clients` | Workstation OU | Tier 2. |
| `Service Accounts`, `Svc` | Service account OU | Tier 1 typically. |
| `Domain Controllers` | DC OU (default) | Tier 0. |
| `Disabled`, `Stale` | Disabled accounts | Audit reactivation. |
| `Production`, `PROD` | Prod environment | Critical. |
| `Development`, `DEV`, `QA`, `TEST` | Non-prod | Often weaker. |
| `External`, `Vendors`, `Partners` | Cross-org | Trust risk. |
| `Migrations`, `Legacy` | Old systems | Often vuln. |
| `Departments` (HR, Finance, IT, Sales) | Org structure | Per-dept attacks. |
| `Locations` (NYC, LON, TYO) | Geographic | Branch offices. |
| `Privileged`, `Admins`, `Elevated` | Tier 0 markers | High-value. |
| `Restricted` | Hardened OU | Defense indicator. |
| `Unmanaged`, `Quarantine` | Non-compliant | Risk. |
| Mirroring real org chart | Standard enterprise | Predictable. |
^ad-ou-naming

### Fingerprint org structure

```powershell
# Top-level OUs reveal design intent
Get-ADOrganizationalUnit -Filter * -SearchScope OneLevel |
  Select Name,Description,@{n='ChildCount';e={
    (Get-ADObject -SearchBase $_.DistinguishedName -Filter * -SearchScope Subtree).Count
  }} | Sort ChildCount -Descending

# Look for tier markers
Get-ADOrganizationalUnit -Filter "Name -like '*Tier*' -or Name -like '*T0*' -or Name -like '*Admin*'"

# Look for prod/dev split
Get-ADOrganizationalUnit -Filter "Name -like '*PROD*' -or Name -like '*DEV*' -or Name -like '*TEST*'"
```

***
