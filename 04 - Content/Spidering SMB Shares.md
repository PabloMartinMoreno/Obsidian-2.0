---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/services
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# Spidering SMB Shares

***

## Cheatsheet

| **Acción**                                                                                         | **Descripción**                                                                                                |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `nxc smb <target> -u <user> -p '<password>' --shares`                                              | Verifica si la cuenta tiene acceso a las carpetas compartidas.                                                 |
| `nxc smb <target> -u <user> -p '<password>' --spider <share> --pattern <search-term>`              | Recorre un **share** para buscar archivos que contengan una cadena específica. #porhacer: Falta esta sintaxis. |
| `nxc smb <target> -u <user> -p '<password>' --spider <share> --regex <regex>`                      | Recorre un **share** para buscar archivos que coincidan con un patrón regex. #porhacer: Falta esta sintaxis.   |
| `nxc smb <target> -u <user> -p '<password>' --share <share> --get-file <remote-file> <local-file>` | Descarga un archivo desde un **share** SMB. #porhacer: Falta esta sintaxis.                                    |
| `nxc smb <target> -u <user> -p '<password>' --share <share> --put-file <local-file> <remote-file>` | Sube un archivo a un **share** SMB. #porhacer: ¿algo relevante aquí?                                           |
| `nxc smb <target> -u <user> -p '<password>' -M spider_plus -o DOWNLOAD_FLAG=TRUE`                  | Descarga todos los archivos de todos los **shares** no excluidos a `/tmp/cme_spider_plus`.                     |

## Overview

El **spidering** se refiere al proceso de buscar a través de **shares SMB** para encontrar archivos o contenido específico.

[[NetExec]] provee varios comandos para automatizar este proceso. Esto puede ser útil para localizar archivos sensibles o interesantes en múltiples shares.

Adicionalmente, el módulo **spider_plus** permite **descargar todos los archivos** de los shares no excluidos de una sola vez, simplificando el proceso de exfiltración.

Tener en cuenta que, dependiendo de la cantidad de archivos y shares, la operación puede **tomar bastante tiempo**.