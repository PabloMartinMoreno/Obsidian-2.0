---
aliases:
tags:
  - type/cheatsheet
  - technique/passive-recon
  - asset/domain
  - meta/reference
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Passive Subdomain Enumeration

***

## Cheatsheet

| **Acción**                                                                                                                                                                                    | **Descripción**                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `whois <target-FQDN>` o `whois <target-ip>`<br>o<br>`whois <target-ip>`                                                                                                                       | Realiza una búsqueda WHOIS para obtener los detalles de registro y contacto del dominio objetivo.       |
| `whois -h <whois-server> ...`                                                                                                                                                                 | Realiza una búsqueda WHOIS utilizando un servidor WHOIS específico.                                     |
| `curl -s https://crt.sh/\?q\=<target-domain>\&output\=json \| jq .`                                                                                                                           | Obtiene los registros de transparencia de certificados para un dominio desde Crt.sh.                    |
| `curl -s https://crt.sh/\?q\=<target-domain>\&output\=json \| jq . \| grep name \| cut -d":" -f2 \| grep -v "CN=" \| cut -d'"' -f2 \| awk '{gsub(/\\n/,"\n");}1;' \| sort -u > subdomain.lst` | Extrae subdominios únicos de los registros de Crt.sh y los guarda en `subdomain.lst`.                   |
| `for i in $(cat subdomain.lst); do host $i \| grep "has address" \| grep <target-domain> \| cut -d" " -f4 >> ip-addresses.txt; done`                                                          | Resuelve las direcciones IP de los subdominios descubiertos y las guarda en `ip-addresses.txt`.         |
| `for i in $(cat ip-addresses.txt); do shodan host $i; done`                                                                                                                                   | Escanea cada dirección IP resuelta usando Shodan en busca de puertos abiertos o vulnerabilidades.       |
| https://domain.glass/                                                                                                                                                                         | Obtiene información agregada sobre el dominio.                                                          |
| https://buckets.grayhatwarfare.com/files                                                                                                                                                      | Busca _buckets_ (depósitos) de almacenamiento en la nube públicos relacionados con el dominio objetivo. |
| https://www.virustotal.com/gui/domain/                                                                                                                                                        | Ver el historial de DNS e información relacionada que podría revelar subdominios.                       |

## Overview

El reconocimiento de dominios implica recopilar información públicamente disponible sobre un dominio, incluyendo su infraestructura, subdominios y certificados relacionados.

- **WHOIS:** Proporciona detalles de registro sobre el propietario del dominio, incluida información de contacto (si no está protegida por privacidad).
- **Crt.sh:** Un motor de búsqueda de certificados utilizado para encontrar certificados SSL/TLS emitidos para un dominio. Aprovecha los registros de Transparencia de Certificados para exponer subdominios e información de infraestructura.
- **Domain.Glass:** Agrega información del dominio, ofreciendo una visión general del DNS, proveedores de _hosting_ y otros detalles clave.
- **Shodan:** Un motor de búsqueda de dispositivos conectados a Internet, que permite a los usuarios descubrir servidores expuestos, cámaras web, bases de datos y otros sistemas con puertos abiertos o vulnerabilidades.
- **GrayHatWarfare:** Busca _buckets_ (depósitos) de almacenamiento en la nube expuestos que podrían contener archivos sensibles o tener permisos mal configurados.
- **VirusTotal:** Muestra el historial de DNS, datos de certificados y subdominios relacionados para un dominio dado, ayudando a mapear la actividad histórica del dominio.