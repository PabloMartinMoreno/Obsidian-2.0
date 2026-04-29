---
aliases:
  - User List Dump
  - LDAP User Filter
  - GetADUsers
  - SAMR enumdomusers
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
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AD - Users Enumeration - User List Extraction

***

## netexec / crackmapexec User Dump

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u u -p p --users` | RID brute via SAMR | Quick. |
| `nxc ldap DC -u u -p p --users` | LDAP-based user enum | Full attribute set. |
| `nxc smb DC -u '' -p '' --users` | Anonymous SAMR if allowed | Null check. |
| `nxc smb DC -u guest -p '' --users` | Guest fallback | Edge. |
| `nxc ldap DC -u u -p p --users-export users.txt` | Export to file | Standard. |
| `nxc smb DC -u u -p p --users-export users.txt` | RID export | Adjacent. |
| `nxc ldap DC -u u -p p --query "(&(objectCategory=user)(objectClass=user))" "samAccountName"` | Custom LDAP query | Advanced. |
| `nxc ldap DC -u u -p p --asreproastable` | Filter DONT_REQ_PREAUTH | Adjacent. |
| `nxc ldap DC -u u -p p --kerberoasting out.txt` | Filter SPN-bound | Adjacent. |
| `nxc ldap DC -u u -p p --admin-count` | adminCount=1 (Tier 0) | Privileged. |
| `nxc ldap DC -u u -p p --get-userlist` | Alternative flag | Standard. |
| `nxc ldap DC -u u -p p --active-users` | Enabled accounts | Filter. |
| `nxc ldap DC -u u -p p --password-not-required` | PASSWD_NOTREQD | Vuln signal. |
| `crackmapexec smb DC -u u -p p --users` | Older name | Same. |
| `nxc smb DC --rid-brute 5000` | RID brute range | Standard. |
| `crackmapexec smb DC --rid-brute 10000` | Larger range | Edge. |
^ad-userlist-netexec

### Comprehensive netexec dump

```bash
DC="dc01.dom.local"

# Authenticated dumps
nxc ldap $DC -u user -p pass --users > users_ldap.txt
nxc smb $DC -u user -p pass --users > users_samr.txt
nxc smb $DC -u user -p pass --rid-brute 10000 > users_rid.txt

# Specific filters
nxc ldap $DC -u user -p pass --asreproastable > asrep_users.txt
nxc ldap $DC -u user -p pass --kerberoasting kerb.txt
nxc ldap $DC -u user -p pass --admin-count > admin_users.txt

# Anonymous attempts
nxc smb $DC -u '' -p '' --users 2>&1 | tee users_anon.txt
nxc smb $DC -u guest -p '' --users 2>&1 | tee users_guest.txt
```

___

## Impacket User Enumeration

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `impacket-GetADUsers -all dom/u:p` | List users + LastLogon | Standard. |
| `impacket-GetADUsers -all -dc-ip DC dom/u:p` | Specify DC | Direct. |
| `impacket-GetADUsers -all dom/u:p -outputfile users.csv` | CSV export | Reportable. |
| `impacket-GetADUsers -all dom/u:p -no-pass -k` | Kerberos auth (TGT) | Adjacent. |
| `impacket-lookupsid 'dom/u:p'@DC` | SID enum (RID brute) | Standard. |
| `impacket-lookupsid 'dom/'@DC` | Anonymous if allowed | Null. |
| `impacket-lookupsid 'dom/u:p'@DC 10000` | RID range to 10000 | Range. |
| `impacket-rpcdump @DC` | RPC interfaces | Adjacent. |
| `impacket-samrdump dom/u:p@DC` | SAMR-based dump | Detailed. |
| `impacket-samrdump dom/'@DC` | Anonymous SAMR if allowed | Null. |
| `impacket-getNPUsers dom/ -usersfile users.txt -no-pass` | AS-REP roastable check (no auth) | Pre-auth bypass. |
| `impacket-getUserSPNs dom/u:p` | SPN-bound users | Kerberoast prep. |
| `impacket-secretsdump dom/admin:pass@DC -just-dc-user user` | Single user hash dump | Privileged. |
| Bulk RID resolution | `lookupsid` 0-10000 | Comprehensive. |
| Pipe to file | `> output.txt` | Standard. |
| Auth via NTLM hash | `-hashes :NT_HASH` | Adjacent. |
^ad-userlist-impacket

### Impacket comprehensive

```bash
# Detailed user dump with LastLogon
impacket-GetADUsers -all dom.local/user:pass -dc-ip DC -outputfile users.csv

# RID brute via SAMR (more detail than --rid-brute)
impacket-lookupsid 'dom.local/user:pass'@DC 10000 | grep "SidTypeUser"

# Output format: 1000: dom\username (SidTypeUser)
# Filter to usernames only:
impacket-lookupsid 'dom.local/user:pass'@DC 10000 | \
  grep "SidTypeUser" | awk '{print $2}' | cut -d'\' -f2 > users_clean.txt
```

___

## LDAP Direct (ldapsearch)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" "(objectCategory=user)"` | All user objects | Standard. |
| `ldapsearch ... "(&(objectCategory=user)(objectClass=user))"` | Stricter filter | Excludes contacts. |
| `ldapsearch ... "(&(objectCategory=user)(!(objectClass=computer)))"` | Exclude computer accounts | Cleaner. |
| `ldapsearch ... -s subtree -b "DC=dom,DC=local"` | Recursive scope | Default. |
| `ldapsearch ... "(samAccountType=805306368)"` | User account type | Numeric filter. |
| `ldapsearch ... attr1 attr2 attr3` | Specific attributes only | Reduce output. |
| LDAPS encryption | `-H ldaps://DC` | Encrypted. |
| Paged results | LDAP_PAGED_RESULT_OID auto | Auto-paged. |
| Anonymous bind | `-x -h DC` | Anonymous attempt. |
| `(memberOf=CN=Domain Admins,...)` | Members of specific group | Filter. |
| `(memberOf:1.2.840.113556.1.4.1941:=...)` | Recursive group | Nested. |
| `(userAccountControl:1.2.840.113556.1.4.803:=4194304)` | DONT_REQ_PREAUTH bitwise | AS-REP. |
| Output LDIF | Default | Standard. |
| Output text | `-t` (binary) | Edge. |
| GC port 3268 (forest queries) | `-p 3268` | Forest scope. |
| Cross-domain via GC | Forest-aware | Adjacent. |
^ad-userlist-ldapsearch

### ldapsearch templates

```bash
LDAP="ldapsearch -h DC -D 'dom\\user' -w pass -b DC=dom,DC=local"

# All users (samAccountName, UPN, lastLogon)
$LDAP "(&(objectCategory=user)(!(objectClass=computer)))" \
  samAccountName userPrincipalName lastLogonTimestamp

# Active users only (NORMAL_ACCOUNT enabled)
$LDAP "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=512))" \
  samAccountName

# Disabled users
$LDAP "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=2))" \
  samAccountName

# Members of specific group
$LDAP "(&(objectCategory=user)(memberOf=CN=Domain Admins,CN=Users,DC=dom,DC=local))" \
  samAccountName description

# Forest-wide query via GC port 3268
ldapsearch -h DC -p 3268 -D 'dom\user' -w pass -b "" "(objectCategory=user)" samAccountName
```

___

## RPC / SAMR Enumeration

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `rpcclient -U "" DC -N` | Interactive null bind | Anonymous. |
| `rpcclient -U "dom\\user%pass" DC` | Authenticated | Standard. |
| `enumdomusers` | All users | Direct. |
| `enumdomusers -1` | Verbose | Detail. |
| `queryuser <RID>` | Per-user info | Detail. |
| `queryuser administrator` | Per-name info | Standard. |
| `samlookupnames domain administrator` | Resolve name → SID | Direct. |
| `samlookuprids domain 500` | Resolve RID → name | Direct. |
| `getusrdom <user>` | Per-user domain info | Edge. |
| `getuserdomstr <user>` | Edge | Adjacent. |
| `enumdomgroups` | Group enum | Adjacent. |
| `enumalsgroups domain` | Alias groups | Adjacent. |
| `lsaenumsid` | LSA SID enum | Adjacent. |
| `getdompwinfo` | Password policy | Adjacent. |
| `lsaquery` | Domain SID + name | Standard. |
| Direct via Impacket SAMR | `samrdump.py` | Linux equivalent. |
^ad-userlist-rpc

### rpcclient batch

```bash
# Interactive
rpcclient -U "" DC -N

# Batch commands
rpcclient -U "dom\\user%pass" DC -c 'enumdomusers; enumdomgroups; getdompwinfo'

# Anonymous batch
rpcclient -U "" DC -N -c '
lsaquery;
enumdomains;
enumdomusers;
enumdomgroups;
enumalsgroups domain;
enumalsgroups builtin;
getdompwinfo
'

# Per-user detail
rpcclient -U "dom\\user%pass" DC -c 'queryuser administrator'
```

___

## Kerberos User Enumeration (kerbrute)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `kerbrute userenum -d dom.local users.txt` | Validate users via Kerberos | Pre-auth based. |
| `kerbrute userenum --dc DC -d dom.local users.txt` | Direct DC | Specific. |
| `kerbrute userenum -d dom.local users.txt --downgrade` | Downgrade encryption | Edge. |
| `kerbrute userenum -d dom.local users.txt -o results.txt` | Output file | Standard. |
| `kerbrute passwordspray -d dom.local users.txt 'Spring2026!'` | Spray after enum | Adjacent. |
| `kerbrute bruteuser -d dom.local pass.txt admin` | Brute single user | Edge. |
| Pre-auth mechanism | AS-REQ → KDC response differs | Detection. |
| `KDC_ERR_PREAUTH_REQUIRED` = user exists | Standard | Detection. |
| `KDC_ERR_C_PRINCIPAL_UNKNOWN` = user does NOT exist | Standard | Detection. |
| Anonymous-friendly | No creds needed | OPSEC win. |
| Faster than LDAP brute | Single UDP/TCP packet | Performance. |
| Wordlist sources | SecLists, custom | Adjacent. |
| Naming patterns | `firstname.lastname`, `flastname`, etc | Patterns. |
| Username generators | `username-anarchy` | Adjacent. |
| LinkedIn scraping | Names → permutations | OSINT. |
| OPSEC: high volume = detection | Throttle if needed | Stealth. |
^ad-userlist-kerbrute

### kerbrute workflow

```bash
# Generate username list from names
git clone https://github.com/urbanadventurer/username-anarchy
cd username-anarchy
./username-anarchy -i names.txt > usernames.txt

# Or SecLists usernames
cp /usr/share/seclists/Usernames/Names/names.txt usernames.txt

# Validate which usernames exist via Kerberos
kerbrute userenum --dc DC -d dom.local usernames.txt -o valid_users.txt

# Output: [+] VALID USERNAME: jsmith@dom.local
# Speeds: ~1000 users/second typical
```

___

## OSINT-Based User Discovery

| **Vector** | **Tool / Source** | **Notas** |
|:---:|:---:|:---:|
| LinkedIn employee scraping | `linkedin2username` | Most accurate. |
| GitHub email leaks | `github-search` repo dorks | OSINT. |
| Public breach databases | dehashed.com, HIBP | Email patterns. |
| Company website "Team" page | Manual scrape | Public. |
| Email pattern guess | `firstname.lastname@dom` | Common. |
| Email pattern verification | SMTP VRFY/EXPN if open | Edge. |
| Conference speaker lists | Slides leak names | Edge. |
| Public DNS leak | `mx`, employees in DNS | Edge. |
| Press releases / news | Executive names | Public. |
| Job postings | "Reports to John Smith" | OSINT. |
| Public profile photos with badges | Visible IDs | Edge OSINT. |
| Social media (Twitter, FB, etc.) | Bio mentions | Adjacent. |
| Wayback Machine | Historical staff lists | OSINT. |
| Public Slack / Discord | Org name in handle | Edge. |
| Whois email contacts | DNS reg owner | OSINT. |
| Email signatures from public emails | Conference Q&A | OSINT. |
^ad-userlist-osint

### linkedin2username

```bash
# Install
git clone https://github.com/initstring/linkedin2username
cd linkedin2username

# Run
python3 linkedin2username.py -c "Target Company" -u atacante -p pass -n dom.local

# Output formats:
# - first.last@dom.local
# - first_last@dom.local
# - flast@dom.local
# - firstl@dom.local

# Combine with kerbrute to validate
kerbrute userenum --dc DC -d dom.local linkedin_users.txt
```

***
