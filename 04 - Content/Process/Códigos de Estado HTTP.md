---
aliases:
tags:
  - type/concept
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
---
# Códigos de Estado HTTP

Los códigos de estado son la forma en que el [[Servidores|servidor]] le dice al [[Clientes|cliente]] qué pasó con su petición. Se dividen en 5 categorías principales:

---

## 1xx: Informativos

Indican que la petición fue recibida y el proceso continúa.
- `101 Switching Protocols`: El servidor acepta cambiar el protocolo (ej. a WebSockets).

## 2xx: Éxito

La acción se completó correctamente.
- `200 OK`: Todo salió bien.
- `201 Created`: La petición tuvo éxito y se creó un nuevo recurso (común en `POST`).
- `204 No Content`: Éxito, pero no hay nada que enviar de vuelta.

## 3xx: Redirecciones

El cliente necesita realizar una acción adicional.
- `301 Moved Permanently`: La URL cambió para siempre.
- `302 Found`: Redirección temporal.

## 4xx: Errores del Cliente

Hubo un problema con la petición enviada.
- `400 Bad Request`: El servidor no entiende la petición por sintaxis inválida.
- `401 Unauthorized`: Se requiere autenticación.
- `403 Forbidden`: No tienes permiso para ver esto.
- `404 Not Found`: El recurso no existe.

## 5xx: Errores del Servidor

El servidor falló al intentar cumplir una petición válida.
- `500 Internal Server Error`: Un error genérico en el código del servidor.
- `503 Service Unavailable`: El servidor está sobrecargado o en mantenimiento.

---

