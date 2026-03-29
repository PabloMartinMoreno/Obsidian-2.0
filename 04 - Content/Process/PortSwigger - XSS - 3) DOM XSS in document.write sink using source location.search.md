---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[PortSwigger - XSS - 4) DOM XSS in innerHTML sink using source location.search]]"
---
# PortSwigger - XSS - DOM XSS in document.write sink using source location.search

***

## Explicación 

### 🔷 DOM XSS
Es un tipo específico de XSS donde la vulnerabilidad ocurre **completamente en el navegador**, sin que el servidor esté involucrado. El JavaScript de la página toma datos del usuario y los mete en el DOM de forma insegura.

Existen 3 tipos de XSS:
- **Reflected** → el servidor refleja el input en la respuesta HTML
- **Stored** → el payload se guarda en la base de datos
- **DOM-based** → todo pasa en el cliente, el JS manipula el DOM directamente


---

### 🔷 Source (Fuente): `location.search`
Un **source** es el **origen de los datos controlados por el atacante**. Es donde el JavaScript lee información que el usuario puede manipular.

`location.search` es todo lo que va después del `?` en la URL:
```http
https://ejemplo.com/buscar?q=AQUI_VA_EL_SOURCE
```
Vos controlás ese valor simplemente modificando la URL.

Otros sources comunes: `location.hash`, `document.referrer`, `document.cookie`


---

### 🔷 Sink (Sumidero): `document.write`
Un **sink** es el **destino peligroso** donde terminan esos datos. Es la función o propiedad que, si recibe input malicioso, ejecuta el ataque.

`document.write()` escribe HTML directamente en la página. Si le pasás:
```javascript
document.write('<img src=x onerror=alert(1)>')
```
...el navegador lo renderiza y ejecuta el `alert`.

Otros sinks peligrosos: `innerHTML`, `eval()`, `setTimeout()`, `src`


---

### 🔷 El flujo completo del lab

```
URL (?q=TU_INPUT)
      ↓
    SOURCE
(location.search)
      ↓
[JavaScript de la página lo toma sin sanitizar]
      ↓
    SINK
(document.write)
      ↓
Se escribe HTML malicioso en el DOM
      ↓
alert() se ejecuta 💥
```

---

### Resumen de vocabulario clave

| Término | Qué es |
|---|---|
| **Source** | De dónde vienen los datos del atacante |
| **Sink** | Dónde terminan y causan el daño |
| **DOM XSS** | XSS que ocurre en el cliente, sin pasar por el servidor |
| **`location.search`** | La query string de la URL (`?q=algo`) |
| **`document.write`** | Función JS que escribe HTML crudo en la página |

___

## Respuesta

```js
"><script>alert(window.origin)</script><!--
```