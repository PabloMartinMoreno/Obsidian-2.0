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
- [[searchsploit]] — buscar PoCs offline por CVE/keyword.

## 2. Defense evasion en el endpoint

- [[AMSI Bypasses]] — desactivar/corromper AMSI en-process (PowerShell, .NET Assembly.Load).
- [[evil-winrm]] — Invoke-Binary para loader reflectivo sin tocar disk.

## 3. AD-aware payloads

- [[Mimikatz Cheatsheet]] — credential extraction.
- [[Rubeus]] — Kerberos abuse (kerberoast, PtT, S4U).
- [[Certipy]] — ADCS abuse.
- [[PowerView]] — AD enum + ACL abuse.

## 4. Toolkits

- [[Impacket Toolkit]] — Python clients (psexec, wmiexec, secretsdump, ntlmrelayx).
- [[netexec]] — successor de CrackMapExec.
- [[Metasploit]] — framework + msfvenom para shellcode.

***
