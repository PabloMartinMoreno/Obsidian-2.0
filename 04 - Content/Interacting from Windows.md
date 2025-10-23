---
aliases:
tags:
  - type/cheatsheet
  - service/smb
  - env/windows
  - tool/powershell
  - tool/net
  - tool/dir
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# Interacting from Windows

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`net view \\<host> /all`|Muestra todos los recursos compartidos SMB, dominios y recursos de un host.|
|`dir \\<host>\<share>\`|Muestra el contenido del recurso compartido especificado.|
|`net use n: \\<host>\<share>\`|Asocia el recurso compartido especificado a la unidad N: (u otra letra disponible).|
|`net use n: \\<host>\<share>\ /user:<user> <password>`|Asocia el recurso compartido a la unidad N: con autenticación.|
|`net use n: /delete`|Desconecta del recurso compartido, reemplazando N: con la letra de unidad mapeada.|

## Overview

Puedes interactuar con recursos SMB desde hosts Windows usando **CMD** o **PowerShell**.

Ambas interfaces de línea de comandos permiten listar el contenido de carpetas compartidas, conectarse a recursos compartidos remotos y gestionar unidades mapeadas.

*Esto es especialmente útil si se necesitan **exfiltrar datos** a través de SMB.* **#porhacer: enlazar a la nota de exfiltración usando SMB.**