---
aliases:
  - "JWT Authentication Abuse"
  - "Tokens"
  - JSON Web Token Attacks
  - JWT Abuse
  - JWT Tampering
  - JWT Exploitation
tags:
  - type/vulnerability
  - vuln/jwt
  - vuln/auth-bypass
  - technique/credential-access
  - technique/privilege-escalation
  - asset/web-app
  - cred/jwt
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[JWT - Ataques al Algoritmo]]"
  - "[[JWT - Inyeccion en Headers]]"
  - "[[JWT - Manipulacion de Claims]]"
  - "[[JWT - Tooling y Brute Force]]"
  - "[[Authentication & Authorization Bypass]]"
  - "[[Cookies y Sesiones]]"
  - "[[Burp Suite]]"
---
# JWT Attacks

***

## Cheatsheet

### 🔓 Ataques al Algoritmo

````tabs
tab: **alg=none Bypass**
![[JWT - Ataques al Algoritmo#^jwt-alg-none]]

tab: **Algorithm Confusion (HS256 ↔ RS256)**
![[JWT - Ataques al Algoritmo#^jwt-alg-confusion]]

tab: **Weak Secret Bruteforce**
![[JWT - Ataques al Algoritmo#^jwt-alg-bruteforce]]
````

### 🔑 Inyección en Headers (Key Confusion)

````tabs
tab: **kid SQL Injection**
![[JWT - Inyeccion en Headers#^jwt-key-kid-sqli]]

tab: **kid Path Traversal**
![[JWT - Inyeccion en Headers#^jwt-key-kid-path]]

tab: **jku Header Injection**
![[JWT - Inyeccion en Headers#^jwt-key-jku]]

tab: **jwk Header Injection**
![[JWT - Inyeccion en Headers#^jwt-key-jwk]]

tab: **x5u / x5c Injection**
![[JWT - Inyeccion en Headers#^jwt-key-x5u]]
````

### 🎯 Manipulación de Claims

````tabs
tab: **Privilege Escalation**
![[JWT - Manipulacion de Claims#^jwt-claims-privesc]]

tab: **Account Takeover**
![[JWT - Manipulacion de Claims#^jwt-claims-takeover]]

tab: **Bypass Temporal (exp/nbf/iat)**
![[JWT - Manipulacion de Claims#^jwt-claims-temporal]]

tab: **Bypass iss / aud**
![[JWT - Manipulacion de Claims#^jwt-claims-iss-aud]]
````

### 🛠️ Tooling y Brute Force

````tabs
tab: **jwt_tool (All-in-One)**
![[JWT - Tooling y Brute Force#^jwt-tool-jwttool]]

tab: **Hashcat HS256**
![[JWT - Tooling y Brute Force#^jwt-tool-hashcat]]

tab: **jwtcrack y John**
![[JWT - Tooling y Brute Force#^jwt-tool-jwtcrack]]
````

___

## Overview

**JSON Web Token (JWT)** = formato de token compacto firmado/cifrado para auth stateless. Estructura: `header.payload.signature` en base64url. Backends modernos (Node, Spring, Django REST, .NET, Go) lo usan como bearer token reemplazando sesiones server-side.

**Por qué JWT es target frecuente:**
- Backends a menudo confían en el contenido del token sin validar bien la firma.
- Implementaciones de libs históricamente buggy (alg=none default, key confusion).
- Headers `kid` / `jku` / `jwk` permiten controlar parcialmente cómo se valida — vector directo.
- Secrets HS256 débiles son comunes en deploys (`secret`, `change-me`, hardcoded).

### Estructura JWT

```
xxxxxxxxxxx.yyyyyyyyyyy.zzzzzzzzzzz
    HEADER     PAYLOAD    SIGNATURE
```

| Parte | Contenido |
|---|---|
| **Header** | `{"alg":"HS256","typ":"JWT","kid":"...","jku":"...","jwk":{...}}` |
| **Payload** | Claims: `sub`, `iss`, `aud`, `exp`, `iat`, `nbf`, + custom (`role`, `user_id`, etc) |
| **Signature** | HMAC(header.payload, secret) o RSA-Sign(header.payload, priv_key) |

### Algoritmos comunes

| Alg | Tipo | Vector primario |
|---|---|---|
| `HS256` / `HS384` / `HS512` | Symmetric (HMAC) | Bruteforce secret, alg confusion |
| `RS256` / `RS384` / `RS512` | Asymmetric (RSA) | Key confusion, jku/jwk inject |
| `ES256` / `ES384` / `ES512` | Asymmetric (ECDSA) | Nonce reuse, key confusion |
| `EdDSA` | Asymmetric (Ed25519) | Mismo que ES* |
| `none` | Sin firma | alg=none bypass directo |

### Libs históricamente vulnerables

| Lib | CVE | Vector |
|---|---|---|
| `jsonwebtoken` (Node) | CVE-2015-9235 | alg=none default |
| `python-jose` | CVE-2016-10555 | Key confusion HS/RS |
| `pyjwt` < 1.5 | — | alg=none acepta |
| `auth0/jwks-rsa` | CVE-2018-0114 | jku no valida origen |
| `node-jsonwebtoken` (Auth0) | CVE-2022-23529 | RCE via verify() con keyType inválido |

___

## Workflow de explotación

```
1. Identificar JWT en request (Authorization, Cookie, body, storage).
2. Decodificar header + payload (sin verificar firma).
3. Identificar:
   - alg (HS256 / RS256 / none)
   - kid / jku / jwk / x5u en header
   - claims sensibles en payload (role, sub, exp, iss, aud)
4. Probar ataques en orden de menor esfuerzo:
   a. alg=none
   b. Algorithm confusion RS256→HS256 (si tenés pública)
   c. Bruteforce HS256 (si secret corto)
   d. kid SQLi / path traversal (si kid presente)
   e. jku / jwk / x5u inject (si headers presentes)
5. Modificar claims target (privilege escalation / takeover).
6. Re-firmar con secret/key derivado.
7. Validar autenticado al endpoint privilegiado.
```

___

## Detección rápida

### Indicadores en código backend

- Llamadas a `jwt.decode()` sin pasar `algorithms=['HS256']` (acepta cualquier alg).
- Endpoint `/.well-known/jwks.json` o `/.well-known/openid-configuration`.
- Backend hace HTTP fetch a URL del header (`jku`, `x5u`).
- Lookup en DB por `kid` sin parametrizar (SQLi).
- File read por `kid` sin sanitizar (path traversal).

### Probes mínimos

```bash
# 1. Detectar JWT en historial Burp
grep -E 'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' burp.log

# 2. Decodear rápido
TOKEN="eyJhbGciOi..."
echo $TOKEN | cut -d. -f1 | base64 -d 2>/dev/null | jq
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq

# 3. Probe alg=none
python3 jwt_tool.py $TOKEN -X a

# 4. Probe playbook completo
python3 jwt_tool.py $TOKEN -M pb -t https://target/api/profile -rh "Authorization: Bearer $TOKEN"
```

### Tooling

```bash
# jwt_tool — análisis + exploit
git clone https://github.com/ticarpi/jwt_tool

# Burp extensions
# - JSON Web Tokens (Burp store)
# - JWT Editor (Burp store)

# CLI alternativas
npm install -g jwt-cli              # decode + sign rápido
pip install pyjwt                   # forge programático
```

___

## Impacto

- **Account takeover** — forge token impersonando otro user vía claim manipulation.
- **Privilege escalation** — `role:user` → `role:admin` con re-firma.
- **Auth bypass total** — alg=none / weak secret / key confusion permite forge sin saber secret.
- **Persistencia** — extender `exp` a años en el futuro.
- **Lateral entre tenants** — multi-tenant apps con `tenant_id` en payload.
- **SSRF** — `jku` / `x5u` apuntando a interno fetcha URL del backend.
- **RCE** — combinado con vulns en lib (CVE-2022-23529 en jsonwebtoken).

___

## Mitigación (defender)

- **Whitelist de algoritmos**: `jwt.verify(token, key, {algorithms: ['RS256']})` — nunca aceptar `none` o lista vacía.
- **Validar issuer y audience**: `iss` y `aud` con string match exacto contra trusted list.
- **Validar firma contra clave correcta**: si esperás RS256, NO usar pública como secret HMAC.
- **No confiar en `jku` / `x5u` controlados por user**: hardcodear URL JWKS o whitelistear hosts.
- **Validar `kid` como ID opaco**: parametrizar query DB, NO concatenar; NO usar `kid` como path.
- **Secret HS256 ≥ 32 bytes random**: no defaults, no hardcoded, rotar periódicamente.
- **`exp` corto** (15-60 min) + refresh tokens stateful en DB.
- **`jti` con tracking**: blacklist tokens revocados.
- **Clock skew tolerance ≤ 60s**.
- **No firmar y cifrar con la misma key**: separar.

___

## Para entender JWT

**JWT vs sessions tradicionales:**

| | **Session cookie** | **JWT** |
|---|---|---|
| Estado | Server-side (DB / Redis) | Cliente (token autocontenido) |
| Revocación | Borrar de DB | Esperar `exp` o blacklist (jti) |
| Tamaño | ~40 bytes | 200-2000 bytes |
| Validación | Lookup en store | Verify firma local |
| Vector | Session hijack / fixation | Forge / tamper / weak secret |

**Por qué fallan tanto:**

1. **Confianza en el contenido** — devs olvidan que `payload` es **base64, no encriptado**. Quien tiene el token lo lee.
2. **Confianza en `alg`** — algunos libs eligen método de validación según `alg` declarado. Atacante controla `alg`.
3. **Confianza en headers** — `kid`/`jku`/`jwk` son atributos del token. Backend que los usa sin validar = forge.
4. **Defaults inseguros históricos** — versiones viejas de libs con `alg=none` enabled by default.

**JWT vs JWE:**
- JWT firmado (JWS) — contenido visible, firma protege integridad.
- JWE encriptado — contenido cifrado. Mucho menos común. No confundir.

___

## Recursos

- [PortSwigger - JWT Attacks](https://portswigger.net/web-security/jwt) — labs y conceptos.
- [PayloadsAllTheThings - JWT](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/JSON%20Web%20Token) — payloads.
- [HackTricks - JWT](https://book.hacktricks.xyz/pentesting-web/hacking-jwt-json-web-tokens) — referencia exhaustiva.
- [jwt_tool wiki](https://github.com/ticarpi/jwt_tool/wiki) — docs oficial de la herramienta.
- [RFC 7519 - JWT](https://datatracker.ietf.org/doc/html/rfc7519) — spec original.
- [RFC 8725 - JWT BCP](https://datatracker.ietf.org/doc/html/rfc8725) — best current practices.
- [Auth0 - JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook) — guía completa.
- [jwt.io](https://jwt.io) — debugger online + libs por lenguaje.

***
