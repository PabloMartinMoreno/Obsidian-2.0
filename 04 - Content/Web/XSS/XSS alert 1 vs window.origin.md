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

## ¿Por qué usar `window.origin` y no cualquier otra cosa?

Cuando probás un XSS usás un `alert()` solo para saber si el código se ejecuta. Podrías poner:

```js
alert(1)
```

y listo.
Pero **`window.origin` te da información extra útil**, especialmente en aplicaciones modernas.

---

## ¿Qué muestra cada uno?

### **`alert(1)`**

* Solo confirma que el XSS ejecutó.
* No te dice *dónde* se ejecutó.
* No sirve para identificar si la ejecución ocurrió en la página principal o dentro de un iframe.

### **`alert(window.origin)`**

* Muestra el **origen real donde se ejecutó el JS** → `scheme://domain:port`

  * Ej.: `https://example.com`
  * Ej.: `http://sub.dominio.com:8080`
* Te permite confirmar:

  * Si el payload se ejecutó en **el dominio vulnerado**.
  * Si se ejecutó dentro de un **iframe** (puede tener otro dominio).
  * Si fue filtrado/cambiado y se ejecuta en un contexto distinto.

---

## ¿Por qué esto es importante en pentesting moderno?

Muchas aplicaciones actuales usan iframes, proxys o microfrontends.

Ejemplo:
Una app tiene este formulario:

```
https://victima.com/app
    ↳ IFRAME: https://input-handler.thirdparty.com
```

Vos inyectás un XSS en el formulario, pero ese formulario está en un iframe con otro dominio.
Entonces:

### Si usás `alert(1)`

Solamente ves un "1".
No sabés *dónde* pasó el XSS.

### Si usás `alert(window.origin)`

Vas a ver algo como:

```
https://input-handler.thirdparty.com
```

→ Esto confirma que el XSS **NO** afecta al dominio principal (`victima.com`) sino al del iframe.

Esto cambia completamente tu reporte:

* Si la vulnerabilidad está en el iframe externo, la empresa puede decir *“Esto no es nuestro dominio”*
* Si está en el dominio principal, es un riesgo crítico → impacto alto.

---

## Resumen rápido

| Payload                  | ¿Qué te dice?                         | ¿Cuándo usarlo?                                       |
| ------------------------ | ------------------------------------- | ----------------------------------------------------- |
| `alert(1)`               | Solo confirma ejecución               | XSS simple, pruebas rápidas                           |
| `alert(window.origin)`   | Muestra el dominio real donde ejecuta | Apps con iframes, subdominios o microfrontends        |
| `alert(document.domain)` | Parecido, pero menos completo         | Cuando solo necesitás el dominio sin protocolo/puerto |
| `alert(location.href)`   | Te muestra la URL exacta              | Para confirmar parámetros y rutas vulnerables         |

---
