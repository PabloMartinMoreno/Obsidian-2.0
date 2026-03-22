---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[PortSwigger - XSS - DOM XSS in jQuery anchor href attribute sink using location.search source]]"
---
# PortSwigger - XSS - DOM XSS in innerHTML sink using source location.search

***

## Explicación 

### 🔄 Lo que cambió: el Sink

| Lab anterior | Este lab |
|---|---|
| `document.write()` | `innerHTML` |

Mientras `document.write` escribe HTML en toda la página, **`innerHTML`** lo hace dentro de un elemento específico, por ejemplo un `<div>`:
```javascript
// El código vulnerable se ve algo así:
let query = location.search  // source: toma ?q=TU_INPUT
document.getElementById("resultado").innerHTML = query  // sink: lo pega en el div
```


### ⚠️ La diferencia importante con `document.write`

`innerHTML` **bloquea la etiqueta `<script>`** directamente, esto NO funciona:
```html
<script>alert(1)</script>   ❌
```

Tenés que usar **otros vectores HTML** que ejecuten JS, el más clásico:
```html
<img src=x onerror=alert(1)>   ✅
```

¿Por qué funciona? Porque el navegador intenta cargar la imagen, falla (la `src` es `x`, no existe), y dispara el evento `onerror` que ejecuta el JS.


### 🔷 El flujo del lab

```
URL (?search=TU_INPUT)
        ↓
      SOURCE
  (location.search)
        ↓
[JS toma el valor sin sanitizar]
        ↓
      SINK
   (innerHTML)
        ↓
Se inyecta HTML dentro de un <div>
        ↓
onerror / onload dispara alert() 💥
```


### 🔷 Comparación de los dos labs

| | Lab 1 | Lab 2 |
|---|---|---|
| **Source** | `location.search` | `location.search` |
| **Sink** | `document.write` | `innerHTML` |
| **Payload típico** | `<script>alert(1)</script>` | `<img src=x onerror=alert(1)>` |
| **¿Ejecuta `<script>`?** | ✅ Sí | ❌ No |


### 💡 Regla para recordar

> Cuando el sink es `innerHTML`, los `<script>` no funcionan. Buscá etiquetas que usen **event handlers** como `onerror`, `onload`, `onmouseover`.


## Respuesta

```js
<img src="" onerror=alert(window.origin)>
```