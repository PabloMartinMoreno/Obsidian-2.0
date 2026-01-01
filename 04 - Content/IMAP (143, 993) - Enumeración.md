---
aliases:
tags:
  - type/cheatsheet
  - technique/recon/active
  - service/imap
  - protocol/imap
  - port/143
  - port/993
  - tool/openssl-s_client
  - tool/telnet
  - tool/imapclient
  - tool/nmap
  - meta/commands
  - meta/auth-methods
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[Common IMAP Commands]]"
---
# Enumeración IMAP (143, 993)

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`sudo nmap --script "imap-capabilities or imap-ntlm-info" -sV -v -p <port> <target>`|Realiza un escaneo Nmap para recopilar información sobre el servicio IMAP.|
|`telnet <target> 143`|Se conecta al servicio IMAP sin cifrar.|
|`openssl s_client -connect <target>:993`|Se conecta al servicio IMAPS cifrado usando SSL.|
**Nota:** Si tienes problemas al interactuar con IMAP desde la línea de comandos, considera usar el cliente de correo **Evolution**.

***

## Overview

**IMAP (Internet Message Access Protocol)** es un protocolo que permite a los usuarios acceder y administrar mensajes de correo electrónico directamente en el servidor de correo, en lugar de descargarlos a un dispositivo local.

A diferencia de **POP3 Enumeration (110, 995)**, IMAP admite acceso sincronizado en varios dispositivos, lo que significa que cualquier acción (como leer, organizar o eliminar mensajes) se refleja en el servidor y es visible en todos los dispositivos.  
Funciona de manera similar a un **sistema de archivos de red para correos electrónicos**, proporcionando soporte para estructuras de directorios complejas.

Con IMAP, los correos se almacenan en el servidor de correo, y cuando accedes a tu buzón, estás viendo los mensajes directamente desde allí.  
Los cambios que realices, como marcar un correo como leído o mover mensajes a carpetas, se sincronizan inmediatamente con el servidor.

IMAP utiliza un proceso de **autenticación por nombre de usuario y contraseña**, que puede complementarse con medidas de seguridad adicionales.

El **puerto predeterminado** para IMAP es el **143**, y la versión cifrada, **IMAPS**, normalmente usa el **993**.

---

## Artículos relacionados

- [[Common IMAP Commands]]: Comandos para usar al interactuar manualmente con el servicio.

---