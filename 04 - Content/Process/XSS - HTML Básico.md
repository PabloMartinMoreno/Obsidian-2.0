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
# XSS - HTML Básico

***

## Cheatsheet

| **Etiqueta HTML** | **Payload de Ejemplo**                    | **Descripción del Vector**                                                                                                                                           |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<img>`           | `<img src="x" onerror="alert(1)">`        | Aprovecha los manejadores de eventos (event handlers). Al forzar un error mediante un origen inválido, se desencadena la ejecución del XSS.                          |
| `<body>`          | `<body onload="alert(1)">`                | Inyección a nivel estructural. Útil cuando el punto de inyección permite sobrescribir o añadir etiquetas principales del documento.                                  |
| `<a>`             | `<a href="javascript:alert(1)">Click</a>` | Utiliza el pseudo-protocolo `javascript:`. Depende de la interacción del usuario, siendo altamente efectivo en inyecciones que aterrizan dentro de atributos `href`. |
| `<svg>`           | `<svg onload=alert(1)>`                   | Uso de gráficos vectoriales. Efectivo para evadir filtros básicos o listas negras que solo inspeccionan etiquetas HTML tradicionales.                                |
| `<iframe>`        | `<iframe src="javascript:alert(1)">`      | Ejecuta el script dentro del contexto del documento actual mediante un marco incrustado.                                                                             |

### Contextos de Escapes Básicos

Para que la inyección de HTML básico resulte en un XSS exitoso, es crítico escapar del contexto actual si la entrada del usuario se refleja dentro de un atributo o de una etiqueta ya existente.
- **Cierre de Atributos:** Si el valor ingresado aterriza dentro de un atributo (ej. `<input type="text" value="INYECCIÓN_AQUÍ">`), se debe cerrar la comilla y la etiqueta antes de inyectar el nuevo HTML: `"><script>alert(1)</script>`
- **Cierre de Etiquetas de Texto:** Si la entrada se refleja dentro de etiquetas que bloquean la ejecución (ej. `<textarea>INYECCIÓN_AQUÍ</textarea>` o `<title>`), es necesario romper esa etiqueta primero: `</textarea><script>alert(1)</script>`


___

## Overview

El objetivo principal de esta técnica es lograr la ejecución de un ataque de [[XSS]] utilizando la inyección de etiquetas HTML básicas como vehículo. En lugar de aprovechar vulnerabilidades complejas en la lógica de JavaScript o explotar frameworks, el ataque se basa en la capacidad de insertar directamente elementos HTML maliciosos en el [[DOM]] debido a una falta de [[Sanitización]] en la entrada del usuario.

La inyección de HTML es, en este contexto específico, el método mecánico mediante el cual se introduce el código JavaScript que culminará en el XSS.


___

## Estrategias de Prevención

Para mitigar este vector específico de XSS basado en inyección directa de HTML, las defensas deben centrarse en invalidar la estructura de las etiquetas inyectadas:

- **Codificación de Entidades HTML:** Convertir estrictamente caracteres de control como `<` a `&lt;`, `>` a `&gt;`, `"` a `&quot;` y `'` a `&#x27;` antes de reflejar cualquier dato en el navegador. Esto fuerza al navegador a mostrar el texto en lugar de interpretarlo como código.
- **Content Security Policy:** Implementar una política [[CSP]] sólida que bloquee la ejecución de scripts en línea eliminando el permiso `unsafe-inline`, lo que neutraliza directamente la efectividad de estos payloads básicos.


---
