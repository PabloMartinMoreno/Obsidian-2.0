---
aliases:
tags:
  - type/concept
  - technique/recon/active
  - asset/web-app
type: Concept
linked:
  - "[[Subdominio]]"
  - "[[Subdominio vs Virtual Host]]"
  - "[[Reconociendo un Subdominio de un Virtual Host]]"
---
es una etiqueta en el sistema de direcciones (DNS) de internet.# Virtual Hosts

***

## El Virtual Host (Capa de aplicación / HTTP)

El Virtual Host es la instrucción dentro de tu software (Apache, Nginx) que decide qué archivos mostrar cuando alguien llega preguntando por un nombre específico. Se refiere a la práctica de alojar **múltiples sitios web o aplicaciones en un solo servidor físico**.
- **Ejemplo:** Una carpeta en `/var/www/tienda/` que solo se activa si el visitante pide `tienda.midominio.com`.
- **Misión:** Decirle al servidor: _"Si el navegador me pide este nombre exacto, muéstrale esta carpeta y no la principal"_.

Es una **directiva de filtrado**. Es una instrucción dentro del software del servidor (Nginx/Apache) que decide qué archivos entregar basándose en el texto que recibe en la cabecera `Host`.
- **Dónde reside:** En archivos como `/etc/nginx/sites-available/` o `/etc/apache2/sites-enabled/`.
- **Qué hace:** Una vez que ya estoy conectado a la IP `10.10.10.5`, mi navegador envía un paquete de texto (HTTP) que dice: `Host: api.objetivo.com`. El servidor web lee ese texto y busca en su configuración si tiene una carpeta asignada a ese nombre exacto.
- **Protocolo:** TCP 80 / 443.
- **Me doy cuenta de que existe porque:** Al enviar una petición a la IP y cambiar manualmente el valor de la cabecera `Host`, el servidor me responde con contenido distinto.

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

