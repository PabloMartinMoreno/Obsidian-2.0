---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
---
# Fuff

***

## Cheatsheet

### Fuzzing de Paginas y Directorios

| **Acción**                                                                                                                        | **Descripción**                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre lang="python"><code>`ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ`</code></pre>                                          | <br>Hace fuzzing de directorios web usando una única wordlist. Si no se especifica un término iterador, FUZZ se asume por defecto.                                                                            |
| <br><pre><code>`ffuf -c -w <ext-wordlist> -u http://<ip>:<port>/indexFUZZ`</code></pre>                                           | <br>Hace fuzzing de archivos index en un directorio web usando una wordlist de extensiones de archivo. Las extensiones aceptadas deben conocerse antes de empezar.                                            |
| <pre><code>`ffuf -c -w <filename-wordlist> -u http://<ip>:<port>/FUZZ<extension>`</code></pre>                                    | <br>Una vez identificada la extensión, hace fuzzing de archivos con esa extensión específica.                                                                                                                 |
| <pre><code>`ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ -e <dot-extension>`</code></pre>                                     | <br><br>Sólo extensión, sin recursión                                                                                                                                                                         |
| <pre><code>`ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ -recursion -recursion-depth <depth> -e <dot-extension>`</code></pre> | <br>Hace fuzzing recursivo tanto de directorios web como de archivos. Si se encuentra un directorio, la búsqueda continúa dentro de esa rama. Esto es más ruidoso y consume más tiempo, pero es automatizado. |
^ffuf
