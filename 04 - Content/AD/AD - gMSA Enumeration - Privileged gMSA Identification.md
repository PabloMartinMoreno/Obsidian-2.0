---
aliases:
  - Privileged gMSA
  - gMSA in DA
  - Kerberoastable gMSA
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
# AD - gMSA Enumeration - Privileged gMSA Identification

***

## gMSA in Privileged Groups

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter * -Pr MemberOf \| ? {$_.MemberOf -match "Domain Admins\|Enterprise Admins\|Schema Admins\|Administrators"}` | gMSA en Tier 0 | Critical priv. |
| `Get-ADServiceAccount -Filter {AdminCount -eq 1}` | gMSA con AdminSDHolder marker | Tier 0/1. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| ? objectClass -eq "msDS-GroupManagedServiceAccount"` | gMSA effective DA | Recursive. |
| `Get-ADGroupMember "Backup Operators" -Recursive \| ? objectClass -match "ManagedService"` | gMSA en Backup Operators | Privesc path. |
^ad-gmsapriv-groups

```powershell
# Comprehensive priv gMSA scan
$Priv = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
        "Backup Operators","Account Operators","Server Operators","Print Operators"

foreach ($g in $Priv) {
  Get-ADGroupMember $g -Recursive -EA SilentlyContinue |
    Where { $_.objectClass -match "ManagedService" } |
    Select @{n='Group';e={$g}},Name,SamAccountName,objectClass
}
```

___

## Kerberoastable gMSAs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter {ServicePrincipalName -like "*"} -Pr ServicePrincipalName` | gMSAs con SPN | Pre-attack. |
| `Get-ADServiceAccount -Filter {ServicePrincipalName -like "*" -and AdminCount -eq 1}` | Priv kerberoastable gMSA (rare) | Critical. |
| `nxc ldap <DC> -u u -p p --query "(&(objectClass=msDS-GroupManagedServiceAccount)(servicePrincipalName=*))" "samAccountName,servicePrincipalName"` | Bulk via netexec | Quick. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -outputfile spns.kerb` | Includes gMSAs en kerberoast bulk | Standard. |
^ad-gmsapriv-kerberoast

**Caveat:** kerberoasting un gMSA da TGS hash, **pero password real es 240 chars random** = imposible crack offline. Solo útil si gMSA tiene ACE `WriteProperty msDS-GroupMSAMembership` y podés agregar self → leer pwd directamente.

___

## gMSA with Delegation Flags

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter {TrustedForDelegation -eq $true}` | gMSAs con UD (raro) | Critical. |
| `Get-ADServiceAccount -Filter * -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo` | Constrained delegation | S4U privesc. |
| `Get-ADServiceAccount -Filter {TrustedToAuthForDelegation -eq $true}` | Protocol transition | Critical. |
| `Get-ADComputer -Filter * -Pr msDS-AllowedToActOnBehalfOfOtherIdentity \| ? {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity' -match "<gmsa-SID>"}` | gMSA usado como RBCD principal | Edge. |
^ad-gmsapriv-delegation

___

## Password Read Cross-Correlation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter * -Pr PrincipalsAllowedToRetrieveManagedPassword,MemberOf \| ? {$_.MemberOf -match "Admin" -and $_.PrincipalsAllowedToRetrieveManagedPassword.Count -gt 0}` | Priv gMSA + readers | Privesc planning. |
| BloodHound `MATCH (u {owned:true})-[:ReadGMSAPassword*1..]->(s {gmsa:true})-[:MemberOf*1..]->(g:Group {highvalue:true}) RETURN u,s,g` | Path completo a Tier 0 via gMSA | Full path. |
^ad-gmsapriv-correlate

```powershell
# Score: priv gMSA + accessible readers
Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword,MemberOf,AdminCount | % {
  $g = $_
  $tier0 = $g.MemberOf | Where { $_ -match "Domain Admins|Enterprise Admins|Schema Admins" }
  if ($tier0 -or $g.AdminCount -eq 1) {
    [PSCustomObject]@{
      gMSA = $g.Name
      InTier0 = ($tier0 -join ';')
      AdminCount = $g.AdminCount
      Readers = ($g.PrincipalsAllowedToRetrieveManagedPassword | % {
        (Get-ADObject $_ -EA SilentlyContinue).Name
      }) -join '; '
    }
  }
}
```

___

## gMSA Naming Patterns

| **Pattern** | **Indica** | **Cuándo importa** |
|:---:|:---:|:---:|
| `*_gMSA` / `gMSA_*` / `gmsa-*` | Convention obvia | Inventory. |
| `svc-*` / `*-svc` | Service account naming (a veces gMSA) | Hunt. |
| `sql_gMSA`, `web_gMSA`, `iis_gMSA` | Service específico | Identify role. |
| `bk-*` / `backup_gMSA` | Backup services (often Backup Operators) | Privesc target. |
| `sched_gMSA` / `task_gMSA` | Scheduled tasks | Edge. |
^ad-gmsapriv-naming

```powershell
# Heuristic gMSA naming
Get-ADServiceAccount -Filter * |
  Where { $_.Name -match "(?i)gmsa|svc|service|backup|sql|iis|web|task|sched" } |
  Select Name,SamAccountName
```

___

## High-Value Summary

| **Categoría** | **Comando filter** | **Riesgo** |
|:---:|:---:|:---:|
| gMSA en Tier 0 directo | `MemberOf -match "Domain Admins\|Enterprise Admins"` | Catastrofic. |
| gMSA + UD + readers amplios | UD + Authenticated Users en readers | Critical chain. |
| gMSA stale rotation | `PasswordLastSet > 60d` (default 30d) | Audit. |
| gMSA con `PasswordNotRequired` UAC | Rare misconfig | Investigate. |
| gMSA Backup Operators | NTDS dump path | Privesc to DA. |
| gMSA con SPN + readable | Direct cred path | Lateral. |
^ad-gmsapriv-summary

```powershell
# Final priority list
$Priorities = @()

Get-ADServiceAccount -Filter * -Properties * | % {
  $score = 0
  $reasons = @()

  if ($_.MemberOf -match "Domain Admins|Enterprise Admins") {
    $score += 10; $reasons += "Tier0_member"
  }
  if ($_.AdminCount -eq 1) { $score += 5; $reasons += "AdminCount" }
  if ($_.TrustedForDelegation) { $score += 5; $reasons += "Unconstrained" }
  if ($_.MemberOf -match "Backup Operators") { $score += 7; $reasons += "BackupOps" }
  if ($_.ServicePrincipalName) { $score += 2; $reasons += "HasSPN" }

  if ($score -gt 0) {
    $Priorities += [PSCustomObject]@{
      gMSA = $_.Name
      Score = $score
      Reasons = $reasons -join ','
      Readers = ($_.PrincipalsAllowedToRetrieveManagedPassword -join '; ')
    }
  }
}
$Priorities | Sort Score -Descending
```

***
