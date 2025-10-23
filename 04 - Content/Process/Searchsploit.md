---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Pre-Exploitation]]"
tertiary categories:
  - "[[Payload Generation]]"
type: CheatSheet
linked:
---
# Searchsploit

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`searchsploit --update`|Actualiza la base de datos local de exploit.|
|`searchsploit <term>`|Busca exploits que coincidan con la palabra clave dada. **Mostrará la ruta relativa del exploit.**|
|`searchsploit --cve <cve>`|Busca exploits por ID **CVE**.|
|`searchsploit -m <relative-path>`|Copia el archivo del exploit al directorio actual desde una ruta relativa.|
|`searchsploit ---www <term>`|Muestra las **URLs de Exploit-DB** en lugar de rutas de archivo locales.|

## Overview

**Searchsploit** es una herramienta de línea de comandos que permite buscar en una copia **offline** de [Exploit-DB](https://www.exploit-db.com/) PoCs (proof-of-concepts) públicamente disponibles.

Dado que el acceso a Internet no siempre está garantizado durante un engagement, es importante estar preparado con recursos offline como **Searchsploit** para identificar exploits relevantes.