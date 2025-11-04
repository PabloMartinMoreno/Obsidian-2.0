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

| **Acción**                                                                                                    | **Descripción**                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br>```bash<br>ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ<br>```                                        | Hace fuzzing de directorios web usando una única wordlist. Si no se especifica un término iterador, FUZZ se asume por defecto.                                                                                                                                              |
| <br>`ffuf -c -w <ext-wordlist> -u http://<ip>:<port>/indexFUZZ`                                               | Hace fuzzing de archivos index en un directorio web usando una wordlist de extensiones de archivo. Las extensiones aceptadas deben conocerse antes de empezar.                                                                                                              |
| `ffuf -c -w <filename-wordlist> -u http://<ip>:<port>/FUZZ<extension>`                                        | Una vez identificada la extensión, hace fuzzing de archivos con esa extensión específica.                                                                                                                                                                                   |
| `ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ -e <dot-extension>`                                         | Sólo extensión, sin recursión                                                                                                                                                                                                                                               |
| <br>`ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ -recursion -recursion-depth <depth> -e <dot-extension>` | Hace fuzzing recursivo tanto de directorios web como de archivos. Si se encuentra un directorio, la búsqueda continúa dentro de esa rama. Esto es más ruidoso y consume más tiempo, pero es automatizado. PENDIENTE: Avisar que esto es un último recurso (un 'hail mary'). |
^ffuf




