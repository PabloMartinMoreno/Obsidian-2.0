---
aliases:
tags:
  - vuln/xss
  - technique/execution
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

## XSS Prevention

Para este punto, ya deberíamos tener una buena comprensión de qué es una vulnerabilidad XSS, sus distintos tipos, cómo detectarlas y cómo explotarlas. Concluiremos el módulo aprendiendo cómo **defendernos** de las vulnerabilidades XSS.

Como vimos antes, las vulnerabilidades XSS están principalmente vinculadas a dos partes de la aplicación web:

* **Un “Source” (fuente):** por ejemplo, un campo de entrada donde el usuario escribe algo.
* **Un “Sink” (sumidero):** donde ese input se muestra en la página.

Estos son **los dos puntos clave** que debemos asegurar, tanto en el **front-end** como en el **back-end**.

El aspecto más importante para prevenir XSS es realizar **correcta sanitización y validación de inputs**, tanto en el cliente como en el servidor. Además, existen medidas adicionales que pueden reforzar la seguridad contra XSS.

---

## Front-end

En el front-end se captura la mayor parte de la entrada del usuario, así que es esencial **validar y sanitizar la entrada desde el navegador**, usando JavaScript.

### Input Validation

Por ejemplo, en el ejercicio de XSS Discovery vimos que la aplicación no permitía enviar el formulario si el campo email no tenía un formato válido. Esto se hacía usando este código JavaScript:

```javascript
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test($("#login input[name=email]").val());
}
```

Este código prueba si el valor del input encaja con el formato de un email usando Regex.

### Input Sanitization

Además de validar el formato, debemos asegurarnos de no permitir que un usuario inserte código JavaScript en su input. Esto se hace escapando caracteres especiales.
Una forma es usando la librería **DOMPurify**:

```javascript
<script type="text/javascript" src="dist/purify.min.js"></script>
let clean = DOMPurify.sanitize(dirty);
```

Esto escapa caracteres peligrosos, previniendo vulnerabilidades como **DOM XSS**.

### Direct Input (Qué evitar en el front-end)

Nunca debemos insertar input del usuario directamente dentro de:

* Código JavaScript: `<script></script>`
* Código CSS: `<style></style>`
* Atributos HTML: `<div name='INPUT'></div>`
* Comentarios HTML: `<!-- -->`

Tampoco debemos usar funciones que escriben HTML sin sanitizar:

**JavaScript nativo:**

* `element.innerHTML`
* `element.outerHTML`
* `document.write()`
* `document.writeln()`
* `document.domain`

**jQuery:**

* `html()`
* `parseHTML()`
* `add()`
* `append()`
* `prepend()`
* `after()`
* `before()`
* `insertAfter()`
* `insertBefore()`
* `replaceAll()`
* `replaceWith()`

Todas estas funciones escriben HTML crudo, lo que puede ser peligroso si contienen input del usuario.

---

## Back-end

En el servidor debemos también asegurar que no haya Stored ni Reflected XSS. Como vimos en el ejercicio de XSS Discovery, el front-end validaba, pero igual fue posible inyectar payloads porque **la validación del lado del cliente nunca es suficiente**.

### Input Validation (Back-end)

Validación similar a la del front-end, usando Regex o funciones de librería.
Ejemplo en PHP:

```php
if (filter_var($_GET['email'], FILTER_VALIDATE_EMAIL)) {
    // do task
} else {
    // reject input - do not display it
}
```

En NodeJS podemos usar el mismo JavaScript que en el front-end.

### Input Sanitization (Back-end)

El back-end es el lugar crítico para sanitizar, porque el front-end se puede bypassear manipulando requests con herramientas como Burp Suite, curl, etc.

Ejemplo en PHP:

```php
addslashes($_GET['email'])
```

Nunca debemos mostrar directamente un input sin procesar (como `$_GET['email']`), porque puede introducir XSS.

NodeJS también puede usar **DOMPurify**, igual que el front-end:

```javascript
import DOMPurify from 'dompurify';
var clean = DOMPurify.sanitize(dirty);
```

---

## Output Encoding

Otro punto clave es la **codificación de salida**. Convertir caracteres especiales en HTML entities evita la ejecución de código.

Ejemplo en PHP:

```php
htmlentities($_GET['email']);
```

En NodeJS:

```javascript
import encode from 'html-entities';
encode('<'); // -> '&lt;'
```

Si toda la entrada está validada, sanitizada y codificada al mostrarla, el riesgo de XSS cae drásticamente.

---

## Server Configuration

Algunas configuraciones del servidor pueden ayudar a prevenir XSS:

* Usar **HTTPS** en todo el dominio.
* Enviar cabeceras anti-XSS, como:

  * `X-Content-Type-Options: nosniff`
  * `Content-Security-Policy: script-src 'self'`
* Usar cookies con flags:

  * **HttpOnly** — JavaScript no puede leerlas
  * **Secure** — solo por HTTPS

Además:

* Un buen **WAF** puede bloquear intentos de inyección.
* Algunos frameworks (como ASP.NET) incluyen protección XSS automática.

---

## Conclusión

Debemos aplicar todas estas medidas para asegurar las aplicaciones web contra XSS. Aun con buenas prácticas, siempre pueden existir fallos, por lo que es importante **probar defensivamente y ofensivamente** para identificar vulnerabilidades antes de que las exploten otros.

---

