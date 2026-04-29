---
aliases:
  - GraphQL Injection
  - GraphQL Vulnerabilities
  - GraphQL Attacks
  - GraphQL Pentesting
tags:
  - type/vulnerability
  - vuln/graphql
  - technique/initial-access
  - technique/discovery
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: CheatSheet
linked:
  - "[[GraphQL - Deteccion y Reconocimiento]]"
  - "[[GraphQL - Introspection y Schema Discovery]]"
  - "[[GraphQL - Inyecciones via Resolvers]]"
  - "[[GraphQL - Auth y Logica]]"
  - "[[GraphQL - DoS]]"
  - "[[GraphQL - Tooling]]"
  - "[[SQL Injection (SQLi)]]"
  - "[[NoSQL Injection]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[BOLA - IDOR]]"
  - "[[Burp Suite]]"
---
# GraphQL Injection

***

## Cheatsheet

### 🔍 Detección y Reconocimiento

````tabs
tab: **Identificar Endpoints**
![[GraphQL - Deteccion y Reconocimiento#^graphql-detect-endpoints]]

tab: **Fingerprint del Engine**
![[GraphQL - Deteccion y Reconocimiento#^graphql-detect-engine]]

tab: **Probes Básicos**
![[GraphQL - Deteccion y Reconocimiento#^graphql-detect-probes]]
````

### 📋 Introspection y Schema Discovery

````tabs
tab: **Introspection Query Completa**
![[GraphQL - Introspection y Schema Discovery#^graphql-introspect-query]]

tab: **Field Suggestions (Typo Trick)**
![[GraphQL - Introspection y Schema Discovery#^graphql-introspect-suggestions]]

tab: **Schema Recovery con Tools**
![[GraphQL - Introspection y Schema Discovery#^graphql-introspect-tools]]
````

### 💉 Inyecciones via Resolvers

````tabs
tab: **SQLi en Args**
![[GraphQL - Inyecciones via Resolvers#^graphql-inj-sqli]]

tab: **NoSQLi en MongoDB Resolvers**
![[GraphQL - Inyecciones via Resolvers#^graphql-inj-nosqli]]

tab: **Command Injection / SSRF / Path Traversal**
![[GraphQL - Inyecciones via Resolvers#^graphql-inj-cmdi-ssrf]]
````

### 🔓 Auth y Lógica

````tabs
tab: **CSRF en GraphQL**
![[GraphQL - Auth y Logica#^graphql-auth-csrf]]

tab: **Query Batching para Bypass**
![[GraphQL - Auth y Logica#^graphql-auth-batching]]

tab: **IDOR via Global IDs**
![[GraphQL - Auth y Logica#^graphql-auth-idor]]

tab: **Mass Assignment via Mutations**
![[GraphQL - Auth y Logica#^graphql-auth-mass-assign]]
````

### 💥 DoS

````tabs
tab: **Deeply Nested Queries**
![[GraphQL - DoS#^graphql-dos-nested]]

tab: **Aliases Overloading**
![[GraphQL - DoS#^graphql-dos-aliases]]

tab: **Field Duplication / Batching Abuse**
![[GraphQL - DoS#^graphql-dos-batching]]

tab: **Circular Fragments**
![[GraphQL - DoS#^graphql-dos-circular]]
````

### 🛠️ Tooling

````tabs
tab: **graphw00f (Engine Fingerprint)**
![[GraphQL - Tooling#^graphql-tool-graphw00f]]

tab: **InQL (Burp Extension)**
![[GraphQL - Tooling#^graphql-tool-inql]]

tab: **clairvoyance (Schema Recovery)**
![[GraphQL - Tooling#^graphql-tool-clairvoyance]]

tab: **graphql-cop (Security Audit)**
![[GraphQL - Tooling#^graphql-tool-cop]]

tab: **GraphiQL / Altair / Postman**
![[GraphQL - Tooling#^graphql-tool-clients]]
````

___

## Overview

**GraphQL Injection** = conjunto de vulnerabilidades específicas a APIs GraphQL: information disclosure por introspection, inyecciones en resolvers (SQLi/NoSQLi/CommandInj), bypass de auth via batching, IDOR via global IDs predecibles, mass assignment via mutations, DoS via queries recursivas, CSRF cuando engine acepta non-JSON.

GraphQL elimina algunos vectores REST (overfetching, multi-endpoint enum) pero introduce su propia superficie. Stack moderno (Apollo / Hasura / AWS AppSync) trae defensas, pero implementaciones custom o configs default suelen exponer todo.

### Por qué GraphQL es target diferente a REST

| | **REST** | **GraphQL** |
|---|---|---|
| Endpoints | Múltiples (`/users`, `/posts`, `/orders`) | Single (`/graphql`) |
| Discovery | Spider URLs | Introspection query |
| Method | GET/POST/PUT/DELETE | POST (default) |
| Body | JSON / form-urlencoded | JSON con `query`/`variables` |
| Auth | Per endpoint | Per resolver |
| Rate limit | Per endpoint | Per query (batching abuse) |
| IDOR | Predictable IDs | Global IDs (Relay) o numeric |
| Mass assignment | Field whitelist | Input type — full schema |
| DoS | Per endpoint | Nested queries / aliases |

### Engines comunes

| Engine | Lenguaje | Notas |
|---|---|---|
| **Apollo Server** | JS/TS | Default in modern Node apps. |
| **Hasura** | Haskell + Postgres | Auto-generated schema desde DB. |
| **AWS AppSync** | Cloud managed | DynamoDB / Aurora backend. |
| **graphene-django** | Python | Django stack. |
| **graphene-python** | Python | Standalone Flask. |
| **Strawberry** | Python | Modern type-hinted. |
| **graphql-yoga** | JS/TS | Replaces Express middleware. |
| **graphql-php** | PHP | Webonyx. |
| **Lighthouse** | Laravel PHP | PHP stack. |

___

## Workflow de explotación

```
1. Detectar endpoint:
   - /graphql, /api/graphql, /v1/graphql, /query
   - POST con {"query":"{__typename}"} → confirma alive.

2. Fingerprint engine:
   - graphw00f
   - Verbose errors → stack trace
   - Headers de response

3. Introspection:
   - Query canonical → si OK, dump completo
   - Si bloqueada → suggestions trick + clairvoyance

4. Mapear superficie:
   - Top-level Query / Mutation / Subscription
   - Sensitive fields (passwords, tokens, internal IDs)
   - Mass assignment candidates (input types con isAdmin/role)

5. Explotación:
   a. Inyecciones:
      - SQLi en args (sqlmap con request raw)
      - NoSQLi en MongoDB filters
      - Command injection / SSRF
   b. Auth:
      - CSRF via text/plain trick
      - Batching bruteforce login / 2FA
      - IDOR con global IDs decoded
      - Mass assignment de isAdmin/role
   c. DoS (último recurso):
      - Nested queries
      - Aliases overload
      - Circular fragments

6. Persistencia / impacto:
   - File upload via multipart spec
   - Webshell drop si command injection
   - Account takeover si auth bypass
```

___

## Detección rápida

### Indicadores de stack GraphQL

- `Content-Type: application/json` con body `{"query":"..."}`.
- Endpoint `/graphql` o `/api/graphql`.
- Headers `x-hasura-*` o `x-apollo-*`.
- Response con campo `data` y/o `errors`.
- Field `extensions` en response (tracing, complexity).
- JS frontend con `apollo-client` / `urql` / `relay`.
- Schema files `.graphql` / `.gql` en repos públicos.

### Probes mínimos

```bash
# 1. Detectar endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}' \
  https://target/graphql

# 2. Fingerprint engine
graphw00f -t https://target -d

# 3. Introspection
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__schema{types{name}}}"}' \
  https://target/graphql

# 4. Audit completo
graphql-cop -t https://target/graphql

# 5. Schema recovery si introspection bloqueada
clairvoyance https://target/graphql -o schema.json
```

___

## Impacto

- **Information disclosure** — introspection / suggestions revelan estructura completa, fields internos, types ocultos.
- **SQLi / NoSQLi** — resolvers que pasan args a query DB sin sanitizar = misma severidad que REST.
- **SSRF / Command injection** — resolvers con file/URL fields = RCE clásica.
- **Account takeover** — IDOR con global IDs predecibles + mass assignment de isAdmin.
- **Auth bypass via batching** — bruteforce login / 2FA en single request → rate limit ineficaz.
- **CSRF** — engines laxos con form-urlencoded → mutations forzadas.
- **DoS** — single query exponencialmente costosa → service degradation.

___

## Mitigación (defender)

- **Disable introspection en producción**:
  ```javascript
  // Apollo
  new ApolloServer({ schema, introspection: false });
  ```
- **Disable field suggestions**:
  ```javascript
  // Apollo v4+
  new ApolloServer({ schema, validationRules: [NoSchemaIntrospectionCustomRule] });
  ```
- **Depth limit** — `graphql-depth-limit` (max 5-7 niveles).
- **Query complexity analysis** — `graphql-query-complexity` (assign cost por field, max budget).
- **Aliases limit** — `graphql-no-alias` plugin.
- **Disable batching** o limit `max 5 queries por batch`.
- **Disable GET method para mutations** — solo POST con JSON.
- **CSRF protection** — header check `X-Requested-With` o token.
- **Rate limiting per query, not per request** — accountar batching.
- **Resolver-level auth** — cada resolver verifica permisos del user.
- **Input validation** — Joi/Zod schemas para variables.
- **Sanitize args antes de DB** — parametrized queries siempre.
- **Mass assignment defense** — input types whitelist explícita, no exponer model directo.
- **Verbose errors off en prod** — generic error messages.
- **Audit con graphql-cop en CI/CD** — detect regressions.

___

## Para entender GraphQL

**Por qué GraphQL existe:**

REST tiene over-fetching (response trae más data de la necesaria) y under-fetching (cliente necesita N requests para data relacionada). GraphQL = single request donde cliente declara **exactamente qué fields quiere**, server resuelve.

**Por qué introspection existe:**

GraphQL es self-documenting. La spec define `__schema` y `__type` para que clients descubran el schema dinámicamente — usado por GraphiQL, Apollo Studio, code generators.

Pero introspection en producción → atacante mapea TODA la superficie sin esfuerzo. Modern apps lo deshabilitan.

**Por qué resolvers son el risk real:**

GraphQL spec NO mandata cómo implementar resolvers. Cada resolver es código del developer:
```javascript
{
  user: (parent, args) => db.query(`SELECT * FROM users WHERE id=${args.id}`)  // SQLi
}
```

GraphQL no protege de SQLi. Engine solo enruta args al resolver — la responsabilidad de sanitización es del dev.

**Diferencia con REST en CSRF:**

REST APIs JSON requieren preflight CORS para POST cross-origin con JSON. GraphQL hereda el mismo, PERO si engine acepta `application/x-www-form-urlencoded` o `text/plain` o GET method → CSRF posible. Apollo v3+ patched, pero engines custom o configs viejas siguen vulnerables.

___

## Recursos

- [PortSwigger - GraphQL API](https://portswigger.net/web-security/api-testing/server-side-parameter-pollution) — labs.
- [PayloadsAllTheThings - GraphQL](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/GraphQL%20Injection) — payloads.
- [HackTricks - GraphQL](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/graphql) — referencia.
- [GraphQL Security Cheatsheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html) — defenses.
- [graphw00f](https://github.com/dolevf/graphw00f) — fingerprinting.
- [InQL Burp ext](https://github.com/doyensec/inql) — Burp extension.
- [clairvoyance](https://github.com/nikitastupin/clairvoyance) — schema recovery.
- [graphql-cop](https://github.com/dolevf/graphql-cop) — security audit.
- [GraphQL Voyager](https://graphql-kit.com/graphql-voyager/) — schema visualizer.
- [Black Hat Asia 2018 - Five Years of GraphQL](https://www.blackhat.com/docs/asia-18/asia-18-Sukhonin-Why-Modern-Apps-Are-Vulnerable.pdf) — early survey.
- [GraphQL spec](https://spec.graphql.org/) — oficial.

***
