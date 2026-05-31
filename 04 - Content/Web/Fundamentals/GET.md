---
aliases:
  - GET Requests
tags:
  - service/http
  - asset/web-app
  - technique/recon/active
  - cert/cwes
  - estado/completo
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
  - "[[HTTP Basic Auth]]"
  - "[[HTTP - Headers]]"
  - "[[curl]]"
---
# GET

Al visitar cualquier URL, el navegador hace por defecto una petición **GET** para obtener el recurso remoto. Recibida la página inicial, puede disparar más peticiones con distintos [[HTTP - Métodos|métodos]]. Todo esto se observa en la pestaña **Network** de las DevTools del navegador.

> [!TIP] Reconocimiento pasivo del frontend
> Abrí la pestaña Network mientras navegás un sitio para ver cómo la aplicación interactúa con su backend (endpoints, parámetros, formatos). Es un paso esencial en cualquier assessment web o bug bounty antes de tocar nada.

---

## Autenticación

Un recurso GET puede estar protegido con **HTTP Basic Auth** — el servidor responde `401` + `WWW-Authenticate` en vez de servir el contenido. Flujo completo, autenticación con `curl` y ataques en [[HTTP Basic Auth]].

---

## Parámetros GET

Las peticiones GET colocan sus parámetros en la **URL** (query string), después del `?`. Una función de búsqueda que consulta el backend genera una petición como:

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

---

**Notas relacionadas:**
- [[HTTP]] · [[HTTP - Métodos]] · [[HTTP Basic Auth]] · [[curl]]
