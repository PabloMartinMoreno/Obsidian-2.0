---
aliases:
  - Authorization Bypass
  - BFLA
  - Privilege Escalation Web
  - RBAC Bypass
tags:
  - type/cheatsheet
  - vuln/auth-bypass
  - technique/privilege-escalation
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Authentication & Authorization Bypass]]'
  - '[[BOLA - IDOR]]'
  - '[[Mass Assignment]]'
---
# Auth Bypass - Bypass de Autorización

***

## IDOR / BOLA (Object-Level)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Sequential IDs | `/api/users/1` → `/api/users/2` (otro user) | Standard IDOR. |
| UUID predictable | UUIDv1 contiene timestamp | Predict next. |
| Numeric in body | `{"user_id": 1}` → modify a 2 | Body field. |
| Parameter manipulation | `?account_id=42` change | Query string. |
| Cookie value | If cookie tied to ID without server check | Cookie tampering. |
| GraphQL global ID | `node(id:"VXNlcjox")` decoded → forge | Relay-style. |
| Path segment | `/team/X/admin` → `/team/Y/admin` | Multi-tenant. |
| Object reference en form | Hidden field con object ID | Form tampering. |
| WebSocket message ID | WS payload con object ID | Real-time. |
| Internal IDs leaked en response | Response includes other user IDs | Recon source. |
| Bulk endpoints | `?ids=[1,2,3,...,1000]` | Bulk IDOR. |
| API filter | `GET /api/users?manager_id=1` revealing | Disclosure. |
| Combine con sequential prediction | Loop IDs + check 200 vs 403 | Bulk enum. |
| Check function-level + object-level | Owner check missing | BOLA. |
| Combine con Mass Assignment | Update otro's profile | Compound. |
^auth-authz-idor

### Workflow IDOR

```bash
# 1. Identify sensitive endpoint
curl -H "Cookie: session=$MY_TOKEN" https://target/api/users/me
# Response: {id: 1337, email: "atacante@evil.com", ...}

# 2. Try other IDs
for id in 1 2 3 100 1000 9999; do
  curl -s -H "Cookie: session=$MY_TOKEN" "https://target/api/users/$id" | head
done

# Si returns other user data → IDOR confirmed
# Si returns 403 → owner check active
# Si combinado con Mass Assignment → modify other user
```

___

## Mass Assignment (Field-Level Privesc)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| isAdmin self-set | Body con `{"isAdmin": true}` | Direct privesc. |
| role | `{"role": "admin"}` | Variant. |
| permissions array | `{"permissions": ["*"]}` | Wildcard. |
| Combine con IDOR | IDOR + mass assign updates victim | High impact. |
| GraphQL mutation input | Input type incluye sensitive | Direct. |
| Hidden form fields | If form excluye admin, atacante adds | Backend trusts. |
| API DTO completo | Full DTO con admin flag injected | Standard. |
| Detect via Swagger / introspection | Schema discovery | Pre-explotación. |
| See also | `Mass Assignment` para detalle | Cross-ref. |
^auth-authz-mass-assign

___

## Path-Based Privesc

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Direct admin path | `/admin` accessible sin auth | Forced browsing. |
| Path traversal en authorized path | `/user/../admin` | Path normalization. |
| Hidden admin namespace | `/api/v2/admin` exists vs `/api/v1/admin` | Versioning. |
| Internal API exposure | `/internal/admin` reachable externally | Misconfig. |
| Method override | POST `/users` con `_method=DELETE` to admin endpoint | Verb tampering. |
| GraphQL alias to admin field | Alias requested admin query | Bypass per-field check. |
| Path segment trust | If `/admin` checked but `/admin/sub` not | Subpath bypass. |
| Encoded path | `%2Fadmin` o `%2e%2e%2fadmin` | Encoding. |
| HTTP/2 :path injection | H2 pseudo-header | H2 specific. |
| Combine con Open Redirect | Redirect chain to admin | Chain. |
| Combine con HRS | Smuggle admin request | Compound. |
^auth-authz-path

___

## Role Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Cookie role tampering | Cookie con `role=admin` (cleartext) | Direct. |
| JWT claim forgery | Modify JWT con `role:admin` | Combine con JWT bypass. |
| Session role override | App stores role en client-side session | Tampering. |
| Hidden form role field | Modify hidden role field | Form. |
| API role change | `PUT /users/me/role` con admin | Direct API. |
| OAuth scope injection | Manipulate scope claim | OAuth. |
| Active role switching | If app permite role switch (legit feature) | Abuse. |
| Tenant-level admin | `tenant_id=victim` en multi-tenant | Cross-tenant. |
| Group membership injection | Add self to admin group via request | Combine mass assign. |
| LDAP DN modify | DN injection sets group | Combo LDAP. |
| Privilege inheritance | Inherit privileges via membership chain | Logic flaw. |
| Combine con audit log forge | Modify role + cover tracks | Stealth. |
^auth-authz-role

___

## Verb-Based Authorization Gaps (BFLA)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Backend has function-level auth on certain verbs but not all | OWASP API4 BFLA. |
| GET allowed, POST not checked | `POST /admin/users` sin auth check | Standard BFLA. |
| GET checked, PATCH not | `PATCH` modify other resources | Variant. |
| OPTIONS unprotected | OPTIONS reveals methods | Recon. |
| HEAD unprotected | HEAD returns headers w/o body | Disclosure. |
| Custom methods | App-specific verbs | Edge. |
| Method override headers | `X-HTTP-Method-Override: DELETE` | Verb conversion. |
| Form `_method` field | `_method=DELETE` | Rails / Symfony. |
| Bypass via case | `Get /admin` (some servers strict) | Edge. |
| GraphQL `mutation` instead `query` | Mutations less protected | GraphQL specific. |
| WebSocket message types | WS sends typed messages | Auth per-type missing. |
| Bulk endpoints | `POST /users/bulk` con admin actions | Edge. |
| Combine con Mass Assignment | Verb + payload | Compound. |
| Common API mistake | App uses middleware on GET, missing on PATCH | Common bug. |
| OWASP API Top 10 | API4 BFLA / API5 BOLA | Reference. |
^auth-authz-bfla

***
