---
aliases:
  - OAuth Code Theft
  - OAuth Token Leak
  - postMessage Hijack
  - Mix-Up Attack
tags:
  - type/cheatsheet
  - vuln/oauth
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[JWT Attacks]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# OAuth 2.0 - Code & Token Theft

***

## Referer Header Leak

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Browser sends `Referer: <previous URL>` en next request. Callback con code en URL leak via Referer a recursos third-party. | Standard browser behavior. |
| Callback page carga Google Analytics | `<script src="googletagmanager.com/...">` envía Referer al fetch | GTAG sees code. |
| Callback con `<img src="3p.com/track">` | Image fetch envía Referer | Tracking pixels. |
| Callback redirige interno con Referer chain | Multi-hop chain leak | Cumulative. |
| Outlinks en callback page | User click → leak via Referer | UX accident. |
| `<script src="cdn.untrusted.com">` | CDN ve URL completa | CDN logs. |
| Browser history entry | URL con code persiste en history | Local theft via XSS. |
| Browser autofill suggestions | URLs suggested incluyen code | Edge UX. |
| Bookmark accidental | Víctima bookmarks callback | Persistent. |
| Email forwarding URL | Víctima reenvía URL con code | Social leak. |
| Slack/chat link unfurl | Slack fetches URL → ve code | Bot leak. |
| Discord embed | Idem Discord | Adjacent. |
| Sentry/Rollbar error capture | Error reports incluye URL completa | Telemetry leak. |
| `Referrer-Policy` ausente | Default behavior leakea | Mitigation gap. |
| `Referrer-Policy: unsafe-url` | Explicit leak setting | Explicit bug. |
| `Referrer-Policy: no-referrer` | Strictest, no leak | Defense. |
^oauth-theft-referer

### Mitigation header

```http
# Strictest
Referrer-Policy: no-referrer

# Acceptable (cross-origin sends only origin)
Referrer-Policy: strict-origin-when-cross-origin

# Bad
Referrer-Policy: unsafe-url    # ← leakea full URL incluso cross-origin
Referrer-Policy: no-referrer-when-downgrade  # ← default browsers
```

___

## postMessage / window.opener

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | OAuth con `display=popup` opens callback en popup. Popup tiene `window.opener` → si opener es atacante, popup post-callback puede `postMessage(code, '*')` → atacante captura. | Popup architecture. |
| Popup callback con `postMessage(*)` | `window.opener.postMessage(code, '*')` | Cualquier opener recibe. |
| Opener listener sin origin check | `addEventListener('message', e => process(e.data))` sin `e.origin` check | Accept any origin. |
| Reverse tabnabbing | Atacante abre `target.com` con `window.open()` → tab atacante mantiene `opener` access | Tab control. |
| `<a target="_blank">` sin `rel="noopener"` | External link → atacante acceso a `window.opener` | Opener manipulation. |
| `Cross-Origin-Opener-Policy` ausente | Sin `same-origin` policy → popups cross-origin keepan opener | Header missing. |
| `Cross-Origin-Embedder-Policy` ausente | Adjacent COOP/COEP gap | Defense gap. |
| Popup con `display=popup` OAuth flow | Common para mobile UX | Vector real. |
| `window.open()` retornando reference | Caller puede `.postMessage(stuff, '*')` al popup | Bidirectional. |
| postMessage serializa/deserializa con structured clone | DOMException leak edge | Edge attack. |
| postMessage recursive listener | Nested iframes propagan | Multi-frame chain. |
| Origin check con `startsWith` | `e.origin.startsWith('https://known')` permite `known.attacker.com` | Bypass. |
| Origin check case-insensitive bug | `e.origin === 'HTTPS://...'` mismatch | Edge. |
| postMessage to specific origin | `postMessage(data, 'https://target.com')` strict | Defense. |
| `targetOrigin: '*'` envío | Mensaje a cualquier opener | Bug común. |
| Rate-limit/replay postMessage | Múltiples mensajes para confuse | Edge. |
^oauth-theft-postmessage

### Patterns vulnerables vs safe

```javascript
// VULN — popup callback
const code = new URLSearchParams(location.search).get('code');
window.opener.postMessage({ oauth_code: code }, '*');  // ← cualquier opener
window.close();

// SAFE
window.opener.postMessage({ oauth_code: code }, 'https://target.com');

// VULN — opener listener
window.addEventListener('message', (e) => {
  processCode(e.data.oauth_code);  // ← sin origin check
});

// SAFE
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://target.com') return;
  if (!e.data || typeof e.data.oauth_code !== 'string') return;
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

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Auth code es one-time-use por spec, pero implementaciones rotas permiten reuse. Substitution: code emitido para client A usado en client B. | Multiple bugs. |
| Code reusable múltiples veces | Mismo code intercambiable repetido | Spec violation. |
| Code no rotated tras error | Token request falla, code queda válido | Replay window. |
| Code substitution no client_id bind | Code sin atadura a client_id que lo pidió | Cross-client. |
| Code substitution no PKCE bind | Sin verifier, exchange permitido | Mix-up. |
| Code reuse window | Reuse permitido por TTL extended | Race exploits. |
| Race exchange parallel | Múltiples requests simultáneos | TOCTOU. |
| Code bound only to redirect_uri | Cross-client si redirect_uri matches | Partial bind. |
| Code intercambiable solo si client | Public client (no secret) | Trivial. |
| Code en URL log access | Logs server expose code | Storage leak. |
| Code en metric/trace systems | Telemetry capture | Adjacent. |
| Code en error report | Stack trace incluye URL | Edge. |
| Code substitution via mixed flows | Hybrid response_type emite code AND token | Combo. |
| Refresh token sin rotation | Refresh token replay | Long-term persistence. |
| Refresh token family sin tracking | No detect on reuse | Defense gap. |
^oauth-theft-codereuse

### Test reuse

```bash
CODE="capture_via_burp_o_traffic"

# Multiple intercambios (debe fallar 2nd time)
for i in 1 2 3; do
  echo "=== Attempt $i ==="
  curl -s -X POST https://target/oauth/token \
    -d "grant_type=authorization_code" \
    -d "code=$CODE" \
    -d "redirect_uri=https://known.com/cb" \
    -d "client_id=APP" \
    -d "client_secret=SECRET" | jq .
done
# 1st = access_token (esperado)
# 2nd = error invalid_grant (esperado)
# Si returns access_token cada vez → vuln
```

___

## Implicit Flow Token en Fragment

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Implicit flow (`response_type=token`) emite `access_token` en fragment del callback URL: `#access_token=AAA`. Fragment no viaja en HTTP request al server pero queda en browser, JS, history, etc. | Deprecated 2020. |
| Browser history captura | `chrome://history` muestra URL con fragment | Local persistent. |
| `location.hash` via XSS | XSS posterior lee `location.hash` | Read trivial. |
| Mobile app webview logging | WebView logs URLs con fragments | Logging hygiene gap. |
| Browser extensions con `tabs` | Extensions ven fragment | User-trust extensions. |
| JS error reporting | Sentry/Rollbar capturan URL completa | Telemetry leak. |
| Local storage post-callback | App guarda token en localStorage → XSS lo lee | Storage. |
| Service Worker cache | SW puede cachear URL con fragment | Edge. |
| Browser bookmark accidental | Víctima bookmarks page con token | Persistent. |
| Screenshot/Screen recording | Video/screenshot incluye URL bar | UX risk. |
| Shared link forward | Víctima envía URL con token | Social leak. |
| Token en URL params (some impls) | Variant: token en query, no fragment | Server logs see. |
| Hybrid `code id_token token` | Multiple credentials en fragment | Triple leak. |
| `nonce` validation gap | id_token sin nonce check | Replay combo. |
| Implicit + redirect_uri laxa | Combo trivial token theft | Compounding. |
| OAuth 2.1 bans implicit | Modern best practice | Spec direction. |
^oauth-theft-implicit

### Migration recommendation

```javascript
// VULN — implicit flow callback
const params = new URLSearchParams(location.hash.substring(1));
const token = params.get('access_token');
localStorage.setItem('token', token);  // ← XSS reads localStorage

// SAFE — Authorization Code + PKCE
// 1. Generate code_verifier + code_challenge
const verifier = generateRandomString(64);
const challenge = base64url(sha256(verifier));
sessionStorage.setItem('pkce_verifier', verifier);

// 2. Authorize URL
const url = `${AUTHORIZE}?response_type=code&client_id=${CLIENT}&redirect_uri=${REDIRECT}&scope=${SCOPE}&state=${STATE}&code_challenge=${challenge}&code_challenge_method=S256`;
location.assign(url);

// 3. Callback exchange (token from POST response, not URL)
const code = new URLSearchParams(location.search).get('code');
const verifier_stored = sessionStorage.getItem('pkce_verifier');
const tokens = await fetch(TOKEN, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT,
    client_id: CLIENT,
    code_verifier: verifier_stored
  })
}).then(r => r.json());
```

___

## Mix-Up Attack (Multi-IdP)

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Cliente soporta múltiples IdPs. Atacante engaña cliente para enviar code/secret de IdP legit a IdP atacante. | RFC 9207 specific. |
| Setup IdP atacante | `https://attacker-idp.com` con OAuth endpoints | Pre-attack. |
| Atacante elige provider atacante | Cliente registra "user wants attacker-idp" | State setup. |
| Atacante mezcla callback | Recibe code emitido por Google → forward al callback como atacante-idp | Confusion. |
| Cliente intercambia code en atacante-idp's `/token` | Envía client_secret de cliente para Google al atacante | Secret leak. |
| Atacante captura code Google + secret cliente | Game over | Multi-leak. |
| RFC 9207 `iss` parameter | Authorization response incluye `iss` | Defense spec. |
| Cliente verifica `iss` matches expected IdP | Mismatch → reject | Per-state IdP. |
| Without RFC 9207 → vuln común | Apps modernas pre-2022 | Wide vuln. |
| OIDC `iss` claim en id_token | Adjacent — verify too | OIDC. |
| AS Issuer Identifier metadata | Discover via `.well-known` | Discovery. |
| Mix-up via custom IdP per-tenant | SaaS per-tenant IdP confusion | Multi-tenant edge. |
| Combine con dynamic registration | Atacante registra IdP real | Compound. |
| Combine con redirect_uri bypass | Code substitution full chain | Major. |
| `aud` claim id_token | Verify token audience | OIDC defense. |
| Authorization Server Metadata | Discovery endpoint per-IdP | Per-AS validation. |
^oauth-theft-mixup

### Defense (RFC 9207)

```http
# Authorization response WITH iss (safe)
HTTP/1.1 302 Found
Location: https://client.com/cb?code=XYZ&state=ABC&iss=https://accounts.google.com

# Cliente valida:
# - state matches stored
# - iss matches expected IdP for this state
# - Si mismatch → reject
```

```python
# Cliente — SAFE
expected_iss = session.pop('oauth_idp_iss')
got_iss = request.args.get('iss')
if got_iss != expected_iss:
    abort(400, 'mix-up attack detected')
```

***
