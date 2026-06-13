---
aliases:
  - WCP Detection
  - Cache Detection
  - Cache Hit Miss
tags:
  - vuln/cache-poisoning
  - technique/discovery
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
  - "[[Web Cache Poisoning]]"
---
# Web Cache Poisoning - Detección y Reconocimiento

---

## Identificar Capa de Caché

| **Indicator** | **Header / Pattern** | **Stack identificado** |
|:---:|:---:|:---:|
| Cloudflare | `Server: cloudflare` + `cf-cache-status: HIT/MISS/BYPASS` | CDN tier 1. |
| Akamai | `X-Cache: TCP_HIT from akamai` | Enterprise CDN. |
| Fastly | `X-Served-By: cache-iad-...` + `X-Cache: HIT/MISS` | Modern CDN. |
| AWS CloudFront | `X-Cache: Hit from cloudfront` + `Via: 1.1 ...amazonaws.com` | AWS-managed. |
| Azure CDN | `X-Cache: TCP_HIT from ...` + `X-Azure-Ref` | Microsoft. |
| Varnish | `X-Varnish: <id>` + `Age: N` | On-prem cache. |
| Apache Traffic Server | `Server: ATS/...` + `Age` | On-prem. |
| Squid | `X-Cache: HIT from <host>` + `Via: 1.1 squid` | Forward proxy. |
| nginx proxy_cache | `X-Cache-Status: HIT` (custom header common) | Reverse proxy. |
| KeyCDN / BunnyCDN | `Server: keycdn-engine` / `cdn.bunny.net` | Smaller CDN. |
| Header `Age` presente | Indica response cacheada | Universal indicator. |
| Header `Cache-Control: public, max-age=N` | Configurada para cachear | Default público. |
| Header `Vary` | Indica qué headers afectan cache key | Lookup carefully. |
| Sin headers de cache | Posible cache transparente | Probe activos. |
| Multi-tier | `Via:` con múltiples saltos | Chain de caches. |
^wcp-detect-layer

### Probes pasivos

```bash
# Inspeccionar headers de cualquier endpoint
curl -I https://target/

# Buscar indicadores
curl -sI https://target/ | grep -iE 'x-cache|cache-control|cf-cache|age|via|x-varnish|x-served-by|server'

# Multi-request para ver Age incrementar
for i in 1 2 3; do
  curl -sI https://target/ | grep -i 'age:'
  sleep 2
done
# Si Age incrementa cada request → cache misma copia
```

---

## Análisis del Cache Key

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Cache key = hash de (method + URL + algunos headers). Inputs no incluidos en key = unkeyed → vector. | Critical concept. |
| Default cache key | Generalmente método + path + query | Sin headers (default). |
| `Vary: Accept-Encoding, User-Agent` indica qué headers SÍ están en key | Vary header | Lookup obligatorio. |
| Cache key explícito | Cloudflare Page Rules, Akamai config, etc | Per-platform. |
| Hidden cache key params | Algunos CDN incluyen ciertas cookies en key | Edge case. |
| `Cache-Control: private` | NO debería cachear — pero algunos proxies viejos sí | Anomaly. |
| `Cache-Control: no-store` | Strict no cache | Should respect. |
| `Cache-Control: no-cache` | Validate before serve | Less strict. |
| `Pragma: no-cache` | Legacy HTTP/1.0 | Backwards compat. |
| `Authorization` header | Generalmente NO cacheable por default | Per RFC. |
| Cookie-based cache | Sites custom que cachean por cookie value | Variation. |
| Per-region cache key | CDN edge node específico | Geo-distributed. |
^wcp-detect-cachekey

### Workflow para mapear cache key

```bash
# 1. Establecer baseline — request normal
curl -sI 'https://target/page' | grep -iE 'x-cache|age'
# Result: MISS or HIT?

# 2. Request idéntica de nuevo
curl -sI 'https://target/page' | grep -iE 'x-cache|age'
# Si HIT con Age incrementando → cacheado

# 3. Cambiar header — ¿afecta cache key?
curl -sI -H "User-Agent: test1" 'https://target/page' | grep -iE 'x-cache|age'
curl -sI -H "User-Agent: test2" 'https://target/page' | grep -iE 'x-cache|age'
# Si distinto X-Cache → User-Agent en key
# Si mismo HIT → User-Agent unkeyed

# 4. Iterar headers candidatos:
for h in X-Forwarded-Host X-Original-Url X-Forwarded-Proto X-Forwarded-Scheme \
         X-Forwarded-For X-Real-IP Referer Origin Cookie X-Requested-With; do
  echo "=== $h ==="
  curl -sI -H "$h: probe1" "https://target/page" | grep -iE 'x-cache|age'
done
```

---

## Probes Hit/Miss

| **Header** | **Valor típico** | **Significado** |
|:---:|:---:|:---:|
| `X-Cache: HIT` | Servida desde cache | Cached. |
| `X-Cache: MISS` | Generada fresh | Sin cache hit. |
| `X-Cache: BYPASS` | Cache deliberadamente bypassed | Per-config. |
| `X-Cache: REVALIDATED` | Cache existed pero validó con origin | Conditional. |
| `X-Cache: STALE` | Cache expirada pero servida (graceful) | Stale-while-revalidate. |
| `X-Cache: EXPIRED` | Cache expiró | Should refetch. |
| `Age: N` | Segundos desde generación | Si > 0 → cache hit. |
| `Cf-Cache-Status: HIT/MISS/EXPIRED/BYPASS/DYNAMIC` | Cloudflare-specific | Check value. |
| `Cf-Cache-Status: DYNAMIC` | Cloudflare no cachea por default | Indicator. |
| `X-Cache-Hits: N` | Counter de hits | Observabilidad. |
| `X-Served-By: cache-...` | Fastly node | Edge hint. |
| Response Time | HIT << MISS típicamente | Timing oracle indirecto. |
| Response Length | Constante para HIT, variable MISS | Size oracle. |
| ETag / Last-Modified | Conditional GET → 304 si cacheado | Validation. |
^wcp-detect-hitmiss

### Cache buster pattern

```bash
# Para evitar cache hit durante testing
URL="https://target/page?cb=$(date +%s)"
# Cada request URL distinta → nunca hit
```

```bash
# Para forzar cache miss inicial + hit subsiguiente
TIMESTAMP=$(date +%s)
URL="https://target/page?test=$TIMESTAMP"

# Request 1: MISS
curl -sI "$URL" | grep -i x-cache
# Request 2 dentro del TTL: HIT
curl -sI "$URL" | grep -i x-cache
```

---
