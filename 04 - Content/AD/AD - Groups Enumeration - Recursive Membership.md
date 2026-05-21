---
aliases:
  - Nested Groups
  - tokenGroups
  - Recursive Group Member
  - Group Expansion
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - Groups Enumeration]]'
---
# AD - Groups Enumeration - Recursive Membership

***

## Direct vs Recursive

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember <group>` | Direct members | Solo nivel 1. |
| `Get-ADGroupMember <group> -Recursive` | Effective members (nested expanded) | Privilege analysis. |
| `Get-ADUser <user> -Pr tokenGroups \| Select -Expand tokenGroups` | Transitive groups del user (computed SIDs) | Per-user effective. |
| `Get-ADUser <user> -Pr tokenGroupsGlobalAndUniversal` | Transitive forest-wide | Cross-domain. |
| `ldapsearch ... "(memberOf:1.2.840.113556.1.4.1941:=CN=<group>,...)" samAccountName` | Recursive via LDAP_MATCHING_RULE_IN_CHAIN OID | Sin RSAT. |
| `whoami /groups` | Token efectivo del usuario actual | Per-session live. |
^ad-recursive-direct

**OID `1.2.840.113556.1.4.1941`** = LDAP_MATCHING_RULE_IN_CHAIN. Recursive transitivity en filters LDAP.

```bash
# Recursive members de DA via LDAP raw
ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" \
  "(memberOf:1.2.840.113556.1.4.1941:=CN=Domain Admins,CN=Users,DC=corp,DC=local)" \
  samAccountName
```

```powershell
# tokenGroups (SIDs → names)
$u = Get-ADUser jsmith -Properties tokenGroups
$u.tokenGroups | % {
  try { (New-Object System.Security.Principal.SecurityIdentifier($_)).Translate([System.Security.Principal.NTAccount]) }
  catch { "UNRESOLVED:$($_.Value)" }
}
```

___

## Nested Group Patterns

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch ... -b "CN=<user>,..." -s base "memberOf;range=0-*"` | Direct memberOf paged | Domain con muchos groups. |
| `ldapsearch ... "(member:1.2.840.113556.1.4.1941:=CN=<user>,...)" cn` | Todos groups recursivos que contienen al user | Recursive UP. |
| `Get-ADUser <user> -Pr MemberOf \| Select -Expand MemberOf` | Direct memberOf | Standard. |
| `Get-ADGroup <group> -Pr MemberOf \| Select -Expand MemberOf` | Parent groups del group (nesting up) | Walk chain. |
^ad-recursive-patterns

```powershell
# Walk recursive UP — todos groups donde está el user (directa + nested)
function Get-RecursiveMembership {
  param([string]$User)
  $direct = (Get-ADUser $User -Pr MemberOf).MemberOf
  $all = New-Object System.Collections.Generic.HashSet[string]
  $queue = New-Object System.Collections.Generic.Queue[string]
  $direct | % { $queue.Enqueue($_); [void]$all.Add($_) }

  while ($queue.Count -gt 0) {
    $g = $queue.Dequeue()
    (Get-ADGroup $g -Pr MemberOf).MemberOf | % {
      if ($all.Add($_)) { $queue.Enqueue($_) }
    }
  }
  return $all
}

Get-RecursiveMembership -User jsmith
```

___

## Foreign Security Principals

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter *` | Lista FSPs (foreign SIDs) | Cross-trust audit. |
| `Find-ForeignUser` (PowerView) | Foreign users en groups locales | Sin RSAT. |
| `Find-ForeignGroup` (PowerView) | Foreign groups en groups locales | Sin RSAT. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| ? distinguishedName -match "ForeignSecurityPrincipals"` | Foreign principals en DA | Critical audit. |
^ad-recursive-fsp

```powershell
# FSP resolution (SID → name)
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter * | % {
  $sid = $_.Name
  try {
    $resolved = (New-Object System.Security.Principal.SecurityIdentifier($sid)).Translate([System.Security.Principal.NTAccount])
    [PSCustomObject]@{ SID = $sid; Name = $resolved }
  } catch {
    [PSCustomObject]@{ SID = $sid; Name = "UNRESOLVED" }
  }
}

# Critical audit — foreign en priv
foreach ($g in "Domain Admins","Enterprise Admins","Schema Admins","Administrators") {
  Get-ADGroupMember $g -Recursive |
    Where { $_.distinguishedName -match "ForeignSecurityPrincipals" } |
    Select @{n='Group';e={$g}},Name,SID
}
```

___

## tokenGroups Calculation

| **Atributo / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser <u> -Pr tokenGroups` | Transitive groups del user (SIDs computed) | Per-user effective. |
| `Get-ADUser <u> -Pr tokenGroupsGlobalAndUniversal` | Forest-wide transitive | Cross-domain. |
| `Get-ADUser <u> -Pr tokenGroupsNoGCAcceptable` | Subset sin requerir GC | Edge. |
| `whoami /groups` | Token activo del usuario actual | Per-session. |
| `whoami /all` | Token completo + privileges | Detail. |
^ad-recursive-tokengroups

**Diferencia clave:**
- `tokenGroups` → solo Domain Local + Global del current domain.
- `tokenGroupsGlobalAndUniversal` → incluye Universal (forest-wide). Requiere GC.

```powershell
# Comparación útil
$u = "jsmith"
$tg = Get-ADUser $u -Properties tokenGroups,tokenGroupsGlobalAndUniversal

[PSCustomObject]@{
  User                 = $u
  TokenGroupsCount     = $tg.tokenGroups.Count
  ForestWideCount      = $tg.tokenGroupsGlobalAndUniversal.Count
  ForestExtra          = $tg.tokenGroupsGlobalAndUniversal.Count - $tg.tokenGroups.Count
}
```

___

## primaryGroupID Edge Cases

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr PrimaryGroupID \| ? PrimaryGroupID -ne 513` | Users con primary group != Domain Users (default) | Audit anomaly. |
| `Get-ADUser -Filter {PrimaryGroupID -eq 512}` | Users con DA como primary group (stealth membership) | Critical hunt. |
| `Get-ADUser -Filter {PrimaryGroupID -eq 519}` | Users con EA como primary | Forest-wide critical. |
^ad-recursive-primary

**Por qué importa:** `primaryGroupID` define group membership **implícita** que NO aparece en el atributo `member` del group. Atacante puede setear `primaryGroupID = 512` (Domain Admins) → es DA pero no aparece en `Get-ADGroupMember "Domain Admins"`. Stealth membership.

**Defaults legítimos:** 513=Domain Users (users), 515=Domain Computers (computers), 514=Domain Guests, 516=Domain Controllers (DC computer accounts), 521=RODC.

```powershell
# Hunt stealth admin via primaryGroupID
Get-ADUser -Filter {PrimaryGroupID -in 512,519,518,544} -Pr PrimaryGroupID,whenChanged |
  Select Name,SamAccountName,PrimaryGroupID,whenChanged
```

___

## Group Membership Audit (Bulk)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Domain Admins" -Recursive \| Get-ADUser -Pr ServicePrincipalName \| ? ServicePrincipalName` | DAs con SPN (kerberoastable priv) | Critical. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| ? Enabled -eq $false` | Disabled accounts en DA (re-enable risk) | Audit. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| Get-ADUser -Pr LastLogonDate \| ? LastLogonDate -lt (Get-Date).AddDays(-180)` | Stale DAs | Cleanup. |
| `Get-ADGroup -Filter * -Pr Members,whenChanged \| ? whenChanged -gt (Get-Date).AddDays(-7)` | Groups modificados última semana | Detect persistence. |
| `Get-ADGroup -Filter * -Pr Description \| ? Description -match "(?i)pass\|cred"` | Description leak en groups | Free-text hunt. |
^ad-recursive-audit

```powershell
# Audit comprehensive priv groups
$Priv = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
        "Account Operators","Backup Operators","Server Operators","Print Operators"

$Report = foreach ($g in $Priv) {
  Get-ADGroupMember $g -Recursive -EA SilentlyContinue |
    Get-ADUser -Properties Description,LastLogonDate,Enabled,ServicePrincipalName,whenCreated -EA SilentlyContinue |
    ForEach-Object {
      [PSCustomObject]@{
        Group     = $g
        Name      = $_.Name
        SAM       = $_.SamAccountName
        Enabled   = $_.Enabled
        IsService = [bool]$_.ServicePrincipalName
        LastLogon = $_.LastLogonDate
        Created   = $_.whenCreated
      }
    }
}
$Report | Export-Csv priv_audit.csv -NoTypeInformation
```

***
