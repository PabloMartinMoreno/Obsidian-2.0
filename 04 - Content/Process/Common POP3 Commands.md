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
---
# Comandos POP3 Comunes

***

## Cheatsheet

| **Action**        | **Description**                                                           |
| ----------------- | ------------------------------------------------------------------------- |
| `USER <username>` | Identifies the user to the POP3 server.                                   |
| `PASS <password>` | Authenticates the user with the provided password.                        |
| `STAT`            | Requests the number of emails stored on the server.                       |
| `LIST`            | Retrieves the number and size of all emails on the server.                |
| `RETR <id>`       | Requests the server to deliver the email specified by ID.                 |
| `DELE <id>`       | Requests the server to delete the email specified by ID.                  |
| `CAPA`            | Requests the server to display its capabilities.                          |
| `RSET`            | Resets the state of the session, clearing any previous commands or flags. |
| `QUIT`            | Closes the connection with the POP3 server.                               |