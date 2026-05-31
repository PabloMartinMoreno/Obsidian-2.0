---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTPS]]"
  - "[[HTTP - Métodos]]"
---
# POST

***

## Cheatsheet

- **Propósito:** Enviar entidades a un recurso en específico, causando a menudo un cambio en el estado del servidor o efectos secundarios.
- **Idempotencia:** No. Ejecutar la misma petición múltiples veces creará múltiples recursos o duplicará la acción.
- **Seguridad (Safe Method):** No. Modifica activamente el estado del servidor (escritura/creación/actualización).
- **Transmisión de datos:** Principalmente a través del cuerpo de la petición (_Request Body_).
- **Caché:** No por defecto. Las respuestas solo se almacenan en caché si se configuran cabeceras explícitas y el servidor lo permite de forma extraordinaria.
- **Límite de tamaño:** Prácticamente ilimitado, restringido únicamente por la configuración de capacidad máxima del servidor web (ej. `client_max_body_size` en [[Nginx]]).

## Overview

El método **POST** es uno de los pilares del [[Protocolo HTTP]] para la interacción dinámica y la manipulación de datos en la web. A diferencia de [[Método HTTP GET|GET]], que se limita a la lectura, POST se utiliza para enviar datos estructurados al servidor con el fin de que un recurso subordinado los procese. Es el método estándar para la creación de nuevos registros en bases de datos, el envío de formularios de registro, la subida de archivos y la ejecución de acciones que alteran irreversiblemente el estado del sistema.

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

El estándar de facto para la comunicación en [[APIs REST]] modernas y aplicaciones SPA (Single Page Applications).
- Transporta estructuras de datos complejas, anidadas y tipadas directamente en formato JSON.

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

### El Problema de la No Idempotencia

Dado que POST no es idempotente, repetir la petición tiene consecuencias multiplicativas:
- **El escenario clásico:** Si un usuario envía un formulario de pago con POST y la red sufre un retraso, el usuario podría hacer clic de nuevo en el botón "Pagar". Si el cliente reenvía la petición POST idéntica, el servidor procesará un segundo cobro.
- **Mitigación:** Para solucionar esto en arquitecturas web se implementan patrones como [[Idempotency Keys]] (Tokens de Idempotencia) en cabeceras o el patrón de diseño [[Post/Redirect/Get (PRG)]] en aplicaciones web tradicionales para evitar que el usuario refresque la página y reenvíe los datos.
    

### Conceptos Relacionados para Expandir

- [[Diferencias Técnicas entre GET y POST]]
- [[Elección de Métodos HTTP: POST vs PUT vs PATCH]]
- [[Mapeo de Métodos HTTP e Idempotencia]]
- [[Seguridad en Formularios: Ataques CSRF y cómo prevenirlos]]