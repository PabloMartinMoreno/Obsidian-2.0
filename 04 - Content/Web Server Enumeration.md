---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/web
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Web Server Enumeration

***

## Cheatsheet

| **Recurso/Comando**                       | **Descripción**                                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `whatweb -v <target>`                     | Identificación de tecnología mediante WhatWeb. Usa los _flags_ (indicadores) `-a1`, `-a3` o `-a4` para escaneos más agresivos.                                |
| [Wappalyzer](https://www.wappalyzer.com/) | Extensión de navegador o herramienta en línea para identificar las tecnologías que impulsan los sitios web, incluyendo _frameworks_, CMS y otras tecnologías. |
| `wafw00f -v <target>`                     | Herramienta de _fingerprinting_ (identificación) de WAF (Web Application Firewall) que analiza respuestas para determinar si hay un WAF presente.             |

## Overview

- **WhatWeb:** Una herramienta de línea de comandos que ayuda a identificar las tecnologías que utiliza un sitio web, proporcionando información detallada sobre los _frameworks_, CMS, software de servidor y más del sitio. Es una buena forma de obtener información sobre la infraestructura subyacente de un sitio web.
    
- **Wappalyzer:** Una extensión de navegador y herramienta en línea que descubre las tecnologías detrás de un sitio web analizando el _front-end_. Detecta CMS populares, plataformas de comercio electrónico, _frameworks_ de JavaScript y otras tecnologías web.
    
- **WAFW00F:** Una herramienta para la identificación (_fingerprinting_) de Cortafuegos de Aplicaciones Web (WAFs). Ayuda a determinar si un sitio web está protegido por un WAF.