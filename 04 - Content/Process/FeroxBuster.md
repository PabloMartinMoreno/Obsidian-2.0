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
# FeroxBuster

***

## Cheatsheet

| **Acción**                                                                | **Descripción**                                                                                                              |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `feroxbuster -u http://<ip>:<port>/ -w <wordlist>`                        | Fuzzing básico de directorios y archivos; detecta automáticamente respuestas válidas.                                        |
| `feroxbuster -u http://<ip>:<port>/ -w <wordlist> -x php,html,js`         | Fuzzing incluyendo extensiones específicas; `-x` define las extensiones separadas por comas.                                 |
| `feroxbuster -u http://<ip>:<port>/ -w <wordlist> -r`                     | Fuzzing recursivo: sigue los directorios encontrados hasta la profundidad predeterminada (máx. 4 niveles si no se modifica). |
| `feroxbuster -u http://<ip>:<port>/ -w <wordlist> -d <depth>`             | Control de profundidad de recursión; útil para limitar ruido o mejorar cobertura progresiva.                                 |
| `feroxbuster -u http://<ip>:<port>/ -w <wordlist> -x <ext> -d <depth> -r` | Fuzzing recursivo combinado con extensiones; explora directorios y archivos dentro de los subdirectorios descubiertos.       |
| `feroxbuster -u http://<ip>:<port>/ -w <wordlist> -s 403,404`             | Excluye códigos HTTP especificados; evita resultados irrelevantes o falsos positivos.                                        |
^feroxbuster