---
aliases:
  - Hypertext Transfer Protocol
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
  - "[[HTTPS]]"
  - "[[HTTP - Métodos]]"
  - "[[HTTP - Códigos de Estado]]"
  - "[[HTTP - Headers]]"
  - "[[HTTP - Cookies y Sesiones]]"
  - "[[HTTP - Basic Auth]]"
  - "[[URL Encode - Characters]]"
---
# HTTP: Hypertext Transfer Protocol

El protocolo **HTTP** es el estándar de comunicación que permite la transferencia de información en la World Wide Web. Es el lenguaje que utilizan los **clientes** (navegadores) y **servidores** para entenderse.

---

## Referencia rápida

````tabs
tab: **Métodos**
![[HTTP - Métodos#^http-metodos]]

tab: **Códigos de Estado**
![[HTTP - Códigos de Estado#^http-estado]]

tab: **Headers de Seguridad**
![[HTTP - Headers#^http-headers]]

tab: **Cookies (Atributos)**
![[HTTP - Cookies y Sesiones#^http-cookies]]
````

---

## El Modelo Cliente-Servidor

HTTP se basa en un ciclo de **Solicitud (Request)** y **Respuesta (Response)**.

- **Cliente:** el navegador que solicita un recurso.
- **Servidor:** la computadora que almacena el recurso y lo entrega.

El ciclo completo request → response paso a paso: [[Flujo de Comunicación HTTP]].

> [!INFO] Stateless (Sin estado)
> HTTP no guarda datos entre peticiones. Para "recordar" a un usuario (mantener la sesión iniciada) se usan [[HTTP - Cookies y Sesiones|cookies o sesiones]].

---

## Anatomía de una Petición (Request)

- **Método:** la acción a realizar → [[HTTP - Métodos]] (tabla en Referencia rápida).
- **Path:** la ubicación del recurso dentro del dominio (ej. `/blog/articulo-1`). Ver [[URL]].
- **Headers:** metadatos (navegador, formatos aceptados, autenticación). Ver [[HTTP - Headers]].
- **Body:** datos enviados al servidor (en `POST`/`PUT`).

---

## Anatomía de una Respuesta (Response)

- **Código de Estado:** el resultado de la petición → [[HTTP - Códigos de Estado]] (tabla en Referencia rápida).
- **Headers:** información sobre el contenido devuelto. Ver [[HTTP - Headers]].
- **Body:** el contenido solicitado (HTML, JSON, imágenes).

---

## HTTP vs HTTPS

HTTP viaja en **texto plano**; [[HTTPS]] envuelve la misma comunicación en cifrado TLS.

![[HTTPS#^https-comparativa]]

---

**Notas relacionadas:**
- [[HTTP - Métodos]] · [[HTTP - Códigos de Estado]] · [[HTTP - Headers]] · [[HTTP - Cookies y Sesiones]]
- [[HTTPS]] · [[Protocolos de Red]] · [[API REST]]
