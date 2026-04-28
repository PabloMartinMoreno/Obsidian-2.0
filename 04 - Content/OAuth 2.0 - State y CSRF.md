---
aliases:
  - OAuth State CSRF
  - Login CSRF OAuth
  - Account Binding Attack
  - Pre-Account Takeover
tags:
  - type/cheatsheet
  - vuln/oauth
  - vuln/csrf
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
---
# OAuth 2.0 - State / CSRF / Login CSRF

***

## State Ausente

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Server no exige `state` o lo ignora. Habilita login CSRF clásico → cuenta atacante bindea a víctima. | CSRF de OAuth. |
| Server emite code sin state | `/authorize?...` (sin `state=`) → returns code | Validation absent. |
| Callback acepta sin state | `GET /cb?code=AAA` (sin state param) | Server processes code. |
| State no validado vs session | Reusar state otro user en flow distinto | No session bind. |
| State validado solo presence | `state=anything` aceptado | Fake validation. |
| State no required en token endpoint | Code intercambiable sin state | Defense gap. |
| State opcional en config | Toggle "require state" off por error | Misconfig. |
| State validado solo en error path | Happy path no checkea | Logic flaw. |
| State se descarta tras log | Usado solo for logging, no auth | Wrong intent. |
| State en cookie pero no validado | Cookie present pero never compared | Implementation bug. |
| State en frontend solo | Client-side check skippable | Trivial bypass. |
| `nonce` confundido con `state` | Nonce ≠ state — propósitos distintos | Common dev mistake. |
^oauth-state-absent

### Test state requirement

```bash
# Test 1: Required en authorize?
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb&scope=email"
# Si emite code sin state → vuln

# Test 2: Validado en callback?
# Capturar callback legit:
GET /cb?code=AAA&state=BBB
# Repetir sin state:
GET /cb?code=AAA
# Si server procesa → no validado

# Test 3: Cross-user state
# User1 inicia flow → captura state=USER1_STATE
# User2 inicia flow → en callback usar state=USER1_STATE
# Si acepta → no bound to session
```

___

## State Predecible o Reusable

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | State presente pero implementación rota: predictable, reusable, leakeable. | Defense-in-name-only. |
| State predecible | `state = md5(user_id + timestamp)` | Atacante predice. |
| State estático | `state = "csrf_protection"` hardcoded | Reuse trivial. |
| State sin entropía | `state = "1"`, `"2"`, increment | Brute force. |
| State no rotado | Mismo state across sessions | Replay. |
| State leak via Referer | State en URL post-callback → leak via Referer header | 3p analytics ven. |
| State sin TTL | Válido para siempre | Replay días después. |
| State no bound to user | Sirve para cualquier session | Cross-account binding. |
| State client-side only | LocalStorage/cookie pero no server validation | Bypass. |
| State validado en client (JS) | Frontend check, server confía | Modificable. |
| State derivado de user input | Atacante influences derivation | Predictable. |
| State weak HMAC | `HMAC(secret, "static")` con secret leaked | Replay. |
| State JWT con `alg=none` | JWT-encoded state forgeable | JWT alg=none combo. |
| State en URL fragment | Fragment leakable JS-side | XSS combo. |
| State en GET param leakable | Logged en access logs, proxies | Privacy. |
| State no rotated tras error | Failed auth → state still valid | Replay attempts. |
^oauth-state-predictable

### Patrones backend

```python
# VULN — predecible
import hashlib, time
state = hashlib.md5(f"{user.id}{int(time.time())}".encode()).hexdigest()

# VULN — estático
state = "csrf_protection"

# VULN — increment
state = str(get_next_oauth_state_id())

# SAFE — token random + session bind
import secrets
state = secrets.token_urlsafe(32)  # 256 bits
session['oauth_state'] = state
session['oauth_state_created'] = time.time()

# Callback
if request.args.get('state') != session.pop('oauth_state', None):
    abort(403)
if time.time() - session.pop('oauth_state_created', 0) > 600:  # 10 min TTL
    abort(403)
```

___

## Account Binding Pre-Takeover

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Endpoint `/settings/link_oauth` no valida state. Atacante fuerza víctima a bindear su (atacante's) Google a cuenta víctima. | Persistent backdoor. |
| Step 1: Atacante inicia flow propio | Registra app en Google con su cuenta | Pre-attack setup. |
| Step 2: Captura code | Antes del callback víctima | Pre-callback intercept. |
| Step 3: Construye link malicioso | `https://victim.com/oauth/link?code=ATACANTE_CODE` | Phishing payload. |
| Step 4: Víctima logged in clickea | `link_oauth` endpoint procesa code | Accept any code. |
| Step 5: Backend bindea Google atacante | `current_user.google_id = atacante_google_id` | Without re-auth/state. |
| Step 6: Atacante login via "Sign in with Google" | Google atacante → cuenta víctima | ATO. |
| Sin confirmación email | Bind no muestra email del provider antes commit | UI bug. |
| Sin re-auth para bind | Endpoint no requiere password actual | Trust gap. |
| Sin notificación email víctima | Víctima no se entera | Silent attack. |
| Multiple providers chain | Bind Google + Facebook + GitHub atacante | Multi-vector persistence. |
| Bind de unverified email match | Auto-bind si emails iguales (atacante's email = victim's) | Combo email squatting. |
| OIDC `sub` vs email confusion | Bind usa `sub` pero matching usa email | Logic flaw. |
^oauth-state-binding

### Backend vulnerable

```python
# Flask — VULN
@app.route('/auth/google/callback')
def google_cb():
    code = request.args.get('code')
    google_user = exchange_code_for_user(code)  # = atacante's Google
    current_user.google_id = google_user['sub']  # ← bind sin state, sin re-auth
    db.commit()
    flash('Google account linked!')
    return redirect('/dashboard')

# SAFE
@app.route('/auth/google/callback')
def google_cb():
    if request.args.get('state') != session.pop('oauth_state', None):
        abort(403, 'invalid state')
    code = request.args.get('code')
    google_user = exchange_code_for_user(code)
    if google_user.get('email_verified') is not True:
        abort(400, 'email not verified by provider')
    # Confirmation step
    return render_template('confirm_link.html', provider_email=google_user['email'])
# POST de confirm_link: requires password actual + sets google_id
```

___

## Pre-Account Takeover via Email

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Signup OAuth no verifica `email_verified` del provider. Atacante crea cuenta con email víctima en su Google (sin verificar) → registra en target → cuando víctima signup encuentra cuenta existente. | Pre-positioning. |
| Atacante's Google add unverified email | Settings → Emails → Add `victim@target.com` (sin click verify) | Pre-attack setup. |
| Atacante signup en target con su Google | Google envía email víctima en `email` claim, `email_verified=false` | Server should reject. |
| Server crea cuenta atacante con email víctima | Si server confía email sin checkear `email_verified` | Vuln. |
| Víctima intenta signup directo | "Email already exists" error | UX confuses. |
| Víctima usa "Sign in with Google" | Loguea pero entra a cuenta atacante | Confusion. |
| Atacante también puede login | Mismo Google account bindeado | Persistent. |
| Booking-style classic bug | Históricamente vulnerable | Real example. |
| Slack-style auto-merge | Same email auto-merge | Variant. |
| Variant via SAML | SAML IdP no verified email | Adjacent. |
| Variant via OIDC | id_token `email_verified=false` ignored | Same root. |
| MFA bypass via OAuth signup | Cuenta nueva sin MFA enroll | Privilege escalation. |
| Email change post-takeover | Atacante cambia email cuenta a su own | Persistent. |
| `email_verified` toggle bug | Server permite false → true via parameter | Combo. |
| Provider-specific quirks | Google, GitHub, FB tienen comportamientos distintos | Per-IdP. |
^oauth-state-pretakeover

### Defense check

```python
# VULN
def signup_oauth(google_token):
    user_info = decode(google_token)
    user = User(email=user_info['email'], google_id=user_info['sub'])
    db.session.add(user)
    db.session.commit()

# SAFE
def signup_oauth(google_token):
    user_info = decode(google_token)
    if not user_info.get('email_verified'):
        abort(400, 'email not verified')
    if not user_info.get('iss') == EXPECTED_ISSUER:
        abort(400, 'invalid issuer')
    # Force separate verification email even if provider says verified
    send_verification_email(user_info['email'])
```

___

## Session Fixation via OAuth

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Atacante inicia flow propio, captura state + URL. Víctima clickea link, completa auth, queda logueada en cuenta atacante. | Reverse fixation. |
| State no bound a victim's session | Atacante's state legit en víctima | Reuse. |
| `prompt=none` con sesión preexistente | Si víctima ya logged in IdP → silent re-auth | Bypass UI. |
| Auto-login on callback | Server loguea via code sin re-confirm | No interaction. |
| `display=popup` + window.opener | Popup posteable a opener via postMessage | Cross-origin postMessage. |
| Víctima sube data sensible | Asume es su cuenta | Data theft inverted. |
| Atacante observa via "his" cuenta | Logged in concurrently | Persistent watch. |
| Combine con password reset | Atacante "his" cuenta → reset password con email víctima | If email control. |
| Combine con notification | Atacante triggers actions víctima ejecuta | Manipulation. |
| Combine con webhook | Atacante's webhook recibe víctima's actions | Exfil. |
| Same-IdP cross-app | Atacante's account on app A used to login app B as víctima | Mix-up combo. |
| Stale session cookie | Víctima never logs out → continues using atacante account | Long-term. |
^oauth-state-fixation

### Workflow fixation reverse

```
1. Atacante inicia flow OAuth → captura initial URL
   GET https://target/oauth/start
   → 302 https://google.com/authz?...&state=ATACANTE_STATE

2. Atacante intercepta antes de su own click "Authorize"
   Capture URL Google: https://google.com/authz?client_id=APP&...&state=ATACANTE_STATE

3. Atacante envía URL a víctima ("Click acá para promo")

4. Víctima clickea, ya logueada en Google → silent grant
   Google → 302 https://target/cb?code=VICTIM_CODE&state=ATACANTE_STATE

5. Server target valida state (es el que él/atacante seteó)
   → exchange code → user_info Google víctima
   → log víctima en cuenta SUYA (no atacante)
   
   ← Wait, here state validates ok for SOME user → if no session bind:
   atacante's session expects to log in next, so cookie set en víctima's browser
   logging víctima como atacante? Depends on impl.

6. Realidad: si atacante envió SU state (originated en su browser), cookie
   atacante's session vive en su browser. Víctima clickea desde víctima browser
   → cookie distinta. Realidad: víctima loguea como víctima.

   Para fixation REAL: atacante necesita que cookie de session viaje en víctima's browser.
   Variante: atacante presetea cookie via subdomain takeover o XSS.
```

***
