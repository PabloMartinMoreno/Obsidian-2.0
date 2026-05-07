---
aliases:
  - HTML Injection
  - HTMLi
  - HTML Markup Injection
  - Scriptless HTML Injection
tags:
  - type/vulnerability
  - vuln/html-injection
  - technique/initial-access
  - technique/exfiltration
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: Hub
linked:
  - "[[HTML Injection - Vectores Comunes]]"
  - "[[HTML Injection - Inyeccion Sin Script]]"
  - "[[HTML Injection - Bypass de Filtros]]"
  - "[[HTML Injection - Chains con Otras Vulns]]"
  - "[[HTML Injection - Tooling]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Web Cache Poisoning]]"
  - "[[Server-Side Template Injection (SSTI)]]"
  - "[[Burp Suite]]"
---
# HTML Injection

***

## Cheatsheet

### 🎯 Vectores Comunes

````tabs
tab: **Phishing via Fake Form / Login**
![[HTML Injection - Vectores Comunes#^htmli-vector-phishing]]

tab: **Defacement / Page Modification**
![[HTML Injection - Vectores Comunes#^htmli-vector-deface]]

tab: **SEO / Social Engineering Links**
![[HTML Injection - Vectores Comunes#^htmli-vector-seo]]

tab: **Visible Content Injection**
![[HTML Injection - Vectores Comunes#^htmli-vector-content]]

tab: **Hidden Elements / Iframe Abuse**
![[HTML Injection - Vectores Comunes#^htmli-vector-hidden]]
````

### 🚫 Inyección Sin Script (no-JS)

````tabs
tab: **Image `src` Exfil (Referer Leak)**
![[HTML Injection - Inyeccion Sin Script#^htmli-noscript-image]]

tab: **Form Action Redirect**
![[HTML Injection - Inyeccion Sin Script#^htmli-noscript-form]]

tab: **Meta Refresh**
![[HTML Injection - Inyeccion Sin Script#^htmli-noscript-meta]]

tab: **`<base href>` Hijacking**
![[HTML Injection - Inyeccion Sin Script#^htmli-noscript-base]]

tab: **`<link rel>` Manipulation**
![[HTML Injection - Inyeccion Sin Script#^htmli-noscript-linkrel]]

tab: **CSS-Only Attacks**
![[HTML Injection - Inyeccion Sin Script#^htmli-noscript-css]]
````

### 🔓 Bypass de Filtros

````tabs
tab: **HTML Entity Encoding**
![[HTML Injection - Bypass de Filtros#^htmli-bypass-entity]]

tab: **URL / Unicode Encoding**
![[HTML Injection - Bypass de Filtros#^htmli-bypass-url]]

tab: **Tag/Attribute Case Manipulation**
![[HTML Injection - Bypass de Filtros#^htmli-bypass-case]]

tab: **Whitespace Tricks**
![[HTML Injection - Bypass de Filtros#^htmli-bypass-whitespace]]

tab: **Comment Injection**
![[HTML Injection - Bypass de Filtros#^htmli-bypass-comment]]
````

### 🔗 Chains con Otras Vulns

````tabs
tab: **HTML to XSS Upgrade**
![[HTML Injection - Chains con Otras Vulns#^htmli-chain-xss]]

tab: **Cache Poisoning Combo**
![[HTML Injection - Chains con Otras Vulns#^htmli-chain-cache]]

tab: **HTML Email Injection**
![[HTML Injection - Chains con Otras Vulns#^htmli-chain-email]]

tab: **PDF / Print Template Injection**
![[HTML Injection - Chains con Otras Vulns#^htmli-chain-pdf]]

tab: **CSRF + HTML Injection Chain**
![[HTML Injection - Chains con Otras Vulns#^htmli-chain-csrf]]
````

### 🛠️ Tooling

````tabs
tab: **Burp Intruder con HTML Wordlists**
![[HTML Injection - Tooling#^htmli-tool-burp-intruder]]

tab: **PayloadsAllTheThings**
![[HTML Injection - Tooling#^htmli-tool-wordlists]]

tab: **Manual Review (Input/Output Mapping)**
![[HTML Injection - Tooling#^htmli-tool-manual-review]]

tab: **DOM Invader (Burp)**
![[HTML Injection - Tooling#^htmli-tool-dom-invader]]

tab: **Otros Tools y Scripts**
![[HTML Injection - Tooling#^htmli-tool-others]]
````

___

## Overview

**HTML Injection (HTMLi)** = atacante inyecta markup HTML arbitrario en página renderizada por la app sin escape adecuado. Subset/precursor de XSS — donde XSS ejecuta JavaScript, HTML Injection se limita a tags y atributos.

Frecuentemente subestimada como "low severity", pero permite **phishing persistente sin scripts**, defacement, exfiltración via Referer leak, base href hijacking, CSS keyloggers — todos sin disparar CSP ni `<script>` filters.

### Diferencia con XSS

| | **HTML Injection** | **XSS** |
|---|---|---|
| Vector | HTML markup | JavaScript en HTML |
| Lenguaje | HTML / CSS | JS + HTML |
| Bypass de CSP | ✓ (CSS no afecta script-src) | Bloqueado por CSP típico |
| `<script>` blocked | Aún explotable | Necesita workaround |
| Cookie theft | Indirect (Referer leak) | Direct (`document.cookie`) |
| Persistencia | Stored HTML inject | Stored XSS = mucho peor |
| CVSS | Medium típico | High / Critical |
| Defense | HTML escape | + CSP + sanitization comprehensive |

HTML Injection puede **escalar a XSS** si filtros incompletos permiten event handlers (`onerror`, `onload`) en tags allowed.

___

## Workflow de explotación

```
1. Identificar puntos reflejados:
   - Search query, comments, profile, error pages
   - Headers reflejados (User-Agent, Referer)
   - URL params + cookies + body fields

2. Probe con tags inocuos:
   - <b>TEST</b> → bold rendered = inj activa
   - <img src=x> → broken image = active
   - Compare con &lt;b&gt;TEST&lt;/b&gt; (escaped) = safe

3. Differentiate from XSS:
   - <script>alert(1)</script> blocked but <img> works = HTML inj only
   - <img onerror=alert(1)> works = upgrade to XSS

4. Identify filter scope:
   - Whitelist tags? (only <b>, <i> permitted)
   - Blacklist? (specific tags blocked)
   - Sanitizer (DOMPurify) strips events?

5. Apply bypasses si filter active:
   - HTML entity encoding (&#60; for <)
   - URL encoding (%3C)
   - Case manipulation
   - Whitespace tricks
   - Comment injection

6. Decidir vector:
   a. Phishing via fake form → captura creds.
   b. Defacement → reputational damage.
   c. SEO spam links → search engine abuse.
   d. Image src exfil → Referer leak (sensitive URLs).
   e. Base href hijack → asset rerouting.
   f. CSS exfil → char-by-char data extraction.

7. Chain potential:
   - HTML inject + event handler = XSS.
   - HTML inject + cache poisoning = mass impact.
   - HTML inject + email = spear phishing.
   - HTML inject + PDF gen = SSRF + file read.
   - HTML inject + CSRF = action automation.
```

___

## Detección rápida

### Indicadores en código backend

```python
# Python — VULN (Jinja2 sin escape)
template = Template("Hello {{ name }}", autoescape=False)  # ← BAD
return template.render(name=user_input)

# Python — SAFE (autoescape)
template = Template("Hello {{ name }}", autoescape=True)
# `<` becomes `&lt;` automatically
```

```javascript
// React — VULN
return <div dangerouslySetInnerHTML={{__html: userInput}}/>;  // ← BAD

// React — SAFE
return <div>{userInput}</div>;  // Auto-escaped
```

```php
// PHP — VULN
echo $_GET['name'];  // ← BAD

// PHP — SAFE
echo htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8');
```

### Probes mínimos

```bash
# 1. Bold tag probe
curl -s 'https://target/search?q=<b>TEST</b>' | grep -oE '<b>TEST</b>|&lt;b&gt;TEST&lt;/b&gt;'

# 2. Image with Collaborator URL
curl 'https://target/search?q=<img src="https://canary.oast.fun/x">'
# Verify Collaborator received request

# 3. Reflection vs escape detection
curl -s 'https://target/?in=A<B>C' | grep -E 'A<B>C|A&lt;B&gt;C'

# 4. Differentiate XSS
curl 'https://target/search?q=<img src=x onerror=alert(1)>'
# If onerror filtered → HTML inj only

# 5. Stored injection
curl -X POST 'https://target/comments' -d 'text=<b>STORED-MARKER</b>'
curl 'https://target/comments' | grep STORED-MARKER
```

___

## Impacto

- **Phishing** — fake login forms con stolen creds via attacker form action.
- **Defacement** — reputational damage, content modification.
- **Referer leak** — sensitive URL params (tokens, IDs) leaked via image src.
- **Asset hijack** — `<base href>` reroutes all relative URLs.
- **CSS keyloggers** — char-by-char input exfiltration sin JS.
- **SEO spam** — backlink injection.
- **Stored persistent UX corruption** — stored injection persiste indefinidamente.
- **Email phishing** — HTML email rendering forced.
- **PDF SSRF / file read** — backend PDF render con HTML inj loads internal resources.
- **CSRF automation** — auto-submit forms en authenticated context.
- **Upgrade to XSS** si event handlers allowed → script execution → full compromise.

___

## Mitigación (defender)

- **HTML entity escape on output** — siempre que data del user aparezca en HTML context:
  ```python
  # Jinja2 (auto)
  {{ user_input }}  # autoescape on
  
  # Manual
  import html
  html.escape(user_input)
  ```
- **Context-aware escaping** — different contexts (HTML body, attribute, JS, CSS, URL) need different escapes.
- **Strict CSP** — `script-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`.
- **DOMPurify-style sanitizer** — for rich text fields:
  ```javascript
  const clean = DOMPurify.sanitize(userInput, {
    ALLOWED_TAGS: ['b', 'i', 'u'],
    ALLOWED_ATTR: []
  });
  ```
- **Markdown — output safe HTML by default** — `marked.parse(input, {sanitize: true})`.
- **Strict tag whitelist** — only `<b>`, `<i>`, `<u>`, etc — no `<script>`, `<iframe>`, `<style>`, `<base>`, `<meta>`.
- **Strict attribute whitelist** — no `on*` events, no `style`, no `href` (or only to specific schemes).
- **Force HTTPS for resources** — `img-src https:` CSP.
- **Subresource Integrity (SRI)** — hashes for external scripts/styles.
- **`Referrer-Policy: strict-origin`** — limit Referer leakage.
- **HTML email — use templates** sin user-controlled HTML embedded.
- **PDF generation** — render con sandboxed engine (puppeteer-no-sandbox dangerous).
- **Audit con automated tools** — Burp Active Scan + DOM Invader.

___

## Para entender HTML Injection

**Por qué se subestima:**

HTML Injection often ignored porque "no JS = no real damage". Pero:
1. **Phishing** es viable sin JS — fake form captura credentials.
2. **Defacement** sigue siendo daño reputacional.
3. **Referer leak** filtra tokens / session IDs / sensitive URL params.
4. **CSS keyloggers** exfiltran data sin scripts.
5. **PDF generation backends** typically ejecutan HTML completo — server-side SSRF + file read.
6. **Email rendering** es altamente persistent y hard to revoke.

**Por qué CSP no protege:**

CSP es script-first defense. HTML inj sin scripts queda fuera del scope:
- `<base href="evil">` no afecta CSP (no script).
- `<style>... CSS exfil ...</style>` ignora CSP `style-src` si `unsafe-inline`.
- `<img src="evil/log">` cumple `img-src https:` (atacante usa HTTPS).
- `<link rel="stylesheet" href="evil">` cumple `style-src` si `unsafe-inline`.

Modern CSP can include `default-src` y `style-src` strict, pero incluso así HTML inj non-style attacks (form action, base href, etc) bypassa.

**Diferencia con XSS attack surface:**

XSS necesita ejecutar JS — filter strict de `<script>`, event handlers, eval-like. HTML Injection necesita solo render HTML — filter de tags y atributos. Filter incompleto típicamente cubre XSS pero deja HTML inj.

**Por qué stored injection es worst:**

Reflected HTML inj requiere atacante envíe link al victim. Stored persists across all visits. Stored phishing form en comments público = víctimas constantes.

___

## Recursos

- [PortSwigger - Cross-Site Scripting](https://portswigger.net/web-security/cross-site-scripting) — covers HTML inj subset.
- [PayloadsAllTheThings - HTML Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/HTML%20Injection) — payloads.
- [HackTricks - HTML Injection](https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting) — referencia.
- [OWASP - HTML Injection Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) — defenses.
- [DOMPurify](https://github.com/cure53/DOMPurify) — sanitizer library.
- [CSS Exfiltration via Selectors (Mike West)](https://blog.mikewest.org/2008/04/cross-site-stealing-with-css-attribute-selectors/) — paper.
- [CSP Reference](https://content-security-policy.com/) — CSP guide.
- [Black Hat 2017 - HTML5 Security](https://www.blackhat.com/docs/us-17/) — modern HTML attacks.
- [JSFuck](https://jsfuck.com/) — JS-only obfuscation (related).
- [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) — SRI.

***
