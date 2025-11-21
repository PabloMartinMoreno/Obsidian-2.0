# Cross-Site Scripting (XSS) 

## Qué es

Las vulnerabilidades de HTML Injection a menudo pueden usarse para realizar ataques **Cross-Site Scripting (XSS)** inyectando código JavaScript que se ejecuta en el cliente. Si podemos ejecutar código en la máquina de la víctima, podemos potencialmente acceder a su cuenta o incluso a su equipo. XSS es muy similar a HTML Injection, pero **XSS inyecta JavaScript** para ataques más avanzados en el cliente, en lugar de solo HTML.

## Tipos principales 

* **Reflected XSS:** ocurre cuando la entrada del usuario se muestra en la página después de procesarla (p. ej. resultado de búsqueda o mensaje de error).
* **Stored XSS:** ocurre cuando la entrada del usuario se almacena en la base de datos del back end y luego se muestra al recuperarla (p. ej. posts o comentarios).
* **DOM XSS:** ocurre cuando la entrada del usuario se muestra directamente en el navegador y se escribe en un objeto del DOM (p. ej. nombre de usuario vulnerable o título de página).

## Ejemplo de DOM XSS 

Payload:

```javascript
#"><img src=/ onerror=alert(document.cookie)>
```

## Qué sucede al inyectarlo

* Al ingresar ese payload en el ejemplo vulnerable sin sanitización, aparece una ventana `alert` con el valor de la cookie del usuario.
* El payload accede al árbol DOM y recupera `document.cookie`; cuando el navegador procesa la entrada se considera un nuevo DOM y el JavaScript se ejecuta, mostrando la cookie en un popup.
* Un atacante puede usar esto para robar sesiones (enviar la cookie a sí mismo) y luego intentar autenticarse como la víctima.
* El mismo principio permite realizar otros tipos de ataques contra usuarios de la aplicación.








```js
<script>alert(window.origin)</script>
<img src="" onerror=alert(window.origin)>
```