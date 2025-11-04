---
aliases:
tags:
  - type/command
primary categories:
secondary categories:
tertiary categories:
type: Command
linked:
---
# Curl

***

## Cheatsheet

### Uso general

````tabs
tab: Web

| **Comando**                                                                                                      | **Descripción**                                                      |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `curl inlanefreight.com`                                                                                         | Realiza una solicitud GET básica                                     |
| `curl -s -O inlanefreight.com/index.html`                                                                        | Descarga un archivo                                                  |
| `curl -k https://inlanefreight.com`                                                                              | Omite la validación del certificado HTTPS (SSL)                      |
| `curl inlanefreight.com -v`                                                                                      | Muestra todos los detalles de la solicitud y respuesta HTTP          |
| `curl -I https://www.inlanefreight.com`                                                                          | Envía una solicitud HEAD (solo muestra los encabezados de respuesta) |
| `curl -i https://www.inlanefreight.com`                                                                          | Muestra los encabezados y el cuerpo de la respuesta                  |
| `curl https://www.inlanefreight.com -A 'Mozilla/5.0'`                                                            | Establece el encabezado *User-Agent*                                 |
| `curl -u admin:admin http://<SERVER_IP>:<PORT>/`                                                                 | Envía credenciales de autenticación HTTP básica                      |
| `curl http://admin:admin@<SERVER_IP>:<PORT>/`                                                                    | Pasa credenciales HTTP básicas directamente en la URL                |
| `curl -H 'Authorization: Basic YWRtaW46YWRtaW4=' http://<SERVER_IP>:<PORT>/`                                     | Establece un encabezado personalizado                                |
| `curl 'http://<SERVER_IP>:<PORT>/search.php?search=le'`                                                          | Envía parámetros mediante GET                                        |
| `curl -X POST -d 'username=admin&password=admin' http://<SERVER_IP>:<PORT>/`                                     | Envía una solicitud POST con datos de formulario                     |
| `curl -b 'PHPSESSID=c1nsa6op7vtk7kdis7bcnbadf1' http://<SERVER_IP>:<PORT>/`                                      | Envía cookies en la solicitud                                        |
| `curl -X POST -d '{"search":"london"}' -H 'Content-Type: application/json' http://<SERVER_IP>:<PORT>/search.php` | Envía una solicitud POST con datos en formato JSON                   |

tab: APIs

| **Comando**                                                                                                                                             | **Descripción**                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `curl http://<SERVER_IP>:<PORT>/api.php/city/london`                                                                                                    | Leer una entrada                              |
| `curl -s http://<SERVER_IP>:<PORT>/api.php/city/ \| jq`                                                                                                 | Leer todas las entradas (formateado con `jq`) |
| `curl -X POST http://<SERVER_IP>:<PORT>/api.php/city/ -d '{"city_name":"HTB_City", "country_name":"HTB"}' -H 'Content-Type: application/json'`          | Crear (agregar) una entrada                   |
| `curl -X PUT http://<SERVER_IP>:<PORT>/api.php/city/london -d '{"city_name":"New_HTB_City", "country_name":"HTB"}' -H 'Content-Type: application/json'` | Actualizar (modificar) una entrada            |
| `curl -X DELETE http://<SERVER_IP>:<PORT>/api.php/city/New_HTB_City`                                                                                    | Eliminar una entrada                          |

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

### Fuzzing Parámetros y Valores 

| **Acción**                                                                                                                               | **Descripción**                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| <pre><code>`curl -s http://<rhost>:<rport>/admin.php \| wc -c`</code></pre>                                                              | **(GET)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos.  |
| <pre><code>`curl -s http://<rhost>:<rport>/admin.php -X POST -H "Content-Type: application/x-www-form-urlencoded" \| wc -c`</code></pre> | **(POST)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos. |
^curl-fuzzing-parametros

### Enumeración de Sub-Dominios

| **Acción**                                                                                                                                                                                                            | **Descripción**                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| <pre><code>`curl -s https://crt.sh/\?q\=<target-domain>\&output\=json \| jq .`</code></pre>                                                                                                                           | <br>Obtiene los registros de transparencia de certificados para un dominio desde Crt.sh.  |
| <pre><code>`curl -s https://crt.sh/\?q\=<target-domain>\&output\=json \| jq . \| grep name \| cut -d":" -f2 \| grep -v "CN=" \| cut -d'"' -f2 \| awk '{gsub(/\\n/,"\n");}1;' \| sort -u > subdomain.lst`</code></pre> | <br>Extrae subdominios únicos de los registros de Crt.sh y los guarda en `subdomain.lst`. |
^curl-enum-subdominios



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
