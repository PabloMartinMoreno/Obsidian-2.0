---
aliases:
  - SSI Injection
  - Server-Side Includes
tags:
  - type/vulnerability
  - vuln/ssi
  - technique/execution
  - technique/collection
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
linked:
  - "[[SSI - Ejecución de Comandos]]"
  - "[[SSI - Inclusión de Archivos]]"
  - "[[SSI - Fingerprinting]]"
  - "[[SSI - Evasión de Filtros]]"
  - "[[Burp Suite]]"
---
# Server-Side Includes (SSI) Injection

***

## Cheatsheet

### 1. Ejecución directa (RCE)

````tabs
tab: **Comandos (exec cmd)**
![[SSI - Ejecución de Comandos#^ssi-exec]]
````

### 2. Lectura / inclusión

````tabs
tab: **Inclusión de archivos**
![[SSI - Inclusión de Archivos#^ssi-include]]
````

### 3. Enumeración

````tabs
tab: **Fingerprinting (echo, fsize, flastmod)**
![[SSI - Fingerprinting#^ssi-fingerprinting]]
````

### 4. Evasión

````tabs
tab: **Evasión de filtros y WAF**
![[SSI - Evasión de Filtros#^ssi-bypass]]
````

___

## Overview

**SSI (Server-Side Includes)** es un set de directivas legacy interpretadas por el webserver (Apache `mod_include`, IIS SSI module) dentro de archivos HTML, permitiendo embeber contenido dinámico sin un lenguaje full-backend.

**SSI Injection** = el atacante inyecta directivas SSI en input reflejado, el server parsea y ejecuta la directiva en el contexto del webserver — potencialmente RCE.

### Directivas principales

| Directiva | Función |
|---|---|
| `#exec cmd="..."` | Ejecuta comando shell. |
| `#include virtual="..."` | Incluye archivo/URL del webroot. |
| `#include file="..."` | Incluye archivo del filesystem. |
| `#echo var="..."` | Imprime variable CGI. |
| `#printenv` | Dump de todas las env vars. |
| `#fsize file="..."` | Tamaño de archivo. |
| `#flastmod file="..."` | Timestamp última modificación. |
| `#set var="..." value="..."` | Define variable local. |
| `#config ...` | Cambia formato de output. |

### Identificación

**Indicadores de SSI habilitado:**
- Extensiones de archivo: `.shtml`, `.shtm`, `.stm`.
- Header `Server: Apache/2.x (Ubuntu)` + `mod_include` (aparece en `Apache -l` o `.htaccess` con `Options +Includes`).
- Apps legacy: CMSs antiguos, tutoriales sobre formularios simples, dashboards .shtml.
- IIS 6-10 con `.shtml` en handler mappings.

**PoC mínima:**
```html
<!--#echo var="DATE_LOCAL" -->
```
Si en la respuesta aparece fecha legible → SSI parseado.

### Vectores de inyección

| Vector | Dónde |
|---|---|
| Form inputs reflejados en `.shtml` | Campos search, contact, comments, profile bio. |
| File upload filename | Si filename se muestra en listado .shtml. |
| Headers HTTP reflejados | User-Agent, Referer, Cookie en páginas de error/debug .shtml. |
| Log display via SSI | Dashboards que muestran logs parseados. |

___

## Workflow de explotación

```
1. Identificar .shtml en la app (crawl, directorio listings, Content-Type).
2. Probar PoC con #echo var="DATE_LOCAL" → fecha = SSI activo.
3. Intentar #exec cmd="id" → si RCE, escalar a reverse shell.
4. Si #exec filtrado → probar #include file="/etc/passwd".
5. Si ambos filtrados → chain via file upload + .shtml nuevo.
6. Exfil OOB con curl/nslookup a Collaborator si blind.
```

___

## Config defensivo (defender perspective)

```apache
# Desactivar SSI completamente
<Directory /var/www>
    Options -Includes
</Directory>

# Permitir SSI pero no exec (reduce pero no elimina riesgo)
<Directory /var/www>
    Options +IncludesNOEXEC
</Directory>

# Restringir parseo solo a .shtml
AddType text/html .shtml
AddHandler server-parsed .shtml
```

**Mitigación real:**
- Escape / reject `<!--#` en user input.
- No reflejar input en archivos .shtml.
- Desactivar SSI globalmente si no se usa.
- WAF con reglas para directivas SSI conocidas.

___

## Recursos

- [PortSwigger - SSI Injection](https://portswigger.net/kb/issues/00101200_server-side-includes-injection)
- [OWASP - SSI Injection](https://owasp.org/www-community/attacks/Server-Side_Includes_(SSI)_Injection)
- [HackTricks - SSI](https://book.hacktricks.xyz/pentesting-web/server-side-inclusion-edge-side-inclusion-injection)
- [Apache mod_include docs](https://httpd.apache.org/docs/current/mod/mod_include.html)

***
