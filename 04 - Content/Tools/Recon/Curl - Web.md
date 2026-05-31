---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
kind: Sub-Command
linked:
---
# Curl - Web

***

## Cheatsheet

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
| `curl -c cookie.txt http://<user>:<pass>@<SERVER_IP>:<PORT>/`                                                    | Guarda la cookie en un archivo                                       |
| `curl -X POST -d '{"search":"london"}' -H 'Content-Type: application/json' http://<SERVER_IP>:<PORT>/search.php` | Envía una solicitud POST con datos en formato JSON                   |
^curl-web