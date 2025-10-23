---
aliases:
  - Enumeración Rsync (873)
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
  - "[[SSH Enumeration (22)]]"
  - "[[FTP Enumeration (21)]]"
---
# Enumeración Rsync (873)

***
## Cheatsheet

| **Acción**                                                                            | **Descripción**                                                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `sudo nmap -sV -p 873 <target>`                                                       | Se escanea la versión de Rsync para determinar la versión del protocolo.    |
| `nc -nv <target> 873`                                                                 | Se sondean módulos Rsync accesibles.                                        |
| `msfconsole -x "use auxiliary/scanner/rsync/modules_list; set RHOSTS <target>; run;"` | Se enumeran módulos Rsync compartidos usando Metasploit.                    |
| `rsync -av --list-only rsync://<target>/<module>`                                     | Se listan archivos desde un módulo Rsync abierto.                           |
| `rsync -av rsync://<target>/<module> ./rsync_shared`                                  | Se copian todos los archivos de un módulo Rsync abierto a la máquina local. |
**Nota:** Se indica usar la sintaxis `rsync://<user>@<target>/<module>` para especificar un usuario en la CLI de Rsync.
**Nota:** Para transferir archivos con cifrado SSH, añadir `-e ssh`. Para puertos SSH no estándar, usar `-e "ssh -p <port>"`.

***

## Overview

*Rsync es una herramienta para copiar archivos local y remotamente*, comúnmente encontrada en sistemas operativos tipo Unix como Linux y macOS, y disponible para Windows mediante implementaciones de terceros.

A menudo se utiliza para copias de seguridad y espejado, debido a su capacidad para minimizar la transferencia de datos copiando solo las partes de los archivos que han cambiado.

Los módulos Rsync actúan como directorios en un servidor de [[FTP Enumeration (21)]], organizando datos que pueden estar opcionalmente protegidos con contraseña. *Estos módulos pueden contener información sensible* y, cuando se usa Rsync sin SSH, los datos se transmiten sin cifrar, lo que puede exponerlos en redes no confiables.

El puerto predeterminado para Rsync es **TCP 873**, y aunque puede usar [[SSH Enumeration (22)]] para transferencias seguras, la falta de cifrado en redes no seguras puede dejar los datos vulnerables.