---
aliases:
  - Abusing HTACCESS Policies
  - Abusing File Upload
  - Magic Bytes
  - Doble extension
  - Unauthenticated File Upload
  - Arbitrary File Upload
  - Bypass de Subida de Archivos
tags:
  - vuln/file-upload
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[File Upload - Reconocimiento de Filtros]]"
  - "[[File Upload - Bypass de Filtros de Lista Negra]]"
  - "[[File Upload - Bypass de Filtros de Lista Blanca]]"
  - "[[File Upload - Bypass de Sobrescritura de Configuración]]"
  - "[[File Upload - Bypass de Contenido]]"
  - "[[File Upload - Bypass por Confusión y Desincronización]]"
  - "[[File Upload - Shells en PHP]]"
  - "[[File Upload - Desactivación de Validación Front-end]]"
---
# File Upload - Vulnerabilidades

---

## Cheatsheet

### 1. Reconocimiento del filtro

````tabs
tab: **Tipo de Filtro (blacklist/whitelist/magic bytes)**
![[File Upload - Reconocimiento de Filtros#^fu-reconocimiento]]

tab: **Front-end (DevTools / Burp)**
![[File Upload - Desactivación de Validación Front-end#^fu-frontend]]
````

### 2. Bypass por extensión

````tabs
tab: **Lista Negra (ext alternativas, case, doble ext, null byte)**
![[File Upload - Bypass de Filtros de Lista Negra#^fu-blacklist]]

tab: **Lista Blanca (frontend-only, regex flaw, path traversal)**
![[File Upload - Bypass de Filtros de Lista Blanca#^fu-whistelist]]
````

### 3. Bypass de validación de contenido

````tabs
tab: **Magic Bytes + Ofuscación PHP**
![[File Upload - Bypass de Contenido#^fu-contenido]]

tab: **Confusión (HPP, boundary, CRLF, truncamiento)**
![[File Upload - Bypass por Confusión y Desincronización#^fu-confusion]]
````

### 4. Persistencia y Payloads

````tabs
tab: **Sobrescritura de configuración (.htaccess, .user.ini, web.config)**
![[File Upload - Bypass de Sobrescritura de Configuración#^fu-conf]]

tab: **Shells PHP / ASP / reverse**
![[File Upload - Shells en PHP#^fu-shells]]
````

---

## Overview

**File Upload** = endpoint que acepta archivos del usuario y los almacena en el filesystem del backend. Vulnerabilidad cuando:

1. Filtros de extensión/content-type/magic bytes son evadibles → atacante sube archivo ejecutable (`.php`, `.aspx`, `.jsp`).
2. Path del upload es **dentro del webroot** y ejecutable → navegar a `/uploads/shell.php` ejecuta el archivo.
3. Archivo se procesa con librería vulnerable (ImageMagick, ExifTool) → RCE al procesar.

### Workflow estándar

```
1. Recon del filtro (probar .hack → blacklist o whitelist?)
2. Identificar parser de nombre (file.php.jpg vs file.jpg.php)
3. Bypass extensión (alternativas, case, null byte, doble)
4. Bypass content (magic bytes GIF89a; + PHP)
5. Localizar path del archivo subido (responses, src de imgs, listado de directorios)
6. Verificar ejecución (.php?cmd=id)
```

### Stack-specific notes

| Stack | Vector típico |
|:---:|:---:|
| PHP/Apache | `.phar`, `.phtml`, `.htaccess override` |
| PHP/Nginx | `.user.ini` + auto_prepend_file |
| ASP.NET/IIS | `.aspx`, `.asax`, `web.config` |
| Java/Tomcat | `.jsp`, `.jspx`, war files |
| Node.js | Path traversal sobrescribiendo `package.json`, templates |
| Python/Flask | Path traversal a `templates/` para SSTI |

### Recursos

- [PayloadsAllTheThings - Upload Insecure Files](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Upload%20Insecure%20Files)
- [HackTricks - File Upload](https://book.hacktricks.xyz/pentesting-web/file-upload)
- Lista de extensiones PHP: [extensions.lst](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Upload%20Insecure%20Files/Extension%20PHP/extensions.lst)
- Lista MIME types: [seclists web-all-content-types](https://github.com/danielmiessler/SecLists/raw/master/Discovery/Web-Content/web-all-content-types.txt)

---
