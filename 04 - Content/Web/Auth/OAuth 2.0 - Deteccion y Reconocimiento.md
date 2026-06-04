---
aliases:
  - OAuth Detection
  - OAuth Recon
  - .well-known Discovery
  - Client ID Enum
tags:
  - vuln/oauth
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Burp Suite]]"
---
# OAuth 2.0 - Detección y Reconocimiento

---

## Discovery via .well-known

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `/.well-known/oauth-authorization-server` | RFC 8414 | Authorization server metadata. |
| `/.well-known/openid-configuration` | OIDC Discovery | Includes OAuth + OIDC fields. |
| `/.well-known/jwks.json` (via `jwks_uri`) | RFC 7517 | Public keys para JWT verify. |
| `/.well-known/oauth-protected-resource` | RFC 9728 (draft) | Resource server metadata. |
| `authorization_endpoint` | OAuth core | Where authz request goes. |
| `token_endpoint` | OAuth core | Where code/token exchange. |
| `introspection_endpoint` | RFC 7662 | Token validity check. |
| `revocation_endpoint` | RFC 7009 | Token revoke. |
| `userinfo_endpoint` | OIDC | User claims (id_token complement). |
| `registration_endpoint` | RFC 7591 | Dynamic Client Registration. |
| `device_authorization_endpoint` | RFC 8628 | Device flow start. |
| `grant_types_supported` | Discovery | Lists implicit/code/device/etc. |
| `response_types_supported` | Discovery | code, token, id_token combos. |
| `code_challenge_methods_supported` | RFC 7636 | PKCE: `S256`/`plain`. |
| `token_endpoint_auth_methods_supported` | Discovery | `none`/`client_secret_post`/`client_secret_basic`. |
^oauth-detect-wellknown

### Discovery rápido

```bash
# Full discovery
curl -s https://target/.well-known/openid-configuration | jq .

# Campos críticos
curl -s https://target/.well-known/openid-configuration | jq '{
  authorization_endpoint,
  token_endpoint,
  registration_endpoint,
  grant_types_supported,
  response_types_supported,
  scopes_supported,
  token_endpoint_auth_methods_supported,
  code_challenge_methods_supported
}'

# Red flags
# - response_types_supported incluye "token"/"id_token" → implicit habilitado (deprecated)
# - code_challenge_methods_supported ausente o solo "plain" → PKCE débil
# - token_endpoint_auth_methods_supported: ["none"] → public clients sin secret
# - registration_endpoint sin auth → dynamic client registration abierta
```

---

## Identificación de Flow Type

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `response_type=code` | Authorization Code | Web apps confidential — most secure. |
| `response_type=code` + `code_challenge=...` | Auth Code + PKCE | SPA/mobile recommended. |
| `response_type=token` o `id_token` | Implicit | Legacy SPA — deprecated 2020. |
| `response_type=code id_token` | Hybrid | OIDC complejo. |
| `grant_type=client_credentials` | Client Credentials | M2M — no user. |
| `grant_type=password` | Resource Owner Password | Legacy — credential exposure. |
| `grant_type=urn:ietf:params:oauth:grant-type:device_code` | Device Authorization | TVs/IoT. |
| `grant_type=refresh_token` | Refresh Token | Long sessions. |
| `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` | JWT Bearer | RFC 7523. |
| `grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer` | SAML Bearer | Enterprise. |
| `grant_type=urn:ietf:params:oauth:grant-type:token-exchange` | Token Exchange | RFC 8693. |
| `prompt=none` silent | Silent auth si session existe | Combo CSRF. |
| `prompt=login` force | Force re-auth | Defense. |
| `display=popup` | Popup modal | Combo `window.opener`. |
| `display=touch` | Mobile UX | App-specific. |
^oauth-detect-flow

### Capture flow real

```bash
# Burp Proxy → loggear request a /authorize
# Identificar:
# - response_type
# - client_id  
# - redirect_uri
# - scope
# - state, nonce
# - code_challenge, code_challenge_method
# - prompt, display
```

---

## Client ID Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s https://target \| grep -oE 'client_id["\s]*[:=]["\s]*[a-zA-Z0-9-]+'` | Frontend JS recon | Hardcoded common. |
| `wget -r https://target/static/js/ && grep -r 'client_id' .` | JS bundle dump | Bundles. |
| `*.js.map` files reveal originals | Source maps | Webpack default. |
| `apktool d app.apk && grep -r 'client_id' .` | Mobile APK decompile | Android. |
| `unzip app.ipa && strings Payload/*.app/* \| grep -i client` | Mobile IPA strings | iOS. |
| `"client_id" "victim.com" site:github.com` | GitHub dorks | Leaked configs. |
| GitLab/Bitbucket dorks | Similar dorks | Adjacent. |
| `web.archive.org/web/*/target/oauth*` | Wayback Machine | Historical. |
| `web`, `mobile`, `ios`, `android`, `cli`, `desktop` | Common pattern guess | Default IDs. |
| `dev-clientid`, `staging-`, `test-` | Dev/staging prefixes | Sibling apps. |
| Postman/Insomnia leaks | Public collections con tokens | OSINT. |
| `POST /register` si endpoint expuesto sin auth | Dynamic Registration | Jackpot. |
| OAuth-error message leak | Error responses reveal valid client_ids | Verbose errors. |
| `manifest.xml` reveals OAuth schemes | Mobile intent filters | Android. |
| `discovery_endpoint` per-tenant | Multi-tenant providers expose tenant client_ids | SaaS. |
^oauth-detect-clientid

### Dynamic Registration test (jackpot si abierto)

```bash
curl -X POST https://target/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "test-recon",
    "redirect_uris": ["https://attacker.com/cb"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid email profile"
  }'
# Si returns client_id/client_secret sin auth → critical misconfig
```

---

## Response Type & Scope Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `?response_type=code` / `token` / `id_token` cada uno | Response type fuzz | Cuáles acepta. |
| `?response_type=code id_token token` | Combined response types | Hybrid soportado? |
| `openid`, `profile`, `email`, `offline_access` | Scope brute común | Standard. |
| `admin`, `internal`, `*`, `read:internal`, `user.read` | Scope sensitive guess | App-specific. |
| Scope mass list | SecLists `oauth-scopes.txt` | Wordlist. |
| `read:users`, `write:admin`, `org:internal` | Custom scope formats | Guess by context. |
| `scope=*` wildcard | Some servers return all granted scopes | Greedy. |
| `prompt=none` silent grant | Si user logged in IdP → silent code | Combo CSRF. |
| `display=popup` | Popup mode | Combo `window.opener` postMessage. |
| `display=touch` | Mobile UX | App-specific. |
| `nonce=XYZ` | Para id_token replay defense | OIDC. |
| `acr_values` | Authentication Context Class | MFA forced. |
| `max_age=0` | Force re-auth | Defense. |
| `id_token_hint` | Pre-fill subject | Logout combo. |
| `request` JWT param | RFC 9101 — full request as JWT | Advanced. |
| `request_uri` JAR | Pull request from URI | SSRF combo. |
^oauth-detect-response

### Scope enum loop

```bash
KNOWN_CLIENT="abc123"
KNOWN_REDIRECT="https://known.com/cb"

for scope in openid profile email admin internal user.read offline_access write read:admin; do
  echo "=== $scope ==="
  curl -sI "https://target/oauth/authorize?client_id=$KNOWN_CLIENT&response_type=code&redirect_uri=$KNOWN_REDIRECT&scope=$scope&state=XYZ" \
    | grep -iE 'location|error'
done
```

---

## Redirect URI Validation Type

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `redirect_uri=https://known.com/cb/extra` → error | Exact match | Solo Open Redirect chain explota. |
| `redirect_uri=https://known.com/cb.attacker.com` → OK | Prefix match | Suffix abuse posible. |
| `redirect_uri=https://attacker.com/known.com/cb` → OK | Substring match | Substring smuggle. |
| `redirect_uri=https://known.com/anything` → OK | Hostname only (no path) | Path attacks. |
| `redirect_uri=https://anything.known.com/cb` → OK | Domain wildcard | Subdomain takeover combo. |
| `redirect_uri=javascript://known.com/...` → OK | Scheme flexible | Scheme abuse. |
| Multiple registered | Probar todos los registered URIs | Pick weakest. |
| `cb/` vs `cb` distinto | Trailing slash optional | Normalize bug. |
| `KNOWN.com` aceptado | Case insensitive | Normalize. |
| `https://known.com@attacker.com/cb` | Userinfo `@` accepted | Parser confusion. |
| `https://attacker.com#@known.com/cb` | Fragment `#@` trick | Parser confusion. |
| `https://kńown.com/cb` punycode | Unicode IDN | Homograph. |
| `?@` query trick | `https://known.com?@attacker.com/cb` | Parser confusion. |
| `\` backslash | `https://known.com\.attacker.com/cb` | Parser inconsistent. |
| `https:///attacker.com/cb` | Triple slash | Edge parser. |
| `http://127.0.0.1:PORT/cb` | Loopback flexibility | Public client allowed. |
^oauth-detect-redirect

### Test suite redirect_uri

```bash
KNOWN_CLIENT="abc123"

for uri in \
  "https://known.com/cb" \
  "https://known.com/cb/extra" \
  "https://known.com/cb?x=y" \
  "https://known.com.attacker.com/cb" \
  "https://attacker.com/known.com/cb" \
  "https://sub.known.com/cb" \
  "https://known.com@attacker.com/cb" \
  "https://attacker.com#@known.com/cb" \
  "https://known.com\\.attacker.com/cb" \
  "javascript://known.com/%0aalert(1)" \
  "data:text/html,test" \
  "https:///attacker.com/cb"; do
  ENC=$(printf '%s' "$uri" | jq -sRr @uri)
  CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    "https://target/oauth/authorize?client_id=$KNOWN_CLIENT&response_type=code&redirect_uri=$ENC&scope=email&state=XYZ")
  echo "$CODE  $uri"
done
```

---
