---
aliases:
  - AD SRV Records
  - LDAP SRV Discovery
  - Kerberos SRV
  - DC SRV Lookup
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
# AD - DNS & SRV Records - SRV Records Estándar AD

***

## SRV Records Globales (Domain-Wide)

| **Record** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| `_ldap._tcp.dc._msdcs.<dom>` | `dig +short SRV _ldap._tcp.dc._msdcs.dom.local` | All DCs LDAP. |
| `_kerberos._tcp.dc._msdcs.<dom>` | `dig +short SRV _kerberos._tcp.dc._msdcs.dom.local` | All DCs KDC TCP. |
| `_kerberos._udp.<dom>` | `dig +short SRV _kerberos._udp.dom.local` | All DCs KDC UDP. |
| `_gc._tcp.<dom>` | `dig +short SRV _gc._tcp.dom.local` | Global Catalog. |
| `_kpasswd._tcp.<dom>` | `dig +short SRV _kpasswd._tcp.dom.local` | Kerberos password change. |
| `_kpasswd._udp.<dom>` | `dig +short SRV _kpasswd._udp.dom.local` | UDP variant. |
| `_ldap._tcp.<dom>` | `dig +short SRV _ldap._tcp.dom.local` | Generic LDAP. |
| `_ldap._tcp.gc._msdcs.<forest>` | `dig +short SRV _ldap._tcp.gc._msdcs.forest.local` | Forest GCs. |
| `_kerberos._tcp.<dom>` | Generic Kerberos | Same as _msdcs typically. |
| `_kerberos-master._tcp.<dom>` | PDC emulator KDC | FSMO marker. |
| `_kerberos-master._udp.<dom>` | UDP variant | FSMO marker. |
| `_ldap._tcp.pdc._msdcs.<dom>` | PDC emulator FQDN | FSMO marker. |
| Priority + Weight in response | DC selection algo | Failover. |
| Port (default 389/88) | Standard | Sometimes custom. |
| TTL value | Cached locally | Stale entries. |
| `dig +noall +answer +norec SRV ...` | Concise output | Scripting. |
^ad-srv-global

### Bulk SRV discovery script

```bash
#!/bin/bash
DOM="$1"  # ej: dom.local

echo "=== Domain SRV records: $DOM ==="

for record in \
  "_ldap._tcp.dc._msdcs.$DOM" \
  "_kerberos._tcp.dc._msdcs.$DOM" \
  "_kerberos._udp.$DOM" \
  "_gc._tcp.$DOM" \
  "_kpasswd._tcp.$DOM" \
  "_kpasswd._udp.$DOM" \
  "_ldap._tcp.$DOM" \
  "_ldap._tcp.pdc._msdcs.$DOM" \
  "_kerberos-master._tcp.$DOM" \
  "_kerberos-master._udp.$DOM"; do
  RESULT=$(dig +short SRV "$record")
  if [ -n "$RESULT" ]; then
    echo "[+] $record"
    echo "$RESULT" | sed 's/^/    /'
  fi
done
```

___

## SRV Records por Site (Site-Aware Discovery)

| **Record** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| `_ldap._tcp.<site>._sites.dc._msdcs.<dom>` | `dig +short SRV _ldap._tcp.SITE._sites.dc._msdcs.dom.local` | Site-specific LDAP DCs. |
| `_kerberos._tcp.<site>._sites.dc._msdcs.<dom>` | Same pattern | Site-specific KDC. |
| `_gc._tcp.<site>._sites.<forest>` | `_gc._tcp.SITE._sites.forest.local` | Site-specific GC. |
| `_ldap._tcp.<site>._sites.<dom>` | Site-specific generic LDAP | Edge. |
| Site name discovery | `nltest /dsgetsite` (local) | Per-host site. |
| All sites enum | `Get-ADReplicationSite -Filter * | Select Name` | RSAT. |
| Sites without records | Misconfig — DCs not registered | Indicator. |
| Stale site records | DC removed but DNS record stays | Common bug. |
| Site preference algo | Closest site → fallback domain-wide | Standard. |
| Per-site replication impact | Local site = lower latency | Topology. |
| Branch office sites | Often reduced DC count | Pattern. |
| Default-First-Site-Name | New domain default | Common. |
| Bulk site → DC mapping | Iterate all sites | Recon. |
| Site link costs in DNS? | No — SRV only weight/priority | Different. |
| Subnet → site lookup | DNS not involved (LDAP) | Adjacent. |
| Empty site records | New site no DCs yet | Edge. |
^ad-srv-sites

### Site-aware enumeration

```bash
DOM="dom.local"

# Get all sites first (requires creds)
SITES=$(nxc ldap DC -u user -p pass --query \
  "(objectClass=site)" "cn" 2>/dev/null | grep -oE 'cn: \S+' | awk '{print $2}')

# Per-site SRV discovery
for site in $SITES; do
  echo "=== Site: $site ==="
  dig +short SRV "_ldap._tcp.$site._sites.dc._msdcs.$DOM"
  dig +short SRV "_kerberos._tcp.$site._sites.dc._msdcs.$DOM"
done
```

___

## msDCS Subdomains (_msdcs Hierarchy)

| **Pattern** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `_msdcs.<dom>` | Microsoft DCS subdomain | AD specific. |
| `dc._msdcs.<dom>` | Domain Controllers | Subdivided. |
| `pdc._msdcs.<dom>` | PDC Emulator | FSMO. |
| `gc._msdcs.<forest>` | Global Catalogs | Forest-wide. |
| `ForestDnsZones._msdcs.<forest>` | Forest DNS replication | Replication scope. |
| `DomainDnsZones._msdcs.<dom>` | Domain DNS replication | Replication scope. |
| Per-DC GUID record | `<guid>._msdcs.<forest>` | DC GUID identifier. |
| `<guid>.dc._msdcs.<dom>` | DC GUID specific | Adjacent. |
| `<guid>._msdcs.<forest>` | KCC alias | Replication. |
| Server name records | `<servername>._msdcs.<dom>` | Per-server. |
| Site references | All under `_sites.dc._msdcs.<dom>` | Hierarchical. |
| Trust references | Inter-domain | Edge. |
| Migration leftover records | Old domain records | Audit. |
| AD-integrated zones replicate _msdcs | Default | Standard. |
| Querying _msdcs zone enum | All DCs visible | Single zone. |
| Manual creation rare | Auto-managed | Don't edit. |
^ad-srv-msdcs

### Enumerate _msdcs zone

```bash
DOM="dom.local"

# Try AXFR on _msdcs zone (if anonymous AXFR allowed)
dig AXFR "_msdcs.$DOM" @DC

# DC GUID enumeration via _msdcs
dig +short ANY "_msdcs.$DOM" @DC

# Specific DC GUID
dig +short SRV "<guid>._msdcs.$DOM"
# Returns DC FQDN even if specific name not advertised
```

___

## SRV Selection: Priority y Weight

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Priority (lower = better) | Client picks lowest priority first | Failover. |
| Weight (higher = preferred within same priority) | Load balancing | Proportional. |
| Format: `priority weight port target` | Standard SRV format | RFC 2782. |
| Default DC weight = 100 | Equal weight | Standard. |
| Custom weight for site preference | Modify weight per site | Adjacent. |
| RODC priority lower (worse) | Defender preference | Edge. |
| TTL impact on selection | Cached → stale selection | Issue. |
| Negative caching | Failed lookup cached | Edge. |
| Round-robin within weight | Random within tier | Standard. |
| netmask-based ordering | DNS subnet ordering | Edge. |
| Client cache duration | OS-specific | Variable. |
| FAILED DC retry interval | Standard 5-15 min | Standard. |
| `nltest /dsgetdc:<dom>` returns selected | Reflects selection logic | Per-call. |
| Recursive resolver impact | Shared cache effects | Edge. |
| DNS scavenging | Cleanup stale records | Defender. |
| DDNS auto-update | DCs re-register periodically | Standard. |
^ad-srv-selection

### Parse SRV response priority/weight

```bash
# Full SRV details
dig SRV _ldap._tcp.dc._msdcs.dom.local +noall +answer

# Output format:
# _ldap._tcp.dc._msdcs.dom.local. 600 IN SRV 0 100 389 dc01.dom.local.
#                                          ^ ^   ^   ^
#                                          | |   |   target
#                                          | |   port
#                                          | weight
#                                          priority
```

___

## SRV Discovery Errors / Misconfigs

| **Símptoma** | **Causa** | **Notas** |
|:---:|:---:|:---:|
| No SRV records at all | DC not registered correctly | Critical misconfig. |
| Stale DC records | Decommissioned DC, DNS not cleaned | Common. |
| Multiple DCs same priority/weight | Equal load balance | Standard. |
| Wrong port in record | Custom port misconfig | Edge. |
| Wrong target FQDN | Renamed DC | Audit. |
| Site records missing | New site, DCs not registered | Common new-site issue. |
| Cross-zone records leak | Forest trust DNS leak | Edge. |
| External DNS reveals internal | Public DNS exposing internal SRV | Critical exposure. |
| Wildcard SRV records | Unusual — investigate | Anomaly. |
| Public-facing AD = SRV exposed | Cloud + on-prem hybrid | Modern reality. |
| DDNS misconfig | DCs unable to register | Operational issue. |
| Manual records vs auto | Mixed = drift over time | Maintenance. |
| Negative DNS cache poisoning | Race conditions | Edge attack. |
| BIND vs Microsoft DNS | Differences in handling | Compatibility. |
| Anycast DNS for DCs | Edge enterprise design | Edge. |
| Failover DNS resolvers | Multi-resolver setup | Standard. |
^ad-srv-errors

### Audit SRV health

```bash
DOM="dom.local"

# Get all DC FQDNs
DCS=$(dig +short SRV "_ldap._tcp.dc._msdcs.$DOM" | awk '{print $4}' | sed 's/\.$//')

# Verify each DC resolves + responds to LDAP
for dc in $DCS; do
  IP=$(dig +short A "$dc")
  REACHABLE=$(timeout 3 bash -c "echo > /dev/tcp/$dc/389" 2>&1 && echo "OK" || echo "DEAD")
  echo "$dc → $IP ($REACHABLE)"
done

# DCs that resolve but are dead = stale records
```

***
