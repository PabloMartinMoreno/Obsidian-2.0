---
aliases:
tags:
  - type/concept
type: Concept
linked:
---
# Subdominios 

Los subdominios son herramientas versátiles para organizar la arquitectura de un sitio sin necesidad de comprar dominios nuevos. Sus usos principales son:

- **Segmentación de servicios:** Separar funciones críticas. Ejemplo: `blog.tusitio.com`, `tienda.tusitio.com`.
- **Entornos de desarrollo:** Probar cambios antes de subirlos a producción. Ejemplo: `dev.tusitio.com` o `staging.tusitio.com`.
- **Geolocalización:** Ofrecer contenido en diferentes idiomas o regiones. Ejemplo: `es.wikipedia.org` (Español) vs `en.wikipedia.org` (Inglés).
- **Plataformas de usuarios:** Sitios como WordPress o Tumblr permiten que cada usuario tenga su propio espacio. Ejemplo: `usuario.wordpress.com`.

---

## Configuración técnica (Registros DNS)

Para que un subdominio funcione, debe ser definido en la zona DNS del dominio principal. Existen dos formas comunes de hacerlo:

1. **Registro A:** Apunta el subdominio directamente a una dirección IP específica. Es ideal si el subdominio está alojado en un servidor diferente al principal.
2. **Registro CNAME:** Crea un "alias" que apunta a otro nombre de dominio. Es útil para servicios externos (como apuntar `tienda.tusitio.com` hacia `shopify.com`).

---

## Diferencia entre Subdominio y Subdirectorio

Es común confundirlos, pero tienen impactos distintos en el SEO y la administración:

|**Característica**|**Subdominio (blog.web.com)**|**Subdirectorio (web.com/blog)**|
|---|---|---|
|**Jerarquía**|Entendido como una entidad separada.|Entendido como parte del sitio principal.|
|**SEO**|Puede heredar menos "autoridad" del principal.|Comparte toda la autoridad del dominio.|
|**Hosting**|Puede estar en un servidor totalmente distinto.|Generalmente está en el mismo servidor.|
|**Certificados**|Requiere un certificado SSL dedicado o uno _Wildcard_.|Cubierto por el SSL del dominio principal.|

---

