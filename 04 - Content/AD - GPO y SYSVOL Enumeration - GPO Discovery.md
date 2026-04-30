---
aliases:
  - GPO Discovery
  - Get-GPO
  - gpcFileSysPath
  - GPO Linked OUs
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
# AD - GPO & SYSVOL Enumeration - GPO Discovery

***

## GPO Inventory

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-GPO -All` | All GPOs | RSAT. |
| `Get-GPO -All | Select DisplayName,Id,GpoStatus` | Concise | Standard. |
| `Get-GPOReport -All -ReportType HTML` | HTML report all | Adjacent. |
| `Get-GPOReport -GUID <id> -ReportType XML` | Per-GPO content | Detail. |
| `gpresult /h policy.html` | Per-host effective | Per-host. |
| LDAP `(objectClass=groupPolicyContainer)` | Direct | Standard. |
| GPO container DN | `CN=Policies,CN=System,DC=...` | Storage. |
| `Get-DomainGPO` (PowerView) | Adversary | Standard. |
| `nxc ldap DC -u u -p p --gpo` | netexec wrapper | Quick. |
| GPO storage: SYSVOL files | `\\dom\SYSVOL\dom\Policies\<GUID>\` | Adjacent. |
| Per-GPO GUID identifier | Standard | Standard. |
| Default GPOs | Default Domain Policy, DC Policy | Standard. |
| Custom GPOs per-org | Audit | Standard. |
| Detection: bulk GPO query | Defender | Adjacent. |
| BloodHound GPO nodes | Modern | Tool. |
| Cross-correlate with linked OUs | Standard | Audit. |
^ad-gpo-inventory

### GPO inventory

```powershell
# All GPOs
Get-GPO -All | Select DisplayName,Id,GpoStatus,CreationTime,ModificationTime

# Default vs Custom
$defaults = "Default Domain Policy","Default Domain Controllers Policy"
$custom = Get-GPO -All | Where {$defaults -notcontains $_.DisplayName}
$custom | Select DisplayName,Id

# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Policies,CN=System,DC=dom,DC=local" \
  "(objectClass=groupPolicyContainer)" \
  cn displayName gpcFileSysPath flags
```

___

## Per-GPO Content via XML Report

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-GPOReport -GUID <id> -ReportType XML` | XML | Detailed. |
| `Get-GPOReport -GUID <id> -ReportType HTML` | Visual | Standard. |
| Output: Computer Configuration + User Configuration | Standard | Standard. |
| Sections: Software Settings, Windows Settings, Admin Templates | Standard | Standard. |
| `gpedit.msc` | GUI | Adjacent. |
| `gpmc.msc` | GPMC GUI | Adjacent. |
| Settings: registry, scripts, security, restrictions | Standard | Standard. |
| Linked OUs in report | Direct | Standard. |
| `gpresult /h` per-host effective | Standard | Standard. |
| Cross-correlate per-OU GPO inheritance | Standard | Audit. |
| Detection: GPO modify events | Defender | Adjacent. |
| Modern: minimal GPOs | Best practice | Standard. |
| Per-quarter GPO review | Standard | Compliance. |
| Documentation: per-GPO purpose | Standard | Adjacent. |
| Audit: stale GPOs | Standard | Standard. |
| BloodHound GPO content awareness | Modern | Tool. |
^ad-gpo-content

### GPO content review

```powershell
# Per-GPO XML report
$gpo = Get-GPO -DisplayName "Default Domain Policy"
$report = Get-GPOReport -Guid $gpo.Id -ReportType XML
$report | Out-File "DDP.xml"

# Parse XML for sensitive sections
[xml]$xml = $report
$xml.GPO.Computer.ExtensionData |
  Where {$_.Name -match "Security|Scripts|Software"}

# Bulk all GPOs
Get-GPO -All | ForEach-Object {
  Get-GPOReport -Guid $_.Id -ReportType XML |
    Out-File "GPO_$($_.DisplayName -replace ' ','_').xml"
}
```

___

## Linked OUs Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "OU=X,DC=dom,DC=local"` | Per-OU GPO list | Standard. |
| `Get-GPInheritance -Target "OU=X" -ErrorAction SilentlyContinue` | Adjacent | Standard. |
| Per-OU `gPLink` attribute | Direct LDAP | Standard. |
| `gPLink` format | `[gpoDN;flag]` per-link | Format. |
| Flag 0 = enabled | Standard | Standard. |
| Flag 1 = disabled | Edge | Edge. |
| Flag 2 = enforced | Hardening | Standard. |
| LDAP `(gPLink=*)` filter | OUs with linked GPOs | Standard. |
| Cross-correlate per-OU contents | Audit | Standard. |
| Detection: GPO link modify | Defender | Adjacent. |
| BloodHound `GpLink` edge | Modern | Tool. |
| Cypher: per-OU GPO impact | Custom | Tool. |
| Modern: per-OU GPO inventory | Best practice | Standard. |
| Compliance: documented per-OU | Standard | Adjacent. |
| Stale GPO links | Audit | Standard. |
| Cleanup: unused GPO unlinked | Hygiene | Standard. |
^ad-gpo-linkedous

### Linked OUs discovery

```powershell
# Per-OU GPO inheritance
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
  $inheritance = Get-GPInheritance -Target $_.DistinguishedName -ErrorAction SilentlyContinue
  if ($inheritance.GpoLinks) {
    [PSCustomObject]@{
      OU = $_.Name
      LinkedGPOs = $inheritance.GpoLinks | Select DisplayName,GpoId,Enforced -OutVariable {(Get-Variable -Scope 0)}
      BlockInheritance = $inheritance.GpoInheritanceBlocked
    }
  }
}

# Reverse: per-GPO linked OUs
$gpos = Get-GPO -All
foreach ($g in $gpos) {
  $report = [xml](Get-GPOReport -Guid $g.Id -ReportType XML)
  $linked = $report.GPO.LinksTo | ForEach-Object { $_.SOMPath }
  
  [PSCustomObject]@{
    GPO = $g.DisplayName
    LinkedOUs = $linked -join '; '
  }
}
```

___

## SYSVOL Storage Path

| **Path** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `\\dom\SYSVOL\dom\Policies\<GUID>` | GPO files | Standard. |
| `Machine\` and `User\` subdirs | Per-config side | Standard. |
| `Registry.pol` | Registry settings | Standard. |
| `Scripts\` subdir | Logon/logoff scripts | Standard. |
| `Preferences\` subdir | GPP files | Adjacent. |
| `GPT.INI` | GPO version info | Standard. |
| `gpcFileSysPath` LDAP attribute | Points to SYSVOL | Direct. |
| SYSVOL = DFS-R replicated | Standard | Standard. |
| Per-DC SYSVOL copy | Replicated | Standard. |
| `\\dom\NETLOGON` | Adjacent | Adjacent. |
| Authenticated Read | Default | Permissive. |
| Modify: typically Domain Admins / Group Policy Creator Owners | Privileged | Standard. |
| Per-GPO SYSVOL ACL | Granular | Standard. |
| `gpcFileSysPath` audit | Standard | Compliance. |
| Detection: SYSVOL modify events | Defender | Adjacent. |
| Adjacent: SYSVOL Content hub | Cross-ref | Adjacent. |
^ad-gpo-sysvol

### SYSVOL exploration

```bash
# Linux SMB
smbclient //DC/SYSVOL -U user

# List GPO directories
ls "\\dom.local\SYSVOL\dom.local\Policies\"

# Per-GPO contents
ls "\\dom.local\SYSVOL\dom.local\Policies\{GUID}\"
# Machine\
# User\
# GPT.INI
```

```powershell
# Map SYSVOL drive
New-PSDrive -Name SYSVOL -PSProvider FileSystem -Root "\\dom.local\SYSVOL\dom.local"

# Per-GPO inspect
Get-ChildItem "SYSVOL:\Policies" -Directory |
  Select Name,LastWriteTime
```

___

## GPO Status & Settings Enabled

| **Status** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `AllSettingsEnabled` | Computer + User settings active | Standard. |
| `AllSettingsDisabled` | All disabled | Edge. |
| `ComputerSettingsDisabled` | Computer side disabled | Edge. |
| `UserSettingsDisabled` | User side disabled | Edge. |
| Per-GPO setting | Granular | Standard. |
| `Get-GPO -DisplayName X | Select GpoStatus` | RSAT | Standard. |
| `flags` LDAP attribute | Bitfield | Standard. |
| Stale GPOs (no settings) | Audit | Standard. |
| Modify status: Set-GPO | Privileged | Standard. |
| Detection: GPO status modify | Defender | Adjacent. |
| Audit: per-GPO purpose | Standard | Compliance. |
| Modern: minimal active GPOs | Best practice | Standard. |
| Cleanup: disabled stale GPOs | Hygiene | Standard. |
| Per-quarter GPO review | Standard | Compliance. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate with linked OUs | Standard | Audit. |
^ad-gpo-status

### GPO status check

```powershell
# All GPO statuses
Get-GPO -All | Select DisplayName,GpoStatus,WmiFilter |
  Sort GpoStatus

# Disabled GPOs (cleanup candidates)
Get-GPO -All | Where GpoStatus -ne "AllSettingsEnabled"
```

___

## WMI Filters

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| WMI Filters | Per-GPO conditional | Standard. |
| Per-GPO single WMI filter | Standard | Standard. |
| WMI query examples | OS version, hardware, etc. | Standard. |
| Storage: `CN=SOM,CN=WMIPolicy,CN=System,DC=...` | LDAP | Direct. |
| `Get-GPOWmiFilter` (RSAT) | List filters | Standard. |
| Per-GPO WmiFilter property | Direct | Standard. |
| WMI filter modify rights | Privileged | Standard. |
| Detection: WMI filter modify | Defender | Adjacent. |
| Bypass: filter mismatched hosts | Edge | Adjacent. |
| Cross-correlate per-GPO | Standard | Audit. |
| Stale WMI filters | Audit | Standard. |
| Cleanup: unused filters | Hygiene | Standard. |
| Per-quarter WMI filter review | Standard | Compliance. |
| Modern: minimal WMI filters | Best practice | Standard. |
| BloodHound limited WMI awareness | Edge | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-gpo-wmi

### WMI filter discovery

```powershell
# All WMI filters
Get-ADObject -SearchBase "CN=SOM,CN=WMIPolicy,CN=System,$((Get-ADDomain).DistinguishedName)" `
  -Filter "ObjectClass -eq 'msWMI-Som'" -Properties *

# Per-GPO WMI filter
Get-GPO -All | Where WmiFilter |
  Select DisplayName,@{n='WmiFilter';e={$_.WmiFilter.Name}}
```

___

## Cross-Domain GPO

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| GPOs per-domain | Each domain has own | Standard. |
| Cross-domain GPO link | Edge — uncommon | Edge. |
| Site-linked GPOs | Forest-level adjacent | Edge. |
| Configuration NC site GPOs | Cross-domain | Edge. |
| `Get-GPO -All -Domain dom` | Specific domain | Standard. |
| Forest-wide audit | Per-domain iterate | Standard. |
| BloodHound multi-domain GPO | Modern | Tool. |
| Detection: cross-domain GPO modify | Defender | Adjacent. |
| Audit: per-domain GPO inventory | Standard | Compliance. |
| Documentation: per-domain baseline | Standard | Adjacent. |
| Cross-correlate priv tier | Standard | Audit. |
| Modern: minimal cross-domain | Best practice | Standard. |
| Stale cross-domain links | Audit | Standard. |
| Cleanup: per-domain | Hygiene | Standard. |
| Compliance: forest-wide audit | Standard | Adjacent. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
^ad-gpo-multidomain

### Forest-wide GPO audit

```powershell
$forest = Get-ADForest

foreach ($d in $forest.Domains) {
  Write-Host "`n=== $d ==="
  try {
    $gpos = Get-GPO -All -Domain $d -ErrorAction SilentlyContinue
    Write-Host "GPO count: $($gpos.Count)"
    $gpos | Select DisplayName,Id,GpoStatus | Format-Table
  } catch {
    Write-Warning "Failed to query $d"
  }
}
```

___

## Privileged GPO Identification

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Default Domain Policy | Tier 0 | Critical. |
| Default Domain Controllers Policy | Tier 0 | Critical. |
| Linked to Domain Controllers OU | Tier 0 | Critical. |
| Linked to Tier 0 OU | Critical | Audit. |
| Modify rights on Tier 0 GPO | Critical privesc | Critical. |
| Authenticated Users with modify | CRITICAL misconfig | Critical. |
| Service account with GPO modify | Common audit | Audit. |
| BloodHound `GpLink` to highvalue | Visual | Tool. |
| Cypher: priv GPO paths | Custom | Tool. |
| Detection: priv GPO modify events | Defender critical alert | Defender. |
| Modern: minimal Tier 0 GPO modify | Best practice | Standard. |
| Per-quarter Tier 0 GPO audit | Standard | Compliance. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
| Stale Tier 0 GPO modify | Audit | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-gpo-privileged

### Priv GPO audit

```powershell
# Tier 0 GPOs (linked to DC OU)
$dcOU = "OU=Domain Controllers,$((Get-ADDomain).DistinguishedName)"
$tier0Inheritance = Get-GPInheritance -Target $dcOU

$tier0Inheritance.GpoLinks | ForEach-Object {
  $gpo = Get-GPO -Guid $_.GpoId
  
  # ACL audit
  $aclPath = "AD:CN={$($gpo.Id)},CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)"
  $modifiers = (Get-Acl $aclPath).Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner") -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  }
  
  if ($modifiers) {
    [PSCustomObject]@{
      GPO = $gpo.DisplayName
      LinkedOU = $dcOU
      NonDefaultModifiers = $modifiers.IdentityReference -join '; '
    }
  }
}
```

***
