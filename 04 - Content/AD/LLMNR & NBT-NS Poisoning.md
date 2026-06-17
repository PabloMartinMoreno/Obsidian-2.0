---
aliases:
  - "Stealing NetNTLMv2 hash"
  - "Net-NTLMv2"
  - "Net-NTLMv2 Hash"
  - "NTLMv2"
  - "SMB Authentication Leak"
  - "SCF Malicious File"
  - LLMNR Poisoning
  - NBT-NS Poisoning
  - mDNS Poisoning
  - Name Resolution Poisoning
tags:
  - technique/credential-access
  - technique/initial-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Credential Harvesting]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[LLMNR Poisoning - Captura]]"
  - "[[LLMNR Poisoning - Cracking y Relay]]"
  - "[[LLMNR Poisoning - mitm6 y Tooling]]"
  - "[[Responder]]"
  - "[[NTLM Relay]]"
---
# LLMNR & NBT-NS Poisoning

Cuando un host Windows resuelve un nombre que **no está en DNS**, hace fallback a **LLMNR (UDP 5355)** → **NBT-NS (UDP 137)** → **mDNS (UDP 5353)**. Cualquier host de la VLAN puede responder "yo soy ese nombre" → la víctima conecta y envía su **Net-NTLMv2 hash** al atacante. El hash se crackea offline o se relaya en tiempo real.

---

## Cheatsheet

### 1. Captura

````tabs
tab: **Responder (Linux)**
![[LLMNR Poisoning - Captura#^llmnr-capture-responder]]

tab: **Inveigh (Windows)**
![[LLMNR Poisoning - Captura#^llmnr-capture-inveigh]]
````

### 2. Cracking y Relay

````tabs
tab: **Crackear Net-NTLMv2**
![[LLMNR Poisoning - Cracking y Relay#^llmnr-crack]]

tab: **Relay (no crackeable)**
![[LLMNR Poisoning - Cracking y Relay#^llmnr-relay]]
````

### 3. mitm6 y Tooling

````tabs
tab: **mitm6 (IPv6)**
![[LLMNR Poisoning - mitm6 y Tooling#^llmnr-mitm6]]

tab: **Forzar Resoluciones / Tools**
![[LLMNR Poisoning - mitm6 y Tooling#^llmnr-tools]]
````

---

## Overview

**Requisitos:** Layer-2 al segmento víctima; LLMNR/NBT-NS/mDNS no deshabilitados; puerto 445 libre (Responder bindea SMB). El hash es crackeable offline aunque el target tenga SMB signing; para **relay** SMB hace falta signing off.

**Vectores típicos** de queries fallidas: typo de share (`\\FILESERVR`), WPAD auto-discovery, recursos desconectados que scripts de logon siguen buscando, configs obsoletos de impresoras/shares.

**Resultado:** Net-NTLMv2 → crack offline (`hashcat -m 5600`) o **relay** directo ([[NTLM Relay]]).

> [!tip] 2025: mitm6 > LLMNR
> Muchos entornos ya deshabilitan LLMNR/NBT-NS por GPO. **mitm6** (IPv6 DHCP poison) funciona donde LLMNR no, porque IPv6 casi siempre está habilitado y sin configurar.

## Detección y Mitigación

- **Disable LLMNR** por GPO (DNS Client → Turn off multicast name resolution). **Disable NBT-NS** por NIC (script). **Disable WPAD**.
- **SMB signing required** + **LDAP channel binding** → cierran el relay.
- **mitm6:** deshabilitar IPv6 si no se usa, o preferir IPv4.
- Monitorear: challenge default `1122334455667788` en PCAP, burst de UDP 5355/137 desde un host.

---

## Recursos

- [Responder](https://github.com/lgandx/Responder) · [Inveigh](https://github.com/Kevin-Robertson/Inveigh) · [mitm6](https://github.com/dirkjanm/mitm6)
- [HackTricks — LLMNR/NBT-NS](https://book.hacktricks.xyz/generic-methodologies-and-resources/pentesting-network/spoofing-llmnr-nbt-ns-mdns-dns-and-wpad-and-relay-attacks)
