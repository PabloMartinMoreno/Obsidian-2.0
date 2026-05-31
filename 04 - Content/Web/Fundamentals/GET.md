---
aliases:
  - GET Requests
  - HTTP Basic Auth
tags:
  - service/http
  - asset/web-app
  - technique/recon/active
  - cert/cwes
  - estado/completo
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Web]]'
  - "[[Information Gathering]]"
tertiary categories:
  - '[[Web Enumeración]]'
kind: Concept
linked:
  - '[[HTTP]]'
  - '[[Métodos HTTP]]'
  - '[[HTTP Headers]]'
  - '[[curl]]'
  - '[[base64]]'
  - '[[Web Requests]]'
  - '[[Authentication & Authorization Bypass]]'
---
# GET

Al visitar cualquier URL, el navegador hace por defecto una petición **GET** para obtener el recurso remoto. Recibida la página inicial, puede disparar más peticiones con distintos [[Métodos HTTP|métodos]]. Todo esto se observa en la pestaña **Network** de las DevTools del navegador.

> [!TIP] Reconocimiento pasivo del frontend
> Abrí la pestaña Network mientras navegás un sitio para ver cómo la aplicación interactúa con su backend (endpoints, parámetros, formatos). Es un paso esencial en cualquier assessment web o bug bounty antes de tocar nada.

---

## HTTP Basic Auth

A diferencia de los formularios de login habituales (que validan credenciales vía parámetros HTTP, ej. una petición `POST`), la **autenticación básica HTTP** la gestiona directamente el servidor web para proteger una página o directorio, sin pasar por la lógica de la aplicación.

Al pedir un recurso protegido **sin** credenciales, el servidor responde `401` con el header [[HTTP Headers#Response Headers\|WWW-Authenticate]]:

```bash
curl -i http://<SERVER_IP>:<PORT>/
```

```http
HTTP/1.1 401 Authorization Required
Server: Apache/2.4.41 (Ubuntu)
WWW-Authenticate: Basic realm="Access denied"
Content-Type: text/html; charset=UTF-8

Access denied
```

El header `WWW-Authenticate: Basic realm=...` confirma que la página usa Basic Auth. Para autenticarse hay tres formas equivalentes:

````tabs
tab: Flag -u

```bash
curl -u admin:admin http://<SERVER_IP>:<PORT>/
```

tab: Credenciales en URL

```bash
curl http://admin:admin@<SERVER_IP>:<PORT>/
```

El formato `username:password@URL` también funciona en el navegador.

tab: Header Authorization

```bash
curl -H 'Authorization: Basic YWRtaW46YWRtaW4=' http://<SERVER_IP>:<PORT>/
```

Se puede repetir `-H` para enviar varios headers.
````

---

## Header Authorization

Con `-v` se ve el header que `curl` arma a partir de las credenciales:

```bash
curl -v http://admin:admin@<SERVER_IP>:<PORT>/
```

```http
> GET / HTTP/1.1
> Host: <SERVER_IP>
> Authorization: Basic YWRtaW46YWRtaW4=
> User-Agent: curl/7.77.0
```

`YWRtaW46YWRtaW4=` es simplemente `admin:admin` codificado en [[base64|Base64]] — **no es cifrado**. Por eso, fijando el header manualmente con `-H` (sin pasar las credenciales por `-u`) se obtiene acceso igual: el valor *es* la credencial.

> [!DANGER] Implicancias de seguridad
> - Basic Auth **no cifra** nada: `base64(user:pass)` es reversible al instante. Sobre `HTTP` plano viaja en claro → interceptable con [[Sniffing & MITM\|MITM]].
> - El valor del header es robable y reutilizable (replay) — ver [[Authentication & Authorization Bypass]].
> - Es un objetivo directo de [[HTTP Brute Forcing]] (sin rate-limit ni CSRF token que estorben).
> - Decodificá cualquier `Authorization: Basic` capturado: `echo YWRtaW46YWRtaW4= | base64 -d`.

> [!INFO] Basic vs Bearer
> En autenticación moderna (ej. [[JWT Attacks\|JWT]]) el header es de tipo `Bearer` y contiene un token firmado más largo, no la credencial en claro.

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
- [[HTTP]]
- [[Métodos HTTP]]
- [[HTTP Headers]]
- [[curl]]
- [[Web Requests]]
