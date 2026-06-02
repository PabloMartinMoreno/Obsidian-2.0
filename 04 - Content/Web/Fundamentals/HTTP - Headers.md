---
aliases:
tags:
  - service/http
  - asset/web-app
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTPS]]"
  - "[[Flujo de Comunicación HTTP|Flujo HTTP]]"
  - "[[HTTP - Cookies y Sesiones]]"
---
# HTTP Headers

Los **Headers** son campos de texto en formato `Clave: Valor` que permiten al cliente y al servidor enviar información adicional en una transacción [[HTTP]]. Son esenciales para la seguridad, el rendimiento (cache) y la negociación de contenido.

---

## Tipos de Cabeceras

### Request Headers (Del Cliente)

Enviados por el navegador para dar contexto al servidor.

- **Host:** El dominio del servidor (ej. `google.com`).
- **User-Agent:** Información sobre el navegador y sistema operativo.
- **Accept:** Qué tipo de contenido entiende el cliente (ej. `text/html`, `application/json`).
- **Authorization:** Credenciales para autenticarse (ej. [[Tokens]] o Basic Auth).
- **Referer:** La URL de la página desde la que vienes.

### Response Headers (Del Servidor)

Enviados por el servidor para dar detalles sobre la respuesta.

- **Content-Type:** Indica qué es el cuerpo del mensaje (ej. `image/png` o `text/html`).
- **Content-Length:** El tamaño del archivo en bytes.
- **Server:** Nombre del software del servidor (ej. `Apache` o `nginx`).
- **Set-Cookie:** Instrucción para que el navegador guarde una [[Cookies|Cookie]].


---

## Cabeceras de Seguridad Críticas

Estas cabeceras le dicen al navegador que active protecciones especiales:

|**Cabecera**|**Función**|
|---|---|
|`Strict-Transport-Security` (HSTS)|Fuerza al navegador a usar siempre [[HTTPS]].|
|`Content-Security-Policy` (CSP)|Indica de qué sitios se pueden cargar scripts (evita inyecciones de código).|
|`X-Frame-Options`|Evita que tu web sea cargada dentro de un `iframe` en otro sitio (evita Clickjacking).|
|`Access-Control-Allow-Origin`|Configura el **CORS** para permitir o denegar peticiones desde otros dominios.|


---

## Cabeceras de Caché

Controlan cuánto tiempo el navegador debe guardar una copia de la página para no volver a pedirla:

- **Cache-Control:** Define las reglas de almacenamiento (ej. `max-age=3600`).
- **ETag:** Un identificador único para una versión de un archivo. Si el archivo no cambió, el servidor responde `304 Not Modified`.


---

## Ejemplo Real

Una estructura típica se ve así:
```HTTP
GET /index.html HTTP/1.1
Host: ejemplo.com
User-Agent: Mozilla/5.0
Accept-Language: es-ES

HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 1240
Cache-Control: public, max-age=86400
```

> [!TIP] Inspección
> 
> Puedes ver estas cabeceras en cualquier momento en tu navegador presionando F12 -> pestaña Red (Network) -> selecciona una petición -> pestaña Headers.

---

**Notas relacionadas:**

- [[HTTP]]
- [[Flujo de Comunicación HTTP|Flujo HTTP]]
- [[HTTP - Cookies y Sesiones]]
