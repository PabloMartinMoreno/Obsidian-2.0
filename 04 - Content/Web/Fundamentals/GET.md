---
aliases:
  - GET Requests
tags:
  - service/http
  - asset/web-app
  - technique/recon/active
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTP - Métodos]]"
  - "[[HTTP - Basic Auth]]"
  - "[[HTTP - Headers]]"
  - "[[curl]]"
---
# GET

El método **GET** recupera un recurso del servidor **sin modificar su estado**. Es seguro e idempotente; sus parámetros viajan en la [[URL]].

---

## Cheatsheet

- **Propósito:** Solicitar una representación de un recurso específico.
- **Idempotencia:** Sí. Ejecutarlo múltiples veces produce el mismo resultado que una sola vez.
- **Seguridad (Safe Method):** Sí. Es un método de solo lectura; no modifica el estado del servidor.
- **Transmisión de datos:** Exclusivamente a través de la URL utilizando [[Query Parameters]].
- **Caché:** Sí. Las respuestas son altamente almacenables en caché por navegadores y [[Servidores Proxy]].
- **Límite de tamaño:** Restringido por el límite de caracteres de la URL en navegadores y servidores (históricamente ~2048 caracteres).
^get-cheatsheet

---

## Overview

Es el método más usado: cada navegación es un GET. En pentest, sus **parámetros en la URL son superficie de inyección directa** (SQLi, XSS, LFI, IDOR) y, al viajar en la URL, quedan expuestos en logs, historial y la cabecera `Referer`.

> [!TIP] Reconocimiento pasivo del frontend
> Abrí la pestaña Network mientras navegás un sitio para ver cómo la aplicación interactúa con su backend (endpoints, parámetros, formatos). Es un paso esencial en cualquier assessment web o bug bounty antes de tocar nada.

### Petición GET

Las peticiones GET colocan sus parámetros en la **URL** (query string): tras el `?`, pares `clave=valor` separados por `&` (ej. `?categoria=libros&orden=precio`). Una función de búsqueda que consulta el backend genera una petición como:
```
GET /search.php?search=le
```

Visible en la pestaña Network al disparar la búsqueda. Se puede replicar directo contra el endpoint — suele devolver el resultado crudo (ej. JSON) sin el HTML de la página:
```bash
curl 'http://<SERVER_IP>:<PORT>/search.php?search=le' -H 'Authorization: Basic YWRtaW46YWRtaW4='
```
```
Leeds (UK)
Leicester (UK)
```

> [!TIP] Copiar peticiones desde DevTools
> Click derecho sobre la request en la pestaña Network:
> - **Copy > Copy as cURL** → pega el comando completo en la terminal (podés quitar headers de más y dejar solo el `Authorization`).
> - **Copy > Copy as Fetch** → replica la request con la librería Fetch de JS; pegala en la consola (`CTRL+SHIFT+K`) y ejecutala.
>
> Endpoints que exponen parámetros GET son superficie directa para fuzzing de parámetros y valores — ver [[Curl - Fuzzing Parámetros y Valores]] y [[ffuf]].


### Comportamiento y Características Técnicas

#### Seguridad y Visibilidad de Datos
- **Historial y Logs:** Al ir los datos en la URL, estos quedan registrados en el historial del navegador, en los marcadores del usuario y en los logs de acceso de los servidores web.
- **Prohibición para Datos Sensibles:** Nunca se deben utilizar peticiones GET para enviar contraseñas, tokens de autenticación o datos personales, ya que quedarían expuestos fácilmente a través de la URL.

#### GET que muta estado → vector

GET *debería* ser de solo lectura, pero depende del backend. Un endpoint GET que altera estado (ej. `/eliminar-usuario?id=5`) es explotable:
- **[[Cross-Site Request Forgery (CSRF)]]:** un simple `<img src="https://target/eliminar-usuario?id=5">` en una página controlada dispara la acción con la sesión de la víctima — sin formularios ni tokens que esquivar.
- **Disparo accidental:** crawlers y prefetch del navegador siguen esos links solos, ejecutando la acción destructiva.


---


**Notas relacionadas:**
- [[HTTP]] · [[HTTP - Métodos]] · [[HTTP - Basic Auth]] · [[curl]]
