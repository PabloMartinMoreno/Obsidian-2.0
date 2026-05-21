---
aliases:
  - Find-ForeignUser
  - Find-ForeignGroup
  - Cross-Trust Group
  - FSP Audit
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
  - '[[AD - Domain & Forest Trusts]]'
---
# AD - Groups Enumeration - Foreign / Cross-Trust Membership

***

## Foreign Security Principals (FSP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter *` | Lista FSPs | Cross-trust audit. |
| `ldapsearch ... -b "CN=ForeignSecurityPrincipals,DC=corp,DC=local" "(objectClass=foreignSecurityPrincipal)" cn distinguishedName objectSid` | LDAP raw | Linux. |
^ad-foreign-fsp

**DN format:** `CN=<foreign-SID>,CN=ForeignSecurityPrincipals,DC=corp,DC=local`. Creado automáticamente cuando un foreign principal (cross-trust o cross-forest) se añade a un group local.

```powershell
# FSPs resueltos a nombres
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter * |
  Where Name -ne "Self" | % {
    try {
      $name = (New-Object System.Security.Principal.SecurityIdentifier($_.Name)).Translate([System.Security.Principal.NTAccount])
      [PSCustomObject]@{ SID = $_.Name; Name = $name; DN = $_.DistinguishedName }
    } catch {
      [PSCustomObject]@{ SID = $_.Name; Name = "UNRESOLVED"; DN = $_.DistinguishedName }
    }
  }
```

___

## Find-ForeignUser / Find-ForeignGroup (PowerView)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-ForeignUser` | Foreign users en groups locales | Cross-trust users. |
| `Find-ForeignGroup` | Foreign groups en groups locales | Cross-trust nesting. |
| `Find-ForeignUser -Domain corp.local` | Específico domain | Filter. |
| `Find-ForeignUser -Recurse` | Walk forest reachable | Comprehensive. |
| `pywerview find-foreignuser -u u -p pass -d corp.local --dc-ip <DC>` | Linux equivalent | Sin Windows. |
| `pywerview find-foreigngroup -u u -p pass -d corp.local --dc-ip <DC>` | Linux groups | Sin Windows. |
^ad-foreign-pwview

```powershell
Import-Module .\PowerView.ps1
Find-ForeignUser
Find-ForeignGroup
Find-ForeignUser -Recurse  # walk all reachable forests
```

___

## Cross-Domain Group Membership

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADForest).Domains` | Lista domains forest | Forest mapping. |
| `Get-ADGroupMember "Domain Admins" -Server <other-domain> -Recursive` | DAs de domain específico | Per-domain priv. |
| `ldapsearch -h <DC> -p 3268 ...` | Forest-wide via GC | Cross-domain queries. |
| `bloodhound-python -d <each-domain> -u u -p pass -ns <DC> -c All --zip` (run per domain) | Multi-domain ingest | BHCE forest map. |
^ad-foreign-cross

**Scope rules cross-domain:**
- **Universal Security** → forest-wide membership.
- **Domain Local** → acepta members de cualquier domain del forest, scope local.
- **Global** → solo same-domain members. **No** acepta foreign.

```powershell
# Per-domain priv groups en forest
foreach ($d in (Get-ADForest).Domains) {
  Write-Host "`n=== $d ==="
  foreach ($g in "Domain Admins","Enterprise Admins","Schema Admins") {
    try {
      $m = Get-ADGroupMember $g -Server $d -Recursive -EA Stop
      if ($m) {
        Write-Host "  $g (count: $($m.Count))"
        $m | Select Name,SamAccountName | Ft -A
      }
    } catch {}
  }
}
```

___

## Authenticated Users / Everyone Implicit

| **SID** | **Name** | **Importancia** |
|:---:|:---:|:---:|
| `S-1-1-0` | Everyone | All users + cross-trust (modern: NO incluye anonymous). |
| `S-1-5-11` | Authenticated Users | All authenticated del forest + trusts. |
| `S-1-5-7` | Anonymous Logon | Anonymous (legacy). |
| `S-1-5-9` | Enterprise Domain Controllers | DCs forest-wide. |
| `S-1-5-10` | Self / Principal Self | Self-reference en ACEs. |
| `S-1-5-18` | Local System (SYSTEM) | Process privilege. |
| `S-1-5-32-544` | Built-in Administrators | Per-host admin group. |
^ad-foreign-implicit

**Por qué importa:** ACEs `Allow` con `S-1-1-0` o `S-1-5-11` sobre objects sensibles = **cualquier user del domain (o cross-trust) puede aprovechar**. Common audit finding crítico.

```powershell
# Hunt ACEs peligrosas a Everyone / Authenticated Users
$Dangerous = @{
  "S-1-1-0"  = "Everyone"
  "S-1-5-11" = "Authenticated Users"
  "S-1-5-7"  = "Anonymous Logon"
}

foreach ($sid in $Dangerous.Keys) {
  Write-Host "`n=== $($Dangerous[$sid]) ($sid) ==="
  Get-ADObject -Filter * -Properties nTSecurityDescriptor |
    ForEach-Object {
      $_.nTSecurityDescriptor.Access |
        Where {
          $_.AccessControlType -eq "Allow" -and
          $_.IdentityReference.Value -eq $Dangerous[$sid] -and
          $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|ExtendedRight"
        } |
        Select @{n='Object';e={$_.DistinguishedName}},ActiveDirectoryRights
    }
}
```

___

## Trust Account Group Membership

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {UserAccountControl -band 2048}` | Trust accounts (`<NETBIOS>$`) | Identify TDOs. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| Get-ADUser -Pr UserAccountControl \| ? {$_.UserAccountControl -band 2048}` | Trust accounts en DA (CRITICAL) | Forest takeover risk. |
| `Get-ADGroupMember "Enterprise Admins" -Recursive \| Get-ADUser -Pr UserAccountControl \| ? {$_.UserAccountControl -band 2048}` | Trust accounts en EA | Forest critical. |
^ad-foreign-trustaccount

**Por qué importa:** trust accounts (`INTERDOMAIN_TRUST_ACCOUNT` UAC flag 2048) en priv groups = compromiso del trust account = forest takeover via inter-realm TGT forge. **Should never** estar en priv groups.

___

## sIDHistory Cross-Trust Patterns

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr sIDHistory \| ? sIDHistory` | Users con sIDHistory | Migration audit. |
| `Get-ADUser -Filter {AdminCount -eq 1} -Pr sIDHistory \| ? sIDHistory` | Priv users con sIDHistory (critical) | Cross-forest privesc risk. |
| `(Get-ADUser <user> -Pr sIDHistory).sIDHistory` | Decode SIDs | Per-user. |
^ad-foreign-sidhistory

**Por qué importa:** con SID Filtering OFF en trust, `sIDHistory` con foreign DA SID inyectado = forest takeover. Audit users non-migration con `sIDHistory` = sospechoso (posible inyección atacante).

```powershell
# Resolver SID History
Get-ADUser -Filter * -Properties sIDHistory | Where sIDHistory | % {
  $u = $_
  Write-Host "`n=== $($u.SamAccountName) ==="
  $u.sIDHistory | % {
    try {
      $n = (New-Object System.Security.Principal.SecurityIdentifier($_.Value)).Translate([System.Security.Principal.NTAccount])
      Write-Host "  $($_.Value) → $n"
    } catch { Write-Host "  $($_.Value) → UNRESOLVED" }
  }
}
```

***
