---
aliases:
  - Auth Bypass
  - Authentication Bypass
  - Authorization Bypass
  - BFLA / BOLA
tags:
  - vuln/auth-bypass
  - technique/initial-access
  - technique/credential-access
  - technique/privilege-escalation
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
  - "[[Auth Bypass - Deteccion y Reconocimiento]]"
  - "[[Auth Bypass - Bypass de Autenticacion]]"
  - "[[Auth Bypass - Bypass de Autorizacion]]"
  - "[[Auth Bypass - Tokens y Sessions]]"
  - "[[Auth Bypass - Flow Logic Flaws]]"
  - "[[Auth Bypass - Brute Force y Credential Stuffing]]"
  - "[[JWT Attacks]]"
  - "[[BOLA - IDOR]]"
  - "[[Mass Assignment]]"
  - "[[Race Conditions]]"
  - "[[Host Header Injection]]"
  - "[[hashcat]]"
  - "[[Hydra]]"
  - "[[ffuf]]"
  - "[[Burp Suite]]"
---
# Authentication & Authorization Bypass

---

## Cheatsheet

### 🔓 Bypass de Autenticación (login)

````tabs
tab: **Default Credentials**
![[Auth Bypass - Bypass de Autenticacion#^auth-bypass-defaults]]

tab: **SQL Injection en Login**
![[Auth Bypass - Bypass de Autenticacion#^auth-bypass-sqli]]

tab: **HTTP Verb Tampering**
![[Auth Bypass - Bypass de Autenticacion#^auth-bypass-verb]]

tab: **Header Spoofing**
![[Auth Bypass - Bypass de Autenticacion#^auth-bypass-headers]]

tab: **Forced Browsing**
![[Auth Bypass - Bypass de Autenticacion#^auth-bypass-forced]]

tab: **Truncation Attack**
![[Auth Bypass - Bypass de Autenticacion#^auth-bypass-truncation]]
````

### 🛡️ Bypass de Autorización (post-auth)

````tabs
tab: **IDOR / BOLA (Object-Level)**
![[Auth Bypass - Bypass de Autorizacion#^auth-authz-idor]]

tab: **Mass Assignment (Field-Level)**
![[Auth Bypass - Bypass de Autorizacion#^auth-authz-mass-assign]]

tab: **Path-Based Privesc**
![[Auth Bypass - Bypass de Autorizacion#^auth-authz-path]]

tab: **Role Manipulation**
![[Auth Bypass - Bypass de Autorizacion#^auth-authz-role]]

tab: **Verb-Based Authorization Gaps (BFLA)**
![[Auth Bypass - Bypass de Autorizacion#^auth-authz-bfla]]
````

### 🎟️ Tokens y Sessions

````tabs
tab: **JWT Bypass (Quick Reference)**
![[Auth Bypass - Tokens y Sessions#^auth-tokens-jwt]]

tab: **Session Fixation**
![[Auth Bypass - Tokens y Sessions#^auth-tokens-fixation]]

tab: **Predictable Tokens**
![[Auth Bypass - Tokens y Sessions#^auth-tokens-predictable]]

tab: **Cookie Tampering**
![[Auth Bypass - Tokens y Sessions#^auth-tokens-cookie]]

tab: **OAuth `redirect_uri` Manipulation**
![[Auth Bypass - Tokens y Sessions#^auth-tokens-oauth]]
````

### 🌀 Flow Logic Flaws

````tabs
tab: **Password Reset Bypass / Token Leak**
![[Auth Bypass - Flow Logic Flaws#^auth-flow-reset]]

tab: **2FA Bypass**
![[Auth Bypass - Flow Logic Flaws#^auth-flow-2fa]]

tab: **Magic Link Reuse / Tampering**
![[Auth Bypass - Flow Logic Flaws#^auth-flow-magic]]

tab: **Email Confirmation Bypass**
![[Auth Bypass - Flow Logic Flaws#^auth-flow-email-confirm]]

tab: **OAuth State / Nonce Missing**
![[Auth Bypass - Flow Logic Flaws#^auth-flow-oauth-state]]

tab: **Race Conditions en Auth**
![[Auth Bypass - Flow Logic Flaws#^auth-flow-race]]
````

### 💪 Brute Force y Credential Stuffing

````tabs
tab: **Default Credential Wordlists**
![[Auth Bypass - Brute Force y Credential Stuffing#^auth-brute-defaults]]

tab: **Password Spraying**
![[Auth Bypass - Brute Force y Credential Stuffing#^auth-brute-spraying]]

tab: **Username Enum + Targeted Brute**
![[Auth Bypass - Brute Force y Credential Stuffing#^auth-brute-targeted]]

tab: **Offline Crack (Hashcat / John)**
![[Auth Bypass - Brute Force y Credential Stuffing#^auth-brute-hashcat]]

tab: **Online (Hydra / Medusa / CME)**
![[Auth Bypass - Brute Force y Credential Stuffing#^auth-brute-online]]

tab: **Bypass Rate Limiting / Lockout**
![[Auth Bypass - Brute Force y Credential Stuffing#^auth-brute-bypass]]
````

---

## Overview

**Authentication & Authorization Bypass** = familia de vulnerabilidades que permiten al atacante (a) **autenticarse como otro usuario** sin credenciales válidas o (b) **acceder a recursos / acciones no autorizadas** post-login. Combinable con virtually cualquier vector web — frequently chained con SQLi, HHI, IDOR, JWT, race conditions, mass assignment.

OWASP Top 10 — A01 (2021) Broken Access Control. OWASP API Top 10 — API1 (BOLA), API2 (Authentication), API4 (BFLA), API5 (BOLA at function-level).

### Diferencia Auth vs Authz

| | **Authentication** | **Authorization** |
|---|---|---|
| Pregunta | "Quién sos?" | "Qué podés hacer?" |
| Mecanismo | Credentials, tokens, sessions | RBAC, ACL, ownership checks |
| Bypass focus | Login bypass, token forgery | Privesc, IDOR, mass assign |
| OWASP API | API2 (Broken Authentication) | API1 BOLA, API4 BFLA |
| Common bug | Default creds, SQLi login | IDOR, role tampering |

Auth fails → atacante = different user. Authz fails → atacante = same user con escalated privilege.

### Diferencia con vulns relacionadas

| | **Auth Bypass** | **CSRF** | **XSS** |
|---|---|---|---|
| Quién acción | Atacante posing as user | Victim browser forced | Atacante's script en víctima |
| Vector | Login flow / token / session | Cross-site request | Reflected / stored input |
| Necesita victim | NO (atacante actúa solo) | SÍ (logged-in victim) | SÍ (victim renders payload) |
| Defense | Strong auth + token validation | CSRF token + SameSite | Output encode + CSP |

---

## Workflow de explotación

```
1. Reconocimiento:
   - Map all auth/authz endpoints
   - Identify user enumeration vectors
   - Map multi-step flows (reset, 2FA, OAuth)

2. Quick wins (5-min ROI):
   - Default credentials (admin:admin)
   - SQLi en login (' OR 1=1 --)
   - Forced browsing (/admin direct)
   - Header spoofing (X-Forwarded-For: 127.0.0.1)

3. Token analysis:
   - JWT decode → check alg, kid, claims
   - Cookie inspection → tampering possible?
   - Predict patterns → UUID v1, sequential IDs

4. Flow logic flaws:
   - Password reset poisoning (HHI chain)
   - 2FA bypass via empty / replay / race
   - OAuth redirect_uri manipulation
   - Email confirmation skip

5. Authorization (post-auth):
   - IDOR sequential IDs
   - Mass Assignment (isAdmin: true)
   - Path-based privesc (/admin)
   - Role manipulation en JWT/cookie

6. Brute force (last resort):
   - Password spraying (1 pass, many users)
   - Targeted brute con username enum
   - Bypass rate limit (HTTP/2 race, IP spoof)
   - Offline crack (hashcat) si hashes obtenidos
```

---

## Detección rápida

### Recon activo

![[Auth Bypass - Deteccion y Reconocimiento#^auth-detect-endpoints]]

![[Auth Bypass - Deteccion y Reconocimiento#^auth-detect-enum]]

![[Auth Bypass - Deteccion y Reconocimiento#^auth-detect-flow]]


### Indicadores en código backend

```python
# Python — VULN (no rate limit)
@app.route('/login', methods=['POST'])
def login():
    if check_password(request.form['user'], request.form['pass']):
        session['user'] = request.form['user']
        return redirect('/dashboard')
    return 'Invalid', 401

# Python — SAFE (rate limit + lockout)
@app.route('/login', methods=['POST'])
@rate_limit('5 per 15 minutes')
def login():
    user = request.form['user']
    if get_lockout(user):
        return 'Account locked', 403
    if check_password(user, request.form['pass']):
        increment_success(user)
        session['user'] = user
        return redirect('/dashboard')
    increment_failure(user)
    return 'Invalid credentials', 401  # Generic
```

```javascript
// Node.js — VULN (forced browsing)
app.get('/admin', (req, res) => {
    res.sendFile('admin.html');  // ← No auth check!
});

// Node.js — SAFE
app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile('admin.html');
});

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    next();
}
```

### Probes mínimos

```bash
# 1. Username enumeration via timing
for u in admin alice bob john; do
  T=$(curl -s -o /dev/null -w '%{time_total}' \
       -X POST -d "username=$u&password=wrong" https://target/login)
  echo "$u: $T"
done

# 2. SQLi probe
curl -X POST -d "username=admin' OR 1=1 -- &password=x" https://target/login

# 3. Default creds
hydra -L common-users.txt -P common-pass.txt target.com https-post-form \
      "/login:user=^USER^&pass=^PASS^:F=Invalid"

# 4. Forced browsing
ffuf -w common-paths.txt -u https://target/FUZZ -fc 401,403,404

# 5. Header spoofing
curl -H "X-Forwarded-For: 127.0.0.1" -H "X-Original-URL: /admin" \
     https://target/

# 6. JWT analysis
python3 jwt_tool.py <token> -M pb
```

---

## Impacto

- **Account takeover** — atacante = victim user.
- **Privilege escalation** — user → admin.
- **Data breach** — IDOR + bulk fetch users.
- **Full app compromise** — admin = full control.
- **Compliance violation** — auth bypass = SOC2/PCI fail.
- **Financial fraud** — auth bypass + financial actions.
- **Persistence** — backdoor account creation.
- **Reputation damage** — visible breach.
- **Lateral movement** — auth bypass en internal systems.
- **Supply chain compromise** — auth bypass en CI/CD admin.

---

## Mitigación (defender)

- **Strong password policy** — min 12 chars, complexity, breached password check (HIBP API).
- **Rate limiting + lockout** — per IP + per user, exponential backoff.
- **Generic error messages** — `Invalid credentials` (no diff valid/invalid user).
- **MFA enforcement** — TOTP / WebAuthn / push, NOT SMS only.
- **Server-side session validation** — never trust client-side auth flags.
- **Strong session ID generation** — cryptographic random, ≥ 16 bytes.
- **Session regeneration post-login** — kill old session, create new.
- **HttpOnly + Secure + SameSite=Lax/Strict cookies** — defense in depth.
- **Hardcoded URL en password reset** — never use Host header.
- **Signed reset tokens** — even if URL hijacked, token invalid out-of-context.
- **Single-use tokens con DB tracking** — `jti` blacklist after use.
- **OAuth strict redirect_uri** — exact match, pre-registered, HTTPS only.
- **OAuth state + PKCE** — required for all flows.
- **JWT alg whitelist** — `algorithms=['RS256']` always specified.
- **JWT key rotation** — periodic rotation + grace period.
- **bcrypt / Argon2 con random salt** — slow hashing.
- **No password en URL/logs** — query strings logged, never include creds.
- **Audit log + monitoring** — failed logins, privesc attempts, anomalous patterns.
- **Penetration testing periódico** — dedicated auth/authz testing.
- **OWASP ASVS compliance** — comprehensive checklist.

---

## Para entender Auth Bypass

**Por qué auth bypass sigue siendo común:**

1. **Auth es complejo** — flows multi-step (reset, 2FA, OAuth) tienen muchos puntos de falla.
2. **Frameworks default no son seguros** — devs olvidan rate limit, CSRF, validation.
3. **Logic flaws no detectables por scanners** — automated tools miss multi-step bugs.
4. **Mass Assignment / IDOR** son bugs de design, not coding mistake — más difíciles de fix.
5. **Token validation laxa** — JWT con `alg=none` default, predictable secrets, weak crypto.
6. **Race conditions modernos** — HTTP/2 single-packet attacks (Kettle 2023) revivieron vector.

**Por qué auth y authz son hermanas pero distintas:**

Auth (authentication) verifica identidad. Authz (authorization) verifica permission. Atacante puede:
- Bypass auth → log in as victim (ATO).
- Bypass authz → access victim's data despite weak auth (BOLA / IDOR).
- Both → full compromise.

App vulnerable typically falla en uno o ambos: weak password policy + IDOR = pre-auth recon → ATO via brute → IDOR para access bulk data.

**Common chain pattern:**

1. Username enumeration (timing).
2. Password spraying (Spring2025!).
3. JWT inspection (alg=none).
4. IDOR sequential IDs (bulk extract).
5. Mass Assignment (isAdmin: true).
6. Persistencia via API key gen.

Cada step bajo CVSS pero combined = catastrófico. Pen-testers raramente paran en un step.

---

## Recursos

- [OWASP Top 10 - A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) — overview.
- [OWASP API Top 10 - 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — API-specific.
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — defense.
- [OWASP Authorization Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — defense.
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) — comprehensive checklist.
- [PortSwigger - Authentication](https://portswigger.net/web-security/authentication) — labs.
- [PortSwigger - Access Control](https://portswigger.net/web-security/access-control) — labs.
- [PayloadsAllTheThings - Authentication](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Account%20Takeover) — payloads.
- [HackTricks - Authentication Bypass](https://book.hacktricks.xyz/pentesting-web/login-bypass) — referencia.
- [HackerOne - Top OWASP](https://hackerone.com/top-10-vulnerabilities) — bug bounty insight.
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3) — breach data.

---
