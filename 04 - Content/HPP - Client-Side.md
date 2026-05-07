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
| Concept | Frontend JS reads URL params, builds new URLs / actions. Atacante injects duplicate params → manipulates JS behavior. | DOM-based HPP. |
| `URLSearchParams.get('a')` | Returns first param value | If JS uses `get()`. |
| `URLSearchParams.getAll('a')` | Returns array | Different. |
| `location.search.split('&')` | Manual parse → behavior varies | Custom parser. |
| Link href manipulation | Frontend builds link from URL params | Combine con OR. |
| Form action injection | Form action built from params | Phishing chain. |
| AJAX URL building | `fetch('/api?' + location.search)` | Forwards original con HPP. |
| OAuth redirect URL | Frontend processes redirect URL | OAuth chain. |
| Search query forwarding | Frontend re-sends search to backend | Multi-stage. |
| iframe src manipulation | Per-app | Edge. |
| Image src dynamic | Image URL with params | Edge. |
| Combine con XSS | DOM XSS via param confusion | Standard. |
| postMessage URL building | postMessage data forwarded | Cross-frame. |
| Service Worker URL routing | SW intercepts and reroutes | PWA. |
| Custom URL parser | App-specific behavior | Per-app. |
^hpp-client-url

___

## Form Action / Hidden Field Hijack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Form action built from URL param | `<form action="${queryParam.action}">` | Direct. |
| Atacante adds duplicate param | First innocuous, second malicious | Bypass. |
| Hidden input value duplicate | Hidden field with multiple values | Edge. |
| Inject form action a attacker | Form submits to atacante's URL | Phishing. |
| Hijack login form action | Steal credentials | High impact. |
| Hijack reset password form | Hijack password change | ATO. |
| Combine con DOM XSS | Atacante adds field via JS | Compound. |
| Multi-step form param forward | Each step preserves params | Privilege escalation across steps. |
| Combine con CSRF | CSRF + HPP form override | Multi-vector. |
| File upload form | Hijack upload destination | Data exfil. |
| Select option duplicate | Multiple `<option>` con same value | Logic confusion. |
| Force default selection | If first wins | UI hijack. |
^hpp-client-form

___

## Encoded Param Confusion

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| URL-encoded duplicate name | `?a=1&%61=2` (`%61` = `a`) | Frontend filters first, backend decodes second. |
| Doble encoded | `?a=1&%2561=2` (`%2561` decodes a `%61` then `a`) | Multi-decode. |
| Unicode equivalent | `?a=1&ａ=2` (full-width `ａ`) | If parser normalizes. |
| Mixed case | `?a=1&A=2` | Case sensitivity. |
| URL fragment ignored | `?a=1#&a=2` (after `#` not sent) | NOT useful server-side. |
| Plus sign vs space | `+` decoded a space | Edge URL form encoding. |
| Backslash vs forward | `?a=1\&a=2` literal | Edge. |
| Newline in param value | `?a=value1\na=value2` | Body context. |
| Tab / control chars | Edge encoding | Per-parser. |
| BOM bytes | `\xef\xbb\xbf?a=1` | Edge. |
| Encoded ampersand | `?a=1%26a=2` (literal `&`) | NOT splitting — single value. |
| Combine con unicode lookalikes | `?Α=1&А=2` (Greek/Cyrillic A) | Visual confusion. |
^hpp-client-encoded

___

## JS-Based Parsing Differences

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `URLSearchParams.get('a')` | Returns first | Standard JS. |
| `URLSearchParams.getAll('a')` | Returns array | Explicit multi. |
| Manual split `'&'` parsing | Behavior varies | Custom code. |
| jQuery `$.param` | Standard parsing | jQuery-specific. |
| qs library (Express + frontend) | Array parsing | Common Node frontend. |
| React Router params | Per-version | Library-specific. |
| Vue Router params | Same | Same. |
| Angular ActivatedRoute | Per-version | Same. |
| Custom hash parsing | `location.hash.slice(1)` parse | Custom. |
| Service Worker | Cache key may include URL | Edge. |
| Browser inconsistency | Different browsers parse identically en URL bar but JS parsing varies | Per-browser. |
| Combine con prototype pollution | `?__proto__[a]=1` parsed via merge | Standard PP. |
| Combine con DOM XSS | Param value reflected en JS | XSS. |
| iframe URL inheritance | iframe inherits parent URL | Edge. |
^hpp-client-js

### Workflow client-side HPP

```javascript
// Vulnerable code (frontend)
const params = new URLSearchParams(location.search);
const action = params.get('action');
const target = params.get('target');

// App builds redirect
location.href = `https://api.target.com/${action}/${target}`;

// Atacante's URL:
// https://target.com/?action=transfer&action=delete&target=victim&target=attacker

// Behavior:
// - URLSearchParams.get('action') → 'transfer' (first wins)
// - URLSearchParams.get('target') → 'victim' (first wins)
// - But if backend has different parsing → action=delete on attacker
```

***
