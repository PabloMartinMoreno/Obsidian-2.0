---
aliases:
  - GPO Discovery
  - Get-GPO
  - gpcFileSysPath
  - groupPolicyContainer
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[AD - GPO y SYSVOL Enumeration]]'
---
# AD - GPO y SYSVOL Enumeration - GPO Discovery

***

## GPO Inventory

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPO -All` | All GPOs (RSAT-GPO) | Standard. |
| `Get-GPO -All \| Select DisplayName,Id,GpoStatus,WmiFilter,CreationTime,ModificationTime` | + atributos útiles | Detail. |
| `Get-GPOReport -All -ReportType Xml -Path gpos.xml` | Bulk XML export | Parsing. |
| `nxc smb <DC> -u u -p p --gpo` | GPO via netexec | Quick. |
| `Get-ADObject -SearchBase "CN=Policies,CN=System,DC=corp,DC=local" -Filter "ObjectClass -eq 'groupPolicyContainer'"` | LDAP-style RSAT | Sin RSAT-GPO. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "CN=Policies,CN=System,DC=corp,DC=local" "(objectClass=groupPolicyContainer)" cn displayName gPCFileSysPath gPCFunctionalityVersion` | LDAP raw | Linux. |
^ad-gpo-inventory

```powershell
# Inventory comprehensive
Get-GPO -All |
  Select DisplayName,Id,
         @{n='Status';e={$_.GpoStatus}},
         @{n='Created';e={$_.CreationTime}},
         @{n='Modified';e={$_.ModificationTime}},
         @{n='WmiFilter';e={$_.WmiFilter.Name}} |
  Sort ModificationTime -Descending |
  Export-Csv gpos.csv -NoTypeInformation
```

___

## Per-GPO Content via XML Report

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPOReport -Name "<GPO-name>" -ReportType Xml` | XML detallado (settings, links, ACL) | Per-GPO audit. |
| `Get-GPOReport -All -ReportType Html -Path all_gpos.html` | HTML browseable bulk | Reportable. |
| `Get-GPOReport -Name "<GPO>" -ReportType Xml \| Select-Xml "//*"` | XPath query | Targeted attrs. |
| `Get-GPRegistryValue -Name "<GPO>" -Key "HKLM\Software\..."` | Registry settings específicos | Granular. |
^ad-gpo-content

```powershell
# Hunt LAPS settings en GPOs
$Report = Get-GPOReport -All -ReportType Xml
([xml]$Report).GPOReport.GPO | Where {
  $_.Computer.ExtensionData.Extension.Policy -match "(?i)laps|admpwd|mslaps"
} | Select Name,Id

# Hunt cleartext passwords en XML report (rare leak)
$Report -split "`n" | Select-String -Pattern "(?i)password=" | Select Line
```

___

## Linked OUs Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "<OU-DN>"` | GPOs aplicados (linked + inherited) a OU | Per-OU. |
| `Get-ADOrganizationalUnit -Filter * -Pr gPLink \| ? gPLink` | OUs con GPOs linked | Bulk. |
| `(Get-ADDomain).DistinguishedName \| % { Get-GPInheritance -Target $_ }` | Domain root GPOs | Top scope. |
| `Get-GPOReport -All -ReportType Xml \| Select-Xml "//LinksTo"` | Linked locations forest-wide | Bulk. |
^ad-gpo-linkedous

```powershell
# Map GPO → OUs linked
Get-GPO -All | % {
  $g = $_
  $report = [xml](Get-GPOReport -Name $g.DisplayName -ReportType Xml)
  $links = $report.GPO.LinksTo | % { $_.SOMPath }
  [PSCustomObject]@{
    GPO     = $g.DisplayName
    LinkedTo = $links -join '; '
  }
}
```

___

## SYSVOL Storage Path

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPO <GPO> \| Select GpoStatus,Id` | GPO GUID | Bootstrap. |
| `\\<DC>\sysvol\corp.local\Policies\{<GUID>}\` | Filesystem path del GPO | Direct browse. |
| `(Get-ADObject "CN={<GUID>},CN=Policies,CN=System,DC=corp,DC=local" -Pr gPCFileSysPath).gPCFileSysPath` | UNC desde LDAP attr | Standard. |
| `dir \\<DC>\sysvol\corp.local\Policies\{<GUID>}` | Browse contents | Manual. |
^ad-gpo-sysvol

**Estructura típica `{GUID}\`:**
```
{GUID}\
├── GPT.INI                          (version)
├── Machine\
│   ├── Registry.pol                 (machine settings)
│   ├── Preferences\                 (GPP files — cpassword hunt)
│   └── Scripts\                     (logon/startup scripts)
└── User\
    ├── Registry.pol                 (user settings)
    ├── Preferences\
    └── Scripts\
```

___

## GPO Status & Settings

| **Status** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `AllSettingsEnabled` | Both Computer + User active | Default. |
| `ComputerSettingsDisabled` | Solo User config aplicado | Audit. |
| `UserSettingsDisabled` | Solo Computer config aplicado | Audit. |
| `AllSettingsDisabled` | GPO inactive (cleanup candidate) | Audit. |
^ad-gpo-status

```powershell
# Audit disabled GPOs (cleanup)
Get-GPO -All | Where { $_.GpoStatus -eq "AllSettingsDisabled" } | Select DisplayName,Id
```

___

## WMI Filters

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPO -All -Properties WmiFilter \| ? WmiFilter` | GPOs con WMI Filter | Conditional GPOs. |
| `Get-ADObject -Filter "ObjectClass -eq 'msWMI-Som'" -Pr msWMI-Name,msWMI-Parm2` | WMI Filter objects raw | LDAP. |
| `(Get-ADObject "<wmi-filter-DN>" -Pr msWMI-Parm2).'msWMI-Parm2'` | Query WQL del filter | Detail. |
^ad-gpo-wmi

___

## Cross-Domain GPO

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADForest).Domains \| % { Get-GPO -All -Domain $_ }` | GPOs forest-wide | Multi-domain. |
| `Get-GPInheritance -Target "<cross-domain-OU-DN>"` | Cross-domain GPO inheritance | Edge. |
^ad-gpo-multidomain

___

## Privileged GPO Identification

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "OU=Domain Controllers,$((Get-ADDomain).DistinguishedName)"` | GPOs en DCs OU (Tier 0) | Critical. |
| `Get-ADOrganizationalUnit -Filter "Name -like '*Tier0*' -or Name -like '*Admin*'" -Pr gPLink \| ? gPLink` | Tier 0 OUs con GPOs | Audit. |
| `Get-GPO -All \| ? DisplayName -match "(?i)admin\|tier0\|priv\|dc"` | Naming heuristic | Pattern hunt. |
^ad-gpo-privileged

```powershell
# Tier 0 GPO inventory
$T0OUs = @(
  "OU=Domain Controllers,$((Get-ADDomain).DistinguishedName)",
  "OU=Tier 0,$((Get-ADDomain).DistinguishedName)"
)

foreach ($ou in $T0OUs) {
  Write-Host "`n=== $ou ==="
  Get-GPInheritance -Target $ou -EA SilentlyContinue |
    Select -Expand GpoLinks |
    Select DisplayName,Enabled,Order
}
```

***
