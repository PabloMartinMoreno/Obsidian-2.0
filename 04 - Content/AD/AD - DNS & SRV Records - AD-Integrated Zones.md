---
aliases:
  - AD DNS Zones
  - DomainDnsZones
  - ForestDnsZones
  - MicrosoftDNS Partition
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
  - asset/dns
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - DNS & SRV Records]]"
---
# AD - DNS & SRV Records - AD-Integrated DNS Zones

---

## DNS Storage Architecture

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -s base -b "" namingContexts` | Lista NCs incluyendo DomainDnsZones/ForestDnsZones | Confirmar dónde viven las zonas. |
| `Get-ADReplicationPartition -Filter *` | Particiones de replicación | RSAT view. |
^ad-zones-architecture

**DNs típicos:**
- Domain zones: `DC=DomainDnsZones,DC=corp,DC=local` (replica a DCs del domain).
- Forest zones: `DC=ForestDnsZones,DC=corp,DC=local` (replica a todos DCs del forest).
- Legacy zones: `CN=MicrosoftDNS,CN=System,DC=corp,DC=local` (pre-Win2003).

```bash
# Confirmar particiones DNS-related
ldapsearch -x -h <DC> -s base -b "" namingContexts | grep -i "dns"
```

---

## Zone Enumeration via LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D u -w p -b "DC=DomainDnsZones,DC=corp,DC=local" -s onelevel "(objectClass=dnsZone)" dc` | Zonas domain-replicated | Inventory zones. |
| `ldapsearch -h <DC> -D u -w p -b "DC=ForestDnsZones,DC=corp,DC=local" -s onelevel "(objectClass=dnsZone)" dc` | Zonas forest-replicated | Forest-wide. |
| `Get-DnsServerZone -ComputerName <DC>` | Todas las zonas (RSAT-DNS) | Native. |
| `dnscmd <DC> /enumzones` | Zones via dnscmd | Sin RSAT-DNS. |
| `Get-ADObject -SearchBase "DC=DomainDnsZones,..." -Filter "ObjectClass -eq 'dnsZone'"` | Zonas via AD module genérico | Sin RSAT-DNS. |
^ad-zones-ldap-enum

```bash
# LDAP zones list
ldapsearch -h <DC> -D 'corp\u' -w pass \
  -b "DC=DomainDnsZones,DC=corp,DC=local" \
  -s onelevel \
  "(objectClass=dnsZone)" \
  dc distinguishedName
```

```powershell
# RSAT zones con replication scope
Get-DnsServerZone -ComputerName <DC> |
  Select ZoneName,ZoneType,ReplicationScope,IsAutoCreated,DynamicUpdate
```

---

## Records Discovery (dnsNode Objects)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DnsServerResourceRecord -ZoneName <zone> -ComputerName <DC>` | Todos records (RSAT) | Audit completo. |
| `Get-DnsServerResourceRecord -ZoneName <zone> -RRType A` | Filter por tipo | Targeted. |
| `dnscmd <DC> /enumrecords <zone> @` | Records via dnscmd | Sin RSAT-DNS. |
| `adidnsdump -u 'corp\u' -p pass <DC> --zone corp.local -r` | Dump LDAP `dnsRecord` blobs (Linux) | Sin Windows. |
| `adidnsdump -u 'corp\u' -p pass <DC> --print-zones` | Lista zones via LDAP | Discovery. |
^ad-zones-records

**`dnsRecord` attribute** es un blob binario. `adidnsdump` y `Get-DnsServerResourceRecord` lo parsean. LDAP raw devuelve binario.

```bash
# adidnsdump pipeline
pip install adidnsdump
adidnsdump -u 'corp\u' --password 'pass' <DC> --print-zones
adidnsdump -u 'corp\u' --password 'pass' <DC> --zone corp.local -r > records.csv
```

```powershell
# RSAT — todos records con timestamps
Get-DnsServerResourceRecord -ZoneName "corp.local" -ComputerName <DC> |
  Select RecordType,HostName,RecordData,Timestamp |
  Sort RecordType,HostName
```

---

## Replication Scope Implications

| **Scope** | **Replicado a** | **Implicación** |
|:---:|:---:|:---:|
| `DomainDnsZones` | Todos DCs del domain | Domain-wide visibility. |
| `ForestDnsZones` | Todos DCs del forest | Forest-wide visibility. |
| `Domain` (legacy pre-Win2003) | DCs del domain | Backward compat. |
| Custom application partition | DCs especificados | Edge config. |
| File-based (no AD-integrated) | Solo el server local | No replicado. |
^ad-zones-replication

```powershell
# Replication scope per zone
Get-DnsServerZone -ComputerName <DC> |
  Select ZoneName,ReplicationScope,DynamicUpdate
```

---

## DNS-related Privileged Groups

| **Comando** | **Qué obtenés** | **Por qué importa** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "DnsAdmins" -Recursive` | Members de DnsAdmins | RCE potencial (CVE-2021-40469 + legacy DLL plugin). |
| `Get-ADGroupMember "DnsUpdateProxy"` | Members (típicamente DHCP servers) | DDNS bypass auth. |
| `Get-Acl "AD:DC=corp,DC=local,DC=DomainDnsZones,DC=corp,DC=local"` | DACL de zona | Detectar `GenericAll`/`CreateChild`. |
| `Get-ADGroup -Filter * \| ? Name -match "(?i)dns"` | Groups DNS-related | Audit. |
^ad-zones-groups

**DnsAdmins legacy abuse:** miembro puede registrar DLL como plugin DNS via `dnscmd /config /serverlevelplugindll`. Reload servicio = DLL ejecuta como SYSTEM en DC. Patched CVE-2021-40469 pero environments legacy lo tienen vivo.

```powershell
# DnsAdmins debe estar vacío. Cualquier miembro = audit finding.
Get-ADGroupMember "DnsAdmins" -Recursive | Select Name,SamAccountName,objectClass
```

---

## DNS-Specific Misconfigs

| **Test** | **Qué detecta** | **Acción si positivo** |
|:---:|:---:|:---:|
| `dig AXFR corp.local @<DC>` | AXFR anónimo permitido | Crítico — full zone leak. |
| `dig +short A wpad.corp.local` | WPAD record presente | WPAD attack viable. |
| `dig +short A nonexistent.corp.local` | Wildcard responde a cualquier nombre | Misconfig. |
| `nsupdate` insecure DDNS test | Insecure DDNS habilitado | Spoofing record injection. |
| `Get-DnsServerZone \| ? DynamicUpdate -eq "NonsecureAndSecure"` | Zonas con DDNS insecure | Permite atacante crear records. |
| External resolver query a record interno | Split-horizon DNS leak | Audit zone scope. |
^ad-zones-misconfig

```bash
# AXFR test rápido
for zone in "corp.local" "_msdcs.corp.local"; do
  echo "=== AXFR $zone ==="
  dig AXFR "$zone" @<DC> +short | head -20
done

# Insecure DDNS — nsupdate sin auth (red team test)
nsupdate <<EOF
server <DC>
update add test.corp.local 60 A 1.2.3.4
send
EOF
```

---
