---
aliases:
tags:
  - type/vulnerability
  - vuln/file-upload
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: CheatSheet
linked:
  - "[[File Upload - Reconocimiento de Filtros]]"
  - "[[File Upload - Bypass de Filtros de Lista Negra]]"
  - "[[File Upload - Bypass de Filtros de Lista Blanca]]"
  - "[[File Upload - Bypass de Sobrescritura de Configuración]]"
  - "[[File Upload - Bypass de Contenido]]"
  - "[[File Upload - Bypass por Confusión y Desincronización]]"
  - "[[File Upload - Shells en PHP]]"
  - "[[File Upload - Desactivación de Validación Front-end]]"
---
# File Upload - Vulnerabilidades

***

## Cheatsheet

````tabs
tab: **Reconocimiento**
![[File Upload - Reconocimiento de Filtros#^fu-reconocimiento]]

tab: **Front-end**
![[File Upload - Desactivación de Validación Front-end#^fu-frontend]]

tab: **Lista Negra**
![[File Upload - Bypass de Filtros de Lista Negra#^fu-blacklist]]

tab: **Lista Blanca**
![[File Upload - Bypass de Filtros de Lista Blanca#^fu-whistelist]]

tab: **Sobrescritura**
![[File Upload - Bypass de Sobrescritura de Configuración#^fu-conf]]

tab: **Contenido**
![[File Upload - Bypass de Contenido#^fu-contenido]]

tab: **Confusión**
![[File Upload - Bypass por Confusión y Desincronización#^fu-confusion]]
````


***

## Overview


***

## Notas Relacionadas


***

## Ejercicio Final CWES

Lista de extensiones php: [PayloadsAllTheThings/Upload Insecure Files/Extension PHP/extensions.lst at master · swisskyrepo/PayloadsAllTheThings · GitHub](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Upload%20Insecure%20Files/Extension%20PHP/extensions.lst)
Pruebo en burpsuite las extensiones permitidas. 

Lista de tipos de contenido web: [raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/web-all-content-types.txt](https://github.com/danielmiessler/SecLists/raw/master/Discovery/Web-Content/web-all-content-types.txt)
Pruebo en burpsuite 