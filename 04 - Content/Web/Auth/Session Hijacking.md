---
aliases:
  - "Cookies"
  - "Manipulación de Cookies"
  - "Cookie Tampering"
  - Session Hijacking
  - Cookie Hijacking
  - Token Theft
  - Session Stealing
tags:
  - vuln/session-hijacking
  - vuln/auth-bypass
  - technique/credential-access
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[Session Hijacking - Vectores de Robo]]"
  - "[[Session Hijacking - Cookie Tampering y Forging]]"
  - "[[Session Hijacking - Fixation y Replay]]"
  - "[[Session Hijacking - Cross-Origin y Cross-Subdomain]]"
  - "[[Session Hijacking - Tooling]]"
  - "[[Authentication & Authorization Bypass]]"
  - "[[JWT Attacks]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[Subdomain Takeover]]"
  - "[[Burp Suite]]"
---
# Session Hijacking

***

## Cheatsheet

### 🎯 Vectores de Robo

````tabs
tab: **XSS para `document.cookie`**
![[Session Hijacking - Vectores de Robo#^sh-vector-xss]]

tab: **MITM (HTTP / Weak TLS)**
![[Session Hijacking - Vectores de Robo#^sh-vector-mitm]]

tab: **Network Sniffing (LAN / Shared)**
![[Session Hijacking - Vectores de Robo#^sh-vector-sniffing]]

tab: **Browser Exploit / Extension Abuse**
![[Session Hijacking - Vectores de Robo#^sh-vector-browser]]

tab: **Cookie Theft via Local JS**
![[Session Hijacking - Vectores de Robo#^sh-vector-localjs]]
````

### 🔓 Cookie Tampering y Forging

````tabs
tab: **Predictable Session IDs**
![[Session Hijacking - Cookie Tampering y Forging#^sh-tamper-predictable]]

tab: **Weak HMAC / Signed Cookies**
![[Session Hijacking - Cookie Tampering y Forging#^sh-tamper-weak-hmac]]

tab: **JWT Manipulation**
![[Session Hijacking - Cookie Tampering y Forging#^sh-tamper-jwt]]

tab: **Cookie Tossing (Sub Overrides Parent)**
![[Session Hijacking - Cookie Tampering y Forging#^sh-tamper-tossing]]

tab: **HttpOnly Bypass Tricks**
![[Session Hijacking - Cookie Tampering y Forging#^sh-tamper-httponly-bypass]]
````

### 🪤 Fixation y Replay

````tabs
tab: **Set Victim's Session ID Pre-Auth**
![[Session Hijacking - Fixation y Replay#^sh-fixation-preauth]]

tab: **Replay Captured Tokens**
![[Session Hijacking - Fixation y Replay#^sh-fixation-replay]]

tab: **Long-lived Sessions / Tokens**
![[Session Hijacking - Fixation y Replay#^sh-fixation-longlived]]

tab: **Concurrent Session Abuse**
![[Session Hijacking - Fixation y Replay#^sh-fixation-concurrent]]

tab: **Refresh Token Replay**
![[Session Hijacking - Fixation y Replay#^sh-fixation-refresh]]
````

### 🌐 Cross-Origin y Cross-Subdomain

````tabs
tab: **Same-Origin Policy (SOP) Bypass**
![[Session Hijacking - Cross-Origin y Cross-Subdomain#^sh-cross-sop]]

tab: **Subdomain Takeover Combo**
![[Session Hijacking - Cross-Origin y Cross-Subdomain#^sh-cross-subdomain-takeover]]

tab: **postMessage Handler Abuse**
![[Session Hijacking - Cross-Origin y Cross-Subdomain#^sh-cross-postmessage]]

tab: **CORS Misconfig Credential Leak**
![[Session Hijacking - Cross-Origin y Cross-Subdomain#^sh-cross-cors]]

tab: **WebSocket Hijacking (CSWSH)**
![[Session Hijacking - Cross-Origin y Cross-Subdomain#^sh-cross-websocket]]
````

### 🛠️ Tooling

````tabs
tab: **Burp Session Handling Rules**
![[Session Hijacking - Tooling#^sh-tool-burp]]

tab: **mitmproxy / Wireshark**
![[Session Hijacking - Tooling#^sh-tool-mitm]]

tab: **Custom JS Exfil Payloads**
![[Session Hijacking - Tooling#^sh-tool-jspayload]]

tab: **cookie-monster / Cookieless**
![[Session Hijacking - Tooling#^sh-tool-cookie-monster]]

tab: **Hashcat para Signed Cookies**
![[Session Hijacking - Tooling#^sh-tool-hashcat]]
````

___

## Overview

**Session Hijacking** = atacante toma control de la sesión authenticated de victim sin necesitar credenciales. Vector resultante = full account takeover hasta que sesión expire / sea invalidada. Combina con virtually cualquier vector web (XSS, MITM, Subdomain Takeover, CSWSH, etc.).

OWASP Top 10 — A01:2021 Broken Access Control + A07:2021 Identification and Authentication Failures. Vector clase A — frecuentemente result final de chains complejos (XSS → cookie steal, HHI + reset → session ATO).

### Diferencia con vulns relacionadas

| | **Session Hijacking** | **Auth Bypass** | **CSRF** |
|---|---|---|---|
| Vector | Steal/forge existing session | Login bypass / privesc | Force action en victim browser |
| Atacante actions | As victim user | As victim user | Limited (no session read) |
| Necesita victim | Victim must be logged in | NO | YES (logged in) |
| Persistence | Until logout / expire | Permanent (own creds) | Per-request |
| Common chain | XSS → steal | Direct exploit | Cookie + cross-site |

### Tipos de session storage

| Type | Storage | Vulnerability surface |
|---|---|---|
| **HTTPOnly cookie** | Browser | XSS (indirect via fetch), MITM, network |
| **Non-HttpOnly cookie** | Browser, JS-readable | XSS direct, all of above |
| **localStorage / sessionStorage** | Browser, JS-readable | XSS direct, no MITM (HTTPS), no inherent expiry |
| **IndexedDB** | Browser, JS-readable | XSS direct |
| **Memory (variables)** | JS runtime | XSS direct, lost on reload |
| **Server-side (opaque ID)** | Backend store | Predictable IDs, replay |
| **JWT (stateless)** | Token-based | JWT bypasses, cracking |

___

## Workflow de explotación

```
1. Identificar mecanismo de session:
   - Cookies (PHPSESSID, JSESSIONID, etc)
   - JWT en header / cookie / localStorage
   - Custom auth tokens

2. Analizar attributes:
   - HttpOnly, Secure, SameSite, Domain, Path
   - Max-Age / Expires
   - Signed? Encrypted?

3. Mapear lifecycle:
   - Session regenerated post-login?
   - Logout invalidates session?
   - Long-lived "remember me"?

4. Decidir vector:
   a. XSS para cookie steal (si no HttpOnly)
   b. XSS para fetch authenticated requests (HttpOnly bypass via response)
   c. MITM si HTTP plaintext
   d. Predictable IDs si pattern visible
   e. Crack signed cookie si HMAC weak
   f. Session fixation si SID no regenerado post-auth
   g. Cross-subdomain via takeover
   h. CSWSH para WebSocket-based session

5. Capture / forge cookie

6. Replay en atacante's browser:
   - Set cookie via DevTools
   - Use Burp Repeater con stolen cookie
   - Hydrate browser profile

7. Action as victim:
   - Read sensitive data
   - Trigger sensitive actions
   - Establish persistencia (API key, etc)

8. Cleanup considerations:
   - Audit log evasion
   - Don't trigger MFA re-auth
   - Stay under rate limit thresholds
```

___

## Detección rápida

### Indicadores en código backend

```python
# Python (Flask) — VULN
from flask import session
@app.route('/login', methods=['POST'])
def login():
    if check_password(...):
        session['user_id'] = user.id
        # ← BAD: session ID NOT regenerated
        return redirect('/dashboard')

# Python — SAFE
@app.route('/login', methods=['POST'])
def login():
    if check_password(...):
        session.clear()  # ← Regenerate
        session['user_id'] = user.id
        # Flask creates new session ID automatically after clear
        return redirect('/dashboard')
```

```javascript
// Express — VULN (cookie sin HttpOnly)
app.use(session({
    secret: 'change-me',  // ← weak secret
    cookie: {}            // ← no HttpOnly, no Secure
}));

// Express — SAFE
app.use(session({
    secret: process.env.SESSION_SECRET,  // strong, unique
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000  // 15 min
    },
    rolling: true,  // refresh on each request
    resave: false,
    saveUninitialized: false
}));
```

### Probes mínimos

```bash
# 1. Inspect cookie attributes
curl -sI -X POST -d 'user=x&pass=y' https://target/login \
  | grep -i set-cookie

# 2. Test session fixation
COOKIE_PRE=$(curl -sI https://target/ | grep -oE 'session=[^;]+')
COOKIE_POST=$(curl -sI -b "$COOKIE_PRE" -X POST -d 'user=x&pass=y' https://target/login | grep -oE 'session=[^;]+')
[ "$COOKIE_PRE" == "$COOKIE_POST" ] && echo "[!] Session fixation possible"

# 3. Test post-logout reuse
curl -X POST -b "$COOKIE_POST" https://target/logout
curl -b "$COOKIE_POST" https://target/dashboard | grep -q 'Welcome' && \
    echo "[!] Logout doesn't invalidate session"

# 4. Cookie Sequencer in Burp → check entropy

# 5. JWT decode if applicable
echo "$JWT" | python3 -c "import jwt; print(jwt.decode(input(), options={'verify_signature':False}))"
```

___

## Impacto

- **Account takeover** — atacante = victim, full session control.
- **Privilege escalation** — if victim is admin, atacante = admin.
- **Data breach** — read victim's private data.
- **Financial fraud** — actions as victim (transfer, purchase).
- **Persistence** — long-lived sessions = persistent access.
- **Lateral movement** — internal app session steal.
- **Compliance violation** — session security failure.
- **Reputation damage** — visible breach indicators.
- **Combine con XSS** — typical chain, multiplies impact.
- **Combine con Subdomain Takeover** — cross-sub session theft.

___

## Mitigación (defender)

- **HttpOnly + Secure + SameSite=Strict cookies**:
  ```
  Set-Cookie: session=ABC; HttpOnly; Secure; SameSite=Strict; Path=/
  ```
- **Cryptographically random session IDs** — ≥16 bytes random.
- **Regenerate session ID post-login** — kill old, create new.
- **Server-side session invalidation on logout** — not just client cookie clear.
- **Idle timeout** — invalidate after N minutes inactive.
- **Absolute timeout** — max session duration (e.g. 24h).
- **Rolling renewal** — refresh expiry on activity.
- **Strong session signing** — HMAC con random ≥32-byte secret.
- **Rotate signing secrets periodically** — limited window.
- **Token rotation per request (CSRF token + session)** — defense in depth.
- **Multi-factor for sensitive actions** — re-auth required.
- **Device fingerprinting** — alert on suspicious change.
- **Geo-IP anomaly detection** — same session from far locations.
- **`__Host-` cookie prefix** — strongest cookie scope.
- **HSTS** — force HTTPS, prevent MITM downgrade.
- **CSP** — defense against XSS-based theft.
- **Audit log + monitoring** — failed logins, anomalous patterns.
- **Bind session to user-agent / IP fragments** — partial fingerprint.
- **For JWT**: short-lived access tokens + secure refresh + JTI revocation.
- **Concurrent session limit** — one device per user (UX trade-off).
- **Logout other devices** — feature for users.

___

## Para entender Session Hijacking

**Por qué session existe:**

HTTP es stateless — each request independent. Para mantener auth state across requests, server emits "session token" después del login. Token es presentado en cada subsequent request como prueba de auth. Common forms:
- Cookie con session ID (server lookup state).
- JWT (stateless, self-validating).
- Bearer token in Authorization header.

Cualquier captura/forge de este token = atacante "es" victim.

**Por qué HttpOnly no es bala de plata:**

HttpOnly previene `document.cookie` read via JS. Pero:
1. XSS aún puede hacer `fetch` con credentials → reads response data (no cookie itself).
2. MITM con plaintext HTTP captures cookie regardless de HttpOnly.
3. Network sniff captures even HTTPS si TLS broken.
4. Server bug (XST historic) leaks via TRACE.
5. Subdomain takeover bypasses domain isolation.

HttpOnly es one layer en defense in depth, not silver bullet.

**Diferencia entre fixation y theft:**

- **Fixation**: atacante PRE-SETS victim's session ID. After victim logs in, atacante uses preset ID.
- **Theft**: atacante CAPTURES victim's existing session ID después del login.

Both result en atacante con valid session — but mechanism distinct. Defense for fixation = regenerate SID post-login. Defense for theft = HttpOnly + Secure + careful XSS prevention.

**Por qué Subdomain Takeover lo agrava:**

Subdomain Takeover allows atacante to:
1. Set cookies con `Domain=.target.com` (cross-subdomain scope).
2. Read non-HttpOnly cookies en parent domain (cross-subdomain trust).
3. Establish OAuth `redirect_uri` trust chain.
4. CORS abuse with credentials.

= Permanent persistent session hijacking infrastructure.

___

## Recursos

- [OWASP Top 10 - A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) — overview.
- [OWASP Session Management Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — defense.
- [OWASP - Session Hijacking](https://owasp.org/www-community/attacks/Session_hijacking_attack) — overview.
- [PortSwigger - Authentication](https://portswigger.net/web-security/authentication) — labs.
- [PayloadsAllTheThings - Session](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Account%20Takeover) — payloads.
- [HackTricks - Session Hijacking](https://book.hacktricks.xyz/pentesting-web/login-bypass) — referencia.
- [cookie-monster](https://github.com/iangcarroll/cookiemonster) — signed cookie cracker.
- [XSS Hunter](https://github.com/mandatoryprogrammer/xsshunter-express) — capture victim cookies.
- [BeEF (Browser Exploitation Framework)](https://beefproject.com/) — persistent browser hook.
- [Cross-Site WebSocket Hijacking - Christian Schneider](http://www.christian-schneider.net/CrossSiteWebSocketHijacking.html) — CSWSH paper.
- [RFC 6265 - HTTP State Management](https://datatracker.ietf.org/doc/html/rfc6265) — Cookie spec.
- [RFC 6265bis - SameSite](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis) — modern.

***
