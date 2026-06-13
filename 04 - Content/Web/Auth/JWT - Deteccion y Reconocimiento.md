---
aliases:
  - JWT Detection
  - JWT Recon
  - JWT Identification
tags:
  - vuln/jwt
  - technique/discovery
  - asset/web-app
  - cred/jwt
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[JWT Attacks]]"
---
# JWT - Detección y Reconocimiento

---

## Identificación en Request

| **Ubicación** | **Cómo detectarlo** | **Ejemplo** |
|:---:|:---:|:---:|
| `Authorization: Bearer` | Header HTTP estándar OAuth2/JWT | `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...` |
| Cookie de sesión | Cookie con valor empezando en `eyJ` | `session=eyJhbGciOiJIUzI1NiIs...` |
| Custom header | Header propietario | `X-Auth-Token: eyJ...` / `X-API-Token: eyJ...` |
| Query string | Param URL (anti-patrón pero existe) | `?token=eyJhbGciOi...` |
| Request body | JSON / form-urlencoded | `{"token":"eyJ..."}` |
| LocalStorage / SessionStorage | Cliente lado JS | `localStorage.getItem('jwt')` en DevTools. |
| WebSocket subprotocol | Conexión WS con auth en sub-protocol | `Sec-WebSocket-Protocol: jwt, eyJ...` |
| OAuth2 implicit/PKCE redirect | Fragment URL post-auth | `#id_token=eyJ...&access_token=eyJ...` |
| Identificar JWT por shape | 3 segmentos base64url separados por `.` | `eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` |
| Burp regex search | Buscar tokens en historial | `eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+` |
^jwt-detect-request

---

## Decodificación y Análisis

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `echo "eyJhbGciOi..." \| cut -d. -f1 \| base64 -d` | Decode header rápido | Padding puede faltar — agregar `==`. |
| `echo "eyJhbGciOi..." \| cut -d. -f2 \| base64 -d` | Decode payload | Claims en JSON. |
| `awk -F. '{print $2}' \| base64 -d 2>/dev/null` | Decode con padding fix | Tolerante a padding. |
| `python3 jwt_tool.py <token>` | jwt_tool decode | Decode + análisis automático. |
| jwt.io | Pegar token en https://jwt.io | Visualización + verificación si tenés secret. |
| `python3 -c "import jwt; print(jwt.decode('TOKEN', options={'verify_signature':False}))"` | pyjwt local | Sin verificar firma. |
| `cut -d. -f2 \| base64 -d \| jq .` | Decode con jq | Pretty print. |
| `cut -d. -f1 \| base64 -d \| jq .alg` | Identificar `alg` | Algoritmo declarado: HS256 / RS256 / none / etc. |
| `cut -d. -f1 \| base64 -d \| jq .kid` | Identificar `kid` | Key ID — vector inyección. |
| `cut -d. -f1 \| base64 -d \| jq '.jku // .x5u'` | Identificar `jku` / `x5u` | URL externa de claves. |
| `cut -d. -f1 \| base64 -d \| jq .jwk` | Identificar `jwk` | Clave pública embebida en header. |
| `cut -d. -f2 \| base64 -d \| jq 'keys'` | Listar claims sensibles | Buscar `role`, `admin`, `sub`, `user_id`, `iss`, `exp`. |
| `cut -d. -f2 \| base64 -d \| jq '.exp \| todate'` | Verificar expiración | Si exp pasó → backend debe rechazar (verificar). |
| `cut -d. -f2 \| base64 -d \| jq .iss` | Detectar issuer | Útil para confusion attacks multi-tenant. |
^jwt-detect-decode

### Estructura JWT estándar

```
header.payload.signature
   |       |        |
   |       |        +-- HMAC / RSA / ECDSA / ninguno (alg=none)
   |       +-- JSON con claims (sub, iss, aud, exp, custom)
   +-- JSON con alg, typ, kid, jku, jwk, x5u, x5c
```

Los segmentos están en **base64url** (no base64 estándar — usa `-` y `_` en vez de `+` y `/`, sin `=` padding).

---
