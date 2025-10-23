---
aliases:
tags:
  - type/cheatsheet
  - technique/recon/active
  - asset/dns
  - tool/curl
  - tool/ffuf
  - meta/virtual-hosts
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
  - "[[DNS Enumeration (53)]]"
---
# Subdomain & Virtual Host Fuzzing

***

## Cheatsheet

````tabs
tab: **Comandos**

| **Acción**                                                                                                       | **Descripción**                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `curl -s -H "Host: nonexistant.<target-domain>" <target-ip>:<port> \| wc -c`                                     | Determina el recuento de caracteres de una página "sin host" para filtrar resultados erróneos durante el fuzzing de V-Host (hosts virtuales). |
| `ffuf -c -w <wordlist> -u http://<target-ip-or-domain>:<port>/ -H 'Host: FUZZ.<target-domain>' -fs <char-count>` | Realiza fuzzing de hosts virtuales, filtrando según el recuento de caracteres. Tras encontrar un V-Host válido, añádelo a `/etc/hosts`.       |
| `ffuf -c -w <wordlist> -u http://FUZZ.<target-domain>/`                                                          | Realiza fuzzing de subdominios DNS (solo funciona en sitios web públicos). Evita usar direcciones IP, usa dominios DNS reales.                |


tab: **Wordlists**

| **Wordlists a usar**:                                                 |
| --------------------------------------------------------------------- |
| • `/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt` |
| • `/usr/share/seclists/Discovery/DNS/namelist.txt`                    |


````

## Notas Relacionadas

- [[[[DNS Enumeration (53)]]: Para una enumeración DNS más profunda.

## Overview

**El fuzzing de subdominios utiliza listas de palabras (wordlists) para descubrir subdominios ocultos bajo un dominio objetivo, mientras que el fuzzing de hosts virtuales comprueba hosts válidos basándose en la cabecera (header) `Host`.**

El recuento de caracteres de una página de subdominio o host virtual inexistente es útil para filtrar resultados no válidos.

Estos métodos son particularmente útiles para revelar otras partes de una infraestructura web, como dominios ocultos o servicios que se ejecutan en el mismo servidor.