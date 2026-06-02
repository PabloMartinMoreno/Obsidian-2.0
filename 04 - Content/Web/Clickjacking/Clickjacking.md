---
aliases:
  - UI Redress
  - Clickjacking
  - UI Redressing
tags:
  - vuln/clickjacking
  - technique/initial-access
  - technique/social-engineering
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: Vulnerability
linked:
  - "[[Clickjacking - Vectores Basicos]]"
  - "[[Clickjacking - Variantes Avanzadas]]"
  - "[[Clickjacking - Bypass de Anti-Framing]]"
  - "[[Clickjacking - Chains con Otras Vulns]]"
  - "[[Clickjacking - Tooling]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[Open Redirect]]"
  - "[[Subdomain Takeover]]"
  - "[[Burp Suite]]"
---
# Clickjacking

---

## Cheatsheet

### 🎯 Vectores Básicos

````tabs
tab: **Opacity Overlay**
![[Clickjacking - Vectores Basicos#^cj-vector-opacity]]

tab: **Decoy Reposicionado**
![[Clickjacking - Vectores Basicos#^cj-vector-decoy]]

tab: **Doble Iframe Anidado**
![[Clickjacking - Vectores Basicos#^cj-vector-double-iframe]]

tab: **Fullscreen API**
![[Clickjacking - Vectores Basicos#^cj-vector-fullscreen]]
````

### 💉 Variantes Avanzadas

````tabs
tab: **Drag & Drop Jacking**
![[Clickjacking - Variantes Avanzadas#^cj-advanced-dragdrop]]

tab: **Cursor Jacking**
![[Clickjacking - Variantes Avanzadas#^cj-advanced-cursorjacking]]

tab: **Scroll Jacking**
![[Clickjacking - Variantes Avanzadas#^cj-advanced-scrolljacking]]

tab: **Touch Jacking**
![[Clickjacking - Variantes Avanzadas#^cj-advanced-touchjacking]]

tab: **Stroke Jacking (Keyjacking)**
![[Clickjacking - Variantes Avanzadas#^cj-advanced-strokejacking]]
````

### 🔓 Bypass de Anti-Framing

````tabs
tab: **JS Frame-Busting**
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-jsbusting]]

tab: **Sandbox Attribute**
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-sandbox]]

tab: **X-Frame-Options Bypass**
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-xfo]]

tab: **CSP frame-ancestors Bypass**
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-csp]]

tab: **Browser Quirks**
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-quirks]]
````

### 🔗 Chains con Otras Vulns

````tabs
tab: **Self-XSS → Stored**
![[Clickjacking - Chains con Otras Vulns#^cj-chain-xss]]

tab: **SameSite Lax CSRF**
![[Clickjacking - Chains con Otras Vulns#^cj-chain-csrf]]

tab: **OAuth Consent Hijack**
![[Clickjacking - Chains con Otras Vulns#^cj-chain-oauth]]

tab: **WebRTC getUserMedia**
![[Clickjacking - Chains con Otras Vulns#^cj-chain-webrtc]]

tab: **Subdomain Takeover Trust**
![[Clickjacking - Chains con Otras Vulns#^cj-chain-subtakeover]]
````

### 🛠️ Tooling

````tabs
tab: **Burp + Clickbandit**
![[Clickjacking - Tooling#^cj-tool-burp]]

tab: **PoC Generators**
![[Clickjacking - Tooling#^cj-tool-generators]]

tab: **Scanners (nuclei, clickjacker)**
![[Clickjacking - Tooling#^cj-tool-scanners]]

tab: **Browser DevTools**
![[Clickjacking - Tooling#^cj-tool-devtools]]

tab: **Wordlists & Repos**
![[Clickjacking - Tooling#^cj-tool-wordlists]]
````

---

## Overview

**Clickjacking (UI Redressing)** = técnica donde atacante carga página víctima en `<iframe>` casi invisible (opacity ~0) sobre UI atacante (decoy: "GANASTE", "Click para premio"). User clickea creyendo interactuar con decoy, pero clicks van al iframe → submits, transfers, password changes, OAuth grants ejecutados sin awareness.

Vector existe desde 2008 (Hansen + Grossman). Defensa moderna: `X-Frame-Options` + `Content-Security-Policy: frame-ancestors`. Apps que omiten ambos headers son frameables → vulnerables.

### Cuándo es alto impacto

| Solo Clickjacking | Chain con Clickjacking |
|---|---|
| Spam social actions (CVSS Low) | Account takeover via password change (CVSS High) |
| Toggle preferences | OAuth code theft + ATO (CVSS High) |
| Like/follow forced | Self-XSS → Stored XSS (CVSS High) |
| Limited data exposure | WebRTC camera/mic enable (CVSS High) |
| Reportable bug | SameSite=Lax CSRF bypass (CVSS Medium-High) |

### Diferencia con CSRF

| | **Clickjacking** | **CSRF** |
|---|---|---|
| Quién ejecuta | Browser víctima (real click) | Browser víctima (forged request) |
| Requiere user action | Sí (1+ clicks) | No (silent) |
| Vector | Iframe + UI overlay | Auto-submit form / fetch |
| Defensa | `X-Frame-Options` / `frame-ancestors` | CSRF token / SameSite cookie |
| SameSite=Lax bloquea | No (top-level navigation) | Sí (most cases) |

### Por qué sigue siendo viable en 2026

- Apps modernas usan SPAs con auth tokens → CSRF tokens menos comunes.
- `X-Frame-Options` no soporta wildcard ni multi-origin (legacy).
- CSP `frame-ancestors` mal configurado (`*`, falta) común en custom apps.
- Mobile webviews + touchjacking variants emergentes.
- OAuth `/authorize` endpoints frecuentemente frameables.

---

## Workflow de explotación

```
1. Identificar action target sensible:
   - Account: password change, email change, delete
   - Money: transfer, donate, purchase confirm
   - Auth: OAuth consent, MFA enable/disable
   - Privacy: visibility toggle, data export
   - Hardware: camera/mic enable (WebRTC)

2. Verify framing posible:
   - curl -sI target | grep -iE 'x-frame|frame-ancestors'
   - Si ambos ausentes → frameable
   - Si SAMEORIGIN/DENY/'self' → bypass needed

3. Si bloqueado, evaluar bypasses:
   - JS frame-busting → sandbox attribute
   - XFO ALLOW-FROM legacy → modern browsers ignoran
   - CSP frame-ancestors *.victim.com → subdomain takeover
   - Multiple XFO headers → parser quirks

4. Posicionar elementos:
   - Iframe target con opacity 0.0001
   - z-index alto, position absolute
   - Decoy debajo (z-index menor) o reposicionado offscreen
   - Cursor jacking: CSS cursor:none + fake cursor desplazado

5. Forzar interacción:
   - Botón decoy "GANASTE - Click para reclamar"
   - Multi-step: drag & drop, double-click, fullscreen
   - Touch: variantes mobile

6. Decidir explotación:
   a. Stand-alone: spam acciones, toggle settings.
   b. Chain XSS: self-XSS pre-fill + clickjack submit → stored.
   c. Chain CSRF: bypass SameSite=Lax via top-level nav.
   d. Chain OAuth: clickjack /authorize → code stolen.
   e. WebRTC: enable cam/mic en custom UI.
   f. Subdomain takeover: bypass CSP frame-ancestors 'self'.

7. Document PoC:
   - HTML auto-loadable
   - Screenshots before/after
   - Network trace mostrando request ejecutada
   - Final state (account modified, etc).
```

---

## Detección rápida

### Indicadores en código backend

```python
# Flask — VULN (sin headers anti-frame)
@app.route('/admin/delete-account', methods=['POST'])
def delete_account():
    user.delete()
    return redirect('/')
# ← no Content-Security-Policy, no X-Frame-Options

# Flask — SAFE
from flask import Response
@app.after_request
def set_security_headers(response):
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'none'"
    return response
```

```javascript
// Express — VULN
app.post('/transfer', (req, res) => {
    transferFunds(req.body);
    res.send('ok');
});

// Express — SAFE (helmet)
const helmet = require('helmet');
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.contentSecurityPolicy({
    directives: { frameAncestors: ["'none'"] }
}));
```

```nginx
# Nginx — VULN: no header
server { ... }

# Nginx — SAFE
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "frame-ancestors 'none'" always;
```

### Probes mínimos

```bash
# 1. Header check
curl -sI https://target/sensitive | grep -iE 'x-frame-options|content-security-policy'

# 2. Test framing real (HTML local)
cat > /tmp/test.html <<EOF
<iframe src="https://target/admin" width="800" height="600"></iframe>
EOF
xdg-open /tmp/test.html
# Si renderiza → vulnerable

# 3. Bulk scan con nuclei
nuclei -u https://target -t http/misconfiguration/clickjacking/

# 4. Burp Clickbandit (Pro)
# Extensions → Clickbandit → Start → grabar clicks → genera PoC

# 5. Auto-PoC con curl
PoC_URL="https://target/admin/delete"
curl -s "$PoC_URL" -o /dev/null -w '%{http_code}\n'  # confirm endpoint
# luego construir HTML con iframe + decoy
```

---

## Impacto

- **Account takeover** — clickjack password change sin re-auth = ATO directo.
- **OAuth code theft** — `/authorize` endpoint frameable + redirect_uri controlado = ATO via OAuth.
- **Self-XSS → Stored** — clickjack submit del input vulnerable = persistencia + amplificación.
- **CSRF en SameSite=Lax** — top-level nav del iframe bypassea Lax restriction.
- **WebRTC hijacking** — clickjack del custom permission UI = cam/mic activas.
- **MFA bypass via flow manipulation** — clickjack disable MFA toggle.
- **Spam social** — likes, follows, posts forzados (low impact pero scale).
- **Money transfer / purchase** — clickjack confirm en banking/e-commerce.
- **Privacy toggle** — público/privado, data export, account delete.
- **Subdomain takeover combo** — bypass CSP `frame-ancestors 'self'`.
- **Touch jacking mobile** — variants en webviews / PWAs.

---

## Mitigación (defender)

- **Header obligatorio CSP `frame-ancestors`** (estándar moderno):
  ```http
  Content-Security-Policy: frame-ancestors 'none'
  # o si necesitás same-origin:
  Content-Security-Policy: frame-ancestors 'self'
  # multi-origin (raro, evitar):
  Content-Security-Policy: frame-ancestors 'self' https://trusted.com
  ```
- **Header legacy `X-Frame-Options`** (browsers antiguos):
  ```http
  X-Frame-Options: DENY
  # o
  X-Frame-Options: SAMEORIGIN
  ```
  No usar `ALLOW-FROM` — modern browsers lo ignoran.
- **NO confiar en JS frame-busting** — bypasseable con `sandbox`:
  ```javascript
  // VULN — bypasseable
  if (top !== self) top.location = self.location;
  ```
- **SameSite=Strict cookies** para acciones críticas — iframe cross-origin no envía cookies.
- **Re-auth en acciones sensibles** — password change, money transfer requieren password actual.
- **Confirmation step intermedia** — antes de delete/transfer, mostrar review page con CSRF token.
- **OAuth strict redirect_uri** — pre-registered, exact match, HTTPS only.
- **Subresource Integrity** para scripts externos — prevent malicious updates.
- **Reporting** — `Content-Security-Policy-Report-Only` para detectar framing attempts.
- **Pruebas regulares** — nuclei templates + Clickbandit en QA.

---

## Para entender Clickjacking

**Por qué browsers permiten iframes cross-origin:**

Web original = mashups (embed YouTube, Twitter widgets, ads). Iframes diseñados para composición cross-origin. RFC no prohíbe framing — responsabilidad del site frameado declarar policy. Sin policy → asume framing OK.

**Por qué opacity 0 funciona:**

Browser renderiza iframes interactivos aún con opacity 0 (clicks llegan al elemento). Es feature, no bug — permite stylized embeds. La combinación opacity + z-index + position absolute logra "phantom click target".

**Por qué frame-busting JS no alcanza:**

```javascript
if (top !== self) top.location = self.location;
```

Atacante usa `<iframe sandbox="allow-forms">` — sandbox sin `allow-top-navigation` bloquea el `top.location =` del víctima. Frame-busting JS muere silenciosamente, iframe queda vivo.

**Por qué chains son tan poderosos:**

- **OAuth + clickjack** = code theft → ATO. Solo necesitás `/authorize` frameable + redirect_uri controlado.
- **Self-XSS + clickjack** = stored XSS. Self-XSS solo no escala (necesita víctima ejecute en su consola). Clickjack convierte en exploit real.
- **SameSite=Lax + clickjack** = CSRF revivido. Lax bloquea cross-site POST pero permite top-level GET nav.

**Variantes mobile relevantes:**

Touchjacking abusa diferencias entre touch/mouse events en webviews. Tap delay, gesture recognition, fullscreen API mobile = vectors crecientes.

**Por qué CSP `frame-ancestors` mata X-Frame-Options:**

XFO = single value, no multi-origin, no path-level. CSP `frame-ancestors` soporta source-list completa, integra con CSP general, deprecates XFO en spec moderna. Modern browsers leen ambos pero CSP wins en conflict.

---

## Recursos

- [PortSwigger - Clickjacking](https://portswigger.net/web-security/clickjacking) — knowledge base + labs.
- [OWASP - Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html) — defense.
- [HackTricks - Clickjacking](https://book.hacktricks.xyz/pentesting-web/clickjacking) — referencia.
- [PayloadsAllTheThings - Clickjacking](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Clickjacking) — payloads.
- [Burp Clickbandit](https://portswigger.net/burp/documentation/desktop/tools/clickbandit) — auto-PoC generator.
- [MDN - X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) — header docs.
- [CSP Level 3 - frame-ancestors](https://www.w3.org/TR/CSP3/#directive-frame-ancestors) — spec.
- [Clickjacking original paper - Hansen & Grossman 2008](https://www.sectheory.com/clickjacking.htm) — foundational research.
- [UI Redressing Attacks (Marcus Niemietz)](https://www.nds.rub.de/research/publications/ui-redressing/) — academic deep dive.

---
