---
aliases:
  - "Hash NTLM"
  - "Cisco Password Cracker (password7)"
  - "Hash-Identifier"
  - "Identifying Hash Formats"
  - "Cracking with Hashcat"
  - "Cracking with John the Ripper"
  - "Cracking with Ophcrack"
  - "Cracking Archives & Documents"
  - "Cracking SSH Keys & Keyfiles"
  - "Cracking Wireless Handshakes"
  - "Cracking Wallet Files"
  - "Online Cracking with Hydra"
  - "Online Cracking with Medusa"
  - "Wordlists Management"
  - "Mutating Wordlists with Rules"
  - "Generating Custom Wordlists"
  - "Password Cracking"
  - Hash Cracking
tags:
  - estado/completo
  - technique/credential-access
  - cred/password-cracking
kind: Technique
linked:
  - "[[hashcat]]"
  - "[[john]]"
---
# Cracking Hashes

> [!info]
> Recuperar texto plano desde hash via dictionary/brute-force/rule-based attacks. Pre-requisito: identificar algoritmo + obtener wordlist + tener hashes.

***

## Identificar hash

| Tool | Uso | Notas |
|---|---|---|
| `hashid <hash>` | Inferir algoritmo | múltiples candidatos |
| `hash-identifier` | Idem, interactivo | legacy |
| `name-that-hash` (`nth`) | Moderno, multi-algoritmo | mejor accuracy |

Longitud + formato dan pistas:
- 32 hex chars → MD5, NTLM
- 40 hex → SHA1, MySQL5
- 64 hex → SHA256
- `$2y$` → bcrypt
- `$6$` → SHA512crypt (Linux `/etc/shadow`)
- `$krb5tgs$23$*` → Kerberos TGS (Kerberoasting)
- `$krb5asrep$23$` → AS-REP Roasting
- `aad3b435...` → NTLM (Net-NTLMv1/v2)

***

## Hashcat — referencia rápida

```bash
# Modo basico: dict
hashcat -m <mode> -a 0 hashes.txt rockyou.txt

# Dict + rules
hashcat -m <mode> -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# Brute force
hashcat -m <mode> -a 3 hashes.txt ?a?a?a?a?a?a?a?a

# Hybrid (dict + mask)
hashcat -m <mode> -a 6 hashes.txt rockyou.txt ?d?d?d?d

# Show cracked
hashcat -m <mode> hashes.txt --show
```

Modos comunes:
| Mode | Hash |
|---|---|
| 0 | MD5 |
| 100 | SHA1 |
| 1000 | NTLM |
| 1800 | sha512crypt (Linux shadow) |
| 5500 | NetNTLMv1 |
| 5600 | NetNTLMv2 |
| 13100 | Kerberos 5 TGS-REP (Kerberoasting) |
| 18200 | Kerberos 5 AS-REP (AS-REP Roasting) |
| 22000 | WPA-PBKDF2-PMKID+EAPOL |
| 7300 | IPMI RAKP |

Ver [[hashcat]] para detalle.

***

## John the Ripper — referencia rápida

```bash
# Auto-detect format
john hashes.txt --wordlist=rockyou.txt

# Forzar formato
john --format=NT hashes.txt --wordlist=rockyou.txt

# Con rules
john --rules=Jumbo --wordlist=rockyou.txt hashes.txt

# Show cracked
john --show hashes.txt
```

Tools `*2john` para preparar hashes:
- `zip2john`, `rar2john`, `ssh2john`, `keepass2john`, `office2john`, `pdf2john`

Ver [[john]].

***

## Wordlists comunes

- `rockyou.txt` — clásico, ~14M entries
- `SecLists/Passwords/` — colección amplia
- `crackstation.txt` — 15GB, muy completo
- Custom: `cewl <url>` (palabras del sitio), `cupp` (perfiles)

***

## Reglas (mutations)

- `best64.rule` — top 64 muts probadas
- `dive.rule` — agresivas
- `OneRuleToRuleThemAll.rule` — combinada popular
- Custom rules: `wordlist + año`, `Capital + número`, etc.

***

## Optimización

- GPU: hashcat usa cuda/opencl. `--workload=4` para sesiones largas.
- Pause/resume: `--session=name --restore`.
- Distribución: `hashtopolis` para multi-host.

***

## Notas Relacionadas

- [[Pass-the-Hash]]
- [[Kerberoasting]]
- [[AS-REP Roasting]]
- [[LSASS Dumping]]
- [[NTDS.dit Extraction]]
