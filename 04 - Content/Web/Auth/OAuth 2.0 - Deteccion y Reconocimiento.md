---
aliases:
  - OAuth Detection
  - OAuth Recon
  - .well-known Discovery
  - Client ID Enum
tags:
  - type/technique
  - vuln/oauth
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[OAuth 2.0 Misconfigurations]]'
  - '[[Burp Suite]]'
---
# OAuth 2.0 - Detección y Reconocimiento

***

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

___

## Identificación de Flow Type

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Authorization Code | `response_type=code` | Web apps confidential — most secure. |
| Auth Code + PKCE | `response_type=code` + `code_challenge=...` | SPA/mobile recommended. |
| Implicit | `response_type=token` o `id_token` | Legacy SPA — deprecated 2020. |
| Hybrid | `response_type=code id_token` | OIDC complejo. |
| Client Credentials | `grant_type=client_credentials` | M2M — no user. |
| Resource Owner Password | `grant_type=password` | Legacy — credential exposure. |
| Device Authorization | `grant_type=urn:ietf:params:oauth:grant-type:device_code` | TVs/IoT. |
| Refresh Token | `grant_type=refresh_token` | Long sessions. |
| JWT Bearer | `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` | RFC 7523. |
| SAML Bearer | `grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer` | Enterprise. |
| Token Exchange | `grant_type=urn:ietf:params:oauth:grant-type:token-exchange` | RFC 8693. |
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

___

## Client ID Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Frontend JS recon | `curl -s https://target \| grep -oE 'client_id["\s]*[:=]["\s]*[a-zA-Z0-9-]+'` | Hardcoded common. |
| JS bundle dump | `wget -r https://target/static/js/ && grep -r 'client_id' .` | Bundles. |
| Source maps | `*.js.map` files reveal originals | Webpack default. |
| Mobile APK decompile | `apktool d app.apk && grep -r 'client_id' .` | Android. |
| Mobile IPA strings | `unzip app.ipa && strings Payload/*.app/* \| grep -i client` | iOS. |
| GitHub dorks | `"client_id" "victim.com" site:github.com` | Leaked configs. |
| GitLab/Bitbucket dorks | Similar dorks | Adjacent. |
| Wayback Machine | `web.archive.org/web/*/target/oauth*` | Historical. |
| Common pattern guess | `web`, `mobile`, `ios`, `android`, `cli`, `desktop` | Default IDs. |
| Dev/staging prefixes | `dev-clientid`, `staging-`, `test-` | Sibling apps. |
| Postman/Insomnia leaks | Public collections con tokens | OSINT. |
| Dynamic Registration | `POST /register` si endpoint expuesto sin auth | Jackpot. |
| OAuth-error message leak | Error responses reveal valid client_ids | Verbose errors. |
| Mobile intent filters | `manifest.xml` reveals OAuth schemes | Android. |
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

___

## Response Type & Scope Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Response type fuzz | `?response_type=code` / `token` / `id_token` cada uno | Cuáles acepta. |
| Combined response types | `?response_type=code id_token token` | Hybrid soportado? |
| Scope brute común | `openid`, `profile`, `email`, `offline_access` | Standard. |
| Scope sensitive guess | `admin`, `internal`, `*`, `read:internal`, `user.read` | App-specific. |
| Scope mass list | SecLists `oauth-scopes.txt` | Wordlist. |
| Custom scope formats | `read:users`, `write:admin`, `org:internal` | Guess by context. |
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

___

## Redirect URI Validation Type

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Exact match | `redirect_uri=https://known.com/cb/extra` → error | Solo Open Redirect chain explota. |
| Prefix match | `redirect_uri=https://known.com/cb.attacker.com` → OK | Suffix abuse posible. |
| Substring match | `redirect_uri=https://attacker.com/known.com/cb` → OK | Substring smuggle. |
| Hostname only (no path) | `redirect_uri=https://known.com/anything` → OK | Path attacks. |
| Domain wildcard | `redirect_uri=https://anything.known.com/cb` → OK | Subdomain takeover combo. |
| Scheme flexible | `redirect_uri=javascript://known.com/...` → OK | Scheme abuse. |
| Multiple registered | Probar todos los registered URIs | Pick weakest. |
| Trailing slash optional | `cb/` vs `cb` distinto | Normalize bug. |
| Case insensitive | `KNOWN.com` aceptado | Normalize. |
| Userinfo `@` accepted | `https://known.com@attacker.com/cb` | Parser confusion. |
| Fragment `#@` trick | `https://attacker.com#@known.com/cb` | Parser confusion. |
| Unicode IDN | `https://kńown.com/cb` punycode | Homograph. |
| `?@` query trick | `https://known.com?@attacker.com/cb` | Parser confusion. |
| `\` backslash | `https://known.com\.attacker.com/cb` | Parser inconsistent. |
| Triple slash | `https:///attacker.com/cb` | Edge parser. |
| Loopback flexibility | `http://127.0.0.1:PORT/cb` | Public client allowed. |
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

***
