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
  - "[[SMTP Enumeration (25,465,587)]]"
---
# Comandos Comunes de SMTP

***

## Cheatsheet

| **Acción**                                | **Descripción**                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH PLAIN <base64-encoded-credentials>` | Autentica al usuario enviando credenciales en texto claro, normalmente codificadas en Base64.                                                                     |
| `HELO <domain-name>`                      | Inicia la sesión identificando al cliente con su nombre de equipo (p. ej., `HELO example.com`).                                                                   |
| `EHLO <domain-name>`                      | Extiende `HELO` para indicar las capacidades del cliente (p. ej., `EHLO example.com`).                                                                            |
| `MAIL FROM:<email-address>`               | Especifica la dirección del remitente (p. ej., `MAIL FROM:<sender@example.com>`).                                                                                 |
| `RCPT TO:<email-address>`                 | Especifica la dirección del destinatario (p. ej., `RCPT TO:<recipient@example.com>`).                                                                             |
| `DATA`                                    | Comienza la transmisión del contenido del correo.                                                                                                                 |
| `RSET`                                    | Cancela la transmisión de correo actual manteniendo la conexión abierta.                                                                                          |
| `VRFY <email-address>`                    | Comprueba si un buzón existe para recibir mensajes (p. ej., `VRFY user@example.com`). Puede usarse para intentar enumerar usuarios mediante códigos de respuesta. |
| `EXPN <email-address>`                    | Verifica si un buzón o lista existe para recibir mensajes (p. ej., `EXPN user@example.com`), similar a `VRFY`.                                                    |
| `NOOP`                                    | Solicita una respuesta del servidor para mantener la conexión activa y evitar timeout.                                                                            |
| `QUIT`                                    | Finaliza la sesión con el servidor.                                                                                                                               |
