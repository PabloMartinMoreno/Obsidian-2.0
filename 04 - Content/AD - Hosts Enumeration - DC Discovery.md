---
aliases:
  - DC Discovery
  - Domain Controller Location
  - DNS SRV Records AD
  - LDAP namingContexts
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
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AD - Hosts Enumeration - DC Discovery

***

## DNS SRV Records

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nslookup -type=SRV _ldap._tcp.dc._msdcs.<dom>` | DC FQDN + IP + port | Standard SRV. |
| `dig +short SRV _ldap._tcp.dc._msdcs.<dom>` | Same | Linux-friendly. |
| `dig +short SRV _kerberos._tcp.dc._msdcs.<dom>` | KDC location | Adjacent. |
| `dig +short SRV _gc._tcp.<dom>` | Global Catalog | Forest queries. |
| `dig +short SRV _ldap._tcp.pdc._msdcs.<dom>` | PDC emulator FQDN | FSMO discovery. |
| `dig +short SRV _kpasswd._tcp.<dom>` | Kerberos password change | Edge. |
| `dig +short SRV _ldap._tcp.<site>._sites.dc._msdcs.<dom>` | Site-specific DCs | Site recon. |
| `dig +short -t SRV _ldap._tcp.gc._msdcs.<forest>` | Forest GCs | Cross-domain. |
| `Resolve-DnsName -Type SRV _ldap._tcp.<dom>` | PowerShell native | Windows. |
| `Resolve-DnsName -Type SRV _kerberos._tcp.<dom>` | KDC PS | Windows. |
| AXFR transfer attempt | `dig AXFR <dom> @DC` | Common misconfig. |
| Reverse DNS sweep | `for ip in {1..254}; do dig +short -x 10.0.0.$ip; done` | Hostname enum. |
| `dnsrecon -d <dom>` | Bulk DNS recon | Multi-record. |
| `dnsenum <dom>` | Same | Alt tool. |
| `host -t SRV _ldap._tcp.<dom>` | host(1) | BIND tools. |
| `fierce -dns <dom>` | Subdomain brute + zone walk | Adjacent. |
^ad-dc-srv

### Bulk SRV discovery

```bash
DOM="dom.local"

for record in \
  "_ldap._tcp.dc._msdcs.$DOM" \
  "_kerberos._tcp.dc._msdcs.$DOM" \
  "_gc._tcp.$DOM" \
  "_ldap._tcp.pdc._msdcs.$DOM" \
  "_kpasswd._tcp.$DOM" \
  "_kerberos._udp.$DOM"; do
  echo "=== $record ==="
  dig +short SRV "$record"
done

# Try AXFR
dig AXFR "$DOM" @DC-IP
```

___

## NetBIOS / nbtscan / Broadcast

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nbtscan 10.0.0.0/24` | NetBIOS hostname + role | Quick subnet sweep. |
| `nbtscan -r 10.0.0.0/24` | Use src port 137 | Bypass some FW. |
| `nbtscan -v 10.0.0.0/24` | Verbose role identification | More detail. |
| `nmblookup -A <ip>` | NetBIOS reverse | Per-host. |
| `nmblookup '*'` | Broadcast NetBIOS sweep | Local segment only. |
| `nbtstat -a <ip>` | Windows native | Per-host. |
| `nbtstat -A <ip>` | Same with IP | Variant. |
| `responder -A -I eth0` | Passive NBNS/LLMNR listener | Non-intrusive recon. |
| `arp-scan -l` | Local ARP sweep | L2 broadcast. |
| `nmap -sU -p137 --script nbstat 10.0.0.0/24` | NBNS scan + script | Comprehensive. |
| `enum4linux-ng -A <ip>` | NetBIOS + RPC | Multi-protocol. |
| Role bytes 0x1c | Domain Master Browser | DC indicator. |
| Role bytes 0x1b | Domain Master | PDC. |
| Role bytes 0x00 | Workstation | Standard host. |
| Role bytes 0x20 | Server service | File/print. |
| Suffix `<00>` UNIQUE | Hostname | Standard. |
^ad-dc-netbios

### NetBIOS sweep

```bash
# Subnet sweep
nbtscan -v 10.0.0.0/24

# Per-host detail
nbtstat -A 10.0.0.10

# Look for:
# <00> UNIQUE     Workstation Service
# <20> UNIQUE     File Server Service
# <1B> UNIQUE     Domain Master Browser  ← PDC indicator
# <1C> GROUP      Domain Controllers     ← DC indicator
# <1D> UNIQUE     Master Browser
```

___

## LDAP namingContexts (Anonymous)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch -x -h DC -s base namingcontexts` | Naming contexts list | Anonymous bind. |
| `ldapsearch -x -h DC -s base "(objectClass=*)"` | RootDSE — domain info | Anonymous. |
| `ldapsearch -x -h DC -s base defaultNamingContext` | Default NC (domain DN) | Direct. |
| `ldapsearch -x -h DC -s base configurationNamingContext` | Config NC | Forest config. |
| `ldapsearch -x -h DC -s base schemaNamingContext` | Schema NC | Schema location. |
| `ldapsearch -x -h DC -s base rootDomainNamingContext` | Forest root | Forest mapping. |
| `ldapsearch -x -h DC -s base domainFunctionality` | Domain functional level | Capability. |
| `ldapsearch -x -h DC -s base forestFunctionality` | Forest functional level | Adjacent. |
| `ldapsearch -x -h DC -s base supportedSASLMechanisms` | SASL methods | Auth options. |
| `ldapsearch -x -h DC -s base supportedLDAPVersion` | LDAP version | Compatibility. |
| `ldapsearch -x -h DC -s base supportedControl` | LDAP controls | Capability. |
| `nxc ldap DC -u '' -p '' --get-domain-info` | Compact RootDSE | netexec. |
| `windapsearch -d <dom> --dc-ip DC -m discover` | RootDSE wrapper | Helper. |
| `nmap --script ldap-rootdse -p389 DC` | nmap script | Passive. |
| `nmap --script ldap-search -p389 DC` | LDAP search w/o creds | Limited. |
| Anonymous bind disabled? | Empty error | Modern Server 2019+. |
^ad-dc-ldap

### RootDSE quick dump

```bash
# Anonymous bind — RootDSE
ldapsearch -x -h DC -s base -b "" \
  namingContexts \
  defaultNamingContext \
  configurationNamingContext \
  schemaNamingContext \
  rootDomainNamingContext \
  domainFunctionality \
  forestFunctionality \
  dnsHostName \
  serverName

# netexec equivalent
nxc ldap DC -u '' -p '' --get-domain-info
```

___

## SMB Banner / Signing Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb 10.0.0.0/24` | Hostname + OS + signing + domain | netexec quick. |
| `nxc smb 10.0.0.0/24 --gen-relay-list relay.txt` | NTLM Relay candidates | Relay prep. |
| `nxc smb DC --signing` | Signing required vs not | Direct check. |
| `crackmapexec smb 10.0.0.0/24` | Same data | Older name. |
| `nmap -p445 --script smb-os-discovery 10.0.0.0/24` | OS + domain | nmap script. |
| `nmap -p445 --script smb2-security-mode 10.0.0.0/24` | Signing status | Specific. |
| `nmap -p445 --script smb-protocols 10.0.0.0/24` | SMB versions | Protocol enum. |
| `smbclient -L //DC -N` | Anonymous share enum | Quick. |
| `enum4linux-ng -A DC` | Comprehensive | Legacy + RPC. |
| `rpcclient -U "" DC -N` → `srvinfo` | Server info | Anonymous if allowed. |
| `nxc smb DC -u '' -p '' --shares` | Anonymous share list | Misconfig check. |
| `responder -I eth0 -A` | Listen for SMB auth attempts | Passive. |
| Signing required `True` | Modern hardening | Relay blocked. |
| Signing not required | Relay candidate | Critical signal. |
| OS banner reveals SP/build | Plan exploits per version | Capability. |
| `Domain` field reveals domain name | Bootstrap LDAP queries | Discovery chain. |
^ad-dc-smb

### Comprehensive DC fingerprint

```bash
# Single command — netexec gives most info
nxc smb DC

# Output:
# SMB         10.0.0.10  445  DC01    [*] Windows Server 2022 Build 20348 ...
# SMB         10.0.0.10  445  DC01    [+] dom.local\
# Signing: True  SMBv1: False

# Anonymous share enum
smbclient -L //DC -N
nxc smb DC -u '' -p '' --shares

# RPC anonymous
rpcclient -U "" DC -N -c 'srvinfo;getdompwinfo;enumdomains;lsaquery'
```

___

## DC Locator Service / nltest

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nltest /dclist:<dom>` | DC list | Native Windows. |
| `nltest /dsgetdc:<dom>` | Site-aware closest DC | Standard. |
| `nltest /dsgetdc:<dom> /pdc` | PDC explicit | FSMO. |
| `nltest /dsgetdc:<dom> /gc` | GC closest | Forest. |
| `nltest /trusted_domains` | Trust list | Quick. |
| `nltest /domain_trusts /all_trusts` | All trusts detail | Comprehensive. |
| `nltest /server:DC /trusted_domains` | Per-server | Cross-target. |
| `nltest /sc_query:<dom>` | Secure channel status | Trust health. |
| `nltest /sc_verify:<dom>` | Trust verify | Adjacent. |
| `nltest /transitive_server:DC` | Transitive trust info | Edge. |
| `Get-ADDomainController -Discover` | RSAT site-aware | PowerShell. |
| `Get-ADDomainController -Filter *` | All DCs | Comprehensive. |
| `Get-ADDomainController -Service "PrimaryDC"` | PDC | Specific. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()` | .NET forest info | DotNet. |
| `[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()` | .NET domain | DotNet. |
| `klist tickets` (after net use) | Cached Kerberos | Activity check. |
^ad-dc-locator

### nltest comprehensive

```cmd
:: Enumerate all DCs
nltest /dclist:dom.local

:: Closest DC for current site
nltest /dsgetdc:dom.local

:: PDC emulator
nltest /dsgetdc:dom.local /pdc

:: All trusts
nltest /domain_trusts /all_trusts /v

:: Output flags decoded:
:: PRIMARY     Trust originates here
:: NATIVE      Native mode trust
:: TREE_ROOT   Forest tree root
:: WITHIN_FOREST Inter-forest? No
:: DIRECT_OUTBOUND  Outbound trust
:: DIRECT_INBOUND   Inbound trust
```

```powershell
# RSAT
Get-ADDomainController -Filter * | Select Name,IPv4Address,Site,IsGlobalCatalog,IsReadOnly,OperatingSystem
```

***
