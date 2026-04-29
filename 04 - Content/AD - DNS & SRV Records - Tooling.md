---
aliases:
  - DNS Tooling AD
  - dig
  - dnsrecon
  - adidnsdump
  - krbrelayx dnstool
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
# AD - DNS & SRV Records - Tooling

***

## dig (BIND DNS Lookup)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| A record | `dig +short A host.dom.local` | Standard. |
| AAAA record | `dig +short AAAA host.dom.local` | IPv6. |
| MX record | `dig +short MX dom.local` | Email. |
| NS record | `dig +short NS dom.local` | Authoritative. |
| SOA record | `dig +short SOA dom.local` | Zone metadata. |
| SRV record | `dig +short SRV _ldap._tcp.dom.local` | AD core. |
| TXT record | `dig +short TXT dom.local` | SPF/DKIM. |
| PTR (reverse) | `dig +short -x 10.0.0.10` | Reverse DNS. |
| ANY records | `dig ANY dom.local` | All types (sometimes hidden). |
| AXFR | `dig AXFR dom.local @DC` | Zone transfer. |
| Specific server | `dig @DC dom.local` | Direct query. |
| Trace path | `dig +trace dom.local` | Full delegation. |
| No recursion | `dig +norec dom.local` | Authoritative-only. |
| Short output | `dig +short ...` | Concise. |
| Full output | `dig +noall +answer ...` | Custom format. |
| Timeout | `dig +time=5 ...` | Pacing. |
^ad-tool-dig

### dig recipes

```bash
# Get all DCs
dig +short SRV _ldap._tcp.dc._msdcs.dom.local

# Get DC IPs from SRV chain
dig +short SRV _ldap._tcp.dc._msdcs.dom.local | \
  awk '{print $4}' | sed 's/\.$//' | \
  while read fqdn; do
    echo "$fqdn -> $(dig +short A $fqdn)"
  done

# Direct query against specific DC
DC="dc01.dom.local"
dig @$DC dom.local

# Trace full resolution path
dig +trace dom.local

# AXFR test
dig AXFR dom.local @$DC

# Full SOA with all metadata
dig +noall +answer +authority +additional SOA dom.local @$DC
```

___

## dnsrecon / dnsenum / fierce

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| dnsrecon standard | `dnsrecon -d dom.local` | Multi-mode. |
| dnsrecon AXFR-only | `dnsrecon -d dom.local -t axfr` | Targeted. |
| dnsrecon SRV enum | `dnsrecon -d dom.local -t srv` | AD records. |
| dnsrecon brute force | `dnsrecon -d dom.local -t brt -D wordlist.txt` | Subdomain. |
| dnsrecon reverse | `dnsrecon -r 10.0.0.0/24` | PTR sweep. |
| dnsrecon JSON | `-j out.json` | Parseable. |
| dnsrecon CSV | `-c out.csv` | Excel-friendly. |
| dnsrecon Google dorks | `-t goo` | OSINT. |
| dnsrecon zone walking | `-t zonewalk` (DNSSEC) | Edge. |
| dnsenum default | `dnsenum dom.local` | Multi-mode similar. |
| dnsenum threads | `dnsenum --threads 20 dom.local` | Performance. |
| dnsenum brute | `dnsenum -f wordlist.txt dom.local` | Subdomain. |
| dnsenum whois | `dnsenum -w dom.local` | OSINT. |
| fierce default | `fierce -dns dom.local` | Brute + zone walk. |
| fierce wordlist | `fierce --domain dom.local --subdomain-file list.txt` | Custom. |
| fierce range scan | `fierce --range 10.0.0.0/24` | Reverse. |
^ad-tool-dnsrecon

### dnsrecon comprehensive

```bash
# Comprehensive recon
dnsrecon -d dom.local -t std,axfr,srv,brt \
  -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -j dom_dns.json

# Parse JSON output
cat dom_dns.json | jq '.[] | select(.type=="A")'
```

___

## adidnsdump (LDAP-based DNS Enum)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Install | `pip install git+https://github.com/dirkjanm/adidnsdump` | Source. |
| Default enum | `adidnsdump -u 'dom\user' --password 'pass' DC` | All zones. |
| Specific zone | `adidnsdump -u u -p p DC --zone dom.local` | Targeted. |
| Resolve via DNS | `adidnsdump -u u -p p DC -r` | Validate records. |
| Print zones only | `adidnsdump -u u -p p DC --print-zones` | Discovery. |
| Include hidden ANY | `--include-hidden` | Show all. |
| Verbose | `-v` | Debug. |
| Output CSV | `records.csv` (default) | Standard. |
| Forest zones | `--forest` flag (newer versions) | Forest scope. |
| Kerberos auth | `-k` (requires KRB5CCNAME env) | Modern. |
| LDAPS auto | Auto-detected | Encrypted. |
| Anonymous attempt | `-u '' -p ''` | Edge. |
| Filter records | Combine with `grep`/`jq` | Post-process. |
| Compare with DNS view | Diff = ANY records | Recon. |
| Per-zone DACL | Adjacent — bloodyAD | Adjacent. |
| Decode binary blob | Built-in parser | Standard. |
^ad-tool-adidns

### adidnsdump usage

```bash
# Basic enum
adidnsdump -u 'dom\user' --password 'pass' DC

# Specific zone with DNS verify
adidnsdump -u 'dom\user' --password 'pass' DC -r --zone dom.local

# Show hidden records (ANY)
adidnsdump -u 'dom\user' --password 'pass' DC --include-hidden

# Output: records.csv
# name,type,address,...
```

___

## dnstool.py (krbrelayx — Manipulation)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Install | `git clone github.com/dirkjanm/krbrelayx` | Source. |
| Add A record | `dnstool.py -u 'dom\user' -p pass -a add -r host -d 1.2.3.4 DC` | Standard. |
| Add CNAME | `dnstool.py ... -a add -r alias -d target -t CNAME DC` | Edge. |
| Add SRV | `dnstool.py ... -a add -r _service._tcp -d "0 0 port target" -t SRV DC` | Edge. |
| Modify record | `dnstool.py ... -a modify ...` | Same syntax. |
| Remove record | `dnstool.py ... -a remove -r host DC` | Cleanup. |
| Remove tombstone | `--remove-tombstone` | Purge. |
| Query record | `dnstool.py ... -a query -r host DC` | Read. |
| Specific zone | `--zone dom.local` | Targeted. |
| Forest zone | `--forest` | Edge. |
| Auth via Kerberos | `-k -c "ccache.txt"` | Modern. |
| TGT-based auth | KRB5CCNAME + `-k` | Modern. |
| LDAPS auto | Auto | Encrypted. |
| Required permission | `CreateChild` on zone | Default Auth Users. |
| Common abuse: WPAD record | Combo with Responder | Standard. |
| Cleanup: always remove | OPSEC | Hygiene. |
^ad-tool-dnstool

### dnstool.py recipes

```bash
# Add WPAD record (DNS spoof attack base)
python3 dnstool.py -u 'dom\user' -p pass -a add -r wpad -d ATTACKER_IP DC

# Verify
dig +short A wpad.dom.local

# Remove (cleanup)
python3 dnstool.py -u 'dom\user' -p pass -a remove -r wpad DC

# Add per-host A record (smaller blast radius)
python3 dnstool.py -u 'dom\user' -p pass -a add -r myhost -d 1.2.3.4 DC

# Query existing record
python3 dnstool.py -u 'dom\user' -p pass -a query -r dc01 DC
```

___

## Cloud / Modern DNS Tools

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `subfinder` | Multi-source subdomain enum | OSINT-heavy. |
| `amass enum -d <dom>` | Comprehensive | OSINT + active. |
| `amass intel -d <dom>` | Intel gathering | OSINT. |
| `amass enum -passive -d <dom>` | Passive only | Stealth. |
| `findomain` | Fast Rust subdomain | Modern. |
| `assetfinder` | Tomnomnom | Quick. |
| `chaos-client` | ProjectDiscovery API | API-based. |
| `crt.sh` cert transparency | Public DNS leak | OSINT. |
| `securitytrails.com` | Historical DNS | OSINT. |
| `dnsdumpster.com` | Visual recon | OSINT. |
| `gobuster dns` | DNS subdomain brute | Active. |
| `puredns` (massdns wrapper) | Massive subdomain | Performance. |
| `massdns` | Bulk resolver | Performance. |
| `dnsx` ProjectDiscovery | Fast resolver toolkit | Modern. |
| `httpx` after subdomain enum | Live host check | Adjacent. |
| `katana` JS crawl | Endpoint extract from JS | Adjacent. |
^ad-tool-cloud

### Modern subdomain pipeline

```bash
DOM="dom.local"

# Aggregate from multiple sources
subfinder -d "$DOM" -all -silent | tee subdomains.txt
amass enum -passive -d "$DOM" >> subdomains.txt
sort -u subdomains.txt > unique_subs.txt

# Resolve and filter live
cat unique_subs.txt | dnsx -resp-only -silent > live_dns.txt

# HTTP probing
cat unique_subs.txt | httpx -title -web-server -tech-detect -silent
```

___

## Wordlists & Recursos DNS

| **Recurso** | **Path / URL** | **Notas** |
|:---:|:---:|:---:|
| SecLists Discovery DNS | `Discovery/DNS/` | Subdomain wordlists. |
| `subdomains-top1million-5000.txt` | SecLists | Quick. |
| `subdomains-top1million-110000.txt` | SecLists | Deep. |
| `bitquark-subdomains-top100000.txt` | SecLists | Alt. |
| AD-specific subdomains | `dc dc01 dc02 dns mail web app api dev test` | Custom. |
| AssetNote wordlists | `assetnote.io/resources` | Curated commercial. |
| `commonspeak2` wordlists | GitHub | Modern bug bounty. |
| `seclists-curated` | Targeted lists | Edge. |
| OWASP DNS recon guide | `owasp.org` | Reference. |
| HackTricks DNS | `book.hacktricks.xyz/network-services-pentesting/pentesting-dns` | Pentest. |
| MITRE ATT&CK DNS | T1590.002, T1583.002 | Framework. |
| RFC 1035 (DNS basics) | IETF spec | Foundation. |
| RFC 2782 (SRV records) | IETF spec | Authoritative. |
| RFC 5936 (DNS zone transfer) | IETF spec | AXFR detail. |
| Microsoft DNS architecture docs | learn.microsoft.com | Vendor. |
| BloodHound DNS analysis (custom) | Custom Cypher | Adjacent. |
^ad-tool-wordlists

***
