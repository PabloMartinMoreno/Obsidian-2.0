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
# FeroxBuster

***

## Cheatsheet

### Fuzzing de Paginas y Directorios

| **Acción**                                                                                            | **Descripción**                                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`feroxbuster -u http://<rhost>:<rport>/ -w <wordlist>`</code></pre>                        | <br>Fuzzing básico de directorios y archivos; detecta automáticamente respuestas válidas.                                        |
| <pre><code>`feroxbuster -u http://<rhost>:<rport>/ -w <wordlist> -x php,html,js`</code></pre>         | <br>Fuzzing incluyendo extensiones específicas; `-x` define las extensiones separadas por comas.                                 |
| <pre><code>`feroxbuster -u http://<rhost>:<rport>/ -w <wordlist> -r`</code></pre>                     | <br>Fuzzing recursivo: sigue los directorios encontrados hasta la profundidad predeterminada (máx. 4 niveles si no se modifica). |
| <pre><code>`feroxbuster -u http://<rhost>:<rport>/ -w <wordlist> -d <depth>`</code></pre>             | <br>Control de profundidad de recursión; útil para limitar ruido o mejorar cobertura progresiva.                                 |
| <pre><code>`feroxbuster -u http://<rhost>:<rport>/ -w <wordlist> -x <ext> -d <depth> -r`</code></pre> | <br>Fuzzing recursivo combinado con extensiones; explora directorios y archivos dentro de los subdirectorios descubiertos.       |
| <pre><code>`feroxbuster -u http://<rhost>:<rport>/ -w <wordlist> -s 403,404`</code></pre>             | <br>Excluye códigos HTTP especificados; evita resultados irrelevantes o falsos positivos.                                        |
^feroxbuster-fuzzing-directorios