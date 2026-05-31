---
aliases:
  - "Subdomain Discovery"
  - "vhosts"
  - Enumeración Pasiva de Subdominios
tags:
  - technique/recon/active
  - technique/recon/passive
  - asset/domain
  - asset/web-app
  - meta/reference
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: CheatSheet
linked:
  - "[[whois]]"
  - "[[curl]]"
  - "[[Bash]]"
---
# Enumeración Pasiva de Sub-dominios

***

## Cheatsheet

````tabs
tab: **Whois**
![[whois#^whois-enum-pasiva-subdominios]]

tab: **Curl**
![[Curl - Enumeración Pasiva de Sub-Dominios#^curl-enum-pasiva-subdominios]]

tab: **Bash**
![[Bash#^bash-enum-pasiva-subdominios]]

tab: **Paginas**

| **Web**                                  | **Descripción**                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| https://domain.glass/                    | Obtiene información agregada sobre el dominio.                                                          |
| https://buckets.grayhatwarfare.com/files | Busca _buckets_ (depósitos) de almacenamiento en la nube públicos relacionados con el dominio objetivo. |
| https://www.virustotal.com/gui/domain/   | Ver el historial de DNS e información relacionada que podría revelar subdominios.                       |

````


***

## Overview

El reconocimiento de dominios implica recopilar información públicamente disponible sobre un dominio, incluyendo su infraestructura, subdominios y certificados relacionados.

- **WHOIS:** Proporciona detalles de registro sobre el propietario del dominio, incluida información de contacto (si no está protegida por privacidad).
- **Crt.sh:** Un motor de búsqueda de certificados utilizado para encontrar certificados SSL/TLS emitidos para un dominio. Aprovecha los registros de Transparencia de Certificados para exponer subdominios e información de infraestructura.
- **Domain.Glass:** Agrega información del dominio, ofreciendo una visión general del DNS, proveedores de _hosting_ y otros detalles clave.
- **Shodan:** Un motor de búsqueda de dispositivos conectados a Internet, que permite a los usuarios descubrir servidores expuestos, cámaras web, bases de datos y otros sistemas con puertos abiertos o vulnerabilidades.
- **GrayHatWarfare:** Busca _buckets_ (depósitos) de almacenamiento en la nube expuestos que podrían contener archivos sensibles o tener permisos mal configurados.
- **VirusTotal:** Muestra el historial de DNS, datos de certificados y subdominios relacionados para un dominio dado, ayudando a mapear la actividad histórica del dominio.