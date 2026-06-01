---
aliases:
  - REST API
  - RESTful
tags:
  - service/http
  - asset/api
  - asset/web-app
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
kind: Concept
linked:
  - "[[HTTP - Métodos]]"
  - "[[HTTP - Códigos de Estado]]"
  - "[[HTTP - Headers]]"
  - "[[API Security]]"
  - "[[API Fuzzing]]"
---
# API REST

Una **API REST** (REpresentational State Transfer) es un estilo de arquitectura para APIs web donde cada **recurso** se expone como una [[URL]] y se opera con [[HTTP - Métodos|métodos HTTP]] estándar. Es **stateless**: cada petición lleva toda la info necesaria (no hay sesión del lado del servidor).

---

## Mapeo CRUD ↔ Métodos

| Operación | Método | Ejemplo |
|---|---|---|
| **C**reate | `POST` | `POST /usuarios` |
| **R**ead | `GET` | `GET /usuarios/123` |
| **U**pdate | `PUT` / `PATCH` | `PUT /usuarios/123` |
| **D**elete | `DELETE` | `DELETE /usuarios/123` |

^api-rest-crud

![[HTTP - Métodos#^http-metodos]]

---

## Características

- **Recursos como URLs:** `/api/usuarios/123`, `/api/pedidos`.
- **Stateless:** sin estado de sesión; auth por token en cada request (`Authorization: Bearer`, ver [[HTTP - Headers]]).
- **Formato:** normalmente JSON (`Content-Type: application/json`).
- **Códigos de estado** como semántica de respuesta: `200`, `201 Created`, `204 No Content`, `404`. Ver [[HTTP - Códigos de Estado]].

---

## Relevancia ofensiva

Las APIs REST exponen verbos de escritura (`PUT`/`DELETE`) y endpoints predecibles → superficie directa para:

- [[API Fuzzing]] / [[API Enumeration]] — descubrir endpoints y parámetros.
- [[BOLA - IDOR]] — IDs manipulables en la URL.
- [[Mass Assignment]] — campos no filtrados en el body.
- Ver [[API Security]].

---

**Notas relacionadas:**
- [[HTTP - Métodos]] · [[HTTP - Códigos de Estado]] · [[HTTP - Headers]] · [[API Security]]
