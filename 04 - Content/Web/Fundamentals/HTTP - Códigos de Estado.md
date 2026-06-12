---
aliases:
  - HTTP Status Codes
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
kind: SubCheatSheet
linked:
  - "[[HTTP]]"
  - "[[HTTP - Métodos]]"
---
# Códigos de Estado HTTP

Los códigos de estado son la forma en que el **servidor** le dice al **cliente** qué pasó con su petición. Se dividen en 5 categorías principales:

---

## Resumen por Clase

|**Rango**|**Significado**|**Ejemplo común**|
|---|---|---|
|**1xx**|Informativo|`101 Switching Protocols`|
|**2xx**|Éxito|`200 OK`|
|**3xx**|Redirección|`301 Moved Permanently`|
|**4xx**|Error del Cliente|`404 Not Found`|
|**5xx**|Error del Servidor|`500 Internal Server Error`|
^http-estado

---

## 1xx: Informativos

Indican que la petición fue recibida y el proceso continúa.
- `101 Switching Protocols`: El servidor acepta cambiar el protocolo (ej. a WebSockets).

## 2xx: Éxito

La acción se completó correctamente.
- `200 OK`: Todo salió bien; el body suele contener el recurso solicitado.
- `201 Created`: La petición tuvo éxito y se creó un nuevo recurso (común en `POST`).
- `204 No Content`: Éxito, pero no hay nada que enviar de vuelta.

## 3xx: Redirecciones

El cliente necesita realizar una acción adicional.
- `301 Moved Permanently`: La URL cambió para siempre.
- `302 Found`: Redirección temporal (ej. enviar al usuario a su panel tras un login exitoso).

## 4xx: Errores del Cliente

Hubo un problema con la petición enviada.
- `400 Bad Request`: El servidor no entiende la petición por sintaxis inválida (ej. terminadores de línea faltantes).
- `401 Unauthorized`: Se requiere autenticación.
- `403 Forbidden`: No tienes permiso para ver esto. También puede aparecer cuando el servidor detecta **entrada maliciosa** (WAF/filtro).
- `404 Not Found`: El recurso no existe.

## 5xx: Errores del Servidor

El servidor falló al intentar cumplir una petición válida.
- `500 Internal Server Error`: Un error genérico en el código del servidor.
- `503 Service Unavailable`: El servidor está sobrecargado o en mantenimiento.

---

## Uso Ofensivo

> [!TIP] Señal en enumeración y fuzzing
> Los códigos de estado son la principal señal al fuzzear rutas, parámetros o credenciales:
>
> - `200` / `301` / `302` → recurso válido o redirección útil (login OK, endpoint existente).
> - `401` / `403` → el recurso **existe** pero está protegido; vale la pena buscar bypass.
> - `404` → ruta inexistente (baseline para filtrar ruido).
> - `405 Method Not Allowed` → el verbo no aplica; probá otros métodos ([[HTTP - Métodos]]).
> - `500` → input no manejado; suele delatar inyección ([[SQL Injection (SQLi)|SQLi]], [[Server-Side Template Injection (SSTI)|SSTI]]) o error explotable.

Filtrá por código de estado al fuzzear — ver [[Filtrado de salida de fuzzing]].

---

**Notas relacionadas:**
- [[HTTP]]
- [[HTTP - Métodos]]
- [[Filtrado de salida de fuzzing]]
