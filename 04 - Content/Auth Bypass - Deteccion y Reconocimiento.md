---
aliases:
  - Auth Bypass Detection
  - Auth Recon
  - Username Enum
tags:
  - type/technique
  - vuln/auth-bypass
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Authentication & Authorization Bypass]]'
---
# Auth Bypass - Detección y Reconocimiento

***

## Identificar Endpoints Auth / Authz

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `/login`, `/signin`, `/auth` | Login form | Auth principal. |
| `/logout`, `/signout` | Logout | Session destroy. |
| `/register`, `/signup` | User creation | Mass Assignment vector. |
| `/forgot`, `/reset` | Password reset | HHI + token poisoning. |
| `/verify`, `/confirm` | Email verify | Token-based. |
| `/2fa`, `/otp`, `/mfa` | Multi-factor | 2FA bypass vectors. |
| `/admin` | Admin panel | Path-based ACL. |
| `/dashboard`, `/profile` | Authenticated views | Forced browsing. |
| `/api/users/*` | User mgmt API | IDOR / mass assign. |
| `/api/admin/*` | Admin API | Privesc target. |
| OAuth `/oauth/authorize` | OAuth flow | redirect_uri vector. |
| OAuth `/oauth/token` | Token exchange | Code/secret abuse. |
| SAML `/saml/sso` | SAML flow | Assertion abuse. |
| `/api/refresh` | Token refresh | Long-lived access. |
| Endpoints with role check | `if user.role == 'admin'` | Server-side check. |
| RBAC endpoints | `/team/X/admin/*` | Multi-tenant. |
| Custom auth headers | `X-API-Key`, `Authorization: Bearer` | Token-based. |
| Magic link routes | `/auth/magic/{token}` | Token consume. |
| WebSocket auth | WS handshake con Authorization | Real-time. |
^auth-detect-endpoints

___

## Username Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Login response diff | `Invalid user` vs `Invalid password` | Direct enum. |
| Generic message uniformization | `Invalid credentials` (safe) | Indistinguible — bypass-able via timing. |
| Timing attack | Valid user → DB query takes longer | Statistical inference. |
| Account creation | `Username already taken` error | Direct enum. |
| Password reset | `Email sent` vs `Email not found` | Standard mistake. |
| Forgot password forms | Same idea | Common. |
| Profile lookup | `/api/users/<email>` returns 200 vs 404 | API leak. |
| API search | `?email=victim@x.com` returns matching profile | Discovery. |
| Public profile pages | `/u/username` exists vs 404 | Scraping. |
| Sitemap leak | If sitemap contains user pages | OSINT. |
| Social media OSINT | LinkedIn, GitHub for usernames | Pre-attack. |
| Email pattern guess | `firstname.lastname@target.com` | Common patterns. |
| OAuth redirect to email | Some flows leak email format | Edge. |
| Password complexity hint | `Password must include username` reveals user | Edge bug. |
| Avatar URLs | `/avatar/<username>.png` returns 200 | Image-based enum. |
| Rate limit per-user | Distinct rate limits hint user existence | Side channel. |
| 2FA reactions | "Send code to ***@target.com" reveals partial email | Disclosure. |
^auth-detect-enum

### Probes para detectar diff de response

```bash
# Test response diff
INVALID_USER="thisisclearlyfake_$(date +%s)"
VALID_USER="admin"  # known existing

curl -s -X POST -d "username=$INVALID_USER&password=wrong" https://target/login \
  > /tmp/invalid.html
curl -s -X POST -d "username=$VALID_USER&password=wrong" https://target/login \
  > /tmp/valid.html

diff /tmp/invalid.html /tmp/valid.html
# Cualquier diff → username enumeration

# Timing attack
for u in admin alice bob charlie; do
  T=$(curl -s -o /dev/null -w '%{time_total}' \
       -X POST -d "username=$u&password=wrong" https://target/login)
  echo "$u: $T"
done
# Valid usernames consistently slower → enum confirmed
```

___

## Logic Flaw Recon

| **Multi-step flow** | **Probe** | **Vector candidate** |
|:---:|:---:|:---:|
| Password reset flow | Map all steps: request → token → reset | Token reuse, race, skip step. |
| 2FA enrollment | Setup → confirm → enable | Skip confirmation. |
| 2FA verification | Login → OTP entry → verified | OTP race / replay. |
| Magic link flow | Request → email → click → auth | Token reuse, expiry. |
| OAuth flow | Authorize → callback → token exchange | redirect_uri, state, code reuse. |
| Email change | Request new email → confirm | Skip confirm. |
| Account merge | Confirm both sides | Race confirm. |
| Forgot username | Recovery via email | Account takeover. |
| Phone verification | SMS OTP flow | Same vectors as 2FA. |
| Profile update | Email + verify new email | Email hijack. |
| Subscription change | Change tier → confirm | Skip confirm = free upgrade. |
| Multi-step purchase | Cart → payment → confirm | Skip payment. |
| Sign-in via SSO | OAuth/SAML returns to app | State / nonce missing. |
| Account recovery | Multi-method recovery | Bypass primary recovery. |
| Session refresh | Refresh token rotation | Replay refresh tokens. |
^auth-detect-flow

### Workflow recon

```
1. Map flow (Burp captures todos los requests):
   - Step 1: POST /forgot → email sent
   - Step 2: GET email → click link → /reset?token=...
   - Step 3: POST /reset → new password set
   - Step 4: POST /login → authenticated

2. Identify validation per step:
   - Token signed? (decode if JWT)
   - State / nonce? (CSRF / replay)
   - Single-use? (race / reuse vector)
   - Expiry? (replay window)
   - Tied to user / IP / session? (transferability)

3. Identify skip points:
   - Direct request a step 3 sin step 2?
   - Modify token to bypass check?
   - Race condition entre validate y consume?

4. Identify chain potential:
   - Password reset + HHI = ATO via email
   - 2FA bypass + race = brute force OTP
   - OAuth state missing = CSRF + token theft
```

***
