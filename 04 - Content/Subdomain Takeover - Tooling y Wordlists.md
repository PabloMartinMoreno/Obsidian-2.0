---
aliases:
  - subjack
  - subzy
  - takeover
  - subfinder
  - amass
  - dnsx
tags:
  - type/cheatsheet
  - vuln/subdomain-takeover
  - technique/discovery
  - asset/dns
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Subdomain Takeover]]'
---
# Subdomain Takeover - Tooling y Wordlists

***

## subjack / subzy / takeover (Detection)

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| subjack (Go) | `subjack -w subs.txt -t 100 -timeout 30 -ssl -c fingerprints.json` | Standard tool. |
| subjack fingerprints | `fingerprints.json` con service signatures | Built-in patterns. |
| subzy (Go) | `subzy run --targets subs.txt --hide_fails --vuln` | Modern alt. |
| takeover (Python) | `takeover -d targets.txt` | Python alt. |
| nuclei templates | `nuclei -t takeovers/ -l subs.txt` | Bulk scan, regularly updated. |
| `can-i-take-over-xyz` | https://github.com/EdOverflow/can-i-take-over-xyz | Reference for fingerprints. |
| Burp Active Scan | Limited subdomain takeover detection | Manual. |
| ProjectDiscovery `dnsx` | `dnsx -l subs.txt -cname -resp` | DNS info, not takeover-specific. |
| `httpx` con custom headers | `httpx -l subs.txt -title -content-length` | Detect anomalies. |
| Custom one-liner | `for s in $(cat subs.txt); do curl -s "$s" | grep -i 'no such bucket\|no-such-app'; done` | Quick filter. |
| Domain monitoring tools | DnsTwist, MonitorMe | Continuous. |
| Combine con `gau` / `waybackurls` | Get historical URLs first | Recon source. |
^sdt-tool-detection

### subjack workflow estándar

```bash
# 1. Compile/install
go install github.com/haccer/subjack@latest

# 2. Run scan
subjack -w subs.txt \
  -t 100 \
  -timeout 30 \
  -ssl \
  -c $GOPATH/src/github.com/haccer/subjack/fingerprints.json \
  -v -o results.txt

# 3. Filter vulnerable
grep -i '\[' results.txt | grep -v 'Not Vulnerable'

# 4. Manual verify cada finding
for sub in $(grep VULNERABLE results.txt | awk '{print $2}'); do
  echo "=== $sub ==="
  CNAME=$(dig +short CNAME "$sub")
  curl -sI "$sub"
done
```

___

## Subdomain Enumeration Tools

| **Tool** | **Comando** | **Tipo** |
|:---:|:---:|:---:|
| subfinder (PD) | `subfinder -d target.com -all -recursive -silent` | Passive. |
| amass | `amass enum -active -d target.com -o subs.txt` | Active + passive. |
| amass intel | `amass intel -d target.com -whois` | OSINT. |
| assetfinder | `assetfinder --subs-only target.com` | Passive simple. |
| findomain | `findomain --target target.com` | Modern alt. |
| dnsrecon | `dnsrecon -d target.com -t std,brt` | Multi-mode. |
| sublist3r | `sublist3r -d target.com` | Older but still works. |
| github-subdomains | https://github.com/gwen001/github-subdomains | GitHub-specific recon. |
| crobat | `crobat -s target.com` | Project Discovery. |
| chaos | `chaos -d target.com -silent` | PD chaos DB. |
| crt.sh API | `curl -s "https://crt.sh/?q=%25.target.com&output=json" \| jq -r '.[].name_value'` | CT logs. |
| Censys API | `censys-cli search 'target.com'` | Active recon. |
| Shodan API | `shodan domain target.com` | Network-level. |
| Project Sonar | Rapid7 dataset | Bulk historical. |
| Common subdomains | `seclists/Discovery/DNS/subdomains-top1million-110000.txt` | Brute. |
| Resolved confirm | `dnsx -l subs.txt -resp -silent` | Filter live. |
^sdt-tool-enum

___

## DNS Probing y Resolution

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| dnsx | `dnsx -l subs.txt -resp -cname -silent` | PD modern. |
| massdns | `massdns -r resolvers.txt -t A -o S subs.txt` | Bulk fast. |
| puredns | `puredns bruteforce wordlist.txt target.com` | Modern brute. |
| dig (manual) | `dig +short CNAME sub.target.com` | Standard. |
| nslookup | Same | Legacy. |
| host | `host -t any sub.target.com` | Multi-record. |
| dnstracer | `dnstracer sub.target.com` | NS chain trace. |
| dnsenum | `dnsenum --noreverse target.com` | All-in-one. |
| dnsmap | `dnsmap target.com` | Brute force. |
| Public resolvers list | `https://github.com/janmasarik/resolvers` | Required for massdns. |
| PowerDNS | Self-hosted resolver | Speed. |
| Custom Python script | `dnspython` library | Programmable. |
^sdt-tool-dns

### DNS recon workflow

```bash
# 1. Enumerate
subfinder -d target.com -all -silent | tee subs_passive.txt
amass enum -active -d target.com -o subs_active.txt
cat subs_*.txt | sort -u > subs.txt

# 2. Resolve with dnsx
dnsx -l subs.txt -resp -silent > resolved.txt

# 3. Extract CNAMEs
dnsx -l subs.txt -cname -resp -silent > cnames.txt

# 4. Filter potential takeover candidates
grep -E 's3\.amazonaws\.com|herokuapp|github\.io|cloudfront|azurewebsites' cnames.txt > candidates.txt

# 5. Run takeover scanner
subjack -w candidates.txt -ssl -t 100 -timeout 30
```

___

## can-i-take-over-xyz (Reference)

| **Resource** | **URL** | **Uso** |
|:---:|:---:|:---:|
| Main repo | https://github.com/EdOverflow/can-i-take-over-xyz | Curated list of takeover services. |
| Per-service status | List of "vulnerable / not vulnerable / pending" services | Verification. |
| Service fingerprints | Body strings + DNS patterns | For tools / manual. |
| Mitigation steps | Per-service defense | Defenders use. |
| Bug bounty considerations | Notes on reportability | Reporting. |
| Updates | Community-maintained, current | Recent additions. |
| Fork: ProjectDiscovery nuclei templates | nuclei templates derived | Auto-scan. |
| Fork: gowitness / aquatone screenshots | Visual confirmation | Standard. |
| Combine con CVE database | Some takeovers have CVE | Documentation. |
| Bug Bounty platforms | HackerOne / Bugcrowd disclosed reports | Learn from real cases. |
^sdt-tool-canitakeover

___

## Manual Verification

| **Step** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| 1. DNS resolution | `dig +short CNAME sub.target.com` | Verify CNAME exists. |
| 2. CNAME target unresolved | `dig +short A <cname-target>` | NXDOMAIN/NOERROR + no records. |
| 3. HTTP response | `curl -sI https://sub.target.com` | Check status + headers. |
| 4. Body fingerprint | `curl -s https://sub.target.com | head -c 500` | Match service signature. |
| 5. Try claim service | Per-service: create account, configure custom domain | Reproducible. |
| 6. Verify control | Atacante content visible at sub | PoC complete. |
| 7. Write PoC | Document steps, screenshot, video | For bug bounty. |
| 8. Report responsibly | Don't deface | Ethics. |
| 9. Coordinate disclosure | Provide evidence to defender | Standard. |
| 10. Verify fix | After defender fixes, re-check | Closure. |
^sdt-tool-manual

___

## Wordlists Comprehensivas

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| SecLists DNS | `seclists/Discovery/DNS/subdomains-top1million-{20000,110000}.txt` | Standard brute. |
| Assetnote wordlists | https://wordlists.assetnote.io/ | Modern, curated. |
| commonspeak2 wordlists | Common subdomain patterns | Same. |
| `bo0om/fuzz.txt` | Comprehensive fuzz lists | General. |
| Custom company-specific | Hand-curated | Targeted. |
| Permutations (altdns) | `altdns -i subs.txt -o output.txt -w words.txt` | Mutations. |
| ripgen / dnsgen | Same family | Variations. |
| OWASP subdomain lists | OWASP-curated | Standard. |
| GitHub recon wordlists | github-subdomains-wordlists | OSINT-focused. |
| Cloud-specific | `seclists/Discovery/DNS/cloud-subdomains.txt` | Cloud focused. |
^sdt-tool-wordlists

***
