---
aliases:
  - Flujo HTTP
tags:
  - type/concept
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
  - "[[HTTP]]"
---
# Flujo de Comunicación HTTP

El flujo HTTP es el proceso de intercambio de mensajes entre un cliente y un servidor. Aunque parece instantáneo, sigue una serie de pasos técnicos obligatorios.

___

## Pasos del Flujo HTTP

![[Pasted image 20251225153503.png]]

### Resolución DNS

Antes de que HTTP pueda actuar, el navegador debe traducir el nombre de dominio (ej. `google.com`) en una dirección IP.

- El navegador consulta a un servidor [[DNS - CWES]] para obtener la dirección numérica del servidor.

### Establecimiento de la Conexión (Handshake)

Una vez conocida la IP, el cliente abre una conexión con el servidor.

- **TCP Handshake:** Un proceso de "saludo" en tres pasos (SYN, SYN-ACK, ACK) para asegurar que ambos están listos para hablar.
- **TLS Handshake:** Si usas `https://`, aquí es donde se intercambian certificados para cifrar la comunicación.

### El Cliente envía la Petición (Request)

El navegador envía un mensaje de texto plano (o binario en HTTP/2) siguiendo la estructura que vimos en la nota de [[HTTP]].

- Incluye el **Método** (`GET`, `POST`), la **Ruta** y los **Headers**.

### El Servidor procesa la Petición

El servidor web (como Apache o Nginx) recibe el mensaje:

1. Verifica si el recurso existe.
2. Ejecuta lógica si es necesario (ej. consultar una base de datos).
3. Prepara la respuesta.

### El Servidor envía la Respuesta (Response)

El servidor devuelve el recurso solicitado junto con un **Código de Estado** (ej. `200 OK`).

- Si es una página web, enviará el código HTML.

### Renderizado en el Navegador

El navegador recibe la respuesta y comienza a procesarla:

- Si el HTML dice que necesita una imagen o un archivo CSS, el flujo **se repite** para cada uno de esos recursos adicionales.


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

**Notas relacionadas:**

- [[HTTP]]
- [[Códigos de Estado HTTP]]
- [[DNS: El listín telefónico de Internet]]