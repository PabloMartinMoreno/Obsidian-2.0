---
aliases:
  - Hypertext Transfer Protocol
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
  - '[[Métodos HTTP]]'
  - '[[Códigos de Estado HTTP]]'
  - '[[HTTP Headers]]'
  - '[[Cookies y Sesiones]]'
  - '[[HTTPS]]'
  - '[[URL]]'
  - '[[curl]]'
  - '[[Protocolos de Red]]'
---
# HTTP: Hypertext Transfer Protocol

El protocolo **HTTP** es el estándar de comunicación que permite la transferencia de información en la World Wide Web. Es el lenguaje que utilizan los [[Clientes]] (navegadores) y [[Servidores]] para entenderse.

---

## El Modelo Cliente-Servidor

HTTP se basa en un ciclo de **Solicitud (Request)** y **Respuesta (Response)**.

- **Cliente:** el navegador que solicita un recurso.
- **Servidor:** la computadora que almacena el recurso y lo entrega.

El ciclo completo request → response paso a paso: [[Flujo de Comunicación HTTP]].

> [!INFO] Stateless (Sin estado)
> HTTP no guarda datos entre peticiones. Para "recordar" a un usuario (mantener la sesión iniciada) se usan [[Cookies y Sesiones|cookies o sesiones]].

---

## Anatomía de una Petición (Request)

- **Método:** la acción a realizar (ver abajo).
- **Path:** la ubicación del recurso dentro del dominio (ej. `/blog/articulo-1`). Ver [[URL]].
- **Headers:** metadatos (navegador, formatos aceptados, autenticación). Ver [[HTTP Headers]].
- **Body:** datos enviados al servidor (en `POST`/`PUT`).

![[Métodos HTTP#^http-metodos]]

---

## Anatomía de una Respuesta (Response)

- **Código de Estado:** el resultado de la petición.
- **Headers:** información sobre el contenido devuelto. Ver [[HTTP Headers]].
- **Body:** el contenido solicitado (HTML, JSON, imágenes).

![[Códigos de Estado HTTP#^http-estado]]

---

## HTTP vs HTTPS

HTTP viaja en **texto plano**; [[HTTPS]] envuelve la misma comunicación en cifrado TLS.

![[HTTPS#^https-comparativa]]

---

**Notas relacionadas:**
- [[Métodos HTTP]] · [[Códigos de Estado HTTP]] · [[HTTP Headers]] · [[Cookies y Sesiones]]
- [[HTTPS]] · [[Protocolos de Red]] · [[API REST]]
