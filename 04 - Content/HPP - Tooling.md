---
aliases:
  - HPP Tooling
  - Param Miner HPP
  - Burp HPP
tags:
  - type/cheatsheet
  - vuln/hpp
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Parameter Pollution]]'
  - '[[Burp Suite]]'
---
# HPP - Tooling

***

## Burp Intruder + Param Miner

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Param Miner | Burp BApp Store → "Param Miner" | Discover hidden params. |
| Right-click → "Guess params" | Auto-discover query/body params | Standard. |
| Right-click → "Guess JSON parameters" | Discover JSON body params | API. |
| Detect duplicates | Manual probe en Repeater + Comparer | Side-by-side. |
| Intruder Sniper | Single position con HPP payloads | Iterate. |
| Intruder Pitchfork | Multiple positions sync | Test combinations. |
| Intruder Cluster bomb | Cartesian product | Heavy fuzzing. |
| Match conditions | Grep extract response patterns | Validation. |
| Logger++ filter | Compare responses con/sin HPP | Pasivo. |
| Burp Active Scan | HPP detection en active scanner | Built-in. |
| BCheck rules | Pro-only HPP checks | Modern. |
| Burp Repeater "Send group" | Compare requests | Standard. |
^hpp-tool-burp

___

## Custom curl Scripts

| **Workflow** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Single duplicate test | `curl "https://target/?a=1&a=2"` | Standard. |
| Multi-encoding test | `for enc in...; do curl ...; done` | Iterate. |
| Method differential | GET vs POST con same params | Standard. |
| Header / cookie source | Per-source test | Multi-source. |
| Save responses | Compare with `diff` | Forensic. |
| Mixed body / query | `curl -X POST -d "a=B" "https://target/?a=Q"` | Standard. |
| JSON body | `curl -H "Content-Type: application/json" -d '{"a":1}' "https://target/?a=2"` | JSON vs query. |
| Form-urlencoded | Default content type | Standard. |
| Multipart | `-F "a=1" -F "a=2"` | Edge. |
| Send via netcat | Raw HTTP control | Low-level. |
| Combine con jq | Parse JSON responses | Pipeline. |
^hpp-tool-curl

### Bash one-liner para detección

```bash
TARGET="https://target/api/endpoint"
PARAM="user"

# Iterate behaviors
echo "=== Single ==="
curl -s "${TARGET}?${PARAM}=ALICE" | head -c 200

echo "=== Duplicate (query) ==="
curl -s "${TARGET}?${PARAM}=ALICE&${PARAM}=BOB" | head -c 200

echo "=== Encoded duplicate ==="
curl -s "${TARGET}?${PARAM}=ALICE&%75%73%65%72=BOB" | head -c 200

echo "=== Array notation ==="
curl -s "${TARGET}?${PARAM}[]=ALICE&${PARAM}[]=BOB" | head -c 200

echo "=== Body + query ==="
curl -s -X POST -d "${PARAM}=BOB" "${TARGET}?${PARAM}=ALICE" | head -c 200
```

___

## Wordlists (PayloadsAllTheThings)

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - HPP | https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/HTTP%20Parameter%20Pollution | Standard. |
| HackTricks - HPP | https://book.hacktricks.xyz/pentesting-web/parameter-pollution | Referencia. |
| OWASP Testing Guide | OWASP-T-WP-INPVAL-04 | Methodology. |
| Burp Intruder built-in | "HTTP Parameter Pollution" payload set | Pro feature. |
| Custom polyglot | One payload con multiple bypass techniques | Single-shot. |
| SQLi keyword fragments | For ASP.NET concatenation | Standard. |
| WAF bypass payloads | OWASP Testing Guide reference | Comprehensive. |
| Bug bounty disclosed | HackerOne reports for real-world | Learn. |
| Stack-specific lists | Per-framework | Per-target. |
| PortSwigger labs | HPP labs available | Practice. |
^hpp-tool-wordlists

___

## Per-Stack Test Harness

| **Stack** | **Setup** | **Notas** |
|:---:|:---:|:---:|
| Docker per-stack | Run target stack en container | Reproducible. |
| PHP test | `docker run -p 80:80 php:apache` | Test PHP behavior. |
| ASP.NET Core | `docker run mcr.microsoft.com/dotnet/aspnet` | Test .NET. |
| Java Tomcat | `docker run tomcat` | Test Java. |
| Node.js Express | `docker run node` con app | Test Express. |
| Python Flask/Django | `docker run python` con app | Test Python. |
| Ruby Rails | `docker run ruby` | Test Rails. |
| Custom test endpoint | Echo all params received | Standard test. |
| Debug logs | Enable verbose logs | See parsing behavior. |
| Burp + local dev | Setup proxy | Standard. |
| Postman / Insomnia | Manual testing | UI-friendly. |
| Combine con WAF | Test WAF + stack combination | Real-world simulate. |
| nuclei templates | Custom HPP templates | Bulk scan. |
| dalfox / kxss | Adjacent XSS scanners with HPP awareness | Edge. |
| Hackvertor | Encoding payloads dinamically | Custom. |
^hpp-tool-harness

### Test endpoint Python Flask

```python
from flask import Flask, request
app = Flask(__name__)

@app.route('/echo')
def echo():
    return {
        'args_get': request.args.get('a'),
        'args_getlist': request.args.getlist('a'),
        'form_get': request.form.get('a'),
        'cookies': request.cookies.get('a'),
        'all_args': dict(request.args),
        'method': request.method
    }

# Run: flask run
# Test:
# curl 'http://localhost:5000/echo?a=1&a=2'
# {"args_get":"1","args_getlist":["1","2"],"all_args":{"a":"1"},...}
# Flask Werkzeug → first wins
```

***
