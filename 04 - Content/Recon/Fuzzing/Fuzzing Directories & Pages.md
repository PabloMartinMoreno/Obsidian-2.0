---
aliases:
  - "Fuzzing"
  - Fuzzing de Paginas y Directorios
tags:
  - technique/recon/active
  - asset/web-app
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: CheatSheet
linked:
  - "[[ffuf]]"
  - "[[gobuster]]"
  - "[[feroxbuster]]"
  - "[[Seclists]]"
---
# Fuzzing de Paginas y Directorios

---

## Cheatsheet

````tabs
tab: **Ffuf**
![[ffuf#^ffuf-fuzzing-directorios]]

tab: **GoBuster**
![[gobuster#^gobuster-fuzzing-directorios]]

tab: **FeroxBuster**
![[feroxbuster#^feroxbuster-fuzzing-directorios]]

tab: **Wordlists**
![[Seclists#^wordlists-fuzzing-directorios]]

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

