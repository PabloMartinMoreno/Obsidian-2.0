---
aliases:
tags:
  - service/http
  - asset/web-app
  - cert/cwes
  - estado/completo
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTPS]]"
  - "[[API REST]]"
  - "[[HTTP - Códigos de Estado]]"
  - "[[GET]]"
---

# Métodos HTTP

Los métodos HTTP indican la acción que se desea realizar sobre un recurso determinado. En una [[API REST]], estos métodos se mapean directamente a las operaciones **CRUD** (Create, Read, Update, Delete).

> [!TIP] Ver el método de una petición
> Con `curl -v` se previsualiza la petición completa; la primera línea contiene el método (`GET / HTTP/1.1`). En las DevTools del navegador aparece en la columna `Method`.

___

## Resumen

|**Método**|**Acción**|**Seguro**|**Idempotente**|
|---|---|:---:|:---:|
|`GET`|Recuperar un recurso|✅|✅|
|`POST`|Crear / enviar datos|❌|❌|
|`PUT`|Reemplazar o crear|❌|✅|
|`PATCH`|Modificación parcial|❌|❌|
|`DELETE`|Eliminar un recurso|❌|✅|
|`HEAD`|Headers de un `GET` (sin body)|✅|✅|
|`OPTIONS`|Métodos permitidos|✅|✅|
^http-metodos

---

## Métodos Principales

### GET

Se utiliza únicamente para **recuperar** datos del servidor.
- **Seguro:** No modifica el estado del servidor.
- **Idempotente:** Hacer la misma petición varias veces siempre da el mismo resultado.
- **Cuerpo:** No debe enviar datos en el cuerpo (body); usa la [[URL#Parámetros de Consulta|Query String]].

### POST

Se utiliza para **enviar** datos al servidor para crear un nuevo recurso.
- **No seguro:** Modifica el estado del servidor (crea registros).
- **No Idempotente:** Si repites la petición, podrías crear el mismo recurso dos veces (ej. dos comentarios iguales).
- **Uso común:** Formularios de registro, subir fotos, realizar pedidos.

### PUT

Se utiliza para **actualizar** un recurso existente o crearlo si no existe.
- **Reemplazo total:** Envía la entidad completa para sustituir la versión anterior.
- **Idempotente:** Si envías el mismo recurso 10 veces, el resultado final en el servidor es el mismo que si lo enviaras una.

### PATCH

Similar a `PUT`, pero para **actualizaciones parciales**.
- **Uso:** Si solo quieres cambiar el "precio" de un producto sin enviar todos los demás campos.

### DELETE

Se utiliza para **eliminar** un recurso específico del servidor.
- **Idempotente:** Si borras un recurso, la primera vez se borra; las siguientes veces el resultado es que el recurso sigue sin existir.

---

## Métodos Secundarios

|**Método**|**Descripción**|
|---|---|
|**HEAD**|Igual que `GET`, pero el servidor solo devuelve los [[HTTP - Headers\|headers]] (sin body). Útil para comprobar tamaño o existencia de un recurso antes de descargarlo.|
|**OPTIONS**|El cliente pregunta qué métodos están permitidos para un recurso. Fundamental para el [[CORS]].|
|**CONNECT**|Establece un túnel hacia el servidor (usado en Proxies y [[HTTPS]]).|

---

## Propiedades de los Métodos

Para entender mejor cómo usarlos, los clasificamos según dos propiedades:

> [!CHECK] Métodos Seguros
>
> Aquellos que no alteran el estado del servidor (solo lectura).
>
> - **GET, HEAD, OPTIONS.**

> [!RECYCLE] Métodos Idempotentes
>
> Aquellos que producen el mismo resultado sin importar cuántas veces se ejecuten.
>
> - **GET, HEAD, PUT, DELETE, OPTIONS.**

---

## Implicancias de Seguridad

> [!WARNING] Verbos peligrosos expuestos
> La disponibilidad de cada método depende de la configuración del servidor. Verbos de escritura habilitados sin control son superficie de ataque directa:
>
> - **`PUT`** sin controles → subida de recursos maliciosos (ej. [[Webshells\|webshell]]).
> - **`DELETE`** sin protección → **[[Denial of Service (DoS)\|DoS]]** borrando archivos críticos del servidor.
> - **`OPTIONS`** → enumeración: revela qué verbos están habilitados antes de atacarlos.
> - **`TRACE`** → potencial **Cross-Site Tracing (XST)** para robar cookies vía reflejo de headers.

Enumerá los métodos permitidos sobre un recurso:

```bash
curl -i -X OPTIONS http://target/
# Respuesta -> Allow: GET, POST, PUT, DELETE, OPTIONS
```

---

## Ejemplo de uso en una API

Si tuviéramos un recurso de `usuarios`:

- `GET /usuarios` → Lista todos los usuarios.
- `POST /usuarios` → Crea un usuario nuevo.
- `PUT /usuarios/123` → Actualiza todos los datos del usuario 123.
- `DELETE /usuarios/123` → Borra al usuario 123.

> [!NOTE]
> La mayoría de aplicaciones web modernas se basan en `GET` y `POST`. Las que usan **[[API REST]]** dependen también de `PUT` y `DELETE` para actualizar y eliminar datos en el endpoint.

---

**Notas relacionadas:**

- [[HTTP]]
- [[HTTP - Códigos de Estado]]
- [[Flujo de Comunicación HTTP|Flujo HTTP]]
- [[API REST]]
