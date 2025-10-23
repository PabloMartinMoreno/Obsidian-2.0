---
aliases:
tags:
  - type/cheatsheet
  - asset/source-code
  - tool/git-dumper
  - protocol/http
  - protocol/git
  - meta/poc
  - technique/recon/active
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Git-Dumper

***

## Cheatsheet

| **Acción**                               | **Descripción**                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pip install git-dumper`                 | Instala git-dumper si aún no lo tienes instalado.                                           |
| `git-dumper <git-url> <local-directory>` | Vuelca el contenido de un repositorio Git desde una URL a un directorio local especificado. |

## Overview

[[Git-Dumper]] es una herramienta CLI diseñada para la descarga automatizada de archivos de repositorios Git desde un servidor web.

Ayuda a recuperar directorios .git expuestos en aplicaciones web y a extraer su contenido para su análisis, a menudo con el fin de identificar posibles configuraciones erróneas o fugas de datos confidenciales.