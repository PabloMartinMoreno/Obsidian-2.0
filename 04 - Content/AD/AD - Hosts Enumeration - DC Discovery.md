---
aliases:
  - DC Discovery
  - Domain Controller Location
  - DNS SRV Records AD
  - LDAP namingContexts
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Hosts Enumeration]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AD - Hosts Enumeration - DC Discovery

***

## DNS SRV Records

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short SRV _ldap._tcp.dc._msdcs.<dom>` | DC FQDNs + IP + port | Discovery inicial sin auth. |
| `dig +short SRV _kerberos._tcp.dc._msdcs.<dom>` | KDCs (mismos DCs) | Confirmar Kerberos. |
| `dig +short SRV _gc._tcp.<dom>` | Global Catalogs | Forest queries cross-domain. |
| `dig +short SRV _ldap._tcp.pdc._msdcs.<dom>` | PDC emulator | FSMO target. |
| `dig +short SRV _ldap._tcp.<site>._sites.dc._msdcs.<dom>` | DCs por site | Lateral por site. |
| `dig +short -t SRV _ldap._tcp.gc._msdcs.<forest>` | Forest GCs | Cross-forest. |
| `dig AXFR <dom> @<DC>` | Zone transfer (si misconfig) | Pre-2003 DCs / misconfig. |
| `dnsrecon -d <dom> -t std` | Bulk records (A/MX/SRV/NS) | Recon completo. |
| `Resolve-DnsName -Type SRV _ldap._tcp.<dom>` | SRV desde Windows | Sin RSAT. |
^ad-dc-srv

```bash
DOM="corp.local"

# Bulk SRV — DCs + KDCs + GCs + PDC
for r in "_ldap._tcp.dc._msdcs.$DOM" "_kerberos._tcp.dc._msdcs.$DOM" "_gc._tcp.$DOM" "_ldap._tcp.pdc._msdcs.$DOM"; do
  echo "=== $r ==="
  dig +short SRV "$r"
done

# AXFR (raro, pero gratis)
dig AXFR "$DOM" @<DC-IP>
```

___

## NetBIOS / nbtscan / Broadcast

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nbtscan -v 10.0.0.0/24` | NetBIOS hostname + role bytes | Subnet sweep L2. |
| `nbtscan -r 10.0.0.0/24` | Source port 137 (bypass FW) | FW filtra src ephemeral. |
| `nmblookup -A <ip>` | NetBIOS reverse per-host | Targeted check. |
| `nmblookup '*'` | Broadcast NBNS | Solo segmento local. |
| `nbtstat -A <ip>` | NetBIOS table desde Windows | Sin tools Linux. |
| `nmap -sU -p137 --script nbstat 10.0.0.0/24` | NBNS + script parseado | Comprehensive. |
| `responder -A -I eth0` | Listener pasivo NBNS/LLMNR/MDNS | OPSEC stealth. |
| `arp-scan -l` | Hosts vivos L2 | Pre-NetBIOS sweep. |
^ad-dc-netbios

**Role bytes (suffix decode):**
- `<00>` UNIQUE = workstation/server
- `<1B>` UNIQUE = PDC emulator
- `<1C>` GROUP = Domain Controllers
- `<1D>` UNIQUE = Master Browser
- `<20>` UNIQUE = File Server service

```bash
# Sweep + parse para DCs
nbtscan -v 10.0.0.0/24 | grep -E '<1C>|<1B>'
```

___

## LDAP namingContexts (Anonymous)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -s base -b "" "(objectClass=*)"` | RootDSE completo | Anonymous bind permitido. |
| `ldapsearch -x -h <DC> -s base namingContexts` | NCs (domain/config/schema DNs) | Bootstrap DN para queries. |
| `ldapsearch -x -h <DC> -s base defaultNamingContext` | Domain DN | Para LDAP filter base. |
| `ldapsearch -x -h <DC> -s base configurationNamingContext` | Config NC | Forest-wide queries. |
| `ldapsearch -x -h <DC> -s base schemaNamingContext` | Schema NC | Schema queries. |
| `ldapsearch -x -h <DC> -s base domainFunctionality` | DFL (0-7) | Capability matrix. |
| `ldapsearch -x -h <DC> -s base forestFunctionality` | FFL | Forest features. |
| `ldapsearch -x -h <DC> -s base supportedSASLMechanisms` | SASL methods | Auth options (GSSAPI, etc). |
| `nxc ldap <DC> -u '' -p '' --get-domain-info` | RootDSE compact | Sin parseo manual. |
| `nmap --script ldap-rootdse -p389 <DC>` | RootDSE via nmap | Sin tools LDAP. |
^ad-dc-ldap

**Anonymous bind disabled** = empty result o `LDAP_OPERATIONS_ERROR`. Default Win2019+. Workaround: usar credenciales válidas (`-D 'CN=user,...' -w pass` o `-Y GSSAPI`).

```bash
# RootDSE bootstrap completo
ldapsearch -x -h <DC> -s base -b "" \
  namingContexts defaultNamingContext configurationNamingContext \
  schemaNamingContext rootDomainNamingContext \
  domainFunctionality forestFunctionality \
  dnsHostName serverName supportedSASLMechanisms

# netexec one-shot
nxc ldap <DC> -u '' -p '' --get-domain-info
```

___

## SMB Banner / Signing Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb 10.0.0.0/24` | Hostname + OS + signing + domain | Sweep estándar. |
| `nxc smb 10.0.0.0/24 --gen-relay-list relay.txt` | Lista hosts sin signing | NTLM Relay prep. |
| `nxc smb <DC> --signing` | Solo signing flag | Targeted check. |
| `nmap -p445 --script smb-os-discovery <range>` | OS + domain via nmap | Sin nxc disponible. |
| `nmap -p445 --script smb2-security-mode <range>` | Signing required vs enabled | Specific. |
| `nmap -p445 --script smb-protocols <range>` | SMB versions habilitadas | Detect SMBv1 legacy. |
| `smbclient -L //<DC> -N` | Anonymous share enum | Recon initial. |
| `nxc smb <DC> -u '' -p '' --shares` | Anonymous shares + perms | Misconfig hunt. |
| `rpcclient -U "" <DC> -N -c 'srvinfo;getdompwinfo'` | Server info + password policy | Anonymous RPC. |
^ad-dc-smb

**Signal crítico:** `Signing: False` o `Signing: Enabled` (no Required) = candidato NTLM Relay. `Signing: Required` (default DCs Win2019+) = blocked.

```bash
# DC fingerprint completo en 1 comando
nxc smb <DC>

# Anonymous deep dive
smbclient -L //<DC> -N
nxc smb <DC> -u '' -p '' --shares
rpcclient -U "" <DC> -N -c 'srvinfo;getdompwinfo;enumdomains;lsaquery'
```

___

## DC Locator Service / nltest

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nltest /dclist:<dom>` | Todos los DCs | Inventory rápido desde Windows. |
| `nltest /dsgetdc:<dom>` | DC más cercano (site-aware) | Pinning DC para queries. |
| `nltest /dsgetdc:<dom> /pdc` | PDC emulator | FSMO target. |
| `nltest /dsgetdc:<dom> /gc` | GC más cercano | Forest queries. |
| `nltest /trusted_domains` | Trusts directos | Quick trust check. |
| `nltest /domain_trusts /all_trusts /v` | Trusts detallados (forest-wide) | Cross-trust mapping. |
| `nltest /sc_query:<dom>` | Secure channel status | Trust health. |
| `Get-ADDomainController -Discover` | Site-aware DC desde RSAT | PowerShell. |
| `Get-ADDomainController -Filter *` | Todos los DCs con detalle | Inventory. |
| `Get-ADDomainController -Service "PrimaryDC"` | PDC emulator | FSMO. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()` | .NET forest object | Sin RSAT. |
| `[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()` | .NET domain object | Sin RSAT. |
^ad-dc-locator

```cmd
:: Inventory completo
nltest /dclist:corp.local
nltest /domain_trusts /all_trusts /v
```

```powershell
# RSAT — DCs con detalle útil
Get-ADDomainController -Filter * |
    Select Name,IPv4Address,Site,IsGlobalCatalog,IsReadOnly,OperatingSystem,OperationMasterRoles
```

***
