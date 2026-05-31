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
tab: **InQL (Burp Extension)**
![[GraphQL - Tooling#^graphql-tool-inql]]

tab: **graphql-cop (Security Audit)**
![[GraphQL - Tooling#^graphql-tool-cop]]

tab: **GraphiQL / Altair / Postman**
![[GraphQL - Tooling#^graphql-tool-clients]]
````

___

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

___

## Impacto

- **SQLi / NoSQLi** — resolvers que pasan args a query DB sin sanitizar = misma severidad que REST.
- **SSRF / Command injection** — resolvers con file/URL fields = RCE clásica.
- **Account takeover** — IDOR con global IDs predecibles + mass assignment de isAdmin.
- **Auth bypass via batching** — bruteforce login / 2FA en single request → rate limit ineficaz.
- **CSRF** — engines laxos con form-urlencoded → mutations forzadas.
- **DoS** — single query exponencialmente costosa → service degradation.

___

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

___

## Para entender GraphQL

**Por qué resolvers son el risk real:** GraphQL spec NO mandata cómo implementar resolvers. Cada resolver es código del developer:
```javascript
{
  user: (parent, args) => db.query(`SELECT * FROM users WHERE id=${args.id}`)  // SQLi
}
```

GraphQL no protege de SQLi. Engine solo enruta args al resolver — la responsabilidad de sanitización es del dev.

**Diferencia con REST en CSRF:** REST APIs JSON requieren preflight CORS para POST cross-origin con JSON. GraphQL hereda el mismo, PERO si engine acepta `application/x-www-form-urlencoded` o `text/plain` o GET method → CSRF posible. Apollo v3+ patched, pero engines custom o configs viejas siguen vulnerables.

___

## Recursos

- [PortSwigger - GraphQL API](https://portswigger.net/web-security/api-testing/server-side-parameter-pollution) — labs.
- [PayloadsAllTheThings - GraphQL](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/GraphQL%20Injection) — payloads.
- [HackTricks - GraphQL](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/graphql) — referencia.
- [GraphQL Security Cheatsheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html) — defenses.
- [InQL Burp ext](https://github.com/doyensec/inql) — Burp extension.
- [graphql-cop](https://github.com/dolevf/graphql-cop) — security audit.
- [GraphQL Voyager](https://graphql-kit.com/graphql-voyager/) — schema visualizer.
- [GraphQL spec](https://spec.graphql.org/) — oficial.

***
