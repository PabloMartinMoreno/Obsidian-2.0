---
aliases:
  - JWT Detection
  - JWT Recon
  - JWT Identification
tags:
  - type/technique
  - vuln/jwt
  - technique/discovery
  - asset/web-app
  - cred/jwt
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[JWT Attacks]]'
---
# JWT - Detección y Reconocimiento

***

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

___

## Decodificación y Análisis

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Decode header rápido | `echo "eyJhbGciOi..." \| cut -d. -f1 \| base64 -d` | Padding puede faltar — agregar `==`. |
| Decode payload | `echo "eyJhbGciOi..." \| cut -d. -f2 \| base64 -d` | Claims en JSON. |
| Decode con padding fix | `awk -F. '{print $2}' \| base64 -d 2>/dev/null` | Tolerante a padding. |
| jwt_tool decode | `python3 jwt_tool.py <token>` | Decode + análisis automático. |
| jwt.io | Pegar token en https://jwt.io | Visualización + verificación si tenés secret. |
| pyjwt local | `python3 -c "import jwt; print(jwt.decode('TOKEN', options={'verify_signature':False}))"` | Sin verificar firma. |
| Decode con jq | `cut -d. -f2 \| base64 -d \| jq .` | Pretty print. |
| Identificar `alg` | `cut -d. -f1 \| base64 -d \| jq .alg` | Algoritmo declarado: HS256 / RS256 / none / etc. |
| Identificar `kid` | `cut -d. -f1 \| base64 -d \| jq .kid` | Key ID — vector inyección. |
| Identificar `jku` / `x5u` | `cut -d. -f1 \| base64 -d \| jq '.jku // .x5u'` | URL externa de claves. |
| Identificar `jwk` | `cut -d. -f1 \| base64 -d \| jq .jwk` | Clave pública embebida en header. |
| Listar claims sensibles | `cut -d. -f2 \| base64 -d \| jq 'keys'` | Buscar `role`, `admin`, `sub`, `user_id`, `iss`, `exp`. |
| Verificar expiración | `cut -d. -f2 \| base64 -d \| jq '.exp \| todate'` | Si exp pasó → backend debe rechazar (verificar). |
| Detectar issuer | `cut -d. -f2 \| base64 -d \| jq .iss` | Útil para confusion attacks multi-tenant. |
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

***
