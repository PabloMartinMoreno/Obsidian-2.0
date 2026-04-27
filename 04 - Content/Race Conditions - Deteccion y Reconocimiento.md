---
aliases:
  - Race Detection
  - TOCTOU Detection
tags:
  - type/cheatsheet
  - vuln/race-condition
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Race Conditions]]'
---
# Race Conditions - Detección y Reconocimiento

***

## Identificar Endpoints State-Changing

| **Tipo de endpoint** | **Pattern** | **Riesgo race** |
|:---:|:---:|:---:|
| Transfer / Withdraw / Spend | Endpoints que decrementan balance/cuota | Limit overrun. |
| Promo code / Voucher redemption | One-time use intent | Multi-redemption. |
| Multi-step state machine | `pending → submitted → approved → paid` | Skip steps. |
| Confirmation flow | Delete / Cancel con confirmation step | Skip confirm. |
| Vote / Rating | One vote per user per item | Multi-vote. |
| 2FA / OTP verify | Multiple guesses en window | OTP race. |
| Login attempts | Lockout policy | Lockout race. |
| Password reset | Token consume | Reset race. |
| Account creation | Username uniqueness | Same name race. |
| File upload | Same filename | Overwrite race. |
| Email verification | Token consume | Multi-verify. |
| Coupon stock | Limited inventory | Stock overrun. |
| Cart checkout | Quantity x price | Calculation race. |
| Friend request | Auto-accept | Multi-accept. |
| Subscription renewal | Auto-billing | Billing race. |
| API key generation | Rate-limited | Generate multiple. |
^race-detect-endpoints

___

## TOCTOU Patterns

| **Pattern** | **Example** | **Notas** |
|:---:|:---:|:---:|
| TOCTOU clásico | `if (balance >= amount) deduct(amount)` — sin lock | Time-of-check vs time-of-use gap. |
| Auth check + privileged action | Check role at start, action at end (no re-check) | Privesc window. |
| File system TOCTOU | `if (exists(file)) read(file)` — race con symlink | Local privesc. |
| Database lookup + insert | `SELECT count + INSERT` non-atomic | Duplicate prevention bypass. |
| Cache check + DB write | Cache says "not exists" → DB insert | Cache stale race. |
| Quota check + increment | `if quota > 0: quota--; do_action()` | Overrun. |
| Order check + payment | Check item available + capture payment in 2 calls | Inventory race. |
| Status check + update | `if (status == 'pending') status = 'paid'` | State race. |
| Session check + permission | Auth re-check missing in pipeline | Session race. |
| Custom lock implementations | DIY mutex con bugs | Race window. |
| Distributed locks | Redis SETNX, etcd lock | Network race. |
| Optimistic concurrency | Version-based update | Stale version race. |
^race-detect-toctou

___

## Atomicity / Locking Issues

| **Indicator** | **Pattern** | **Notas** |
|:---:|:---:|:---:|
| Transactional `BEGIN/COMMIT` ausente | Multi-statement DB ops | Sin atomicidad → race. |
| `SELECT ... FOR UPDATE` ausente | Read sin lock | Concurrent reads = race. |
| ORM lazy loading | Lazy fetch con concurrent updates | Common Rails/Django bug. |
| Cache aside pattern | Read DB + populate cache | Cache stampede. |
| Idempotency key ausente | POST sin idempotency-key | Duplicate processing. |
| Optimistic locking missing | No `version` column en row | Lost update. |
| Distributed lock TTL too short | Lock expires durante action | Lock loss. |
| Rate limiter bucket race | Multi-instance counters | Inconsistent. |
| Queue consumer race | Multiple workers misma message | Double-processing. |
| Eventual consistency assumption | App assumes synchronous | Distributed race. |
^race-detect-atomicity

___

## Window de Exploit

| **Window type** | **Identificación** | **Tooling** |
|:---:|:---:|:---:|
| Single-packet (HTTP/2) | Endpoint con HTTP/2 support + processing time variable | Turbo Intruder. |
| Last-byte sync (HTTP/1.1) | HTTP/1.1 con keep-alive | Tor / pipelining. |
| Network-level race | Geographic CDN edges con sync delay | Multi-region. |
| Application-level race | Backend processing time > 50ms | Fácil exploit. |
| Database-level race | Sin row lock | Frequent vector. |
| Distributed system race | Multi-microservice flow | Complex. |
| Sleep gadget probe | Sleep en endpoint via SQLi/SSRF/etc → infer race window | Side channel. |
| Profile timing | Mandar 1 request + medir tiempo | Baseline para tunear. |
| Stress test concurrent | 10 / 50 / 100 requests simultáneos | Estabilidad. |
| Side-channel timing | Response length / status diferencial | Indirect. |
^race-detect-window

### Probe rápido para detectar race window

```bash
# 1. Baseline timing
time curl -s -X POST -H "Content-Type: application/json" \
  -d '{"action":"transfer","amount":1}' \
  https://target/api/transfer
# real    0m0.342s

# Si > 50ms → window suficiente para race attack

# 2. Stress concurrente con curl + xargs (rough test)
seq 10 | xargs -P 10 -I {} curl -s -X POST \
  -d '{"action":"transfer","amount":1}' https://target/api/transfer

# Verificar resultado:
# - Si balance decrementó 1 vez en lugar de 10 → race condition existe
# - Si decrementó 10 veces → atomic correctly handled
```

***
