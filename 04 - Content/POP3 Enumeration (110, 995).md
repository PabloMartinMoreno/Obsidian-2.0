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
  - "[[Common POP3 Commands]]"
---
# POP3 Enumeration (110, 995)

***
## Cheatsheet

|Acción|Descripción|
|---|---|
|`sudo nmap --script "pop3-capabilities or pop3-ntlm-info" -sV -v -p <port> <target>`|Realiza un escaneo con Nmap para identificar capacidades e información del servicio POP3.|
|`telnet <target> 110`|Conecta al servicio POP3 (sin cifrar) usando telnet.|
|`openssl s_client -connect <target>:995`|Conecta al servicio POP3S (cifrado) usando SSL/TLS.|

**Nota:** si se tienen problemas para interactuar con IMAP desde la línea de comandos, considerar usar el cliente de correo `Evolution`.

---

## Artículos Relacionados

- [[Common POP3 Commands]]: Comandos que se deben utilizar al interactuar con el servicio manualmente.

***

## Overview

***POP3 (Post Office Protocol 3)* es un protocolo de recuperación de correo que permite a los usuarios descargar mensajes desde un servidor de correo a un dispositivo local.** A diferencia de IMAP, POP3 suele descargar y (por defecto) eliminar los correos del servidor, permitiendo la lectura offline en un único dispositivo.

**POP3 normalmente usa autenticación por *usuario y contraseña* y, en casos raros, puede permitir acceso anónimo.** La versión no cifrada usa el puerto TCP **110**, mientras que la versión cifrada (POP3S) utiliza el puerto TCP **995**.

---
