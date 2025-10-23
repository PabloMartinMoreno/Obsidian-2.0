---
aliases:
tags:
  - type/cheatsheet
  - technique/recon/passive
  - asset/repository
  - meta/osint
  - tool/github
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
type: CheatSheet
linked:
---
# GitHub Dorking

***

## CheatSheet

| **Operador**     | **Descripción**                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `owner:<target>` | Restringe los resultados de búsqueda a los que pertenecen a un propietario.                     |
| `path:<string>`  | Restringe los resultados de búsqueda a archivos que contienen una cadena en su ruta de archivo. |

#porhacer 

Se pueden combinar múltiples operadores para búsquedas precisas.

El repositorio [GitHub Dorks](https://github.com/techgaun/github-dorks) contiene técnicas útiles de dorking para encontrar datos sensibles.

## Descripción general

El _GitHub dorking_ es el proceso de usar consultas de búsqueda avanzadas para descubrir datos sensibles expuestos de forma involuntaria en repositorios públicos.

Aprovechando los operadores de búsqueda de GitHub, atacantes e investigadores de seguridad pueden localizar claves de API, credenciales, volcados de bases de datos y otra información confidencial almacenada en repositorios. Asegurar correctamente los repositorios y utilizar archivos `.gitignore` puede ayudar a prevenir filtraciones accidentales.