---
aliases:
tags:
  - type/cheatsheet
  - asset/web-app
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# robots.txt

Imaginá que sos invitado a una gran fiesta en una mansión. Aunque podés moverte libremente y explorar, puede haber ciertas habitaciones con carteles de “Privado” que se espera que no entres.  
Así funciona **robots.txt** en el mundo del _web crawling_: actúa como una especie de “guía de etiqueta” virtual para los bots, indicando qué áreas de un sitio web pueden visitar y cuáles deben evitar.

## Qué es robots.txt

Técnicamente, **robots.txt** es un archivo de texto simple ubicado en el directorio raíz de un sitio web (por ejemplo, `www.ejemplo.com/robots.txt`).  
Sigue el estándar llamado _Robots Exclusion Standard_, que define las reglas sobre cómo deben comportarse los crawlers al visitar un sitio web.  
Este archivo contiene instrucciones en forma de **directivas**, que le indican a los bots qué partes del sitio pueden o no rastrear.

## Cómo funciona robots.txt

Las directivas de robots.txt generalmente apuntan a agentes de usuario específicos (_user-agents_), que son identificadores de distintos bots.  
Por ejemplo:
```
User-agent: *
Disallow: /private/
```

Esta directiva indica que **todos los bots** (`*` es un comodín) no pueden acceder a ninguna URL que comience con `/private/`.  
Otras directivas pueden permitir el acceso a directorios o archivos específicos, establecer demoras entre solicitudes para no sobrecargar el servidor, o incluir enlaces a _sitemaps_ para un rastreo más eficiente.

## Estructura de robots.txt

El archivo **robots.txt** es un documento de texto plano que se encuentra en el directorio raíz de un sitio web.  
Sigue una estructura sencilla, donde cada conjunto de instrucciones (llamado _record_) está separado por una línea en blanco.  
Cada record tiene dos componentes principales:

- **User-agent:** Especifica a qué crawler o bot aplican las reglas. El comodín `*` indica que las reglas aplican a todos los bots. También se puede apuntar a agentes específicos, como `Googlebot` (el crawler de Google) o `Bingbot` (el de Microsoft).

- **Directivas:** Son las instrucciones que deben seguir los bots indicados.


## Directivas comunes

|Directiva|Descripción|Ejemplo|
|---|---|---|
|**Disallow**|Especifica rutas o patrones que el bot no debe rastrear.|`Disallow: /admin/` (prohíbe acceso al directorio admin)|
|**Allow**|Permite explícitamente rastrear ciertas rutas, incluso si están dentro de una regla _Disallow_.|`Allow: /public/` (permite acceso al directorio público)|
|**Crawl-delay**|Define un retardo (en segundos) entre solicitudes sucesivas del bot para evitar sobrecargar el servidor.|`Crawl-delay: 10` (10 segundos entre solicitudes)|
|**Sitemap**|Proporciona la URL de un sitemap XML para facilitar el rastreo.|`Sitemap: https://www.ejemplo.com/sitemap.xml`|

## Por qué respetar robots.txt

Aunque **robots.txt** no se puede hacer cumplir de forma estricta (un bot malintencionado puede ignorarlo), la mayoría de los crawlers legítimos y los motores de búsqueda respetan sus directivas.  
Esto es importante por varias razones:

- **Evitar sobrecargar servidores:** Limitar el acceso de los crawlers previene tráfico excesivo que podría ralentizar o hacer caer el servidor.

- **Proteger información sensible:** robots.txt puede evitar que motores de búsqueda indexen información privada o confidencial.

- **Cumplimiento legal y ético:** Ignorar las directivas de robots.txt puede violar los términos de servicio del sitio, o incluso implicar problemas legales si se accede a datos privados o con derechos de autor.


## robots.txt en el reconocimiento web

En **reconocimiento web (web reconnaissance)**, robots.txt puede ser una fuente valiosa de inteligencia.  
Aunque se deben respetar sus directivas, los profesionales de seguridad pueden obtener información clave sobre la estructura y posibles vulnerabilidades de un sitio.

- **Descubrir directorios ocultos:** Las rutas marcadas como _Disallow_ suelen señalar áreas que el administrador no quiere que sean rastreadas, como paneles administrativos, copias de seguridad o archivos sensibles.

- **Mapear la estructura del sitio:** Analizar las rutas permitidas y denegadas puede ayudar a construir un mapa básico del sitio, revelando secciones no visibles en la navegación principal.

- **Detectar trampas para bots:** Algunos sitios incluyen directorios _honeypot_ en robots.txt para atraer bots maliciosos. Detectarlos puede dar pistas sobre el nivel de seguridad o defensa del objetivo.


## Análisis de un ejemplo de robots.txt

Ejemplo:

```
User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /public/

User-agent: Googlebot
Crawl-delay: 10

Sitemap: https://www.ejemplo.com/sitemap.xml
```

Este archivo indica lo siguiente:
- Todos los agentes de usuario tienen prohibido acceder a `/admin/` y `/private/`.
- Todos los agentes tienen permitido acceder a `/public/`.
- El **Googlebot** debe esperar **10 segundos** entre solicitudes.
- Se proporciona un **sitemap** en `https://www.ejemplo.com/sitemap.xml` para facilitar el rastreo e indexación.

A partir de este robots.txt, se puede inferir que el sitio probablemente tiene un **panel de administración** en `/admin/` y contenido privado en `/private/`, información que puede ser relevante en un análisis de seguridad.