---
aliases:
  - GraphQL Injection
  - GraphQL Vulnerabilities
  - GraphQL Attacks
  - GraphQL Pentesting
tags:
  - vuln/graphql
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[GraphQL - Introspection y Schema Discovery]]"
  - "[[GraphQL - Deteccion y Reconocimiento]]"
  - "[[GraphQL - Inyecciones via Resolvers]]"
  - "[[GraphQL - Auth y Logica]]"
  - "[[GraphQL - DoS]]"
  - "[[GraphQL - Tooling]]"
  - "[[SQL Injection (SQLi)]]"
  - "[[NoSQL Injection]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[BOLA - IDOR]]"
  - "[[GraphQL Flujo Básico]]"
  - "[[GraphQL Estructura]]"
---

# GraphQL Injection

---

## Cheatsheet

### 1. Detección y Reconocimiento

#### 🔍 Recon Activo

````tabs
tab: **Descubrir Endpoint**
![[GraphQL - Deteccion y Reconocimiento#^graphql-detect-endpoints]]

tab: **Identificar Engine**
![[GraphQL - Deteccion y Reconocimiento#^graphql-detect-engine]]

tab: **Probes de Detección**
![[GraphQL - Deteccion y Reconocimiento#^graphql-detect-probes]]
````

#### 🗺️ Introspection y Schema Discovery

````tabs
tab: **Introspection Query**
![[GraphQL - Introspection y Schema Discovery#^graphql-introspect-query]]

tab: **Field Suggestions (Typo Trick)**
![[GraphQL - Introspection y Schema Discovery#^graphql-introspect-suggestions]]

tab: **Schema Recovery Tools**
![[GraphQL - Introspection y Schema Discovery#^graphql-introspect-tools]]
````

---

### 2. Explotación

> Una vez mapeado el schema (introspection arriba), explotar según los resolvers y la lógica expuesta.

#### 💉 Inyecciones via Resolvers

````tabs
tab: **SQLi en Args**
![[GraphQL - Inyecciones via Resolvers#^graphql-inj-sqli]]

tab: **NoSQLi en MongoDB Resolvers**
![[GraphQL - Inyecciones via Resolvers#^graphql-inj-nosqli]]

tab: **Command Injection / SSRF / Path Traversal**
![[GraphQL - Inyecciones via Resolvers#^graphql-inj-cmdi-ssrf]]
````

#### 🔓 Auth y Lógica

````tabs
tab: **IDOR via Global IDs**
![[GraphQL - Auth y Logica#^graphql-auth-idor]]

tab: **Mass Assignment via Mutations**
![[GraphQL - Auth y Logica#^graphql-auth-mass-assign]]

tab: **Query Batching (Bypass Rate-Limit / 2FA)**
![[GraphQL - Auth y Logica#^graphql-auth-batching]]

tab: **CSRF en GraphQL**
![[GraphQL - Auth y Logica#^graphql-auth-csrf]]
````

#### 💥 DoS

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

---

### 3. Tooling

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

---

## Overview

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

---

## Impacto

- **SQLi / NoSQLi** — resolvers que pasan args a query DB sin sanitizar = misma severidad que REST.
- **SSRF / Command injection** — resolvers con file/URL fields = RCE clásica.
- **Account takeover** — IDOR con global IDs predecibles + mass assignment de isAdmin.
- **Auth bypass via batching** — bruteforce login / 2FA en single request → rate limit ineficaz.
- **CSRF** — engines laxos con form-urlencoded → mutations forzadas.
- **DoS** — single query exponencialmente costosa → service degradation.

---

## Mitigación (defender)

- **Disable introspection en producción**: `new ApolloServer({ schema, introspection: false });`
- **Disable field suggestions**: `new ApolloServer({ schema, validationRules: [NoSchemaIntrospectionCustomRule] });`
- **Depth limit** — `graphql-depth-limit` (max 5-7 niveles).
- **Query complexity analysis** — `graphql-query-complexity` (assign cost por field, max budget).
- **Aliases limit** — `graphql-no-alias` plugin.
- **Disable batching** o limit `max 5 queries por batch`.
- **Disable GET method para mutations** — solo POST con JSON.
- **CSRF protection** — header check `X-Requested-With` o token.
- **Rate limiting per query, not per request** — accountar batching.
- **Resolver-level auth** — cada resolver verifica permisos del user.
- **Sanitize args antes de DB** — parametrized queries siempre.
- **Mass assignment defense** — input types whitelist explícita, no exponer model directo.
- **Verbose errors off en prod** — generic error messages.

---

## Para entender GraphQL

**Por qué resolvers son el risk real:** GraphQL spec NO mandata cómo implementar resolvers. Cada resolver es código del developer:
```javascript
{
  user: (parent, args) => db.query(`SELECT * FROM users WHERE id=${args.id}`)  // SQLi
}
```

GraphQL no protege de SQLi. Engine solo enruta args al resolver — la responsabilidad de sanitización es del dev.

**Diferencia con REST en CSRF:** REST APIs JSON requieren preflight CORS para POST cross-origin con JSON. GraphQL hereda el mismo, PERO si engine acepta `application/x-www-form-urlencoded` o `text/plain` o GET method → CSRF posible. Apollo v3+ patched, pero engines custom o configs viejas siguen vulnerables.

---

## Recursos

- [PortSwigger - GraphQL API](https://portswigger.net/web-security/api-testing/server-side-parameter-pollution) — labs.
- [PayloadsAllTheThings - GraphQL](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/GraphQL%20Injection) — payloads.
- [HackTricks - GraphQL](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/graphql) — referencia.
- [GraphQL Security Cheatsheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html) — defenses.
- [InQL Burp ext](https://github.com/doyensec/inql) — Burp extension.
- [graphql-cop](https://github.com/dolevf/graphql-cop) — security audit.
- [GraphQL Voyager](https://graphql-kit.com/graphql-voyager/) — schema visualizer.
- [GraphQL spec](https://spec.graphql.org/) — oficial.

---
