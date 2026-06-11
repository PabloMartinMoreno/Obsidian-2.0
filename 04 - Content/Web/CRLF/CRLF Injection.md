---
aliases:
  - CRLF Injection
  - CRLFi
  - Header Injection
tags:
  - vuln/crlf-injection
  - technique/initial-access
  - technique/exfiltration
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
  - "[[CRLF Injection - HTTP Header Injection]]"
  - "[[CRLF Injection - HTTP Response Splitting]]"
  - "[[CRLF Injection - Bypass de Sanitizacion]]"
  - "[[CRLF Injection - Vectores Especificos]]"
  - "[[CRLF Injection - Tooling]]"
  - "[[CRLF Injection - Deteccion y Reconocimiento]]"
  - "[[HTTP Request Smuggling]]"
  - "[[Web Cache Poisoning]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Burp Suite]]"
---
# CRLF Injection

---

## Cheatsheet

### 📋 HTTP Header Injection

````tabs
tab: **Set-Cookie Injection**
![[CRLF Injection - HTTP Header Injection#^crlfi-header-cookie]]

tab: **Cache Poisoning via Header**
![[CRLF Injection - HTTP Header Injection#^crlfi-header-cache]]

tab: **CSP Bypass via Injected Header**
![[CRLF Injection - HTTP Header Injection#^crlfi-header-csp]]

tab: **Custom Header Injection (X-*)**
![[CRLF Injection - HTTP Header Injection#^crlfi-header-custom]]
````

### 💉 HTTP Response Splitting

````tabs
tab: **Split Single Response en Two**
![[CRLF Injection - HTTP Response Splitting#^crlfi-split-twores]]

tab: **Inject Second Response con HTML/JS**
![[CRLF Injection - HTTP Response Splitting#^crlfi-split-secondres]]

tab: **XSS via Response Splitting**
![[CRLF Injection - HTTP Response Splitting#^crlfi-split-xss]]

tab: **Cache Poisoning via Splitting**
![[CRLF Injection - HTTP Response Splitting#^crlfi-split-cache]]
````

### 🔓 Bypass de Sanitización

````tabs
tab: **URL Encoding Variants**
![[CRLF Injection - Bypass de Sanitizacion#^crlfi-bypass-url]]

tab: **Double Encoding**
![[CRLF Injection - Bypass de Sanitizacion#^crlfi-bypass-double]]

tab: **Unicode / Charset Variants**
![[CRLF Injection - Bypass de Sanitizacion#^crlfi-bypass-unicode]]

tab: **Server-Specific Quirks**
![[CRLF Injection - Bypass de Sanitizacion#^crlfi-bypass-server]]

tab: **Header Folding (Obsolete)**
![[CRLF Injection - Bypass de Sanitizacion#^crlfi-bypass-folding]]
````

### 🎯 Vectores Específicos

````tabs
tab: **Email Header Injection (SMTP)**
![[CRLF Injection - Vectores Especificos#^crlfi-specific-smtp]]

tab: **Redirect Injection (Location)**
![[CRLF Injection - Vectores Especificos#^crlfi-specific-redirect]]

tab: **Log Injection / Log Poisoning**
![[CRLF Injection - Vectores Especificos#^crlfi-specific-log]]

tab: **HTTP Request Smuggling Combo**
![[CRLF Injection - Vectores Especificos#^crlfi-specific-hrs]]

tab: **Memcached / Redis / SMTP Newlines**
![[CRLF Injection - Vectores Especificos#^crlfi-specific-protocols]]
````

### 🛠️ Tooling

````tabs
tab: **crlfuzz (Go)**
![[CRLF Injection - Tooling#^crlfi-tool-crlfuzz]]

tab: **Burp Intruder + Payloads**
![[CRLF Injection - Tooling#^crlfi-tool-burp]]

tab: **Wordlists (PayloadsAllTheThings)**
![[CRLF Injection - Tooling#^crlfi-tool-wordlists]]

tab: **Manual curl con `--data-binary`**
![[CRLF Injection - Tooling#^crlfi-tool-curl]]

tab: **Otros Tools**
![[CRLF Injection - Tooling#^crlfi-tool-others]]
````

---

## Overview

**CRLF Injection** = atacante inyecta caracteres Carriage Return (`\r`, `%0d`) y Line Feed (`\n`, `%0a`) en input que se concatena a HTTP headers, response body, email, logs, o protocolos basados en `\r\n` separation. Permite header injection, response splitting, cache poisoning, email spoofing, log forgery, log4j/SMTP/Redis/Memcached attacks.

Vector clase A — descubierto en práctica desde inicios HTTP. Most modern frameworks reject CRLF en headers, pero apps custom o legacy frequently vulnerable. CVSS Medium-High según context (CWE-93 / CWE-113).

### Por qué CRLF es vector

HTTP utiliza `\r\n` para:
- Separar headers entre sí (`Header: value\r\n`).
- Separar headers de body (`\r\n\r\n`).
- Terminator chunked transfer encoding.

Otros protocolos también: SMTP, IMAP, POP3, FTP, IRC, Redis (RESP), Memcached. Cualquier app que concatene user input en estos contextos sin sanitizar es vulnerable.

### Diferencia con vulns relacionadas

| | **CRLF Injection** | **HTTP Request Smuggling** | **Web Cache Poisoning** |
|---|---|---|---|
| Vector | CR/LF en input concat'd | Front/back parser desync | Unkeyed input cached |
| Layer | Single server / output | Request-level inter-server | Cache layer |
| Atacante controls | Specific headers / body | Entire smuggled request | Specific cached headers/body |
| Common chain | Combine with cache, XSS, HRS | Cache poison combo | Combine with HHI / CRLF |

---

## Workflow de explotación

```
1. Identificar puntos donde input se refleja en headers:
   - Location: redirect endpoints
   - Set-Cookie: cookie reflection
   - Custom X-* headers
   - Email headers (SMTP)
   - Log entries

2. Probe inject con `%0d%0a`:
   - Add unique X-Probe header
   - Verify reflected en response

3. Test encoding variants:
   - Single, double, Unicode, etc
   - Identify what passes filter

4. Decidir vector:
   a. Header injection → cookie/cache/CSP bypass
   b. Response splitting → XSS / cache poisoning
   c. SMTP injection → email spoofing
   d. Log injection → forensics evasion / LFI to RCE
   e. HRS combo → smuggle internal requests
   f. Memcached/Redis injection → backend protocol abuse

5. Combine con otros vectors:
   - Cache poisoning + CRLF = mass XSS
   - HRS + CRLF = bypass front-end validation
   - HHI + CRLF = compound

6. Escalation:
   - Stand-alone: header injection (Medium).
   - Splitting + XSS: stored XSS persistente (High).
   - HRS combo: bypass auth (Critical).
   - Memcached/Redis injection: cache hijack (High).
```

---

## Detección rápida

### Recon activo

````tabs
tab: **Identificar Puntos de Header Reflexion**
![[CRLF Injection - Deteccion y Reconocimiento#^crlfi-detect-points]]

tab: **Probes con CR/LF**
![[CRLF Injection - Deteccion y Reconocimiento#^crlfi-detect-probes]]

tab: **Detectar Response Splitting Potencial**
![[CRLF Injection - Deteccion y Reconocimiento#^crlfi-detect-splitting]]
````

### Indicadores en código backend

```python
# Python — VULN (Flask)
@app.route('/redirect')
def redirect_handler():
    url = request.args.get('url')
    return Response(status=302, headers={'Location': url})  # ← BAD

# Python — SAFE (validate)
import re
if re.search(r'[\r\n]', url):
    return 'Invalid URL', 400
return Response(status=302, headers={'Location': url})

# Python — Werkzeug rejects automatically (modern Flask)
```

```javascript
// Node.js — VULN
app.get('/redirect', (req, res) => {
    res.setHeader('Location', req.query.url);  // ← Node validates! Throws TypeError if CRLF en value.
    res.status(302).end();
});

// Node.js — Manual concat (vulnerable)
app.get('/redirect', (req, res) => {
    res.write(`HTTP/1.1 302 Found\r\nLocation: ${req.query.url}\r\n\r\n`);  // ← BAD
    res.end();
});
```

```php
// PHP — VULN (older versions)
header("Location: " . $_GET['url']);  // pre-PHP 5.1.2 vulnerable

// PHP — SAFE (modern)
// PHP 5.1.2+ rejects CRLF en header() function automatically
```

### Probes mínimos

```bash
# 1. Standard CRLF probe
curl -sI "https://target/redirect?url=test%0d%0aX-Probe:%20FOUND" \
  | grep -i 'X-Probe'

# 2. Multiple encoding variants
for enc in '%0d%0a' '%0a' '%0d' '%250d%250a' '%E5%98%8A%E5%98%8D'; do
  curl -sI "https://target/redirect?url=test${enc}X-Test:%20$enc" | \
    grep -i 'X-Test' && echo "[+] $enc bypasses"
done

# 3. Set-Cookie inject probe
curl -sI "https://target/redirect?url=test%0d%0aSet-Cookie:%20pwn=1"

# 4. Auto-tooling
crlfuzz -u "https://target/redirect" -X "test"

# 5. Burp Active Scan covers CRLF
```

---

## Impacto

- **Session fixation** — inject Set-Cookie + force victim session.
- **Cache poisoning** — inject Cache-Control + persistent XSS.
- **CSP bypass** — inject permissive CSP → XSS escalation.
- **HSTS bypass** — inject `Strict-Transport-Security: max-age=0` → HTTPS downgrade.
- **XSS via response splitting** — inject script body.
- **Email spoofing** — Bcc / hidden recipients via SMTP CRLF.
- **Log forgery** — fake log entries → forensics evasion.
- **Log poisoning → LFI to RCE** — combine con LFI for full RCE.
- **Memcached / Redis abuse** — cache poisoning at protocol level.
- **HRS combo** — bypass front-end validation, smuggle requests.
- **Compound chains** — combine con HHI / Cache / OR / XSS = high CVSS.

---

## Mitigación (defender)

- **Reject CRLF en input strictly** — validate todos user inputs:
  ```python
  if any(c in user_input for c in '\r\n'):
      raise ValueError('Invalid input')
  ```
- **Use safe APIs** — `Response.headers['X'] = value` framework's API auto-validates.
- **Don't concatenate user input en header construction**:
  ```javascript
  // BAD
  res.write(`Header: ${userInput}\r\n`);
  // GOOD
  res.setHeader('Header', userInput);  // Auto-validates en modern frameworks
  ```
- **Modern frameworks reject CRLF en header values** — verify framework version.
- **Encode HTML entities en body output** — defense en depth si splitting occurs.
- **WAF rules anti-CRLF** — ModSecurity OWASP CRS includes CRLF blockers.
- **HTTP/2 binary framing** — inherently prevents text-based splitting (only header field name/value pairs).
- **Strict header validation en custom HTTP libs** — verify library reject newlines.
- **Per-protocol input validation** — SMTP, Redis, Memcached: validate newlines.
- **Use parameterized libraries** — SMTP: nodemailer, Python email — auto-validates.
- **Logging with structured logs** — JSON logs immune to CRLF visual forging (still need escape).
- **Separate atomic actions** — Per-line logs ensure atomic write.
- **Audit en CI/CD** — automated CRLF tests.

---

## Para entender CRLF Injection

**Por qué CRLF es tan importante:**

HTTP/1.x es text-based protocol. Cada line termina con `\r\n`. Headers separados de body por `\r\n\r\n`. Si atacante inyecta `\r\n` en value que se concatena en header construction, atacante:
- Termina header line prematurely.
- Inicia new header (atacante-controlled).
- O termina headers section + injects body (response splitting).

Si app valida URL but not CRLF en redirect URL, atacante: `?url=ok\r\nInjected-Header: value` → response includes injected header.

**Diferencia entre header injection y response splitting:**

- **Header injection**: inject extra HTTP headers en response. Limited a header-level effects.
- **Response splitting**: inject `\r\n\r\n` (empty line) → app's body becomes "second response". Atacante controls full second HTTP response, including body con HTML/JS.

Splitting más severo. Modern protections cover both, but legacy apps still vulnerable.

**Por qué HTTP/2 es immune:**

HTTP/2 uses binary framing — headers are HPACK-encoded structured data, not text. Header name/value pair fields cannot contain CRLF (they're separate fields). HTTP/1.1 to HTTP/2 downgrade may reintroduce vector (HRS-style).

**Modern apps mostly mitigate:**

Frameworks (Express, Flask, Django, Spring, etc.) all validate header values for CRLF en their APIs. Custom apps con manual header construction (CGI, raw HTTP) more vulnerable. Same with email APIs (`mail()` PHP pre-5.1.2 vulnerable, modern OK).

---

## Recursos

- [PortSwigger - CRLF Injection](https://portswigger.net/research/) — research articles.
- [PortSwigger - HTTP Response Splitting](https://portswigger.net/web-security/web-cache-poisoning) — adjacent.
- [PayloadsAllTheThings - CRLF Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/CRLF%20Injection) — payloads.
- [HackTricks - CRLF (0d 0a) Injection](https://book.hacktricks.xyz/pentesting-web/crlf-0d-0a) — referencia.
- [OWASP - HTTP Response Splitting](https://owasp.org/www-community/attacks/HTTP_Response_Splitting) — overview.
- [OWASP - Carriage Return Line Feed Injection](https://owasp.org/www-community/vulnerabilities/CRLF_Injection) — overview.
- [crlfuzz](https://github.com/dwisiswant0/crlfuzz) — Go fuzzer.
- [CWE-93 CRLF Injection](https://cwe.mitre.org/data/definitions/93.html) — MITRE.
- [CWE-113 HTTP Response Splitting](https://cwe.mitre.org/data/definitions/113.html) — MITRE.
- [Spanning Tree Explorer - CRLF](https://github.com/EdOverflow/can-i-take-over-xyz) — adjacent reference.
- [PHP `header()` security note](https://www.php.net/manual/en/function.header.php) — PHP docs CRLF protection.

---
