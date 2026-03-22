---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[PortSwigger - XSS - DOM XSS in jQuery selector sink using a hashchange event]]"
---
# PortSwigger - XSS - DOM XSS in jQuery anchor href attribute sink using location.search source

***

## Explicación

### 🔷 Lo nuevo: el Sink es un atributo `href`

Hasta ahora los sinks eran funciones que escribían HTML. Acá el sink es el **atributo `href` de un `<a>`** (un link). El código vulnerable se ve así:
```javascript
// jQuery busca el link "Volver" y le cambia el href con tu input
$(function() {
    $('#backLink').attr("href", location.search);  
    //                  ↑ sink          ↑ source
});
```

Entonces si la URL es:
```
/feedback?returnPath=/mi-input
```
El link "Volver" queda así en el HTML:
```html
<a href="/mi-input">Back</a>
```


### 🔷 ¿Cómo se ejecuta JS desde un `href`?

El truco es el protocolo **`javascript:`**. Un `href` puede ejecutar JS directamente cuando el usuario hace click:
```html
<a href="javascript:alert(1)">Back</a>   ✅
```
El navegador interpreta `javascript:` como "ejecutá esto como código", no como una URL normal.



### 🔷 Lo nuevo: el objetivo es `document.cookie`

Los labs anteriores pedían `alert(1)` solo para probar ejecución. Este pide `alert(document.cookie)` para simular un ataque **más realista**: robar las cookies de sesión de la víctima.

```
javascript:alert(document.cookie)
```


### 🔷 El flujo del lab

```
URL (?returnPath=TU_INPUT)
          ↓
        SOURCE
    (location.search)
          ↓
    [jQuery toma el valor]
          ↓
        SINK
  (attr("href", valor))
          ↓
<a href="javascript:alert(document.cookie)">
          ↓
Usuario hace click en "Back"
          ↓
Se ejecuta el JS y se exponen las cookies 💥
```


### 🔷 Comparación de los tres labs

| | Lab 1 | Lab 2 | Lab 3 |
|---|---|---|---|
| **Source** | `location.search` | `location.search` | `location.search` |
| **Sink** | `document.write` | `innerHTML` | `attr("href")` |
| **Payload** | `<script>alert(1)</script>` | `<img src=x onerror=alert(1)>` | `javascript:alert(document.cookie)` |
| **Trigger** | Automático | Automático | Click del usuario |


### 💡 Reglas para recordar

> - Cuando el sink es un **atributo `href`**, el vector es `javascript:`
> - `javascript:` **solo se activa con un click**, no es automático como los anteriores
> - `document.cookie` simula el robo real de sesión, que es el objetivo final de XSS en la vida real


___

## Solución

```js
URL...?returnPath=javascript: alert(document.cookie)
```