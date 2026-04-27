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

| **Objetivo** | **Payload / Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Endpoint decrementa cuota/balance sin lock atómico → N requests simultáneos pueden cada uno encontrar el pre-decrement value | Vector más común. |
| Spend balance 2x | Send 2 requests simultáneos para spend 100% del balance | Cada uno ve balance lleno. |
| Spend balance 10x | 10 requests concurrent → balance decrementado 1 vez si race | Multiplier. |
| Voucher 1-time-use | 2 redemptions concurrent con mismo código | Stock overrun. |
| Coupon stock | 5 stock items, 50 requests → > 5 redeemed | Inventory race. |
| API key generation cap | "Max 5 keys" → spam concurrent → 50 keys | Quota bypass. |
| Withdraw doble | Bank app: withdraw $1000 dos veces de cuenta con $1000 | Financial. |
| Auto-approve threshold | Refund < $10 auto-approved → 100 refunds de $9.99 simultáneos | Threshold race. |
| Free trial extend | Trial extension only-once → doble-extend | Service abuse. |
| Vote multiple veces | Voto 1-per-user → spam concurrent → 50 votos | Manipulation. |
| Subscription duplicar | Subscribe action paid → doble cobro | Edge financial. |
^race-type-limit

### PoC limit overrun

```http
POST /api/transfer HTTP/1.1
Host: target.com
Content-Type: application/json
Cookie: session=...

{"to":"attacker","amount":1000}
```

Send same request 20 times en single connection (Burp Repeater Send group, Turbo Intruder, etc). Check balance: si decrementó solo 1 vez en lugar de 20 → race confirmed.

___

## Multi-Step State Machine

| **Objetivo** | **Payload / Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Flow `A → B → C → D` con checks per-step. Race entre A→B salta C, etc | State skip. |
| Order checkout race | `cart → review → pay → ship` — race salta `pay` | Free shipping. |
| Approval flow | `submit → review → approve` — race salta review | Bypass approval. |
| KYC verification | `register → verify_email → verify_phone → activate` — race | Skip verify steps. |
| Refund process | `request → review → approve → execute` — race execute sin approve | Direct refund. |
| Subscription cancel | `cancel_request → confirm → terminate` — race terminate | Bypass cancellation policy. |
| Account merge | `request → confirm both sides → merge` — race | Hostile merge. |
| Privilege grant | `request → admin_approve → grant` — race grant | Privesc. |
| File approval | `upload → scan → approve → publish` — race publish sin scan | Malware persistence. |
| 2FA enrollment | `start → confirm → enable` — race enable bypass confirm | 2FA fake. |
| Onboarding completion | Multi-step setup, race salta completion check | Half-setup state. |
^race-type-state-machine

### Workflow exploit state machine

```
1. Map flow: enumerar steps + endpoints + state transitions.
2. Identify final action (que tiene gate).
3. Send concurrent: trigger early step + final action.
4. Si race window: final action procesa antes de gate check.

Ejemplo:
  Endpoint A: /order/123/pay   (check status=='reviewed')
  Endpoint B: /order/123/ship  (check status=='paid')

Race: send A + B simultaneously
  → B verifica antes de A complete → status='reviewed' falla check
  → Pero si check === status (lazy lookup) y A modifica simultaneously
    → B puede leer 'reviewed' como input pero update a 'shipped' después
```

___

## Confirmation Step Bypass

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Action peligrosa requiere confirm. Race entre action submit y confirm check. | Skip confirm step. |
| Delete account race | `submit_delete + confirm_delete` simultáneos → execute sin verify confirm | Permanent damage. |
| Transfer high amount | Big transfer requires email confirm → race procesa sin email | Financial. |
| Password change race | Old password check + new password set | Skip old password. |
| Email change race | Verification email + actual change | Email hijack. |
| Linked account remove | Confirm + unlink | Bypass safety check. |
| Subscription change | Confirm new tier + apply | Skip charge. |
| Settings reset | Reset to defaults + confirm | Reset before user notice. |
| Permission revoke | Confirm + revoke admin | Lockout. |
| Deletion of audit logs | Admin confirm + delete | Cover tracks. |
^race-type-confirm

___

## 2FA / OTP Race

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | OTP single-use validation. Race entre validate y mark-as-used | Multi-attempt. |
| 6-digit OTP brute con race | 1M codes con N concurrent → en lugar de 5 attempts × hours, mil intentos en seg | Effective brute. |
| TOTP window abuse | TOTP changes cada 30s. Race window pequeño pero exploit | Real-time. |
| SMS OTP guess | 6 digits + race + 1M intentos | Standard. |
| Backup codes | Multiple codes, single-use each | Pool overrun. |
| WebAuthn challenge race | Challenge nonce reuse | Cryptographic edge. |
| Magic link race | One-time link, race antes de mark-used | Email link reuse. |
| Recovery codes | Mismo concepto que backup | Recovery bypass. |
| MFA enrollment race | Skip MFA setup mid-flow | Permanent bypass. |
| 2FA disable race | Confirm + disable → race | Account weakening. |
^race-type-2fa

___

## File Upload Race

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Upload + scan + accept. Race accede file durante scan window. | TOCTOU file. |
| Antivirus scan race | Upload php → scan in progress → access via web → execute antes de scan complete | Webshell drop. |
| Renamer race | Upload `.php`, app renames to `.txt`. Race accede mientras rename | Pre-rename access. |
| Quarantine race | Upload malicious → moved to quarantine. Race accede pre-move | Window exploit. |
| File overwrite race | Two uploads same filename → última overwrites first | Replace logic. |
| Symlink race (server-side) | Upload symlink before scan | Symlink TOCTOU. |
| Image processing race | Upload → resize → store. Race accede durante resize | Half-processed access. |
| Validation bypass | Upload OK → validation fails → reject. Race accede entre OK y reject | Window. |
| Permission elevation | Upload as user, before chmod 644 happens | Permission race. |
| Atomic move race | Backend: write temp → rename to final. Race accede temp | Standard FS TOCTOU. |
^race-type-fileupload

___

## TOCTOU Filesystem

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Server check filesystem state, then act. Atacante manipula state entre check y act. | Local privesc clásico. |
| Symlink race | App valida path + read. Atacante reemplaza con symlink durante race | Read sensitive file. |
| File replace race | App valida content + executes. Replace before exec | Code injection. |
| Permission race | App chmod + execute. Race set SUID before exec | Privesc. |
| Hard link race | App writes to file. Atacante hard-links to sensitive file. | Overwrite. |
| /tmp race | App creates /tmp/file + uses. Symlink /tmp/file → /etc/passwd | Classic TOCTOU. |
| Lock file race | Lock check + create. Race entre check y create | Lock bypass. |
| Atomic operations | `O_EXCL` flag missing | `open(O_CREAT, 0644)` sin EXCL. |
| Mount race | Mount + use | Container escape edge. |
| Check via stat() + open() | stat returns OK, open fails (or vice versa) | Classic. |
^race-type-toctou-fs

***
