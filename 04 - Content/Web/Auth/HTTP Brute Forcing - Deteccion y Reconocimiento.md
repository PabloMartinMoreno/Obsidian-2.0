---
aliases:
  - Login Form Discovery
  - Rate Limit Detection
  - Lockout Policy Recon
  - User Enumeration
tags:
  - vuln/brute-force
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[HTTP Brute Forcing]]"
  - "[[Burp Suite]]"
---
# HTTP Brute Forcing - Detección y Reconocimiento

***

## Login Form Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `/login`, `/signin`, `/auth` | Standard paths | Convención común. |
| `/admin`, `/admin/login`, `/wp-admin` | Admin panels | High-value targets. |
| `/api/login`, `/api/v1/auth` | API auth | JSON body. |
| `/oauth/token`, `/oauth/authorize` | OAuth endpoints | `grant_type=password`. |
| `/users/login`, `/account/login` | App-specific | Variaciones. |
| `/manage`, `/console`, `/portal` | Mgmt UIs | Fronts. |
| `/cgi-bin/login`, `.htpasswd` | Legacy CGI | Old apps. |
| `/_admin`, `/_login` | Hidden underscore | Convention. |
| Basic Auth challenge | `WWW-Authenticate: Basic realm="..."` header | Browser prompt. |
| Digest Auth challenge | `WWW-Authenticate: Digest` | Less common. |
| NTLM challenge | `WWW-Authenticate: NTLM` | Windows IIS. |
| Form-based redirects | `/protected` → 302 `/login?return=` | Classic flow. |
| Cookie-based session start | Set-Cookie post-login | Session ID. |
| JWT-based response | `{access_token, refresh_token}` body | Modern API. |
| Custom headers `X-Auth-Token` | API token in header | API style. |
| Mobile OAuth endpoints | `/mobile/auth`, `/api/mobile/login` | Mobile-only. |
^bf-detect-endpoints

### Discovery commands

```bash
# Common login paths
ffuf -u https://target/FUZZ -w /usr/share/seclists/Discovery/Web-Content/quickhits.txt \
  -mc 200,301,302,401,403 -mr "(?i)(login|sign|auth|password)"

# Auth challenge headers
curl -sI https://target/admin | grep -i 'www-authenticate'

# JS bundle scan for auth endpoints
curl -s https://target/static/js/main.js | \
  grep -oE '(login|auth|signin|/api/v[0-9]+/[a-z]+)' | sort -u
```

___

## Response Differential Success/Fail

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HTTP status code | 200 (success) vs 401/403 (fail) | Standard. |
| Response length | `Content-Length` differs | Common diff. |
| Cookie set on success | `Set-Cookie: session=...` only on success | Auth state. |
| Redirect target diff | 302 `/dashboard` vs 302 `/login?error=1` | Location header. |
| Body text "Invalid" | `"invalid credentials"` | Error message. |
| Body text "Welcome" | Success greeting | Success indicator. |
| JSON `{"status":"ok"}` vs `{"error":...}` | API responses | API. |
| JWT in response | Only on success | Modern. |
| MFA prompt diff | "Enter OTP" page → user/pass válidos | Two-stage. |
| CSRF token rotation | New token only on auth state change | Server logic. |
| Custom header response | `X-Auth-Result: success` | App-specific. |
| Empty body 200 | Some apps return empty success | Non-standard. |
| Redirect chain depth | Success has more redirects | Edge. |
| Response time differential | Success path slower (DB lookup) | Timing oracle. |
| Image/asset on dashboard only | `Set-Cookie` triggers dashboard fetch | Indirect. |
| WebSocket upgrade post-auth | WS only after success | Modern apps. |
^bf-detect-responsediff

### Test diff con Burp/curl

```bash
# Capture failed login response
curl -s -X POST https://target/login \
  -d "username=invalid&password=wrong" \
  -o fail.html -w "%{http_code} %{size_download}\n"

# Capture potential success
curl -s -X POST https://target/login \
  -d "username=admin&password=admin" \
  -o success.html -w "%{http_code} %{size_download}\n"

diff fail.html success.html
```

___

## Rate Limit Detection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| 429 Too Many Requests | Spam 50 requests rápido | Standard. |
| 403 tras N intentos | Lockout temporario | Common. |
| 503 Service Unavailable | Edge case rate limit | CDN/WAF. |
| Captcha aparece tras N | Visual challenge | Slow brute. |
| Email "suspicious activity" | Out-of-band alert | Defender side. |
| Session terminated | Invalid session post-attempts | Reset. |
| Slow response gradient | Response time crece con attempts | Tarpit. |
| `Retry-After` header | Server tells when to retry | Standard. |
| `X-RateLimit-Remaining` | Counter visible | Info disclosure helps. |
| Per-IP vs per-user | IP block ≠ account block | Different scopes. |
| Per-endpoint scope | Login limit ≠ password reset limit | Bypass via secondary endpoint. |
| Per-session vs per-IP | New session resets | Bypass via cookie reset. |
| Time window reset | 5 fails / 15 min vs cumulative | Pattern testing. |
| Soft vs hard lock | Temp delay vs permanent | Different recovery. |
| WAF rules | Cloudflare/AWS WAF | Vendor-specific. |
| Custom app logic | Bespoke counter | Variable. |
^bf-detect-ratelimit

### Test rate limit

```bash
# Quick burst
for i in {1..50}; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST https://target/login \
    -d "username=test$i&password=wrong")
  echo "$i: $CODE"
done

# Look for transition: 200/401 → 429/403/503
# Note threshold (e.g., "blocked after 10 attempts")
# Wait + retry to find lockout window
```

___

## Lockout Policy Probing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Account lockout permanente | Brute hasta block, espera horas | Email reset required. |
| Account lockout temporario | 5 fails → 15 min lock | Slow brute viable. |
| Lockout per IP | Diff IP can attempt | Proxy bypass. |
| Lockout per user-agent | Edge case | UA rotation. |
| Soft lockout | Delay only, no block | Slow brute fine. |
| Captcha-only lockout | Solvable via 2captcha API | Outsource solving. |
| MFA forced post-fails | Adds friction | Can be bypassed. |
| Email notification only | Detection not prevention | OPSEC concern. |
| Honeypot accounts | Decoy "admin" triggers alert | Defender trap. |
| Username enum during lockout | Locked accounts give different error | Enum oracle. |
| Per-action lockout | Login locked but reset open | Pivot endpoint. |
| Distributed lockout (cluster) | Different node = no lockout | Race attack. |
| Lockout reset on password reset | Reset clears counter | Combo. |
| Time-based reset | Cumulative reset post-N hours | Pacing. |
| Concurrent session lockout | Login from new device alerts | OPSEC. |
| WAF-level vs app-level | Different bypass strategies | Detection. |
^bf-detect-lockout

___

## User Enumeration via Errors

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Login error specificity | "Invalid username" vs "Invalid password" | Direct enum. |
| Response time differential | DB lookup user vs not — measurable | Timing attack. |
| Password reset response | "Email sent" vs "Email not found" | Common leak. |
| Signup form | "Email already registered" | Direct enum. |
| Password reset rate limit per-user | Existing user → rate limited; non-existent → instant | Indirect enum. |
| OAuth provider redirect | Different redirect for known/unknown email | Provider leak. |
| Login form CSRF token diff | Token rotation only for valid users | Indirect. |
| OTP send response timing | "Sending..." spinner duration | Timing oracle. |
| Avatar/profile pic 404 | Username probe via direct asset | URL pattern. |
| API user existence endpoint | `/api/users/{username}` returns 200/404 | Direct API enum. |
| GraphQL `users(email:...)` query | Returns null vs object | Schema enum. |
| Forgot password username field | "Send recovery" message diff | Common bug. |
| Magic link send | "Link sent if exists" vs explicit | UX laziness. |
| Account creation race | "Username taken" vs "Available" | Direct enum. |
| LDAP error verbose | Server reveals "user not found" | Backend leak. |
| Token reset rate limit per email | Counter exists only for valid emails | Indirect enum. |
^bf-detect-enum

### Test user enum

```bash
# Test response diff por user existence
for user in admin test fake_user invalid_xxx admin@target.com noone@nowhere.com; do
  RESP=$(curl -s -X POST https://target/forgot-password -d "email=$user")
  TIME=$(curl -s -o /dev/null -w '%{time_total}' -X POST https://target/forgot-password -d "email=$user")
  echo "$user → $TIME — $(echo "$RESP" | head -c 100)"
done

# Look for diff timing or response body
```

***
