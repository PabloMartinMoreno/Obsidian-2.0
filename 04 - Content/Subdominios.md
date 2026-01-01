---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[04 - Content/Virtual Hosts|Virtual Hosts]]"
  - "[[Subdominio vs Virtual Host]]"
---
# Subdominios

___

## El Subdominio (Capa de red / DNS)

Un subdominio es una subdivisión jerárquica del dominio principal. Su función es puramente organizativa y de resolución de nombres.
- **Ejemplo:** `dev.midominio.com`.
- **Dónde se configura:** En el panel de DNS (Cloudflare, GoDaddy, etc.) creando un registro tipo **A** o **CNAME**.
- **Misión:** Decirle al mundo: _"Si buscas esta dirección, ve a esta dirección IP"_.

Un subdominio es estrictamente una **entrada en una base de datos distribuida (DNS)**. No tiene ninguna relación con carpetas, archivos o servidores web en esta etapa.
- **Protocolo:** DNS (UDP/53).
- **Función:** Resolución de nombres. El cliente (tu SO) pregunta quién es `dev.ejemplo.com`. El servidor DNS responde con una dirección IP (Registro A) o un alias (CNAME).
- **Alcance:** Termina una vez que el navegador obtiene la dirección IP del servidor. El DNS no sabe qué contenido hay dentro del servidor, solo sabe a qué IP mandarte.

---

## Configuración técnica (Registros DNS)

Para que un subdominio funcione, debe ser definido en la zona DNS del dominio principal. Existen dos formas comunes de hacerlo:

1. **Registro A:** Apunta el subdominio directamente a una dirección IP específica. Es ideal si el subdominio está alojado en un servidor diferente al principal.
2. **Registro CNAME:** Crea un "alias" que apunta a otro nombre de dominio. Es útil para servicios externos (como apuntar `tienda.tusitio.com` hacia `shopify.com`).

---
