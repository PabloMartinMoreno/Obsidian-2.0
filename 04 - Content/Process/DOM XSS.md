---
aliases:
tags:
  - type/cheatsheet
  - vuln/xss
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

## XSS basado en DOM (DOM XSS)

El tercer y último tipo de XSS es otro tipo No Persistente llamado **XSS basado en DOM**.
Mientras que el XSS reflejado envía los datos al servidor back-end mediante solicitudes HTTP, el XSS basado en DOM se procesa **completamente en el lado del cliente** mediante JavaScript.
El DOM XSS ocurre cuando JavaScript modifica el contenido de la página a través del **Document Object Model (DOM)**.

Podemos ejecutar el servidor de abajo para ver un ejemplo de una aplicación web vulnerable a DOM XSS. Si agregamos un ítem de prueba, veremos que la aplicación es similar a las To-Do List usadas anteriormente:

*Interfaz con "Next Task: test".*

Sin embargo, si abrimos la pestaña **Network** en las Firefox Developer Tools y volvemos a agregar el ítem de prueba, notaremos que **no se realiza ninguna solicitud HTTP**:

*"No network activity".*

Observamos que el parámetro de entrada aparece en la URL usando un **hashtag `#`**, lo que significa que es un parámetro del lado del cliente, procesado completamente en el navegador. Esto indica que la entrada está siendo manejada en el cliente mediante JavaScript y **nunca llega al back-end**, por lo tanto es un **DOM-based XSS**.

Además, si vemos el código fuente con **CTRL+U**, notaremos que nuestra cadena de prueba **no aparece en ninguna parte**.
Esto se debe a que el código JavaScript actualiza la página **después** de que el documento HTML ya fue cargado por el navegador, así que el código fuente base no mostrará nuestra entrada.
Y si refrescamos, la entrada desaparece (es decir, es **No Persistente**).
Podemos ver el DOM renderizado usando el Inspector con **CTRL+SHIFT+C**:

*(HTML renderizado mostrando “Next Task: test”)*

---

## Source & Sink

Para comprender mejor el funcionamiento del DOM XSS, debemos entender los conceptos de **Source** y **Sink**.

* **Source**: el objeto JavaScript que recibe la entrada del usuario (por ejemplo, parámetros de URL o campos de entrada).
* **Sink**: la función que escribe esa entrada dentro de un objeto DOM en la página.

Si la función Sink **no sanitiza** la entrada del usuario, entonces puede ser vulnerable a XSS.

Funciones comunes que actúan como Sinks peligrosos:

* `document.write()`
* `element.innerHTML`
* `element.outerHTML`

Funciones de jQuery que también escriben en el DOM:

* `add()`
* `after()`
* `append()`

Si el Sink escribe la entrada tal cual (sin sanitización), la página es vulnerable.

Podemos revisar el código fuente de la aplicación To-Do y ver `script.js`, donde encontramos que el **Source** viene del parámetro `task=`:

```javascript
var pos = document.URL.indexOf("task=");
var task = document.URL.substring(pos + 5, document.URL.length);
```

Debajo vemos que la página usa **innerHTML** para mostrar el valor:

```javascript
document.getElementById("todo").innerHTML =
    "<b>Next Task:</b> " + decodeURIComponent(task);
```

Así confirmamos que:

* podemos controlar la entrada,
* y se muestra sin sanitización,

por lo que la página debería ser vulnerable a DOM XSS.

---

## Ataques DOM XSS

Si probamos el payload XSS que usamos en secciones anteriores, veremos que **no funcionará**.
Esto se debe a que `innerHTML` **no permite etiquetas `<script>`** como medida de seguridad.

Pero existen muchos payloads que no usan `<script>`, por ejemplo:

```html
<img src="" onerror=alert(window.origin)>
```

Esta línea crea una imagen con un atributo `onerror` que ejecuta JavaScript cuando la imagen falla al cargar.
Como le damos un `src=""`, siempre fallará, por lo que nuestro código se ejecutará sin necesidad de `<script>`:

*XSS disparándose con `onerror`.*

Para atacar a un usuario con esta vulnerabilidad, podemos copiar la URL desde el navegador y enviársela.
Cuando la víctima cargue la URL, el código JavaScript se ejecutará.

Estos payloads son solo ejemplos básicos.
En aplicaciones más seguras o navegadores modernos, necesitarás otros payloads específicos, algo que veremos en la siguiente sección.

---

