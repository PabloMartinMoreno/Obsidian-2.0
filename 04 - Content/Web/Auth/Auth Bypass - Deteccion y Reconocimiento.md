---
aliases:
  - Auth Bypass Detection
  - Auth Recon
  - Username Enum
tags:
  - vuln/auth-bypass
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Authentication & Authorization Bypass]]"
---
# Auth Bypass - Detección y Reconocimiento

---

## Identificar Endpoints Auth / Authz

| **Endpoint** | **Qué obtenés** | **Cuándo** |
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
| `if user.role == 'admin'` | Endpoints with role check | Server-side check. |
| `/team/X/admin/*` | RBAC endpoints | Multi-tenant. |
| `X-API-Key`, `Authorization: Bearer` | Custom auth headers | Token-based. |
| `/auth/magic/{token}` | Magic link routes | Token consume. |
| WebSocket auth | WS handshake con Authorization | Real-time. |
^auth-detect-endpoints

---

## Username Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Invalid user` vs `Invalid password` | Login response diff | Direct enum. |
| `Invalid credentials` (safe) | Generic message uniformization | Indistinguible — bypass-able via timing. |
| Timing attack | Valid user → DB query takes longer | Statistical inference. |
| `Username already taken` error | Account creation | Direct enum. |
| `Email sent` vs `Email not found` | Password reset | Standard mistake. |
| Forgot password forms | Same idea | Common. |
| `/api/users/<email>` returns 200 vs 404 | Profile lookup | API leak. |
| `?email=victim@x.com` returns matching profile | API search | Discovery. |
| `/u/username` exists vs 404 | Public profile pages | Scraping. |
| Sitemap leak | If sitemap contains user pages | OSINT. |
| Social media OSINT | LinkedIn, GitHub for usernames | Pre-attack. |
| `firstname.lastname@target.com` | Email pattern guess | Common patterns. |
| OAuth redirect to email | Some flows leak email format | Edge. |
| `Password must include username` reveals user | Password complexity hint | Edge bug. |
| `/avatar/<username>.png` returns 200 | Avatar URLs | Image-based enum. |
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

---

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

---
