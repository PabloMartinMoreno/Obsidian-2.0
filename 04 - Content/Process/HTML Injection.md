## Qué es

HTML Injection ocurre cuando la entrada de un usuario **no se filtra** y se muestra directamente en la página. Si el usuario controla cómo se renderiza su entrada, puede enviar código HTML que el navegador interpretará como parte de la página.

## Dónde ocurre y por qué importa

* Puede ocurrir al recuperar contenido guardado en el back-end (p. ej. comentarios) o al procesar y mostrar datos **completamente en el front-end** vía JavaScript.
* Es crítico **validar y sanitizar** la entrada tanto en el front-end como en el back-end.
* Si no se controla, permite ataques como **XSS** (Cross-Site Scripting), formularios falsos que roban credenciales, o **defacement** (cambiar la apariencia del sitio, insertar anuncios maliciosos, etc.). El impacto puede ser técnico (exfiltración de datos) y reputacional.

## Ejemplo

Página simple con un botón que pide el nombre y lo muestra usando `innerHTML`:

```html
<!DOCTYPE html>
<html>
<body>
    <button onclick="inputFunction()">Click to enter your name</button>
    <p id="output"></p>

    <script>
        function inputFunction() {
            var input = prompt("Please enter your name", "");
            if (input != null) {
                document.getElementById("output").innerHTML = "Your name is " + input;
            }
        }
    </script>
</body>
</html>
```

Si se ingresa HTML en el prompt (por ejemplo un `<style>` que cambie el `background-image`), el navegador aplicará ese HTML y la página cambiará al instante. En este caso todo ocurre en el front-end, por lo que un refresco devuelve la página a su estado original.

## Payload de Prueba 1

```html
<style> body { background-image: url('https://academy.hackthebox.com/images/logo.svg'); } </style>
```
### Qué sucede al inyectarlo 

* Al introducir ese fragmento en el prompt, el navegador **renderiza** el `<style>` y la página cambia la imagen de fondo instantáneamente.
* Porque todo ocurre en el front-end, **refrescar** devuelve la página a su estado normal.

## Payload de Prueba 2

```html
<a href="http://www.hackthebox.com">Click Me</a>
```
### Qué sucede al inyectarlo 

* Si en el prompt pegas `<a href="http://www.hackthebox.com">Click Me</a>`, el contenido se inserta vía `innerHTML`.
* El navegador **renderiza** el enlace como HTML, por lo que en la página aparecerá:
  `Your name is Click Me` — donde "Click Me" es un link clickeable que apunta a `http://www.hackthebox.com`.
* En este ejemplo todo ocurre en el front-end; refrescar la página quita el enlace (no se persiste).

