---
aliases:
  - GPO Inheritance
  - Block Inheritance
  - Enforced GPO
  - GPO Order
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
  - "[[AD - GPO y SYSVOL Enumeration]]"
---
# AD - GPO & SYSVOL Enumeration - GPO Inheritance & Scope

***

## GPO Application Order

| **Order** | **Scope** | **Notas** |
|:---:|:---:|:---:|
| 1. Local Group Policy | Per-host | Per-host. |
| 2. Site GPOs | Per-AD-Site | Forest-level. |
| 3. Domain GPOs | Per-domain | Standard. |
| 4. OU GPOs | Per-OU (top-down) | Standard. |
| 5. Nested OU GPOs | Inheritance | Standard. |
| Last applied wins | Default behavior | Standard. |
| Enforced GPOs override | Adjacent | Standard. |
| Block inheritance ignores parent | Edge | Standard. |
| `gpresult /h policy.html` | Per-host effective | Standard. |
| Per-OU `Get-GPInheritance -Target OU` | Per-OU GPO list | Standard. |
| `gpupdate /force` | Force apply | Standard. |
| `gpresult /v` | Verbose | Adjacent. |
| `gpresult /scope user` | User-side only | Standard. |
| `gpresult /scope computer` | Computer-side only | Standard. |
| Per-GPO link order | `Get-GPOReport` XML | Standard. |
| Detection: GPO link modify | Defender | Adjacent. |
^ad-gpo-order

### Per-host effective policy

```cmd
:: Per-host effective policy (HTML)
gpresult /h c:\policy.html

:: Verbose
gpresult /v

:: User scope only
gpresult /scope user /v

:: Computer scope only
gpresult /scope computer /v
```

```powershell
# Per-OU GPO inheritance
Get-GPInheritance -Target "OU=Workstations,DC=dom,DC=local"

# Output: GpoLinks (in order), GpoInheritanceBlocked
```

___

## Per-OU gPLink Discovery

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "OU=X,DC=dom,DC=local"` | Per-OU GPOs | Standard. |
| `Get-ADOrganizationalUnit -Identity "OU=X" -Properties gPLink` | Direct attribute | Standard. |
| `gPLink` format: `[gpoDN;flag]` per-link | Format | Standard. |
| Flag 0 = enabled link | Standard | Standard. |
| Flag 1 = disabled link | Edge | Edge. |
| Flag 2 = enforced link | Hardening | Standard. |
| Flag 3 = enforced + disabled | Edge | Edge. |
| LDAP filter `(gPLink=*)` | OUs with linked | Standard. |
| Per-OU iterate via foreach | Standard | Adjacent. |
| BloodHound `GpLink` edge | Visual | Tool. |
| Cypher: paths via GPO links | Custom | Tool. |
| Detection: gPLink modify events | Defender | Adjacent. |
| Modern: minimal links | Best practice | Standard. |
| Per-quarter link audit | Standard | Compliance. |
| Stale GPO links | Audit | Standard. |
| Cleanup: unused links | Hygiene | Standard. |
^ad-gpo-gplink

### gPLink discovery

```powershell
# Per-OU GPOs
Get-ADOrganizationalUnit -Filter * -Properties gPLink | 
  Where {$_.gPLink} | 
  Select Name,DistinguishedName,gPLink

# Decode gPLink (format: [DN;flag][DN;flag]...)
$ou = Get-ADOrganizationalUnit -Identity "OU=Workstations,DC=dom,DC=local" -Properties gPLink
$ou.gPLink -split '\]\[' | ForEach-Object {
  $entry = $_.TrimStart('[').TrimEnd(']')
  $parts = $entry -split ';'
  [PSCustomObject]@{
    GPO_DN = $parts[0]
    Flag = $parts[1]
    Status = switch ($parts[1]) {
      "0" { "Enabled" }
      "1" { "Disabled" }
      "2" { "Enforced" }
      "3" { "Enforced + Disabled" }
    }
  }
}
```

___

## Block Inheritance

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-OU `BlockInheritance` flag | Boolean | Standard. |
| Blocks parent OU GPOs | Standard | Standard. |
| `Get-GPInheritance -Target OU | Select GpoInheritanceBlocked` | RSAT | Standard. |
| LDAP `gPOptions` attribute | 1 = blocked | Direct. |
| Set-GPInheritance: privileged | Modify | Privileged. |
| Bypassed by Enforced GPOs | Adjacent | Standard. |
| Per-OU explicit block | Edge | Standard. |
| Audit: per-OU block status | Standard | Compliance. |
| Detection: block inheritance modify | Defender | Adjacent. |
| Modern: minimal block usage | Best practice | Standard. |
| Stale block inheritance | Audit | Standard. |
| Cleanup: review per-OU | Standard | Compliance. |
| Documented per-OU justification | Standard | Compliance. |
| Cross-correlate with Enforced GPOs | Adjacent | Audit. |
| BloodHound block inheritance edge | Modern | Tool. |
| Per-quarter inheritance audit | Standard | Compliance. |
^ad-gpo-blockinherit

### Block inheritance audit

```powershell
# All OUs with block inheritance
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $inheritance = Get-GPInheritance -Target $_.DistinguishedName -ErrorAction SilentlyContinue
  if ($inheritance.GpoInheritanceBlocked -eq "Yes") {
    [PSCustomObject]@{
      OU = $_.Name
      DN = $_.DistinguishedName
      BlockInheritance = $true
    }
  }
}
```

___

## Enforced GPO Links

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-link Enforced flag | Standard | Standard. |
| Enforced link bypasses block inheritance | Adjacent | Standard. |
| Last applied wins overridden by Enforced | Standard | Standard. |
| `Get-GPInheritance.GpoLinks | Where Enforced -eq "Yes"` | RSAT | Standard. |
| `Get-GPLink` | Per-link detail | Adjacent. |
| `Set-GPLink -Target OU -LinkId X -Enforced` | Privileged | Privileged. |
| Default Domain Policy often Enforced | Standard | Standard. |
| Default DC Policy often Enforced | Standard | Standard. |
| Custom Enforced GPOs | Hardening | Standard. |
| Audit: per-Enforced GPO | Standard | Compliance. |
| Detection: Enforced link modify | Defender | Adjacent. |
| Modern: minimal Enforced | Best practice | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| Cleanup: stale Enforced | Hygiene | Standard. |
| Compliance: documented Enforced GPOs | Standard | Adjacent. |
| BloodHound Enforced edge | Modern | Tool. |
^ad-gpo-enforced

### Enforced links

```powershell
# All Enforced GPO links
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $inheritance = Get-GPInheritance -Target $_.DistinguishedName -ErrorAction SilentlyContinue
  $enforced = $inheritance.GpoLinks | Where Enforced -eq "Yes"
  
  if ($enforced) {
    [PSCustomObject]@{
      OU = $_.Name
      EnforcedGPOs = ($enforced.DisplayName -join '; ')
    }
  }
}
```

___

## RSoP (Resultant Set of Policy)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `gpresult /h policy.html` | Per-host effective policy | Native. |
| `gpresult /r` | Brief summary | Standard. |
| `gpresult /v` | Verbose | Standard. |
| `gpresult /z` | Comprehensive | Standard. |
| `gpresult /scope user` | User-side | Standard. |
| `gpresult /scope computer` | Computer-side | Standard. |
| `gpresult /user user@dom.local` | Specific user | Adjacent. |
| `Get-GPResultantSetOfPolicy` (RSAT) | PS native | Adjacent. |
| `rsop.msc` | GUI | Adjacent. |
| Per-host effective vs designed | Audit | Standard. |
| Cross-correlate with target priv | Standard | Audit. |
| Detection: bulk RSoP queries | Defender | Adjacent. |
| Modern: per-host audit | Standard | Compliance. |
| Stale RSoP | Edge | Edge. |
| Cleanup: re-apply gpupdate | Adjacent | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-gpo-rsop

### RSoP examples

```cmd
:: Comprehensive HTML report
gpresult /h c:\rsop.html

:: User-only
gpresult /h c:\rsop_user.html /scope user

:: Specific remote user
gpresult /s remote-host /user dom\user /h c:\rsop_remote.html
```

```powershell
# PS RSoP
Get-GPResultantSetOfPolicy -ReportType Xml -Path "C:\rsop.xml"
```

___

## Site-Linked GPOs

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Site-linked GPOs | Forest-level | Edge. |
| Storage: `CN=Sites,CN=Configuration,DC=...` | Forest scope | Standard. |
| Per-site `gPLink` attribute | Direct | Standard. |
| Site-linked applied first | Per-host | Standard. |
| `Get-ADReplicationSite -Filter * | Get-GPInheritance -Target $_` | Adjacent | Edge. |
| LDAP `(gPLink=*)` on site objects | Direct | Adjacent. |
| Cross-domain forest-wide | Standard | Adjacent. |
| Detection: site GPO modify | Defender | Adjacent. |
| Modern: minimal site GPOs | Best practice | Standard. |
| Audit: per-site GPO inventory | Standard | Compliance. |
| Cross-correlate per-domain | Standard | Audit. |
| BloodHound site GPO adjacent | Modern | Tool. |
| Per-quarter site audit | Standard | Compliance. |
| Stale site links | Audit | Standard. |
| Cleanup: unused site GPOs | Hygiene | Standard. |
| Modern: continuous monitoring | Defender | Standard. |
^ad-gpo-site

### Site GPO discovery

```powershell
$sites = Get-ADReplicationSite -Filter *

foreach ($site in $sites) {
  Write-Host "`n=== $($site.Name) ==="
  $siteDN = $site.DistinguishedName
  $siteAD = Get-ADObject -Identity $siteDN -Properties gPLink
  if ($siteAD.gPLink) {
    Write-Host "Linked GPOs: $($siteAD.gPLink)"
  }
}
```

___

## Cross-Correlate with Privileged OUs

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| GPO linked to Domain Controllers OU | Tier 0 | Critical. |
| GPO linked to Tier 0 OU | Critical | Critical. |
| GPO with broad scope (domain root) | Wide impact | Audit. |
| Modify GPO = mass compromise | Standard chain | Critical. |
| BloodHound priv GPO paths | Modern | Tool. |
| Cross-correlate per-tier | Standard | Audit. |
| Per-quarter priv OU GPO audit | Standard | Compliance. |
| Detection: priv OU GPO modify | Defender critical | Defender. |
| Modern: minimal modify Tier 0 | Best practice | Standard. |
| Stale priv OU GPO | Audit | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Compliance: documented priv OU baseline | Standard | Adjacent. |
| Cross-correlate with Enforced | Adjacent | Audit. |
| Stale Enforced priv OU | Audit | Standard. |
| Modern: extreme alerting | Critical | Standard. |
^ad-gpo-privou

### Priv OU GPO audit

```powershell
$privOUs = @(
  "OU=Domain Controllers,$((Get-ADDomain).DistinguishedName)",
  "OU=Tier 0,$((Get-ADDomain).DistinguishedName)",
  "$((Get-ADDomain).DistinguishedName)"  # Domain root
)

foreach ($ou in $privOUs) {
  Write-Host "`n=== $ou ==="
  $inheritance = Get-GPInheritance -Target $ou -ErrorAction SilentlyContinue
  $inheritance.GpoLinks | Select DisplayName,Enforced,GpoStatus
}
```

___

## BloodHound Cypher (GPO Inheritance)

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (g:GPO)-[:GpLink]->(ou:OU)` | All linked GPOs | Standard. |
| `MATCH p=(g:GPO)-[:GpLink]->(:OU)-[:Contains*1..]->(c:Computer)` | Effective scope | Standard. |
| Filter highvalue computers | `WHERE c.highvalue = true` | Targeted. |
| Filter Tier 0 OUs | `WHERE ou.distinguishedname CONTAINS "Tier 0"` | Targeted. |
| BHCE 5.x+ GPO support | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Pre-built GPO queries | Standard | Tool. |
| Cross-correlate priv | Standard | Tool. |
| Visual graph | Helpful | Standard. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved GPO | Modern | Tool. |
| Detection: BloodHound queries | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: GPO baseline | Standard | Adjacent. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Cypher edge filtering | Standard | Tool. |
^ad-gpo-bh

### BloodHound GPO queries

```cypher
// All GPO impacts on highvalue computers
MATCH p=(g:GPO)-[:GpLink]->(ou:OU)-[:Contains*1..]->(c:Computer)
WHERE c.highvalue = true
RETURN g.name, ou.name, c.name

// Modify path → linked OU has highvalue
MATCH (u {owned: true})-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|MemberOf*1..]->(g:GPO)
MATCH (g)-[:GpLink]->(ou:OU)-[:Contains*1..]->(target {highvalue: true})
RETURN u.name, g.name, ou.name, target.name

// Block inheritance OUs
MATCH (ou:OU {blocksinheritance: true})
RETURN ou.name
```

___

## Mitigations

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Minimal Enforced links | Best practice | Hardening. |
| Documented per-OU justification | Standard | Compliance. |
| Strict Tier 0 OU GPO modify rights | Critical | Hardening. |
| Per-quarter inheritance audit | Standard | Compliance. |
| Detection: gPLink modify events | Defender | Adjacent. |
| Microsoft Defender for Identity GPO alerts | Modern | Defender. |
| BloodHound continuous GPO audit | Modern | Tool. |
| PingCastle / Purple Knight GPO | Defender | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
| Modern: minimal block inheritance | Best practice | Standard. |
| Stale GPO link cleanup | Hygiene | Standard. |
| Audit log retention | Standard | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
| Cross-correlate priv tier | Standard | Audit. |
| Modern: extreme alerting Tier 0 GPO | Critical | Standard. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
^ad-gpo-mitigations

### Hardening commands

```powershell
# Audit all Enforced links
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $i = Get-GPInheritance -Target $_.DistinguishedName -ErrorAction SilentlyContinue
  $enforced = $i.GpoLinks | Where Enforced -eq "Yes"
  if ($enforced) {
    [PSCustomObject]@{ OU = $_.Name; EnforcedGPOs = $enforced.DisplayName -join ',' }
  }
}

# Detection: enable GPO change auditing
# Audit Policy: Audit Object Access → Directory Service Changes → Success
```

***
