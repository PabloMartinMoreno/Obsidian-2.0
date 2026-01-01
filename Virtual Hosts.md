---
aliases:
tags:
  - type/concept
type: Concept
linked:
---
# Virtual Hosts

***

### El Virtual Host (Capa de Servidor)

El Virtual Host es la instrucción dentro de tu software (Apache, Nginx) que decide qué archivos mostrar cuando alguien llega preguntando por un nombre específico. Se refiere a la práctica de alojar **múltiples sitios web o aplicaciones en un solo servidor físico**.

- **Ejemplo:** Una carpeta en `/var/www/tienda/` que solo se activa si el visitante pide `tienda.tudominio.com`.
    
- **Dónde se configura:** En archivos de texto dentro del servidor (ej. `/etc/nginx/sites-available/`).
    
- **Misión:** Decirle al servidor: _"Si el navegador me pide este nombre exacto, muéstrale esta carpeta y no la principal"_.

___
