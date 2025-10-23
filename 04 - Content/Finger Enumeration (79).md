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
# Finger Enumeration (79)

***
## Cheatsheet

| **Acción**                                                  | **Descripción**                                                                                                      |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `nc -vn <IP> 79`                                            | Realiza banner grabbing del servicio Finger.                                                                         |
| `finger @<IP>`                                              | Lista todos los usuarios en el sistema objetivo (puede no funcionar siempre).                                        |
| `finger <USERNAME>@<IP>`                                    | Consulta la existencia de un usuario específico en el sistema objetivo.                                              |
| `msfconsole -x 'use auxiliary/scanner/finger/finger_users'` | Módulo de Metasploit para enumerar usuarios usando una wordlist (evitar la wordlist por defecto, es menos efectiva). |
**Wordlists recomendadas para el módulo de Metasploit**
- Nombres cortos: `/usr/share/wordlists/seclists/Usernames/Names/names.txt`
- Conjunto grande de usuarios: `/usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt`

---

## Descripción general

**El servicio *Finger* proporciona información sobre usuarios en un equipo o red**, típicamente incluyendo nombre de login, nombre completo y, a veces, información adicional como datos de contacto o ubicación. 

**Puede aprovecharse para enumerar usuarios locales en el host objetivo.**

**No obstante, Finger se considera en gran medida obsoleto y rara vez está presente en sistemas modernos**; aparece principalmente en sistemas antiguos o legados.

**Puerto por defecto:** TCP `79`.

---
