---
aliases:
tags:
  - type/tool
  - technique/recon/active
  - asset/source-code
  - asset/web-app
  - service/git
  - service/http
  - tool/git-dumper
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: CheatSheet
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

[[git-dumper]] es una herramienta CLI diseñada para la descarga automatizada de archivos de repositorios Git desde un servidor web.

Ayuda a recuperar directorios .git expuestos en aplicaciones web y a extraer su contenido para su análisis, a menudo con el fin de identificar posibles configuraciones erróneas o fugas de datos confidenciales.