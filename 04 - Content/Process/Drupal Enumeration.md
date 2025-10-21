---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/web
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Drupal Enumeration

***

## CheatSheet

| Acción                                                                  | Descripción                                                                                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| <br>`curl -s http://<drupal-root>/CHANGELOG.txt \| grep -m2 ""`<br><br> | Revela la versión de Drupal obteniendo el archivo `CHANGELOG.txt`. Las instalaciones más nuevas pueden devolver un error 404. |
| <br>`droopescan scan drupal --url http://<drupal-root>`<br><br>         | <br>Realiza un escaneo automatizado para detectar la versión de Drupal y los plugins activos.                                 |
| <br>[[Web Server Enumeration]]                                          | Herramientas como Wappalyzer y WhatWeb suelen identificar Drupal, aunque pueden no precisar la versión exacta.                |

## Descripción general

Drupal es un Sistema de Gestión de Contenidos (CMS) de código abierto que permite ampliar su funcionalidad mediante plugins.

Durante la enumeración se busca identificar la versión de Drupal y los plugins activos. Esta información es importante porque puede relacionarse con vulnerabilidades conocidas que permitan explotar la aplicación. Herramientas como **Droopescan** automatizan este proceso.

Drupal suele encontrarse en los puertos `80` (HTTP) y `443` (HTTPS).

## Roles de usuario

Drupal tiene tres roles de usuario predeterminados:

- **Administrador:**  
    Tiene control total del sitio (gestión de usuarios, contenido y configuraciones).
    
- **Usuario autenticado:**  
    Usuarios que inician sesión y pueden realizar acciones según los permisos asignados (por ejemplo, publicar o editar artículos).
    
- **Usuario anónimo:**  
    Visitantes no autenticados; por defecto solo pueden ver el contenido público.
    

---
