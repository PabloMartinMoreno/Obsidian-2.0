---
aliases:
  - Cross-Site Request Forgery (SCRF)
  - CSRF
  - XSRF
  - Cross Site Request Forgery
  - Session Riding
tags:
  - vuln/csrf
  - technique/initial-access
  - technique/execution
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
  - "[[CSRF - Deteccion y Reconocimiento]]"
  - "[[CSRF - Vectores de Ataque]]"
  - "[[CSRF - Bypass de Token]]"
  - "[[CSRF - Bypass de SameSite y Referer]]"
  - "[[CSRF - Tipos Especiales]]"
  - "[[CSRF - Tooling]]"
  - "[[Clickjacking]]"
  - "[[Authentication & Authorization Bypass]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[HTTP - Cookies y Sesiones]]"
  - "[[Burp Suite]]"
---
# Cross-Site Request Forgery (CSRF)

---

## Cheatsheet

### 🎯 Vectores de Ataque

````tabs
tab: **HTML Form Auto-Submit (POST)**
![[CSRF - Vectores de Ataque#^csrf-vector-form]]

tab: **Image / Link (GET-based)**
![[CSRF - Vectores de Ataque#^csrf-vector-image]]

tab: **JavaScript fetch / XHR**
![[CSRF - Vectores de Ataque#^csrf-vector-fetch]]

tab: **JSON / Multipart Bypass**
![[CSRF - Vectores de Ataque#^csrf-vector-json]]
````

### 🔓 Bypass de Token CSRF

````tabs
tab: **Token No Validado (Remove)**
![[CSRF - Bypass de Token#^csrf-bypass-token-remove]]

tab: **Validado Solo Si Presente**
![[CSRF - Bypass de Token#^csrf-bypass-token-presence]]

tab: **Reuse / Fixed Value**
![[CSRF - Bypass de Token#^csrf-bypass-token-reuse]]

tab: **Tied to Non-Session**
![[CSRF - Bypass de Token#^csrf-bypass-token-tied]]

tab: **Token Leak (Referer / URL)**
![[CSRF - Bypass de Token#^csrf-bypass-token-leak]]
````

### 🍪 Bypass de SameSite / Referer

````tabs
tab: **SameSite=Lax GET-based**
![[CSRF - Bypass de SameSite y Referer#^csrf-bypass-samesite-lax]]

tab: **Method Override**
![[CSRF - Bypass de SameSite y Referer#^csrf-bypass-method-override]]

tab: **Subdomain Abuse**
![[CSRF - Bypass de SameSite y Referer#^csrf-bypass-subdomain]]

tab: **Referer Strip / Referrer-Policy**
![[CSRF - Bypass de SameSite y Referer#^csrf-bypass-referer]]
````

### 🌐 Tipos Especiales

````tabs
tab: **Login CSRF**
![[CSRF - Tipos Especiales#^csrf-special-login]]

tab: **Logout CSRF**
![[CSRF - Tipos Especiales#^csrf-special-logout]]

tab: **JSON CSRF**
![[CSRF - Tipos Especiales#^csrf-special-json]]

tab: **WebSocket CSRF (CSWSH)**
![[CSRF - Tipos Especiales#^csrf-special-websocket]]

tab: **File Upload CSRF**
![[CSRF - Tipos Especiales#^csrf-special-upload]]
````

### 🛠️ Tooling

````tabs
tab: **Burp PoC Generator**
![[CSRF - Tooling#^csrf-tool-burp]]

tab: **Custom HTML PoCs**
![[CSRF - Tooling#^csrf-tool-html-poc]]

tab: **CSWSH PoC Builder**
![[CSRF - Tooling#^csrf-tool-cswsh]]
````

---

## Overview

**Cross-Site Request Forgery (CSRF)** = atacante hace que el navegador del victim envíe una request **con sus cookies de sesión** a una app donde está logueado, ejecutando una acción no querida. La app procesa la request porque las cookies son válidas — no distingue entre acción intencional del user y acción inducida por sitio externo.

Vector clase A — OWASP Top 10 desde 2007. Mitigado en muchos casos por SameSite cookies (Chrome 80+ default Lax), pero aún explotable en endpoints GET-based, con method override, con token weakness, o en CORS misconfig.

### Anatomía del ataque

```
1. Victim logueado en https://target.com (cookies session activas).
2. Victim visita https://attacker.com (mismo browser, otra tab).
3. Página atacante hace request a target.com:
   - Form auto-submit POST
   - <img src> a endpoint GET
   - fetch() con credentials:'include'
4. Browser envía cookies de target.com con la request (same-site cookie policy).
5. target.com recibe request con session cookie válida → procesa acción.
6. Action ejecutada como victim sin su consentimiento.
```

### Diferencia con XSS

| | **CSRF** | **XSS** |
|---|---|---|
| Ejecuta en | Browser victim, contra target backend | Browser victim, en context de target frontend |
| Requiere | Victim logueado en target | Vulnerabilidad de output encoding en target |
| Lee response? | NO (Same-Origin Policy bloquea) | SÍ (mismo origin) |
| Impacto | Acción específica forced | Robo de cookies / control completo |
| Defensa primaria | CSRF token / SameSite | Output encoding / CSP |

XSS frecuentemente "rompe" CSRF defenses porque XSS puede leer el token → forjar request válida.

---

## Workflow de explotación

```
1. Identificar endpoint state-changing (POST/PUT/DELETE) en target authenticated.
2. Analizar protecciones:
   - ¿Hay token CSRF?
   - SameSite de la cookie session?
   - Referer / Origin check?
   - Custom headers (X-Requested-With)?
3. Identificar bypass:
   - Token: remove / reuse / tied to non-session / leak
   - SameSite=Lax: convertir POST a GET con method override
   - Referer: meta no-referrer / data: URL / downgrade
   - CORS: misconfig que permita fetch credentials
4. Construir PoC:
   - Form HTML auto-submit (POST)
   - <img>/<link> tag (GET)
   - fetch con credentials:'include'
   - JSON CSRF via text/plain trick
5. Hostear PoC en attacker.com.
6. Trigger victim a visitar (phishing / link en foro / ad).
7. Acción ejecutada en target con cookies victim.
```

---

## Detección rápida

### Recon activo

![[CSRF - Deteccion y Reconocimiento#^csrf-detect-endpoints]]

![[CSRF - Deteccion y Reconocimiento#^csrf-detect-tokens]]

![[CSRF - Deteccion y Reconocimiento#^csrf-detect-protections]]


### Indicadores en código backend

```python
# Flask — VULN sin CSRF protect
@app.route('/transfer', methods=['POST'])
def transfer():
    return do_transfer(request.form['to'], request.form['amount'])

# Flask — SAFE con flask-wtf
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)
```

```php
// PHP — VULN
<?php
if ($_POST) {
    update_email($_SESSION['user_id'], $_POST['email']);
}
?>

// PHP — SAFE con token
if ($_POST['csrf_token'] === $_SESSION['csrf_token']) {
    update_email(...);
}
```

```javascript
// Express — VULN sin csurf
app.post('/api/profile', (req, res) => {
    updateProfile(req.session.userId, req.body);
});

// Express — SAFE con csurf
const csrf = require('csurf');
app.use(csrf());
```

### Probes mínimos

```bash
# 1. Verificar SameSite
curl -I -b "session=ABC" https://target/ | grep -i set-cookie

# 2. Probar request sin token
curl -X POST -b "session=ABC" -d "action=transfer&amount=1000" https://target/api/transfer
# Si 200 OK = CSRF token no validado

# 3. Probar con token random
curl -X POST -b "session=ABC" -d "csrf_token=AAAA&action=transfer" https://target/api/transfer
# Si 200 = solo valida presencia

# 4. Probar Referer manipulación
curl -X POST -b "session=ABC" -H "Referer: https://attacker.com" \
     -d "csrf_token=valid&action=transfer" https://target/api/transfer
# Si 200 = no Referer check

# 5. Probar Origin null
curl -X POST -b "session=ABC" -H "Origin: null" \
     -d "csrf_token=valid&action=transfer" https://target/api/transfer
```

---

## Impacto

- **Account takeover** — cambiar email / password / 2FA disable.
- **Privilege escalation** — admin víctima ejecuta action que crea atacante como admin.
- **Financial loss** — transferencias / compras forzadas.
- **Data corruption** — borrar / modificar registros.
- **Privacy leak (login CSRF)** — victim usa cuenta atacante, su data guardada bajo control del atacante.
- **DoS / annoyance** — logout CSRF, mass logout.
- **Persistence chain** — file upload CSRF para drop de webshell / persistent XSS.
- **WebSocket hijack (CSWSH)** — control de canal duplex con cookies victim.

---

## Mitigación (defender)

- **SameSite=Lax (mínimo) o Strict** — cookies session marcadas estrictas:
  ```
  Set-Cookie: session=ABC; HttpOnly; Secure; SameSite=Strict
  ```
- **CSRF token** — sync token pattern:
  - Generar token random cryptographic per session.
  - Embedded en hidden field de cada form.
  - Validar server-side on POST/PUT/DELETE.
  - Tied to user session, no a IP.
- **Double-submit cookie** — token en cookie + body, server compara:
  - Funciona sin server-side state.
  - Vulnerable a subdomain abuse.
- **Custom header** (`X-Requested-With: XMLHttpRequest`):
  - CORS preflight bloquea cross-site fetch con custom headers.
  - Combinar con SameSite.
- **Origin / Referer validation** — validar header con string match exacto:
  - NO usar regex laxo (`target.com` matchea `evil-target.com`).
  - Allowlist de hosts trusted.
- **No usar GET para state-changing actions** — REST verbs correctos.
- **No method override sin auth** — `_method=DELETE` solo si CSRF token validado.
- **CORS strict**: `Access-Control-Allow-Origin` con dominio específico, nunca `*` si hay credentials.
- **HTTPS only** — combinar con `Secure` cookie attribute.
- **Auth re-confirmation** para acciones críticas (re-enter password antes de cambiar email).
- **CAPTCHA / rate limit** en endpoints sensibles — no para CSRF directamente, mitigatorio.

---

## Para entender CSRF

**Por qué browsers envían cookies cross-site:**

Diseño histórico HTTP (1990s): cookies son del **dominio** que las setea, no del **origen** del request. Cuando `attacker.com` carga `<img src="https://target.com/x">`, browser ve dominio `target.com` y manda cookies asociadas.

Esto era razonable cuando "cross-site interactions" = embedding imágenes / scripts útiles. Cuando apps modernas dependen de cookies para auth, la regla se vuelve vector.

**Por qué SameSite tardó tanto:**

Backwards compat. Cambiar default rompe miles de apps OAuth / SSO / embeds. Chrome 80 (Feb 2020) introdujo `SameSite=Lax` default — una década después del paper canonical de CSRF.

**SameSite no es bala de plata:**

- Lax permite GET top-level. Method override → CSRF aún funcional.
- Strict rompe funcionalidad común (links externos a app rompen session).
- None require `Secure` y abre vector si HTTP downgrade.
- Subdomain abuse pasa el check (mismo registrable domain = same-site).

CSRF token sigue siendo defensa fundamental, **además** de SameSite.

---

## Recursos

- [PortSwigger - CSRF](https://portswigger.net/web-security/csrf) — labs y conceptos.
- [PortSwigger - SameSite Bypass](https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions) — bypass moderno.
- [PayloadsAllTheThings - CSRF](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/CSRF%20Injection) — payloads.
- [HackTricks - CSRF](https://book.hacktricks.xyz/pentesting-web/csrf-cross-site-request-forgery) — referencia exhaustiva.
- [OWASP CSRF Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — defensas.
- [RFC 6265bis - SameSite](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis) — spec actualizada.
- [BlackHat 2008 - The CSRF Threat](https://www.blackhat.com/presentations/bh-usa-08/Zeller_Felten/BHUSA08-Zeller-CSRF-slides.pdf) — paper que popularizó.
- [Cross-Site WebSocket Hijacking - Christian Schneider](http://www.christian-schneider.net/CrossSiteWebSocketHijacking.html) — origen del término CSWSH.

---
