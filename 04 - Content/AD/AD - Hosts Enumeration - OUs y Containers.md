---
aliases:
  - OU Tree Enumeration
  - AD Containers
  - Default Containers
  - Tier 0 OU Discovery
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - Hosts Enumeration]]"
---
# AD - Hosts Enumeration - OUs & Containers

---

## OU Tree Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADOrganizationalUnit -Filter *` | Todas las OUs | Inventory completo. |
| `Get-ADOrganizationalUnit -Filter * -SearchScope OneLevel` | Solo top-level | Overview rápido. |
| `Get-NetOU -FullData` (PowerView) | OUs sin RSAT | Adversary tool. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=organizationalUnit)" "ou,distinguishedName,description"` | OUs via LDAP | Linux/sin RSAT. |
| `ldapsearch -h <DC> -D u -w p -b "DC=corp,DC=local" "(objectClass=organizationalUnit)" ou distinguishedName description` | LDAP raw | Linux. |
| `Get-ADObject -SearchBase "OU=X,..." -Filter * -SearchScope OneLevel` | Children directos de OU | Drilldown. |
^ad-ou-tree

```powershell
# Tree visualization indented por depth
Get-ADOrganizationalUnit -Filter * |
  ForEach-Object {
    $depth = ($_.DistinguishedName -split ',OU=').Count - 1
    "{0}{1}" -f ('  ' * $depth), $_.Name
  }
```

---

## Default Containers (Built-in)

| **Container** | **DN** | **Para qué sirve** |
|:---:|:---:|:---:|
| Users | `CN=Users,DC=corp,DC=local` | Default user create (no es OU). |
| Computers | `CN=Computers,DC=corp,DC=local` | Default computer join (no es OU). |
| Domain Controllers | `OU=Domain Controllers,DC=corp,DC=local` | DCs (única OU default). |
| Builtin | `CN=Builtin,DC=corp,DC=local` | Built-in groups (Administrators, Backup Operators). |
| ForeignSecurityPrincipals | `CN=ForeignSecurityPrincipals,DC=corp,DC=local` | SIDs cross-trust. |
| System | `CN=System,DC=corp,DC=local` | DNS, Policies, AdminSDHolder. |
| AdminSDHolder | `CN=AdminSDHolder,CN=System,DC=corp,DC=local` | DACL template Tier 0. |
| Policies | `CN=Policies,CN=System,DC=corp,DC=local` | GPO storage. |
| Configuration | `CN=Configuration,DC=corp,DC=local` | Forest config. |
| Schema | `CN=Schema,CN=Configuration,DC=corp,DC=local` | Schema definitions. |
| Sites | `CN=Sites,CN=Configuration,DC=corp,DC=local` | Replication topology. |
| Services | `CN=Services,CN=Configuration,DC=corp,DC=local` | App-specific (Exchange, ADFS, ADCS). |
| Managed Service Accounts | `CN=Managed Service Accounts,DC=corp,DC=local` | gMSA storage. |
^ad-ou-defaults

```powershell
# Built-in groups (Tier 0 high-value)
Get-ADObject -SearchBase "CN=Builtin,DC=corp,DC=local" -Filter "objectClass -eq 'group'" |
  Select Name,DistinguishedName

# AdminSDHolder DACL — detect persistence backdoors
Get-Acl "AD:CN=AdminSDHolder,CN=System,DC=corp,DC=local" |
  Select -ExpandProperty Access |
  Where AccessControlType -eq "Allow" |
  Select IdentityReference,ActiveDirectoryRights
```

---

## OU Contents Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "<OU-DN>" -SearchScope OneLevel -Filter *` | Children directos | Drill paso a paso. |
| `Get-ADObject -SearchBase "<OU-DN>" -SearchScope Subtree -Filter *` | Toda la subtree | Recon completo. |
| `Get-ADUser -SearchBase "<OU-DN>" -Filter *` | Users de OU | Targeted user list. |
| `Get-ADComputer -SearchBase "<OU-DN>" -Filter *` | Computers de OU | Lateral targets. |
| `Get-ADGroup -SearchBase "<OU-DN>" -Filter *` | Groups de OU | Permission audit. |
| `ldapsearch -b "<OU-DN>,DC=corp,DC=local" "(objectClass=*)"` | Subtree via LDAP | Linux. |
| `nxc ldap <DC> -u u -p p --query "(distinguishedName=*<OU-DN>*)" "*"` | Filter contains via netexec | Quick. |
^ad-ou-contents

```powershell
# Drilldown Tier 0 OU
$OU = "OU=Tier 0 Admins,OU=Admin,DC=corp,DC=local"

Get-ADObject -SearchBase $OU -SearchScope Subtree -Filter * |
  Group-Object ObjectClass

Get-ADUser -SearchBase $OU -Filter * -Properties MemberOf,Description |
  Select Name,Description,@{n='Groups';e={ ($_.MemberOf -replace 'CN=([^,]+).*','$1') -join ', ' }}
```

---

## OU Permissions & GPO Inheritance

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<OU-DN>"` | DACL de la OU | Delegation audit. |
| `Get-GPInheritance -Target "<OU-DN>"` | GPOs linked + inherited + block flag | GPO scope. |
| `Get-ADOrganizationalUnit "<OU-DN>" -Pr gPLink` | gPLink raw attribute | Manual parse. |
| `gpresult /h report.html` | RSoP del host actual | Effective policy. |
| `Get-GPResultantSetOfPolicy -ReportType Html -Path rsop.html -User <u> -Computer <c>` | RSoP modeling (sin estar logueado) | Predict impact. |
^ad-ou-permissions

```powershell
# OUs con GPOs vinculados (resolved names)
Get-ADOrganizationalUnit -Filter * -Properties gPLink |
  Where gPLink |
  Select Name,DistinguishedName,@{n='GPOs';e={
    ($_.gPLink -split '\]\[' | % {
      if ($_ -match '\{([\w-]+)\}') {
        (Get-GPO -Guid $matches[1] -EA SilentlyContinue).DisplayName
      }
    }) -join '; '
  }}

# OUs con delegation a no-admin principals (privesc paths)
Get-ADOrganizationalUnit -Filter * | % {
  Get-Acl "AD:$($_.DistinguishedName)" |
    Select -ExpandProperty Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM" -and
      $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner"
    } |
    Select @{n='OU';e={$_.DistinguishedName}},IdentityReference,ActiveDirectoryRights
}
```

---

## Naming Conventions / Fingerprint

| **Patrón en nombre** | **Lo que indica** | **Acción** |
|:---:|:---:|:---:|
| `T0`, `Tier0`, `Tier 0`, `Privileged`, `Admin` | Tier 0 OU | Top priority enum. |
| `Servers`, `Member Servers` | Server OU | Tier 1+. |
| `Workstations`, `Clients` | Workstation OU | Tier 2. |
| `Service Accounts`, `Svc`, `SA-` | Service accounts | Kerberoast targets. |
| `Disabled`, `Stale`, `Quarantine` | Disabled accounts dump | Reactivation audit. |
| `PROD`, `Production` | Critical environment | High-impact. |
| `DEV`, `TEST`, `QA`, `Lab` | Non-prod (weaker policies) | Easy creds. |
| `External`, `Vendors`, `Partners`, `B2B` | Cross-org | Trust attack surface. |
| `Migration`, `Legacy` | Old systems | Likely vuln. |
| Geo (`NYC`, `LON`, `EMEA`) | Branch offices | Site-pivot recon. |
^ad-ou-naming

```powershell
# Top-level OUs ordered por child count (org structure fingerprint)
Get-ADOrganizationalUnit -Filter * -SearchScope OneLevel |
  Select Name,Description,@{n='ChildCount';e={
    (Get-ADObject -SearchBase $_.DistinguishedName -Filter * -SearchScope Subtree).Count
  }} | Sort ChildCount -Descending

# Tier 0 markers
Get-ADOrganizationalUnit -Filter "Name -like '*Tier*' -or Name -like '*T0*' -or Name -like '*Admin*' -or Name -like '*Privileged*'"
```

---
