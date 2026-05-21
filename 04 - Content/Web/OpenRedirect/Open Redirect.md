---
aliases:
  - Open Redirect
  - Unvalidated Redirect
  - URL Redirection
  - Forward Vulnerability
tags:
  - type/vulnerability
  - vuln/open-redirect
  - technique/initial-access
  - technique/credential-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[Open Redirect - Vectores Basicos]]"
  - "[[Open Redirect - Bypass de Validacion]]"
  - "[[Open Redirect - Vectores Especificos]]"
  - "[[Open Redirect - Chains con Otras Vulns]]"
  - "[[Open Redirect - Tooling]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Web Cache Poisoning]]"
  - "[[Burp Suite]]"
---
# Open Redirect

***

## Cheatsheet

### 🎯 Vectores Básicos

````tabs
tab: **URL Absoluta Completa**
![[Open Redirect - Vectores Basicos#^or-vector-absolute]]

tab: **Protocol-Relative URLs**
![[Open Redirect - Vectores Basicos#^or-vector-protocol-relative]]

tab: **Scheme Switching**
![[Open Redirect - Vectores Basicos#^or-vector-scheme]]

tab: **Backslash / Control Char Tricks**
![[Open Redirect - Vectores Basicos#^or-vector-control]]
````

### 🔓 Bypass de Validación

````tabs
tab: **Whitelist Domain Match**
![[Open Redirect - Bypass de Validacion#^or-bypass-whitelist]]

tab: **URL Parser Confusion (`@`, `#`, `?`)**
![[Open Redirect - Bypass de Validacion#^or-bypass-parser]]

tab: **Subdomain Prefix/Suffix Abuse**
![[Open Redirect - Bypass de Validacion#^or-bypass-subdomain]]

tab: **Encoding Tricks (URL / Unicode)**
![[Open Redirect - Bypass de Validacion#^or-bypass-encoding]]
````

### 💉 Vectores Específicos

````tabs
tab: **OAuth `redirect_uri` Injection**
![[Open Redirect - Vectores Especificos#^or-specific-oauth]]

tab: **SAML Response Redirect**
![[Open Redirect - Vectores Especificos#^or-specific-saml]]

tab: **Login / Logout Flow**
![[Open Redirect - Vectores Especificos#^or-specific-login]]

tab: **Email Magic Link Redirect**
![[Open Redirect - Vectores Especificos#^or-specific-magiclink]]

tab: **JS-Based Client-Side Redirect**
![[Open Redirect - Vectores Especificos#^or-specific-js]]
````

### 🔗 Chains con Otras Vulns

````tabs
tab: **SSRF via Redirect Chain**
![[Open Redirect - Chains con Otras Vulns#^or-chain-ssrf]]

tab: **XSS via `javascript:` / `data:`**
![[Open Redirect - Chains con Otras Vulns#^or-chain-xss]]

tab: **Token Leak via Referer**
![[Open Redirect - Chains con Otras Vulns#^or-chain-referer]]

tab: **OAuth Code Stealing**
![[Open Redirect - Chains con Otras Vulns#^or-chain-oauth]]

tab: **Cache Poisoning Combo**
![[Open Redirect - Chains con Otras Vulns#^or-chain-cache]]
````

### 🛠️ Tooling

````tabs
tab: **OpenRedireX**
![[Open Redirect - Tooling#^or-tool-openredirex]]

tab: **Burp Active Scanner + Param Miner**
![[Open Redirect - Tooling#^or-tool-burp]]

tab: **Wordlists (PayloadsAllTheThings)**
![[Open Redirect - Tooling#^or-tool-wordlists]]

tab: **Manual curl / Custom Scripts**
![[Open Redirect - Tooling#^or-tool-manual]]
````

___

## Overview

**Open Redirect (Unvalidated Redirect)** = vulnerabilidad donde aplicación redirige usuario a URL controlada por atacante via parámetro reflejado sin validación. Solo es **bug medio** stand-alone (UX phishing), pero **alto impacto en chains** (OAuth code theft, SSRF, XSS, Referer leak).

OWASP Top 10 históricamente — A10 en 2013, removed después por considerarse bajo impacto solo. Pero el resurgimiento de OAuth flows, SSRF chains, y cache poisoning combos lo mantiene relevante.

### Cuándo es alto impacto

| Solo Open Redirect | Chain con Open Redirect |
|---|---|
| UX phishing (CVSS Low) | OAuth ATO (CVSS High) |
| Limited impact | SSRF bypass de whitelist (CVSS High) |
| Sometimes accepted | XSS via javascript: (CVSS High) |
| Reportable to track | Token leak via Referer (CVSS Medium) |

### Diferencia con SSRF

| | **Open Redirect** | **SSRF** |
|---|---|---|
| Quién hace request | Cliente (browser) | Server |
| Vector | Reflected URL en Location header / JS | Server-side fetch URL |
| Impacto inicial | Phishing destino | Internal access |
| Combine | OAuth, XSS, Referer leak | Cloud metadata, port scan |

___

## Workflow de explotación

```
1. Identificar endpoints con redirect param:
   - Login: ?next= ?return=
   - Logout: ?next=
   - OAuth: ?redirect_uri=
   - Generic: ?url= ?redirect= ?goto=

2. Probe con URL absoluta:
   - https://attacker.com → Location: https://attacker.com? = vuln
   - Si bloqueado, probar bypasses.

3. Identificar tipo de validation:
   - Whitelist exact → bypass via subdomain abuse
   - Whitelist prefix → suffix attacker domain
   - Whitelist substring → atacante composite domain
   - URL parser → @, #, ? confusion
   - Scheme blacklist → encoding bypass

4. Confirmar redirect:
   - HTTP 30x con Location: header
   - Meta refresh
   - JS location.href

5. Decidir explotación:
   a. Stand-alone phishing → reportable bug.
   b. OAuth code theft → ATO (high impact).
   c. SSRF chain → internal access.
   d. XSS via javascript: → script execution.
   e. Token leak via Referer → reset / OAuth code.
   f. Cache poisoning → mass victim impact.

6. Document chain con final impact:
   - PoC URL
   - Step-by-step exploit
   - Final state (ATO, RCE, etc).
```

___

## Detección rápida

### Indicadores en código backend

```python
# Python — VULN
@app.route('/login')
def login():
    next_url = request.args.get('next', '/')
    if user_authenticated:
        return redirect(next_url)  # ← unvalidated

# Python — SAFE
def is_safe_url(target):
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and \
           ref_url.netloc == test_url.netloc

if is_safe_url(next_url):
    return redirect(next_url)
else:
    return redirect('/')
```

```javascript
// Node.js — VULN
app.get('/login', (req, res) => {
    res.redirect(req.query.next);  // ← direct from input
});

// Node.js — SAFE
const allowedHosts = ['target.com', 'app.target.com'];
const url = new URL(req.query.next, 'https://target.com');
if (allowedHosts.includes(url.hostname)) {
    res.redirect(url.toString());
} else {
    res.redirect('/');
}
```

### Probes mínimos

```bash
# 1. Basic test
curl -sI 'https://target/login?next=https://attacker.com' | grep -i location

# 2. Multiple bypasses
for p in 'https://attacker.com' '//attacker.com' '\\\\attacker.com' \
         'https://target.com@attacker.com' 'https://target.com.attacker.com'; do
  ENCODED=$(printf '%s' "$p" | jq -sRr @uri)
  echo "=== $p ==="
  curl -sI "https://target/login?next=$ENCODED" | grep -i location
done

# 3. JS-based
curl -s 'https://target/login?next=javascript:alert(1)' | \
  grep -oE 'location\s*[=.][^;]*'

# 4. Auto-tooling
python openredirex.py -u "https://target/login?next=FUZZ" -p payloads.txt
```

___

## Impacto

- **Phishing UX** — link parece legit, redirect lleva a fake login.
- **OAuth ATO** — redirect_uri controlled = code stolen = full account compromise.
- **SSRF bypass** — redirect chain → internal IPs.
- **XSS** — javascript:/data: scheme + reflected = script execution.
- **Referer-based token leak** — sensitive URL params leaked.
- **Cache poisoning combo** — mass victim affected.
- **Subdomain takeover combo** — atacante controla "trusted" subdomain.
- **MFA / 2FA bypass via flow manipulation** — redirect skips check.
- **Brand reputation damage** — atacante usa target as redirect platform.

___

## Mitigación (defender)

- **Whitelist exacto de URLs** — comparar string match con allowlist.
- **Parsear URL correctamente** — usar lib estándar (no regex DIY).
- **Validar host completo, no substring**:
  ```python
  parsed = urlparse(target)
  if parsed.netloc != 'target.com':
      reject()
  ```
- **Solo paths relativos** — si todos los redirects son intra-app, validar `/path` solamente:
  ```python
  if not target.startswith('/'):
      reject()
  if target.startswith('//'):
      reject()  # protocol-relative
  ```
- **Reject schemes peligrosos** — `javascript:`, `data:`, `vbscript:`, etc.
- **Indirect mapping** — usar IDs en lugar de URLs:
  ```
  ?redirect=login (in mapping table)
  → app maps "login" → /dashboard
  ```
- **Confirmation page** — antes de redirect cross-domain, mostrar warning:
  > "You are leaving target.com. Continue to https://attacker.com?"
- **OAuth strict redirect_uri**:
  - Pre-registered URIs only.
  - Exact match (no patterns).
  - HTTPS only.
  - PKCE for public clients.
- **State parameter** en OAuth — random, validated → CSRF defense.
- **Referrer-Policy: strict-origin** — prevent token leaks.
- **Browser CSP** — restrict frame-ancestors / script-src.
- **HSTS** — force HTTPS, prevent downgrade.

___

## Para entender Open Redirect

**Por qué los devs lo introducen:**

Patrón común: usuario completa acción en URL A, app debe redirigir post-action a URL B (donde usuario quería ir originalmente). App stores B en `?next=B` antes del flow, redirige después.

Ejemplo: usuario click `/admin`, app detecta no auth → redirige a `/login?next=/admin`. Después de login, app `redirect(next_url)`.

Si `next_url` no validado, atacante manda link `/login?next=https://attacker.com`. Usuario sigue link sin notar atacante's URL.

**Por qué browsers permiten redirect a otros dominios:**

HTTP `Location:` header diseñado para soportar cross-domain (CDN moves, domain changes). RFC 7231 explícitamente lo permite. Browsers no pueden saber si redirect es trusted o no — responsabilidad de la app.

**Por qué chains son tan poderosos:**

Open redirect solo no es high. Pero como puente:
- OAuth + open redirect = code stolen.
- XSS + open redirect (javascript:) = script execution.
- SSRF whitelist + open redirect = bypass.
- Cache poisoning + open redirect = mass impact.

Cada combo eleva el CVSS final. Bug bounty programs cada vez más reconocen el chain potential aunque stand-alone sea low.

**OAuth en particular:**

Authorization Code grant flow:
1. App pide `code` al IdP con `redirect_uri=https://target.com/cb`.
2. User authenticated → IdP redirige a `redirect_uri` con `?code=XYZ`.
3. App exchanges `code` por `access_token` (con client_secret).

Si atacante puede inyectar `redirect_uri=https://attacker.com/cb`, recibe el `code`. Si client_secret es público (mobile apps, public clients) o atacante lo conoce, puede exchange el code → access_token → ATO completo.

___

## Recursos

- [PortSwigger - Open Redirection](https://portswigger.net/kb/issues/00500100_open-redirection-reflected-dom-based) — knowledge base.
- [PayloadsAllTheThings - Open Redirect](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Open%20Redirect) — payloads.
- [HackTricks - Open Redirect](https://book.hacktricks.xyz/pentesting-web/open-redirect) — referencia.
- [OWASP - Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) — defense.
- [OpenRedireX](https://github.com/devanshbatham/OpenRedireX) — fuzzer.
- [URL Parsers Inconsistencies (Black Hat 2017)](https://www.blackhat.com/docs/us-17/thursday/us-17-Tsai-A-New-Era-Of-SSRF-Exploiting-URL-Parser-In-Trending-Programming-Languages.pdf) — paper crítico de Orange Tsai.
- [OAuth 2.0 Threat Model (RFC 6819)](https://datatracker.ietf.org/doc/html/rfc6819) — OAuth security considerations.
- [URL Living Standard (WHATWG)](https://url.spec.whatwg.org/) — spec referencia.
- [Single Sign-On Security (Aaron Parecki)](https://aaronparecki.com/oauth-2-simplified/) — OAuth 2.0 deep dive.

***
