---
aliases:
  - subjack
  - subzy
  - takeover
  - subfinder
  - amass
  - dnsx
tags:
  - vuln/subdomain-takeover
  - technique/discovery
  - asset/dns
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Subdomain Takeover]]"
---
# Subdomain Takeover - Tooling y Wordlists

---

## subjack / subzy / takeover (Detection)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `go install github.com/haccer/subjack@latest` | Install subjack | Primera vez. |
| `subjack -w subs.txt -t 100 -timeout 30 -ssl -c $GOPATH/src/github.com/haccer/subjack/fingerprints.json -v` | Bulk takeover scan con fingerprints | Standard tool. |
| `subjack -w subs.txt -ssl -o results.txt && grep -i 'vulnerable' results.txt` | Save + filter vulnerable | Post-scan. |
| `go install -v github.com/PentestPad/subzy@latest && subzy run --targets subs.txt --hide_fails --vuln` | Modern alt con menos false positives | Subzy. |
| `nuclei -t http/takeovers/ -l subs.txt -o nuclei-takeovers.txt` | Templates regularly updated por ProjectDiscovery | Bulk scan curado. |
| `nuclei -t http/takeovers/ -u https://specific-sub.target.com` | Single target | Manual verification. |
| `for s in $(cat subs.txt); do curl -s "$s" \| grep -iE 'no such bucket\|no-such-app\|nosuchbucket\|fastly error\|domain not configured' && echo "[!] $s"; done` | Quick filter manual sin tools | Custom one-liner. |
| `pip install takeover && takeover -d targets.txt` | Python alt simple | Sin Go. |
^sdt-tool-detection

### subjack workflow estándar

```bash
go install github.com/haccer/subjack@latest

subjack -w subs.txt \
  -t 100 \
  -timeout 30 \
  -ssl \
  -c $GOPATH/src/github.com/haccer/subjack/fingerprints.json \
  -v -o results.txt

grep -i '\[' results.txt | grep -v 'Not Vulnerable'

# Manual verify
for sub in $(grep VULNERABLE results.txt | awk '{print $2}'); do
  echo "=== $sub ==="
  CNAME=$(dig +short CNAME "$sub")
  echo "  CNAME: $CNAME"
  curl -sI "$sub" | head -3
done
```

---

## Subdomain Enumeration Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `subfinder -d target.com -all -recursive -silent` | Pasivo enumeration multi-source | Recon inicial rápido. |
| `amass enum -active -d target.com -o subs_active.txt` | Active + passive comprehensive | Más coverage que subfinder. |
| `amass enum -passive -d target.com -silent` | Solo passive (sin tocar target) | Stealth recon. |
| `assetfinder --subs-only target.com` | Pasivo simple | Quick + OSS. |
| `findomain --target target.com` | Modern alt + Rust | Speed. |
| `chaos -d target.com -silent -key $CHAOS_KEY` | PD chaos DB | Comprehensive PD source. |
| `curl -s "https://crt.sh/?q=%25.target.com&output=json" \| jq -r '.[].name_value' \| sort -u` | Certificate Transparency logs | OSINT pasivo. |
| `github-subdomains -d target.com -t $GITHUB_TOKEN` | GitHub-specific recon (commits/code search) | Code leaks. |
| `cat subs_*.txt \| sort -u > subs.txt` | Combinar + dedupe outputs | Standardize. |
| `dnsx -l subs.txt -resp -silent` | Filter live (resolvable) subs | Validation post-enum. |
^sdt-tool-enum

---

## DNS Probing y Resolution

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dnsx -l subs.txt -resp -cname -silent` | Resolve A + CNAME records | Standard PD modern. |
| `dnsx -l subs.txt -cname -resp -silent \| grep -E 's3\|herokuapp\|github\.io\|cloudfront\|azurewebsites'` | Filter takeover candidates | Pipeline filtering. |
| `massdns -r /usr/share/wordlists/resolvers.txt -t A -o S subs.txt` | Bulk fast resolution | Volume scan. |
| `puredns bruteforce wordlist.txt target.com -r resolvers.txt` | Modern brute force | DNS bruteforce. |
| `dig +short CNAME sub.target.com` | Manual single CNAME query | Verification. |
| `dig +trace sub.target.com` | NS chain trace | Glue / lame delegation check. |
| `host -t any sub.target.com` | Multi-record query (A, CNAME, MX, etc) | Quick recon. |
| `dnsenum --noreverse target.com` | All-in-one DNS enumeration | Standard. |
| `wget https://raw.githubusercontent.com/janmasarik/resolvers/master/resolvers.txt -O resolvers.txt` | Download public resolvers | Pre-massdns. |
^sdt-tool-dns

### DNS recon workflow

```bash
# 1. Enumerate
subfinder -d target.com -all -silent | tee subs_passive.txt
amass enum -active -d target.com -o subs_active.txt
cat subs_*.txt | sort -u > subs.txt

# 2. Resolve
dnsx -l subs.txt -resp -silent > resolved.txt

# 3. Extract CNAMEs
dnsx -l subs.txt -cname -resp -silent > cnames.txt

# 4. Filter takeover candidates
grep -E 's3\.amazonaws\.com|herokuapp|github\.io|cloudfront|azurewebsites' cnames.txt > candidates.txt

# 5. Run takeover scanner
subjack -w candidates.txt -ssl -t 100 -timeout 30
```

---

## can-i-take-over-xyz (Reference)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Browser → https://github.com/EdOverflow/can-i-take-over-xyz | Lista curada de servicios takeover | Lookup per-service. |
| `git clone https://github.com/EdOverflow/can-i-take-over-xyz && grep -lE 'engine.*Vulnerable' README.md` | Servicios actualmente vulnerables | Status check. |
| `grep -A5 "name.*S3" can-i-take-over-xyz/README.md` | Per-service detail (fingerprints, mitigations) | Service lookup. |
| `nuclei -t http/takeovers/ -tags takeover -l subs.txt` (tag-filtered) | Templates derived from canitakeover | Auto-scan. |
| `aquatone -threads 10 < subs.txt` | Visual screenshots de subdomains | Visual confirmation. |
| `gowitness file -f subs.txt --threads 10` | Modern alt screenshot tool | Same. |
^sdt-tool-canitakeover

---

## Manual Verification

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short CNAME sub.target.com` | Verifica CNAME existe | Step 1. |
| `dig +short A $(dig +short CNAME sub.target.com)` | Si vacío → CNAME target unresolved | Step 2 (dangling check). |
| `curl -sI https://sub.target.com` | Status + headers | Step 3. |
| `curl -s https://sub.target.com \| head -c 500` | Body fingerprint | Step 4 (match service signature). |
| Per-service signup + add custom domain (manual) | Step 5 (claim service) | Reclamar. |
| `curl -s https://sub.target.com \| grep -i "atacante"` | Step 6 (verify atacante content visible) | PoC complete. |
| `gowitness single https://sub.target.com -o screenshot.png` | Screenshot reportable | Bug bounty PoC. |
| `asciinema rec poc.cast` | Grabar full takeover process | Video PoC. |
^sdt-tool-manual

---

## Wordlists Comprehensivas

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `cat /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt` | SecLists DNS top 110k | Standard brute. |
| `wget https://wordlists-cdn.assetnote.io/data/manual/best-dns-wordlist.txt` | Assetnote curated | Modern wordlist. |
| `wget https://wordlists-cdn.assetnote.io/data/manual/2m-subdomains.txt` | Assetnote 2M subs | Comprehensive. |
| `git clone https://github.com/danielmiessler/SecLists && ls SecLists/Discovery/DNS/` | All SecLists DNS wordlists | Foundation. |
| `altdns -i subs.txt -o permutations.txt -w altdns/words.txt` | Permutations sobre subs existentes | Variation discovery. |
| `dnsgen subs.txt > generated.txt` | DNS pattern generator | Mutations. |
| `cat seclists.txt assetnote.txt custom.txt \| sort -u > combined.txt` | Combinar + dedupe | Bulk wordlist. |
^sdt-tool-wordlists

---
