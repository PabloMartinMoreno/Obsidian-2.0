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
# Ffuf

***

## Cheatsheet

### Fuzzing de Paginas y Directorios

| **Acción**                                                                                                                        | **Descripción**                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`ffuf -c -w <wordlist> -u http://<IP>:<port>/FUZZ`</code></pre>                                                        | <br>Hace fuzzing de directorios web usando una única wordlist. Si no se especifica un término iterador, FUZZ se asume por defecto.                                                                            |
| <br><pre><code>`ffuf -c -w <ext-wordlist> -u http://<IP>:<rport>/indexFUZZ`</code></pre>                                          | <br>Hace fuzzing de archivos index en un directorio web usando una wordlist de extensiones de archivo. Las extensiones aceptadas deben conocerse antes de empezar.                                            |
| <pre><code>`ffuf -c -w <filename-wordlist> -u http://<IP>:<port>/FUZZ<extension>`</code></pre>                                    | <br>Una vez identificada la extensión, hace fuzzing de archivos con esa extensión específica.                                                                                                                 |
| <pre><code>`ffuf -c -w <wordlist> -u http://<IP>:<port>/FUZZ -e <dot-extension>`</code></pre>                                     | <br><br>Sólo extensión, sin recursión                                                                                                                                                                         |
| <pre><code>`ffuf -c -w <wordlist> -u http://<IP>:<port>/FUZZ -recursion -recursion-depth <depth> -e <dot-extension>`</code></pre> | <br>Hace fuzzing recursivo tanto de directorios web como de archivos. Si se encuentra un directorio, la búsqueda continúa dentro de esa rama. Esto es más ruidoso y consume más tiempo, pero es automatizado. |
^ffuf-fuzzing-directorios

### Fuzzing de Parámetros y Valores

| **Acción**                                                                                                                                                                                          | **Descripción**                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`ffuf -c -w <wordlist> -u http://<IP>:<port>/admin.php?FUZZ=<appropriate-key> -fs <char-count>`</code></pre>                                                                             | **(GET)** Parámetros de distorsión utilizando el recuento de caracteres desde la línea de base para filtrar los resultados incorrectos. |
| <pre><code>`ffuf -c -w <parameter-wordlist> -u http://<IP>:<port>/admin.php -X POST -d 'FUZZ=<appropriate-key>' -H 'Content-Type: application/x-www-form-urlencoded' -fs <char-count>`</code></pre> | **(POST)** Parámetros difusos que utilizan el recuento de caracteres de la línea de base para filtrar los resultados erróneos.          |
^ffuf-fuzzing-parametros

### Enumeración de Sub-Dominios y V.Host

| **Acción**                                                                                                       | **Descripción**                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`ffuf -c -w <wordlist> -u http://<IP>:<port>/ -H 'Host: FUZZ.<domain>' -fs <char-count>`</code></pre> | <br>Realiza fuzzing de hosts virtuales, filtrando según el recuento de caracteres. Tras encontrar un V-Host válido, añádelo a `/etc/hosts`. |
| <pre><code>`ffuf -c -w <wordlist> -u http://FUZZ.<domain>/`</code></pre>                                         | <br>Realiza fuzzing de subdominios DNS (solo funciona en sitios web públicos). Evita usar direcciones IP, usa dominios DNS reales.          |
^ffuf-enum-vhost