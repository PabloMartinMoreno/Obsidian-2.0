---
aliases:
  - Unkeyed Headers
  - Unkeyed Cookies
  - Unkeyed Method
  - Param Miner Workflow
tags:
  - type/cheatsheet
  - vuln/cache-poisoning
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Web Cache Poisoning]]'
---
# Web Cache Poisoning - Unkeyed Inputs

***

## Headers No Incluidos en Cache Key

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Host` | Cambiar Host → ¿response distinto pero MISMO cache key? | Vector clásico — apps con vhost routing. |
| `X-Forwarded-Host` | Override Host backend-side | Comúnmente unkeyed + reflejado. |
| `X-Forwarded-Scheme` / `X-Forwarded-Proto` | Force scheme http/https | Redirect injection. |
| `X-Forwarded-Port` | Force port | URL building. |
| `X-Original-Url` / `X-Rewrite-Url` | Path override interno | IIS-specific. |
| `X-Forwarded-For` / `X-Real-IP` | IP override | Auth bypass. |
| `Referer` | Reflejado en logs / pages | XSS via Referer. |
| `User-Agent` | Reflejado en error pages | Cross-site UA reflection. |
| `Accept-Language` | Reflejado en localized pages | i18n vector. |
| `Cookie` | Solo SOME cookies en cache key — otras unkeyed | Hidden via per-config. |
| `Origin` | CORS-related reflection | XSS via Origin. |
| `X-Forwarded-Server` | Backend identification leak | Rare. |
| `X-Host` | Custom Host override | Apps custom. |
| `X-Override-URL` | Path rewriting | Edge. |
| `X-HTTP-Method-Override` | Method override → distinct response | Combo vector. |
| `Forwarded` | RFC 7239 forwarding | Modern std. |
| Custom app headers | `X-API-Version`, `X-Tenant-ID`, etc | App-specific reflexion. |
^wcp-unkeyed-headers

### Workflow para identificar unkeyed header

```bash
# Setup baseline
URL="https://target/page?cb=$(date +%s)"

# 1. Sin header probado
curl -sI "$URL" | grep -i x-cache
curl -sI "$URL" | grep -i x-cache  # Hit confirma cache

# 2. Mismo URL pero con header sospechoso
URL2="https://target/page?cb=$(date +%s)-2"
curl -sI -H "X-Forwarded-Host: evil.com" "$URL2" | grep -i x-cache
curl -sI "$URL2" | grep -i x-cache  # Sin el header

# Si segundo request HIT con misma response del primero → header UNKEYED
# (cambió response pero no cache key)
```

___

## Param Miner Workflow

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → BApp Store → "Param Miner" | Free Burp ext (PortSwigger). |
| Right-click request → "Guess headers" | Detecta headers ocultos que afectan response | Single click. |
| Right-click → "Guess params" | Detecta query params ocultos | Same idea. |
| Settings → "Cache poisoning detection" | Toggle modo cache | Habilita probes específicos. |
| Settings → "Force cache miss" | Aplica cache buster auto | Necesario para identificar. |
| Wordlist default | Lista interna de 200+ headers comunes | Comprehensive. |
| Custom wordlist | Settings → custom word file | Extender. |
| Output panel | "Param Miner" tab muestra findings | Headers + params encontrados. |
| Reflexion detection | Auto-marca headers que se reflejan | Pre-XSS hint. |
| Settings → "Identify cache key" | Modo dedicado para mapear cache key | Pasivo. |
| Settings → "Probe identifier" | Identificador único per probe | Tracking. |
| Hosts list | Filtra solo target en scope | Scope discipline. |
^wcp-unkeyed-paramminer

### Setup Param Miner workflow

```
1. Burp → Proxy → HTTP history
2. Identificar request con response cacheable (Age > 0, Cache-Control public).
3. Right-click → Guess headers
4. Settings checked:
   ☑ Force cache miss
   ☑ Reflect to attack mode
   ☑ Probe twice to confirm
5. Run — Param Miner ejecuta 200+ probes
6. Output panel revela:
   - Headers reflejados → XSS candidate
   - Headers que cambian response sin cache key → POISONING vector
   - Params ocultos → SSRF / RCE candidates
```

___

## Method / Path Normalization Differences

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Trailing slash | `GET /admin/` vs `GET /admin` | Cache key per path string — backend normaliza ambos al mismo handler → cache poisoning. |
| Doble slash | `GET //admin` o `GET /admin//` | Cache trata como distinto path — backend normaliza. |
| Encoded slash | `GET /admin%2F` | Cache key includes encoded — backend decodes. |
| Encoded chars en path | `/p%61ge` (= `/page`) | Same. |
| Path traversal canonical | `/foo/../page` | Cache no normaliza → backend sí. |
| Case sensitivity | `/Page` vs `/page` | Some caches case-sensitive, backends no (Windows/IIS). |
| Query order | `?a=1&b=2` vs `?b=2&a=1` | Cache key string-based vs sorted. |
| Duplicate params | `?a=1&a=2` | Cache key contiene exact, backend toma uno. |
| Empty value | `?a=` vs `?a` | Cache key distinto, backend igual. |
| Hash fragment | `#section` (NO sent al server) | NO afecta cache pero útil para client redirects. |
| HTTP/1.0 vs 1.1 | Some caches segregan por version | Edge. |
| HEAD vs GET | HEAD response cached as GET | Separate vectors. |
| Method override | POST con `X-HTTP-Method-Override: GET` | Backend treats as GET, cache as POST. |
| Webhook callback | App fetches URL → cached entonces | Indirect. |
^wcp-unkeyed-normalization

### Path normalization probe

```bash
# Backend normaliza /// a /
# Cache trata cada uno distinto

URL_BASE="https://target/admin"
URL_DOUBLE="https://target//admin"
URL_TRAILING="https://target/admin/"

# Si todos return same content pero cache HIT distinto en cada:
for u in "$URL_BASE" "$URL_DOUBLE" "$URL_TRAILING"; do
  echo "=== $u ==="
  curl -sI "$u" | grep -iE 'x-cache|age'
done
```

***
