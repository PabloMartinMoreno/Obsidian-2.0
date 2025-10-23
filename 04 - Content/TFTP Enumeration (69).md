---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# TFTP Enumeration (69)

***

## Cheatsheet

| **Acción** | **Descripción**                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `connect`  | Especifica el host remoto y, opcionalmente, el puerto para las transferencias de archivos.                                                |
| `get`      | Descarga uno o varios archivos desde el host remoto al host local.                                                                        |
| `put`      | Sube uno o varios archivos desde el host local al host remoto.                                                                            |
| `quit`     | Sale del cliente TFTP.                                                                                                                    |
| `status`   | Muestra el estado actual del TFTP, incluyendo el modo de transferencia (ASCII o binario), el estado de la conexión y el valor de timeout. |
| `verbose`  | Activa o desactiva el modo detallado, mostrando información adicional durante las transferencias de archivos.                             |

---

## Overview

El **TFTP (Trivial File Transfer Protocol)** es una versión simplificada del protocolo FTP (puerto 21), diseñada para realizar transferencias de archivos de manera rápida y ligera, sin las funciones avanzadas de FTP.

Sin embargo, **TFTP carece de autenticación y cifrado**, lo que lo hace vulnerable a accesos no autorizados e interceptación de datos.  
Por esta razón, **solo se utiliza en redes locales o entornos controlados**, como configuraciones automáticas de routers, switches o sistemas embebidos.

A diferencia de FTP, **TFTP no soporta listados de directorios** ni comandos de gestión de archivos complejos.

**Puerto por defecto:** UDP `69`.

---
