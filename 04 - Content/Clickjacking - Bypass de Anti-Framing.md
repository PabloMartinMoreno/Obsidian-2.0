---
aliases:
  - Frame Busting Bypass
  - Sandbox Bypass
  - X-Frame-Options Bypass
tags:
  - type/cheatsheet
  - vuln/clickjacking
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Clickjacking]]'
---
# Clickjacking - Bypass de Anti-Framing

***

## JS Frame-Busting Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `if (top != self) top.location = self.location` | `<iframe sandbox>` removes script execution | Sandbox bypass. |
| `if (top != self) top.location.replace(self.location)` | Same | Same. |
| `if (window != top) top.location = window.location` | Same | Same. |
| `parent.location = self.location` | Sandbox | Same. |
| Combine con `delete top.location` | Old browsers — defunct | Legacy. |
| `<base target="_top">` | Force frame target | Edge. |
| Frame-busting busting (atacante side) | Override `top.location` setter | Standard bypass. |
| Set `location.href` setter | Atacante's parent intercepts | Old browsers. |
| `onbeforeunload` handler | Cancel navigation event | Standard. |
| `setInterval` continuous override | Race condition | Edge. |
| Combine con `<noscript>` block | If JS disabled | Edge fallback. |
| Modern frame-busting | Use CSP frame-ancestors instead | Defense. |
| Document.write trick | Edge legacy | Old browsers. |
| Sandbox without `allow-scripts` | Removes JS entirely | Standard bypass. |
^cj-bypass-jsbusting

### Sandbox bypass PoC

```html
<!DOCTYPE html>
<html>
<body>
<iframe src="https://target.com/page-with-frame-busting" 
        sandbox="allow-forms allow-same-origin"
        style="opacity:0.001;width:100%;height:100%"></iframe>
<!--
sandbox attribute:
  - Removes script execution if 'allow-scripts' not specified
  - Frame-busting JS doesn't execute
  - But forms still work (allow-forms)
  - User can still click iframe
-->
</body>
</html>
```

___

## Sandbox Attribute Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe sandbox>` | Most restrictive — no scripts, forms, plugins, navigation | Standard bypass. |
| `sandbox="allow-forms"` | Forms work, scripts disabled | Form-based attacks. |
| `sandbox="allow-same-origin"` | Same-origin policy enforced | Edge. |
| `sandbox="allow-scripts"` | Scripts work | Defeats sandbox. |
| `sandbox="allow-top-navigation"` | Frame can navigate parent | Combine. |
| `sandbox="allow-popups"` | Popups | Edge. |
| `sandbox="allow-pointer-lock"` | Pointer manipulation | Edge cursor-jacking. |
| Combine values con space | `sandbox="allow-forms allow-same-origin"` | Multi-flag. |
| No `allow-scripts` | Disables frame-busting JS | Standard bypass. |
| `seamless` attribute | Deprecated en HTML5 | Legacy. |
| `allowfullscreen` | Full-screen mode | Combine fullscreen abuse. |
| `loading="lazy"` | Lazy load | Edge. |
| Combine con `srcdoc` | Inline content sandbox | Edge. |
| Browser-specific behaviors | Per-browser sandbox enforcement | Edge. |
^cj-bypass-sandbox

___

## X-Frame-Options Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ALLOW-FROM` deprecated | Modern browsers ignore | Bypass via CSP if XFO ALLOW-FROM. |
| Old IE / browser-specific | XFO inconsistent support | Edge. |
| Subdomain con SAMEORIGIN | Frame from `evil.target.com` if subdomain takeover | SDT combo. |
| CSP missing | Only XFO active → some bypass via CSP precedence | Edge. |
| HTML form submission | XFO doesn't block forms | Forms still submitable. |
| Image src cross-origin | XFO doesn't block images | Limited utility. |
| `<object>` / `<embed>` | XFO may not apply | Edge legacy. |
| Combine con MIME sniffing | If app serves frame-allowed page from one path | Per-app. |
| Per-route XFO | Some routes protected, others not | Granular bypass. |
| HTTP/HTTPS confusion | Legacy mixed-content scenarios | Edge. |
| Internal vs external XFO | Different policies | Edge. |
| Apache misconfig | XFO header on certain paths only | Edge. |
| CDN strip XFO | Some CDNs may strip headers | Misconfig. |
| Combine con browser zoom abuse | Modern browser display tricks | Edge. |
^cj-bypass-xfo

___

## CSP frame-ancestors Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Wildcard subdomain | `frame-ancestors *.target.com` → atacante claims subdomain | SDT combo. |
| `frame-ancestors *` | Permissive — direct framing | Misconfig. |
| Specific allowed domain | Atacante compromises allowed domain | XSS chain. |
| CDN-allowed origin | If CDN domain trusted, atacante's CDN content frames | Edge. |
| `data:` allowed | Frames con data URI | Edge. |
| `blob:` allowed | Frames con blob URLs | Edge. |
| Per-page CSP differences | Some pages no frame-ancestors | Granular. |
| CSP missing on subdirectory | App config inconsistent | Misconfig. |
| Sandbox vs frame-ancestors | Different defenses | Combine. |
| Old browsers no CSP support | Pre-Chrome 28 / Firefox 23 | Legacy users. |
| Browser quirks | Per-version CSP enforcement | Edge. |
| Combine con SDT | Subdomain Takeover defeats wildcard | Standard chain. |
| XSS en allowed origin | Compromise allowed origin | Compound. |
| `frame-ancestors 'self'` con OAuth flow | OAuth pages still framed via OAuth client | Edge. |
^cj-bypass-csp

___

## Browser Quirks y Edge Cases

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Old IE compatibility | XFO inconsistent en IE 8/9 | Legacy. |
| Firefox `frame-ancestors` | Modern browsers all support | Standard. |
| Chrome strict mode | Most strict | Default. |
| Safari WebKit quirks | Per-version | Edge. |
| Mobile WebView | App-embedded browsers | Different rules. |
| `X-Frame-Options` case sensitivity | Some servers case-sensitive | Edge. |
| Header order | Some browsers prefer XFO over CSP | Per-browser. |
| Multiple CSP headers | Each CSP intersects, not overrides | Standard. |
| `report-only` mode | Detection but no enforcement | Edge bypass. |
| HTTP vs HTTPS | XFO sent over HTTP only? | Misconfig. |
| Caching headers | Stale CSP cached | Edge. |
| Edge cache strip | CDN strips frame protection | Misconfig. |
| Origin trial features | Modern browser features | Edge. |
| Combine con `srcdoc` | Inline iframe content | Standard. |
| `<frame>` legacy tag | Pre-iframe alt | Legacy. |
^cj-bypass-quirks

***
