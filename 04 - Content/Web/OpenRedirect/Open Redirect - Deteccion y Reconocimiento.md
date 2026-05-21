---
aliases:
  - Open Redirect Detection
  - Redirect Recon
tags:
  - type/technique
  - vuln/open-redirect
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Open Redirect]]'
---
# Open Redirect - Detección y Reconocimiento

***

## Identificar Parámetros de Redirect

| **Param name** | **Pattern** | **Common context** |
|:---:|:---:|:---:|
| `?url=` | URL parameter directo | Generic redirect. |
| `?next=` | Post-action redirect | Login flows. |
| `?return=` / `?returnTo=` / `?return_url=` | Post-login return | Auth. |
| `?redirect=` / `?redirect_uri=` / `?redirect_url=` | Standard | OAuth, generic. |
| `?goto=` | Custom redirect | Some apps. |
| `?continue=` | Google-style auth | Federated identity. |
| `?destination=` | Drupal-style | CMS. |
| `?dest=` | Short form | Compact. |
| `?path=` | Path-based | Limited scope (usually intra-app). |
| `?to=` | Generic | Custom. |
| `?out=` | Outbound link | Affiliate / tracking. |
| `?away=` | Outbound link tracker | Affiliate. |
| `?target=` | Form target | HTML forms. |
| `?link=` | Link redirect | Click tracking. |
| `?source=` | Less common | Edge. |
| `?location=` | Direct location header | API redirects. |
| `?callback=` | JSONP / callback | Different vector. |
| `?go=` | Short | Compact. |
| Hidden in body | `redirect` field en POST forms | Form-based. |
| Hidden in JSON | `{"redirect":"..."}` API requests | API redirect. |
| Cookie-based | Cookie con URL → followed on next request | Stealth vector. |
^or-detect-params

### Burp pasivo + grep

```bash
# Búsqueda en historial Burp (export)
grep -oE 'url=[^&]+|next=[^&]+|redirect=[^&]+|return=[^&]+|goto=[^&]+|continue=[^&]+' burp.txt

# Detectar redirects que reflejan URL en response Location header
curl -sI 'https://target/login?next=/dashboard' | grep -i location

# Detectar JS-based redirect
curl -s 'https://target/login?next=/dashboard' | grep -oE 'location\s*=\s*["\047][^"\047]+'
```

___

## Endpoints Comunes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `/login` | `?next=/dashboard` | Post-login redirect. |
| `/logout` | `?next=/` | Post-logout redirect. |
| `/auth/callback` | OAuth callback URI | Federated. |
| `/oauth/authorize` | `redirect_uri` param | OAuth code/token. |
| `/saml/acs` | SAML AssertionConsumerService | SSO redirect. |
| `/sso/return` | SSO continuation | Federated. |
| `/account/verify` | Email verify post-redirect | Account flows. |
| `/password/reset` | Reset confirm redirect | ATO chain. |
| `/r/`, `/redirect/`, `/go/` | Generic redirect endpoints | Tracking. |
| `/r?url=...` | Common short form | Affiliate. |
| `/out` | Outbound link tracker | Email links. |
| `/jump` | Generic | Custom. |
| `/clk` / `/click` | Click tracker | Affiliate / analytics. |
| `/proxy?url=...` | Proxy endpoint (SSRF risk too) | Combo. |
| `/share?url=...` | Share button | Social. |
| `/qr?url=...` | QR generator | Generated redirect. |
| `/preview?url=...` | URL preview | OG card. |
| `/_/redirect` | Internal redirect | Custom router. |
| `/api/redirect` | API redirect endpoint | Modern. |
| `/_next/redirect` | Next.js framework | SSR. |
^or-detect-endpoints

___

## Detectar 301/302 / JS-Based Redirects

| **Tipo** | **Indicador** | **Probe** |
|:---:|:---:|:---:|
| HTTP 301 (permanent) | `Location:` header + status 301 | Cached browser-side. |
| HTTP 302 (found) | `Location:` header + status 302 | Standard temporal. |
| HTTP 303 (see other) | `Location:` header + status 303 | POST → GET redirect. |
| HTTP 307 (temp) | `Location:` header + status 307 | Preserves method. |
| HTTP 308 (permanent) | `Location:` header + status 308 | Method preserve. |
| Meta refresh | `<meta http-equiv="refresh" content="0;url=...">` | HTML-based. |
| JS location | `window.location = url`, `location.href = url`, `location.replace(url)` | Client-side. |
| JS location.assign | `location.assign(url)` | Same. |
| JS top.location | `top.location = url` | Frame escape. |
| JS history.replaceState | Edge — no real redirect | Less common vector. |
| iframe redirect | `<iframe src="...">` con onload redirect | Edge. |
| Form action submit | `<form action="..." onload>` | Edge. |
| Anchor href (no auto) | `<a href="...">` requires click | Manual social engineering. |
| Service Worker fetch redirect | Modern PWA edge | Niche. |
| HTTP/2 ALPN redirect | Protocol-level redirect | Edge. |
^or-detect-types

### Probe rápido por tipo de redirect

```bash
# 1. Detectar HTTP redirect
curl -sI 'https://target/login?next=https://attacker.com' | grep -iE 'location|HTTP/'

# 2. Si no header → check meta refresh
curl -s 'https://target/login?next=https://attacker.com' | grep -oE '<meta http-equiv=["\047]refresh["\047][^>]*>'

# 3. Si no meta → check JS redirect
curl -s 'https://target/login?next=https://attacker.com' | grep -oE 'location\s*[=.][^;]*'

# 4. Auto-detect con tool
# OpenRedireX -l urls.txt -p payloads.txt
```

***
