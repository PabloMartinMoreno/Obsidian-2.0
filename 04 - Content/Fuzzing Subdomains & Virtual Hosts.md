---
aliases:
  - Fuzzing de Subdominios y Hosts Virtuales
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
  - "[[DNS (53) - Enumeración]]"
  - "[[curl]]"
  - "[[ffuf]]"
  - "[[Seclists]]"
  - "[[gobuster]]"
---
# Fuzzing de Subdominios y Hosts Virtuales

***

## Cheatsheet

````tabs
tab: **Curl**
![[Curl - Enumeración de Sub-Dominios y V.Host#^curl-enum-subdominios-vhost]]

tab: **Ffuf**
![[Ffuf#^ffuf-enum-vhost]]

tab: **GoBuster**
![[gobuster#^gobuster-enum-vhost]]

tab: **Wordlists**
![[Seclists#^wordlists-subdominios-vhost]]


````

***

## Overview

**El fuzzing de subdominios utiliza listas de palabras (wordlists) para descubrir subdominios ocultos bajo un dominio objetivo, mientras que el fuzzing de hosts virtuales comprueba hosts válidos basándose en la cabecera (header) `Host`.**

El recuento de caracteres de una página de subdominio o host virtual inexistente es útil para filtrar resultados no válidos.

Estos métodos son particularmente útiles para revelar otras partes de una infraestructura web, como dominios ocultos o servicios que se ejecutan en el mismo servidor.


***

## Notas Relacionadas

- [[DNS (53) - Enumeración]]: Para una enumeración DNS más profunda.