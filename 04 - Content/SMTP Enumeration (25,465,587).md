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
  - "[[Common SMTP Commands]]"
  - "[[POP3 Enumeration (110, 995)]]"
  - "[[IMAP Enumeration (143, 993)]]"
---
# SMTP Enumeration (25,465,587)

***

## Cheatsheet


| **Acción**                                                                                                                                                                                                                    | **Descripción**                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sudo nmap -sC -sV -p25 -v <target>`                                                                                                                                                                                          | Usa Nmap para **fingerprint** del servidor de correo. Los scripts por defecto incluyen `smtp-commands`, que lista todos los comandos SMTP válidos que el servidor puede ejecutar.         |
| `telnet <target> 25`                                                                                                                                                                                                          | Conecta al servicio SMTP remoto usando telnet (interacción manual).                                                                                                                       |
| `sudo nmap -p25 --script smtp-open-relay -v <target>`                                                                                                                                                                         | Comprueba si el servidor de correo es un **open relay**.                                                                                                                                  |
| <br><br>`smtp-user-enum -M <mode> -U <wordlist> -t <target> -w <timeout-in-seconds> -v`                                                                                                                                       | Enumera posibles usuarios en el servidor de correo usando una wordlist. Este método puede ser poco fiable según la configuración del servidor. Para `mode` probá `VRFY`, `EXPN` y `RCPT`. |
| `swaks --server <target> --auth LOGIN --auth-user <user>@<domain> --auth-password <password> --from <user>@<domain> --to <victim>@<domain> --attach @<attachment-file> --header 'Subject: <subject>' --body '<body>'`<br><br> | Envía un correo usando `swaks`. <br><br>Si se necesita especificar un archivo como adjunto, usar `@` como prefijo.                                                                        |
**Wordlists recomendadas:**
- `/usr/share/wordlists/seclists/Usernames/top-usernames-shortlist.txt` (Corto, bueno para la primera ronda).
- `/usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt` (Muy largo).

*** 

## Artículos Relacionados

- [[Common SMTP Commands]]: comandos útiles para interactuar manualmente con el servicio.

***

## Overview

El **Simple Mail Transfer Protocol (SMTP)** es el protocolo principal para enviar correos por redes IP. Facilita la comunicación entre un cliente de correo y un servidor saliente, o directamente entre servidores SMTP.

SMTP se usa habitualmente junto con protocolos de recepción como [[POP3 Enumeration (110, 995)]] o [[IMAP Enumeration (143, 993)]] para recibir emails.

La mayoría de servidores modernos soportan **ESMTP** (Extended SMTP), que incluye características como `SMTP-Auth` para mejorar la seguridad.

**Los métodos de autenticación comunes en ESMTP incluyen:**
- `PLAIN` (usuario y contraseña potencialmente en claro, si no hay cifrado)
- `CRAM-MD5` (auth challenge-response)
- `LOGIN` (usuario/contraseña, normalmente sobre TLS/SSL)

Para cifrar las comunicaciones de correo se usan variantes como **SMTPS** (SSL/TLS).  
El puerto por defecto para SMTP es TCP **25**; los puertos seguros más usados son **465** y **587**.

***

## Diagrama

![[Pasted image 20251022140815.png]]

***

## Componentes del sistema de correo

- **Mail User Agent (MUA):** software cliente que usa el usuario para leer/enviar correos.
- **Mail Submission Agent (MSA):** intermediario entre MUA y MTA.
- **Mail Transfer Agent (MTA):** enruta correos entre servidores.
- **Mail Delivery Agent (MDA):** almacena el correo para el destinatario (recuperable via POP3/IMAP).

---
