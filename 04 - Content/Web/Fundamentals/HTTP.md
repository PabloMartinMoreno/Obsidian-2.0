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
  - '[[Códigos de Estado HTTP]]'
  - '[[Cookies y Sesiones]]'
  - '[[http-flow]]'
  - '[[URL]]'
  - '[[curl]]'
  - '[[HTTPS]]'
  - '[[Protocolos de Red]]'
  - '[[HTTP Headers]]'
  - '[[Métodos HTTP]]'
---
# HTTP: Hypertext Transfer Protocol

El protocolo **HTTP** es el estándar de comunicación que permite la transferencia de información en la World Wide Web. Es el lenguaje que utilizan los [[Clientes]] (navegadores) y [[Servidores]] para entenderse.

---

## El Modelo Cliente-Servidor

HTTP se basa en un ciclo de **Solicitud (Request)** y **Respuesta (Response)**.

- **Cliente:** El navegador que solicita un recurso.
- **Servidor:** La computadora que almacena el recurso y lo entrega.

> [!INFO] Stateless (Sin estado)
> 
> HTTP es un protocolo stateless. Esto significa que el servidor no guarda datos entre distintas peticiones. Para "recordar" a un usuario (como mantener una sesión iniciada), se utilizan [[Cookies]] o [[Tokens]].


---

## Anatomía de una Petición (Request)

Cuando el cliente solicita algo, envía:

- **Métodos HTTP:** Definen la acción a realizar.
    - `GET`: Recuperar datos.
    - `POST`: Enviar datos nuevos al servidor.
    - `PUT`: Reemplazar o actualizar datos.
    - `DELETE`: Eliminar un recurso.

- **Path:** La ubicación del recurso (ej. `/blog/articulo-1`).

- **Headers:** Metadatos como el tipo de navegador o el formato de archivo aceptado.


---

## Anatomía de una Respuesta (Response)

El servidor responde con:
- **Código de Estado:** Indica el resultado de la petición.
- **Headers:** Información sobre el contenido enviado (tamaño, tipo de archivo).
- **Body:** El contenido solicitado (HTML, JSON, Imágenes).


---

## Códigos de Estado Comunes

Los códigos se agrupan por su primer dígito:

|**Rango**|**Significado**|**Ejemplo común**|
|---|---|---|
|**2xx**|Éxito|`200 OK`|
|**3xx**|Redirección|`301 Moved Permanently`|
|**4xx**|Error del Cliente|`404 Not Found`|
|**5xx**|Error del Servidor|`500 Internal Server Error`|

---

## HTTP vs HTTPS

La diferencia fundamental es la seguridad:

- **HTTP:** Los datos viajan en texto plano.
- **HTTPS:** Utiliza un certificado [[SSL/TLS]] para cifrar la conexión. Es el estándar actual para proteger la privacidad del usuario.


---

**Notas relacionadas:**
- [[Protocolos de Red]]
- [[API REST]]
- [[Seguridad Web]]
