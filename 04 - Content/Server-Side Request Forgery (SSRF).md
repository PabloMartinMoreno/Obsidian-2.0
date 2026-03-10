---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
linked:
  - "[[Server-Side Attacks]]"
  - "[[SSRF - Mecanismo Lógico]]"
  - "[[SSRF - Reconocimiento]]"
  - "[[SSRF - Explotación]]"
  - "[[SSRF - Gopher]]"
  - "[[Anatomía de la Construcción de un Payload Gopher]]"
---
# Server-Side Request Forgery (SSRF)

***

## Cheatsheet

````tabs
tab: **Reconocimiento**
![[SSRF - Reconocimiento#^ssrf-reconocimiento]]

tab: **Explotación**
![[SSRF - Explotación#^ssrf-explotacion]]
````

---

## Overview

Es una vulnerabilidad en la que un atacante engaña a un servidor web para que realice peticiones (generalmente HTTP) en su nombre hacia un destino arbitrario.

El peligro principal del SSRF es que **la petición se origina desde el servidor vulnerable**. Esto le permite al atacante saltarse firewalls y acceder a cosas que normalmente no están expuestas a internet, como bases de datos internas, servicios de administración locales o metadatos críticos en entornos cloud.

### 1. Identificar los puntos de entrada (Vectores comunes)

Se debe prestar atención a cualquier funcionalidad que requiera que el servidor obtenga datos de otro lugar. Los sospechosos habituales incluyen:
- **Parámetros en la URL:** Variables con nombres sugestivos como `?url=`, `?dest=`, `?path=`, `?uri=`, `?endpoint=`, o `?domain=`.
- **Funciones de importación o exportación:** Subir una foto de perfil pegando un enlace, importar un archivo XML/PDF, o generar un reporte desde una fuente externa.
- **Webhooks y llamadas a APIs:** Integraciones de terceros donde se le indica a la aplicación a qué URL enviar notificaciones o solicitar datos.
- **Lectura de archivos:** A veces los parámetros que parecen solicitar archivos locales (como `?file=report.pdf`) pueden ser manipulados para aceptar URLs (`?file=http://...`).

### 2. Pruebas de manipulación (Técnicas de detección)

Una vez identificado el parámetro, el objetivo es cambiar su valor para ver cómo reacciona el servidor.
- **Apuntar a la red interna:** Cambiar la URL por direcciones de bucle local (localhost) o IPs privadas.
    - Ejemplos: `http://127.0.0.1`, `http://localhost`, `http://192.168.0.1`, `http://10.0.0.1`.
    - **Qué observar:** Si la aplicación devuelve el panel de administración de un enrutador interno, servicios locales del servidor (como un puerto de base de datos exponiendo información) o muestra errores que revelan la existencia de esos servicios, es un claro indicador de SSRF.
- **Endpoints de metadatos en la nube:** Si la aplicación está alojada en la nube (AWS, GCP, Azure), intentar acceder a la dirección mágica de metadatos.
    - Ejemplo: `http://169.254.169.254/latest/meta-data/`
    - **Qué observar:** Si la respuesta contiene credenciales temporales, nombres de roles o datos de la infraestructura, la vulnerabilidad está confirmada y es crítica.
- **Interacción Out-of-Band (OOB):** Esta es la técnica más confiable cuando el SSRF es "ciego" (el servidor hace la petición, pero no te muestra el resultado en la pantalla).
    - Insertar una URL de un servidor que uno controle (por ejemplo, usando servicios como un webhook temporal o un servidor DNS propio).
    - **Qué observar:** Si se recibe un ping, una solicitud HTTP o una consulta DNS en tu servidor proveniente de la IP de la aplicación objetivo, se confirma que el servidor está procesando las URLs y saliendo a internet.

### 3. Monitoreo y Análisis de Logs

A nivel de infraestructura, la detección no solo se hace probando la aplicación de frente, sino observando el comportamiento de la red.
- Revisar los registros (logs) del firewall y del servidor web en busca de un volumen inusual de conexiones salientes iniciadas por los propios servidores de la aplicación.
- Buscar en los logs intentos de conexión desde la DMZ hacia segmentos críticos de la red interna o hacia puertos inusuales (como el puerto de MySQL, Redis o SSH) donde normalmente un servidor web no tendría por qué comunicarse.


***
