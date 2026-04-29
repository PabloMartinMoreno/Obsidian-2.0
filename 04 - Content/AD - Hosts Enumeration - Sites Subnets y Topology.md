---
aliases:
  - AD Sites and Services
  - Replication Topology
  - AD Subnets
  - Site Links
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
  - "[[AD - Hosts Enumeration]]"
---
# AD - Hosts Enumeration - Sites, Subnets & Topology

***

## Sites Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADReplicationSite -Filter *` | All sites | RSAT standard. |
| `Get-ADReplicationSite -Filter * -Properties *` | Full attributes | Detailed. |
| `nltest /dsgetsite` | Current site | Local context. |
| `nltest /server:DC /dsgetsite` | DC site | Per-server. |
| `Get-ADReplicationSite | Select Name,Description,Subnets` | Concise | Summary. |
| `dsquery site` | Legacy native | Old. |
| LDAP base `CN=Sites,CN=Configuration,DC=...` | Direct LDAP | Forest config. |
| `ldapsearch ... -b "CN=Sites,CN=Configuration,DC=dom,DC=local" "(objectClass=site)"` | Linux LDAP | Direct. |
| `Get-NetSite` (PowerView) | Adversary tool | Same. |
| `Get-NetSite -FullData` | Detail | Comprehensive. |
| Default-First-Site-Name | Default site | New domain. |
| `Get-DomainSite` (PowerView v3) | Newer PowerView | Adjacent. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest().Sites` | .NET | DotNet. |
| Site links → multiple sites | Topology design | Replication. |
| Sites with no subnets | "Default-First-Site-Name" catch-all | Edge. |
| Sites for branch offices | Per-location separation | Common pattern. |
^ad-topology-sites

### Sites quick recon

```powershell
# RSAT
Get-ADReplicationSite -Filter * -Properties * |
  Select Name,Description,@{n='Subnets';e={(Get-ADReplicationSubnet -Filter "Site -eq '$($_.DistinguishedName)'").Name}}

# PowerView
Import-Module .\PowerView.ps1
Get-DomainSite | Select Name,Description
```

```bash
# LDAP direct
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "CN=Sites,CN=Configuration,DC=dom,DC=local" \
  -s subtree "(objectClass=site)" cn description
```

___

## Subnets per Site

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADReplicationSubnet -Filter *` | All subnets | RSAT. |
| `Get-ADReplicationSubnet -Filter * -Properties *` | Full attributes + Site ref | Detailed. |
| `nltest /sclist:<dom>` | Adjacent | Trust adjacent. |
| LDAP base `CN=Subnets,CN=Sites,CN=Configuration,DC=...` | Direct | Linux. |
| `ldapsearch ... -b "CN=Subnets,CN=Sites,CN=Configuration,DC=dom,DC=local" "(objectClass=subnet)"` | Direct | Linux. |
| `Get-DomainSubnet` (PowerView) | Adversary | Same. |
| `Get-NetSubnet -FullData` | Older PowerView | Adjacent. |
| Subnets sin Site asignado | Misconfig — replication issues | Indicator. |
| Subnets overlapping | Misconfig | Edge. |
| `siteObject` attribute | Subnet → Site link | Cross-ref. |
| IPv4 + IPv6 subnets | Modern AD support | Mixed. |
| Subnets from `_Sites` | LDAP filter | Direct. |
| Pivot opportunities | Subnets reveal segments | Lateral planning. |
| Branch office IP space | Geographically distributed | Plan. |
| DMZ subnets exposed | Public-facing AD-joined | Risk. |
| Internal-only subnets | Pivot required | Recon limit. |
^ad-topology-subnets

### Subnet → Site mapping

```powershell
# Map all subnets to their sites
Get-ADReplicationSubnet -Filter * -Properties * |
  Select Name,@{n='Site';e={($_.Site -split ',CN=')[1]}},Description |
  Sort Site,Name
```

```bash
# LDAP raw subnet list
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "CN=Subnets,CN=Sites,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=subnet)" cn siteObject description
```

___

## Site Links & Replication Topology

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADReplicationSiteLink -Filter *` | All site links | RSAT. |
| `Get-ADReplicationSiteLink -Filter * -Properties *` | Schedule + cost | Full detail. |
| `Get-ADReplicationSiteLinkBridge -Filter *` | Bridge config | Edge. |
| `Get-ADReplicationConnection` | KCC connections | Replication paths. |
| `repadmin /showrepl` | Replication status (privileged) | Native. |
| `repadmin /replsummary` | Quick status | Privileged. |
| `repadmin /showconn` | Connection objects | Privileged. |
| `Get-ADReplicationFailure -Target DC` | Failures | Privileged. |
| LDAP `CN=Inter-Site Transports` | Transport types (IP/SMTP) | Direct. |
| Site link cost | Lower = preferred | Topology design. |
| Replication schedule | Hours per day | Bandwidth control. |
| KCC (Knowledge Consistency Checker) | Auto-generated | Built-in. |
| Manual connections | Override KCC | Edge. |
| Hub & spoke topology | Common enterprise | Pattern. |
| Full mesh | Less common | Pattern. |
| Site Link Bridges | Disabled bridging? | Edge config. |
| RPC vs SMTP transport | SMTP rare | Legacy. |
^ad-topology-replication

### Replication topology overview

```powershell
# Site links + cost
Get-ADReplicationSiteLink -Filter * -Properties * |
  Select Name,Cost,ReplicationFrequencyInMinutes,@{n='Sites';e={$_.SitesIncluded -join ', '}}

# Bridges (less common)
Get-ADReplicationSiteLinkBridge -Filter *

# Connection objects
Get-ADReplicationConnection -Filter *
```

___

## DC Roles & FSMO Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `netdom query fsmo` | All 5 FSMO roles | Native. |
| `Get-ADDomain | Select PDCEmulator,RIDMaster,InfrastructureMaster` | RSAT (3 domain-level) | PS native. |
| `Get-ADForest | Select SchemaMaster,DomainNamingMaster` | 2 forest-level | PS native. |
| `dsquery server -hasfsmo schema` | Schema Master | Legacy. |
| `dsquery server -hasfsmo name` | Domain Naming Master | Legacy. |
| `dsquery server -hasfsmo pdc` | PDC | Legacy. |
| `dsquery server -hasfsmo rid` | RID Master | Legacy. |
| `dsquery server -hasfsmo infr` | Infrastructure | Legacy. |
| Schema Master | Forest-level — schema mod | High-value (Schema Admins). |
| Domain Naming Master | Forest-level — domain add/remove | Forest control. |
| PDC Emulator | Domain — time, password sync, GPO modifications | High-value. |
| RID Master | Domain — RID pool allocation | Adjacent. |
| Infrastructure Master | Domain — cross-domain references | Trust health. |
| Sites identifier | Repl site of each FSMO | Topology. |
| Standby DCs (no FSMO) | Lower-priority targets initially | Strategy. |
| Single FSMO host | Single point of compromise | Critical target. |
^ad-topology-fsmo

### FSMO quick

```cmd
netdom query fsmo
```

```powershell
$domain = Get-ADDomain
$forest = Get-ADForest

[PSCustomObject]@{
  PDCEmulator         = $domain.PDCEmulator
  RIDMaster           = $domain.RIDMaster
  InfrastructureMaster= $domain.InfrastructureMaster
  SchemaMaster        = $forest.SchemaMaster
  DomainNamingMaster  = $forest.DomainNamingMaster
}
```

___

## Global Catalog & Read-Only DCs

| **Concepto** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| GC list | `Get-ADDomainController -Filter {IsGlobalCatalog -eq $true}` | RSAT. |
| GC SRV record | `_gc._tcp.<forest>` | DNS direct. |
| GC ports | 3268 (LDAP) / 3269 (LDAPS) | Forest queries. |
| RODC list | `Get-ADDomainController -Filter {IsReadOnly -eq $true}` | Detection. |
| RODC krbtgt-RODC | Specific filtered krbtgt | Edge. |
| RODC password replication policy | `msDS-RevealedDSAs`, `msDS-NeverRevealGroup` | Allowed/denied. |
| Allowed cred replication | Members can have password cached on RODC | Risk surface. |
| Denied list | Tier 0 typically denied | Defense. |
| RODC compromise impact | Filtered creds only — not full domain | Limited. |
| `Get-ADComputer -Filter * -Properties msDS-RevealedDSAs` | RODC cache analysis | Detail. |
| Site placement | RODC at branch | Common pattern. |
| FSMO never on RODC | Operational rule | Standard. |
| GC vs DC | All DCs may be GC, not all are | Optional role. |
| GC required for forest queries | Multi-domain | Required. |
| GC at PDC/Schema | Common | Standard. |
| Universal Group Membership Caching | Per-site optimization | Edge. |
^ad-topology-gcrodc

### GC + RODC discovery

```powershell
# GCs
Get-ADDomainController -Filter * |
  Select Name,IsGlobalCatalog,IsReadOnly,Site,IPv4Address |
  Sort Site,Name

# RODCs specifically
Get-ADDomainController -Filter {IsReadOnly -eq $true} |
  Select Name,Site,IPv4Address

# Per-RODC cached credentials (privileged)
$rodc = Get-ADDomainController -Filter {IsReadOnly -eq $true}
$rodc | ForEach-Object {
  Get-ADObject $_.NTDSSettingsObjectDN -Properties msDS-RevealedDSAs |
    Select Name,@{n='CachedAccounts';e={$_.'msDS-RevealedDSAs'.Count}}
}
```

***
