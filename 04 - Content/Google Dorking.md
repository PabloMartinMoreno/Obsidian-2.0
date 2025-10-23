---
aliases:
tags:
  - type/cheatsheet
  - technique/recon/passive
  - asset/domain
  - asset/web-app
  - meta/osint
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
type: CheatSheet
linked:
---
# Google Dorking

***

## Cheatsheet

| **Operador**           | **Descripción**                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `site:<target-domain>` | Restringe los resultados de búsqueda a un dominio específico.                                                                                                |
| `intext:<string>`      | Restringe los resultados a páginas que contengan el texto especificado en cualquier parte del cuerpo.                                                        |
| `filetype:<extension>` | Restringe los resultados para incluir solo archivos de cierto tipo, basado en su tipo MIME o extensión. Ej.: `txt`, `pdf`, `php`, etc.                       |
| `ext:<extension>`      | Restringe los resultados basándose estrictamente en la extensión de archivo, en lugar del tipo MIME. Ej.: `txt`, `pdf`, `php`, etc.                          |
| `intitle:<string>`     | Restringe los resultados que contienen una cadena específica dentro del título. Ej.: `intitle:"index of"` puede encontrar páginas de listado de directorios. |
| `inurl:<string>`       | Restringe los resultados a URLs que contienen la cadena especificada. Ej.: `.env`, `admin`                                                                   |
| `-<operator>`          | Niega un operador anteponiéndole un signo menos, excluyendo resultados que coincidan con el criterio dado.                                                   |

Se pueden combinar operadores en una sola consulta para búsquedas más refinadas.

La [Google Hacking Database](https://www.exploit-db.com/google-hacking-database) es un recurso valioso para técnicas de búsqueda adicionales.

## Descripción general

El _Google dorking_ es la práctica de usar operadores de búsqueda avanzados para encontrar información específica o vulnerabilidades en la web que no son fácilmente accesibles mediante consultas de búsqueda estándar.

Esta técnica consiste en crear consultas precisas usando los operadores de Google para descubrir datos sensibles o ocultos, como bases de datos expuestas, páginas de inicio de sesión y archivos sin protección.