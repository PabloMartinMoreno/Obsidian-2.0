---
aliases:
  - POST Requests
tags:
  - service/http
  - asset/web-app
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
  - "[[Web Fundamentals]]"
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTPS]]"
  - "[[HTTP - Métodos]]"
  - "[[GET]]"
  - "[[API REST]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
---
# POST

---

## Cheatsheet

- **Propósito:** Enviar entidades a un recurso en específico, causando a menudo un cambio en el estado del servidor o efectos secundarios.
- **Idempotencia:** No. Ejecutar la misma petición múltiples veces creará múltiples recursos o duplicará la acción.
- **Seguridad (Safe Method):** No. Modifica activamente el estado del servidor (escritura/creación/actualización).
- **Transmisión de datos:** Principalmente a través del cuerpo de la petición (_Request Body_).
- **Caché:** No por defecto. Las respuestas solo se almacenan en caché si se configuran cabeceras explícitas y el servidor lo permite de forma extraordinaria.
- **Límite de tamaño:** Prácticamente ilimitado, restringido únicamente por la configuración de capacidad máxima del servidor web (ej. `client_max_body_size` en [[Nginx]]).
^post-cheatsheet

---

## Overview

POST es donde ocurren las **mutaciones**: login, registro, subida de archivos, creación de registros. Por eso es la superficie primaria de ataque — su **cuerpo es punto de inyección** ([[SQL Injection (SQLi)|SQLi]], [[NoSQL Injection|NoSQLi]], [[OS Command Injection|command injection]]) y habilita [[File Upload - Vulnerabilidades|file upload]], [[Mass Assignment]], [[Cross-Site Request Forgery (CSRF)|CSRF]] y abuso de [[Race Conditions|race conditions]].

### Mecánica y Tipos de Contenido (Content-Type)

El poder de POST radica en su capacidad para transportar grandes volúmenes de datos en el cuerpo del mensaje. El servidor determina cómo interpretar estos datos basándose estrictamente en la cabecera `Content-Type`.

#### application/x-www-form-urlencoded
Es el formato por defecto para los formularios HTML tradicionales.
- Los datos se formatean como pares clave-valor separados por `&` y con caracteres especiales codificados, similar a una query string de GET, pero oculta en el cuerpo.
- _Ejemplo:_ `nombre=Juan&apellido=Perez`

#### multipart/form-data
Utilizado cuando el formulario requiere el envío de archivos binarios (imágenes, PDFs, videos) junto con campos de texto.
- Divide el cuerpo de la petición en múltiples partes utilizando una cadena de texto llamada _boundary_ (frontera) para separar cada campo y archivo.

#### application/json

El estándar de facto para la comunicación en [[API REST]] modernas y aplicaciones SPA (Single Page Applications).
- Transporta estructuras de datos complejas, anidadas y tipadas directamente en formato JSON.

> [!TIP] Relevancia ofensiva del Content-Type
> - `multipart/form-data` → [[File Upload - Vulnerabilidades|file upload]] (webshell).
> - `application/json` → [[Mass Assignment]], [[NoSQL Injection|NoSQLi]].
> - Cambiar el `Content-Type` (ej. JSON ↔ urlencoded) puede saltear validaciones, WAF o protecciones CSRF.

### Anatomía de una Petición POST

#### Ejemplo de Petición con JSON (Creación de Recurso)
```HTTP
POST /api/v1/productos HTTP/1.1
Host: api.ejemplo.com
User-Agent: Insomnia/2023.5.8
Content-Type: application/json
Authorization: Bearer abc789
Content-Length: 72

{
  "nombre": "Teclado Mecánico",
  "precio": 89.99,
  "stock": 50
}
```

#### Ejemplo de Respuesta Típica (201 Created)

Cuando un recurso se crea con éxito, el servidor debe responder idealmente con un código `201` y proporcionar la URL del nuevo recurso en la cabecera `Location`.
```HTTP
HTTP/1.1 201 Created
Date: Mon, 01 Jun 2026 00:05:00 GMT
Content-Type: application/json
Location: /api/v1/productos/105
Content-Length: 43

{
  "id": 105,
  "status": "producto_creado"
}
```

### No idempotencia → Race Conditions

Que POST no sea idempotente es explotable: enviar **N peticiones en paralelo** antes de que el servidor actualice el estado puede multiplicar la acción — doble retiro de saldo, reusar un cupón de un solo uso, exceder un límite de stock. Ver [[Race Conditions]].

> [!NOTE] Defensa del lado servidor
> Los devs lo mitigan con [[Idempotency Keys]] o el patrón [[Post/Redirect/Get (PRG)]]; su **ausencia** es justamente lo que se ataca.


---

**Notas relacionadas:**
- [[HTTP]] · [[HTTP - Métodos]] · [[GET]] · [[API REST]] · [[Cross-Site Request Forgery (CSRF)]]
