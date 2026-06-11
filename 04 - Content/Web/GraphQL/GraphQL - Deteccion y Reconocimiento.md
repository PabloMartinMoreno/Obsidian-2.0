---
aliases:
  - GraphQL Detection
  - GraphQL Recon
  - GraphQL Endpoint Discovery
tags:
  - vuln/graphql
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[GraphQL Injection]]"
---
# GraphQL - Detección y Reconocimiento

---

## Identificar Endpoints

Probe a cada path con: `curl -X POST -H "Content-Type: application/json" -d '{"query":"{__typename}"}' https://target<PATH>` → respuesta `{"data":{"__typename":"Query"}}` confirma GraphQL alive.

| **Path a probar** | **Engine / Contexto** | **Cuándo** |
|:---:|:---:|:---:|
| `/graphql` | Genérico | Más común. |
| `/api/graphql` | SPA backends | Apps modernas. |
| `/v1/graphql` | Hasura (default) | Postgres-backed. |
| `/v2/graphql`, `/v3/graphql` | Versionado | Edge cases. |
| `/query`, `/api/query` | Custom | Apps custom. |
| `/console/api/graphql` | Hasura console | Dev mode. |
| `/api` (POST + JSON body) | Catch-all | Routing por content-type. |
| `/.netlify/functions/graphql` | Netlify Functions | Serverless. |
| `/_api/graphql` | Wix / Headless CMS | CMS specific. |
| `/admin/api/graphql` | Shopify admin | E-commerce. |
| `/storefront/api/graphql` | Shopify storefront | Public access. |
^graphql-detect-endpoints

### Fuzzing rápido

```bash
# Wordlist GraphQL paths
ffuf -u 'https://target/FUZZ' \
     -w /usr/share/seclists/Discovery/Web-Content/graphql.txt \
     -X POST -H "Content-Type: application/json" \
     -d '{"query":"{__typename}"}' \
     -mc 200 -fr 'errors'

# Manual probe rápido
for p in /graphql /api/graphql /v1/graphql /query /api/query; do
  echo "Testing: $p"
  curl -s -X POST -H "Content-Type: application/json" \
       -d '{"query":"{__typename}"}' "https://target$p" \
       | grep -E '"data"|"__typename"|"errors"' | head -3
done
```

---

Fingerprint automático: `graphw00f -d -t https://target/graphql` (ver workflow abajo). Señales manuales:

| **Engine / Señal** | **Cómo identificarlo** | **Stack** |
|:---:|:---:|:---:|
| Apollo Server | Header `Server: apollo` o response con `extensions.tracing` | JS/TS dominante. |
| Hasura | Path `/v1/graphql` + Header `x-hasura-*` en response | Postgres-backed. |
| graphene-django | Errores con traza Django/DRF | DRF + GraphQL. |
| graphene-python | Errores con traza Flask/WSGI | Flask common. |
| Strawberry | Modern Python, type hints en errores | Python. |
| Ariadne | Schema-first Python | Less common. |
| graphql-php | Mensajes de error Webonyx/graphql-php | PHP. |
| graphql-yoga | Reemplaza middleware Express | JS/TS moderno. |
| AppSync (AWS) | URL pattern `*.appsync-api.*.amazonaws.com` | AWS managed. |
| Relay | Cliente usa global IDs `node(id:...)` | Facebook style. |
| Lighthouse | Errores con traza Laravel | PHP popular. |
| Sangria | Errores con traza Scala/JVM | Less common. |
| Error verbosity | Query inválida → stack trace delata engine | Default dev mode. |
| `extensions` field | Presencia + content varía por engine (`tracing`, `complexity`) | Response inspection. |
^graphql-detect-engine

### graphw00f workflow

```bash
# Install
git clone https://github.com/dolevf/graphw00f && cd graphw00f && pip install -r requirements.txt

# Detect endpoint + fingerprint engine
python main.py -t https://target -d

# Output:
# - Detected GraphQL endpoint at /graphql
# - Engine: Apollo Server
# - Detected behavior: introspection enabled, suggestions on, debug mode on
```

---

## Probes Básicos

| **Probe** | **Query / Comando** | **Resultado esperado** |
|:---:|:---:|:---:|
| Confirmar endpoint | `{"query":"{__typename}"}` | `{"data":{"__typename":"Query"}}` confirma GraphQL. |
| Confirmar mutation support | `{"query":"mutation{__typename}"}` | `{"data":{"__typename":"Mutation"}}` |
| Confirmar subscription | `{"query":"subscription{__typename}"}` | Si retorna OK = subscriptions habilitadas (WS). |
| GET method | `curl 'https://target/graphql?query={__typename}'` | Algunos engines aceptan GET — útil para CSRF / cache. |
| POST con form-urlencoded | `curl -X POST -d 'query={__typename}' https://target/graphql` | Default rejecta (CSRF protection) — pero si acepta = vulnerable. |
| POST con form en lugar de JSON | `curl -X POST -d '{"query":"{__typename}"}' https://target/graphql` (sin Content-Type JSON) | Bypass CSRF si engine lax. |
| Verbose errors | Query inválida → ver stack trace | Disclosure del engine. |
| Operation name | `?operationName=getMe&query={...}` | Multi-op support. |
| Variables | `{"query":"query($x:Int){...}", "variables":{"x":1}}` | Confirm variables works. |
| Fragments | `{"query":"{user{...UserFields}} fragment UserFields on User { id name }"}` | Confirm fragments. |
| Field suggestions | Field con typo → ¿response sugiere alternative? | "Did you mean 'name'?" → suggestions activas. |
| Aliases | `{"query":"{a:user{id} b:user{id}}"}` | Multiple calls en una query. |
| Directives | `@skip`, `@include`, `@deprecated` | Schema feature. |
^graphql-detect-probes

### Probe set completo

```bash
# 1. Confirmar endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}' \
  https://target/graphql

# 2. Detectar GET method support (CSRF vector)
curl 'https://target/graphql?query={__typename}'

# 3. Detectar form-urlencoded (CSRF bypass)
curl -X POST -d 'query={__typename}' https://target/graphql

# 4. Verbose errors
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{nonexistent}"}' \
  https://target/graphql
# Stack trace? Engine name?

# 5. Field suggestions
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{usr}"}' \
  https://target/graphql
# "Did you mean user?" → suggestions on
```

---
