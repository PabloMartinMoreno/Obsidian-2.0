---
aliases:
  - Fuzzing de Paginas y Directorios
tags:
  - type/cheatsheet
  - technique/recon/active
  - asset/web-app
  - tool/ffuf
  - tool/gobuster
  - meta/wordlists
  - meta/params
  - protocol/http
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
  - "[[Fuff]]"
  - "[[GoBuster]]"
  - "[[FeroxBuster]]"
  - "[[Wordlists]]"
---
# Fuzzing de Paginas y Directorios

***

## Cheatsheet

````tabs
tab: Ffuf
![[Fuff#^ffuf]]


tab: GoBuster
![[GoBuster#^gobuster]]

tab: FeroxBuster
![[FeroxBuster#^feroxbuster]]

tab: Wordlists
![[Wordlists#^wordlists-fuzzing]]

````

```ad-important
Mirar siempre estas paginas: 
- `robots.txt`
- `sitemap.xml`
- `.git`
```


---

## Overview

**El fuzzing web ayuda a descubrir directorios y archivos ocultos en un servidor probando nombres comunes de una wordlist.**

Usando herramientas como ffuf, puede identificar recursos accesibles pero ocultos, incluyendo archivos con extensiones específicas o archivos index.

La recursión permite una exploración más profunda dentro de los directorios descubiertos para revelar más contenido oculto.