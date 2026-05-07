---
aliases:
  - Race Bypass
  - DB Isolation Race
  - Distributed Race
tags:
  - type/cheatsheet
  - vuln/race-condition
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Race Conditions]]'
---
# Race Conditions - Bypasses y Edge Cases

***

## Lock Contention Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | App usa locks pero implementación tiene window — race antes/después de lock acquire | Lock impl bug. |
| Lock acquire race | TOCTOU entre "is locked?" y "set locked" | Common DIY bug. |
| Lock TTL too short | Distributed lock expires durante action → second actor acquires | Redis SETNX classic. |
| Lock release race | Premature release antes de transaction commit | DB inconsistency. |
| Reentrant lock confusion | Same thread acquires twice → release once | Logic bug. |
| Lock per-resource | Multi-resource transaction needs all locks → deadlock or partial | Multi-lock race. |
| Optimistic lock retry abuse | Version conflict → retry → race en retry path | Loop window. |
| Spurious wakeup | Notification race en condition variables | Native code. |
| Try-lock skip | App uses try_lock + skip if locked | Retry race. |
| Atomic compare-and-swap fail | CAS fails → retry → atacante sobrepasa CAS check | Hardware-level. |
^race-bypass-lock

___

## Database Isolation Level Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| READ UNCOMMITTED | Dirty reads → atacante read uncommitted state | Rarest. |
| READ COMMITTED (default Postgres) | Phantom reads possible | Race window. |
| REPEATABLE READ (default MySQL) | Phantom inserts ok | Less restrictive. |
| SERIALIZABLE | Strictest — race nullified usually | Best defense. |
| Lost update anomaly | Two transactions read + update | Classic. |
| Skip locked rows | `SELECT ... FOR UPDATE SKIP LOCKED` | Bypass per-row lock. |
| `SELECT FOR UPDATE NOWAIT` | App fails fast → race en skip path | Edge. |
| Unique index race | Two inserts mismo unique key — depends on isolation | DB-specific. |
| Foreign key race | Insert row referencing another row deleted concurrently | Constraint race. |
| Cascade delete race | Delete parent + insert child concurrent | Orphan rows. |
| Snapshot isolation gap | MVCC snapshot pre-write | Classic vector. |
^race-bypass-db-isolation

### Lost update example

```sql
-- Transaction 1 (User A)
BEGIN;
SELECT balance FROM accounts WHERE id=1; -- balance = 100
-- ... business logic ...
UPDATE accounts SET balance = 100 - 50 WHERE id=1; -- balance = 50
COMMIT;

-- Transaction 2 (User A simultaneously)
BEGIN;
SELECT balance FROM accounts WHERE id=1; -- balance = 100 (still!)
-- ... business logic ...
UPDATE accounts SET balance = 100 - 30 WHERE id=1; -- balance = 70
COMMIT;

-- Final: balance = 70 (NOT 20 expected) — lost the 50 deduction
```

___

## Compensation Transaction Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Sagas pattern: action + compensation transaction. Race entre action y compensation | Distributed compensation bug. |
| Compensation never fires | Action succeeds, compensation never triggered → permanent state | Saga incomplete. |
| Double compensation | Compensation triggered twice → reverse + reverse again | Money refund double. |
| Compensation order race | Compensations should be reverse-order. Race breaks order. | Inconsistent state. |
| Idempotency key bypass | Idempotency key reuse race → same action twice processed | Double-action. |
| Outbox pattern race | Event published before DB commit → other service acts on uncommitted | Distributed bug. |
| Two-phase commit failure | Coordinator crashes between phases | Partial commit. |
| TCC pattern race | Try-Confirm-Cancel state — race breaks invariant | Banking DLT. |
| Eventual consistency window | App assumes sync, ops async | Common bug. |
| Distributed transaction timeout | Timeout race | Partial. |
| Side effects compensation | External API call + compensation race | Email already sent. |
^race-bypass-compensation

___

## Distributed System Races

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Microservices con eventual consistency — race entre service A's view vs service B's view | Multi-service. |
| Service-to-service race | Service A writes + Service B reads stale | Common pattern. |
| CAP theorem trade-off | Available + Partitioned → Consistency may suffer | Network partition. |
| Read-after-write | Write to leader → read from replica before replication | Replication lag. |
| Dual-write inconsistency | DB + cache + queue all need update — race between | Multi-target. |
| Event ordering | Out-of-order events → state divergence | Kafka partitioning. |
| Message at-least-once | Same message processed multiple times → race in dedupe | Dedup bug. |
| Multi-region race | Geographic replication lag | Per-region state. |
| CDN propagation race | Update content + cache invalidate → race | Stale serve. |
| DNS update race | DNS TTL → race entre resolver caches | Network-level. |
| Service mesh races | Istio/Linkerd timing | Edge complex. |
| Sidecar race | Sidecar proxy + app race | Container. |
^race-bypass-distributed

___

## Edge Cases

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HTTP/3 single-packet | QUIC streams race | Modern alternative to H2. |
| WebSocket race | Multiple WS messages concurrent | Real-time. |
| GraphQL aliased mutations race | Single query with N aliased mutations executes parallel | GraphQL combo. |
| Webhook callback race | App processes webhook + handles concurrent | External-trigger. |
| Email link click race | Single-use link + auto-fetch by email scanners | Pre-click consume. |
| OAuth callback race | Authorization code single-use + race exchange | Token exchange. |
| SAML response race | Single-use assertion + race | Federated. |
| SCIM provisioning race | User create + sync simultáneamente | Identity. |
| Captcha solve race | Captcha valid window + race solve | Edge. |
| Push notification race | Mobile push + action confirm | Mobile-specific. |
| Browser autofill race | Form auto-submit + autofill | Client-side. |
| Mobile app + web race | Same account both devices | Multi-device. |
^race-bypass-edge

***
