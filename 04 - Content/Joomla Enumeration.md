---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Joomla Enumeration

***

## CheatSheet 

| **Acción**                                                                                    | **Descripción**                                                                                                                                                 |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curl -s http://<joomla-root>/robots.txt \| grep -i Joomla`                                   | **(CURL, GREP)** Revisa el archivo `robots.txt` para buscar referencias a Joomla. Aunque no revele la versión, puede confirmar la presencia de un sitio Joomla. |
| `curl -s http://<joomla-root>/administrator/manifests/files/joomla.xml \| xmllint --format -` | **(CURL, XMLLINT)** Recupera el archivo `joomla.xml`, que puede contener la versión exacta de Joomla si está expuesto.                                          |
| `curl -s http://<joomla-root>/language/en-GB/en-GB.xml`                                       | **(CURL)** Verifica el archivo `en-GB.xml`, que también puede filtrar la versión de Joomla.                                                                     |
| `curl -s http://<joomla-root>/plugins/system/cache/cache.xml`                                 | **(CURL)** Recupera el archivo `cache.xml`, que puede dar pistas para aproximar la versión de Joomla.                                                           |
| `sudo pip3 install droopescan`                                                                | **(PIP3)** Instala Droopescan, un escáner basado en complementos para plataformas CMS como Joomla, WordPress y Drupal.                                          |
| `droopescan scan joomla --url http://<joomla-root>`                                           | **(DROOPESCAN)** Utiliza Droopescan para escanear un sitio Joomla e intentar determinar la versión exacta aplicando los métodos anteriores.                     |

## Artículos relacionados

**Falta listar artículos de ataque**

## Overview

 [Joomla](https://www.joomla.org/) es un CMS open-source escrito en PHP, normalmente usa MySQL (puede configurarse con PostgreSQL o SQLite). La enumeración se centra en fingerprinting de versión, manual (inspección de archivos) o automatizado ([Droopescan](https://github.com/SamJoan/droopescan)). 
 
 Joomla suele estar en los puertos **80 (HTTP)** y **443 (HTTPS)**.