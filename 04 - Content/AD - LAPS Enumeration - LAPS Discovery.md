---
aliases:
  - LAPS Detection
  - ms-Mcs-AdmPwd Schema
  - LAPS Deployment Check
  - LAPS GPO Discovery
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
  - "[[AD - LAPS Enumeration]]"
---
# AD - LAPS Enumeration - LAPS Discovery

***

## Schema Detection

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'ms-Mcs-AdmPwd'"` | Legacy LAPS schema | LAPSv1. |
| `Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'ms-Mcs-AdmPwdExpirationTime'"` | Legacy expiration | LAPSv1. |
| `Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'msLAPS-Password'"` | Windows LAPS | LAPSv2 modern. |
| `Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'msLAPS-EncryptedPassword'"` | Encrypted Windows LAPS | LAPSv2. |
| `Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'msLAPS-PasswordExpirationTime'"` | Modern expiration | LAPSv2. |
| Schema location | `CN=Schema,CN=Configuration,DC=...` | Forest-wide. |
| `ldapsearch ... "(name=ms-Mcs-AdmPwd)"` | LDAP raw schema check | Linux. |
| Forest-wide schema | Single forest schema | Standard. |
| Modern Server 2019+ | LAPSv2 native | Standard. |
| Legacy: separate LAPS install | LAPSv1 binaries | Edge. |
| Both LAPSv1 + LAPSv2 coexist | Some envs | Edge. |
| Schema extension via `Update-AdmPwdADSchema` | LAPSv1 install | Privileged. |
| Schema extension via Server 2019 native | LAPSv2 | Built-in. |
| Detection: schema attributes existence | Direct | Standard. |
| Detection: GPO with LAPS settings | Adjacent | Standard. |
| Audit: LAPS deployment scope | Per-OU | Adjacent. |
^ad-laps-schema

### Schema check

```powershell
# Legacy LAPS attributes
Get-ADObject -SearchBase "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)" `
  -Filter "Name -like 'ms-Mcs-AdmPwd*'" |
  Select Name,DistinguishedName

# Windows LAPS (modern)
Get-ADObject -SearchBase "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)" `
  -Filter "Name -like 'msLAPS-*'" |
  Select Name,DistinguishedName

# If empty for both = LAPS not deployed
# If ms-Mcs-AdmPwd present = LAPSv1 deployed
# If msLAPS-Password present = LAPSv2 deployed
```

```bash
# LDAP raw schema check
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Schema,CN=Configuration,DC=dom,DC=local" \
  "(|(name=ms-Mcs-AdmPwd)(name=msLAPS-Password))" \
  cn distinguishedName
```

___

## LAPS Deployment Detection

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Schema extended | First indicator | Standard. |
| Computers with `ms-Mcs-AdmPwd` set | Active LAPSv1 | Standard. |
| Computers with `msLAPS-Password` set | Active LAPSv2 | Standard. |
| Computers without LAPS | OU not in scope | Standard. |
| Per-OU GPO | LAPS settings deployed via GPO | Standard. |
| LAPS GPO common name | "LAPS Deployment", "LAPS Policy" | Pattern. |
| LAPS-eligible OUs | Domain Computers, Workstations OU | Standard. |
| Domain Controllers OU usually excluded | Microsoft default | Standard. |
| Mixed LAPSv1 + LAPSv2 | Some hosts on each | Edge. |
| Migration in progress | Both attrs may exist | Edge. |
| Per-host LAPS Module installed | `Get-Module AdmPwd.PS` | Per-host check. |
| Server 2022 native LAPSv2 | No extra install | Standard. |
| Windows 11 native LAPSv2 | No extra install | Standard. |
| Backup destination | AD or Azure AD | Configurable. |
| Audit: deployment percentage | Per-OU | Compliance. |
| Detection: LAPS not deployed | Common gap | Audit. |
^ad-laps-deployment

### Deployment percentage

```powershell
# All computers in domain
$total = (Get-ADComputer -Filter * -Properties OperatingSystem |
          Where {$_.OperatingSystem -notmatch "Server"}).Count

# Computers with LAPSv1 password set
$laps1 = (Get-ADComputer -Filter {ms-Mcs-AdmPwdExpirationTime -like "*"}).Count

# Computers with LAPSv2 password set
$laps2 = (Get-ADComputer -Filter {msLAPS-PasswordExpirationTime -like "*"}).Count

Write-Host "Total computers: $total"
Write-Host "LAPSv1 deployed: $laps1 ($([math]::Round($laps1/$total*100, 1))%)"
Write-Host "LAPSv2 deployed: $laps2 ($([math]::Round($laps2/$total*100, 1))%)"
```

___

## GPO LAPS Configuration Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-GPO -All` | All GPOs | Adjacent. |
| `Get-GPO -All | Where DisplayName -match "LAPS"` | LAPS-named GPOs | Pattern. |
| `Get-GPOReport -GUID <gpo> -ReportType XML` | GPO content | Detail. |
| `Get-GPOReport -GUID <gpo> -ReportType HTML` | Visual | Standard. |
| LAPS GPO settings location | Computer Config > Admin Templates > LAPS | GPO path. |
| `gpresult /h policy.html` | Per-host effective | Per-host. |
| LAPS GPO ADMX | `LAPS.admx` (LAPSv1) / `LAPS.admx` updated (v2) | Template. |
| Linked OUs | `Get-GPInheritance -Target "OU=..."` | Scope. |
| Password complexity setting | LAPS-specific | Adjacent. |
| Password length setting | LAPS-specific | Standard. |
| Password age setting | Default 30 days | Standard. |
| Password storage location (LAPSv2) | AD or Azure AD | Configurable. |
| Encryption (LAPSv2) | Specific principal SID | Standard. |
| Detection: LAPS GPO not linked | Deployment gap | Audit. |
| Detection: per-OU LAPS coverage | Compliance | Standard. |
| Audit: LAPS GPO ACL | Adjacent | Adjacent. |
^ad-laps-gpo

### LAPS GPO recon

```powershell
# Find LAPS-related GPOs
Get-GPO -All | Where {$_.DisplayName -match "LAPS|Local Admin Password"} |
  Select DisplayName,Id,@{n='LinkedOUs';e={
    (Get-GPOReport -Guid $_.Id -ReportType XML | 
      Select-Xml -XPath "//LinksTo/SOMPath").Node.InnerText -join '; '
  }}

# Per-OU GPO inheritance
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $gpoLinks = Get-GPInheritance -Target $_.DistinguishedName
  if ($gpoLinks.GpoLinks | Where DisplayName -match "LAPS") {
    [PSCustomObject]@{
      OU = $_.Name
      LAPS_GPO = ($gpoLinks.GpoLinks | Where DisplayName -match "LAPS").DisplayName -join '; '
    }
  }
}
```

___

## OU Scope of LAPS

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| LAPS deployed via GPO link to OU | Standard | Standard. |
| Workstations OU typically | Common scope | Standard. |
| Servers OU sometimes | Per-org policy | Variable. |
| Domain Controllers OU excluded | Best practice | Standard. |
| Inheritance from parent OU | GPO inheritance | Standard. |
| Block inheritance | `BlockInheritance=$true` | Edge. |
| Per-OU LAPS coverage | Audit | Standard. |
| Empty OUs without LAPS | Edge | Edge. |
| Stale computer OUs | Migration leftover | Audit. |
| Mixed LAPSv1 + v2 per OU | Migration | Edge. |
| Per-OU password age customization | Edge | Adjacent. |
| Per-OU encryption principal | LAPSv2 customization | Standard. |
| Audit: every workstation OU has LAPS | Compliance | Standard. |
| Per-OU LAPS readers | ACL-controlled | Standard. |
| Tier 0 admins read everything | Best practice | Standard. |
| Workstation admins read workstations only | Tiered | Best practice. |
^ad-laps-scope

### Per-OU LAPS coverage

```powershell
# Per-OU computer count + LAPS-set count
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $ou = $_
  $computers = Get-ADComputer -SearchBase $ou.DistinguishedName -Filter * `
    -Properties ms-Mcs-AdmPwdExpirationTime,msLAPS-PasswordExpirationTime
  
  $total = $computers.Count
  $lapsSet = ($computers | Where {$_.'ms-Mcs-AdmPwdExpirationTime' -or $_.'msLAPS-PasswordExpirationTime'}).Count
  
  if ($total -gt 0) {
    [PSCustomObject]@{
      OU = $ou.Name
      Total = $total
      LAPSCovered = $lapsSet
      Percentage = "$([math]::Round($lapsSet/$total*100, 1))%"
    }
  }
} | Sort Total -Descending
```

___

## LAPSv1 vs LAPSv2 Comparison

| **Aspect** | **LAPSv1 (Legacy)** | **LAPSv2 (Modern)** |
|:---:|:---:|:---:|
| Schema attr (password) | `ms-Mcs-AdmPwd` | `msLAPS-Password` |
| Schema attr (expiration) | `ms-Mcs-AdmPwdExpirationTime` | `msLAPS-PasswordExpirationTime` |
| Schema attr (encrypted) | None (cleartext only) | `msLAPS-EncryptedPassword` |
| Default storage | AD | AD or Azure AD |
| Encryption | None (plain text) | Per-principal encryption |
| Required: client install | Yes (LAPS MSI) | No (Server 2022+, Win11) |
| Required: schema extension | Yes (manual) | Optional (auto for native) |
| Backup destination | AD only | AD or Azure AD |
| Modern hardening | Limited | Encrypted + per-principal |
| Vulnerable: cleartext in AD | Yes (LAPSv1) | Encrypted (LAPSv2 mode) |
| Anyone with read attr → password | Yes | Encrypted (key access required) |
| Microsoft deprecation | Yes (post-2023) | Recommended modern |
| Migration path | Coexist or replace | Standard migration |
| GPO settings | LAPSv1 ADMX | LAPSv2 ADMX (newer) |
| Admin password ID | `samAccountName=Administrator` (RID 500) typically | Same default |
| Custom local account | Configurable | Configurable |
^ad-laps-comparison

### Detect LAPS version

```powershell
$dom = Get-ADDomain
$schemaPath = "CN=Schema,CN=Configuration,$($dom.DistinguishedName)"

$laps1 = Get-ADObject -SearchBase $schemaPath -Filter "Name -eq 'ms-Mcs-AdmPwd'" -ErrorAction SilentlyContinue
$laps2 = Get-ADObject -SearchBase $schemaPath -Filter "Name -eq 'msLAPS-Password'" -ErrorAction SilentlyContinue

Write-Host "LAPSv1 schema: $(if ($laps1) {'PRESENT'} else {'NOT PRESENT'})"
Write-Host "LAPSv2 schema: $(if ($laps2) {'PRESENT'} else {'NOT PRESENT'})"

if ($laps1 -and -not $laps2) { Write-Host "Mode: LAPSv1 only (legacy)" }
if ($laps2 -and -not $laps1) { Write-Host "Mode: LAPSv2 only (modern)" }
if ($laps1 -and $laps2) { Write-Host "Mode: Mixed (migration)" }
if (-not $laps1 -and -not $laps2) { Write-Host "Mode: LAPS NOT deployed" -ForegroundColor Red }
```

___

## Anonymous LAPS Discovery (Limited)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Anonymous LDAP read | Often blocked | Hardened. |
| Anonymous schema query | Sometimes allowed | Edge. |
| `ldapsearch -x -h DC -s base namingcontexts` | Basic anonymous | Standard. |
| Anonymous LAPS attribute query | Almost always blocked | Edge. |
| Modern Server 2019+ | Anonymous bind disabled | Hardened. |
| Legacy: anonymous schema read | Edge legacy | Edge. |
| Authenticated baseline preferred | Standard | Reliable. |
| RPC anonymous probes don't show LAPS | Different protocol | Standard. |
| netexec anonymous LAPS | `nxc smb DC -u '' -p '' --laps` | Likely blocks. |
| Pre-auth LAPS recon | Limited | Edge. |
| OSINT: LAPS GPO names from leaked docs | OSINT | OSINT. |
| Public DNS / Wayback | Edge | Edge. |
| Initial foothold required | Standard | Standard. |
| Detection: anonymous LAPS attempts | Defender | Adjacent. |
| BloodHound LAPS visibility | Authenticated required | Tool. |
| Compliance audit | Authenticated only | Standard. |
^ad-laps-anonymous

### Anonymous LAPS probe

```bash
# Try anonymous schema query
ldapsearch -x -h DC -s base \
  -b "CN=Schema,CN=Configuration,DC=dom,DC=local" \
  "(name=ms-Mcs-AdmPwd)" cn

# Common: "Operations error" (anonymous blocked)
# Or: empty result (schema deny)
# Modern: authenticated baseline required
```

***
