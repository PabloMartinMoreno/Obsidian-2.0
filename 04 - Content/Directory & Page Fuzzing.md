---
aliases:
  - Fuzzing de Paginas y Directorios
tags:
  - type/cheatsheet
  - technique/recon/active
  - asset/web-app
  - tool/ffuf
  - tool/gobuster
  - meta/wordlists
  - meta/params
  - protocol/http
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


tab: Ffuf

| **Acción**                                                                                                    | **Descripción**                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br>`ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ`                                                        | Hace fuzzing de directorios web usando una única wordlist. Si no se especifica un término iterador, FUZZ se asume por defecto.                                                                                                                                              |
| <br>`ffuf -c -w <ext-wordlist> -u http://<ip>:<port>/indexFUZZ`                                               | Hace fuzzing de archivos index en un directorio web usando una wordlist de extensiones de archivo. Las extensiones aceptadas deben conocerse antes de empezar.                                                                                                              |
| `ffuf -c -w <filename-wordlist> -u http://<ip>:<port>/FUZZ<extension>`                                        | Una vez identificada la extensión, hace fuzzing de archivos con esa extensión específica.                                                                                                                                                                                   |
| `ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ -e <dot-extension>`                                         | Sólo extensión, sin recursión                                                                                                                                                                                                                                               |
| <br>`ffuf -c -w <wordlist> -u http://<ip>:<port>/FUZZ -recursion -recursion-depth <depth> -e <dot-extension>` | Hace fuzzing recursivo tanto de directorios web como de archivos. Si se encuentra un directorio, la búsqueda continúa dentro de esa rama. Esto es más ruidoso y consume más tiempo, pero es automatizado. PENDIENTE: Avisar que esto es un último recurso (un 'hail mary'). |

tab: GoBuster

| **Acción**                                                                    | **Descripción**                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gobuster dir -u http://<ip>:<port>/ -w <wordlist>`                           | Fuzzing de directorios usando una wordlist única; `-u` URL, `-w` wordlist.                                                                                                                                                                   |
| `gobuster dir -u http://<ip>:<port>/ -w <ext-wordlist> -x php,html,js`        | Fuzzing de archivos por extensión: `-x` lista de extensiones separadas por comas. Se requiere conocer o adivinar las extensiones a probar.                                                                                                   |
| `gobuster dir -u http://<ip>:<port>/FUZZ.<extension> -w <filename-wordlist>`  | Una vez identificada la extensión, prueba nombres de archivo con esa extensión concreta (construir la URL en la wordlist o usar `FUZZ.<ext>`).                                                                                               |
| `gobuster dir -u http://<ip>:<port>/FUZZ -w <wordlist> -x <single-extension>` | Fuzzing limitado a una sola extensión (sin búsqueda recursiva automática). Útil para reducir ruido.                                                                                                                                          |
| **(Nota)**                                                                    | Gobuster no implementa recursión automática avanzada como feroxbuster; para fuzzing recursivo se recomienda usar feroxbuster o encadenar ejecuciones de gobuster con scripts. Recursividad es ruidosa y debe reservarse como último recurso. |

tab: FeroxBuster

|**Acción**|**Descripción**|
|---|---|
|`feroxbuster -u http://<ip>:<port>/ -w <wordlist>` (feroxbuster)|Fuzzing básico de directorios y archivos; detecta automáticamente respuestas válidas.|
|`feroxbuster -u http://<ip>:<port>/ -w <wordlist> -x php,html,js` (feroxbuster)|Fuzzing incluyendo extensiones específicas; `-x` define las extensiones separadas por comas.|
|`feroxbuster -u http://<ip>:<port>/ -w <wordlist> -r` (feroxbuster)|Fuzzing recursivo: sigue los directorios encontrados hasta la profundidad predeterminada (máx. 4 niveles si no se modifica).|
|`feroxbuster -u http://<ip>:<port>/ -w <wordlist> -d <depth>` (feroxbuster)|Control de profundidad de recursión; útil para limitar ruido o mejorar cobertura progresiva.|
|`feroxbuster -u http://<ip>:<port>/ -w <wordlist> -x <ext> -d <depth> -r` (feroxbuster)|Fuzzing recursivo combinado con extensiones; explora directorios y archivos dentro de los subdirectorios descubiertos.|
|`feroxbuster -u http://<ip>:<port>/ -w <wordlist> -s 403,404` (feroxbuster)|Excluye códigos HTTP especificados; evita resultados irrelevantes o falsos positivos.|

tab: Wordlists

| **Wordlists para usar:**                                                                                        |
| --------------------------------------------------------------------------------------------------------------- |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-small.txt` (para nombres de archivo)  |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt` (para nombres de archivo) |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/web-extensions.txt` (para extensiones)                   |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-extensions-lowercase.txt` (para extensiones) |

````

```ad-important
Mirar siempre estas paginas: 
- `robots.txt`
- `sitemap.xml`
- `.git`
```


---

### Resumen

**El fuzzing web ayuda a descubrir directorios y archivos ocultos en un servidor probando nombres comunes de una wordlist.**

Usando herramientas como ffuf, puede identificar recursos accesibles pero ocultos, incluyendo archivos con extensiones específicas o archivos index.

La recursión permite una exploración más profunda dentro de los directorios descubiertos para revelar más contenido oculto.