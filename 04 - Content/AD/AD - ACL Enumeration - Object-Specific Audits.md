---
aliases:
  - Domain Root ACL
  - AdminSDHolder Audit
  - DA Group ACL
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
  - "[[AD - ACL Enumeration]]"
---
# AD - ACL Enumeration - Object-Specific Audits

---

## Domain Root Object

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:DC=corp,DC=local"` | DACL del domain root | Critical audit. |
| `(Get-Acl "AD:DC=corp,DC=local").Access \| ? {$_.ObjectType -in "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2","1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"}` | DCSync rights granted | Critical hunt. |
| `(Get-Acl "AD:DC=corp,DC=local").Access \| ? IdentityReference -notmatch "BUILTIN\|NT AUTHORITY\|Domain Admins\|Enterprise Admins\|SYSTEM\|Domain Controllers\|Exchange"` | Non-default ACEs en root | Anomaly hunt. |
^ad-objspec-domainroot

```powershell
# DCSync ACEs en domain root
Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -Expand Access |
  Where {
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",  # GetChanges
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"   # GetChangesAll
    )
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType
```

---

## Privileged Groups (DA, EA, Schema)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=Domain Admins,CN=Users,DC=corp,DC=local"` | DACL del DA group | Critical. |
| `Get-Acl "AD:CN=Enterprise Admins,CN=Users,DC=corp,DC=local"` (forest root) | EA DACL | Forest critical. |
| `Get-Acl "AD:CN=Schema Admins,CN=Users,DC=corp,DC=local"` (forest root) | Schema DACL | Forest critical. |
| `(Get-Acl "AD:<priv-group-DN>").Access \| ? {$_.ObjectType -eq "bf9679c0-0de6-11d0-a285-00aa003049e2"}` | WriteProperty `member` (AddMember) | Audit. |
^ad-objspec-privgroups

```powershell
# Audit ACEs no-default en priv groups
$Priv = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
        "Account Operators","Backup Operators","Server Operators"

foreach ($g in $Priv) {
  $dn = (Get-ADGroup $g -EA SilentlyContinue).DistinguishedName
  if ($dn) {
    Write-Host "`n=== $g ==="
    Get-Acl "AD:$dn" |
      Select -Expand Access |
      Where {
        $_.AccessControlType -eq "Allow" -and
        $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM|Cert Publishers" -and
        $_.ActiveDirectoryRights -match "Generic|Write|AllExtendedRights"
      } |
      Select IdentityReference,ActiveDirectoryRights
  }
}
```

---

## AdminSDHolder Object

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=AdminSDHolder,CN=System,DC=corp,DC=local"` | DACL template (re-applied a Tier 0 cada 60min via SDProp) | **Critical persistence detection**. |
| `(Get-Acl "AD:CN=AdminSDHolder,CN=System,DC=corp,DC=local").Access \| ? IdentityReference -notmatch "BUILTIN\|NT AUTHORITY\|Domain Admins\|Enterprise Admins\|SYSTEM"` | Backdoor hunt | Persistence detection. |
| `Get-ADObject "CN=AdminSDHolder,CN=System,DC=corp,DC=local" -Pr whenChanged` | Last modify time | Detect tampering. |
^ad-objspec-adminsdholder

**Por qué crítico:** SDProp copia DACL de AdminSDHolder a todos los Tier 0 objects (DA members, etc) cada 60min. Atacante con WriteDacl sobre AdminSDHolder = backdoor self-restoring incluso si lo quitan del priv group.

```powershell
# Hunt backdoor en AdminSDHolder
Get-Acl "AD:CN=AdminSDHolder,CN=System,$((Get-ADDomain).DistinguishedName)" |
  Select -Expand Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM" -and
    $_.ActiveDirectoryRights -match "Generic|Write|AllExtendedRights"
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType
```

---

## Computer Objects

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<computer-DN>"` | DACL per-computer | Per-host audit. |
| `Get-ADComputer -Filter * \| % { (Get-Acl "AD:$($_.DistinguishedName)").Access \| ? IdentityReference -notmatch "..." }` | Bulk audit | Forest-wide. |
| `(Get-Acl "AD:<computer-DN>").Access \| ? ObjectType -eq "3f78c3e5-f79a-46bd-a0b8-9d18116ddc79"` | Specific RBCD attr ACE | RBCD enum. |
| `Get-ADComputer -Filter * -Pr msDS-AllowedToActOnBehalfOfOtherIdentity \| ? msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD configurado | Audit. |
^ad-objspec-computers

---

## OU Objects

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<OU-DN>"` | DACL del OU | Per-OU audit. |
| `(Get-Acl "AD:<OU-DN>").Access \| ? {$_.ObjectType -eq "f30e3bbe-9ff0-11d1-b603-0000f80367c1"}` | WriteProperty `gPLink` (link GPO) | Critical. |
| `(Get-Acl "AD:<OU-DN>").Access \| ? ActiveDirectoryRights -match "CreateChild\|DeleteChild"` | Crear/borrar children (e.g., crear users) | Privesc. |
| `Get-GPInheritance -Target "<OU-DN>"` | GPOs aplicados | Cross-correlate. |
^ad-objspec-ous

```powershell
# Audit Tier 0 OUs primero
$Tier0OUs = Get-ADOrganizationalUnit -Filter "Name -like '*Tier0*' -or Name -like '*T0*' -or Name -like '*Admin*'"
foreach ($ou in $Tier0OUs) {
  Write-Host "`n=== $($ou.DistinguishedName) ==="
  Get-Acl "AD:$($ou.DistinguishedName)" |
    Select -Expand Access |
    Where {
      $_.IdentityReference -notmatch "BUILTIN|Domain Admins|Enterprise Admins|SYSTEM" -and
      $_.ActiveDirectoryRights -match "Generic|Write|Create"
    } |
    Select IdentityReference,ActiveDirectoryRights
}
```

---

## Group Policy Objects (GPOs)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPO -All \| % { Get-GPPermission -Guid $_.Id -All }` | Permissions per-GPO | Bulk audit. |
| `Get-Acl "AD:CN={<gpo-guid>},CN=Policies,CN=System,DC=corp,DC=local"` | DACL raw del GPO container | Per-GPO. |
| `Get-Acl "\\<DC>\sysvol\corp.local\Policies\{<gpo-guid>}"` | DACL filesystem (SYSVOL side) | Filesystem ACL. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ObjectAceType -match "groupPolicyContainer"` | GPOs con dangerous ACEs | Bulk hunt. |
^ad-objspec-gpos

```powershell
# Audit GPOs con non-default modify ACEs
Get-GPO -All | % {
  $perms = Get-GPPermission -Guid $_.Id -All -EA SilentlyContinue |
    Where {
      $_.Permission -in "GpoEditDeleteModifySecurity","GpoEdit" -and
      $_.Trustee.Name -notmatch "Domain Admins|Enterprise Admins|SYSTEM"
    }
  if ($perms) {
    [PSCustomObject]@{
      GPO = $_.DisplayName
      Modifiers = ($perms | % { "$($_.Trustee.Name):$($_.Permission)" }) -join '; '
    }
  }
}
```

---

## ADCS Templates & CA

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=<template>,CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local"` | DACL template | Per-template audit. |
| `certutil -dsTemplate` | Templates raw | Inventory. |
| `Get-CertificateTemplate \| Get-CertificateTemplateAcl` (PSPKI) | DACLs per-template | Standard. |
| `certipy find -u u -p pass -dc-ip <DC> -vulnerable -stdout` | Vulnerable templates auto-detect | Linux. |
| `Certify.exe find /vulnerable` | Windows | Standard. |
^ad-objspec-adcs

---

## Bulk Forest-Wide Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-InterestingDomainAcl -ResolveGUIDs` (PowerView) | Bulk hunt forest-wide | Standard. |
| `Find-InterestingDomainAcl -ResolveGUIDs -Domain <other-dom>` | Cross-domain | Forest-wide. |
| `(Get-ADForest).Domains \| % { Find-InterestingDomainAcl -Domain $_ -ResolveGUIDs }` | Iterate all domains | Forest audit. |
| BloodHound multi-domain ingest + Cypher `MATCH p=...->(:Domain) WHERE u.domain <> domain.name` | Cross-domain via BH | Visual. |
^ad-objspec-bulk

---
