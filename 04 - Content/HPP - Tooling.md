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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "Param Miner" → Install | Setup extension | Primera vez. |
| Right-click request → "Guess params" | Auto-discover query/body params ocultos | Pre-attack discovery. |
| Right-click request → "Guess JSON parameters" | Discover JSON body params | API endpoints. |
| Burp Repeater → Send original + send duplicate-param version → Comparer | Side-by-side response diff | Manual differential analysis. |
| Burp Intruder → Sniper con position en value → payload list HPP variants | Iterate single position | Volume testing. |
| Burp Intruder → Pitchfork con dos positions sync (param1 + param2) | Test combinaciones específicas | Targeted. |
| Burp Intruder → Cluster bomb → cartesian product de payloads | Heavy fuzzing combos | Comprehensive. |
| Burp Intruder Match Conditions → grep extract response patterns | Validation oracle | Auto-detect success. |
| Burp Active Scan habilitado en endpoint | Built-in HPP detection | Automated scan. |
^hpp-tool-burp

___

## Custom curl Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/?a=1&a=2"` | Single duplicate test | Quick test. |
| `curl -X POST -d "a=1&a=2" https://target/` | POST body duplicate | Form HPP. |
| `curl -X POST -d "a=BODY" "https://target/?a=QUERY"` | Body + query conflict | Multi-source. |
| `curl -X POST -H "Content-Type: application/json" -d '{"a":"JSON"}' "https://target/?a=QUERY"` | JSON + query | API multi-source. |
| `curl -X POST -F "a=1" -F "a=2" https://target/` | Multipart duplicate | Multipart parser. |
| `curl --data-urlencode "a=safe" --data-urlencode "a=evil" https://target/` | URL-encoded duplicate | Body encoded. |
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 7\r\n\r\na=1&a=2' \| ncat target 80` | Raw HTTP control | Low-level testing. |
| `diff <(curl -s "https://target/?a=1") <(curl -s "https://target/?a=1&a=2")` | Bash diff oracle | Detection automation. |
^hpp-tool-curl

### Bash one-liner para detección

```bash
TARGET="https://target/api/endpoint"
PARAM="user"

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

## Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls "PayloadsAllTheThings/HTTP Parameter Pollution"` | PayloadsAllTheThings HPP | Foundation. |
| Browser → https://book.hacktricks.xyz/pentesting-web/parameter-pollution | HackTricks reference | Lookup. |
| Browser → https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/04-Testing_for_HTTP_Parameter_Pollution | OWASP Testing Guide methodology | Reference. |
| Browser → https://portswigger.net/web-security/parameter-pollution | PortSwigger labs hands-on | Practice. |
| Browser → https://hackerone.com/hacktivity?querystring=hpp | Disclosed HPP reports real-world | Inspiration. |
| `cat <<EOF > hpp-wordlist.txt\nadmin\nuser\nrole\naction\nstatus\nemail\npassword\nid\nrole\nEOF` | Custom wordlist params sensibles | Targeted fuzzing. |
^hpp-tool-wordlists

___

## Per-Stack Test Harness

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `docker run -d --rm -p 8080:80 php:apache` con script PHP echo params | Test PHP behavior local | Reproducible. |
| `docker run -d --rm -p 8081:80 mcr.microsoft.com/dotnet/aspnet` con app | Test .NET behavior | Stack-specific. |
| `docker run -d --rm -p 8082:8080 tomcat` con WAR | Test Java behavior | Java stack. |
| `docker run -d --rm -p 8083:3000 -v $(pwd)/app:/app -w /app node node app.js` | Test Express con qs | Node.js. |
| `python3 -m flask --app echo run` con script `request.args.get/getlist` | Test Flask behavior | Python testing. |
| `for stack in php aspnet java node flask rails; do docker run ... ; curl test ; done` | Bulk stack test | Comparativo. |
| Burp proxy con localhost containers | Inspect parsing live | Standard workflow. |
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

# Run: flask --app echo run
# Test:
# curl 'http://localhost:5000/echo?a=1&a=2'
# {"args_get":"1","args_getlist":["1","2"],...}
# Flask Werkzeug → first wins
```

***
