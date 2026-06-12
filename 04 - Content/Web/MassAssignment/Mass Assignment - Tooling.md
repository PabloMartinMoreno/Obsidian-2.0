---
aliases:
  - Mass Assignment Tooling
  - API Discovery
tags:
  - vuln/mass-assignment
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Mass Assignment]]"
  - "[[Burp Suite]]"
  - "[[Param Miner]]"
---
# Mass Assignment - Tooling

---

## Param Miner (Burp)

| **Herramienta / Acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "Param Miner" → Install | Setup extension | Primera vez. |
| Right-click request → "Guess JSON parameters" | Auto-discover JSON keys vía fuzzing | JSON body endpoints. |
| Right-click request → "Guess params" | Discover query string + body params | URL/form body. |
| Right-click request → "Guess headers" | Detecta unkeyed headers (cache poisoning combo) | Múlti-vector. |
| Param Miner → Settings → "Force cache miss" | Param discovery con cache busting | Cache-fronted apps. |
| Param Miner → "bonus features" → "Hostnames" + "JSON" + "params" | Ampliar coverage | Audit completo. |
| Param Miner → Custom wordlist (botón) | Append wordlist sensitive (isAdmin, role, etc) | Field discovery dirigido. |
| Output panel → "Param Miner" tab | Findings + reflection markers | Post-scan review. |
^ma-tool-paramminer

---

## Source Map / JS Bundle Review

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s https://target/static/js/main.js \| grep -oE 'sourceMappingURL=[^ ]+'` | Detecta source map URL | Webpack build con maps publicados. |
| `curl -s https://target/static/js/main.js.map -o main.js.map` | Bajar source map raw | Map disponible. |
| `npx sourcemapper -url https://target/static/js/main.js.map -output ./src` | Restore árbol de sources | Auto-extract. |
| `grep -rE 'isAdmin\|role\|tenant_id\|password_hash' src/` | Identificar fields sensibles en source | Post-extract. |
| `grep -rE 'interface User\|class User' src/` | TypeScript interfaces / classes | Schema disclosure. |
| `apktool d app.apk -o decompiled/` y `grep -r 'isAdmin' decompiled/` | Mobile app DTO fields | Mobile recon. |
| `jadx-gui app.apk` → search for DTO classes | UI-friendly Android decomp | Manual review. |
| Chrome DevTools → Sources → ver original | Manual source review | Live debug. |
^ma-tool-sourcemap

---

## API Documentation Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl https://target/swagger.json` | Swagger 2.0 schema | Path default Swagger. |
| `curl https://target/openapi.json` | OpenAPI 3.x schema | Path default OpenAPI. |
| `curl https://target/v2/api-docs` y `curl https://target/v3/api-docs` | Spring docs | Backend Java/Spring. |
| `curl https://target/api-docs` | Swagger UI default | Otra ruta común. |
| `curl https://target/.well-known/api-docs` | Discovery endpoint estándar | Modern apps. |
| `for p in /swagger.json /openapi.json /api-docs /docs /redoc /swagger-ui.html /v2/api-docs /v3/api-docs; do curl -s -o "$(basename $p)" "https://target$p"; done` | Bulk probe paths comunes | Discovery rápido. |
| `jq '.definitions \| keys' swagger.json` | Lista DTOs declarados | Post-download. |
| `jq '.definitions.User.properties \| keys' swagger.json` | Fields del modelo User | Identificar campos sensibles. |
| `jq '.paths \| to_entries[] \| select(.value.put or .value.patch) \| .key' openapi.json` | Endpoints con PUT/PATCH (MA targets) | Filter targets. |
| Browse `https://target/graphql/playground` o `/graphql/explorer` | GraphQL UI dev mode | Backend GraphQL. |
^ma-tool-apidocs

### Workflow API recon completo

```bash
# 1. Probe paths
for p in /swagger.json /openapi.json /api-docs /docs.json /v2/api-docs /v3/api-docs; do
  curl -s -o "$(basename $p)" "https://target$p" 2>/dev/null
  [ -s "$(basename $p)" ] && echo "[+] Found: $p"
done

# 2. Parse fields sensibles
jq -r '.definitions // .components.schemas | to_entries[] | "\(.key): \(.value.properties | keys | join(\", \"))"' swagger.json | grep -iE 'admin|role|verified|tenant|owner|password|secret'

# 3. Lista endpoints PUT/PATCH (vector primario MA)
jq -r '.paths | to_entries[] | select(.value.put or .value.patch) | .key' openapi.json
```

---

## ffuf con Field Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ffuf -u https://target/api/profile -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer $TOK" -d '{"FUZZ":true}' -w fields.txt -fr 'invalid\|rejected'` | Discover qué fields acepta el endpoint | Endpoint PUT/PATCH conocido. |
| `ffuf -u https://target/api/users -X POST -d '{"email":"x@y.z","password":"x","FUZZ":true}' -w fields.txt -mc 200,201` | Discover signup-time MA fields | Signup endpoint. |
| `ffuf ... -w fields.txt:FIELD -w values.txt:VAL -d '{"FIELD":"VAL"}'` | Multi-payload field+value combos | Probar field + value pairs. |
| `ffuf ... -mr 'isAdmin\|role'` (match regex en response) | Detectar reflection del field en response | Confirma aceptación. |
| `ffuf ... -ml 1234` | Match length exacto | Reduce FP cuando response varía. |
| `ffuf ... -rate 10` | Rate limit propio | Evitar bloqueo. |
| `ffuf ... -o results.json` | Output JSON reportable | Post-run review. |
^ma-tool-ffuf

---

## Wordlist custom para field discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `cat <<EOF > fields.txt` (ver code block) | Wordlist sensitive fields | Para usar con ffuf/Param Miner. |
| `curl -s https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/Mass%20Assignment/Intruder/mass_assignment.txt` | PayloadsAllTheThings wordlist | Comprehensive ready-made. |
| Mix + dedup: `cat custom.txt PayloadsAllTheThings.txt \| sort -u > combined.txt` | Single wordlist consolidada | Bulk fuzzing. |
^ma-tool-wordlist

### Wordlist field discovery custom

```
isAdmin
is_admin
admin
role
roles
permissions
groups
is_staff
is_superuser
is_active
is_verified
email_verified
phone_verified
kyc_verified
mfa_enabled
mfa_secret
balance
credits
points
tokens
wallet
tier
plan
subscription_status
subscription_expires_at
trial_extended
quota_used
quota_limit
discount
tax_rate
referral_credit
user_id
owner_id
tenant_id
created_by
modified_by
created_at
updated_at
deleted_at
version
revision
api_key
password_hash
password_reset_token
mfa_secret
external_id
oauth_id
verified
trusted
internal
priority
scope
access_level
clearance
secret
metadata
```

---
