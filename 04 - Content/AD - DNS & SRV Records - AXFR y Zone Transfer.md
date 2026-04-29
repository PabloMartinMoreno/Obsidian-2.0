---
aliases:
  - DNS Zone Transfer
  - AXFR Attack
  - dig AXFR
  - dnsrecon zone
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
# AD - DNS & SRV Records - AXFR / Zone Transfer

***

## AXFR Basics

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| AXFR = Full Zone Transfer | RFC 5936 | Standard DNS. |
| IXFR = Incremental Transfer | Differential | Adjacent. |
| Designed for secondary servers | Master → slave sync | Original purpose. |
| Atacante abuse → enum zone | Misconfig allows unauth | Critical leak. |
| TCP port 53 (zone transfers) | UDP doesn't support AXFR | TCP-only. |
| Response = entire zone | All records returned | Full dump. |
| Default Microsoft DNS | Allow only configured masters | Secure default. |
| BIND default | Allow only configured slaves | Secure default. |
| Misconfig: `allow-transfer { any; }` | Common BIND mistake | Critical. |
| Microsoft: "Allow zone transfers to any server" | GUI misconfig option | Common. |
| TSIG-secured AXFR | Authenticated transfer | Modern best practice. |
| Tested via `dig AXFR <zone> @<server>` | Direct | Standard. |
| Per-zone allowed | Different policies per zone | Granular. |
| Reverse zones often forgotten | Often allow AXFR | Common oversight. |
| Cloud DNS (Route53) | Different model | No AXFR per-se. |
| DNS-over-HTTPS doesn't support | DoH/DoT scope | Edge. |
^ad-axfr-basics

### Quick AXFR test

```bash
DOM="dom.local"
DC="dc01.dom.local"

# Test AXFR
dig AXFR "$DOM" "@$DC"

# Common results:
# Refused: AXFR not allowed (good defense)
# Failure: connection issues
# Full output: VULNERABLE — all records dumped
```

___

## AXFR Attack Targets

| **Target Zone** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Forward primary zone | `dig AXFR dom.local @DC` | Most data. |
| `_msdcs` subdomain | `dig AXFR _msdcs.dom.local @DC` | All DC GUIDs. |
| Reverse lookup zones | `dig AXFR 0.10.in-addr.arpa @DC` | PTR records. |
| Cross-zone | Try every discoverable zone | Bulk enum. |
| Public-facing internal zones | If internal DNS public | Critical exposure. |
| Conditional forwarders | Identify cross-zone references | Adjacent. |
| Stub zones | Limited records | Adjacent. |
| Trust zones | Inter-forest DNS visibility | Edge. |
| Subdomain zones | `app.dom.local` separately | If delegated. |
| Reverse IPv6 zones | `0.0...ip6.arpa` | Often forgotten. |
| Internal email zones | If MX records hosted | Adjacent. |
| Active Directory partition zones | `DomainDnsZones.<dom>` | Edge. |
| `ForestDnsZones.<forest>` | Forest-wide records | Edge. |
| Backup DNS servers | Sometimes more permissive | Try all. |
| Slave DNS servers | Often inherit perms | Try too. |
| Hidden master DNS | Edge enterprise | Try. |
^ad-axfr-targets

### Bulk AXFR test

```bash
DOM="dom.local"

# Get all DCs
DCS=$(dig +short SRV "_ldap._tcp.dc._msdcs.$DOM" | awk '{print $4}' | sed 's/\.$//')

# Try AXFR on each DC + each known zone
for dc in $DCS; do
  for zone in "$DOM" "_msdcs.$DOM" "DomainDnsZones.$DOM" "ForestDnsZones.$DOM"; do
    RESULT=$(timeout 5 dig AXFR "$zone" "@$dc" +short 2>&1)
    if [ -n "$RESULT" ] && ! echo "$RESULT" | grep -q "Transfer failed\|REFUSED"; then
      echo "[+] AXFR SUCCESS: $zone @ $dc"
      echo "$RESULT" | head -5
    fi
  done
done
```

___

## dnsrecon / dnsenum / fierce

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| dnsrecon AXFR | `dnsrecon -d dom.local -t axfr` | Targeted. |
| dnsrecon standard | `dnsrecon -d dom.local` | Multi-mode. |
| dnsrecon brute | `dnsrecon -d dom.local -t brt -D wordlist.txt` | Subdomain brute. |
| dnsrecon SRV | `dnsrecon -d dom.local -t srv` | SRV-only. |
| dnsrecon reverse | `dnsrecon -r 10.0.0.0/24` | PTR sweep. |
| dnsrecon JSON output | `-j out.json` | Parseable. |
| dnsenum standard | `dnsenum dom.local` | Multi-mode similar. |
| dnsenum threads | `dnsenum --threads 10 dom.local` | Performance. |
| dnsenum brute | `dnsenum -f wordlist.txt dom.local` | Subdomain. |
| fierce default | `fierce -dns dom.local` | Brute + zone walk. |
| fierce wordlist | `fierce -dns dom.local -wordlist hosts.txt` | Custom. |
| fierce range | `fierce -dns dom.local -range 10.0.0.0/24` | Reverse. |
| `host -l <zone> <server>` | Quick AXFR | BIND tools. |
| `nslookup` interactive AXFR | `ls dom.local` | Legacy. |
| `gobuster dns` | DNS subdomain brute | Modern. |
| Massdns + wordlists | Bulk brute | Performance. |
^ad-axfr-tools

### dnsrecon comprehensive

```bash
# Comprehensive recon
dnsrecon -d dom.local -t std,axfr,srv,brt -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -j dns.json

# Output sections:
# - Standard records (SOA, NS, MX, A)
# - SRV records (LDAP, Kerberos, GC)
# - Subdomain brute results
# - AXFR if successful
```

```bash
# fierce
fierce --domain dom.local --subdomain-file /usr/share/wordlists/dnsmap.txt
```

___

## Reverse Zone Enumeration (PTR Records)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `dig AXFR 0.10.in-addr.arpa @DC` | All PTRs in /16 | If allowed. |
| `dig +short -x 10.0.0.10` | Single PTR lookup | Standard. |
| Reverse range sweep | `for i in {1..254}; do dig +short -x 10.0.0.$i; done` | Bulk. |
| `dnsrecon -r 10.0.0.0/24` | Bulk reverse | Tool. |
| `nmap -sn 10.0.0.0/24` (with --resolve-all) | Adjacent | Network scan. |
| Reverse + forward correlation | Validate consistency | Audit. |
| Forgotten reverse zones | Often AXFR open | Common bug. |
| `0.in-addr.arpa` for /8 | Big network | Edge. |
| IPv6 reverse `0.0.0...ip6.arpa` | IPv6 specific | Modern. |
| Stale PTR records | Old hostnames | Recon clue. |
| Multiple PTRs same IP | Misconfig | Edge. |
| Reverse + classless | RFC 2317 delegation | Edge. |
| Subnet-specific zones | `64-95.0.10.in-addr.arpa` | Edge. |
| Decentralized DNS reverse | Per-subnet servers | Edge. |
| AD-integrated reverse | Often centrally stored | Standard. |
| Hostnames reveal function | "DC01", "WEBSRV01" | Recon clue. |
^ad-axfr-reverse

### Reverse zone bulk

```bash
# AXFR reverse
dig AXFR 0.10.in-addr.arpa @DC
dig AXFR 168.192.in-addr.arpa @DC

# Reverse sweep + AXFR fallback
DC="10.0.0.10"
for net in 0 1 2 3 4 5 10; do
  RESULT=$(dig AXFR "$net.10.in-addr.arpa" "@$DC" +short 2>&1)
  [ -n "$RESULT" ] && [[ "$RESULT" != *"failed"* ]] && echo "[+] AXFR ok: $net.10.in-addr.arpa"
done
```

___

## Subdomain Brute Force (No AXFR fallback)

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| `gobuster dns` | `gobuster dns -d dom.local -w wordlist` | Fast. |
| `gobuster dns -t 50` | High threading | Performance. |
| `dnscan` | `dnscan -d dom.local -w wordlist.txt` | Adjacent. |
| `subbrute` | Targeted brute | Old but works. |
| `massdns` | `massdns -r resolvers.txt -t A subdomains.txt` | Massive. |
| `puredns` | wrapper around massdns | Modern. |
| `amass enum -d dom.local` | Multi-source enum | OSINT + brute. |
| `amass intel -d dom.local` | Recon intel | Adjacent. |
| `findomain` | Fast Rust subdomain | Modern. |
| `subfinder` | Multi-source | OSINT-heavy. |
| `chaos-client` | ProjectDiscovery | API-based. |
| `assetfinder` | Tomnomnom | Quick. |
| `crt.sh + parsing` | Cert transparency | Public DNS leak. |
| `securitytrails.com` | Historical DNS | OSINT. |
| `dnsdumpster.com` | Visual recon | OSINT. |
| Internal DNS = different from external | Internal-only zones | Recon scope. |
^ad-axfr-brute

### Subdomain brute strategy

```bash
DOM="dom.local"

# Internal DNS-aware brute (point at DC)
gobuster dns -d "$DOM" -r DC-IP \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
  -t 50 -o subdomains.txt

# Common AD-specific subdomains
WORDLIST="dc dc01 dc02 dns mail exchange smtp pop imap mx www intranet portal vpn rdp \
ts citrix sql sqlsrv mssql mysql postgres web app api dev test staging prod \
files share fileserver print printer domain forest shadow backup"

for sub in $WORDLIST; do
  IP=$(dig +short A "$sub.$DOM" @DC-IP)
  [ -n "$IP" ] && echo "$sub.$DOM -> $IP"
done
```

___

## Public DNS Leak (External Recon)

| **Vector** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Public-facing AD DNS | Internal records via public resolvers | Critical exposure. |
| Cert transparency logs | crt.sh reveals subdomains | OSINT. |
| Wayback Machine | Historical subdomains | OSINT. |
| Google dorks | `site:dom.local` | OSINT. |
| GitHub leaked configs | DNS in code | OSINT. |
| Pastebin DNS dumps | Old AXFR results | OSINT. |
| Public BGP / WHOIS | IP ranges | OSINT. |
| Shodan / Censys | Hostname-IP correlation | OSINT. |
| DNS aggregators | dnsdumpster, securitytrails | OSINT. |
| Public NS records leak topology | NS hostnames internal | Indicator. |
| MX records leak email gateway | Adjacent recon | Standard. |
| TXT records SPF/DKIM | Email infrastructure | Adjacent. |
| Cloud metadata DNS | Cloud-hosted internal | Edge. |
| CDN bypass via DNS | Origin server discovery | OSINT. |
| Subdomain takeover candidates | Stale CNAMEs | Critical (Subdomain Takeover hub). |
| Internal-only resolvers blocked externally | Default modern | Defense. |
^ad-axfr-public

### Public DNS recon

```bash
DOM="dom.local"

# Cert transparency logs
curl -s "https://crt.sh/?q=%25.$DOM&output=json" | \
  jq -r '.[].name_value' | sort -u

# Subfinder (multi-source)
subfinder -d "$DOM" -all -silent

# Amass intel
amass intel -d "$DOM" -src
amass enum -passive -d "$DOM"

# Resolve discovered subdomains
subfinder -d "$DOM" -all -silent | \
  httpx -title -web-server -tech-detect
```

***
