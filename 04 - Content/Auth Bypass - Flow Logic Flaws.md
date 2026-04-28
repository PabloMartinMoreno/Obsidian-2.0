---
aliases:
  - Password Reset Bypass
  - 2FA Bypass
  - Magic Link Reuse
  - OAuth State Missing
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
  - '[[Race Conditions]]'
  - '[[Host Header Injection]]'
---
# Auth Bypass - Flow Logic Flaws

***

## Password Reset Bypass / Token Leak

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Token via Referer leak | URL con token → atacante's page → Referer | Standard. |
| Reset poisoning | HHI inyecta link con attacker domain | High impact. |
| Reset token NOT consumed | Single-use claim but not enforced | Reuse vector. |
| Reset token never expires | No expiry → forever valid | Persistencia. |
| Token tied to non-session | Email → atacante intercepts → uses on victim | TOCTOU. |
| Predictable reset tokens | UUIDv1 / sequential | Predict. |
| Token disclosed en response body | Return en JSON post-request | Disclosure. |
| Token in error message | Verbose error includes token | Disclosure. |
| Reset endpoint without token | `POST /reset { email: 'victim', password: 'new' }` | Auth missing. |
| Reset with arbitrary user | If app accepts user_id as parameter | IDOR + reset. |
| Email confirm en reset | New password set, atacante adds email | Email hijack chain. |
| Race en reset | Token consume race | Race conditions. |
| Combine con HHI | Email link Host poisoned | Standard. |
| Combine con SAML logout | Reset triggers SAML re-auth | Federated edge. |
| Multi-step reset bypass | Skip confirm step | Logic flaw. |
^auth-flow-reset

___

## 2FA Bypass

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| 2FA endpoint accepts empty | `POST /verify { code: "" }` | Empty bypass. |
| 2FA endpoint accepts null | `code: null` | Same. |
| 2FA flag in body | `{ code: "1234", verified: true }` | Flag injection. |
| Skip 2FA via direct browse | `/dashboard` accessible sin 2FA verify | Forced browsing. |
| 2FA brute force sin rate limit | Multi-thread 6-digit OTP | Hashcat-grade speed. |
| 2FA brute con race | Race conditions con HTTP/2 single-packet | Modern. |
| OTP reuse | Old OTP still valid | Replay. |
| OTP guess via phone | Hardcoded test numbers | Edge. |
| 2FA disable via mass assign | `{"mfa_enabled": false}` en profile update | Combine. |
| Session bypass mid-flow | Session marked authenticated antes de 2FA | Session race. |
| 2FA bypass via API | API endpoint sin 2FA enforcement | API/Web mismatch. |
| 2FA bypass via legacy endpoint | `/api/v1/...` no enforces vs `/v2/` | Versioning. |
| 2FA bypass via OAuth | OAuth flow skips 2FA | Federation. |
| Backup codes reuse | Single-use violated | Edge. |
| Magic link instead of 2FA | Some apps accept magic link as primary | Bypass MFA. |
| TOTP clock skew abuse | Wide window | Edge. |
| Push notification race | Approve race con concurrent | Race. |
| WebAuthn challenge replay | Reuse challenge | Crypto edge. |
| Phone number swap | Atacante adds phone before 2FA | Combine. |
^auth-flow-2fa

___

## Magic Link Reuse / Tampering

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Magic link single-use violated | Use same link twice | Reuse vector. |
| Magic link long expiry | No expiry → valid forever | Persistencia. |
| Magic link via Referer leak | URL with token leaked | Standard. |
| Magic link tied to non-session | Atacante intercepts email → uses on victim browser | TOCTOU. |
| Magic link guess | Predictable token | Brute. |
| Login URL en Referer | Email scanner clicks → atacante captures via Referer | Email scanners. |
| Email scanner pre-consume | Scanner clicks first → token consumed before user | Edge. |
| Combine con HHI | Magic link host poisoned | Same as reset. |
| Magic link accepts arbitrary user | If user_id in URL not bound to token | IDOR + magic. |
| Race en magic link | Token consume race | Race. |
| Magic link en error pages | Token reflected en error page | Disclosure. |
| Email pre-fetcher captures | iOS Mail / Apple privacy fetches links | Pre-consume. |
^auth-flow-magic

___

## Email Confirmation Bypass

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Skip confirm endpoint | `POST /confirm { email: 'victim', confirmed: true }` | Direct. |
| Confirm flag self-set | Mass Assignment `{ "email_verified": true }` | Common. |
| Confirm token reuse | Same token works multiple times | Reuse. |
| Confirm token IDOR | Token tied to ID, change ID | IDOR. |
| OAuth-bypass confirm | If OAuth, sometimes auto-confirms email | Federation. |
| Login pre-confirm | Some apps allow login before email confirm | Logic flaw. |
| Different endpoint less strict | `/api/v1/confirm` vs `/api/v2/confirm` | Per-version. |
| Multi-step skip step | Confirm requires email verify + click → race skip | Multi-stage. |
| Send confirm to atacante's email | Inject email field con `victim@attacker.com` | Combine HHI. |
| Email reuse for multiple accounts | If email not unique → privesc | Logic. |
| Confirm via header | If header `X-Email-Verified: true` trusted | Spoofing. |
^auth-flow-email-confirm

___

## OAuth State / Nonce Missing

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| State parameter missing | OAuth authz request sin `state` | CSRF + code theft. |
| State predictable | Counter / timestamp / no random | Predict. |
| State not validated | Server accepts any state | No CSRF protection. |
| State tied to non-session | Reuse state across sessions | Edge. |
| Nonce missing en OpenID | OpenID flow sin `nonce` | Replay. |
| Nonce predictable | Same logic as state | Bypass. |
| Code reuse | Authorization code single-use violated | Reuse. |
| Code TOCTOU | Race en code exchange | Combine race. |
| PKCE missing for public client | Public OAuth client without PKCE | Standard. |
| PKCE downgrade | Force `none` PKCE method | Edge. |
| `redirect_uri` permits multiple | Atacante's URI in whitelist | Direct. |
| `client_id` confusion | Multiple clients confusion | Edge multi-tenant. |
| Implicit flow with response_type=token | Token in fragment direct | Direct theft. |
| OAuth login CSRF | Login as atacante's account | Atacante session injection. |
| `prompt=none` silent auth | Sometimes bypasses interactive | Edge. |
^auth-flow-oauth-state

___

## Race Conditions en Auth

| **Vector** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Limit overrun login | 50 login attempts en single packet (HTTP/2) | Bypass rate limit. |
| 2FA OTP brute con race | Same idea con OTP verification | Standard. |
| Reset token reuse | Race entre token validate y consume | Reuse. |
| Magic link race | Same | Edge. |
| Account creation race | Parallel signups con same username | Username collision. |
| 2FA enrollment race | Setup + bypass | Standard. |
| Password change race | Old + new pass set | Combine. |
| OAuth code race | Code exchange en parallel | Token reuse. |
| Email change race | Confirm email + revert | Email confusion. |
| Combine con Single-packet attack | HTTP/2 single-packet | Modern. |
| See `Race Conditions` | Comprehensive | Cross-ref. |
^auth-flow-race

***
