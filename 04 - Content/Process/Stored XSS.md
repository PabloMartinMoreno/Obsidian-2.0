
---

## XSS Almacenado (Stored XSS)

Antes de aprender cómo descubrir vulnerabilidades XSS y cómo utilizarlas para distintos ataques, primero debemos entender los diferentes tipos de vulnerabilidades XSS y sus diferencias, para saber cuál usar en cada tipo de ataque.

El primer y más crítico tipo de vulnerabilidad XSS es el **XSS Almacenado** o **XSS Persistente**. Si nuestro payload XSS inyectado queda almacenado en la base de datos del back-end y se recupera cada vez que se visita la página, significa que nuestro ataque XSS es persistente y puede afectar a cualquier usuario que visite esa página.

Esto hace que este tipo de XSS sea el más crítico, ya que afecta a un público mucho más amplio: cualquier usuario que visite la página será víctima del ataque. Además, el XSS almacenado puede no ser fácil de remover; el payload podría necesitar ser eliminado manualmente desde la base de datos del back-end.

Podemos iniciar el servidor de abajo para ver y practicar un ejemplo de Stored XSS. Como podemos ver, la página web es una aplicación simple de lista de tareas (To-Do List) a la cual podemos agregar ítems. Podemos escribir "test" y presionar enter/return para agregar un nuevo ítem y ver cómo maneja la entrada:

*Interfaz de To-Do List con campo de entrada y botón de reset.*

Como vemos, nuestra entrada se muestra en la página. Si no se aplicara ninguna sanitización o filtrado a nuestra entrada, la página podría ser vulnerable a XSS.

---

## Payloads para probar XSS

Podemos probar si la página es vulnerable a XSS usando el siguiente payload básico:

```html
<script>alert(window.origin)</script>
```

Usamos este payload porque es un método muy fácil de detectar cuando el XSS se ejecuta correctamente. Si la página permite cualquier entrada y no realiza sanitización, entonces debería aparecer un cuadro de alerta con la URL de la página en la que se ejecuta, justo después de ingresar el payload o al refrescar la página:

*Dirección IP 139.59.166.56:31323 con botón OK.*

Como podemos ver, efectivamente aparece el alert, lo que significa que la página es vulnerable a XSS, ya que nuestro payload se ejecutó con éxito. Podemos confirmarlo viendo el código fuente de la página con [CTRL+U] o haciendo clic derecho → View Page Source. Ahí deberíamos ver nuestro payload en el código:

```html
<div></div><ul class="list-unstyled" id="todo"><ul>
<script>alert(window.origin)</script>
</ul></ul>
```

```ad-tip
Muchas aplicaciones modernas usan IFrames de dominios diferentes para manejar la entrada del usuario. Así, incluso si el formulario es vulnerable a XSS, la vulnerabilidad no afectaría a la aplicación principal. Por eso mostramos **window.origin** en el alert, en lugar de un valor fijo como "1". Esto permite ver en qué dominio se está ejecutando el payload y confirmar si el formulario vulnerable está dentro de un IFrame.
```

Como algunos navegadores modernos pueden bloquear la función `alert()` en ciertas situaciones, es útil conocer otros payloads básicos para verificar XSS. Algunos ejemplos:

* `<plaintext>` → detiene el renderizado de HTML y muestra el resto como texto plano.
* `<script>print()</script>` → abre el diálogo de impresión del navegador, algo que normalmente no se bloquea.

Podés usar estos payloads para ver cómo funciona cada uno. El botón de reset permite borrar cualquier payload activo.

---

Para verificar si el payload es persistente y está almacenado en el back-end, podemos refrescar la página y ver si aparece el alert nuevamente. Si vuelve a aparecer, significa que el payload se ejecuta incluso después de refrescar, confirmando que es un XSS Almacenado/Persistente. Esto no solo nos afecta a nosotros: **cualquier usuario que visite la página ejecutará el payload y verá el mismo alerta**.

---


[[XSS alert 1 vs window.origin]]