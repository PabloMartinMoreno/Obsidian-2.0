---
aliases:
  - Session Fixation
  - Session Replay
  - Long-lived Sessions
  - Refresh Token Replay
tags:
  - type/cheatsheet
  - vuln/session-hijacking
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Session Hijacking]]'
---
# Session Hijacking - Fixation y Replay

***

## Set Victim's Session ID Pre-Auth

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Atacante sets known SID en victim's browser. After victim logs in, app keeps same SID. Atacante uses SID. | Classic session fixation. |
| URL parameter SID | `https://target/login?PHPSESSID=ATTACKER_SID` | Old apps con URL-based session. |
| Force cookie via XSS | XSS sets `document.cookie = 'session=...'` | Standard. |
| Force cookie via subdomain | Sub takeover + cookie set on parent | Combine. |
| Cookie tossing | Sub overrides parent cookie | Same. |
| Mid-MITM injection | Inject `Set-Cookie` en HTTP response | Pre-HTTPS. |
| Force via meta tag | `<meta http-equiv="Set-Cookie" content="...">` (HTML5 obsolete) | Edge. |
| Hidden input form | App accepts SID en form | Custom apps. |
| Mobile app deep link | Pre-set SID via app launch | Mobile. |
| Persistent cookie across browser restarts | Cookie con Max-Age long → persistent | Edge. |
| Cookie via OAuth callback | OAuth state param leaks | Edge. |
| Force re-auth con own SID | Atacante session shared | UX trick. |
| Pre-auth → auth without SID regen | Backend bug: keeps same SID | Standard. |
| Combine con phishing link | Phishing link incluye SID | Standard. |
^sh-fixation-preauth

### PoC clásico session fixation

```
1. Atacante visita target.com → recibe SID = ABC123
2. Atacante sends victim:
   https://target.com/login?PHPSESSID=ABC123
   Or sets cookie via subdomain XSS
3. Victim logs in. App associates ABC123 con victim's account.
4. Atacante now usa SID ABC123 → authenticated as victim.
```

___

## Replay Captured Tokens

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Atacante captures session token (XSS / sniff / etc) → uses it from own machine | Standard reuse. |
| Cookie capture + reuse | Steal cookie → set en atacante's browser → access | Direct. |
| JWT replay | Bearer token captured → reuse hasta expiry | Standard. |
| Multi-device session | Both browsers active simultaneously | If app permits. |
| Session not tied a IP | Atacante reuses across networks | Standard. |
| Session not tied a User-Agent | Different browser OK | Standard. |
| Combine con browser cloning | Clone victim's browser profile | Local theft. |
| Refresh token replay | Refresh token captured → keep refreshing access | Long-lived persistence. |
| OAuth refresh abuse | Refresh until invalidated | Same. |
| Session never expires | Persistent session | Long-term access. |
| Session survives password change | If app doesn't invalidate | Bug. |
| Concurrent sessions allowed | Atacante doesn't kick victim | Stealth. |
| Combine con anti-detection | VPN + similar fingerprint | Stealth. |
| Replay window | Until logout / expiry | Time-bound. |
^sh-fixation-replay

___

## Long-lived Sessions / Tokens

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| `Max-Age=31536000` (1 year) | Cookie valid 1 year | Persistencia. |
| Persistent "remember me" | Long-lived auth token | Common feature. |
| JWT exp lejos | `exp: 9999999999` | Practically infinite. |
| Refresh token sin rotation | Same refresh token reusable | Standard antipatron. |
| OAuth offline_access scope | Long-lived refresh | Federation. |
| API keys never rotate | Static API key | Permanent leak risk. |
| Service account token | Permanent for service | Edge if leaked. |
| Mobile app session | Often very long | UX vs security. |
| Combine con device fingerprint | If skipped → universal token | Bug. |
| App without idle timeout | Session lasts indefinitely | Standard bug. |
| Combine con device theft | Stolen laptop = stolen session | Physical. |
| Cookie still valid post-logout | Bug = persistencia | Logout failure. |
| Combine con browser crash | Session restored on restart | UX. |
^sh-fixation-longlived

___

## Concurrent Session Abuse

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Atacante + victim simultaneously | Both sessions active | Standard. |
| App permite multiple sessions | No "one device" enforcement | Common. |
| Atacante stays under radar | Victim doesn't notice | Stealth. |
| Combine con persistent presence | Atacante checks periodicamente | Edge. |
| Force kick victim via "log out other devices" | Atacante uses session feature | Variant. |
| Combine con privilege actions | Atacante does silent admin actions | Stealth. |
| Combine con timing | Atacante actions during victim sleep | Edge. |
| Audit log evasion | If logs sin device fingerprint | Difficult to detect. |
| Mobile + web concurrent | Different platforms simultaneously | Standard. |
| Multiple atacantes share token | Multi-attacker compromise | Edge. |
| Combine con webhook / API automation | Persistent atacante automated | Stealth. |
^sh-fixation-concurrent

___

## Refresh Token Replay

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | OAuth/OIDC refresh token long-lived. Captured refresh = persistent access. | Standard OAuth. |
| Refresh token capture | Network sniff, XSS, etc | Same vectors. |
| Replay refresh | `POST /oauth/token` con refresh_token | Get new access. |
| Refresh token sin rotation | Same refresh after each use | RFC violation. |
| Refresh token rotation | New refresh per use → replay protection | Best practice. |
| Refresh broken rotation | Both old + new valid simultaneously | Edge bug. |
| Refresh token tied a session | Even if rotated, session-bound | Defense. |
| Refresh token revocation list | Server-side blacklist | Standard. |
| Long-lived refresh (months) | If never revoked → permanent | Persistencia. |
| Mobile app refresh | Often longer | UX. |
| Combine con device theft | Refresh extracted from app data | Physical. |
| Combine con app reverse engineering | APK / IPA token extract | Mobile. |
| OIDC ID token reuse | id_token replay | Federation. |
| Combine con weak crypto | Refresh signed weak | Crypto bypass. |
^sh-fixation-refresh

***
