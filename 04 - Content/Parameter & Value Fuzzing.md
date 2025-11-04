---
aliases:
  - Fuzzing de Parámetros y Valores
tags:
  - type/cheatsheet
  - technique/recon/active
  - asset/web-app
  - protocol/http
  - tool/ffuf
  - tool/curl
  - meta/wordlists
  - meta/poc
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
  - "[[Curl]]"
  - "[[Fuff]]"
  - "[[GoBuster]]"
  - "[[Wordlists]]"
---
# Fuzzing de Parámetros y Valores

***

## Cheatsheet

````tabs
tab: **Comandos**


tab: **Wordlists**
![[Wordlists#^wordlists-fuzzing-parametros]]

````


| **Acción**                                                                                                                                                                   | **Descripción**                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `curl -s http://<ip>:<port>/admin.php \| wc -c`                                                                                                                              | **(GET)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos.                                                   |
| `ffuf -c -w <wordlist> -u http://<ip>:<port>/admin.php?FUZZ=<appropriate-key> -fs <char-count>`                                                                              | **(GET)** Parámetros de distorsión utilizando el recuento de caracteres desde la línea de base para filtrar los resultados incorrectos. |
| `curl -s http://<ipv>:<port>/admin.php -X POST -H "Content-Type: application/x-www-form-urlencoded" \| wc -c`                                                                | **(POST)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos.                                                  |
| `ffuf -c -w <parameter-wordlist> -u http://<ipv>:<port>/admin.php -X POST -d 'FUZZ=<appropriate-key>' -H 'Content-Type: application/x-www-form-urlencoded' -fs <char-count>` | **(POST)** Parámetros difusos que utilizan el recuento de caracteres de la línea de base para filtrar los resultados erróneos.          |

## Overview

**El fuzzing de parámetros se utiliza para identificar vulnerabilidades en aplicaciones web mediante la manipulación de parámetros de entrada en URL (GET) o cuerpos de solicitud (POST).**

Mediante el uso de herramientas como [[Fuff]] para automatizar el fuzzing con listas de palabras personalizadas, se pueden identificar parámetros inesperados u ocultos, rutas de archivos u otros problemas de la aplicación.

**Es fundamental establecer primero la respuesta de referencia con parámetros no válidos conocidos para filtrar los resultados irrelevantes.**