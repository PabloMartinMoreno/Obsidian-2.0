---
aliases:
  - msDS-GroupMSAMembership
  - gMSA Password Readers
  - PrincipalsAllowedToRetrieveManagedPassword
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - gMSA Enumeration]]"
---
# AD - gMSA Enumeration - Password Read Permissions

***

## msDS-GroupMSAMembership

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount <gmsa> -Properties msDS-GroupMSAMembership \| Select -Expand msDS-GroupMSAMembership \| Select -Expand Access` | Security descriptor decoded | Per-gMSA audit. |
| `Get-ADServiceAccount <gmsa> -Properties PrincipalsAllowedToRetrieveManagedPassword` | RSAT-friendly readers list | Standard. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=msDS-GroupManagedServiceAccount)" "samAccountName,msDS-GroupMSAMembership"` | LDAP raw bulk | Linux. |
^ad-gmsa-perm-membership

**`msDS-GroupMSAMembership` es un security descriptor** (binary), no una lista simple. RSAT lo expone via `PrincipalsAllowedToRetrieveManagedPassword`. Linux raw = parsing manual del SDDL.

```powershell
Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword |
  Select Name,
         @{n='Readers';e={
           $_.PrincipalsAllowedToRetrieveManagedPassword | % {
             (Get-ADObject $_ -EA SilentlyContinue).Name
           } -join '; '
         }}
```

___

## Recursive Group Expansion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount <gmsa> -Pr PrincipalsAllowedToRetrieveManagedPassword \| Select -Expand PrincipalsAllowedToRetrieveManagedPassword \| % { Get-ADGroupMember $_ -Recursive -EA SilentlyContinue }` | Recursive members effective | Effective readers. |
| BloodHound `MATCH (u {owned:true})-[:MemberOf*1..]->(g:Group)-[:ReadGMSAPassword]->(s) RETURN u,g,s` | Recursive paths | Privesc planning. |
^ad-gmsa-perm-recursive

```powershell
function Get-EffectiveGMSAReaders {
  param([string]$gMSAName)
  $g = Get-ADServiceAccount $gMSAName -Properties PrincipalsAllowedToRetrieveManagedPassword
  $effective = @()
  foreach ($p in $g.PrincipalsAllowedToRetrieveManagedPassword) {
    $obj = Get-ADObject $p -EA SilentlyContinue
    if ($obj.objectClass -eq "group") {
      $effective += Get-ADGroupMember $obj -Recursive -EA SilentlyContinue
    } else {
      $effective += $obj
    }
  }
  $effective | Select Name,SamAccountName,objectClass
}

Get-EffectiveGMSAReaders -gMSAName "SQL_gMSA"
```

___

## ACL on gMSA Object

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<gmsa-DN>" \| Select -Expand Access` | DACL completa del gMSA | ACL audit. |
| `(Get-Acl "AD:<gmsa-DN>").Access \| ? IdentityReference -notmatch "BUILTIN\|NT AUTHORITY\|Domain Admins"` | Non-default principals con access | Detect anomaly. |
| `dsacls "<gmsa-DN>"` | Native dsacls | Sin RSAT. |
^ad-gmsa-perm-acl

**ACEs interesantes para privesc:**
- `WriteProperty msDS-GroupMSAMembership` → modify readers list = self-add → read pwd.
- `GenericWrite` / `GenericAll` → todo (incluye add membership).
- `WriteOwner` → take ownership → grant self.

___

## Computer Accounts as Readers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter * -Pr PrincipalsAllowedToRetrieveManagedPassword \| ? PrincipalsAllowedToRetrieveManagedPassword \| % { $_.PrincipalsAllowedToRetrieveManagedPassword \| ? { (Get-ADObject $_).objectClass -eq "computer" } }` | Computers que pueden leer gMSA | Computer compromise = gMSA pwd. |
^ad-gmsa-perm-computers

**Por qué importa:** comprometer computer joinado al domain (computer account hash via secretsdump LOCAL) = login as computer = read gMSA pwd. Lateral movement chain común.

```powershell
# Computers como gMSA readers
Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword | % {
  $g = $_
  $g.PrincipalsAllowedToRetrieveManagedPassword | % {
    $obj = Get-ADObject $_ -EA SilentlyContinue
    if ($obj.objectClass -eq "computer") {
      [PSCustomObject]@{
        gMSA = $g.Name
        Computer = $obj.Name
      }
    }
  }
}
```

___

## Privileged gMSA Identification

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter * -Pr MemberOf \| ? {$_.MemberOf -match "Domain Admins\|Enterprise Admins"}` | gMSA en priv groups | Critical. |
| `Get-ADServiceAccount -Filter {AdminCount -eq 1}` | gMSA con AdminSDHolder marker | Tier 0/1. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| ? objectClass -eq "msDS-GroupManagedServiceAccount"` | gMSA effective DA member | Critical priv. |
^ad-gmsa-perm-privileged

___

## BloodHound gMSA Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:ReadGMSAPassword*1..]->(s) RETURN u.name,s.name` | Paths owned → gMSA read | Privesc. |
| `MATCH (s {gmsa:true}) RETURN s.name,s.domain` | All gMSAs | Inventory. |
| `MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[:ReadGMSAPassword]->(s) RETURN u.name,g.name,s.name` | Recursive readers | Detail. |
| `MATCH (s {gmsa:true})-[:MemberOf*1..]->(g:Group {highvalue:true}) RETURN s.name,g.name` | gMSAs en Tier 0 | Critical. |
^ad-gmsa-perm-bh

___

## Common Misconfigurations

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter * -Pr PrincipalsAllowedToRetrieveManagedPassword \| ? {$_.PrincipalsAllowedToRetrieveManagedPassword -match "Authenticated Users\|Domain Users\|Everyone"}` | Wide read access | **CRITICAL**. |
| Same group reads multiple gMSAs across tiers | Tier crossing | Audit. |
| gMSA en DA + Authenticated Users en read | Catastrofic | Critical. |
| Stale gMSA computer accounts (decom) | Cleanup | Audit. |
| gMSA con `PasswordNotRequired` UAC | Anomaly | Investigate. |
^ad-gmsa-perm-misconfig

***
