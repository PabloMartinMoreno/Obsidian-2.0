---
aliases:
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
---
# Parameter & Value Fuzzing

***

## Cheatsheet

````tabs
tab: **Comandos**

| **Acción**                                                                                                                                                                                   | **Descripción**                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `curl -s http://<target-ip-or-domain>:<port>/admin.php \| wc -c`                                                                                                                             | **(GET)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos.                                                   |
| `ffuf -c -w <parameter-wordlist> -u http://<target-ip-or-domain>:<port>/admin.php?FUZZ=<appropriate-key> -fs <char-count>`                                                                   | **(GET)** Parámetros de distorsión utilizando el recuento de caracteres desde la línea de base para filtrar los resultados incorrectos. |
| `curl -s http://<target-ip-or-domain>:<port>/admin.php -X POST -H "Content-Type: application/x-www-form-urlencoded" \| wc -c`                                                                | **(POST)** Obtiene la respuesta de referencia para filtrar los resultados incorrectos.                                                  |
| `ffuf -c -w <parameter-wordlist> -u http://<target-ip-or-domain>:<port>/admin.php -X POST -d 'FUZZ=<appropriate-key>' -H 'Content-Type: application/x-www-form-urlencoded' -fs <char-count>` | **(POST)** Parámetros difusos que utilizan el recuento de caracteres de la línea de base para filtrar los resultados erróneos.          |

tab: **Wordlists**

| **Wordlist**                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/burp-parameter-names.txt`** (para parametros)**                                                                                                                      |
| • `/usr/share/wordlists/seclists/Fuzzing/LFI/LFI-Jhaddix.txt` **(para LFI path traversal)**                                                                                                                                 |
| • `/usr/share/wordlists/seclists/Discovery/Web-Content/default-web-root-directory-linux.txt` & `/usr/share/wordlists/seclists/Discovery/Web-Content/default-web-root-directory-windows.txt` **(para LFI web root fuzzing)** |
| • `for i in $(seq 1 1000); do echo $i >> ids.txt; done`** (para secuencia de valores)**                                                                                                                                     |

````

## Overview

**El fuzzing de parámetros se utiliza para identificar vulnerabilidades en aplicaciones web mediante la manipulación de parámetros de entrada en URL (GET) o cuerpos de solicitud (POST).**

Mediante el uso de herramientas como ffuf para automatizar el fuzzing con listas de palabras personalizadas, se pueden identificar parámetros inesperados u ocultos, rutas de archivos u otros problemas de la aplicación.

**Es fundamental establecer primero la respuesta de referencia con parámetros no válidos conocidos para filtrar los resultados irrelevantes.**

Este proceso suele requerir la creación de listas de palabras específicas, especialmente para valores como nombres de usuario o números secuenciales.