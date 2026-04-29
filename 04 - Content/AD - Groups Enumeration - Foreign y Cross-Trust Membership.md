---
aliases:
  - Find-ForeignUser
  - Find-ForeignGroup
  - Cross-Trust Group
  - FSP Audit
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
  - "[[AD - Groups Enumeration]]"
  - "[[AD - Domain & Forest Trusts]]"
---
# AD - Groups Enumeration - Foreign / Cross-Trust Membership

***

## Foreign Security Principals (FSP) Container

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| FSP container DN | `CN=ForeignSecurityPrincipals,DC=dom,DC=local` | Standard location. |
| Object class | `foreignSecurityPrincipal` | LDAP class. |
| FSP DN format | `CN=<foreign-SID>,CN=ForeignSecurityPrincipals,...` | SID-based. |
| Created automatically | When foreign principal added to local group | Auto. |
| Foreign domain SID prefix | `S-1-5-21-...` (different from local) | Identifier. |
| Cross-trust references | Inter-forest, intra-forest non-default | Standard. |
| Resolve SID via cross-domain LDAP | Cross-trust authenticated query | Adjacent. |
| Resolve via .NET Translate | Local fallback | Adjacent. |
| Foreign Security Principal as group member | `member` attribute | Standard. |
| Audit: list all FSPs | Discovery | Standard. |
| Privileged FSP = critical | Cross-trust privilege | Audit. |
| `Authenticated Users` SID = FSP-style | S-1-5-11 | Standard. |
| `Everyone` = S-1-1-0 | Built-in | Standard. |
| `NT AUTHORITY\\NETWORK` etc | Built-in | Standard. |
| Cleanup post-attack | Standard hygiene | OPSEC. |
| Detection: FSP creation event | Defender | Adjacent. |
^ad-foreign-fsp

### FSP discovery

```powershell
# All FSPs
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=dom,DC=local" -Filter * |
  Select Name,DistinguishedName

# Resolve FSP SIDs to readable names
$fsps = Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=dom,DC=local" -Filter * |
  Where Name -ne "Self" |  # exclude self-reference
  ForEach-Object {
    try {
      $sid = New-Object System.Security.Principal.SecurityIdentifier($_.Name)
      $name = $sid.Translate([System.Security.Principal.NTAccount])
      [PSCustomObject]@{ SID = $_.Name; Name = $name; DN = $_.DistinguishedName }
    } catch {
      [PSCustomObject]@{ SID = $_.Name; Name = "UNRESOLVABLE"; DN = $_.DistinguishedName }
    }
  }

$fsps
```

```bash
# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass -b "CN=ForeignSecurityPrincipals,DC=dom,DC=local" \
  "(objectClass=foreignSecurityPrincipal)" \
  cn distinguishedName objectSid
```

___

## Find-ForeignUser / Find-ForeignGroup (PowerView)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Find-ForeignUser` | Foreign users in local groups | Adversary tool. |
| `Find-ForeignGroup` | Foreign groups nested locally | Same. |
| `Find-ForeignUser -Domain dom.local` | Specific domain | Filter. |
| `Find-ForeignUser -DomainController DC` | Specific DC | Filter. |
| Default: walks all domains | Comprehensive | Slow. |
| Returns user object + group | Cross-trust mapping | Standard. |
| pywerview equivalent | `find-foreignuser` | Linux. |
| pywerview options | Adjacent | Adjacent. |
| Cross-domain + cross-forest | All scopes | Standard. |
| Privileged foreign = critical | Audit risk | Standard. |
| Filter by group privilege | Manual post-process | Standard. |
| BloodHound foreign edges | Visual | Tool. |
| Cypher: cross-domain queries | Custom | Tool. |
| Audit: should be minimal | Best practice | Defender. |
| Cross-merger leftover | Common find | Audit. |
| Detection: foreign principal addition | Defender event | Adjacent. |
^ad-foreign-pwview

### PowerView foreign analysis

```powershell
# Import PowerView
Import-Module .\PowerView.ps1

# Foreign users in local groups
Find-ForeignUser

# Foreign groups nested in local
Find-ForeignGroup

# Specific domain
Find-ForeignUser -Domain dom-A.local
Find-ForeignGroup -Domain dom-A.local

# Comprehensive forest crawl
Find-ForeignUser -Recurse  # walk all reachable forests
```

```bash
# Linux pywerview
pywerview find-foreignuser -u user -p pass -d dom.local --dc-ip DC
pywerview find-foreigngroup -u user -p pass -d dom.local --dc-ip DC
```

___

## Cross-Domain Group Membership (Forest)

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Universal group cross-domain | Standard within forest | Forest-wide. |
| Domain Local accepts foreign | Limited scope | Standard. |
| Global rejects foreign | Same-domain only | Standard. |
| Forest trust: cross-forest universal | Edge | Adjacent. |
| Cross-domain DA invitation | Forest design | Standard. |
| Schema Admins forest-wide | Top tier | Standard. |
| Enterprise Admins forest-wide | Top tier | Standard. |
| Cross-OU group references | Same-domain | Adjacent. |
| Per-domain priv groups | Each child domain has own DA | Standard. |
| Inter-domain trust = bidirectional FSP | Standard | Standard. |
| External trust limits FSP | Specific scope | Edge. |
| Cross-forest trust enables FSP | Edge | Adjacent. |
| Foreign DA in local DA | Critical risk | Audit. |
| Foreign user in local Tier 1 group | Common merger leftover | Audit. |
| BloodHound per-domain ingest | Required | Tool. |
| Cypher: cross-domain queries | Custom analytics | Tool. |
^ad-foreign-cross

### Cross-domain audit

```powershell
# All forest domains
$forest = Get-ADForest
$domains = $forest.Domains

# Per-domain privileged group members
foreach ($d in $domains) {
  Write-Host "`n=== $d ==="
  foreach ($g in @("Domain Admins","Enterprise Admins","Schema Admins")) {
    try {
      $members = Get-ADGroupMember $g -Server $d -Recursive -ErrorAction SilentlyContinue
      if ($members) {
        Write-Host "  $g members:"
        $members | Select Name,SamAccountName | Format-Table
      }
    } catch {}
  }
}

# BloodHound — visual
# bloodhound-python -d dom-A.local -u u -p p -ns DC-A -c All
# bloodhound-python -d dom-B.local -u u -p p -ns DC-B -c All
```

___

## Authenticated Users / Everyone Implicit

| **SID** | **Name** | **Notas** |
|:---:|:---:|:---:|
| S-1-1-0 | Everyone | All users + anonymous + cross-trust. |
| S-1-5-11 | Authenticated Users | All authenticated (including cross-trust). |
| S-1-5-7 | Anonymous Logon | Anonymous (legacy). |
| S-1-5-9 | Enterprise Domain Controllers | DCs. |
| S-1-5-10 | Self / Principal Self | Self-reference. |
| S-1-5-18 | Local System | SYSTEM. |
| S-1-5-19 | Local Service | Service. |
| S-1-5-20 | Network Service | Service. |
| S-1-5-32-544 | Built-in Administrators | Standard. |
| S-1-5-32-545 | Users | Standard. |
| Implicit membership | All users implicitly | Standard. |
| Modern: Authenticated Users does NOT include anonymous | Hardened | Standard. |
| Legacy: Pre-Win 2000 included Anonymous | Edge | Edge. |
| ACL on SID directly | Common | Standard. |
| Audit: dangerous ACEs to Authenticated Users | Common find | Critical. |
| `EveryoneIncludesAnonymous` registry | Edge misconfig | Risk. |
^ad-foreign-implicit

### Implicit SID audit

```powershell
# Find ACEs on common SIDs that are dangerous
$dangerousSids = @{
  "S-1-1-0" = "Everyone"
  "S-1-5-11" = "Authenticated Users"
  "S-1-5-7" = "Anonymous Logon"
}

foreach ($sid in $dangerousSids.Keys) {
  $name = $dangerousSids[$sid]
  Write-Host "`n=== ACEs granting $name ($sid) ==="
  
  Get-ADObject -Filter * -Properties nTSecurityDescriptor |
    ForEach-Object {
      $acl = $_.nTSecurityDescriptor
      $acl.Access | Where {
        $_.AccessControlType -eq "Allow" -and
        $_.IdentityReference.Value -match $sid -and
        $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|ExtendedRight"
      } | Select @{n='Object';e={$_.DistinguishedName}},ActiveDirectoryRights
    }
}
```

___

## Trust Account Group Membership

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Trust account `<NETBIOS>$` | User-style | Standard. |
| INTERDOMAIN_TRUST_ACCOUNT UAC flag | 0x800 / 2048 | Bitwise. |
| Default group memberships | Domain Users (513) | Standard. |
| Trust account in privileged group | Edge — risky | Audit. |
| Cross-trust trust account | Both sides | Standard. |
| Trust account hash via DCSync | Privileged dump | Adjacent. |
| Audit: trust account out-of-default group | Detection | Defender. |
| Modern: trust account in Protected Users | Hardening | Defense. |
| `Get-ADUser -Filter {UserAccountControl -band 2048}` | Detection | Standard. |
| Trust account UPN format | `<dom>$@<peer>` | Standard. |
| Cross-correlate with FSP | Adjacent | Audit. |
| Trust account password rotation | 30 days default | Standard. |
| Detection: trust account in priv group | Critical alert | Defender. |
| BloodHound trust account analysis | Custom edges | Adjacent. |
| Trust account abuse adjacent to forest takeover | Strategy | Adjacent. |
| Audit cross-trust priv group | Comprehensive | Standard. |
^ad-foreign-trustaccount

### Trust account audit

```powershell
# Trust accounts (UAC flag 2048)
Get-ADUser -Filter {UserAccountControl -band 2048} -Properties UserAccountControl,SamAccountName,Description |
  Select SamAccountName,Description

# Trust accounts in privileged groups (CRITICAL audit)
Get-ADGroupMember "Domain Admins" -Recursive | 
  Get-ADUser -Properties UserAccountControl |
  Where {$_.UserAccountControl -band 2048}

Get-ADGroupMember "Enterprise Admins" -Recursive | 
  Get-ADUser -Properties UserAccountControl |
  Where {$_.UserAccountControl -band 2048}
```

___

## sIDHistory Cross-Trust Patterns

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| sIDHistory holds prior SIDs | Migration mechanism | Standard. |
| Cross-trust sIDHistory abuse | Forest takeover | Critical. |
| With SID Filter: sIDHistory dropped | Defense | Standard. |
| Without SID Filter: sIDHistory accepted | Vulnerability | Standard. |
| User with foreign sIDHistory | Migrated user | Standard. |
| Privileged foreign sIDHistory | Cross-forest privesc | Critical. |
| `Get-ADUser ... -Properties sIDHistory` | Direct query | Standard. |
| Resolve foreign sIDHistory SIDs | Cross-domain LDAP | Adjacent. |
| Migration tool ADMT sets sIDHistory | Standard | Standard. |
| Cleanup post-migration | Should remove | Hygiene. |
| BloodHound HasSIDHistory edge | Visual | Tool. |
| Suspicious: non-migrated user with sIDHistory | Investigate | Detection. |
| Adjacent: trust attribute SID Filtering | Defense check | Adjacent. |
| Audit: list users with foreign sIDHistory | Standard | Compliance. |
| Cross-correlate with priv group | High-value | Strategy. |
| Detection: sIDHistory modify event | Defender | Adjacent. |
^ad-foreign-sidhistory

### sIDHistory audit

```powershell
# All users with sIDHistory
Get-ADUser -Filter * -Properties sIDHistory |
  Where {$_.sIDHistory} |
  Select Name,SamAccountName,@{n='SIDHistory';e={$_.sIDHistory -join '; '}}

# Privileged + sIDHistory (CRITICAL)
Get-ADUser -Filter {AdminCount -eq 1} -Properties sIDHistory,AdminCount |
  Where {$_.sIDHistory}

# Resolve foreign SIDs
$users = Get-ADUser -Filter * -Properties sIDHistory | Where {$_.sIDHistory}
foreach ($u in $users) {
  Write-Host "`n=== $($u.SamAccountName) ==="
  $u.sIDHistory | ForEach-Object {
    try {
      $name = (New-Object System.Security.Principal.SecurityIdentifier($_.Value)).Translate([System.Security.Principal.NTAccount])
      Write-Host "  $($_.Value) → $name"
    } catch {
      Write-Host "  $($_.Value) → UNRESOLVABLE"
    }
  }
}
```

***
