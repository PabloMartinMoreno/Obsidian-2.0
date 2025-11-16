
## XSS Reflejado (Reflected XSS)

Existen dos tipos de vulnerabilidades XSS No Persistentes:

* **XSS Reflejado**, que es procesado por el servidor back-end.
* **XSS basado en DOM**, que se procesa completamente del lado del cliente y nunca llega al servidor.

A diferencia del XSS Persistente, las vulnerabilidades XSS No Persistentes son temporales y **no permanecen** después de refrescar la página. Por lo tanto, nuestros ataques solo afectan al **usuario objetivo**, y no a otros usuarios que visiten la página.

Las vulnerabilidades XSS reflejadas ocurren cuando nuestra entrada llega al servidor back-end y es devuelta sin ser filtrada o sanitizada. Hay muchos casos donde nuestra entrada puede devolverse completa, como mensajes de error o confirmaciones. En estos casos, podemos probar payloads XSS para ver si se ejecutan. Sin embargo, como suelen ser mensajes temporales, al movernos de la página ya no volverán a ejecutarse, por eso son **No Persistentes**.

Podemos iniciar el servidor de abajo para practicar en una página vulnerable a XSS Reflejado. Es una app de lista de tareas similar a la de la sección anterior. Podemos intentar agregar cualquier cadena de prueba para ver cómo es manejada:

*Interfaz de To-Do List con el mensaje de error: “Task 'test' could not be added.”*

Como vemos, recibimos **Task 'test' could not be added.**, que incluye nuestra entrada **test** dentro del mensaje de error. Si la entrada no fue filtrada ni sanitizada, la página podría ser vulnerable a XSS. Probemos el mismo payload que antes y hagamos clic en *Add*:

*Input con `<script>alert(window.origin)</script>` y botón Add.*

Al hacer clic en **Add**, aparece el alert emergente:

*IP 139.59.166.56:31323 con botón OK.*

En este caso, vemos que el mensaje de error ahora dice **Task '' could not be added.**.
Como el payload está envuelto en una etiqueta `<script>`, el navegador no lo muestra como texto, por lo que vemos comillas vacías `''`.
Podemos verificarlo nuevamente viendo el código fuente:

```html
<div></div><ul class="list-unstyled" id="todo"><div style="padding-left:25px">
Task '<script>alert(window.origin)</script>' could not be added.
</div></ul>
```

Como podemos ver, las comillas simples contienen nuestro payload exactamente.

Si visitamos nuevamente la página Reflected, el mensaje de error ya no aparece y el payload no se ejecuta, lo que confirma que esta vulnerabilidad XSS es **No Persistente**.

---

## ¿Pero si no es persistente, cómo atacamos a una víctima?

Esto depende de **qué tipo de request HTTP** envía nuestra entrada al servidor.

Podemos comprobarlo usando las Firefox Developer Tools con **CTRL+Shift+I**, pestaña **Network**.
Luego enviamos el payload nuevamente y observamos la solicitud:

*Tabla Network mostrando una solicitud GET.*

Como se ve, la primera fila muestra que nuestra solicitud fue un **GET**.
Los **GET** envían sus parámetros en la **URL**.

Esto significa que para atacar a un usuario, simplemente debemos **enviarle una URL que contenga nuestro payload XSS**.

Podemos obtener la URL:

* copiándola desde la barra del navegador después de enviar el payload, o
* haciendo clic derecho en la solicitud GET → **Copy > Copy URL**.

Cuando la víctima visite esa URL, el XSS se ejecutará:

*IP 139.59.166.56:31323 con botón OK.*

---

