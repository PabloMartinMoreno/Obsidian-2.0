---
aliases:
  - GraphQL Detection
  - GraphQL Recon
  - GraphQL Endpoint Discovery
tags:
  - type/technique
  - vuln/graphql
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[GraphQL Injection]]'
---
# GraphQL - Detección y Reconocimiento

***

## Identificar Endpoints

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `/graphql` | `curl -X POST -H "Content-Type: application/json" -d '{"query":"{__typename}"}' https://target/graphql` | Más común. |
| `/api/graphql` | Mismo probe | Apps modernas. |
| `/v1/graphql` | Hasura default | Hasura framework. |
| `/v2/graphql`, `/v3/graphql` | Versionado | Edge cases. |
| `/query` | Custom | Algunas apps. |
| `/api/query` | Custom | Apps custom. |
| `/console/api/graphql` | Hasura console | Dev mode. |
| `/api` (con POST + JSON body) | Catch-all endpoint | Apps que routing por content-type. |
| `/.netlify/functions/graphql` | Netlify Functions | Serverless. |
| `/_api/graphql` | Wix / Headless CMS | CMS specific. |
| `/admin/api/graphql` | Shopify-style admin | E-commerce. |
| `/storefront/api/graphql` | Shopify storefront | Public access. |
| Wordlist directorios GraphQL | `SecLists/Discovery/Web-Content/graphql.txt` | Bulk fuzzing. |
| Probe alive endpoint | `{__typename}` retorna `{"data":{"__typename":"Query"}}` | Confirma GraphQL alive. |
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

___

## Fingerprint del Engine

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Apollo Server | Header `Server: apollo` o response con `extensions.tracing` | JS/TS dominante. |
| Hasura | Path `/v1/graphql` + Header `x-hasura-*` en response | Postgres-backed. |
| graphene-django | Stack Python con Django | DRF + GraphQL. |
| graphene-python | Standalone Python | Flask common. |
| Strawberry | Modern Python | Type hints. |
| Ariadne | Schema-first Python | Less common. |
| graphql-php | Webonyx/graphql-php | PHP. |
| graphql-yoga | Modern JS/TS | Replaces Express middleware. |
| AppSync (AWS) | URL pattern `*.appsync-api.*.amazonaws.com` | AWS managed. |
| Relay | Cliente — usa global IDs `node(id:...)` | Facebook style. |
| Stepzen | Cloud platform | Specific. |
| Sangria | Scala | Less common. |
| Lighthouse | Laravel PHP | Stack PHP popular. |
| graphw00f | `graphw00f -d -t https://target/graphql` | Auto fingerprint. |
| Error verbosity | Stack trace en errors → engine info | Default dev mode. |
| `extensions` field | Presencia + content varía por engine | `tracing`, `complexity`, etc. |
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

___

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

***
