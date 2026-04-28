---
aliases:
  - OAuth State CSRF
  - OAuth Login CSRF
tags:
  - vuln/oauth
  - vuln/csrf
  - technique/account-binding
primary: "[[OAuth 2.0 Misconfigurations]]"
---

# OAuth 2.0 - State / CSRF / Login CSRF

`state` parameter es CSRF token de OAuth. Sin state válido, atacante puede pre-iniciar OAuth flow → completar el callback en víctima → bind cuenta atacante a víctima (pre-account takeover).

## State Ausente

Server no requiere `state` o lo ignora si llega. Habilita login CSRF clásico.

| Síntoma | Cómo verificar | Resultado |
|---------|----------------|-----------|
| `/authorize` sin state | Iniciar flow sin `state=` → OK | State opcional |
| Callback acepta sin state | Mandar callback solo con `code=` | Server procesa el code |
| State no validado contra session | Reusar state de otro usuario | Server acepta |
| State validado solo presence | `state=anything` acepta | Validación fake |

```bash
# Test 1: ¿requerido?
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb&scope=email"
# Si emite code sin state → vuln

# Test 2: ¿validado en callback?
# Capturar callback legítimo:
GET /cb?code=AAA&state=BBB
# Repetir sin state:
GET /cb?code=AAA
# Si server procesa code → no validado

# Test 3: Cross-user state
# User1 inicia flow con state=USER1_STATE → callback /cb?code=USER1_CODE&state=USER1_STATE
# Usar state=USER1_STATE en flow de User2 → si acepta = no bound to session
```

Login CSRF impacto: atacante crea cuenta atacante en provider → inicia OAuth flow → captura `code` antes del callback → emite link a víctima con ese `code` → víctima loguea sin saber → ahora víctima está logueada como atacante's account → atacante observa data víctima ingresa.

^oauth-state-absent

## State Predecible o Reusable

State presente pero implementación rota.

| Bug | Ejemplo | Exploit |
|-----|---------|---------|
| **State predecible** | `state = md5(user_id + timestamp)` | Atacante predice state |
| **State estático** | `state = "abc123"` hardcoded | Reuse trivial |
| **State sin entropía** | `state = "1"`, `"2"`, increment | Brute |
| **State no rotado** | Mismo state across sessions | Reuse |
| **State leak via Referer** | State en URL post-callback → leak | Captura via 3p analytics |
| **State sin TTL** | State válido para siempre | Replay días después |
| **State no bound to user** | Sirve para cualquier session | Cross-account binding |

```python
# VULN — predecible
state = hashlib.md5(f"{user.id}{int(time.time())}".encode()).hexdigest()

# VULN — sin entropía
state = "csrf_protection"  # estático

# SAFE
state = secrets.token_urlsafe(32)  # 256 bits entropy
session['oauth_state'] = state
# en callback:
if request.args.get('state') != session.pop('oauth_state', None):
    abort(403)
```

^oauth-state-predictable

## Account Binding Pre-Takeover

OAuth permite "linkear" cuenta social a cuenta existente (`/settings/linked_accounts`). Si endpoint de bind no valida state → atacante puede forzar víctima a bindear su (atacante's) Google a la cuenta víctima.

| Step | Acción atacante | Resultado |
|------|-----------------|-----------|
| 1 | Inicia flow OAuth con su Google | Captura `code` antes del callback |
| 2 | Construye URL `https://victim.com/oauth/link?code=ATACANTE_CODE` | Link malicioso |
| 3 | Víctima logged-in clickea link | Backend procesa code → bindea Google atacante a cuenta víctima |
| 4 | Atacante ahora puede login a víctima's account via "Sign in with Google" | ATO completo |

```http
# Víctima clickea (mientras logged in)
GET https://victim.com/auth/google/callback?code=4/0AfJohXl...

# Backend (vuln):
@app.route('/auth/google/callback')
def google_cb():
    code = request.args.get('code')
    google_user = exchange_code_for_user(code)  # = atacante's Google
    current_user.google_id = google_user['id']  # ← bind atacante a current_user
    db.commit()
    # ¡cuenta víctima ahora linkeada a Google atacante!
```

Defensa: bind endpoint debe requerir state validado contra session, **y** confirmation page mostrando email del provider antes de commit.

^oauth-state-binding

## Pre-Account Takeover

OAuth signup permite crear cuenta usando email del provider. Si signup no verifica email ownership → atacante crea cuenta `victim@target.com` con su Google → cuando víctima intenta signup luego, encuentra cuenta ya existente y "logea" entrando a cuenta atacante.

| Pre-condición | Exploit | Mitigación |
|---------------|---------|------------|
| Signup OAuth no verifica `email_verified=true` del provider | Atacante registra email víctima en su Google personal | Solo aceptar `email_verified=true` |
| Signup acepta email arbitrario sin verification mail | Atacante crea cuenta | Verification mail a inbox real |
| Merge automático de cuentas con mismo email | Provider Google + provider email/password merge automático | Require explicit user action para merge |
| Login OAuth sin verificar issuer | Atacante usa fake provider | Validate `iss` en id_token |

```bash
# Workflow ataque
# 1. Atacante en su Google personal: settings → emails → add victim@target.com (sin verificar)
# 2. Atacante completa signup OAuth en target.com con su Google → email = victim@target.com
# 3. Cuenta creada y bindeada a Google atacante
# 4. Víctima visita target.com, intenta signup → "ya existe cuenta con ese email"
# 5. Víctima usa "Sign in with Google" → loguea pero a cuenta atacante (bindeada a su Google)
# 6. Atacante puede login también con su Google → mismo account
```

Famoso bug en bug bounty (Booking, Slack, otros).

^oauth-state-pretakeover

## Session Fixation via OAuth

Atacante inicia OAuth flow con su cuenta, captura state + URL, manda link víctima. Víctima clickea, completa flow, queda logueada en cuenta atacante. Cuando víctima sube data sensible asumiendo es su cuenta, atacante ve todo.

| Vector | Cómo | Defensa |
|--------|------|---------|
| State no bound a session víctima | Atacante reusa su state legit | Bind state a victim's session pre-flow |
| `prompt=none` con sesión preexistente | Si víctima ya logged en provider → silent re-auth | Force interactive |
| Auto-login on callback | Server loguea via code sin re-confirm | Confirmation step |
| `display=popup` + window.opener | Popup posteable a opener via postMessage | postMessage origin check |

Combo común: atacante's link inicia flow, víctima loguea, recién después atacante hace `password reset` desde "su" cuenta → token reset llega al inbox víctima → atacante puede.

Wait — orden invertido. En session fixation OAuth: víctima termina logged como atacante, no atacante como víctima. Útil cuando víctima sube data en lugar de atacante robar.

^oauth-state-fixation
