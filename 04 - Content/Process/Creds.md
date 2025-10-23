---
aliases:
tags:
  - type/cheatsheet
  - meta/credentials
  - tool/hashcat
  - tool/credscan
  - meta/password-polices
  - meta/default-creds
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# Creds

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`creds update`|Actualiza la base de datos de **credenciales por defecto**.|
|`creds search <service>`|Busca credenciales por defecto para un **servicio** especificado.|
|`creds search <service> export`|Busca credenciales por defecto para un servicio y **genera wordlists** de usuarios y contraseñas.|

## Overview

**Creds** es una utilidad de línea de comandos diseñada para **buscar credenciales por defecto** asociadas a distintos servicios.  
Es especialmente útil para ataques de **fuerza bruta de inicio de sesión**, ya que ayuda a identificar nombres de usuario y contraseñas comunes o de fábrica para un servicio dado.

## Artículos Relacionados

#porhacer enlazar fuerza bruta de contraseñas 