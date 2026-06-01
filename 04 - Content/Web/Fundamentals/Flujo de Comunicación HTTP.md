---
aliases:
  - Flujo HTTP
  - HTTP Flow
tags:
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
kind: Concept
linked:
  - "[[HTTP]]"
---
# Flujo de Comunicación HTTP

___

## Cheatsheet

- **Puerto por defecto:** TCP 80.
- **Componentes clave:** [[Modelo Cliente-Servidor]], [[Protocolo TCP]], [[Mensajes HTTP]] (Request/Response), [[HTTP - Métodos]], [[HTTP - Códigos de Estado]].
- **Fases principales:**
    1. _Resolución DNS:_ Traducción del dominio a dirección IP.
    2. _Handshake TCP:_ Establecimiento de la conexión de transporte.
    3. _Solicitud (Request):_ El cliente pide un recurso.
    4. _Procesamiento:_ El servidor evalúa la petición.
    5. _Respuesta (Response):_ El servidor envía el recurso o estado.
    6. _Cierre/Persistencia:_ Finalización de la conexión o reutilización mediante Keep-Alive.

## Overview

El protocolo HTTP (Hypertext Transfer Protocol) es la base de la comunicación en la World Wide Web. Es un protocolo de la capa de aplicación que funciona sobre la suite [[TCP/IP]]. A diferencia de su contraparte segura, HTTP transmite toda la información (incluyendo credenciales y datos sensibles) en texto plano, lo que lo hace vulnerable a interceptaciones. Es un protocolo **sin estado** (_stateless_), lo que significa que cada transacción se ejecuta de forma independiente sin que el servidor retenga información de peticiones anteriores, obligando al uso de mecanismos como [[Cookies]] o [[Tokens JWT]] para gestionar sesiones.

![[http-flow.png]]

### El Proceso Detallado del Flujo

El ciclo de vida de una petición HTTP estándar sigue un camino lineal desde el cliente hasta el servidor y de vuelta.

#### Resolución de Nombre (DNS)

Antes de iniciar cualquier conexión HTTP, el cliente necesita saber a dónde dirigirse.
- El navegador consulta a un [[Servidor DNS]] para traducir el nombre de dominio (por ejemplo, `ejemplo.com`) en una dirección IP ejecutable.

#### Establecimiento de la Conexión TCP

HTTP depende de un protocolo de transporte confiable para asegurar que los paquetes no se pierdan.
- Se inicia el _Three-Way Handshake_ de [[TCP]]: El cliente envía un `SYN`, el servidor responde con `SYN-ACK` y el cliente finaliza con un `ACK`. La tubería de comunicación queda abierta.

#### Solicitud HTTP (HTTP Request)

Con la conexión establecida, el cliente envía un mensaje estructurado en texto plano. Una solicitud típica contiene:
- **Línea de Petición:** Incluye el [[HTTP - Métodos|Método HTTP]] (GET, POST, PUT, DELETE), la URI del recurso y la versión del protocolo (ej. `HTTP/1.1`).
- **Cabeceras (Headers):** Metadatos como `Host`, `User-Agent`, `Accept-Language` y directivas de almacenamiento en caché.
- **Cuerpo (Body):** Opcional. Contiene los datos enviados al servidor (común en métodos POST o PUT, como formularios o JSON).

#### Procesamiento del Servidor

El servidor web (ej. [[Nginx]], [[Apache]]) recibe el mensaje.
- Enruta la petición al código de la aplicación correspondiente.
- Consulta bases de datos, procesa lógica de negocio o lee archivos del sistema de archivos.

#### Respuesta HTTP (HTTP Response)

El servidor devuelve un mensaje estructurado de vuelta al cliente:
- **Línea de Estado:** Incluye la versión del protocolo y el [[HTTP - Códigos de Estado|Código de Estado]] (ej. `200 OK`, `404 Not Found`, `500 Internal Server Error`).
- **Cabeceras:** Metadatos del servidor como `Content-Type` (ej. `text/html`, `application/json`), `Content-Length`, `Set-Cookie` y directivas de servidor.
- **Cuerpo:** El contenido del recurso solicitado (el documento HTML, una imagen, datos JSON, etc.).

#### Cierre o Persistencia de la Conexión

- En `HTTP/1.0`, la conexión TCP se cerraba inmediatamente después de enviar la respuesta.
- En `HTTP/1.1` y superiores, se utiliza por defecto la cabecera `Connection: keep-alive`, permitiendo que la misma conexión TCP se reutilice para descargar recursos adicionales (CSS, JavaScript, imágenes) sin repetir el Handshake TCP, optimizando el rendimiento.

### Anatomía de un Intercambio HTTP (Ejemplo)

#### Request del Cliente

```HTTP
GET /index.html HTTP/1.1
Host: www.ejemplo.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: text/html
Connection: keep-alive
```

#### Response del Servidor

```HTTP
HTTP/1.1 200 OK
Date: Sun, 31 May 2026 23:59:59 GMT
Server: Apache/2.4.41 (Ubuntu)
Content-Type: text/html; charset=UTF-8
Content-Length: 124
Connection: keep-alive

<!DOCTYPE html>
<html>
<head><title>Ejemplo</title></head>
<body><h1>Hola Mundo</h1></body>
</html>
```



---

## Tipos de Conexiones en el Flujo

|**Tipo**|**Descripción**|
|---|---|
|**Short-lived**|Se abre una conexión por cada petición y se cierra al terminar. (Ineficiente).|
|**Persistente (Keep-Alive)**|Se abre una conexión y se mantiene abierta para múltiples peticiones. (Estándar en HTTP/1.1).|
|**Pipelining**|Permite enviar varias peticiones sin esperar la respuesta de la anterior (HTTP/1.1 mejorado).|
|**Multiplexing**|Permite múltiples peticiones y respuestas simultáneas sobre la misma conexión. (Característica de HTTP/2).|

---

> [!HELP] INFO
> 
> Un solo sitio web moderno puede disparar entre 50 y 100 flujos HTTP individuales para cargar todos los scripts, anuncios, imágenes y fuentes que contiene.

___

### Conceptos Relacionados para Expandir

- [[Evolución de HTTP: De HTTP/1.1 a HTTP/2 y HTTP/3]]
- [[Mapeo de Métodos HTTP e Idempotencia]]
- [[Gestión de Caché en HTTP (Cache-Control)]]
- [[Vulnerabilidades por falta de cifrado en HTTP]]

___

**Notas relacionadas:**
- [[HTTP]]
- [[HTTP - Códigos de Estado]]
- [[DNS: El listín telefónico de Internet]]
