---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
#  Comandos IMAP Comunes

***

## Overview

|**Acción**|**Descripción**|
|---|---|
|`1 LOGIN <usuario> <contraseña>`|**Autentica al usuario** con el nombre de usuario y contraseña proporcionados.|
|`1 LIST "" *`|**Lista todos los buzones de correo** disponibles en el servidor.|
|`1 CREATE "<buzón>"`|**Crea un nuevo buzón** con el nombre especificado.|
|`1 DELETE "<buzón>"`|**Elimina el buzón** especificado.|
|`1 RENAME "<antiguo>" "<nuevo>"`|**Cambia el nombre** de un buzón de correo de su nombre antiguo a uno nuevo.|
|`1 LSUB "" *`|**Lista los buzones suscritos** del usuario.|
|`1 SELECT <buzón>`|**Selecciona el buzón especificado** para acceder a los mensajes.|
|`1 UNSELECT <buzón>`|**Deselecciona el buzón** actualmente seleccionado.|
|`1 FETCH <ID> all`|**Obtiene todos los datos** asociados con el mensaje identificado por el ID dado.|
|`1 CLOSE`|**Cierra el buzón actual** y elimina los mensajes marcados.|
|`1 LOGOUT`|**Finaliza la sesión** y desconecta al usuario del servidor IMAP.|
**Nota:** En los comandos IMAP, **incrementar los ID de comando** (por ejemplo, `1`, `2`, `3`, etc.) a medida que se avanza en la sesión.

---
