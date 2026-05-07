---
aliases:
  - Session Hijacking
  - JWT Bypass
  - OAuth redirect_uri
  - Predictable Tokens
tags:
  - type/cheatsheet
  - vuln/auth-bypass
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Authentication & Authorization Bypass]]'
  - '[[JWT Attacks]]'
---
# Auth Bypass - Tokens y Sessions

***

## JWT Bypass (Quick Reference)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `alg=none` | `{"alg":"none","typ":"JWT"}` + payload + empty sig | Standard. |
| `alg=NONE` / `nOnE` case | Variants | Filter bypass. |
| Algorithm confusion | RS256 → HS256 con pública como secret | Common. |
| Weak HS256 secret | Hashcat -m 16500 con rockyou | Bruteforce. |
| `kid` SQLi | `kid` injection en lookup | DB-backed. |
| `kid` path traversal | `kid: ../../dev/null` → empty key | File-backed. |
| `jku` injection | `jku: https://attacker/jwks.json` | Atacante hosts. |
| `jwk` embedded | Atacante's pubkey embedded en header | Direct. |
| `x5u` / `x5c` | X.509 cert injection | Variant. |
| Claim manipulation | `role`, `sub`, `email`, `exp` modify | Combine con weak validation. |
| Empty signature | Some libs accept JWT con empty sig | Edge. |
| Null padding sig | Padding tricks | Edge. |
| See `JWT Attacks` | Comprehensive | Cross-ref. |
^auth-tokens-jwt

___

## Session Fixation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Atacante presets victim's session ID. After victim logs in, atacante uses same SID. | Pre-auth fixation. |
| Force SID via URL | `https://target/login?PHPSESSID=ATTACKER_SET` | Standard. |
| Force SID via cookie | `Set-Cookie: session=ATTACKER_SET` (via XSS / MITM) | Common. |
| SID en hidden form | `<input type="hidden" name="JSESSIONID" value="...">` | Form-based. |
| Session not regenerated post-login | Backend keeps same SID after auth → atacante uses it | Standard bug. |
| Cross-subdomain cookie | Subdomain con XSS sets cookie del parent | Cross-subdomain. |
| Cookie scoping abuse | Path / domain attribute | Misconfig. |
| Combine con Open Redirect | Redirect victim through attacker → cookie set | Multi-step. |
| HTTP-only cookie bypass | If app reads from JS via XSS | XSS chain. |
| Persistent fixation | Session lasts long → multiple uses | Persistencia. |
| Defender mitigation | Regenerate session ID post-login | Standard fix. |
^auth-tokens-fixation

___

## Predictable Tokens

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| UUIDv1 timestamp-based | Timestamp + node MAC → predictable | Insecure for security. |
| Sequential session IDs | If incremental | Direct prediction. |
| Counter-based tokens | Atomic counter | Same. |
| Timestamp en token | `<unix_ts>_<short_hash>` | Predictable. |
| Random pre-PRNG seed | Apps que usan `Math.random` | Predictable seed. |
| MD5/SHA1 weak hash | Hash de input predecible | Reverse. |
| Username-based token | `md5(email + secret)` con weak secret | Crack. |
| Session ID en URL | `JSESSIONID=...` en logs | Disclosure. |
| Token leakage en Referer | URL con token → leaked external | Combine con Open Redirect. |
| Token in error messages | Verbose errors expose | Disclosure. |
| Token in HTML comments | `<!-- DEBUG: token=... -->` | Source disclosure. |
| Cookie sin HttpOnly + XSS | XSS reads cookie | Combo. |
| Predictable reset tokens | Same predictability issues | Reset abuse. |
| Default tokens for service accounts | Hardcoded en code | Source disclosure. |
^auth-tokens-predictable

___

## Cookie Tampering

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Cookie role flag | Cookie value `role=admin` cleartext | Direct. |
| Cookie user_id manipulation | `user_id=1` change a `user_id=2` | IDOR via cookie. |
| Cookie isAdmin | `is_admin=1` flag | Direct. |
| Base64 encoded cookie | Decode + modify + re-encode | Common. |
| JSON in cookie | `cookie={"user":"x","role":"user"}` → modify | Direct. |
| Signed cookie weak HMAC | Weak secret crack → forge | Crypto bypass. |
| Encrypted cookie weak crypto | ECB mode → bit flip / replay | Edge. |
| Path-scoped cookie | Cookie con path `/admin` only | Misconfig leak. |
| Domain-scoped cookie | `Domain=.target.com` shared | Subdomain abuse. |
| Cookie sin Secure flag | Sent over HTTP → MITM | Network attack. |
| SameSite=None sin Secure | Browsers reject — pero anti-pattern | Detection. |
| `__Host-` prefix bypass | If app accepts unprefixed | Edge. |
| Session cookie in URL | `session=...` exposed | Disclosure. |
| Cookie injection via header | `Set-Cookie` injection | Combine HRS. |
^auth-tokens-cookie

___

## OAuth `redirect_uri` Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Direct redirect | `redirect_uri=https://attacker.com/cb` | If no whitelist. |
| Whitelist suffix bypass | `redirect_uri=https://target.com.attacker.com` | Suffix abuse. |
| Whitelist prefix bypass | `redirect_uri=https://attacker-target.com` | Prefix abuse. |
| Userinfo trick | `redirect_uri=https://target.com@attacker.com` | URL parser confusion. |
| Path traversal en allowed URI | `redirect_uri=https://target.com/cb/../../attacker` | Edge. |
| Subdomain takeover combo | Atacante owns dead subdomain whitelisted | Trust transfer. |
| Wildcard whitelist | `*.target.com` permits any subdomain | Subdomain abuse. |
| Open redirect chain | redirect_uri to legit + chained Open Redirect | Multi-stage. |
| State parameter missing | OAuth flow sin `state` → CSRF + token theft | Standard. |
| PKCE missing | Public client sin PKCE → code intercept | Mobile common. |
| Implicit flow direct token | `response_type=token` → access_token in fragment | Direct theft. |
| Hybrid flow code+token | Mixed grants | Complex. |
| `nonce` missing | OpenID without nonce | Replay. |
| Multi-tenant client confusion | Wrong tenant gets different client | Edge. |
| Combine con HHI | Backend builds redirect_uri from Host | HHI chain. |
^auth-tokens-oauth

***
