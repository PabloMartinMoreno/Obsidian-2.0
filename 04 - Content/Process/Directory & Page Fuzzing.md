---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/web
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Directory & Page Fuzzing

***

## Cheatsheet
````tabs 
tab: Comandos

| **Acción**                                                                                                                         | **Descripción**                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Revisar estas páginas:**<br>robots.txt <br>sitemap.xml <br>.git                                                                  | PENDIENTE: quizás esto debería estar en otro artículo, o solo en mi página de metodología                                                                                                                                                                                   |
| <br>`ffuf -c -w <wordlist> -u http://<target-ip-or-domain>:<port>/FUZZ`                                                            | Hace fuzzing de directorios web usando una única wordlist. Si no se especifica un término iterador, FUZZ se asume por defecto.                                                                                                                                              |
| <br>`ffuf -c -w <ext-wordlist> -u http://<target-ip-or-domain>:<port>/indexFUZZ`                                                   | Hace fuzzing de archivos index en un directorio web usando una wordlist de extensiones de archivo. Las extensiones aceptadas deben conocerse antes de empezar.                                                                                                              |
| `ffuf -c -w <filename-wordlist> -u http://<target-ip-or-domain>:<port>/FUZZ<extension>`                                            | Una vez identificada la extensión, hace fuzzing de archivos con esa extensión específica.                                                                                                                                                                                   |
| `ffuf -c -w <wordlist> -u http://<target-ip-or-domain>:<port>/FUZZ -e <dot-extension>`                                             | PENDIENTE: solo extensión, sin recursión                                                                                                                                                                                                                                    |
| <br><br>`ffuf -c -w <wordlist> -u http://<target-ip-or-domain>:<port>/FUZZ -recursion -recursion-depth <depth> -e <dot-extension>` | Hace fuzzing recursivo tanto de directorios web como de archivos. Si se encuentra un directorio, la búsqueda continúa dentro de esa rama. Esto es más ruidoso y consume más tiempo, pero es automatizado. PENDIENTE: Avisar que esto es un último recurso (un 'hail mary'). |



tab: Wordlists

| **Wordlists para usar:**                                                                                        |
| --------------------------------------------------------------------------------------------------------------- |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-small.txt` (para nombres de archivo)  |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt` (para nombres de archivo) |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/web-extensions.txt` (para extensiones)                   |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-extensions-lowercase.txt` (para extensiones) |

````

---

### Resumen

**El fuzzing web ayuda a descubrir directorios y archivos ocultos en un servidor probando nombres comunes de una wordlist.**

Usando herramientas como ffuf, puede identificar recursos accesibles pero ocultos, incluyendo archivos con extensiones específicas o archivos index.

La recursión permite una exploración más profunda dentro de los directorios descubiertos para revelar más contenido oculto.