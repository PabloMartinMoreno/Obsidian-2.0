---
aliases:
  - Race Condition
  - TOCTOU
  - Time-of-Check Time-of-Use
  - Concurrency Bug
tags:
  - vuln/race-condition
  - technique/initial-access
  - technique/privilege-escalation
  - technique/impact
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[Race Conditions - Deteccion y Reconocimiento]]"
  - "[[Race Conditions - Tipos]]"
  - "[[Race Conditions - Single-Packet Attack]]"
  - "[[Race Conditions - Vectores Especificos]]"
  - "[[Race Conditions - Tooling]]"
  - "[[Race Conditions - Bypasses y Edge Cases]]"
  - "[[Web Cache Poisoning]]"
  - "[[HTTP Request Smuggling]]"
  - "[[Burp Suite]]"
---
# Race Conditions

---

## Cheatsheet

### 🎯 Tipos de Race Conditions

````tabs
tab: **Limit Overrun**
![[Race Conditions - Tipos#^race-type-limit]]

tab: **Multi-Step State Machine**
![[Race Conditions - Tipos#^race-type-state-machine]]

tab: **Confirmation Step Bypass**
![[Race Conditions - Tipos#^race-type-confirm]]

tab: **2FA / OTP Race**
![[Race Conditions - Tipos#^race-type-2fa]]

tab: **File Upload Race**
![[Race Conditions - Tipos#^race-type-fileupload]]

tab: **TOCTOU Filesystem**
![[Race Conditions - Tipos#^race-type-toctou-fs]]
````

### ⚡ Single-Packet Attack

````tabs
tab: **HTTP/2 Single-Packet**
![[Race Conditions - Single-Packet Attack#^race-single-h2]]

tab: **Last-Byte Sync (HTTP/1.1)**
![[Race Conditions - Single-Packet Attack#^race-single-lastbyte]]

tab: **Pre-Loading Delays**
![[Race Conditions - Single-Packet Attack#^race-single-prewarm]]

tab: **Sleep Gadget Probe**
![[Race Conditions - Single-Packet Attack#^race-single-sleep]]
````

### 💉 Vectores Específicos

````tabs
tab: **Multi-Endpoint Races (Chains)**
![[Race Conditions - Vectores Especificos#^race-vector-multi-endpoint]]

tab: **Promo Code / Voucher Redemption**
![[Race Conditions - Vectores Especificos#^race-vector-voucher]]

tab: **Voting / Rating Manipulation**
![[Race Conditions - Vectores Especificos#^race-vector-voting]]

tab: **ATO via Password Reset Race**
![[Race Conditions - Vectores Especificos#^race-vector-ato]]

tab: **Cache Fill Race**
![[Race Conditions - Vectores Especificos#^race-vector-cache]]
````

### 🛠️ Tooling

````tabs
tab: **Turbo Intruder (Burp)**
![[Race Conditions - Tooling#^race-tool-turbo]]

tab: **Burp Repeater Single Connection**
![[Race Conditions - Tooling#^race-tool-burp-repeater]]

tab: **race-the-web (CLI)**
![[Race Conditions - Tooling#^race-tool-rtw]]

tab: **Python asyncio / aiohttp**
![[Race Conditions - Tooling#^race-tool-python]]

tab: **Otros Tools y Scripts**
![[Race Conditions - Tooling#^race-tool-others]]
````

### 🛡️ Bypasses y Edge Cases

````tabs
tab: **Lock Contention Abuse**
![[Race Conditions - Bypasses y Edge Cases#^race-bypass-lock]]

tab: **Database Isolation Level Abuse**
![[Race Conditions - Bypasses y Edge Cases#^race-bypass-db-isolation]]

tab: **Compensation Transaction Bypass**
![[Race Conditions - Bypasses y Edge Cases#^race-bypass-compensation]]

tab: **Distributed System Races**
![[Race Conditions - Bypasses y Edge Cases#^race-bypass-distributed]]

tab: **Edge Cases (HTTP/3, WS, GraphQL)**
![[Race Conditions - Bypasses y Edge Cases#^race-bypass-edge]]
````

---

## Overview

**Race Conditions** = vulnerabilidad por **falta de atomicidad** en operaciones que dependen de estado compartido. Atacante envía N requests simultáneos para alcanzar un estado inalcanzable secuencialmente: gastar el mismo balance N veces, redimir voucher single-use múltiples veces, saltar un paso de un state machine, brutezar OTP con racing window, etc.

Vector clase A — descubierto formalmente en sistemas multi-thread años 70. Web application races re-popularizadas con paper James Kettle 2023 ("Smashing the State Machine") que introdujo HTTP/2 single-packet attack — bypass del network jitter que limitaba ataques pre-2023.

### TOCTOU explained

```
Time-of-Check (TOC):    Server reads state           [if balance >= 100]
                        ─────────────────────────►
                                  ↑ ATTACKER WINDOW ↑
                        ◄─────────────────────────
Time-of-Use (TOU):      Server modifies state         [balance -= 100]
```

Si N requests ejecutan TOC simultáneamente, todos ven balance=full. Cada uno procede a TOU. Resultado: balance decrementa solo 1 vez en lugar de N.

### Por qué es difícil mitigar

1. **Atomicity nivel código** — devs olvidan transactions, locks, CAS.
2. **Atomicity nivel DB** — isolation levels permiten phantoms.
3. **Atomicity nivel distribuido** — microservices con eventual consistency rompen invariants.
4. **Atomicity nivel network** — network jitter limitaba races pre-HTTP/2.

HTTP/2 single-packet attack (Kettle 2023) eliminó la última excusa: ahora cliente puede sincronizar requests al server con precisión de microsegundos.

### Diferencia con vulns relacionadas

| | **Race Condition** | **CSRF** | **Cache Poisoning** |
|---|---|---|---|
| Window timing | Microseconds | Cross-site request | Cache TTL |
| Required | Concurrency en server | User authenticated victim | Cacheable response |
| Vector | Multi-request burst | Single request | Single request |
| Impact | State inconsistency | Action on user behalf | All users affected |

---

## Workflow de explotación

```
1. Identificar endpoints state-changing (transfer, redeem, vote, confirm).

2. Detectar race vulnerability:
   - Time-of-check timing
   - Atomic operations missing
   - Lock implementation bugs

3. Validate window:
   - Send 10 concurrent → check if all succeeded
   - If only 1 success → atomic, race not present
   - If multiple successes → race exists

4. Setup tooling:
   - Turbo Intruder con Engine.BURP2 (HTTP/2 single-packet)
   - O Burp Repeater "Send group → in single connection"
   - Backup: Python asyncio para custom logic

5. Execute race:
   - 20-50 concurrent requests
   - Pre-warm connection si necesario
   - Sleep gadget si window muy chico

6. Validate impact:
   - Balance decrementó 1 vez en lugar de 20?
   - Voucher redeemed N times?
   - State machine skipped step?

7. Reportable PoC:
   - Document timing (HTTP/2 single-packet)
   - N concurrent requests proof
   - Final state vs expected state
```

---

## Detección rápida

### Recon activo

````tabs
tab: **Identificar Endpoints State-Changing**
![[Race Conditions - Deteccion y Reconocimiento#^race-detect-endpoints]]

tab: **TOCTOU Patterns**
![[Race Conditions - Deteccion y Reconocimiento#^race-detect-toctou]]

tab: **Atomicity / Locking Issues**
![[Race Conditions - Deteccion y Reconocimiento#^race-detect-atomicity]]

tab: **Window de Exploit**
![[Race Conditions - Deteccion y Reconocimiento#^race-detect-window]]
````

### Indicadores en código backend

```python
# Python — VULN sin lock
def transfer(user, amount):
    balance = db.query("SELECT balance FROM accounts WHERE user=?", user)
    if balance >= amount:
        db.execute("UPDATE accounts SET balance = balance - ? WHERE user=?",
                   amount, user)
        return True
    return False

# Python — SAFE con transaction + row lock
def transfer(user, amount):
    with db.transaction():
        balance = db.query("SELECT balance FROM accounts WHERE user=? FOR UPDATE",
                           user)
        if balance >= amount:
            db.execute("UPDATE accounts SET balance = balance - ? WHERE user=?",
                       amount, user)
            return True
    return False
```

```javascript
// Node.js — VULN sin atomic op
async function redeem(code) {
    const voucher = await db.findOne({code});
    if (voucher.uses < voucher.maxUses) {
        await db.update({code}, {$inc: {uses: 1}});
        return applyDiscount(code);
    }
}

// Node.js — SAFE con atomic increment + condition
async function redeem(code) {
    const result = await db.findOneAndUpdate(
        {code, uses: {$lt: voucher.maxUses}},  // condition atomic
        {$inc: {uses: 1}}
    );
    if (result) return applyDiscount(code);
}
```

### Probes mínimos

```bash
# 1. Baseline
time curl -X POST -H "Cookie: session=..." \
  -d '{"action":"transfer","amount":1}' \
  https://target/api/transfer

# 2. Quick race con xargs
seq 20 | xargs -P 20 -I {} curl -s -X POST \
  -H "Cookie: session=..." \
  -d '{"action":"transfer","amount":1}' \
  https://target/api/transfer

# 3. Check final balance
curl -s -H "Cookie: session=..." https://target/api/balance
# Si decrementó 1 unit en lugar de 20 → race condition

# 4. Burp Repeater single connection
# Send group → in single connection (con HTTP/2)
```

---

## Impacto

- **Financial loss** — limit overrun en transfers / withdrawals / refunds.
- **Inventory bypass** — stock overrun en e-commerce.
- **Account takeover** — password reset / 2FA race.
- **Privilege escalation** — state machine bypass en approval flows.
- **DoS / DOS denial** — quota overrun causing service exhaustion.
- **Reputation manipulation** — multi-vote / multi-rating amplification.
- **Fraud at scale** — referral / cashback / loyalty point inflation.
- **Compliance violation** — bypass de audit trails / approvals.

---

## Mitigación (defender)

- **Database transactions** — `BEGIN/COMMIT` con isolation `SERIALIZABLE` para ops críticas.
- **Row-level locks** — `SELECT ... FOR UPDATE` en lookup + update flows.
- **Atomic operations** — `UPDATE balance = balance - 100 WHERE balance >= 100` con condition embedded.
- **Compare-and-swap (CAS)** — versioned updates con version field.
- **Distributed locks** — Redis SETNX, etcd lock — con TTL apropiado.
- **Idempotency keys** — single-use keys per request → backend dedupe.
- **State machine validation** — re-check state en cada step transition.
- **Single-flight cache** — lock cache fill window.
- **Rate limiting** — multi-instance counters con distributed counter (Redis).
- **Audit con concurrent stress tests** — race tests en CI/CD.
- **Idempotent endpoints** — design REST APIs idempotentes (PUT instead of POST).
- **Prevent HTTP/2 if not needed** — algunas apps don't need H2 — disable mitigates single-packet.
- **Resource quotas** — backend enforces hard limits independent de check.

---

## Para entender Race Conditions

**Por qué network jitter limitaba el ataque pre-2023:**

Pre-HTTP/2, atacante mandaba 50 requests via TCP — cada uno con ~10ms jitter. Aunque sent simultaneously, llegaban con spread. Server processing arranca per-request, race window quedaba reducido a microsegundos sin tooling preciso.

**Por qué HTTP/2 cambió todo (Kettle 2023):**

HTTP/2 multiplexa N streams en single TCP packet. Cliente puede:
1. Pre-load headers de N streams.
2. Hold last DATA frame.
3. Flush all simultaneously → server receives all juntos.

Race window = processing time interno del server, no network jitter. Microsecond precision desde browser/Burp.

**Por qué TOCTOU es endemic:**

Devs piensan en código secuencial: "leer balance, restar, escribir". Concurrencia rompe esto sin que el código lo evidencie. Fixes requieren estructuras explícitas (transactions, locks, atomic ops) que no son default.

**Diferencia con bugs single-thread:**

Single-thread bugs son determinísticos. Race conditions requieren timing — pueden ser inreproducibles en testing (test loops sin concurrencia). Por eso escapan a QA y aparecen en prod bajo carga.

---

## Recursos

- [PortSwigger - Race Conditions](https://portswigger.net/web-security/race-conditions) — labs y conceptos.
- [PortSwigger Research - Smashing the State Machine (Kettle 2023)](https://portswigger.net/research/smashing-the-state-machine) — paper definitivo HTTP/2 single-packet.
- [PayloadsAllTheThings - Race Condition](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Race%20Condition) — payloads.
- [HackTricks - Race Condition](https://book.hacktricks.xyz/pentesting-web/race-condition) — referencia.
- [Turbo Intruder](https://github.com/PortSwigger/turbo-intruder) — Burp ext.
- [race-the-web](https://github.com/aaronhnatiw/race-the-web) — CLI.
- [OWASP - Testing for Race Conditions](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/) — methodology.
- [TOCTOU - Wikipedia](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use) — concept.
- [Defcon 31 - Web Race Conditions (James Kettle)](https://www.youtube.com/watch?v=bouCwiQa6yU) — talk video.

---
