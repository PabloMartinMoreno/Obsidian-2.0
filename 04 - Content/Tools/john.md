---
aliases:
  - John the Ripper
  - JtR
  - john
tags:
  - tool/john
  - technique/credential-access
  - cred/password-cracking
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Credential Access]]"
tertiary categories:
  - "[[Password Cracking]]"
kind: Tool
linked:
  - "[[hashcat]]"
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[Responder]]"
---
# john (JtR)

---

## Overview

Cracker CPU-based. Complementa [[hashcat]] (GPU). Ventajas: **format auto-detection**, **`*2john` helpers** (ssh, zip, pdf, kdbx, office, pcap, jks, keychain...), potente single-crack mode, rules compactas.

Install: `apt install john` → version core. Para modes avanzados y formatos modernos: **Jumbo** (`apt install john-jumbo` o build desde fuente).

> Regla: si tenés GPU → hashcat. Si no hay GPU o el formato no está en hashcat → john. Mucho de `*2john` es exclusivo de john.

---

## Sintaxis base

```bash
john [options] <hashfile>
john --list=formats | less                    # formatos soportados
john --show <hashfile>                        # muestra ya crackeados
john --show --format=<fmt> <hashfile>
```

El estado se guarda en `~/.john/john.pot`. Para empezar de cero: `rm ~/.john/john.pot`.

---

## Formatos clave

| Formato john | Equivalente hashcat | Uso |
|---|---|---|
| `raw-md5` | `-m 0` | md5($pass) |
| `raw-sha1` / `raw-sha256` | `-m 100/1400` | |
| `NT` | `-m 1000` | NT hash (LSA/SAM) |
| `LM` | `-m 3000` | LM (legacy) |
| `netntlmv2` | `-m 5600` | Responder capture |
| `netntlm` | `-m 5500` | NetNTLMv1 |
| `krb5tgs` | `-m 13100` | Kerberoast RC4 |
| `krb5tgs-aes256` | `-m 19700` | Kerberoast AES256 |
| `krb5asrep` | `-m 18200` | AS-REP Roast RC4 |
| `des-crypt` | `-m 1500` | /etc/shadow classic |
| `md5crypt` | `-m 500` | $1$... |
| `sha512crypt` | `-m 1800` | $6$... Linux shadow |
| `bcrypt` | `-m 3200` | $2a$ |
| `pbkdf2-hmac-sha256` | `-m 10900` | iOS, generic |
| `phpass` | `-m 400` | WordPress/Joomla |
| `mssql` / `mssql05` / `mssql12` | 131/132/1731 | |
| `mysql-sha1` | `-m 300` | |
| `racf` | — | Mainframe |
| `zip` / `pkzip` | 13600 / 17200 | |
| `rar5` | 13000 | |
| `office` | 9400-9800 | Word/Excel/PPT |
| `pdf` | 10400-10700 | |
| `keychain` | 23100 | macOS |
| `keepass` | 13400 | .kdbx |
| `ssh` | 22911 | OpenSSH private key |

Forzar formato: `--format=<name>`.

---

## Modes

### Single crack (default)

```bash
john hashes.txt
```

Prueba variantes del username como password (fast, muy efectivo contra hashes con GECOS).

### Wordlist

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
john --wordlist=rockyou.txt --rules hashes.txt              # rules del .conf
john --wordlist=rockyou.txt --rules=Jumbo hashes.txt
john --wordlist=rockyou.txt --rules=All hashes.txt
```

### Incremental (brute force)

```bash
john --incremental hashes.txt
john --incremental=Alnum hashes.txt
john --incremental=Digits hashes.txt
john --incremental=ASCII --min-length=8 --max-length=10 hashes.txt
```

### Mask

```bash
john --mask='?u?l?l?l?l?d?d?d' hashes.txt        # Lower upper, 4 lower, 3 digits
john --mask='?w?d?d?d' --wordlist=rockyou.txt hashes.txt   # hybrid: word + 3 digits
```

### External mode (modos definidos en `.conf`)

```bash
john --external=Filter_Alpha hashes.txt
```

---

## Rules

Editar `/etc/john/john.conf` o pasar wordlist custom. Rules comunes:

```
[List.Rules:best64]
[List.Rules:Jumbo]            # 15k+ rules
[List.Rules:KoreLogic]        # enterprise-realistic
[List.Rules:Hashcat]          # compat hashcat rules
```

Aplicar:

```bash
john --wordlist=rockyou.txt --rules=best64 hashes.txt
```

Stack de rules:

```bash
john --wordlist=rockyou.txt --rules=Jumbo --rules-stack=KoreLogic hashes.txt
```

---

## `*2john` helpers (Jumbo)

### SSH key

```bash
ssh2john id_rsa > id_rsa.john
john --wordlist=rockyou.txt id_rsa.john
```

### ZIP / RAR

```bash
zip2john backup.zip > backup.john
rar2john archive.rar > archive.john
john --wordlist=rockyou.txt backup.john
```

### Office (docx/xlsx/pptx)

```bash
office2john doc.docx > doc.john
```

### PDF

```bash
pdf2john.pl secret.pdf > secret.john
# o pdf2john.py
```

### KeePass

```bash
keepass2john vault.kdbx > vault.john
keepass2john -k keyfile vault.kdbx > vault.john    # con keyfile
```

### 7z

```bash
7z2john archive.7z > archive.john
```

### macOS keychain / dmg

```bash
keychain2john login.keychain > login.john
dmg2john image.dmg > image.john
```

### Bitlocker

```bash
bitlocker2john -i /dev/sda1 > bl.john
```

### Linux shadow

```bash
unshadow /etc/passwd /etc/shadow > unshadow.txt
john unshadow.txt                                  # single mode auto
```

### Wifi

```bash
hccap2john capture.hccapx > capture.john           # WPA hccapx
```

### iOS backup

```bash
itunes_backup2john.pl Manifest.plist > backup.john
```

### Other

```bash
pwsafe2john vault.psafe3 > pwsafe.john
ldif2john.pl dump.ldif > ldif.john                 # LDAP attr hashes
1password2john.py 1password.opvault > 1p.john
```

---

## Control + checkpoint

```bash
john --status                    # progreso sesión actual
john --restore                   # reanudar session=john (default)
john --session=brute hashes.txt  # session nombrada
john --restore=brute
```

Parar limpio: `q`/`Ctrl+C` (graba pot + state).

### Tiempo límite

```bash
john --wordlist=rockyou.txt --max-run-time=3600 hashes.txt    # 1h
```

---

## Workflows frecuentes

### Linux privesc: shadow

```bash
unshadow /etc/passwd /etc/shadow > unshadow.txt
john unshadow.txt
john --show unshadow.txt
```

### SSH key con passphrase

```bash
ssh2john id_rsa > k.john
john --wordlist=rockyou.txt k.john
```

### Kerberoast (RC4 SPN hashes)

```bash
john --format=krb5tgs --wordlist=rockyou.txt spns.hashes
```

### AS-REP Roast

```bash
john --format=krb5asrep --wordlist=rockyou.txt asrep.hashes
```

### Net-NTLMv2 from Responder

```bash
john --format=netntlmv2 --wordlist=rockyou.txt responder.hashes
```

### ZIP con keyfile desconocido

```bash
zip2john secret.zip > s.john
john --wordlist=rockyou.txt --rules=Jumbo s.john
```

---

## Benchmark

```bash
john --test=10                   # benchmark todos formatos (10s c/u)
john --test --format=NT
```

---

## Configuración

`/etc/john/john.conf` — reglas, external modes, defaults. Override per-session:

```
--config=my.conf
```

Custom wordlist + rules:

```ini
[List.Rules:MyRules]
# Reglas syntax: hashcat-compat mode (mostly)
>4                      # Reject if len <= 4
c                       # Capitalize
sa@                     # Replace a with @
$1$2$3                  # Append 1,2,3
```

---

## Tips

- `--show` al final para export de crackeados: `john --show hashes.txt > cracked.txt`.
- `--pot=custom.pot` — pot separado por engagement (no contamina ~/.john/john.pot).
- `--fork=N` — paralelismo entre N procesos (hasta # cores).
- `--format=...` acepta wildcards: `--format=crypt`, `--format=raw-*`.
- `--loopback` — usa passwords ya crackeados como wordlist base.
- `--prince` (Jumbo) — PRINCE attack, combina palabras de wordlist en chains.
- `--markov` — markov chains con stats de tasas.

---

## Referencias

- Jumbo fork: https://github.com/openwall/john
- Wiki: https://openwall.com/john/doc/
- `*2john`: `ls /usr/share/john/*2john*` (Jumbo)
