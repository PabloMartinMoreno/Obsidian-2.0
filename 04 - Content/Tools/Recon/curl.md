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
---
# Curl

***

## Cheatsheet

````tabs
tab: Web
![[Curl - Web#^curl-web]]

tab: APIs


tab: Acrónimos

| **Opción** | **Significado / Acrónimo**   | **Qué hace **                                              |
| ------ | ------------------------ | ------------------------------------------------------ |
| `-A`   | **Agent**                | Define el *User-Agent* (identifica el cliente).        |
| `-b`   | **Biscuit (cookie)**     | Envia cookies desde un archivo o string.               |
| `-c`   | **Cookie-jar (create)**  | Guarda cookies en un archivo.                          |
| `-d`   | **Data**                 | Envía datos en el cuerpo del request (POST, PUT, etc). |
| `-F`   | **Form**                 | Envía datos de formulario tipo `multipart/form-data`.  |
| `-G`   | **Get**                  | Fuerza método GET con parámetros (`?param=value`).     |
| `-H`   | **Header**               | Agrega un encabezado HTTP personalizado.               |
| `-I`   | **Head**                 | Solo solicita los headers (método HEAD).               |
| `-k`   | **Insecure**             | Ignora validación de certificados SSL.                 |
| `-L`   | **Location (follow)**    | Sigue redirecciones HTTP automáticamente.              |
| `-o`   | **Output**               | Guarda la respuesta en un archivo.                     |
| `-O`   | **Output (remote name)** | Guarda con el mismo nombre que el recurso remoto.      |
| `-s`   | **Silent**               | No muestra progreso ni mensajes.                       |
| `-u`   | **User**                 | Autenticación HTTP (user:password).                    |
| `-v`   | **Verbose**              | Muestra todo el tráfico (headers, etc).                |
| `-x`   | **Proxy**                | Define un servidor proxy.                              |
| `-X`   | **Request (method)**     | Especifica el método HTTP (GET, POST, PUT, etc).       |

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
