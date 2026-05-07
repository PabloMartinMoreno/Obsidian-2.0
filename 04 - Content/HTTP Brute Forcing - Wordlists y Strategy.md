---
aliases:
  - Credential Stuffing
  - Password Spray
  - Mangling Rules
  - Targeted Wordlists
tags:
  - type/cheatsheet
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[HTTP Brute Forcing]]"
---
# HTTP Brute Forcing - Wordlists y Strategy

***

## Credential Stuffing vs Password Spray

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Credential Stuffing | Tienes user:pass leaked DB | High success rate. |
| Password Spray | Conoces users (enum) pero no passwords | Slow + wide. |
| Targeted brute | 1 user, many passwords | Account-specific (lockout risk). |
| Reverse brute | Many users, 1 password | Anti-lockout (1 attempt/user). |
| Hybrid stuffing+spray | Combine leaked + common | Best ROI. |
| Time-spread spray | 1 user / 24h | Avoid lockout/detection. |
| Geo-distributed | Different countries IPs | Per-IP rate limit bypass. |
| Dictionary attack | Common words list | Baseline. |
| Brute force complete | Char-set permutations | Last resort, slow. |
| Mask attack | Pattern known (`?u?l?l?l?d?d`) | Known structure. |
| Combinator attack | wordlist1 + wordlist2 | Compound passwords. |
| Rule-based mangling | hashcat rules | Mutate base list. |
| Markov chain | Frequency-based generation | Statistical. |
| Spray cycling | Diff password per round | Hide pattern. |
| Burst then sleep | N attempts → wait → repeat | Defeat windows. |
| Distributed brute | Multiple boxes parallel | Anti-rate-limit. |
^bf-strategy-stuffing-spray

___

## Leaked Databases

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| RockYou.txt | 2009 leak — 14M passwords | Default `/usr/share/wordlists/rockyou.txt`. |
| RockYou2024 | Aggregated mega-leak | 10B+ entries. |
| HaveIBeenPwned | `haveibeenpwned.com/Passwords` | 800M+ pwned passwords. |
| HIBP API | Pwned Passwords API | Validate hashes. |
| COMB (Compilation of Many Breaches) | 2021 — 3.2B unique entries | Large. |
| LinkedIn 2012 leak | 117M user:hash | Reverse-cracked. |
| Adobe 2013 | 153M | Useful patterns. |
| Yahoo 2013-2014 | 3B records | Massive. |
| Collection #1-5 | 2019 — 2.7B | Aggregate breach. |
| Antipublic | Multi-source | Various. |
| BreachCompilation | Username + plaintext | Format for stuffing. |
| dehashed.com | Subscription DB | Curated. |
| LeakCheck | Subscription | OSINT. |
| `seclists/Passwords/` | Curated wordlists | Various sizes. |
| `seclists/Passwords/Leaked-Databases/` | Per-breach lists | Specific. |
| Custom org-specific dump | Past company breach | High success. |
^bf-strategy-leaked-dbs

### Wordlist sources

```bash
# RockYou
ls /usr/share/wordlists/rockyou.txt.gz
gzip -d /usr/share/wordlists/rockyou.txt.gz

# SecLists
git clone https://github.com/danielmiessler/SecLists.git
ls SecLists/Passwords/

# HIBP downloadable
# https://haveibeenpwned.com/Passwords (8.7GB SHA-1 hashes)
```

___

## Targeted Wordlists (CeWL, CUPP, Wordlister)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| CeWL | Crawl target site, build wordlist | `cewl -d 2 -m 5 https://target -w out.txt`. |
| CUPP | Personal info → password permutations | Interactive: name, dob, partner, etc. |
| Mentalist | GUI wordlist builder | Drag-drop transformations. |
| Wordlister | Combinator + mutator | Python. |
| Pydictor | Generate by templates | Flexible. |
| Crunch | Pure brute generator | `crunch 8 8 abc123` — char-set. |
| Maskprocessor | Mask-based generation | hashcat counterpart. |
| Hashcat utils | Combinator, splitlen | Helpers. |
| `username-anarchy` | Username permutations | First.last → flast etc. |
| `user_enumeration` outputs | Combine with passwords | Targeted. |
| LinkedIn scraping | Employee names → user list | OSINT. |
| Org breach passwords | Past leak from org | High success. |
| Event-based passwords | Company event names + year | Common pattern. |
| Brand + year + ! | `Target2025!` | Default org pattern. |
| Domain-based | `target123`, `target!@#` | Lazy admin defaults. |
| Industry default | Healthcare, finance specific | Vertical patterns. |
^bf-strategy-targeted

### CeWL + mangling

```bash
# Crawl target, depth 2, min 5 chars
cewl -d 2 -m 5 -w cewl.txt https://target.com

# Mangle with hashcat rules
hashcat --stdout cewl.txt -r /usr/share/hashcat/rules/best64.rule > mangled.txt

# CUPP interactive
cupp -i  # asks name, dob, partner, dog name, etc.
```

___

## Mangling Rules

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `best64.rule` | hashcat default | 64 common transformations. |
| `dive.rule` | Dive deep — slow | Comprehensive. |
| `OneRuleToRuleThemAll.rule` | Combined heuristics | 52K rules. |
| `T0XlC.rule` | T0XlC's curated | Targeted. |
| Capitalization variants | `password` → `Password`, `PASSWORD` | Common. |
| Append digits | `password1`, `password123` | Default. |
| Append year | `password2024`, `password2025` | Time-based. |
| Append `!@#$` | `password!`, `Password1!` | Special chars. |
| Leetspeak | `p4ssw0rd`, `p@ssw0rd` | Common. |
| Reverse | `drowssap` | Edge. |
| Duplicate | `passwordpassword` | Edge. |
| Toggle case | `pAsSwOrD` | Random case. |
| Insert chars | `pa1ssword` | Mid-string. |
| Substitute | `password` → `passw0rd` (o→0) | Common. |
| Prefix | `1password`, `2025password` | Less common. |
| Combined: prefix+suffix | `2025Password!` | Common pattern. |
^bf-strategy-rules

### Hashcat mangling

```bash
# Apply rules to wordlist (output expanded list)
hashcat --stdout wordlist.txt -r /usr/share/hashcat/rules/best64.rule > mangled.txt

# Combined rules
hashcat --stdout wordlist.txt \
  -r rules/best64.rule \
  -r rules/dive.rule > combined.txt

# John the Ripper rule equivalent
john --wordlist=wordlist.txt --rules=All --stdout > mangled.txt
```

___

## Pattern-Based Strategy

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Default vendor passwords | `Default-Credentials/` SecLists | Routers, IoT. |
| Common admin defaults | `admin/admin`, `root/root`, `test/test` | Quick check. |
| Top 100/1000 most common | `Top1000.txt` | Baseline spray. |
| Seasonal passwords | `Spring2025!`, `Summer2025!` | Predictable. |
| Day-of-week passwords | `Monday1!`, `Tuesday1!` | Lazy users. |
| Month passwords | `January2025!` | Same. |
| Birthday-based | YYYYMMDD format | OSINT-driven. |
| Phone-based | Last 4 digits, area code | OSINT. |
| Company name + year | `Target2025!` | Default org. |
| Industry jargon | `nurse123`, `teacher!` | Per-industry. |
| Sports team | `Yankees1!`, `RealMadrid` | Demographic. |
| Pet names | OSINT social media | Targeted. |
| Address numbers | Street number | OSINT. |
| Anniversary dates | Wedding, hire date | OSINT. |
| Movie/song quotes | "Iamironman" | Pop culture. |
| Keyboard walks | `qwerty123`, `asdfgh` | Common. |
^bf-strategy-patterns

***
