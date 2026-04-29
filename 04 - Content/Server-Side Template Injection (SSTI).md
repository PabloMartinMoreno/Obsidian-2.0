---
aliases:
  - SSTI
  - Template Injection
  - Server-Side Template Injection
tags:
  - type/vulnerability
  - vuln/ssti
  - technique/execution
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: CheatSheet
linked:
  - "[[SSTI - Deteccion y Fingerprinting]]"
  - "[[SSTI - Ejecucion por Engine]]"
  - "[[SSTI - Sandbox Escape]]"
  - "[[SSTI - Tooling]]"
  - "[[SSTI - Bypasses y Filter Evasion]]"
  - "[[Insecure Deserialization]]"
  - "[[XML External Entity (XXE)]]"
  - "[[OS Command Injection]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Burp Suite]]"
---
# Server-Side Template Injection (SSTI)

***

## Cheatsheet

### 🔍 Detección y Fingerprinting

````tabs
tab: **Probes Polyglot**
![[SSTI - Deteccion y Fingerprinting#^ssti-detect-polyglot]]

tab: **Identificación por Delimitador**
![[SSTI - Deteccion y Fingerprinting#^ssti-detect-delimiters]]

tab: **Confirmación con Aritmética**
![[SSTI - Deteccion y Fingerprinting#^ssti-detect-confirmacion]]
````

### 💉 Ejecución por Engine

````tabs
tab: **Jinja2 (Python / Flask)**
![[SSTI - Ejecucion por Engine#^ssti-engine-jinja2]]

tab: **Twig (PHP / Symfony)**
![[SSTI - Ejecucion por Engine#^ssti-engine-twig]]

tab: **Smarty (PHP)**
![[SSTI - Ejecucion por Engine#^ssti-engine-smarty]]

tab: **FreeMarker (Java)**
![[SSTI - Ejecucion por Engine#^ssti-engine-freemarker]]

tab: **Velocity (Java)**
![[SSTI - Ejecucion por Engine#^ssti-engine-velocity]]

tab: **Thymeleaf (Spring)**
![[SSTI - Ejecucion por Engine#^ssti-engine-thymeleaf]]

tab: **ERB (Ruby / Rails)**
![[SSTI - Ejecucion por Engine#^ssti-engine-erb]]

tab: **Mako (Python)**
![[SSTI - Ejecucion por Engine#^ssti-engine-mako]]

tab: **Handlebars (Node.js)**
![[SSTI - Ejecucion por Engine#^ssti-engine-handlebars]]

tab: **Razor (.NET)**
![[SSTI - Ejecucion por Engine#^ssti-engine-razor]]
````

### 🔓 Sandbox Escape

````tabs
tab: **Jinja2 Sandbox Bypass**
![[SSTI - Sandbox Escape#^ssti-sandbox-jinja2]]

tab: **Twig Sandbox Bypass**
![[SSTI - Sandbox Escape#^ssti-sandbox-twig]]

tab: **FreeMarker Security Manager Bypass**
![[SSTI - Sandbox Escape#^ssti-sandbox-freemarker]]

tab: **Filter Abuse para Escape**
![[SSTI - Sandbox Escape#^ssti-sandbox-filter-abuse]]
````

### 🛠️ Tooling

````tabs
tab: **tplmap**
![[SSTI - Tooling#^ssti-tool-tplmap]]

tab: **Burp Extensions**
![[SSTI - Tooling#^ssti-tool-burp]]

tab: **Wordlists de Payloads**
![[SSTI - Tooling#^ssti-tool-wordlists]]
````

### 🛡️ Bypasses y Filter Evasion

````tabs
tab: **Encoding (Unicode / Hex / Base64)**
![[SSTI - Bypasses y Filter Evasion#^ssti-bypass-encoding]]

tab: **String Concatenation**
![[SSTI - Bypasses y Filter Evasion#^ssti-bypass-concat]]

tab: **Attribute Lookup Chains**
![[SSTI - Bypasses y Filter Evasion#^ssti-bypass-attr-chain]]

tab: **Comment / Whitespace Tricks**
![[SSTI - Bypasses y Filter Evasion#^ssti-bypass-comment-whitespace]]
````

___

## Overview

**Server-Side Template Injection (SSTI)** = input del usuario se concatena directamente en una template antes de ser renderizada por un engine. El engine evalúa la expresión inyectada como código del lenguaje host (Python / PHP / Java / Ruby / Node / .NET) → **RCE directo**.

Vector clase A — backends modernos lo introducen sin darse cuenta porque las APIs de templating son convenientes para devs que quieren "interpolación de strings". `render_template_string(f"Hello {user_input}")` es el anti-patrón canónico.

### Diferencia con XSS

| | **XSS** | **SSTI** |
|---|---|---|
| Ejecuta en | Navegador del cliente | Server (template engine) |
| Lenguaje | JavaScript | Python / PHP / Java / Ruby / .NET |
| Impacto | Robar cookies / cliente comprometido | RCE en el server |
| Vector | HTML/JS injection | Template syntax injection |
| Mitigación | CSP + escape HTML | No concatenar input + sandbox |

### Diferencia con Code Injection

SSTI es subcase de code injection — pero específico al lenguaje del template engine, no al runtime general. Un template engine bien configurado limita lo que puede ejecutar (sandbox). Code injection clásico (`eval(input)`) no tiene sandbox.

___

## Workflow de explotación

```
1. Identificar input reflejado en response (búsqueda visual o Burp).
2. Inyectar polyglot probe: ${{<%[%'"}}%\
   - Si error verbose → engine identificado por stack trace.
3. Confirmar con expresión aritmética por delimitador:
   - {{7*7}} → Jinja2/Twig (49)
   - ${7*7}  → FreeMarker/Velocity/Mako/Thymeleaf (49)
   - <%= 7*7 %> → ERB (49)
4. Diferenciar engines con misma sintaxis:
   - {{7*'7'}} → 7777777 (Twig) vs 49 (Jinja2)
5. Mapear contexto:
   - ¿Hay sandbox?
   - ¿Qué objetos están accesibles (config, request, app)?
6. Escalar a RCE según engine (ver Ejecución por Engine).
7. Si sandbox: aplicar bypass específico (ver Sandbox Escape).
8. Si filtro WAF: encoding / concat / attr chain (ver Bypasses).
```

___

## Detección rápida

### Indicadores en código backend

```python
# Python / Flask — VULN
return render_template_string(f"Hello {request.args['name']}")
return render_template_string("Hello %s" % user_input)

# Python / Flask — SAFE
return render_template('hello.html', name=user_input)
```

```php
// Twig / Symfony — VULN
$template = $twig->createTemplate("Hello {$_GET['name']}");

// SAFE
$twig->render('hello.twig', ['name' => $userInput]);
```

```java
// FreeMarker — VULN
String tmpl = "Hello ${" + userInput + "}";
freemarker.template.Template t = new Template("name", new StringReader(tmpl), cfg);

// SAFE
freemarker.template.Template t = cfg.getTemplate("hello.ftl");
t.process(Map.of("name", userInput), out);
```

### Probes mínimos

```bash
# 1. Probe polyglot
curl -G "https://target/page" --data-urlencode 'q=${{<%[%`"}}%\'

# 2. Probe aritmético rápido (one-liner)
for p in '{{7*7}}' '${7*7}' '<%= 7*7 %>' '#{7*7}' '@(7*7)' '{7*7}'; do
  R=$(curl -sG "https://target/page" --data-urlencode "q=$p")
  echo "$p" → $(echo "$R" | grep -oE '49|7777777' | head -1)
done

# 3. Auto-exploit
python tplmap.py -u "https://target/page?q=test" --level 5
```

___

## Impacto

- **RCE inmediata** — la mayoría de engines exponen el runtime completo del lenguaje host con un par de gadgets.
- **File read arbitrario** — `document()` / `File.read()` / `os.read` según engine.
- **SSRF** — engine que hace HTTP fetches o DB queries con input controlado.
- **Account takeover** — modificación de variables de session si templates se usan para session storage.
- **Information disclosure** — dump de `config`, secrets, env vars del proceso.
- **DoS** — recursión infinita / loops gigantes en template syntax.
- **Lateral via gadget chains** — combinar SSTI + Insecure Deserialization si engine permite.

___

## Mitigación (defender)

- **No concatenar input en strings de template** — pasar como contexto:
  ```python
  # MAL
  render_template_string(f"Hello {name}")
  # BIEN
  render_template('hello.html', name=name)
  ```
- **Sandbox explícito** — usar `SandboxedEnvironment` (Jinja2), Sandbox extension (Twig), `setNewBuiltinClassResolver(ALLOWS_NOTHING_RESOLVER)` (FreeMarker).
- **Escape de output** — auto-escape on por default + filtros explícitos (`|safe` o `|raw` solo para data trusted).
- **Logica de negocio NO en templates** — templates solo presentan, no calculan.
- **Allowlist de variables del context** — exponer solo lo mínimo (`name`, `email`), nunca `config` / `request` / `app`.
- **Filtros custom validados** — cualquier filter que reciba callbacks dinámicos = vector.
- **Disable filters peligrosos** — `_self`, `getName`, `loadTemplate` en Twig; `?eval`, `?interpret` en FreeMarker.
- **WAF con reglas SSTI** — ModSecurity OWASP CRS tiene patterns por engine.
- **CSP** — NO ayuda (SSTI es server-side; CSP es cliente).
- **Code review automatizado** — Semgrep / CodeQL tienen reglas para `render_template_string` con f-strings.

___

## Para entender SSTI

**Por qué template engines exponen tanto:**

Engines de templating se diseñaron originalmente como herramientas para **operadores trusted** (devs / admins). El threat model asumía: "el template lo escribe el equipo, los datos los pasa el user". Si el template es trusted, exponer `Runtime.exec` o `__class__.__mro__` es conveniente para casos avanzados.

Cuando un dev moderno hace `render_template_string(f"Hello {user_input}")`, **invierte el threat model**: ahora el user controla el template. Todas las features pensadas para devs trusted se convierten en vectores.

**Por qué los sandboxes fallan:**

Sandboxes restringen acceso a algunos atributos (`_*`, `__*`) o whitelistean filters. Pero el lenguaje host es tan rico que **siempre hay un camino indirecto**:
- En Python: `''.__class__` está bloqueado, pero `()|attr('__class__')` con filter pasa.
- En Twig: `_self.env` está bloqueado, pero `[]|filter('system')` invoca callback.
- En FreeMarker: `?new()` está restringido, pero `?api` o `?interpret` permiten reflection.

Ningún sandbox reemplaza "no concatenar input en template".

**Diferencia con SSTI client-side (CSTI):**

Algunos engines corren en cliente (Vue, Angular, Handlebars en navegador). Inyección ahí = XSS, no RCE — el engine corre en el browser sandbox. CSTI es categoría aparte con vectores propios (Angular sandbox bypass, Vue.js mustaches).

___

## Recursos

- [PortSwigger - SSTI](https://portswigger.net/web-security/server-side-template-injection) — labs y conceptos.
- [PortSwigger Research - SSTI](https://portswigger.net/research/server-side-template-injection) — paper original (2015) de James Kettle.
- [PayloadsAllTheThings - SSTI](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Template%20Injection) — payloads por engine.
- [HackTricks - SSTI](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection) — referencia exhaustiva.
- [tplmap](https://github.com/epinna/tplmap) — auto-exploit tool.
- [OWASP Testing - Template Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/18-Testing_for_Server-side_Template_Injection) — metodología.
- [Black Hat Asia 2018 - SSTI](https://www.blackhat.com/docs/asia-18/asia-18-Sukhonin-Why-Modern-Apps-Are-Vulnerable-to-SSTI-Attacks.pdf) — survey de vectores.

***
