---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[Subdominios]]"
  - "[[Subdominio vs Virtual Host]]"
---
# Virtual Hosts

***

## El Virtual Host (Capa de aplicación / HTTP)

El Virtual Host es la instrucción dentro de tu software (Apache, Nginx) que decide qué archivos mostrar cuando alguien llega preguntando por un nombre específico. Se refiere a la práctica de alojar **múltiples sitios web o aplicaciones en un solo servidor físico**.
- **Ejemplo:** Una carpeta en `/var/www/tienda/` que solo se activa si el visitante pide `tienda.midominio.com`.
- **Dónde se configura:** En archivos de texto dentro del servidor (ej. `/etc/nginx/sites-available/`).
- **Misión:** Decirle al servidor: _"Si el navegador me pide este nombre exacto, muéstrale esta carpeta y no la principal"_.

Un Virtual Host es una **directiva lógica** dentro de la configuración de un servicio (Nginx, Apache, IIS). Permite que un solo proceso escuchando en un socket (`IP:Puerto`) sirva contenidos distintos basándose en el protocolo HTTP.
- **Protocolo:** HTTP/1.1 o superior (TCP/80 o 443).
- **Mecánica:** Cuando el navegador ya tiene la IP, establece una conexión TCP. Una vez establecida, envía una petición HTTP que se ve así:
```http
GET /index.html HTTP/1.1
Host: dev.ejemplo.com
User-Agent: Mozilla/5.0...
```
- **Procesamiento en el Servidor:** El servidor web (Nginx/Apache) recibe este texto plano. Lee la línea `Host: dev.ejemplo.com` y la compara con sus archivos de configuración:
    - **Nginx:** Busca el bloque `server { server_name dev.ejemplo.com; ... }`.
    - **Apache:** Busca el bloque `<VirtualHost *:80> ServerName dev.ejemplo.com ... </VirtualHost>`.
- **Resultado:** Si hay coincidencia, el servidor entrega los archivos de la ruta definida en `root` o `DocumentRoot`.

___

## Tipos de Virtual Hosting

Existen tres formas principales de implementar esta tecnología:

### 1. Basado en Nombres (Name-based) - El más común

Múltiples dominios comparten la **misma dirección IP**. Es el estándar actual porque ahorra direcciones IPv4.

- **Ventaja:** No requiere múltiples IPs.
- **Requisito:** El cliente (navegador) debe soportar HTTP/1.1 para enviar la cabecera `Host`.

### 2. Basado en IP (IP-based)

Cada sitio web tiene una **dirección IP única** asignada al mismo servidor.

- **Ventaja:** Útil si necesitas certificados SSL muy antiguos o configuraciones de red específicas por sitio.
- **Desventaja:** Desperdicia direcciones IP.

### 3. Basado en Puertos (Port-based)

Los sitios se diferencian por el **número de puerto** en lugar del nombre o la IP.

- **Ejemplo:** `192.168.1.10:80` para el sitio principal y `192.168.1.10:8080` para un panel de administración.    

---

## Comparativa Técnica

|**Característica**|**Basado en Nombres**|**Basado en IP**|**Basado en Puertos**|
|---|---|---|---|
|**Direcciones IP**|1 IP para todos|1 IP por sitio|1 IP para todos|
|**Facilidad de uso**|Muy alta|Media|Alta|
|**Uso de Memoria**|Bajo|Alto (por interfaces)|Bajo|
|**Uso común**|Hosting compartido|Servicios críticos|Desarrollo/Testing|

---

