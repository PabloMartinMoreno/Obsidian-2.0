---
aliases:
  - Session Hijacking Detection
  - Session Recon
  - Cookie Attribute Analysis
tags:
  - vuln/session-hijacking
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Session Hijacking]]"
---
# Session Hijacking - Detección y Reconocimiento

---

## Identificar Mecanismos de Session

| **Vector / Ubicación** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Set-Cookie: PHPSESSID=...`, `JSESSIONID=...`, `connect.sid=...` | Cookie session ID | Server-side state. |
| `Set-Cookie: token=eyJ...` | JWT en cookie | Stateless self-contained. |
| JWT en localStorage | JS reads `localStorage.getItem('token')` | XSS-vulnerable. |
| `Authorization: Bearer eyJ...` | JWT en Authorization header | Bearer pattern. |
| `X-Auth-Token`, `X-Session-Token` | Custom header | App-specific. |
| `?token=...` (anti-pattern) | Opaque token en URL | Logged. |
| Opaque token en body | POST/JSON con auth field | Standard API. |
| Server-side session storage | Redis, Memcached, DB | Backend lookup. |
| Stateless JWT | Self-validating | No backend lookup. |
| Hybrid token | Opaque + JWT mix | Custom. |
| `Authorization: Bearer` + refresh token | OAuth bearer + refresh | Federation. |
| SAML assertion | Form-encoded base64 SAML | Federation. |
| Persistent cookie | Long-lived (`Max-Age`/`Expires` set) | Persistencia. |
| Session cookie (transient) | Sin Expires → expires on browser close | Default. |
| Multi-factor session | After 2FA, separate cookie | MFA token. |
| Refresh-only token | Long-lived refresh + short access | Standard OAuth. |
^sh-detect-mechanism

---

## Analizar Atributos de Cookie

| **Atributo** | **Valor seguro** | **Vulnerabilidad si missing** |
|:---:|:---:|:---:|
| `HttpOnly` | ✓ | XSS reads `document.cookie`. |
| `Secure` | ✓ | Sent over HTTP → MITM. |
| `SameSite=Strict` | Strict ideal | CSRF + cross-site abuse. |
| `SameSite=Lax` | Default Chrome 80+ | GET-based CSRF possible. |
| `SameSite=None; Secure` | Required for cross-site | Open to CSRF. |
| `Domain=.target.com` | Wide scope | Cross-subdomain access (Subdomain Takeover combo). |
| `Domain=` (empty) | Origin-only | Most restrictive. |
| `Path=/` | App-wide | Path-restricted más seguro. |
| `Max-Age` / `Expires` | Short (15 min - 1h) | Long-lived session = persistence. |
| `__Host-` prefix | `Path=/`, no Domain, Secure required | Strongest cookie. |
| `__Secure-` prefix | Secure required | Defense layer. |
| Hash-based | Cookie name = hash | Predict difficult. |
| Random session ID | Cryptographically random ≥16 bytes | Standard. |
| Sequential IDs | Predictable | Direct hijack. |
| Encoded value | base64, URL-encoded | Not security per se. |
| Signed (HMAC) | Server signs cookie | Tampering protection. |
^sh-detect-cookie-attrs

### Probe rápido attributes

```bash
# Inspect Set-Cookie
curl -sI https://target/login -d 'user=x&pass=y' \
  | grep -i 'set-cookie:'

# Output ejemplo:
# Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict; Path=/

# Per-attribute matrix
COOKIE=$(curl -sI -X POST -d 'user=x&pass=y' https://target/login | grep -i set-cookie:)
echo "$COOKIE" | grep -oiE 'HttpOnly|Secure|SameSite=[^;]*|Domain=[^;]*|Path=[^;]*|Max-Age=[^;]*|Expires=[^;]*'
```

---

## Mapear Session Lifecycle

| **Vector / Ubicación** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Pre-auth state | Cookie issued anonymous? | Session fixation possible if same ID after login. |
| Login → new cookie | Cookie regenerates post-auth? | Best practice. |
| Login → same cookie | Session fixation vulnerable | Standard bug. |
| `Set-Cookie: session=; Max-Age=0` | Logout cookie clear | If not cleared → reuse. |
| Logout server-side invalidation | Cookie still valid after logout? | Logout race / replay. |
| Multi-device sessions | Multiple concurrent sessions allowed? | Per-device. |
| Idle timeout | Backend invalidates after N minutes | Without idle timeout = persistencia. |
| Absolute timeout | Max session duration | Hard limit. |
| Refresh token rotation | New refresh per use? | Replay protection. |
| Failure to invalidate on password change | After password change, old session valid? | Common bug. |
| 2FA-required step | New cookie post-2FA? | Phase boundary. |
| Privilege step-up | After elevated action, new cookie? | Re-auth pattern. |
| Cross-device login | Login from new device → invalidates old? | Anti-takeover. |
| Combine con timing | Session age en seconds revealed | Edge. |
| Account suspension | Session invalidated immediately? | Account state. |
^sh-detect-lifecycle

### Workflow recon lifecycle

```bash
# Stage 1: Anonymous visit
COOKIE_ANON=$(curl -sI https://target/ | grep -i set-cookie | head -1)
echo "Anon cookie: $COOKIE_ANON"

# Stage 2: Login con anon cookie
COOKIE_AUTH=$(curl -sI -X POST -d 'user=test&pass=test' \
  -b "$COOKIE_ANON" \
  https://target/login | grep -i set-cookie | head -1)
echo "Post-login cookie: $COOKIE_AUTH"

# If COOKIE_ANON same SID as COOKIE_AUTH → session fixation candidate

# Stage 3: Logout
curl -s -X POST -b "$COOKIE_AUTH" https://target/logout

# Stage 4: Reuse old cookie post-logout
RESULT=$(curl -s -b "$COOKIE_AUTH" https://target/dashboard)
if echo "$RESULT" | grep -q "Welcome\|dashboard"; then
    echo "[!] Logout doesn't invalidate session - reuse possible"
fi
```

---
