---
aliases:
  - NTLMRelay
  - Net-NTLM Relay
  - SMB Net-NTLM Relay
  - NTLM Relay Attack
tags:
  - technique/credential-access
  - technique/lateral-movement
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[NTLM Relay - Captura de Auth]]"
  - "[[NTLM Relay - Relay Targets]]"
  - "[[NTLM Relay - Bypasses y OpSec]]"
  - "[[Impacket Toolkit]]"
  - "[[Responder]]"
  - "[[AD CS Abuse]]"
---
# NTLM Relay

La autenticación NTLM **no está atada al destino**: el challenge/response de una víctima puede **relayarse** a otro host. Si el destino acepta NTLM, no exige signing/EPA, y la víctima tiene privilegios ahí → el atacante actúa como la víctima sin conocer su password. Es uno de los caminos más fiables de un usuario sin privilegios a DA.

---

## Cheatsheet

### 1. Captura de Auth

````tabs
tab: **LLMNR/NBT-NS Poisoning**
![[NTLM Relay - Captura de Auth#^ntlmrelay-capture-llmnr]]

tab: **Coerción**
![[NTLM Relay - Captura de Auth#^ntlmrelay-capture-coerce]]

tab: **Intranet Tricks**
![[NTLM Relay - Captura de Auth#^ntlmrelay-capture-intranet]]

tab: **WPAD / IPv6 (mitm6)**
![[NTLM Relay - Captura de Auth#^ntlmrelay-capture-mitm6]]
````

### 2. Relay Targets

````tabs
tab: **→ SMB**
![[NTLM Relay - Relay Targets#^ntlmrelay-smb]]

tab: **→ LDAP(S) (RBCD/Shadow)**
![[NTLM Relay - Relay Targets#^ntlmrelay-ldap]]

tab: **→ MSSQL / HTTP / WinRM**
![[NTLM Relay - Relay Targets#^ntlmrelay-other]]
````

### 3. Bypasses y OpSec

````tabs
tab: **Bypass de Protecciones**
![[NTLM Relay - Bypasses y OpSec#^ntlmrelay-bypass]]

tab: **OpSec / Detección**
![[NTLM Relay - Bypasses y OpSec#^ntlmrelay-opsec]]
````

---

## Overview

**Requisitos:** (1) posición MITM sobre la auth de la víctima (LLMNR poisoning, coerción, link malicioso); (2) destino sin SMB/LDAP signing ni EPA; (3) víctima con permisos efectivos en el destino.

| Target | Resultado | Precondición |
|:---|:---|:---|
| **SMB** | Shell / dump SAM | Signing off + victim local admin |
| **LDAP(S)** | RBCD / Shadow Creds → impersonar DA | Victim = computer account |
| **MSSQL** | `xp_cmdshell` RCE | Victim con acceso al SQL |
| **HTTP ADCS (ESC8)** | Cert de `DC$` → DCSync | Web enrollment sin EPA |
| **RPC (ESC11)** | Cert vía ICPR | RPC sin encryption |

**Chains típicas:** `PetitPotam → ntlmrelayx → ADCS HTTP` (hash de DC$ → DA); `mitm6 → ntlmrelayx → LDAPS delegate` (RBCD → impersonar DA); `Responder → ntlmrelayx → SMB` (shell en host víctima).

> [!warning] Signing
> SMB signing required cierra el relay a SMB pero **no** a LDAP/HTTP/MSSQL. La defensa completa exige signing + channel binding + EPA en todos los servicios.

---

## Recursos

- [Impacket ntlmrelayx](https://github.com/fortra/impacket/blob/master/examples/ntlmrelayx.py)
- [HackTricks — NTLM Relay](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ntlm-relay)
- [The Hacker Recipes — Relay](https://www.thehacker.recipes/ad/movement/ntlm/relay)
