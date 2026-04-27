---
aliases:
  - Race Specific Targets
  - Promo Race
  - Voting Race
  - Password Reset Race
tags:
  - type/cheatsheet
  - vuln/race-condition
  - technique/initial-access
  - technique/privilege-escalation
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Race Conditions]]'
---
# Race Conditions - Vectores Específicos

***

## Multi-Endpoint Races (Chains)

| **Objetivo** | **Chain** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Race entre endpoints distintos que comparten estado. Endpoint A modifica → Endpoint B verifica | Cross-endpoint TOCTOU. |
| Order race | `POST /cart/checkout` + `DELETE /cart/item/X` simultáneos | Item shipped sin cobrar. |
| Permission race | `POST /admin/grant` + `DELETE /admin/role` para mismo user | Permission state confusion. |
| File race | `POST /upload` + `GET /file/list` antes de scan complete | Pre-scan access. |
| Auth race | `POST /login` + `POST /logout` simultáneos | Session limbo. |
| Subscription race | `POST /upgrade` + `POST /cancel` | Tier confusion. |
| Cross-tenant race | Tenant A action + Tenant B context switch | Multi-tenant leak. |
| Refund + chargeback | `POST /refund` + payment processor `chargeback` | Double-refund. |
| Friend request + block | `POST /friend/accept` + `POST /user/block` | State conflict. |
| Vote + delete content | `POST /vote/up` + `DELETE /post` | Orphan vote. |
| Generic A→B chain | `setStateA + readStateA` simultáneos en distinct endpoints | Universal pattern. |
^race-vector-multi-endpoint

___

## Promo Code / Voucher Redemption

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Voucher diseñado para 1-time-use o stock limitado. Race redime N veces simultáneamente | Stock overrun. |
| Single-use voucher | Code "PROMO50" → 1 use total → race 100 veces | All applied. |
| Limited stock | Coupon stock=10 → 100 redemptions → > 10 cobradas | Inventory bypass. |
| Per-user limit | "1 use per user" → spam concurrent same user | Single-user overrun. |
| Discount stack | Apply discount per item → race agrega múltiples al mismo item | Stack ineligible. |
| Birthday gift | Annual gift → race en mismo día → multiple gifts | Yearly bypass. |
| Refund credit | Credit one-time → race | Multi-credit. |
| Affiliate referral | Referral one-per-signup → race signup + referral redeem | Multi-credit. |
| Cashback claim | Cashback per transaction → race triggers multiple | Ledger inflation. |
| Loyalty points | Points earn per action → race earn multiple | Point overrun. |
^race-vector-voucher

___

## Voting / Rating Manipulation

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concepto | App enforces "1 vote per user per item". Race spam votes → multiple counted | Direct manipulation. |
| Like spam | `POST /like/123` × 100 simultáneos → like counter += 100 | Visible amplification. |
| Star rating | Rating 1-5, "1 per user" → multiple ratings count → average sesgo | Rating fraud. |
| Vote/reaction | Reddit-style upvote-only logic → spam concurrent | Visibility manipulation. |
| Poll manipulation | One vote per user → multi-vote campaign | Result distortion. |
| Comment likes | Like de same user × 100 | Amplificación. |
| Report abuse | Multi-report mismo content → trigger auto-ban | DoS al user. |
| Survey response | Single submit → multi-submit → skew data | Research integrity. |
| Subscriber count | Subscribe action → race → multiple subscribed → uninflated count fix later | Vanity metric. |
| Petition signature | Single signature → spam signatures from same identity | Petition fraud. |
^race-vector-voting

___

## Account Takeover via Password Reset Race

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Reset token consume race. Atacante request reset → victim también request → atacante usa token de victim | Multi-actor race. |
| Reset token reuse | Token marked-used after click. Race click + actual reset | Token lifetime extension. |
| Reset token TTL race | Token expires → race window | Edge timing. |
| Email change race | New email pending verification → race clicks confirm | Email hijack. |
| Account merge race | Confirm both sides → race triggered before victim confirm | Hostile merge. |
| 2FA enrollment race | Setup MFA + bypass MFA simultáneos | 2FA fake state. |
| Password change race | Old + new password set → race set without old | Direct change. |
| Recovery code use race | One-time recovery code → race | Reuse. |
| Session token issue race | Login + token issue → race issue twice | Multiple tokens. |
| OAuth state race | OAuth callback state validate → race state reuse | Auth flow. |
^race-vector-ato

### PoC ATO via reset race

```
1. Atacante request password reset for victim@target.com
   → Token T1 enviado por email a victim.
2. Victim también request reset (concurrent or after).
   → Token T2 enviado.
3. Atacante intercepta T1 vía MITM o XSS u OOB leak.
4. Atacante usa T1 + sends 100 concurrent reset-completion requests.
5. Race: server marks T1 used, but doesn't fully execute before
   atacante's parallel request reads T1 still valid.
6. Atacante completes reset → password set.
```

___

## Cache Fill Race

| **Objetivo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Cache miss → backend genera response → cache stores. Race entre miss y store window | Cache poisoning timing. |
| Single-flight bypass | Cache uses lock to prevent thundering herd. Race lock acquire | Bypass single-flight. |
| Cache stampede | Cache TTL expires → multiple misses simultaneously | Backend overload. |
| Race poison | Mientras cache fill in progress, atacante manda poisoned request | Wins race → poisoned cached. |
| Validate-while-revalidate race | Conditional GET race | Stale serve race. |
| Multi-tier cache | L1 cache miss → L2 lookup → L2 miss → backend. Race entre tiers | Complex multi-stage. |
| CDN edge race | Geographic edges race propagation | Per-region poisoning. |
| Cache invalidation race | Invalidate + read | Read stale post-invalidation. |
| Combine con HRS | HTTP Request Smuggling + cache fill race | Multi-vector. |
| Cache deception race | Fill cache with private data via race window | TOCTOU cache. |
^race-vector-cache

***
