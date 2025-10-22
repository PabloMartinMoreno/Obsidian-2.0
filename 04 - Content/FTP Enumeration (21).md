---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/services
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[Creds]]"
---
# FTP Enumeration (21)

***

## Cheatsheet

| **Acción**                                                     | **Descripción**                                                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `sudo nmap -sC -sV -p 21 -v <target>`                          | Realiza un escaneo Nmap del servicio FTP para identificar versiones, scripts y comprobaciones de login anónimo. Bastante ruidoso. |
| `sudo nmap -sV -p21 --script ftp-anon <target-ip>`             | Ejecuta un script de Nmap para comprobar si el servidor FTP permite autenticación anónima.                                        |
| `ftp <target>`<br>`nc -nv <target> 21`<br>`telnet <target> 21` | Diferentes formas de conectarse a un servicio FTP remoto (cliente FTP, netcat, telnet).                                           |
| `wget -m --no-passive ftp://<user>:<password>@<target-ip>`     | Descarga recursivamente todos los ficheros accesibles del servidor FTP objetivo usando Wget.                                      |

## Overview

**FTP (File Transfer Protocol) es un protocolo de red muy usado para transferir ficheros entre cliente y servidor.** Permite subir/descargar archivos, navegar directorios y gestionar permisos de forma remota.

**Los ficheros en servidores FTP pueden contener información sensible (credenciales, datos privados, configuraciones del sistema)** que, si no están bien protegidos, podrían ser explotados por atacantes.

FTP funciona en dos modos para la conexión de datos: **active** y **passive**. En modo activo el cliente selecciona el puerto de datos; en modo pasivo, es el servidor el que determina el puerto. Además, FTP transmite credenciales en texto claro (usuario/contraseña sin cifrar), por lo que es vulnerable a intercepción y sniffing.

El servicio FTP puede permitir acceso **anónimo**, con permisos de solo lectura o incluso de escritura (upload). Credenciales anónimas comunes:
- `anonymous:anonymous`
- `anonymous:` (contraseña en blanco)
- `ftp:ftp`
- `guest:guest`

Comprobar las herramientas de [[creds]] para otros pares por defecto.

Los puertos predeterminados para FTP son el puerto TCP **21** para los comandos de control y el puerto TCP **20** para la transferencia de datos.

---
