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


| **Acción**                                                                    | **Descripción**                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gobuster dir -u http://<ip>:<port>/ -w <wordlist>`                           | Fuzzing de directorios usando una wordlist única; `-u` URL, `-w` wordlist.                                                                                                                                                                   |
| `gobuster dir -u http://<ip>:<port>/ -w <ext-wordlist> -x php,html,js`        | Fuzzing de archivos por extensión: `-x` lista de extensiones separadas por comas. Se requiere conocer o adivinar las extensiones a probar.                                                                                                   |
| `gobuster dir -u http://<ip>:<port>/FUZZ.<extension> -w <filename-wordlist>`  | Una vez identificada la extensión, prueba nombres de archivo con esa extensión concreta (construir la URL en la wordlist o usar `FUZZ.<ext>`).                                                                                               |
| `gobuster dir -u http://<ip>:<port>/FUZZ -w <wordlist> -x <single-extension>` | Fuzzing limitado a una sola extensión (sin búsqueda recursiva automática). Útil para reducir ruido.                                                                                                                                          |
| **(Nota)**                                                                    | Gobuster no implementa recursión automática avanzada como feroxbuster; para fuzzing recursivo se recomienda usar feroxbuster o encadenar ejecuciones de gobuster con scripts. Recursividad es ruidosa y debe reservarse como último recurso. |
^gobuster
