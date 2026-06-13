---
aliases:
  - AD SRV Records
  - LDAP SRV Discovery
  - Kerberos SRV
  - DC SRV Lookup
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
# AD - DNS & SRV Records - SRV Records Estándar AD

---

## SRV Records Globales (Domain-Wide)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short SRV _ldap._tcp.dc._msdcs.<dom>` | Todos los DCs (LDAP) | Discovery inicial. |
| `dig +short SRV _kerberos._tcp.dc._msdcs.<dom>` | KDCs TCP (mismos DCs) | Confirmar Kerberos. |
| `dig +short SRV _kerberos._udp.<dom>` | KDCs UDP | UDP fallback. |
| `dig +short SRV _gc._tcp.<dom>` | Global Catalogs (puerto 3268) | Forest queries. |
| `dig +short SRV _kpasswd._tcp.<dom>` | Kerberos password change service | Pre-auth via kpasswd. |
| `dig +short SRV _ldap._tcp.pdc._msdcs.<dom>` | PDC Emulator | FSMO target. |
| `dig +short SRV _ldap._tcp.gc._msdcs.<forest>` | GCs forest-wide | Cross-domain queries. |
| `dig +short SRV _kerberos-master._tcp.<dom>` | PDC emulator KDC | FSMO marker. |
| `Resolve-DnsName -Type SRV _ldap._tcp.dc._msdcs.<dom>` | Mismo desde Windows | Sin RSAT. |
^ad-srv-global

```bash
#!/bin/bash
DOM="$1"

for r in "_ldap._tcp.dc._msdcs.$DOM" "_kerberos._tcp.dc._msdcs.$DOM" \
         "_kerberos._udp.$DOM" "_gc._tcp.$DOM" "_kpasswd._tcp.$DOM" \
         "_ldap._tcp.pdc._msdcs.$DOM" "_kerberos-master._tcp.$DOM"; do
  R=$(dig +short SRV "$r")
  [ -n "$R" ] && echo "[+] $r" && echo "$R" | sed 's/^/    /'
done
```

---

## SRV Records por Site (Site-Aware Discovery)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short SRV _ldap._tcp.<site>._sites.dc._msdcs.<dom>` | DCs de un site específico | Lateral targeted por site. |
| `dig +short SRV _kerberos._tcp.<site>._sites.dc._msdcs.<dom>` | KDCs por site | Site-aware Kerberos. |
| `dig +short SRV _gc._tcp.<site>._sites.<forest>` | GCs por site | Forest queries low-latency. |
| `nltest /dsgetsite` | Site del host actual | Identificar site local. |
| `Get-ADReplicationSite -Filter * \| Select Name` | Lista sites (RSAT) | Para iterar SRV per-site. |
^ad-srv-sites

```bash
DOM="corp.local"

# Iterar SRV per-site (requiere lista sites)
for site in $(nxc ldap <DC> -u u -p p --query "(objectClass=site)" "cn" 2>/dev/null | grep -oE 'cn: \S+' | awk '{print $2}'); do
  echo "=== Site: $site ==="
  dig +short SRV "_ldap._tcp.$site._sites.dc._msdcs.$DOM"
done
```

---

## msDCS Subdomains (_msdcs Hierarchy)

| **Pattern** | **Significado** | **Cuándo consultar** |
|:---:|:---:|:---:|
| `_msdcs.<forest>` | Microsoft DCS subdomain (forest-wide) | Forest discovery. |
| `dc._msdcs.<dom>` | Domain Controllers | DC enum. |
| `pdc._msdcs.<dom>` | PDC Emulator (FSMO) | Targeted FSMO. |
| `gc._msdcs.<forest>` | Global Catalogs forest-wide | Cross-domain. |
| `ForestDnsZones._msdcs.<forest>` | Forest DNS replication scope | Replication enum. |
| `DomainDnsZones._msdcs.<dom>` | Domain DNS replication scope | Replication enum. |
| `<guid>._msdcs.<forest>` | DC GUID alias | KCC replication identifier. |
^ad-srv-msdcs

```bash
DOM="corp.local"

# AXFR del _msdcs zone (si anonymous AXFR habilitado)
dig AXFR "_msdcs.$DOM" @<DC>

# ANY query (devuelve registros visibles)
dig +short ANY "_msdcs.$DOM" @<DC>
```

---

## SRV Selection: Priority y Weight

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig SRV _ldap._tcp.dc._msdcs.<dom> +noall +answer` | SRV con priority/weight/port/target | Entender DC selection. |
| `nltest /dsgetdc:<dom>` | DC seleccionado por algoritmo cliente | Confirmar resolución actual. |
^ad-srv-selection

**Formato SRV:** `<priority> <weight> <port> <target>` (RFC 2782).
- **Priority** menor = preferido (failover).
- **Weight** mayor = preferido dentro de misma priority (load balance).
- DCs default `0 100 389 <fqdn>`.
- RODCs típicamente con priority alta (worse) = solo si DCs principales caen.

```bash
# Ejemplo respuesta
dig SRV _ldap._tcp.dc._msdcs.corp.local +noall +answer
# _ldap._tcp.dc._msdcs.corp.local. 600 IN SRV 0 100 389 dc01.corp.local.
#                                              ^ ^   ^   ^
#                                              | |   |   target
#                                              | |   port
#                                              | weight
#                                              priority
```

---

## SRV Discovery Errors / Misconfigs

| **Síntoma** | **Causa probable** | **Acción** |
|:---:|:---:|:---:|
| No SRV records | DC no registrado vía DDNS | Verificar `netlogon` service en DC. |
| Stale DC records | DC decomisionado, DNS no limpiado | DNS scavenging. |
| Wrong target FQDN | DC renamed, registros viejos | Force re-register `ipconfig /registerdns`. |
| Site records missing | Site nuevo sin DCs registrados | Repl + DDNS desde DC del site. |
| External DNS expone internal | Hybrid cloud + on-prem leak | Crítico. Split-horizon DNS. |
| Cross-zone leak en forest trust | DNS replication misconfig | Audit zone scope. |
^ad-srv-errors

```bash
# Audit DC reachability — detectar SRV stale
DOM="corp.local"
DCS=$(dig +short SRV "_ldap._tcp.dc._msdcs.$DOM" | awk '{print $4}' | sed 's/\.$//')

for dc in $DCS; do
  IP=$(dig +short A "$dc")
  REACH=$(timeout 3 bash -c "echo > /dev/tcp/$dc/389" 2>&1 && echo "OK" || echo "DEAD")
  echo "$dc → $IP ($REACH)"
done
```

---
