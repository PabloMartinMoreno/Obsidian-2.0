---
aliases:
tags:
  - type/concept
kind: Concept
linked:
  - "[[Virtual Host|Virtual Host]]"
  - "[[Subdominio vs Virtual Host]]"
  - "[[Reconociendo un Subdominio de un Virtual Host]]"
---
# Subdominio

___

## El Subdominio (Capa de red / DNS)

Un subdominio es una subdivisión jerárquica del dominio principal. Su función es puramente organizativa y de resolución de nombres.
- **Ejemplo:** `dev.midominio.com`.
- **Dónde se configura:** En el panel de DNS (Cloudflare, GoDaddy, etc.) creando un registro tipo **A** o **CNAME**.
- **Misión:** Decirle al mundo: _"Si buscas esta dirección, ve a esta dirección IP"_.

Es un **puntero**. Su única función es resolver un nombre a una dirección IP. No tiene ni idea de qué es una página web, una carpeta o un archivo.
- **Dónde reside:** En la base de datos de un servidor DNS o en mi archivo local `/etc/hosts`.
- **Qué hace:** Cuando mi sistema operativo ve `api.objetivo.com`, busca en el DNS y este le responde: "Ese nombre está en la IP `10.10.10.5`".
- **Protocolo:** UDP 53.
- **Me doy cuenta de que existe porque:** Al ejecutar `ping` o `dig` al nombre, obtengo una IP. Si el DNS no tiene el registro, mi navegador ni siquiera intenta conectarse al servidor porque no sabe a dónde ir.

---

## Configuración técnica (Registros DNS)

Para que un subdominio funcione, debe ser definido en la zona DNS del dominio principal. Existen dos formas comunes de hacerlo:

1. **Registro A:** Apunta el subdominio directamente a una dirección IP específica. Es ideal si el subdominio está alojado en un servidor diferente al principal.
2. **Registro CNAME:** Crea un "alias" que apunta a otro nombre de dominio. Es útil para servicios externos (como apuntar `tienda.tusitio.com` hacia `shopify.com`).

---
