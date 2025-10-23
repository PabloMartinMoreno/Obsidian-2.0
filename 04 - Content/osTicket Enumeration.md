---
aliases:
tags:
  - type/cheatsheet
  - service/osticket
  - protocol/http
  - tool/curl
  - meta/known-paths
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# osTicket Enumeration

***

## CheatSheet

| **Acción**                    | **Descripción**                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curl <osTicket-root>/setup/` | **(CURL)** Se comprueba si hay filtrado de versión si la página de instalación aún existe.                                                                                                                                         |
| Pie de página del sitio       | La mayoría de instalaciones muestran el logo de osTicket con “powered by” y “Support Ticket System.”                                                                                                                               |
| N/D                           | Los portales de soporte a veces generan direcciones de correo temporales de la compañía al abrir un ticket; estas pueden usarse para registrarse en otras aplicaciones expuestas que requieran verificación por email corporativo. |

## Overview

osTicket es un sistema de tickets de soporte open-source, similar a Jira, OTRS, Request Tracker y Spiceworks. La enumeración busca fingerprinting de versión; para explotarlo se necesitará acceso de administrador. osTicket suele encontrarse en los puertos **80 (HTTP)** y **443 (HTTPS)**.