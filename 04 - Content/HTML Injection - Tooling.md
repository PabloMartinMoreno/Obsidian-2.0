---
aliases:
  - HTML Injection Tooling
  - HTML Injection Wordlists
  - Burp DOM Invader
tags:
  - type/cheatsheet
  - vuln/html-injection
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTML Injection]]'
  - '[[Burp Suite]]'
---
# HTML Injection - Tooling

***

## Burp Intruder con HTML Wordlists

| **Workflow** | **Setup** | **Notas** |
|:---:|:---:|:---:|
| Mark position | Identify reflected param → place §...§ | Standard. |
| Sniper mode | Single position, multi-payloads | Default. |
| Battering ram | Same payload all positions | Edge. |
| Pitchfork | Multi-position synced | Combo. |
| Match conditions | Grep extract `<b>TEST</b>`, `</script>`, marker patterns | Validation. |
| Length-based | Sort by Length column | Visual diff. |
| Status code filter | 200 + non-error | Standard. |
| Payload encoding | Auto URL-encode con `%26amp;` setting | Match server expectation. |
| Extension: HTML5 | Specific HTML5 testing | Add-on. |
| BApp Store: "HTML Tag" Bcheck | Burp Pro 2024+ | Active scanner. |
| Settings → Custom payloads | Add own HTML inj wordlist | Custom. |
| Output: marker grep | Visual identify successful inj | Required. |
^htmli-tool-burp-intruder

___

## PayloadsAllTheThings - HTML Injection

| **Wordlist source** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings | https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/HTML%20Injection | Compendium. |
| HTML Injection cheatsheet | Same repo | Standard. |
| SecLists - HTML | `SecLists/Fuzzing/XSS/` (overlapping) | XSS list also helps. |
| HackTricks - HTML Injection | https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting | Sub-section. |
| Custom polyglot | Combine HTML inj con XSS prep | Single-shot. |
| Markdown-to-HTML wordlist | If app processes Markdown | Different vector. |
| Email HTML injection list | https://github.com/EdOverflow/can-i-take-over-xyz | Email-specific. |
| Tag without script | Tags que NO requieren JS pero permiten HTML inject | Useful. |
| Top 50 inject tags | `<a>`, `<img>`, `<form>`, `<iframe>`, `<style>`, `<base>`, `<meta>`, `<link>`, `<svg>`, `<input>` | Quick set. |
| WAF bypass payloads | `pjOFFLE - Polyglot Wordlists` | Known WAF bypass. |
^htmli-tool-wordlists

### Quick HTML inj polyglot

```
<b>POLYGLOT-MARKER</b><img src=x onerror=alert(1)><svg onload=alert(2)><iframe src="//attacker/log"></iframe><base href="//attacker/"><meta http-equiv="refresh" content="0;url=//attacker">
```

Single payload tests:
- Bold tag (`<b>`)
- Image with event handler
- SVG event
- iframe outbound
- Base href hijack
- Meta refresh

___

## Manual Review (Input/Output Mapping)

| **Method** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Burp passive scan | Detect reflected inputs | Built-in. |
| Burp Reflection extension | Highlights reflections en historial | Pasivo. |
| Manual `view-source:` | Inspect raw HTML response | Browser feature. |
| DevTools Inspector | View rendered DOM vs raw HTML | Real-time. |
| Search raw response | grep for input string | Standard. |
| Regex scan response | Detect partial matches con encoding | Custom. |
| Burp Macro chains | Authenticated flow + reflection | Multi-step. |
| Test escape contexts | Attribute, JS, CSS, raw HTML | Per-context. |
| Compare 2 requests | Burp Comparer | Diff response. |
| Logger++ filter | Show only responses con matched input | Pasivo. |
| Ad hoc curl | `curl -s URL | grep INJECTED` | Quick. |
^htmli-tool-manual-review

### Workflow manual

```bash
# 1. Send input con marker
curl -s 'https://target/search?q=HTMLINJ_MARKER<b>x</b>' > response.html

# 2. Check if rendered or escaped
grep -E '<b>x</b>|&lt;b&gt;x&lt;/b&gt;' response.html

# 3. Si rendered → HTML injection confirmed
# 4. Test bypass payloads progressively
for p in '<b>X</b>' '<img src=x>' '<svg>' '<iframe>' '<style>' '<base>' '<meta>'; do
  ENCODED=$(printf '%s' "$p" | jq -sRr @uri)
  R=$(curl -s "https://target/search?q=$ENCODED")
  echo "Payload: $p"
  echo "$R" | grep -oE "$p" | head
done
```

___

## DOM Invader (Burp DOM-side Tools)

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Habilitar | Burp Pro → DOM Invader → Enable | Built-in browser ext. |
| Auto-detect sources | Identifies user input sources | URL params, hash, cookies. |
| Auto-detect sinks | Detects HTML inject sinks (innerHTML, document.write) | Active scanning. |
| Source-to-sink trace | Trace from input al sink | Visual chain. |
| Click-to-test | Auto-test con marker payload | Quick check. |
| postMessage handling | Detect cross-origin postMessage handlers | Edge. |
| prototype pollution | DOM Invader detects PP also | Adjacent vuln. |
| Stack trace export | Save findings | Reportable. |
| Custom source/sink | Manual config si no detecta | Edge. |
| Combinable con Burp Active Scan | Detects HTML inject + XSS | Combo. |
^htmli-tool-dom-invader

___

## Otros Tools y Scripts

| **Tool** | **Uso** | **Notas** |
|:---:|:---:|:---:|
| `dalfox` | XSS / HTML inj scanner | https://github.com/hahwul/dalfox |
| `XSStrike` | Same family | https://github.com/s0md3v/XSStrike |
| `kxss` | Detect reflection en HTML | https://github.com/Emoe/kxss |
| `gxss` | Same | https://github.com/KathanP19/Gxss |
| `nuclei` | Templates for HTML inject | `templates/vulnerabilities/...` |
| Custom `BeautifulSoup` script | Python parser para detect inject | Programmable. |
| `playwright` / `puppeteer` | Headless browser para test rendering | Modern. |
| `selenium` | Same family | Older. |
| `dom-walker` | Custom DOM tree walker | Edge. |
| ZAP active scanner | Free alternative a Burp | OWASP ZAP. |
^htmli-tool-others

***
