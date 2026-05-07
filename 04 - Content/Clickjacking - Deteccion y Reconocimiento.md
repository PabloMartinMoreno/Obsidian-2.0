---
aliases:
  - Clickjacking Detection
  - X-Frame-Options Check
  - CSP frame-ancestors
tags:
  - type/cheatsheet
  - vuln/clickjacking
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Clickjacking]]'
---
# Clickjacking - Detección y Reconocimiento

***

## Headers Check

| **Header** | **Value seguro** | **Significado** |
|:---:|:---:|:---:|
| `X-Frame-Options: DENY` | Strictest | NO frames anywhere. |
| `X-Frame-Options: SAMEORIGIN` | Same-origin only | Same domain frames OK. |
| `X-Frame-Options: ALLOW-FROM <uri>` | Specific origin | Browser support inconsistent. |
| `X-Frame-Options` ausente | Vulnerable | No protection inherent. |
| `Content-Security-Policy: frame-ancestors 'none'` | Strictest CSP | Modern equivalent. |
| `Content-Security-Policy: frame-ancestors 'self'` | Same-origin | Modern. |
| `Content-Security-Policy: frame-ancestors *` | Permissive | Vulnerable. |
| `Content-Security-Policy: frame-ancestors 'self' https://allowed.com` | Allowlist | Per-domain. |
| Both XFO + CSP | Defense en depth | Best practice. |
| Custom header `X-XSS-Protection` | NOT clickjacking-specific | Adjacent. |
| Combine con CSP report URI | Reports framing attempts | Detection-friendly. |
| Per-page headers | Different policies per route | Granular control. |
| Default-src CSP | Doesn't replace frame-ancestors | Specific directive needed. |
| Strict-Transport-Security | Adjacent (HTTPS protection) | Defense en depth. |
| Permissions-Policy | Modern feature gating | Edge framing controls. |
^cj-detect-headers

### Probe rápido

```bash
TARGET="https://target.com/"

# Check headers
curl -sI "$TARGET" | grep -iE 'x-frame-options|content-security-policy'

# Cases:
# 1. Missing both → vulnerable
# 2. X-Frame-Options: DENY → safe
# 3. X-Frame-Options: SAMEORIGIN → safe
# 4. CSP frame-ancestors 'none' → safe
# 5. CSP frame-ancestors 'self' → safe (cross-site framing blocked)
# 6. CSP frame-ancestors * → vulnerable

# Check per-route (different routes may have different policies)
for path in / /login /admin /transfer /settings; do
  echo "=== $path ==="
  curl -sI "${TARGET}${path}" | grep -iE 'x-frame|frame-ancestors'
done
```

___

## CSP Analysis

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `frame-ancestors 'none'` | Strictest — no frames | Modern strict. |
| `frame-ancestors 'self'` | Only same-origin frames | Standard. |
| `frame-ancestors 'self' https://allowed.com` | Allowlist | Per-domain. |
| `frame-ancestors *` | Any origin | Vulnerable (anti-pattern). |
| `frame-ancestors *.target.com` | Subdomain wildcard | Subdomain Takeover combo. |
| `frame-ancestors data:` | Data URLs frame | Edge unusual. |
| `frame-ancestors blob:` | Blob URLs | Edge. |
| Multiple ancestors | Comma/space separated | Standard. |
| `frame-ancestors` overrides X-Frame-Options en modern browsers | Modern CSP wins | Standard. |
| Report-Only mode | Detection but no enforcement | Edge. |
| Combine con `script-src` | Defense in depth | Standard CSP. |
| `child-src` legacy | Replaced by `frame-ancestors` | Legacy. |
| Per-route CSP | Different policies per page | Granular. |
| Combine con SRI | Subresource Integrity | Adjacent. |
| Browser support | Modern browsers all support | Universal. |
^cj-detect-csp

___

## Framing Test

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inline iframe test | `<iframe src="https://target/"></iframe>` en HTML local | Standard. |
| Per-route framing | Test each sensitive route independently | Granular. |
| Sensitive endpoints | `/admin`, `/transfer`, `/settings`, `/profile` | High-value. |
| Authenticated framing | Login first, then frame as victim | Realistic test. |
| Sandbox attribute | `<iframe sandbox>` removes JS protections | Bypass framebusters. |
| Console framing errors | Browser DevTools shows framing block | Direct feedback. |
| `Refused to display ... in a frame` | Standard error | Indicates protection. |
| Successful render | Page loads normally en iframe | Vulnerable. |
| Visual confirmation | iframe content visible | UX confirm. |
| Burp passive scan | Detects framing protection | Pasivo. |
| Online tools | clickjacking.com, online testers | Quick check. |
| Multiple browsers | Different browsers may behave differently | Edge. |
| Subdomain framing | If `frame-ancestors *.target.com` | Subdomain abuse. |
| Combine con SDT | Sub takeover + framing | Trust transfer. |
^cj-detect-framing

### Quick framing PoC

```html
<!DOCTYPE html>
<html>
<head><title>Clickjacking Test</title></head>
<body>
  <h1>Test framing</h1>
  <iframe src="https://target.com/admin/critical-action" 
          width="800" height="600"></iframe>
  <script>
    // Detect if frame loaded
    document.querySelector('iframe').onload = () => {
      console.log('Frame loaded — VULNERABLE');
    };
  </script>
</body>
</html>
```

Save as `test.html`, open en browser. If iframe renders target's content → vulnerable.

***
