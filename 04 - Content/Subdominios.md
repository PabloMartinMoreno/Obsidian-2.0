---
aliases:
tags:
  - type/concept
type: Concept
linked:
---
# ### El Subdominio (Capa de DNS)

Un subdominio es una subdivisión jerárquica del dominio principal. Su función es puramente organizativa y de resolución de nombres.

- **Ejemplo:** `tienda.tudominio.com` o `dev.tudominio.com`.
- **Dónde se configura:** En tu panel de DNS (Cloudflare, GoDaddy, etc.) creando un registro tipo **A** o **CNAME**.
- **Misión:** Decirle al mundo: _"Si buscas esta dirección, ve a esta dirección IP"_.

---

## Configuración técnica (Registros DNS)

Para que un subdominio funcione, debe ser definido en la zona DNS del dominio principal. Existen dos formas comunes de hacerlo:

1. **Registro A:** Apunta el subdominio directamente a una dirección IP específica. Es ideal si el subdominio está alojado en un servidor diferente al principal.
2. **Registro CNAME:** Crea un "alias" que apunta a otro nombre de dominio. Es útil para servicios externos (como apuntar `tienda.tusitio.com` hacia `shopify.com`).

---
