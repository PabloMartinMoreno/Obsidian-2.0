---
aliases:
tags:
  - type/cheatsheet
  - technique/recon/passive
  - asset/infrastructure
  - meta/reference
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
type: CheatSheet
linked:
  - "[[CanaryTokens]]"
---
# Passive Infrastructure Identification

***
## CheatSheet

| **Acción**                       | **Descripción**                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| https://searchdns.netcraft.com/  | Obtener información de dominio a partir de un dominio mediante Netcraft.                                    |
| https://sitereport.netcraft.com/ | Obtener información del servidor y del hosting de un dominio mediante Netcraft.                             |
| www.wappalyzer.com/lookup/       | Obtener información del stack tecnológico de un sitio mediante Wappalyzer.                                  |
| https://web.archive.org/         | Ver versiones históricas de un sitio web usando la Wayback Machine.                                         |
| <br>[[CanaryTokens]]             | <br>Obtener información del lado del cliente sobre un objetivo en particular mediante phishing con una URL. |

Se pueden combinar estas herramientas públicamente disponibles para obtener una visión más completa sin interactuar directamente con los sistemas del objetivo.

## Descripción general

La identificación pasiva de infraestructura consiste en recopilar información sobre la infraestructura de un objetivo sin interactuar directamente con sus sistemas.

Aprovechando herramientas y recursos públicamente accesibles, los analistas pueden descubrir datos valiosos como detalles del servidor, historial de hosting y configuraciones anteriores.

Este enfoque ayuda a evitar activar alarmas en los sistemas del objetivo mientras se recoge inteligencia útil.

Con herramientas como Netcraft se pueden extraer detalles de contexto —proveedor de hosting, configuración de red, servidores de nombres e historial de IPs—. Hay que prestar atención a direcciones IP anteriores, ya que podrían revelar el IP original del servidor antes de que estuviera detrás de un balanceador, un WAF u otros controles; eso podría permitir conexiones directas si existen malas configuraciones.

De igual forma, la Wayback Machine permite acceder a versiones archivadas de sitios web, que a veces contienen comentarios antiguos en el código fuente o archivos expuestos.