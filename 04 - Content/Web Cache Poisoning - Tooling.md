---
aliases:
  - Param Miner
  - WCVS
  - Web Cache Vulnerability Scanner
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
  - '[[Burp Suite]]'
---
# Web Cache Poisoning - Tooling

***

## Param Miner (Burp Extension)

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → BApp Store → "Param Miner" | Free PortSwigger tool. |
| Settings → cache poisoning detection | Toggle modo | Habilita probes. |
| Right-click request → "Guess headers" | Auto-discover unkeyed | Single click. |
| Right-click → "Guess params" | Discover query params | Same. |
| Force cache miss option | Auto cache buster | Reliable detection. |
| Reflect to attack option | Highlight reflexion | Pre-XSS hint. |
| Probe twice option | Confirm hit consistently | Reduces FP. |
| Custom wordlist | Settings → wordlist file | Extender lista. |
| Diff response detection | Auto-compara responses | Visual diff. |
| Output panel | Tab "Param Miner" | Findings list. |
| Combine con scanner | Burp Active Scan + Param Miner enabled | Comprehensive. |
| Bonus features | Hostnames mining, JSON params, custom protocols | Advanced. |
^wcp-tool-param-miner

___

## HTTP Request Smuggler (Combo)

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → "HTTP Request Smuggler" | PortSwigger ext. |
| Smuggle attack panel | Right-click request → Smuggle attack | Setup interactivo. |
| Cache poisoning via smuggle | Smuggle request response cacheada como otra URL | Combo HRS + cache. |
| Validate timing | Tool valida que smuggle desync funciona | Pre-cache test. |
| Combine con Param Miner | Smuggle + unkeyed header detection | Multi-vector. |
| Send to Repeater | Manual fine-tuning | Standard. |
| Auto-validate cache effect | Re-fetch URL después de smuggle | Confirma poison. |
| Output | Findings with "Cache poisoning via smuggling" tag | Clear evidence. |
^wcp-tool-smuggler

### HRS + cache poison workflow

```
1. Identificar HRS vector (CL.TE / TE.CL).
2. Smuggle response del path X cacheada como path Y.
3. Después de smuggle, refetch path Y normalmente.
4. Cache hit con response del path X → poisoning confirmado.
```

___

## Web Cache Vulnerability Scanner (WCVS)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/Hackmanit/Web-Cache-Vulnerability-Scanner` | Go-based scanner. |
| Compile | `go build -o wcvs main.go` | Si binario no preempaquetado. |
| Quick scan | `./wcvs -u https://target/` | Default checks. |
| Verbose | `./wcvs -u https://target/ -v` | Debug. |
| Custom headers | `./wcvs -u https://target/ -hd "Cookie: session=..."` | Authenticated. |
| Threads | `-t 10` | Parallel probes. |
| Output JSON | `-o results.json` | Reportable. |
| Test específicos | `--test xss-host` | Solo XSS via Host. |
| Wordlist custom | `-w headers.txt` | Custom unkeyed list. |
| Generators | Tool genera variantes auto | Smart fuzzing. |
| HRS combo mode | Si HRS detectado, prueba cache combo | Combinable. |
| Logger output | Detallado por vector | Forensics. |
^wcp-tool-wcvs

___

## Manual curl / Burp Repeater

| **Workflow** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Cache buster setup | `URL="https://target/page?cb=$(date +%s)"` | Force MISS inicial. |
| Verify cacheable | `curl -sI "$URL" | grep -i x-cache` | HIT en segundo request. |
| Probe header unkeyed | `curl -sI -H "X-Probe: x" "$URL"; curl -sI "$URL"` | Diff comparison. |
| Loop probe headers | Bash loop sobre lista de headers | Manual mining. |
| Send group single conn (Burp) | Repeater → "Send group → in single connection" | Para HRS. |
| Diff responses (Burp Comparer) | Send 2 responses → Comparer → Words/Bytes | Visual diff. |
| Burp Repeater "Cached?" check | Repeater muestra cache headers en response | Quick validate. |
| ZAP cache poisoning addon | OWASP ZAP tiene addon | Free alternative. |
| Custom Python script | requests + diff | Para automatizar bulk URLs. |
| Tampermonkey for client testing | Inject probe headers via browser | Client-side checking. |
^wcp-tool-manual

### Workflow manual completo

```bash
TARGET="https://target/page"
HEADERS=(
  "X-Forwarded-Host"
  "X-Forwarded-Scheme"
  "X-Forwarded-Proto"
  "X-Forwarded-For"
  "X-Original-Url"
  "X-Rewrite-Url"
  "X-Forwarded-Server"
  "Forwarded"
  "X-Host"
  "X-Real-IP"
  "X-Originating-IP"
  "Origin"
  "Referer"
  "User-Agent"
)

for h in "${HEADERS[@]}"; do
  CB=$(date +%s%N)
  URL="$TARGET?cb=$CB"

  # Probe with header
  R1=$(curl -s -H "$h: cache-poison-probe" "$URL")

  # Probe without header (should be cached)
  R2=$(curl -s "$URL")

  # Compare
  if [ "$(echo "$R1" | wc -c)" != "$(echo "$R2" | wc -c)" ]; then
    echo "[!] $h → response length differs (potential unkeyed)"
  fi

  if echo "$R2" | grep -q "cache-poison-probe"; then
    echo "[!!!] $h → header REFLECTED in cached response (CONFIRMED POISONING)"
  fi
done
```

***
