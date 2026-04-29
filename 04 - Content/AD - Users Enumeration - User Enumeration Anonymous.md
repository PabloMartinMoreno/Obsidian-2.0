---
aliases:
  - Anonymous User Enum
  - Null Session Users
  - Pre-Auth User Enum
  - kerbrute Userenum
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
  - "[[AD - Users Enumeration]]"
---
# AD - Users Enumeration - Anonymous Discovery

***

## Null Session SAMR

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u '' -p '' --users` | Null session SAMR enum | Anonymous attempt. |
| `nxc smb DC -u 'guest' -p '' --users` | Guest fallback | Edge. |
| `rpcclient -U "" DC -N -c 'enumdomusers'` | RPC anonymous | Direct. |
| `enum4linux -U DC` | Legacy null enum | Old but works. |
| `enum4linux-ng -U DC` | Modernized | Better. |
| `enum4linux-ng -U -A DC` | All-in-one | Comprehensive. |
| `impacket-samrdump 'dom/'@DC` | Anonymous SAMR | Standard. |
| `impacket-lookupsid 'dom/'@DC` | Anonymous SID enum | RID brute. |
| Modern Server 2019+ blocks null | Hardened default | Adjacent. |
| Legacy 2008-2012 often allows | Common vuln | Audit. |
| `RestrictAnonymous=2` blocks | Registry hardening | Defense. |
| `RestrictAnonymousSAM=1` blocks | Adjacent | Defense. |
| Pre-Windows 2000 group | Allows anonymous | Edge. |
| EveryoneIncludesAnonymous registry | Edge misconfig | Risk. |
| Bulk subnet test | `nxc smb 10.0.0.0/24 -u '' -p '' --users` | Sweep. |
| Stealth: limit connections | OPSEC | Adjacent. |
^ad-anon-samr

### Null session test sweep

```bash
# Test domain-wide
nxc smb 10.0.0.0/24 -u '' -p '' --users 2>&1 | tee null_test.txt

# Per-DC RPC
DCS="dc01 dc02 dc03"
for dc in $DCS; do
  echo "=== $dc ==="
  rpcclient -U "" $dc -N -c 'enumdomusers' 2>&1 | head -20
done

# Bulk via enum4linux-ng
enum4linux-ng -U -A DC -oJ enum_anon.json
```

___

## Anonymous LDAP

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch -x -h DC -s base namingcontexts` | RootDSE anonymous | Standard. |
| `ldapsearch -x -h DC -b "DC=dom,DC=local" "(objectCategory=user)" samAccountName` | Anonymous user dump if allowed | Often blocked. |
| Modern Server 2019+ | Anonymous bind disabled by default | Hardened. |
| Legacy: anonymous LDAP read | Common gap | Vuln. |
| `dsHeuristics` flag controls | Default = block | Standard. |
| `LDAPAdminLimits` adjacent | Limits | Adjacent. |
| RootDSE always available | Standard | Always. |
| RootDSE reveals naming contexts | Domain DN, forest DN | Bootstrap. |
| Anonymous schema query | `subschemaSubentry` | Public typically. |
| Anonymous Configuration NC | Often blocked | Edge. |
| Anonymous specific user query | Often blocked | Edge. |
| Anonymous group query | Often blocked | Edge. |
| Tor / external LDAP scan | DC exposed externally | Critical risk. |
| Cloud-managed AD (Azure AD DS) | Different model | Edge. |
| `ldap-monitor.py` anonymous | Per-tool | Adjacent. |
| Anonymous detection | Event 2889 (LDAP signing audit) | Defender. |
^ad-anon-ldap

### Anonymous LDAP probe

```bash
# RootDSE (almost always anonymous-allowed)
ldapsearch -x -h DC -s base -b "" \
  namingContexts \
  defaultNamingContext \
  configurationNamingContext \
  schemaNamingContext \
  rootDomainNamingContext \
  domainFunctionality \
  forestFunctionality

# Try anonymous user enumeration (often blocked)
ldapsearch -x -h DC -b "DC=dom,DC=local" "(objectCategory=user)" samAccountName 2>&1 | head -5

# Common errors:
# "Operations error" = anonymous bind blocked
# "Authentication required" = need creds
# Returns data = vuln (anonymous user enum allowed)
```

___

## Kerberos Pre-Auth Username Validation

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `kerbrute userenum -d dom.local users.txt` | Validate via Kerberos | Pre-auth based. |
| `kerbrute userenum --dc DC -d dom.local users.txt` | Direct DC | Specific. |
| `kerbrute userenum -d dom.local users.txt -o results.txt` | Output | Standard. |
| Pre-auth response codes | KDC differentiates valid vs invalid | Detection. |
| `KDC_ERR_PREAUTH_REQUIRED` (24) | User EXISTS | Standard. |
| `KDC_ERR_C_PRINCIPAL_UNKNOWN` (6) | User does NOT exist | Standard. |
| `KDC_ERR_CLIENT_REVOKED` (18) | Disabled account (still exists) | Detection. |
| `KDC_ERR_KEY_EXPIRED` (23) | Password expired (still exists) | Detection. |
| Anonymous-friendly | No creds needed | Big OPSEC win. |
| Faster than LDAP brute | Single TCP packet | Performance. |
| `kerbrute -t 100 userenum` | Increase threads | Performance. |
| `--downgrade` flag | RC4 forced | Edge. |
| OPSEC: high volume = detection | Throttle | Stealth. |
| No lockout typically | KDC doesn't lock on userenum | Safe. |
| BadPasswordCount unaffected | No brute force | Safe. |
| Detection: Event 4768 mass | Defender SIEM | Adjacent. |
^ad-anon-kerbrute

### Kerbrute workflow

```bash
# Generate username candidates
git clone https://github.com/urbanadventurer/username-anarchy
cd username-anarchy
./username-anarchy -i first_last_names.txt > usernames.txt

# Or SecLists Names list
cp /usr/share/seclists/Usernames/Names/names.txt usernames.txt

# Validate via Kerberos
kerbrute userenum --dc DC -d dom.local usernames.txt -o valid_users.txt

# Output:
# [+] VALID USERNAME: jsmith@dom.local
# [+] VALID USERNAME: alice@dom.local

# Speed: ~1000 users/second typical
# No lockout triggered
```

___

## RID Cycling (Anonymous)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u '' -p '' --rid-brute` | Null RID brute | Standard. |
| `nxc smb DC -u '' -p '' --rid-brute 10000` | Range | Standard. |
| `enum4linux -r DC` | RID range scan | Legacy. |
| `enum4linux-ng -R DC` | Modern | Better. |
| `impacket-lookupsid 'dom/'@DC` | Anonymous SID enum | Direct. |
| `impacket-lookupsid 'dom/'@DC 10000` | Range | Standard. |
| Default Admin = RID 500 | First built-in admin | Standard. |
| Default Guest = RID 501 | Built-in guest | Standard. |
| krbtgt = RID 502 | KDC service | Standard. |
| Domain Admins = RID 512 (group) | Built-in priv | Standard. |
| Domain Users = RID 513 (group) | Default user group | Standard. |
| Domain Guests = RID 514 (group) | Built-in | Standard. |
| Domain Computers = RID 515 (group) | Built-in | Standard. |
| User-created RIDs start 1000+ | Custom accounts | Standard. |
| Common range: 1000-5000 | Most enterprises | Sizing. |
| Edge: massive ranges | Hundred-thousand users | Edge. |
| Throttle for OPSEC | Slow brute | Stealth. |
^ad-anon-ridcycle

### RID brute anonymous

```bash
# Anonymous RID brute (if null sessions allowed)
impacket-lookupsid 'dom/'@DC 10000 | grep "SidTypeUser"

# Output format:
# 500: dom\Administrator (SidTypeUser)
# 501: dom\Guest (SidTypeUser)
# 502: dom\krbtgt (SidTypeUser)
# 1000: dom\jsmith (SidTypeUser)

# netexec equivalent
nxc smb DC -u '' -p '' --rid-brute 10000

# Filter to user list
impacket-lookupsid 'dom/'@DC 10000 | \
  grep "SidTypeUser" | \
  awk '{print $2}' | \
  cut -d'\' -f2 > users.txt
```

___

## OSINT-Based Username Discovery

| **Source** | **Method** | **Notas** |
|:---:|:---:|:---:|
| LinkedIn employee scraping | `linkedin2username` tool | Most accurate. |
| GitHub email leaks | Repo dorks `org-name` | OSINT. |
| Public breach DBs | dehashed.com, HIBP | Email patterns. |
| Company "Team" / "About" pages | Manual scrape | Public. |
| Email pattern guess | Common formats | Pattern. |
| Press releases | Executive names | Public. |
| Conference speakers | Slides + bios | Edge. |
| Job postings | "Reports to X" | OSINT. |
| Public DNS leaks | Email in TXT records | Edge. |
| Wayback Machine | Historical staff lists | OSINT. |
| Public GitHub repos | Authors of commits | OSINT. |
| Twitter/X social media | Bio mentions | Adjacent. |
| Slack/Discord public servers | Org name in handles | Edge. |
| Public Slack join links | `org.slack.com/join` | OSINT. |
| Microsoft Teams public docs | Org metadata | Edge. |
| Wikipedia / org charts | Public structure | Public. |
^ad-anon-osint

### OSINT pipeline

```bash
# LinkedIn → username candidates
git clone https://github.com/initstring/linkedin2username
python3 linkedin2username.py -c "Target Company" -u u -p p -n dom.local

# Output formats generated:
# - first.last@dom.local
# - first_last@dom.local
# - flast@dom.local
# - firstl@dom.local
# - firstmlast@dom.local

# Email pattern from breaches (HIBP API)
# Manual via haveibeenpwned.com

# Validate via Kerberos
kerbrute userenum --dc DC -d dom.local linkedin_users.txt
```

___

## Common Naming Patterns Wordlists

| **Pattern** | **Example** | **Notas** |
|:---:|:---:|:---:|
| `firstname.lastname` | `john.smith` | Most common. |
| `firstinitial.lastname` | `j.smith` | Common. |
| `firstinitiallastname` | `jsmith` | Common. |
| `firstnamelastname` | `johnsmith` | Common. |
| `lastname.firstinitial` | `smith.j` | Edge. |
| `lastnamefirstinitial` | `smithj` | Edge. |
| `firstname` only | `john` | Edge. |
| `lastname` only | `smith` | Edge. |
| `firstname.middleinitial.lastname` | `john.r.smith` | Edge. |
| With middlename | `johnrobertsmith` | Edge. |
| Contractor prefix | `c-jsmith`, `con-jsmith` | Common. |
| Service prefix | `svc-jsmith` (rare for users) | Edge. |
| Domain prefix | `dom\jsmith` | Standard. |
| External UPN | `john@external.com` | Adjacent. |
| Exchange-style alias | `jsmith001`, `jsmith2` | Edge. |
| Numeric suffix | `jsmith123`, `jsmith2024` | Edge. |
| First only initial | `j` (rare) | Edge. |
| Numbered duplicates | `jsmith2`, `jsmith3` | Edge. |
^ad-anon-patterns

### Username generator (custom)

```bash
# Custom Bash username generator from names.txt (format: First Last)
cat names.txt | while IFS=' ' read first last; do
  first_lower=$(echo "$first" | tr '[:upper:]' '[:lower:]')
  last_lower=$(echo "$last" | tr '[:upper:]' '[:lower:]')
  fi=${first_lower:0:1}
  
  echo "${first_lower}.${last_lower}"
  echo "${fi}.${last_lower}"
  echo "${fi}${last_lower}"
  echo "${first_lower}${last_lower}"
  echo "${last_lower}.${fi}"
  echo "${last_lower}${fi}"
  echo "${first_lower}"
done | sort -u > usernames.txt

# Or username-anarchy
./username-anarchy -i names.txt > usernames.txt

# SecLists alternatives
cp /usr/share/seclists/Usernames/Names/names.txt names.txt
cp /usr/share/seclists/Usernames/cirt-default-usernames.txt defaults.txt
```

***
