---
aliases:
  - OAuth 2.0 Detection
  - OAuth Recon
tags:
  - vuln/oauth
  - technique/recon
  - technique/discovery
primary: "[[OAuth 2.0 Misconfigurations]]"
---

# OAuth 2.0 - Detección y Reconocimiento

Pre-explotación: descubrir endpoints, flow type, client_id values, response_type permitidos. Sin esto, todos los ataques siguientes son ciegos.

## Discovery via .well-known

OAuth 2.0 + OpenID Connect exponen metadata en endpoints estándar. Todo el flow se mapea desde acá.

| Endpoint | Spec | Datos clave |
|----------|------|-------------|
| `/.well-known/oauth-authorization-server` | RFC 8414 | `authorization_endpoint`, `token_endpoint`, `grant_types_supported`, `response_types_supported` |
| `/.well-known/openid-configuration` | OIDC Discovery | Above + `userinfo_endpoint`, `jwks_uri`, `issuer`, `id_token_signing_alg_values_supported` |
| `/.well-known/jwks.json` (via `jwks_uri`) | RFC 7517 | Public keys para JWT verification |
| `/.well-known/oauth-protected-resource` | RFC 9728 (draft) | Resource server metadata |

```bash
# Discovery completo
curl -s https://target/.well-known/openid-configuration | jq .

# Campos críticos
curl -s https://target/.well-known/openid-configuration | jq '{
  authorization_endpoint,
  token_endpoint,
  grant_types_supported,
  response_types_supported,
  scopes_supported,
  token_endpoint_auth_methods_supported,
  code_challenge_methods_supported
}'
```

Red flags al revisar metadata:
- `response_types_supported` incluye `token` o `id_token` → implicit flow habilitado (deprecated, vulnerable a leaks).
- `code_challenge_methods_supported` ausente o solo `plain` → PKCE débil.
- `token_endpoint_auth_methods_supported: ["none"]` → public clients sin secret.
- `subject_types_supported: ["public"]` → mismo `sub` global → tracking cross-app.

^oauth-detect-wellknown

## Identificación de Flow Type

Cada flow tiene attack surface distinta. Identificar primero qué flow se usa.

| Flow | Indicador en URL | Cuándo se usa | Vulns típicas |
|------|------------------|---------------|---------------|
| **Authorization Code** | `response_type=code` | Web apps confidential | redirect_uri bypass, code reuse, mix-up |
| **Auth Code + PKCE** | `response_type=code` + `code_challenge=...` | SPA, mobile | PKCE downgrade, code_verifier leak |
| **Implicit** | `response_type=token` o `id_token` | Legacy SPA (deprecated 2020) | Token en fragment, referer leak, `window.opener` theft |
| **Hybrid** | `response_type=code id_token` | OIDC | Code + id_token race, nonce skip |
| **Client Credentials** | `grant_type=client_credentials` | M2M | Secret leak, scope upgrade |
| **Resource Owner Password** | `grant_type=password` | Legacy (avoid) | Credential exposure, no MFA |
| **Device Authorization** | `grant_type=urn:ietf:params:oauth:grant-type:device_code` | TVs, IoT | Device code phishing, polling abuse |
| **Refresh Token** | `grant_type=refresh_token` | Long sessions | Rotation broken, replay |

```bash
# Capturar flow real con Burp Proxy → ver request a /authorize
# Buscar params críticos:
# response_type, client_id, redirect_uri, scope, state, nonce, code_challenge
```

^oauth-detect-flow

## Client ID Enumeration

`client_id` no es secret en OAuth — viaja en URL pública. Pero enumerar todos los registered clients del provider revela attack surface.

| Técnica | Cómo | Output |
|---------|------|--------|
| **Recon en frontend** | Buscar en JS bundles: `client_id`, `clientId`, `oauth_client` | IDs hardcoded |
| **Mobile app decompile** | `apktool d app.apk` → `grep -r 'client_id' .` | Mobile client IDs |
| **GitHub dorks** | `"client_id" "victim.com"` site:github.com | Leaked configs |
| **Wayback Machine** | `web.archive.org/web/*/target/oauth*` | Historical client IDs |
| **Dynamic Registration** (RFC 7591) | `POST /register` si endpoint expuesto | Crear client controlled |
| **Common patterns** | Probar `web`, `mobile`, `ios`, `android`, `cli` | Default IDs |
| **Dev/staging mix** | `dev-clientid`, `staging-`, `test-` prefixes | Lower-secured siblings |

```bash
# Frontend dump
curl -s https://target | grep -oE 'client_id["\s]*[:=]["\s]*[a-zA-Z0-9-]+' | sort -u

# Dynamic registration check (si está abierto = jackpot)
curl -X POST https://target/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{"client_name":"test","redirect_uris":["https://attacker.com/cb"]}'
```

Si dynamic registration está abierto sin auth → atacante registra client con redirect_uri controlado → todo el resto del attack es trivial.

^oauth-detect-clientid

## Response Type & Scope Discovery

Probar qué `response_type` values y `scope` values acepta el server. Combos no documentados = ataque chain.

| Test | Request | Lo que muestra |
|------|---------|---------------|
| Response type fuzzing | `?response_type=code,token,id_token` cada uno | Cuáles acepta el server |
| Combined response types | `?response_type=code id_token token` | Hybrid flow soportado? |
| Scope brute | `?scope=admin email profile openid offline_access ...` | Qué scopes aceptan sin error |
| Custom scopes | `?scope=read:internal` | Scopes app-specific |
| Scope upgrade | Cambiar token con scope mayor en re-consent | Silent escalation viable? |
| `prompt=none` | `?prompt=none` | Silent re-auth (combo CSRF) |
| `display=popup` | `?display=popup` | Popup mode (combo `window.opener`) |

```bash
# Scope enum
for scope in openid profile email admin internal user.read offline_access; do
  echo "=== $scope ==="
  curl -sI "https://target/oauth/authorize?client_id=KNOWN&response_type=code&redirect_uri=https://known.com&scope=$scope" \
    | grep -iE 'location|error'
done
```

^oauth-detect-response

## Redirect URI Registration Check

Antes de bypass attempts, identificar cómo el server valida `redirect_uri`. Determina qué bypass funciona.

| Validación | Test | Bypass aplicable |
|------------|------|------------------|
| **Exact match** | `redirect_uri=https://known.com/cb/extra` → error | Solo via Open Redirect chain |
| **Prefix match** | `redirect_uri=https://known.com/cb.attacker.com` → OK | Suffix abuse |
| **Substring match** | `redirect_uri=https://attacker.com/known.com/cb` → OK | Substring smuggle |
| **Hostname match (no path)** | `redirect_uri=https://known.com/anything` → OK | Path traversal en cb |
| **Domain wildcard** | `redirect_uri=https://anything.known.com/cb` → OK | Subdomain takeover |
| **Scheme flexible** | `redirect_uri=javascript://known.com/...` → OK | Scheme abuse |
| **Multiple registered** | Probar todos los registered URIs | Pick weakest |

```bash
# Detect validation type
for uri in \
  "https://known.com/cb" \
  "https://known.com/cb/extra" \
  "https://known.com/cb?x=y" \
  "https://known.com.attacker.com/cb" \
  "https://attacker.com/known.com/cb" \
  "https://sub.known.com/cb" \
  "javascript://known.com/%0aalert(1)"; do
  ENC=$(printf '%s' "$uri" | jq -sRr @uri)
  CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    "https://target/oauth/authorize?client_id=KNOWN&response_type=code&redirect_uri=$ENC")
  echo "$CODE  $uri"
done
```

^oauth-detect-redirect
