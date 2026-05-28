---
aliases:
tags:
  - asset/web-app
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---


***

[[curl]]
## Overview

Una **web request** (petición web) es el mensaje que un cliente —por ejemplo un navegador o una herramienta— envía a un servidor web para pedirle algo: una página HTML, un recurso (imagen, JSON, etc.) o ejecutar una acción. En hacking ético entender y manipular esas peticiones es fundamental para descubrir fallos, validar controles y demostrar vectores de ataque de forma segura y responsable.

**Componentes principales de una web request:**
- Método (HTTP): `GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`, etc.
- URL: dominio + ruta + parámetros de consulta (`/login?user=ana`).
- Cabeceras (headers): `Host`, `User-Agent`, `Cookie`, `Accept`, `Referer`, `Authorization`, etc.
- Cuerpo (body): datos enviados en `POST/PUT` (form-data, JSON, XML, etc.).
- Parámetros: query params, route params, y body params.
- Protocolo/seguridad: `HTTP` vs `HTTPS` (TLS).
- Respuesta: código de estado (200, 404, 500…), headers de respuesta y cuerpo.

**Qué se hace con las web requests en hacking ético:**
- Interceptar: ver peticiones y respuestas en tránsito (p. ej. con Burp Proxy).
- Modificar/Replay: cambiar parámetros, headers o cuerpos y re-enviar para probar validaciones.
- Fuzzing: enviar inputs aleatorios o malformados para encontrar errores.
- Automatizar: usar scripts o herramientas para enumerar endpoints, parámetros o probar cargas útiles.
- Análisis de lógica: entender cómo el servidor procesa la request para encontrar autorización débil, falta de validación, etc.

**Vectores y fallos comunes relacionados con peticiones web:**
- Inyección (SQL, NoSQL, OS, command).
- Cross-Site Scripting (XSS) vía parámetros o cuerpo.
- Cross-Site Request Forgery (CSRF) por peticiones sin token.
- Server-Side Request Forgery (SSRF) si la app hace requests a URLs controladas por el usuario.
- Insecure Direct Object Access (IDOR) por parámetros manipulables (`/file?id=123`).
- Headers inseguros o exposición de cookies sin `HttpOnly`/`Secure`.

**Herramientas típicas:**
- Burp Suite (intercept, repeater, intruder).
- OWASP ZAP.
- curl / wget (peticiones desde línea de comandos).
- HTTPie (interactivo).
- Scripts Python/Go/Node para automatizar (requests, axios, etc.).
