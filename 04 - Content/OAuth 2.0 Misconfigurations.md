---
aliases:
  - OAuth 2.0 Misconfigurations
  - OAuth Misconfig
  - OAuth Attacks
  - OIDC Attacks
  - OAuth Account Takeover
tags:
  - type/vulnerability
  - vuln/oauth
  - technique/credential-access
  - technique/account-takeover
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: CheatSheet
linked:
  - "[[OAuth 2.0 - redirect_uri Manipulation]]"
  - "[[OAuth 2.0 - State y CSRF]]"
  - "[[OAuth 2.0 - Code y Token Theft]]"
  - "[[OAuth 2.0 - Scope Consent y Flow Abuse]]"
  - "[[OAuth 2.0 - Tooling]]"
  - "[[Open Redirect]]"
  - "[[JWT Attacks]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[Subdomain Takeover]]"
  - "[[Burp Suite]]"
---
# OAuth 2.0 Misconfigurations

***

## Cheatsheet

### 🎯 redirect_uri Manipulation

````tabs
tab: **Open Redirect Encadenado**
![[OAuth 2.0 - redirect_uri Manipulation#^oauth-redirect-openredirect]]

tab: **Path Traversal / Suffix Abuse**
![[OAuth 2.0 - redirect_uri Manipulation#^oauth-redirect-pathtraversal]]

tab: **URL Parser Differential**
![[OAuth 2.0 - redirect_uri Manipulation#^oauth-redirect-parser]]

tab: **Subdomain Confusion / Takeover**
![[OAuth 2.0 - redirect_uri Manipulation#^oauth-redirect-subdomain]]

tab: **Scheme Abuse (`javascript:`, `data:`, custom)**
![[OAuth 2.0 - redirect_uri Manipulation#^oauth-redirect-scheme]]
````

### 🔗 State / CSRF / Login CSRF

````tabs
tab: **State Ausente**
![[OAuth 2.0 - State y CSRF#^oauth-state-absent]]

tab: **State Predecible / Reusable**
![[OAuth 2.0 - State y CSRF#^oauth-state-predictable]]

tab: **Account Binding Pre-Takeover**
![[OAuth 2.0 - State y CSRF#^oauth-state-binding]]

tab: **Pre-Account Takeover via Email**
![[OAuth 2.0 - State y CSRF#^oauth-state-pretakeover]]

tab: **Session Fixation via OAuth**
![[OAuth 2.0 - State y CSRF#^oauth-state-fixation]]
````

### 💉 Code & Token Theft

````tabs
tab: **Referer Header Leak**
![[OAuth 2.0 - Code y Token Theft#^oauth-theft-referer]]

tab: **postMessage / window.opener**
![[OAuth 2.0 - Code y Token Theft#^oauth-theft-postmessage]]

tab: **Code Reuse / Substitution**
![[OAuth 2.0 - Code y Token Theft#^oauth-theft-codereuse]]

tab: **Implicit Flow Token en Fragment**
![[OAuth 2.0 - Code y Token Theft#^oauth-theft-implicit]]

tab: **Mix-Up Attack (multi-IdP)**
![[OAuth 2.0 - Code y Token Theft#^oauth-theft-mixup]]
````

### 🔓 Scope, Consent & Flow Abuse

````tabs
tab: **Scope Upgrade / Silent Re-Consent**
![[OAuth 2.0 - Scope Consent y Flow Abuse#^oauth-abuse-scope]]

tab: **Dynamic Client Registration**
![[OAuth 2.0 - Scope Consent y Flow Abuse#^oauth-abuse-registration]]

tab: **Device Code Phishing**
![[OAuth 2.0 - Scope Consent y Flow Abuse#^oauth-abuse-devicephishing]]

tab: **PKCE Downgrade**
![[OAuth 2.0 - Scope Consent y Flow Abuse#^oauth-abuse-pkce]]

tab: **Implicit Flow Forced**
![[OAuth 2.0 - Scope Consent y Flow Abuse#^oauth-abuse-implicit]]
````

### 🛠️ Tooling

````tabs
tab: **Burp + EsPReSSO + Param Miner**
![[OAuth 2.0 - Tooling#^oauth-tool-burp]]

tab: **CLI (oauth-toolkit, oauthscan)**
![[OAuth 2.0 - Tooling#^oauth-tool-cli]]

tab: **JWT Tools (jwt_tool, hashcat)**
![[OAuth 2.0 - Tooling#^oauth-tool-jwt]]

tab: **Test Servers (Keycloak, Auth0, oauth.tools)**
![[OAuth 2.0 - Tooling#^oauth-tool-sandbox]]

tab: **Wordlists & Payload Repos**
![[OAuth 2.0 - Tooling#^oauth-tool-wordlists]]
````

___

## Overview

**OAuth 2.0 Misconfigurations** = vulnerabilidades de implementación en el flow de autorización delegada definido por RFC 6749. La spec sólida; las apps que la implementan suelen mal-configurar `redirect_uri` validation, `state` parameter, scope enforcement, o flow type — habilitando account takeover, code/token theft, y privilege escalation.

OAuth = framework, no protocol — cada provider implementa diferente. Los bugs viven en custom logic alrededor del flow, no en el flow en sí. Bug bounty programs pagan altísimo por OAuth chains (10-20k$ típico para ATO).

**OIDC** (OpenID Connect) = layer de autenticación encima de OAuth. Misma attack surface + JWT issues (id_token).

### Cuándo es alto impacto

| OAuth issue stand-alone | OAuth chain |
|---|---|
| Open redirect en redirect_uri (CVSS Medium) | Account takeover via code theft (CVSS Critical) |
| State ausente | Pre-account takeover (CVSS High) |
| Scope leak | Privilege escalation (CVSS High) |
| Implicit flow exposure | Token replay, persistent access |
| Dynamic registration open | Full provider compromise |
| PKCE no enforced | Mobile app code theft |

### Differencia con sesiones tradicionales

| | **Session-based auth** | **OAuth-based auth** |
|---|---|---|
| Credentials | Username/password | Token (delegated) |
| Trust boundary | App ↔ user | App ↔ IdP ↔ user |
| Attack surface | Login, session cookie | Authorize, token, redirect_uri, state, JWT |
| ATO vector | Credential stuffing, session theft | redirect_uri bypass, account binding, code theft |
| Recovery | Force logout, rotate cookie | Revoke client, rotate refresh tokens, audit linked accounts |

### Por qué OAuth bugs son tan comunes

- 4+ flows distintos (auth code / implicit / device / client credentials), each con sub-variants.
- Múltiples params críticos: redirect_uri, state, code, scope, response_type, prompt, nonce, code_challenge.
- IdP responsabilidades vs Client responsabilidades poco claras.
- PKCE opcional en muchos servers legacy.
- "Sign in with X" flows mezclan signup + login + account binding sin separación clara.

___

## Workflow de explotación

```
1. Discovery:
   - Identificar IdP via "Sign in with X" buttons
   - GET /.well-known/openid-configuration
   - GET /.well-known/oauth-authorization-server
   - Identify flow type (response_type, grant_type)
   - Enumerate client_id (frontend, mobile, GitHub dorks)

2. Capture full flow:
   - Burp Proxy → loggear authorize, callback, token exchange
   - Identificar params críticos: redirect_uri, state, scope

3. Test redirect_uri validation:
   - Exact / prefix / substring / wildcard?
   - Try open redirect chain en dominio whitelisted
   - Try parser differentials (@, #, \, etc)
   - Try subdomain takeover si wildcard
   - Try scheme abuse (javascript:, data:)

4. Test state:
   - Omit state → server lo emite/acepta?
   - Reuse state cross-session → bound to victim?
   - Cross-user state injection?

5. Test code/token theft:
   - Referer-Policy en /cb?
   - postMessage origin check?
   - PKCE enforced?
   - Code reusable?

6. Test scope/consent:
   - Silent re-consent con scope mayor?
   - Refresh con scope upgrade?
   - prompt=none acceptable?

7. Identify chain final:
   a. Account takeover via redirect_uri bypass + code steal.
   b. Pre-ATO via account binding (atacante's social → victim's account).
   c. Pre-ATO via email squatting + signup OAuth.
   d. Privilege escalation via scope upgrade.
   e. Cross-IdP mix-up attack.
   f. Device code phishing (TVs, IoT scenarios).

8. PoC + report:
   - Full flow capture
   - Step-by-step replication
   - Final state (logged as victim, escalated scope, etc.)
```

___

## Detección rápida

### Indicadores en código backend

```python
# Flask — VULN (redirect_uri sin exact match)
@app.route('/oauth/authorize')
def authorize():
    redirect_uri = request.args.get('redirect_uri')
    client = Client.find(request.args['client_id'])
    if redirect_uri.startswith(client.redirect_uri):  # ← prefix match (vuln)
        ...

# Flask — SAFE
if redirect_uri == client.redirect_uri:  # exact match
    ...
elif redirect_uri in client.allowed_redirect_uris:  # allowlist
    ...
else:
    abort(400, 'invalid redirect_uri')

# Flask — VULN (state no validado en callback)
@app.route('/oauth/callback')
def callback():
    code = request.args.get('code')
    user = exchange_code(code)
    login(user)  # ← sin state check

# Flask — SAFE
if request.args.get('state') != session.pop('oauth_state', None):
    abort(403, 'invalid state')
```

```javascript
// Node — VULN (PKCE opcional)
async function exchangeCode(code) {
  return fetch('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({ grant_type: 'authorization_code', code })
    // ← falta code_verifier
  });
}

// Node — SAFE (PKCE)
const verifier = sessionStorage.getItem('pkce_verifier');
return fetch('/oauth/token', {
  method: 'POST',
  body: JSON.stringify({ grant_type: 'authorization_code', code, code_verifier: verifier })
});
```

### Probes mínimos

```bash
# 1. Discovery
curl -s https://target/.well-known/openid-configuration | jq .

# 2. redirect_uri validation type
for uri in \
  "https://known.com/cb" \
  "https://known.com.attacker.com/cb" \
  "https://known.com@attacker.com/cb" \
  "javascript:alert(1)" \
  "https://known.com/cb/../../atacante"; do
  ENC=$(printf '%s' "$uri" | jq -sRr @uri)
  CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=$ENC&scope=email&state=ABC")
  echo "$CODE  $uri"
done

# 3. State requerido?
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb"
# ← sin state

# 4. PKCE enforced?
# Inicia con code_challenge → captura code → exchange sin code_verifier
curl -X POST https://target/oauth/token \
  -d "grant_type=authorization_code&code=$CODE&redirect_uri=https://known.com/cb&client_id=APP"

# 5. Dynamic registration?
curl -X POST https://target/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{"client_name":"test","redirect_uris":["https://attacker.com/cb"]}'
```

___

## Impacto

- **Account takeover (ATO)** — code theft via redirect_uri bypass = full account access.
- **Pre-account takeover** — atacante crea cuenta usando email víctima antes que víctima se registre.
- **Account binding** — atacante's social account linkeada a victim's account = persistent backdoor.
- **Privilege escalation via scope** — silent re-consent escala a admin scope.
- **Cross-app ATO** — mix-up attack entre múltiples IdPs.
- **Token leak via Referer** — third-party analytics ve credentials.
- **Persistent access via refresh tokens** — refresh sin rotation = permanent access.
- **MFA bypass** — OAuth flow puede skip MFA si IdP no enforces.
- **Device code phishing** — víctima auth atacante's device.
- **Dynamic registration abuse** — atacante registra client malicioso → todo trivial.
- **Mobile app token theft** — implicit + custom scheme + intent picker.

___

## Mitigación (defender)

- **redirect_uri exact match** — pre-registered allowlist, no patterns:
  ```python
  if redirect_uri not in client.registered_uris:
      abort(400)
  ```
- **State obligatorio**, random ≥256 bits, bound to session:
  ```python
  state = secrets.token_urlsafe(32)
  session['oauth_state'] = state
  # callback:
  if request.args['state'] != session.pop('oauth_state', None):
      abort(403)
  ```
- **PKCE obligatorio** para todos los flows (RFC 9700, OAuth 2.1):
  - `code_challenge_method=S256` only.
  - Reject `plain` excepto legacy public clients.
- **Authorization Code flow only** — deprecated implicit, password, hybrid donde posible.
- **`Referrer-Policy: no-referrer`** en callback page para prevent code leak.
- **`Cross-Origin-Opener-Policy: same-origin`** en callback para popup attacks.
- **postMessage origin check** strict (`!== '*'`).
- **Validate `iss` parameter** (RFC 9207) en authorization response — prevent mix-up.
- **Validate `email_verified=true`** en signup OAuth — prevent pre-ATO.
- **Confirmation step** en account binding — mostrar provider's email antes de bind.
- **Scope minimo** — request solo lo necesario, never silent escalate.
- **Refresh token rotation** + family detection — revoke entire family on reuse.
- **Dynamic Client Registration con auth** — initial access token, software statement validation.
- **Short device_code TTL** + clear app name display — prevent device phishing.
- **id_token validation completa** (OIDC):
  - `iss`, `aud`, `exp`, `iat`, `nonce` checks.
  - Verify signature con JWKS.
  - Reject `alg=none`.
- **Audit linked accounts** + alertas user-facing on new bind.

___

## Para entender OAuth 2.0 Misconfigurations

**Por qué OAuth es tan complejo:**

OAuth 2.0 es un framework, no un protocol. RFC 6749 define las pieces (authorize, token, redirect_uri, scope, state) pero deja decisiones críticas al implementer: qué flow usar, cómo validar redirect_uri, si PKCE es opcional, qué scopes existen. Cada provider (Google, Facebook, GitHub, custom) tiene su propio twist. La complejidad acumulada genera attack surface.

**Por qué redirect_uri es el target #1:**

`redirect_uri` controla a dónde el IdP envía el `code`. Si atacante puede manipular este destino, recibe credentials directamente sin necesidad de comprometer el IdP ni el cliente. Múltiples vectors: open redirect chain, parser differential, subdomain takeover, scheme abuse, path traversal. Cada implementación valida diferente — atacante busca la implementación más débil.

**Por qué state se omite tan seguido:**

State es CSRF token de OAuth. Equivalente al `csrf_token` de forms tradicionales. Pero en OAuth muchos devs lo ven como "opcional" o lo confunden con `nonce` (similar pero diferente propósito — nonce previene replay de id_token, state previene CSRF en authorization request). State omitido = login CSRF + account binding + pre-ATO.

**Por qué PKCE matters:**

Originalmente PKCE se diseñó para mobile apps (public clients sin client_secret). Atacante intercepta el code en custom URL scheme intent → sin PKCE, exchanges el code → access_token. PKCE bindea verifier al code → sin verifier, exchange falla. Hoy PKCE es recomendado para TODOS los clients (incluyendo confidential), porque defiende contra code theft cualquiera sea el vector.

**Por qué account binding es underestimated:**

OAuth permite "Sign in with Google" + email/password coexistiendo. Si atacante puede bindear su Google a victim's account (login CSRF + bind endpoint sin state), atacante después loguea como victim usando "Sign in with Google" → trae su Google credentials → bypass password de víctima.

**Pre-account takeover:**

Atacante crea cuenta con email víctima en service usando OAuth (Google que no verificó email víctima realmente). Cuando víctima intenta signup, ya existe cuenta. Si service merge automático con email match, víctima entra a cuenta atacante. Servicios famosos vulnerables: Booking, Zoom históricos.

**OIDC vs OAuth puro:**

OIDC añade `id_token` (JWT) + userinfo endpoint. JWT introduces JWT-specific bugs: alg=none, HMAC confusion, missing claims validation. Plus OIDC-specific: nonce vs state, issuer validation, audience claim, jwks rotation. Apps OIDC heredan TODA la attack surface OAuth + JWT issues.

___

## Recursos

- [PortSwigger - OAuth 2.0 Authentication](https://portswigger.net/web-security/oauth) — knowledge base + 5 labs gratuitos.
- [HackTricks - OAuth to Account Takeover](https://book.hacktricks.xyz/pentesting-web/oauth-to-account-takeover) — referencia exhaustiva.
- [PayloadsAllTheThings - OAuth Misconfiguration](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/OAuth%20Misconfiguration) — payloads.
- [OWASP - OAuth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html) — defense.
- [RFC 6749 - OAuth 2.0 Framework](https://datatracker.ietf.org/doc/html/rfc6749) — base spec.
- [RFC 6819 - OAuth 2.0 Threat Model](https://datatracker.ietf.org/doc/html/rfc6819) — security considerations completas.
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636) — proof key for code exchange.
- [RFC 9207 - OAuth 2.0 Authorization Server Issuer Identification](https://datatracker.ietf.org/doc/html/rfc9207) — mix-up defense.
- [RFC 9700 - Best Current Practice for OAuth 2.0 Security](https://datatracker.ietf.org/doc/html/rfc9700) — modern recommendations (2025).
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1) — consolidated security profile.
- [Aaron Parecki - OAuth 2.0 Simplified](https://aaronparecki.com/oauth-2-simplified/) — practical guide.
- [Daniel Fett - OAuth Security Best Practices](https://danielfett.de/) — academic deep dives.
- [Orange Tsai - URL Parser SSRF Paper](https://www.blackhat.com/docs/us-17/thursday/us-17-Tsai-A-New-Era-Of-SSRF-Exploiting-URL-Parser-In-Trending-Programming-Languages.pdf) — parser tricks (aplicable a redirect_uri).

***
