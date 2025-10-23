---
aliases:
tags:
  - type/cheatsheet
  - service/magento
  - protocol/http
  - tool/curl
  - tool/php
  - meta/extensions
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Magento Enumeration

***

## CheatSheet

| **Acción**                                  | **Descripción**                                                                                                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br>`php /opt/magescan.phar scan:all <URL>` | **(PHP, MAGESCAN)** Usa la herramienta Mage Scan para recopilar detalles de la instancia Magento Identifica la versión exacta y detecta páginas expuestas. Prestar atención a páginas que muestren errores o fallos. |
| `curl http://<URL>/app/etc/local.xml`       | **(CURL)** Si `app/etc/local.xml` está expuesto puede contener información sensible (por ejemplo, credenciales MySQL) que supone un riesgo de seguridad.                                                             |
| `CTRL + U`                                  | Método alternativo: buscar el año de publicación en el código (usar `CTRL + F` para "All Rights Reserved") y luego correlacionar el año con la versión de Magento vía búsqueda.                                      |

## Overview

Magento es una plataforma de eCommerce open-source (recientemente adquirida por Adobe), escrita en PHP y normalmente usa MySQL. Se debe revisar la divulgación de información en ficheros no protegidos. Magento suele encontrarse en los puertos 80 (HTTP) y 443 (HTTPS).