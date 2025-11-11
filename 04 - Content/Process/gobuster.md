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
# GoBuster

***

## Cheatsheet

### Fuzzing de Paginas y Directorios

| **Comando**                                                                                           | **Descripción**                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`gobuster dir -u http://<IP>:<port>/ -w <wordlist>`</code></pre>                           | <br>Fuzzing de directorios usando una wordlist única; `-u` URL, `-w` wordlist.                                                                                                                                                               |
| <pre><code>`gobuster dir -u http://<IP>:<port>/ -w <ext-wordlist> -x php,html,js`</code></pre>        | <br>Fuzzing de archivos por extensión: `-x` lista de extensiones separadas por comas. Se requiere conocer o adivinar las extensiones a probar.                                                                                               |
| <pre><code>`gobuster dir -u http://<IP>:<port>/FUZZ.<extension> -w <filename-wordlist>`</code></pre>  | <br>Una vez identificada la extensión, prueba nombres de archivo con esa extensión concreta (construir la URL en la wordlist o usar `FUZZ.<ext>`).                                                                                           |
| <pre><code>`gobuster dir -u http://<IP>:<port>/FUZZ -w <wordlist> -x <single-extension>`</code></pre> | <br><br>Fuzzing limitado a una sola extensión (sin búsqueda recursiva automática). Útil para reducir ruido.                                                                                                                                  |
| <br>**(Nota)**                                                                                        | Gobuster no implementa recursión automática avanzada como feroxbuster; para fuzzing recursivo se recomienda usar feroxbuster o encadenar ejecuciones de gobuster con scripts. Recursividad es ruidosa y debe reservarse como último recurso. |
^gobuster-fuzzing-directorios

### Fuzzing de Parámetros y Valores

| **Comando**                                                                                                                                                                                                   | **Descripción**                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`gobuster fuzz -u "http://<IP>:<port>/admin.php?FUZZ=<appropriate-key>" -w <parameter-wordlist> -t 50`</code></pre>                                                                                | <br>**(GET)** Parámetros de distorsión utilizando el recuento de caracteres desde la línea de base para filtrar los resultados incorrectos. |
| <pre><code>`gobuster fuzz -u "http://<IP>:<port>/admin.php"  -w <parameter-wordlist>  --method POST --data 'FUZZ=<appropriate-key>'  -H 'Content-Type: application/x-www-form-urlencoded' -t 50`</code></pre> | <br>**(POST)** Parámetros difusos que utilizan el recuento de caracteres de la línea de base para filtrar los resultados erróneos.          |
^gobuster-fuzzing-parametros

### Fuzzing de Virtual Hosting

| **Comando**                                                                               | **Descripción**        |
| ----------------------------------------------------------------------------------------- | ---------------------- |
| <pre><code>`gobuster vhost -w <wordlist> -u <domain> --append-domain -t 200`</code></pre> | <br>Busqueda de vhosts |
^gobuster-enum-vhost

### DNS

```bash
gobuster dns --domain inlanefreight.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --no-error
```