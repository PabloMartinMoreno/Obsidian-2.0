---
aliases:
  - Mass Assignment Tooling
  - Param Miner
  - API Discovery
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
  - '[[Burp Suite]]'
---
# Mass Assignment - Tooling

***

## Param Miner (Burp)

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → BApp Store → "Param Miner" | Free PortSwigger. |
| Right-click → "Guess JSON parameters" | Auto-discover JSON keys via fuzzing | Mass assignment vector. |
| Right-click → "Guess params" | Discover query params/body params | Same. |
| Right-click → "Guess headers" | Identifica headers ocultos (cache poisoning combo) | Adjacent. |
| Settings → Bonus features | Hostnames, JSON, other | Advanced. |
| Settings → Custom wordlist | Append custom JSON keys list | Extender. |
| Default wordlist | 200+ common params | Solid baseline. |
| Settings → Force cache miss | Cache poisoning specific | Per use case. |
| Settings → Probe twice | Confirm consistency | Reduce FP. |
| Output panel | "Param Miner" tab | Findings. |
| Reflection detection | Auto-mark reflected params → can be mass assignment | Combine. |
^ma-tool-paramminer

___

## Source Map / JS Bundle Review

| **Function** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Source map URL | Look for `//# sourceMappingURL=...` in JS files | Standard webpack. |
| Direct fetch `.map` | `curl https://target/static/js/main.js.map` | Sometimes exposed. |
| `getsourcemap` tool | https://github.com/denandz/sourcemapper | Auto-extract. |
| Restore source | Original source structure recovered | Reveals model classes. |
| Search for sensitive fields | `grep -E 'isAdmin|role|tenant_id'` en restored | Identify candidates. |
| Bundle analyzer | webpack-bundle-analyzer si npm config disponible | Per-stack. |
| Mobile app DTO extract | APK / IPA decompile → DTO classes con fields | Mobile recon. |
| GraphQL schema extract | Build outputs may contain bundled schema | Compile-time. |
| TypeScript types in bundle | Type definitions sometimes left | Schema disclosure. |
| Check build artifacts | `/static/`, `/_next/`, `/build/` | Default paths. |
| `chrome://devtools` Sources | View original (if maps OK) | Manual. |
^ma-tool-sourcemap

___

## API Documentation Discovery

| **Endpoint** | **Notas** |
|:---:|:---:|
| `/swagger.json` / `/swagger.yaml` | Swagger 2.0 schema. |
| `/openapi.json` / `/openapi.yaml` | OpenAPI 3.x. |
| `/api-docs` | Swagger UI default. |
| `/api/docs` | Variant. |
| `/redoc` | Redoc UI. |
| `/swagger-ui.html` | Spring docs default. |
| `/v2/api-docs` | Spring older. |
| `/v3/api-docs` | Spring newer. |
| `/docs.json` / `/docs.yaml` | Custom. |
| `/explorer` | Generic API explorer. |
| `/console` | Api console (Restlet etc). |
| `/__debug__/` | Django debug. |
| `/.well-known/api-docs` | Standard discovery endpoint. |
| `/api-explorer/` | App-specific. |
| GraphQL: `/graphql/playground` o `/graphql/explorer` | Dev mode. |
| GraphQL Voyager schema upload | https://graphql-kit.com/graphql-voyager/ | Visualize. |
^ma-tool-apidocs

### Workflow API recon

```bash
# 1. Find docs
DOC_PATHS=(/swagger.json /openapi.json /api-docs /docs /redoc /swagger-ui.html /v2/api-docs /v3/api-docs)

for p in "${DOC_PATHS[@]}"; do
  echo "=== $p ==="
  curl -s "https://target$p" -o "$(basename $p).json" 2>/dev/null
  if [ -s "$(basename $p).json" ]; then
    echo "[+] Found"
    jq '.paths | keys' "$(basename $p).json" 2>/dev/null | head
  fi
done

# 2. Parse Swagger/OpenAPI for sensitive fields
jq '.definitions // .components.schemas | keys' swagger.json
# Then per-schema:
jq '.definitions.User.properties | keys' swagger.json
```

___

## ffuf con Field Wordlists

| **Workflow** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Setup ffuf for JSON keys | `ffuf -u https://target/api/profile -X PATCH -d '{"FUZZ":true}' -w wordlist.txt` | JSON body fuzz. |
| Detect by response diff | `-mc 200` (only 200), `-fr 'rejected'` (filter rejection) | Standard ffuf flags. |
| Custom Content-Type | `-H "Content-Type: application/json"` | Required for JSON. |
| Auth headers | `-H "Authorization: Bearer $TOKEN"` | Authenticated. |
| Multi-payload position | Use `FUZZ1`, `FUZZ2` con multi-wordlist | Advanced fuzz. |
| Recursive fuzz | Deep nested keys | Custom logic. |
| Rate limit | `-rate 10` | Avoid block. |
| Match length | `-ml 1234` | Exact size match. |
| Filter response | `-fr 'invalid'` excludes rejection messages | Cleaner output. |
| Output | `-o results.json` | Reportable. |
^ma-tool-ffuf

___

## Manual Review API Docs

| **Source** | **What to look for** | **Notas** |
|:---:|:---:|:---:|
| Swagger / OpenAPI schema | List all model fields per type | Visual review. |
| `definitions` / `components.schemas` | All DTOs declared | Direct field list. |
| `paths` | List endpoints + methods | Find PATCH/PUT. |
| `securitySchemes` | Auth methods | Required for testing. |
| `examples` | Example bodies | Show structure. |
| Parameters per endpoint | Per-path validation | Different vs body. |
| Response schemas | Reveal model fields backend exposes | Mirror request. |
| Postman collections | Public collections | OSINT. |
| GitHub leaked specs | Repo `apispec` etc | Search. |
| Mobile DTO extraction | Decompile APK / IPA | Reverse engineering. |
| Internal docs leaks | Confluence / Notion public exposure | OSINT. |
| Source map types | TypeScript interface / class definitions | If bundled. |
^ma-tool-manual

### Field discovery wordlist (custom)

```
# Common sensitive field names
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
mfa_enabled
mfa_secret
balance
credits
points
tier
plan
subscription_status
user_id
owner_id
tenant_id
created_by
created_at
updated_at
deleted_at
version
revision
api_key
password_hash
password_reset_token
external_id
oauth_id
verified
trusted
internal
reserved
priority
scope
access_level
clearance
secret
internal_notes
metadata
```

***
