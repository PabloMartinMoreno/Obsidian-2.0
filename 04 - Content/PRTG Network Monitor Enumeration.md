---
aliases:
tags:
  - type/cheatsheet
  - service/prtg
  - protocol/http
  - tool/curl
  - tool/nmap
  - tool/prtgadmin
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# PRTG Network Monitor Enumeration

***

## Cheatsheet

| **Acción**                                            | **Descripción**                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `sudo nmap -sV -p 80,443,8080 --open -v -T4 <target>` | **(NMAP)** Ejecuta un escaneo Nmap en los puertos más usados para identificar PRTG. |
| `curl -s <target>:<port>/index.htm \| grep version`   | **(CURL, GREP)** Extrae información de versión desde el HTML.                       |
| `prtgadmin:prtgadmin`                                 | **(CREDENCIALES)** Intentar credenciales por defecto en el login.                   |
|                                                       |                                                                                     |

## Overview

PRTG es una herramienta de monitorización (interfaz AJAX). La enumeración busca fingerprinting de versión y comprobar credenciales por defecto; suele aparecer en puertos **80**, **443** y **8080**.