---
aliases:
tags:
  - type/concept
primary categories:
secondary categories:
tertiary categories:
type: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTPS]]"
---

# Métodos HTTP

Los métodos HTTP indican la acción que se desea realizar sobre un recurso determinado. En una [[API REST]], estos métodos se mapean directamente a las operaciones **CRUD** (Create, Read, Update, Delete).

___

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
|**HEAD**|Igual que `GET`, pero el servidor solo devuelve los [[HTTP headers|
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
>     

> [!RECYCLE] Métodos Idempotentes
> 
> Aquellos que producen el mismo resultado sin importar cuántas veces se ejecuten.
> 
> - **GET, HEAD, PUT, DELETE, OPTIONS.**
>     

---

## Ejemplo de uso en una API

Si tuviéramos un recurso de `usuarios`:

- `GET /usuarios` → Lista todos los usuarios.
- `POST /usuarios` → Crea un usuario nuevo.
- `PUT /usuarios/123` → Actualiza todos los datos del usuario 123.
- `DELETE /usuarios/123` → Borra al usuario 123.

---

**Notas relacionadas:**

- [[HTTP]]
- [[http-flow|Flujo HTTP]]
- [[API REST]]# Métodos HTTP

***
