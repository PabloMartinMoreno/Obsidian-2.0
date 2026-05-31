---
aliases:
  - GET Requests
tags:
  - service/http
  - asset/web-app
  - technique/recon/active
  - cert/cwes
  - estado/completo
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[HTTP - Métodos]]"
  - "[[HTTP - Basic Auth]]"
  - "[[HTTP - Headers]]"
  - "[[curl]]"
---
# GET

---

## Cheatsheet

- **Propósito:** Solicitar una representación de un recurso específico.
- **Idempotencia:** Sí. Ejecutarlo múltiples veces produce el mismo resultado que una sola vez.
- **Seguridad (Safe Method):** Sí. Es un método de solo lectura; no modifica el estado del servidor.
- **Transmisión de datos:** Exclusivamente a través de la URL utilizando [[Query Parameters]].
- **Caché:** Sí. Las respuestas son altamente almacenables en caché por navegadores y [[Servidores Proxy]].
- **Límite de tamaño:** Restringido por el límite de caracteres de la URL en navegadores y servidores (históricamente ~2048 caracteres).

___

## Overview

El método **GET** es el método más fundamental e utilizado dentro del [[Protocolo HTTP]]. Su función principal es recuperar información de un servidor web sin causar efectos secundarios en el sistema. Al ser clasificado como un **método seguro**, se asume que las peticiones GET son operaciones de consulta pura. Esto permite que la infraestructura de la red (como sistemas de [[CDN]] y cachés locales) optimice el rendimiento almacenando las respuestas para peticiones idénticas, reduciendo la carga en el servidor de origen.

> [!TIP] Reconocimiento pasivo del frontend
> Abrí la pestaña Network mientras navegás un sitio para ver cómo la aplicación interactúa con su backend (endpoints, parámetros, formatos). Es un paso esencial en cualquier assessment web o bug bounty antes de tocar nada.

### Petición GET

Las peticiones GET colocan sus parámetros en la **URL** (query string), después del `?`. Una función de búsqueda que consulta el backend genera una petición como:
```
GET /search.php?search=le
```

Visible en la pestaña Network al disparar la búsqueda. Se puede replicar directo contra el endpoint — suele devolver el resultado crudo (ej. JSON) sin el HTML de la página:
```bash
curl 'http://<SERVER_IP>:<PORT>/search.php?search=le' -H 'Authorization: Basic YWRtaW46YWRtaW4='
```
```
Leeds (UK)
Leicester (UK)
```

> [!TIP] Copiar peticiones desde DevTools
> Click derecho sobre la request en la pestaña Network:
> - **Copy > Copy as cURL** → pega el comando completo en la terminal (podés quitar headers de más y dejar solo el `Authorization`).
> - **Copy > Copy as Fetch** → replica la request con la librería Fetch de JS; pegala en la consola (`CTRL+SHIFT+K`) y ejecutala.
>
> Endpoints que exponen parámetros GET son superficie directa para fuzzing de parámetros y valores — ver [[Curl - Fuzzing Parámetros y Valores]] y [[ffuf]].


### Comportamiento y Características Técnicas

#### Envío de Parámetros en la URL
Dado que GET no debe modificar recursos, los criterios de búsqueda, filtros o identificadores se envían incrustados directamente en la estructura de la [[URI]]:
- Se utiliza el símbolo `?` para iniciar la cadena de consulta (_query string_).
- Los pares clave-valor se separan mediante el símbolo `&`.
- _Ejemplo:_ `/buscar?categoria=libros&orden=precio`

#### Ausencia de Cuerpo (Request Body)
- Aunque la especificación técnica de HTTP no prohíbe explícitamente que una petición GET incluya un cuerpo, en la práctica **se desaconseja y muchos servidores o proxies lo ignoran o rechazan**.
- Toda la información necesaria para procesar la petición debe existir en la línea de solicitud y las cabeceras.

#### Seguridad y Visibilidad de Datos
- **Historial y Logs:** Al ir los datos en la URL, estos quedan registrados en el historial del navegador, en los marcadores del usuario y en los logs de acceso de los servidores web.
- **Prohibición para Datos Sensibles:** Nunca se deben utilizar peticiones GET para enviar contraseñas, tokens de autenticación o datos personales, ya que quedarían expuestos fácilmente a través de la URL.

### Idempotencia vs. Mutabilidad en el Mundo Real

Por definición, GET es idempotente y seguro. Sin embargo, esto depende enteramente de la implementación en el backend:
- **Mala Práctica:** Diseñar un endpoint de tipo GET que altere la base de datos (por ejemplo, `/eliminar-usuario?id=5`).
- **Consecuencia:** Los rastreadores de motores de búsqueda (web crawlers) o los sistemas de pre-carga de los navegadores podrían seguir ese enlace automáticamente, ejecutando la acción destructiva de forma imprevista.


---

### Conceptos Relacionados para Expandir

- [[Mapeo de Métodos HTTP e Idempotencia]]
- [[Estrategias de Caché con Cache-Control y ETag]]
- [[Diferencias Técnicas entre GET y POST]]
- [[Codificación URL (URL Encoding)]]

**Notas relacionadas:**
- [[HTTP]] · [[HTTP - Métodos]] · [[HTTP - Basic Auth]] · [[curl]]
