---
aliases:
tags:
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Command
linked:
  - "[[Curl - Fuzzing Parámetros y Valores]]"
  - "[[Curl - Enumeración Pasiva de Sub-Dominios]]"
  - "[[Curl - Enumeración de Sub-Dominios y V.Host]]"
  - "[[HTTP]]"
  - "[[HTTPS]]"
  - "[[Curl - Web]]"
  - "[[Curl - APIs]]"
  - "[[Curl - Acronimos]]"
---
# Curl

***

## Cheatsheet

````tabs
tab: Web
![[Curl - Web#^curl-web]]

tab: APIs
![[Curl - APIs#^curl-api]]

tab: Acrónimos
![[Curl - Acronimos#^curl-acronimos]]

````
^curl-general

***

## Overview

`curl` es una herramienta de línea de comandos para transferir datos con URL sintaxis, soporta muchos protocolos (HTTP, HTTPS, FTP, SFTP, SMB, etc.) y se usa para hacer peticiones, probar APIs y descargar/subir archivos.

**Consejos y errores comunes:**
- Para APIs REST, usar `-H "Content-Type: application/json"` y `-d` con JSON.
- Evitar pasar contraseñas en la línea de comandos visible; usar `.netrc` o `--config`.
- `-L` es necesario si la URL redirige (302/301).
- Para grandes descargas, combinar `-C -` para reanudar. (Ej.: `curl -C - -O URL`). (cURL)
- Atención con codificación de caracteres en datos y cabeceras.

**Seguridad y autenticación:**
TLS/HTTPS es preferible; para certificados cliente y autenticación avanzada usar `--cert`, `--key`, `--oauth2` (si soportado por wrapper) o gestionar tokens en cabeceras `Authorization: Bearer <token>`.
