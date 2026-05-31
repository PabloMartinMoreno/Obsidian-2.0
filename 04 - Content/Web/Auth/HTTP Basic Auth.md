---
aliases:
  - Basic Auth
  - Basic Authentication
tags:
  - service/http
  - asset/web-app
  - cert/cwes
  - estado/completo
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Web]]'
tertiary categories: null
kind: Concept
linked:
  - '[[GET]]'
  - '[[HTTP Headers]]'
  - '[[base64]]'
  - '[[HTTP Brute Forcing]]'
  - '[[Authentication & Authorization Bypass]]'
  - '[[JWT Attacks]]'
---
# HTTP Basic Auth

A diferencia de los formularios de login habituales (que validan credenciales vía parámetros HTTP, ej. una petición `POST`), la **autenticación básica HTTP** la gestiona directamente el servidor web para proteger una página o directorio, sin pasar por la lógica de la aplicación.

---

## Flujo

Al pedir un recurso protegido **sin** credenciales, el servidor responde `401` con el header `WWW-Authenticate` (ver [[HTTP Headers]]):

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

`WWW-Authenticate: Basic realm=...` confirma que la página usa Basic Auth. Tres formas equivalentes de autenticarse:

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
> - Basic Auth **no cifra** nada: `base64(user:pass)` es reversible al instante. Sobre `HTTP` plano viaja en claro → interceptable con [[Sniffing & MITM|MITM]].
> - El valor del header es robable y reutilizable (replay) — ver [[Authentication & Authorization Bypass]].
> - Es un objetivo directo de [[HTTP Brute Forcing]] (sin rate-limit ni CSRF token que estorben).
> - Decodificá cualquier `Authorization: Basic` capturado: `echo YWRtaW46YWRtaW4= | base64 -d`.

> [!INFO] Basic vs Bearer
> En autenticación moderna (ej. [[JWT Attacks|JWT]]) el header es de tipo `Bearer` y contiene un token firmado más largo, no la credencial en claro.

---

**Notas relacionadas:**
- [[GET]] · [[HTTP Headers]] · [[base64]]
- [[HTTP Brute Forcing]] · [[Authentication & Authorization Bypass]] · [[JWT Attacks]]
