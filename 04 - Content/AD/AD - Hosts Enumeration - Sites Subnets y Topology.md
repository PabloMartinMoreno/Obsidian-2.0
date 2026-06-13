---
aliases:
  - AD Sites and Services
  - Replication Topology
  - AD Subnets
  - Site Links
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - Hosts Enumeration]]"
---
# AD - Hosts Enumeration - Sites, Subnets & Topology

---

## Sites Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADReplicationSite -Filter *` | Lista sites del forest | Topology overview. |
| `nltest /dsgetsite` | Site del host actual | Identificar site local. |
| `nltest /server:<DC> /dsgetsite` | Site de un DC específico | DC-to-site mapping. |
| `Get-DomainSite` (PowerView) | Sites desde adversary tool | Sin RSAT. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest().Sites` | Sites .NET | Sin RSAT ni PowerView. |
| `ldapsearch -b "CN=Sites,CN=Configuration,<DC=...>" "(objectClass=site)" cn description` | Sites desde Linux | Recon LDAP-only. |
^ad-topology-sites

```powershell
# RSAT — sites con sus subnets
Get-ADReplicationSite -Filter * -Properties * |
  Select Name,Description,@{n='Subnets';e={(Get-ADReplicationSubnet -Filter "Site -eq '$($_.DistinguishedName)'").Name}}
```

```bash
# Linux LDAP
ldapsearch -h <DC> -D 'corp\user' -w pass \
  -b "CN=Sites,CN=Configuration,DC=corp,DC=local" \
  "(objectClass=site)" cn description
```

---

## Subnets per Site

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADReplicationSubnet -Filter *` | Lista subnets | Inventory. |
| `Get-ADReplicationSubnet -Filter * -Properties *` | Subnets + Site asociado | Mapeo subnet → site. |
| `Get-DomainSubnet` (PowerView) | Subnets sin RSAT | Adversary. |
| `ldapsearch -b "CN=Subnets,CN=Sites,CN=Configuration,..." "(objectClass=subnet)" cn siteObject description` | Linux LDAP | Recon Linux. |
^ad-topology-subnets

**Pivots útiles:** subnets revelan segmentos físicos (branch offices, DMZ, server VLANs). Subnets sin Site asignado = misconfig (replication issues, DCs sin site assignment correcta).

```powershell
# Subnet → Site map limpio
Get-ADReplicationSubnet -Filter * -Properties * |
  Select Name,@{n='Site';e={($_.Site -split ',CN=')[1]}},Description |
  Sort Site,Name
```

---

## Site Links & Replication Topology

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADReplicationSiteLink -Filter * -Properties *` | Site links + cost + schedule | Topology design. |
| `Get-ADReplicationSiteLinkBridge -Filter *` | Bridges (raro) | Topology compleja. |
| `Get-ADReplicationConnection -Filter *` | Connection objects KCC | Replication paths. |
| `repadmin /showrepl` | Estado replicación per-DC (priv) | Health check. |
| `repadmin /replsummary` | Resumen replicación | Quick status. |
| `repadmin /showconn` | Connection objects desde DC | Detail. |
| `Get-ADReplicationFailure -Target <DC>` | Failures (priv) | Troubleshoot. |
^ad-topology-replication

```powershell
# Site links — cost + sites incluidos
Get-ADReplicationSiteLink -Filter * -Properties * |
  Select Name,Cost,ReplicationFrequencyInMinutes,@{n='Sites';e={$_.SitesIncluded -join ', '}}
```

---

## DC Roles & FSMO Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `netdom query fsmo` | 5 FSMO roles + holders | Native, rápido. |
| `Get-ADDomain \| Select PDCEmulator,RIDMaster,InfrastructureMaster` | 3 FSMO domain-level | RSAT. |
| `Get-ADForest \| Select SchemaMaster,DomainNamingMaster` | 2 FSMO forest-level | RSAT. |
| `dsquery server -hasfsmo schema` | Schema Master (legacy) | Sin RSAT. |
| `dsquery server -hasfsmo pdc` | PDC Emulator (legacy) | Sin RSAT. |
^ad-topology-fsmo

**Por rol — qué controla:**
- **Schema Master** (forest): cambios schema. Schema Admins target.
- **Domain Naming Master** (forest): add/remove domains.
- **PDC Emulator** (domain): time sync, password sync, GPO mods. High-value.
- **RID Master** (domain): RID pool allocation.
- **Infrastructure Master** (domain): cross-domain references.

```powershell
# Snapshot completo
$d = Get-ADDomain; $f = Get-ADForest
[PSCustomObject]@{
  PDCEmulator          = $d.PDCEmulator
  RIDMaster            = $d.RIDMaster
  InfrastructureMaster = $d.InfrastructureMaster
  SchemaMaster         = $f.SchemaMaster
  DomainNamingMaster   = $f.DomainNamingMaster
}
```

---

## Global Catalog & Read-Only DCs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADDomainController -Filter {IsGlobalCatalog -eq $true}` | GCs del domain | Forest queries. |
| `dig +short SRV _gc._tcp.<forest>` | GCs via DNS | Sin auth. |
| `Get-ADDomainController -Filter {IsReadOnly -eq $true}` | RODCs | Branch office targets. |
| `Get-ADObject <RODC-NTDS-DN> -Properties msDS-RevealedDSAs` | Cuentas con creds cached en RODC | RODC compromise scope. |
| `Get-ADObject <RODC-NTDS-DN> -Properties msDS-NeverRevealGroup,msDS-RevealOnDemandGroup` | Allowed/Denied replication | Policy audit. |
^ad-topology-gcrodc

**Puertos GC:** 3268 (LDAP) / 3269 (LDAPS).

**RODC compromise impact:** solo creds de cuentas en `Allowed RODC Password Replication Group` (típicamente users del branch). Tier 0 (Domain Admins) en `Denied` por default = no comprometibles vía RODC.

```powershell
# DCs con flags útiles
Get-ADDomainController -Filter * |
  Select Name,IsGlobalCatalog,IsReadOnly,Site,IPv4Address,OperatingSystem |
  Sort Site,Name
```

---
