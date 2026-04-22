---
aliases:
  - Payloads
  - Weaponization
tags:
  - type/moc/secondary
  - technique/execution
  - technique/defense-evasion
primary categories:
  - "[[Red Team]]"
type: Secondary Category
---
# [[Payload Engineering]]

***

## Overview

Desarrollo, entrega, y evasión de payloads — desde reverse shells hasta implants avanzados. Intersección con Defense Evasion cuando el payload necesita esquivar AV/EDR/AMSI.

***

## 1. Shells & loaders

- [[Reverse Shell]] — bind/reverse por OS (Linux/Windows/Python/PHP/etc).
- [[MSFVenom]] — generador multi-format (EXE/ELF/ASPX/HTA/DLL/PS1/shellcode).
- [[searchsploit]] — buscar PoCs offline por CVE/keyword.
- [[File Transfers]] — delivery de payloads + exfil de loot.

## 2. Defense evasion en el endpoint

- [[AMSI Bypasses]] — desactivar/corromper AMSI en-process (PowerShell, .NET Assembly.Load).
- [[evil-winrm]] — Invoke-Binary para loader reflectivo sin tocar disk.

## 3. Toolkits

- [[Metasploit]] — framework + msfvenom para shellcode.
- [[Impacket Toolkit]] — Python clients con payloads (psexec, wmiexec).

***
