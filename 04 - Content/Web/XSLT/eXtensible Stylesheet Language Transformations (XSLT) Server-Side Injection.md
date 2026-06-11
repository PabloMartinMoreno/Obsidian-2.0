---
aliases:
  - XSLT Injection
  - XSLT Server-Side Injection
  - XSLTi
  - XSL Injection
tags:
  - vuln/xslt-injection
  - technique/initial-access
  - technique/execution
  - technique/discovery
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
  - "[[XSLT - Fingerprinting]]"
  - "[[XSLT - Lectura de Archivos (document)]]"
  - "[[XSLT - SSRF]]"
  - "[[XSLT - Extension Functions (RCE)]]"
  - "[[XSLT - DoS]]"
  - "[[XSLT - Blind Exfil]]"
  - "[[XSLT - Bypasses y Evasion]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[XML External Entity (XXE)]]"
  - "[[Burp Suite]]"
---
1# eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection

---

## Cheatsheet

### 📁 Lectura de Archivos Locales (LFI)

````tabs
tab: **Función document()**
![[XSLT - Lectura de Archivos (document)#^xslt-lfi-document]]

tab: **XXE dentro de XSLT**
![[XSLT - Lectura de Archivos (document)#^xslt-lfi-xxe]]

tab: **Lectura de Directorios**
![[XSLT - Lectura de Archivos (document)#^xslt-lfi-dirs]]
````

### 🌐 Server-Side Request Forgery (SSRF)

````tabs
tab: **Escaneo de Puertos Internos**
![[XSLT - SSRF#^xslt-ssrf-portscan]]

tab: **Cloud Metadata e Internos**
![[XSLT - SSRF#^xslt-ssrf-cloud]]
````

### 💀 Remote Code Execution (RCE)

````tabs
tab: **PHP / libxslt**
![[XSLT - Extension Functions (RCE)#^xslt-rce-php]]

tab: **Java / Saxon**
![[XSLT - Extension Functions (RCE)#^xslt-rce-saxon]]

tab: **Microsoft / MSXML**
![[XSLT - Extension Functions (RCE)#^xslt-rce-msxml]]
````

### 💥 Denegación de Servicio (DoS)

````tabs
tab: **Billion Laughs**
![[XSLT - DoS#^xslt-dos-billion]]

tab: **Recursión Infinita / Loops**
![[XSLT - DoS#^xslt-dos-recursion]]
````

### 📡 Exfiltración de Datos (OOB)

````tabs
tab: **HTTP via URLs**
![[XSLT - Blind Exfil#^xslt-oob-http]]

tab: **DNS via Subdomain**
![[XSLT - Blind Exfil#^xslt-oob-dns]]
````

### 🛡️ Bypasses y Evasión de Filtros

````tabs
tab: **Encoding (UTF-16/UTF-7)**
![[XSLT - Bypasses y Evasion#^xslt-bypass-encoding]]

tab: **Char References**
![[XSLT - Bypasses y Evasion#^xslt-bypass-chars]]

tab: **String Obfuscation XPath**
![[XSLT - Bypasses y Evasion#^xslt-bypass-xpath]]

tab: **Namespaces y Prefijos**
![[XSLT - Bypasses y Evasion#^xslt-bypass-namespaces]]

tab: **CDATA y Entity Wrap**
![[XSLT - Bypasses y Evasion#^xslt-bypass-cdata]]

tab: **Comentarios y Whitespace**
![[XSLT - Bypasses y Evasion#^xslt-bypass-comments]]

tab: **HTTP Transport**
![[XSLT - Bypasses y Evasion#^xslt-bypass-transport]]
````

---

## Overview

**XSLT Server-Side Injection** = el backend transforma un documento XML aplicando una stylesheet XSL, y el atacante controla **el stylesheet** (o un fragmento embebido en él). El motor XSLT es un intérprete completo: itera, evalúa expresiones XPath, lee archivos con `document()`, hace HTTP con la misma función, y según vendor permite llamar **código nativo** (PHP, Java, JScript). Resultado: file read, SSRF, RCE y DoS en un solo vector.

Vector mucho menos defendido que SQLi/XXE porque casi nadie audita el flujo XSL → motores enteros vienen con extensions habilitadas por default (Xalan, MSXML legacy, Saxon-PE/EE).

### Diferencia con XXE

| | **XXE** | **XSLT injection** |
|---|---|---|
| Atacante controla | El XML de input (DOCTYPE / entidades) | El stylesheet XSL |
| Motor | Parser XML | Procesador XSLT (XPath + reglas) |
| Vector clásico | `<!ENTITY> SYSTEM "file://..."` | `document('file://...')` / `unparsed-text(...)` |
| RCE | Raro (PHP `expect://`) | Frecuente (extension functions PHP / Java) |

Si la app acepta XML pero las entidades externas están deshabilitadas → puede seguir siendo vulnerable a XSLTi si transforma el XML.

### Motores y vectores

| Motor | Lenguaje host | XSLT | Vector RCE |
|---|---|---|---|
| **libxslt** | PHP / Python / Ruby / C | 1.0 | `php:function` (si `registerPHPFunctions()`) |
| **Saxon-HE** | Java | 2.0 / 3.0 | Sin RCE nativo (file/SSRF/blind sí) |
| **Saxon-PE / EE** | Java | 2.0 / 3.0 | `java:java.lang.Runtime` reflection |
| **Xalan-Java** | Java | 1.0 | Default permite static Java calls |
| **MSXML** | .NET / COM | 1.0 / 2.0 | `msxsl:script` (JScript / VBScript / C#) |
| **BaseX / eXist-DB** | Java | 3.0 | Java extension functions + `proc:system` |

---

## Workflow de explotación

1. Identificar transformación XSL (upload XML, render PDF/RSS, dashboards, SOAP).
2. Probe inyección:
   <xsl:value-of select="'XSLT-OK'"/>     o     <xsl:value-of select="7*7"/>
3. Fingerprint (versión + vendor + product):
   system-property('xsl:version' | 'xsl:vendor' | 'xsl:product-name')
4. Mapear extensions disponibles:
   function-available('php:function' | 'saxon:evaluate' | ...)
5. Según vendor, escalar:
   - libxslt + PHP   → php:function('system','...')   = RCE
   - Saxon-PE/EE     → java:java.lang.Runtime         = RCE
   - Xalan           → java:Runtime estático          = RCE
   - MSXML legacy    → msxsl:script + ActiveXObject   = RCE
   - Saxon-HE / sin extensions → file read + SSRF + blind exfil
6. Si reflection bloqueada / no hay output:
   - file read con document() / unparsed-text()
   - SSRF a interno o cloud metadata vía document()
   - OOB exfil via HTTP / DNS callback
7. Si hay WAF: aplicar bypasses (UTF-16/UTF-7, namespaces alternativos).
8. Si nada funciona → DoS para impacto reportable (billion laughs, recursión).


---

## Detección rápida

### Recon activo

````tabs
tab: **Detección Básica**
![[XSLT - Fingerprinting#^xslt-fp-detection]]

tab: **Fingerprinting de Motores**
![[XSLT - Fingerprinting#^xslt-fp-engines]]
````

### Indicadores de stack XSLT

- Endpoint que acepta upload de XML / XSL / `Content-Type: application/xml` que devuelve HTML transformado.
- Generación de PDF/RSS/Atom desde feeds XML (Apache FOP, ROME).
- SOAP con transformación de respuestas (Apache CXF, Spring WS).
- Dashboards / reports renderizados desde XML (BIRT, JasperReports).
- Frameworks legacy: Cocoon, Orbeon Forms, MSXML COM apps.

### Probes mínimos

```xml
<!-- 1. Confirmar inyección -->
<xsl:value-of select="'XSLT-OK'"/>

<!-- 2. Aritmética server-side -->
<xsl:value-of select="7*7"/>     <!-- output 49 -->

<!-- 3. Versión / vendor -->
<xsl:value-of select="system-property('xsl:vendor')"/>
```

### Errores que confirman XSLT

- `XPathException`, `XsltException`, `XTSE0010`, `XPST0017`.
- Stack traces con `net.sf.saxon.*`, `org.apache.xalan.*`.
- PHP: warnings de `XSLTProcessor::transformToXml()`.
- "Error in XSLT stylesheet" / "compilation error in stylesheet".

### Tooling

```bash
# Burp Suite — payloads XSLT en Intruder
# PayloadsAllTheThings/XSLT Injection/

# tplmap — soporta XSLT entre otros engines
python tplmap.py -u 'http://target/xslt' -d 'xsl=*'

# Listener para OOB
interactsh-client -v
python3 -m http.server 8080
```

---

## Impacto

- **File read arbitrario** — `document()` / `unparsed-text()` lee cualquier archivo legible por el proceso.
- **SSRF** — `document('http://...')` fetcha URLs internas, cloud metadata, port scan via timing.
- **RCE** — extension functions en libxslt+PHP, Saxon-PE/EE, Xalan-Java, MSXML.
- **Information disclosure** — versión exacta del motor + product → CVE lookup directo.
- **DoS** — billion laughs, recursión infinita, loops gigantes — derriba el servicio.
- **OOB exfiltration** — egress HTTP/DNS sin necesidad de output reflejado.

---

## Mitigación (defender)

- **No pasar XSL controlado por user al procesador** — separar template (trusted) de datos (XML untrusted).
- **PHP libxslt**:
  ```php
  $xsl->setSecurityPrefs(XSL_SECPREF_DEFAULT);  // bloquea file:// + write
  // Y NUNCA llamar:
  // $xsl->registerPHPFunctions();
  ```
- **Saxon (Java)**:
  ```java
  factory.setFeature("http://javax.xml.XMLConstants/feature/secure-processing", true);
  factory.setAttribute(FeatureKeys.ALLOW_EXTERNAL_FUNCTIONS, false);
  factory.setURIResolver(null);  // bloquea document() externo
  ```
- **Xalan**:
  ```java
  factory.setFeature("http://www.oracle.com/xml/jaxp/properties/enableExtensionFunctions", false);
  ```
- **MSXML (.NET)**:
  ```csharp
  xslt.XmlResolver = null;
  var settings = new XsltSettings(enableDocumentFunction: false, enableScript: false);
  ```
- **Network egress filtering** — bloquear HTTP outbound desde el proceso transformador (mata SSRF/OOB exfil).
- **Sandboxing** — correr el transformador en proceso separado con FS read-only y sin red.
- **Disable DTDs** — `feature: disallow-doctype-decl = true` (bloquea XXE + billion laughs).
- **Timeout** — limitar tiempo de transformación a 1-5s (bloquea DoS por loops).

---

## Para entender XSLT injection

**XSLT no es un lenguaje de templates común.** Es un intérprete declarativo Turing-completo (en 2.0/3.0) sobre XPath. Eso significa:

- **Loops, recursión, variables** — estructuras propias para iterar y branch.
- **Acceso a I/O** — `document()`, `unparsed-text()`, `collection()` son funciones del estándar (no extensions).
- **Acceso a entorno** — `system-property()`, `available-environment-variables()` (3.0).
- **Extension functions** — puente al runtime host (PHP / Java / .NET) — donde está la mayoría de los RCE.

**Por qué los engines son tan permisivos:**

XSLT se diseñó para procesar feeds en sistemas trusted (RSS aggregators, batch transformers). El threat model original asumía que **stylesheet = código del operador**, no input del cliente. Cuando apps modernas exponen "upload your XSL" o aceptan stylesheets en parámetros, heredan toda esa permisividad.

**Diferencia con SSTI clásica:**

- SSTI Jinja2/Twig → escapa al lenguaje host vía `__class__.__bases__` etc.
- XSLT → el lenguaje host **ya está expuesto** vía namespace `java:` / `php:` cuando hay extensions.

---

## Recursos

- [PortSwigger - XSLT Injection](https://portswigger.net/web-security/xxe/xslt) — labs y conceptos.
- [PayloadsAllTheThings - XSLT](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XSLT%20Injection) — payloads por motor.
- [HackTricks - XSLT Server Side Injection](https://book.hacktricks.xyz/pentesting-web/xslt-server-side-injection-extensible-stylesheet-language-transformations) — referencia exhaustiva.
- [OWASP - Testing for XSLT](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/) — metodología de testing.
- [Saxon documentation - extension functions](https://www.saxonica.com/documentation12/index.html#!extensibility) — reference oficial Java reflection.
- [Black Hat 2015 - XSLT Worm](https://www.blackhat.com/docs/eu-15/materials/eu-15-Arnaboldi-Abusing-XSLT-For-Practical-Attacks-wp.pdf) — paper de Arnaboldi (NCC Group).

---
