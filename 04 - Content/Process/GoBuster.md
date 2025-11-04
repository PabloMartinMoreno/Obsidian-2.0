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
# GoBuster

***

## Cheatsheet

### Fuzzing de Paginas y Directorios

| **Acción**                                                                                            | **Descripción**                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`gobuster dir -u http://<ip>:<port>/ -w <wordlist>`</code></pre>                           | <br>Fuzzing de directorios usando una wordlist única; `-u` URL, `-w` wordlist.                                                                                                                                                               |
| <pre><code>`gobuster dir -u http://<ip>:<port>/ -w <ext-wordlist> -x php,html,js`</code></pre>        | <br>Fuzzing de archivos por extensión: `-x` lista de extensiones separadas por comas. Se requiere conocer o adivinar las extensiones a probar.                                                                                               |
| <pre><code>`gobuster dir -u http://<ip>:<port>/FUZZ.<extension> -w <filename-wordlist>`</code></pre>  | <br>Una vez identificada la extensión, prueba nombres de archivo con esa extensión concreta (construir la URL en la wordlist o usar `FUZZ.<ext>`).                                                                                           |
| <pre><code>`gobuster dir -u http://<ip>:<port>/FUZZ -w <wordlist> -x <single-extension>`</code></pre> | <br><br>Fuzzing limitado a una sola extensión (sin búsqueda recursiva automática). Útil para reducir ruido.                                                                                                                                  |
| <br>**(Nota)**                                                                                        | Gobuster no implementa recursión automática avanzada como feroxbuster; para fuzzing recursivo se recomienda usar feroxbuster o encadenar ejecuciones de gobuster con scripts. Recursividad es ruidosa y debe reservarse como último recurso. |
^gobuster
