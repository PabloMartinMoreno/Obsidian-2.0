---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/passive
  - tools/reconnaissance/passive
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
type: CheatSheet
linked:
---
# CanaryTokens

***

## CheatSheet

| Operador                       | Descripción                                                              |
| ------------------------------ | ------------------------------------------------------------------------ |
| https://canarytokens.com/nest/ | URL del sitio web de CanaryTokens.                                       |
| `Web Bug`                      | Para recibir una alerta cuando el objetivo abre una URL en su navegador. |
| https://temp-mail.org/         | URL de un servicio de correo temporal, para evitar usar tu correo real.  |

## Descripción general

Canarytokens.org es un servicio online gratuito que proporciona _tripwires_ digitales (llamados canary tokens) que pueden usarse para reunir inteligencia sobre un objetivo cuando el token se dispara.

Puede ayudar a identificar:

- Versión del navegador
- Geolocalización
- Dirección IP
- Sistema operativo
- Zona horaria
- User agent
- Cabecera referrer

Intenta engañar al objetivo para que abra la URL y active el token, y así recopilar información sobre su sistema y red.
![[CanaryToken 1.png]]

![[CanaryToken 2.png]]