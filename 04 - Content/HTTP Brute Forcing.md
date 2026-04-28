---
aliases:
  - HTTP Brute Forcing
  - Web Brute Force
  - Login Brute Force
  - Credential Stuffing
  - Password Spray
tags:
  - type/vulnerability
  - vuln/brute-force
  - technique/credential-access
  - technique/account-takeover
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
linked:
  - "[[HTTP Brute Forcing - Deteccion y Reconocimiento]]"
  - "[[HTTP Brute Forcing - Targets de Ataque]]"
  - "[[HTTP Brute Forcing - Wordlists y Strategy]]"
  - "[[HTTP Brute Forcing - Bypass Rate-Limit]]"
  - "[[HTTP Brute Forcing - Tipos Especiales]]"
  - "[[HTTP Brute Forcing - Tooling]]"
  - "[[Authentication & Authorization Bypass]]"
  - "[[JWT Attacks]]"
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Session Hijacking]]"
  - "[[Burp Suite]]"
  - "[[ffuf]]"
---
# HTTP Brute Forcing

***

## Cheatsheet

### 🔍 Detección y Reconocimiento

````tabs
tab: **Login Form Discovery**
![[HTTP Brute Forcing - Deteccion y Reconocimiento#^bf-detect-endpoints]]

tab: **Response Diff Success/Fail**
![[HTTP Brute Forcing - Deteccion y Reconocimiento#^bf-detect-responsediff]]

tab: **Rate Limit Detection**
![[HTTP Brute Forcing - Deteccion y Reconocimiento#^bf-detect-ratelimit]]

tab: **Lockout Policy Probing**
![[HTTP Brute Forcing - Deteccion y Reconocimiento#^bf-detect-lockout]]

tab: **User Enumeration**
![[HTTP Brute Forcing - Deteccion y Reconocimiento#^bf-detect-enum]]
````

### 🎯 Targets de Ataque

````tabs
tab: **Login Forms**
![[HTTP Brute Forcing - Targets de Ataque#^bf-target-login]]

tab: **Basic / Digest / NTLM Auth**
![[HTTP Brute Forcing - Targets de Ataque#^bf-target-basic]]

tab: **API Keys / Tokens / Secrets**
![[HTTP Brute Forcing - Targets de Ataque#^bf-target-tokens]]

tab: **OTP / MFA Codes**
![[HTTP Brute Forcing - Targets de Ataque#^bf-target-otp]]

tab: **Session Cookie / JWT Secret**
![[HTTP Brute Forcing - Targets de Ataque#^bf-target-session]]
````

### 📋 Wordlists y Payload Strategy

````tabs
tab: **Stuffing vs Spray**
![[HTTP Brute Forcing - Wordlists y Strategy#^bf-strategy-stuffing-spray]]

tab: **Leaked Databases (HIBP, RockYou, COMB)**
![[HTTP Brute Forcing - Wordlists y Strategy#^bf-strategy-leaked-dbs]]

tab: **Targeted (CeWL, CUPP)**
![[HTTP Brute Forcing - Wordlists y Strategy#^bf-strategy-targeted]]

tab: **Mangling Rules**
![[HTTP Brute Forcing - Wordlists y Strategy#^bf-strategy-rules]]

tab: **Pattern-Based**
![[HTTP Brute Forcing - Wordlists y Strategy#^bf-strategy-patterns]]
````

### 🔓 Bypass de Rate-Limit

````tabs
tab: **IP Rotation (Tor, Proxies, VPS)**
![[HTTP Brute Forcing - Bypass Rate-Limit#^bf-bypass-iprotation]]

tab: **Header Spoofing (XFF, etc)**
![[HTTP Brute Forcing - Bypass Rate-Limit#^bf-bypass-headerspoof]]

tab: **UA + Session Rotation**
![[HTTP Brute Forcing - Bypass Rate-Limit#^bf-bypass-uasession]]

tab: **Timing Distribution**
![[HTTP Brute Forcing - Bypass Rate-Limit#^bf-bypass-timing]]

tab: **Endpoint / Account Rotation**
![[HTTP Brute Forcing - Bypass Rate-Limit#^bf-bypass-endpoints]]
````

### 💉 Tipos Especiales

````tabs
tab: **JWT Secret Crack**
![[HTTP Brute Forcing - Tipos Especiales#^bf-special-jwt]]

tab: **Password Reset Token Brute**
![[HTTP Brute Forcing - Tipos Especiales#^bf-special-resettoken]]

tab: **OTP / 2FA Brute**
![[HTTP Brute Forcing - Tipos Especiales#^bf-special-otp]]

tab: **SSH / RDP / SMB / FTP**
![[HTTP Brute Forcing - Tipos Especiales#^bf-special-services]]

tab: **App-Specific (WP, Joomla, etc.)**
![[HTTP Brute Forcing - Tipos Especiales#^bf-special-apps]]
````

### 🛠️ Tooling

````tabs
tab: **Hydra**
![[HTTP Brute Forcing - Tooling#^bf-tool-hydra]]

tab: **Burp Intruder + Turbo**
![[HTTP Brute Forcing - Tooling#^bf-tool-burp]]

tab: **Medusa, Patator, Ncrack**
![[HTTP Brute Forcing - Tooling#^bf-tool-others]]

tab: **ffuf, wfuzz**
![[HTTP Brute Forcing - Tooling#^bf-tool-ffuf]]

tab: **hashcat / John**
![[HTTP Brute Forcing - Tooling#^bf-tool-hashcrack]]

tab: **Wordlists & Anti-Captcha**
![[HTTP Brute Forcing - Tooling#^bf-tool-wordlists]]
````

___

## Overview

**HTTP Brute Forcing** = clase de ataques que intentan sistemáticamente combinaciones de credenciales (user:pass, OTP, tokens, secrets) hasta encontrar válidos. No exploita bug en código — exploita falta de defenses (rate limit, lockout, MFA, captcha) o weak credentials.

Los **2 vectors principales**: credential stuffing (leaked DB → reuse) y password spray (1 password × many users). Plus brute targeted contra JWT secrets, OTP codes, password reset tokens, session IDs.

Brute force es **bug bounty bread-and-butter** — incluso con defensas modernas, gaps comunes (rate limit per-endpoint, header spoofing, race conditions en OTP, JWT con secret weak) hacen que sea viable contra apps en producción.

### Cuándo es alto impacto

| Brute solo (low) | Brute en chain (high) |
|---|---|
| Cuenta única ATO (CVSS Medium-High) | Mass ATO via stuffing (CVSS Critical) |
| OTP race attack (CVSS Medium) | MFA bypass + ATO (CVSS High) |
| JWT HS256 weak secret (CVSS High) | Token forge → admin (CVSS Critical) |
| Reset token brute (CVSS Medium-High) | Account hijack (CVSS High) |
| API key brute (CVSS Medium) | Cross-tenant access (CVSS High) |
| SSH single account (CVSS High) | Lateral movement + persistence (CVSS Critical) |

### Diferencia con vulns relacionadas

| | **Brute Force** | **Auth Bypass** |
|---|---|---|
| Vector | Multiple intentos credentials válidas | Único bypass en logic |
| Tiempo | Long-running (mins-días) | Instantáneo |
| Detección | Ratelimit/lockout flags fácil | Logs muestran 1 successful login |
| Defensa | Rate limit + MFA + captcha | Code fix |
| Skill | Wordlists + tooling | Logic analysis |

### Stuffing vs Spray

| | **Credential Stuffing** | **Password Spray** |
|---|---|---|
| Input | DB leaked user:pass pairs | User list + common password |
| Target | Re-use across services | Same service, many users |
| Detección | Per-account fail | Per-IP fail |
| Defense | MFA + breach check | Rate limit per-IP |
| Hit rate | ~0.1-1% (high-value) | ~0.01-0.1% (vol-based) |
| Tooling | Sentry MBA, OpenBullet | Burp + custom |

___

## Workflow de explotación

```
1. Reconnaissance:
   - Identificar login endpoints (form, basic, API, OAuth)
   - Identify response diff success/fail
   - Test rate limit threshold + window
   - Probe lockout policy
   - User enumeration via error/timing diff

2. Choose strategy:
   a. Credential stuffing (leaked DB available)
   b. Password spray (user list + common pass)
   c. Targeted brute (specific user, CeWL/CUPP wordlist)
   d. Token brute (OTP, reset, JWT)

3. Build wordlist:
   - Stuff: BreachCompilation / dehashed export
   - Spray: SecLists Top1000 + org-specific
   - Targeted: CeWL crawl + CUPP personal info
   - Tokens: Numeric range or pattern-aware
   
4. Plan rate-limit bypass:
   - IP rotation (Tor/proxies/VPS)
   - Header spoofing (XFF/X-Real-IP)
   - Endpoint rotation (multiple login paths)
   - Account rotation (reverse spray)
   - Timing distribution (slow brute)

5. Execute:
   - Hydra/Patator/Burp Intruder
   - Monitor for: success indicators, lockouts, captcha appearance, IP block
   - Pivot strategy if blocked

6. Identify success:
   - Status code transition
   - Response length diff
   - Set-Cookie pattern
   - JWT/token in body
   - Redirect target
   
7. Validate + persist:
   - Login manually with found creds
   - Capture session cookies / refresh tokens
   - Test for additional persistence (API key creation, OAuth grant)
   
8. Document chain:
   - Credentials found
   - Account access level
   - Lateral movement potential
   - Recommended remediation
```

___

## Detección rápida

### Indicadores en código backend

```python
# Flask — VULN (sin rate limit)
@app.route('/login', methods=['POST'])
def login():
    user = User.query.filter_by(username=request.form['username']).first()
    if user and user.check_password(request.form['password']):
        login_user(user)
        return redirect('/dashboard')
    return 'Invalid credentials', 401
# ← no rate limiting, no lockout, no captcha after N

# Flask — SAFE
from flask_limiter import Limiter
limiter = Limiter(app, key_func=get_remote_address)

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    user = User.query.filter_by(username=request.form['username']).first()
    
    if user and user.failed_attempts >= 5:
        lockout_remaining = (user.locked_until - datetime.utcnow()).total_seconds()
        if lockout_remaining > 0:
            return 'Account locked', 403
    
    if user and user.check_password(request.form['password']):
        user.failed_attempts = 0
        db.session.commit()
        login_user(user)
        return redirect('/dashboard')
    
    if user:
        user.failed_attempts += 1
        if user.failed_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.session.commit()
    
    return 'Invalid credentials', 401  # ← genérico, no enum
```

```python
# Express — VULN
app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && bcrypt.compareSync(req.body.password, user.hash)) {
    req.session.userId = user.id;
    res.redirect('/dashboard');
  } else {
    res.status(401).send('Invalid');  // ← sin rate limit
  }
});

// Express — SAFE (con express-rate-limit + bcrypt + lockout)
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/login', loginLimiter, async (req, res) => {
  // Per-account lockout
  // Constant-time response
  // CAPTCHA after N fails
  // ...
});
```

### Probes mínimos

```bash
# 1. Test rate limit
for i in {1..50}; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST https://target/login -d "user=test&pass=wrong$i")
  echo "$i: $CODE"
done
# Look for 429/403/503 transition

# 2. Test response diff
curl -s -X POST https://target/login -d "user=admin&pass=wrong" | wc -c
curl -s -X POST https://target/login -d "user=admin&pass=admin" | wc -c

# 3. Quick spray con Hydra
hydra -L users.txt -p Password2025 \
  target.com http-post-form \
  "/login:user=^USER^&pass=^PASS^:F=Invalid" -t 4

# 4. JWT secret check
echo "$JWT" | jwt-cli decode  # check alg
hashcat -a 0 -m 16500 jwt.txt rockyou.txt
```

___

## Impacto

- **Account takeover (ATO)** — credentials válidos = full access cuenta.
- **Mass ATO via credential stuffing** — millions de cuentas comprometidas en horas.
- **Privilege escalation** — admin account brute = full system access.
- **JWT secret crack** — forge cualquier token, impersonar cualquier user.
- **Reset token brute** — bypass auth via password reset hijack.
- **OTP race attack** — bypass MFA con burst de 10K-1M attempts.
- **API key compromise** — long-lived access cross-tenant data.
- **Session hijack via cookie brute** — silent persistence.
- **Lateral movement** — SSH/RDP brute → infrastructure compromise.
- **Cross-service credential reuse** — leak en otra app → reuse aquí.
- **Persistence via OAuth grants** — atacante crea OAuth token post-login.
- **Data exfiltration** — accesso usuario = data export endpoints.

___

## Mitigación (defender)

- **Rate limiting** per-IP + per-account + per-endpoint:
  ```python
  # Flask-Limiter
  @limiter.limit("5/minute;20/hour")
  def login(): ...
  ```
- **Account lockout exponencial** — 5 fails → 1 min, 10 → 15 min, 15 → 1h, then captcha-required.
- **MFA obligatorio** para acciones sensibles — TOTP o WebAuthn (phishing-resistant).
- **CAPTCHA invisible** post-N fails (reCAPTCHA v3 o hCaptcha) — sin friction usuario legítimo.
- **Constant-time response** — evitar timing attacks en user enum:
  ```python
  user = User.find_by_username(username) or DUMMY_USER
  bcrypt.check(password, user.hash)  # always run
  ```
- **Username enumeration prevention**:
  - Generic error: "Invalid credentials" (no "user not found").
  - Same response time success/fail.
  - Same response length success/fail (use redirect for both).
- **Password reset rate limit per email** + obfuscated response ("If account exists, email sent").
- **Strong password policy** — banlist common passwords (zxcvbn, HIBP API check):
  ```python
  if password in HIBP_API.check(password):
      reject('password found in breach database')
  ```
- **JWT strong HMAC secrets** — ≥256 bits random, rotate quarterly.
- **JWT prefer RS256/ES256** sobre HS256 — separa firmar de verificar.
- **OTP rate limit** — max 5 attempts per code, code TTL 5 min, account lockout post-N fail.
- **Single-Packet Attack defense** — backend mutex/lock per-account on critical actions.
- **Detection alerts** — logs de N fails / hour → SIEM alert.
- **Distributed brute detection** — flag "many IPs, same UA, same payload pattern".
- **Geolocation alerts** — login from new country → email + force re-auth.
- **Breach monitoring** — HIBP integration check user passwords on login.
- **Zero-trust** — re-auth para sensitive actions even with valid session.
- **Hardware tokens** for high-privilege users — YubiKey FIDO2.

___

## Para entender HTTP Brute Forcing

**Por qué brute force sigue siendo viable en 2026:**

Apps modernas tienen rate limit, lockout, MFA — pero implementaciones rotas y gaps son la norma. Common gaps:

- Rate limit per-endpoint (login limited, password reset open).
- Per-IP only (proxy/Tor rotation bypass trivial).
- Lockout de account pero no de IP (reverse spray funciona).
- MFA opcional para "convenience" — usuarios skipean.
- Captcha solo en frontend (API endpoints sin protect).
- JWT secrets weak ("secret", "your-256-bit-secret", default frameworks).
- OTP race conditions (single-packet attack).
- Reset tokens predictables (timestamp + email md5).

**Por qué credential stuffing es high-success:**

Users reúsan passwords across services. Una breach (LinkedIn 2012, Yahoo, Facebook 2019) leaked billions de user:pass. Stuffing automation prueba estos pares contra targets nuevos. Hit rate ~0.1-1% — pero con 100M creds, eso son 100K-1M ATOs.

**Por qué password spray evade lockout:**

Lockout típico: per-account, 5 fails / 15 min. Spray: 1 password × N users → cada user tiene 1 fail (no lockout triggered). Ronda 2: nuevo password × N users. Slow but stealthy. Defensa: detect "many users tried same password from same IP".

**Por qué OTP race attacks funcionan:**

OTP 6-digit = 1M combos. TOTP windows = 30s. Backend valida code + lockout counter. Si race window open (no atomic check-and-increment), atacante manda 1000 simultáneos → algunos hit antes de que counter incremente. Single-Packet Attack sends N requests dentro de ~10ms → backend processed antes de lockout.

**Por qué JWT secrets son brute-able:**

JWT HS256 firmado con HMAC. Si secret es weak ("secret", "myappkey", default), hashcat brute en minutos. RS256 mucho más difícil (asymmetric). Pero apps default a HS256 por simplicidad → brute target ideal. Plus HMAC signed offline — brute con dump de cualquier JWT exposed.

**Por qué password reset tokens fallan:**

Devs piensan: "es random, no es bruteable". Pero short numeric (4-6 digit), predictable RNG (Math.random()), o derived from timestamp+email = breakable. Ejemplo común: token = md5(email + Date.now()) — atacante conoce email, timestamp window 1-2 sec → 1000-2000 candidates.

**Per-endpoint vs global rate limit:**

Defensa naïve: limita /login pero no /api/v1/login (alias backend), no /oauth/token, no /forgot-password counters. Atacante pivota endpoint → hits same backend con counter resetted. Discovery de endpoints es first step.

___

## Recursos

- [PortSwigger - Brute Force Attacks](https://portswigger.net/web-security/authentication/brute-force-attacks) — knowledge base.
- [PortSwigger - Authentication](https://portswigger.net/web-security/authentication) — full module + labs.
- [HackTricks - Brute Force](https://book.hacktricks.xyz/generic-methodologies-and-resources/brute-force) — referencia.
- [PayloadsAllTheThings - Login Bypass](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Login%20Bypass) — payloads.
- [OWASP - Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — defense.
- [OWASP - Credential Stuffing Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html) — defense.
- [SecLists - Passwords](https://github.com/danielmiessler/SecLists/tree/master/Passwords) — wordlists curados.
- [Have I Been Pwned](https://haveibeenpwned.com/Passwords) — 800M+ breached passwords API.
- [THC-Hydra docs](https://github.com/vanhauser-thc/thc-hydra) — multi-protocol brute.
- [Hashcat Wiki](https://hashcat.net/wiki/) — attack modes, hash types.
- [Burp Turbo Intruder](https://portswigger.net/research/turbo-intruder-embracing-the-billion-request-attack) — high-speed brute.
- [Single-Packet Attack (James Kettle, 2023)](https://portswigger.net/research/smashing-the-state-machine) — race-based brute.

***
