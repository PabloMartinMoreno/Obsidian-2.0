---
aliases:
  - "Contaminación de Parámetros"
  - HTTP Parameter Pollution
  - HPP
  - Parameter Pollution
tags:
  - vuln/hpp
  - technique/initial-access
  - technique/defense-evasion
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
  - "[[HPP - Server-Side]]"
  - "[[HPP - Client-Side]]"
  - "[[HPP - Per-Stack Behavior]]"
  - "[[HPP - Bypass de Validacion]]"
  - "[[HPP - Tooling]]"
  - "[[SQL Injection (SQLi)]]"
  - "[[Mass Assignment]]"
  - "[[CRLF Injection]]"
  - "[[Burp Suite]]"
---
# HTTP Parameter Pollution

***

## Cheatsheet

### 🌐 Server-Side HPP

````tabs
tab: **Auth / Access Control Bypass**
![[HPP - Server-Side#^hpp-server-auth]]

tab: **WAF / Filter Bypass via Param Split**
![[HPP - Server-Side#^hpp-server-waf]]

tab: **Logic Flow Manipulation**
![[HPP - Server-Side#^hpp-server-logic]]

tab: **SQLi via Concatenation**
![[HPP - Server-Side#^hpp-server-sqli]]

tab: **Mass Assignment Combo**
![[HPP - Server-Side#^hpp-server-mass-assign]]
````

### 💻 Client-Side HPP

````tabs
tab: **URL Manipulation en DOM**
![[HPP - Client-Side#^hpp-client-url]]

tab: **Form Action / Hidden Field Hijack**
![[HPP - Client-Side#^hpp-client-form]]

tab: **Encoded Param Confusion**
![[HPP - Client-Side#^hpp-client-encoded]]

tab: **JS-Based Parsing Differences**
![[HPP - Client-Side#^hpp-client-js]]
````

### 🏛️ Per-Stack Behavior

````tabs
tab: **PHP (Last Wins)**
![[HPP - Per-Stack Behavior#^hpp-stack-php]]

tab: **ASP.NET (Concatenation)**
![[HPP - Per-Stack Behavior#^hpp-stack-aspnet]]

tab: **Java (First Wins / Array)**
![[HPP - Per-Stack Behavior#^hpp-stack-java]]

tab: **Python Flask / Django**
![[HPP - Per-Stack Behavior#^hpp-stack-python]]

tab: **Node.js / Express**
![[HPP - Per-Stack Behavior#^hpp-stack-node]]

tab: **Ruby on Rails**
![[HPP - Per-Stack Behavior#^hpp-stack-ruby]]
````

### 🔓 Bypass de Validación

````tabs
tab: **Encoding Tricks**
![[HPP - Bypass de Validacion#^hpp-bypass-encoding]]

tab: **Splitting Param Values**
![[HPP - Bypass de Validacion#^hpp-bypass-split]]

tab: **Array Notation**
![[HPP - Bypass de Validacion#^hpp-bypass-array]]

tab: **Mixed Input Sources**
![[HPP - Bypass de Validacion#^hpp-bypass-multi-source]]
````

### 🛠️ Tooling

````tabs
tab: **Burp Intruder + Param Miner**
![[HPP - Tooling#^hpp-tool-burp]]

tab: **Custom curl Scripts**
![[HPP - Tooling#^hpp-tool-curl]]

tab: **Wordlists**
![[HPP - Tooling#^hpp-tool-wordlists]]

tab: **Per-Stack Test Harness**
![[HPP - Tooling#^hpp-tool-harness]]
````

___

## Overview

**HTTP Parameter Pollution (HPP)** = atacante envía request con multiple values del mismo parameter (`?a=1&a=2`). Cada framework / stack maneja duplicates diferente: PHP/Ruby toma último, Java/Python toma primero, ASP.NET concatena con coma, Node.js usa array. Diferencias entre frontend (proxy/WAF) y backend permiten:
- Bypass de WAF / filter (split malicious payload).
- Auth / access control bypass.
- SQLi / XSS / command injection con fragmented payload.
- Mass Assignment con duplicate field.
- Logic flow manipulation.

OWASP Testing Guide — OTG-INPVAL-04. CWE-235. Vector clase B/A según context.

### Por qué surge

HTTP/1.1 spec NO mandata behavior canonical para duplicate params. Cada framework / library implementa su propia lógica:
- Single-string with last value (PHP, Ruby).
- Single-string with first value (Java, Python first).
- Concatenated with comma (ASP.NET).
- Array (Node.js qs).

Si frontend (WAF) y backend implementan distinto → atacante exploita differential.

### Diferencia con vulns relacionadas

| | **HPP** | **CRLF Injection** | **HRS** |
|---|---|---|---|
| Vector | Duplicate params | CR/LF in headers | Front/back parser desync |
| Layer | Param parsing | HTTP header construction | Whole-request parsing |
| Bypass | WAF param-level | Header injection | Smuggle requests |
| Impact | Logic / SQLi / WAF bypass | Cookie / cache / XSS | Mass cache poison |

___

## Workflow de explotación

```
1. Identificar endpoint con params:
   - Search, filter, login, admin

2. Probe duplicate behavior:
   - ?a=1&a=2 → which value used?
   - First / last / concat / array

3. Identify stack:
   - Headers (X-Powered-By, Server)
   - Behavior testing
   - Stack-specific patterns

4. Identify frontend (WAF, proxy):
   - Cloudflare, Akamai, etc
   - Differential between front/back

5. Decidir vector:
   a. WAF bypass (split malicious payload)
   b. Auth bypass (front validates first, back uses second)
   c. SQLi (ASP.NET concat for fragmented SQL)
   d. Mass Assignment (duplicate field with privesc)
   e. Logic manipulation (multi-step flows)

6. Encoding bypasses:
   - URL-encoded duplicates
   - Array notation
   - Mixed sources

7. Combine con otras vulns:
   - HPP + SQLi
   - HPP + Mass Assignment
   - HPP + auth bypass
```

___

## Detección rápida

### Indicadores en código backend

```python
# Python — VULN potential
@app.route('/transfer')
def transfer():
    user = request.args.get('user')   # First wins (Werkzeug default)
    if user == 'admin':
        require_auth()
    do_transfer(request.args.getlist('user')[-1])  # Last item
    # ↑ Differential: auth on first, action on last
```

```php
// PHP — Last wins (default)
<?php
$user = $_GET['user'];  // Last value if duplicate
// If WAF inspects first param, backend uses last → bypass
?>
```

```csharp
// ASP.NET — Concatenation
var user = Request.QueryString["user"];
// Returns "value1,value2" — fragmented potential
```

### Probes mínimos

```bash
# 1. Stack behavior probe
curl -s 'https://target/echo?a=FIRST&a=LAST' | head

# 2. WAF bypass probe (ASP.NET style)
curl -s 'https://target/search?q=SELECT&q=*&q=FROM&q=users'

# 3. Auth bypass probe
curl -s 'https://target/admin?user=admin&user=attacker'

# 4. Mixed source
curl -s -X POST -d 'a=BODY' 'https://target/?a=QUERY'

# 5. Array notation
curl -s 'https://target/?a[]=1&a[]=2'

# 6. Burp Param Miner: Right-click → Guess JSON parameters
```

___

## Impacto

- **Auth bypass** — front validates one value, back processes another.
- **WAF / filter bypass** — split malicious payload across duplicate params.
- **SQLi via concat** — ASP.NET concatenates duplicates → SQL fragments.
- **XSS / command injection** — fragmented payloads.
- **Mass Assignment privesc** — duplicate field con admin value.
- **Logic flow manipulation** — multi-step bypass.
- **Cache poisoning** — different proxies cache different values.
- **Combine con HRS** — smuggle requests with HPP.
- **DoS** — many duplicate params exhaust parser.
- **Edge: HTTP smuggling combo** — Multi-vector compound.

___

## Mitigación (defender)

- **Reject duplicate params** — strict validation:
  ```python
  # Python
  if len(request.args.getlist('a')) > 1:
      return 'Duplicate parameter', 400
  ```
- **Use array-aware APIs** — explicit `getParameterValues()` (Java) o `getlist()` (Python) when arrays expected.
- **Single-source validation** — only read from one source (query OR body, not both).
- **WAF + backend stack alignment** — both should use same parsing logic.
- **Schema validation strict** — JSON Schema con `additionalProperties: false`.
- **Type-strict parsing** — reject if expected scalar but got array.
- **Avoid concatenation logic** — don't build SQL/commands from concat'd params.
- **Use prepared statements / parametrized queries** — defense en depth contra SQLi.
- **Audit con Param Miner en CI/CD** — detect HPP regressions.
- **Stack-specific config**:
  - PHP: avoid `$_REQUEST` (multi-source unclear).
  - ASP.NET: use `GetValues()` explicitly when expecting multiple.
  - Java: use `getParameterValues()` for arrays.
  - Node.js: configure qs library deduplication.
- **WAF rules anti-HPP** — ModSecurity OWASP CRS includes some.
- **Type validation Joi/Zod/Yup** — schema-based.

___

## Para entender HPP

**Por qué stacks difieren:**

HTTP/1.1 spec deja parsing implementation-defined. Standards committees no agreed on canonical behavior. Cada lang / framework's design philosophy resulted in different defaults:
- PHP: pragmatic — last value (latest update).
- Java: strict — first value, explicit array via `getParameterValues()`.
- ASP.NET: aggregating — concatenate all values.
- Python: first value default, explicit list via `getlist()`.

**Por qué WAF bypass funciona:**

WAFs típicamente inspect raw HTTP request en proxy layer. Backend parses params en application layer. Si proxy:
1. Reads first value, validates as safe.
2. Forwards full request to backend.
3. Backend parses con stack-specific logic, getting different value (or concatenation).

Atacante exploits this gap: "first value safe, last value malicious", or fragmenting payload across multiple params para defeat signature matching.

**Diferencia con CRLF injection:**

- CRLF: inject control chars en single value to escape header context.
- HPP: send multiple values to exploit parser differential.

Both are parsing-level bypasses, distinct mechanisms.

**Common chain pattern:**

1. Identify stack (PHP / ASP.NET / Java).
2. Test duplicate behavior.
3. Identify frontend (WAF) parsing.
4. If different → bypass via fragmentation.
5. Inject malicious payload split across duplicates.
6. Backend reassembles → executes.

___

## Recursos

- [OWASP Testing Guide - HTTP Parameter Pollution](https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/07-Input_Validation_Testing/04-Testing_for_HTTP_Parameter_Pollution) — OTG-INPVAL-04.
- [PortSwigger - HTTP Parameter Pollution](https://portswigger.net/) — research.
- [PayloadsAllTheThings - HPP](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/HTTP%20Parameter%20Pollution) — payloads.
- [HackTricks - Parameter Pollution](https://book.hacktricks.xyz/pentesting-web/parameter-pollution) — referencia.
- [OWASP - HPP Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) — defense.
- [Stefano Di Paola - HPP Original Research (2009)](https://www.owasp.org/images/b/ba/AppsecEU09_CarettoniDiPaola_v0.8.pdf) — paper.
- [Param Miner](https://github.com/PortSwigger/param-miner) — Burp extension.
- [CWE-235 - Improper Handling of Extra Parameters](https://cwe.mitre.org/data/definitions/235.html) — MITRE.

***
