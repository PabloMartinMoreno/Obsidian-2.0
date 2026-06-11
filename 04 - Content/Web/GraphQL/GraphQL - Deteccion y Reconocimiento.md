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

> [!tip] Comando base
> Cada `Body (-d)` de las tablas se lanza con:
> `curl -sX POST -H 'Content-Type: application/json' -d '<BODY>' https://target/graphql`

---

## Identificar Endpoints

Respuesta `{"data":{"__typename":"Query"}}` confirma GraphQL alive en ese path.

| **Comando** | **Engine / Contexto** | **Cuándo** |
|:---|:---|:---|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/graphql` | Genérico | Más común. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/api/graphql` | SPA backends | Apps modernas. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/v1/graphql` | Hasura (default) | Postgres-backed. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/query` | Custom | Apps custom. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/console/api/graphql` | Hasura console | Dev mode. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/.netlify/functions/graphql` | Netlify Functions | Serverless. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/admin/api/graphql` | Shopify admin | E-commerce. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/storefront/api/graphql` | Shopify storefront | Public access. |

Otros paths a probar con el mismo body: `/v2/graphql`, `/v3/graphql`, `/api/query`, `/api` (catch-all por content-type), `/_api/graphql` (Wix/Headless CMS). Para fuzzear todos de una, usar el loop / `ffuf` de abajo.
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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `graphw00f -d -t https://target/graphql` | Fingerprint automático del engine | Primera opción siempre. |
| `curl -sI https://target/graphql \| grep -i 'server\|x-hasura\|x-powered-by'` | Headers que delatan engine (`apollo`, `x-hasura-*`) | Apollo / Hasura. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/graphql \| jq '.extensions'` | Campo `extensions` (`tracing`/`complexity`) varía por engine | Response inspection. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{a}"}' https://target/graphql` | Error con stack trace → delata stack (Django, Flask, Laravel, Scala…) | Verbose errors (dev mode). |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__typename}"}' https://target/v1/graphql` | `200` en `/v1/graphql` + `x-hasura-*` | Confirma Hasura. |
| `echo "$TARGET_HOST" \| grep -E 'appsync-api.*amazonaws'` | URL pattern AWS AppSync | AWS managed. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{node(id:\"X\"){id}}"}' https://target/graphql` | `node(id:)` global IDs → cliente Relay | Facebook style. |

> Engines comunes por señal: **Apollo** (`Server: apollo`, `extensions.tracing`), **Hasura** (`/v1/graphql`, `x-hasura-*`), **graphene-django/python** (traza Django/Flask en error), **graphql-php / Lighthouse** (traza PHP/Laravel), **Sangria** (traza Scala/JVM), **AppSync** (`*.appsync-api.*.amazonaws.com`).
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

Probes que usan el base POST — body en col1:

| **Body (`-d`)** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `{"query":"{__typename}"}` | `{"data":{"__typename":"Query"}}` confirma GraphQL | Confirmar endpoint. |
| `{"query":"mutation{__typename}"}` | `{"data":{"__typename":"Mutation"}}` | Confirmar mutation support. |
| `{"query":"subscription{__typename}"}` | OK = subscriptions habilitadas (WS) | Confirmar subscription. |
| `{"query":"{nonexistent}"}` | Stack trace en error → engine disclosure | Verbose errors. |
| `{"query":"{usr}"}` | `Did you mean "user"?` → suggestions on | Field suggestions. |
| `{"query":"query($x:Int){__typename}","variables":{"x":1}}` | Confirma soporte de variables | Variables. |
| `{"query":"{user{...F}} fragment F on User{id name}"}` | Confirma soporte de fragments | Fragments. |
| `{"query":"{a:__typename b:__typename}"}` | Múltiples calls en una query | Aliases (batching/DoS pre-check). |

Variantes de transporte (no usan el base estándar — comando completo):

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `curl -sG 'https://target/graphql?query={__typename}'` | GET aceptado → vector CSRF / cache | GET method support. |
| `curl -sX POST -d 'query={__typename}' https://target/graphql` | form-urlencoded aceptado | CSRF bypass (sin JSON CT). |
| `curl -sX POST -H 'Content-Type: text/plain' -d '{"query":"{__typename}"}' https://target/graphql` | text/plain parseado | CSRF text/plain. |
| `curl -sG 'https://target/graphql?operationName=getMe&query=query getMe{__typename}'` | Multi-operation support | operationName. |
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
