---
aliases:
  - Web Application Firewall
tags:
  - estado/completo
  - asset/web-app
kind: Concept
linked:
---
# WAF

> [!info]
> **Web Application Firewall** — filtro entre cliente y app que bloquea payloads conocidos. Detectar tipo + bypass via encoding, fragmentation, parser confusion.

***

## Detección

```bash
# wafw00f
wafw00f https://<target>

# Manual: enviar payload obvio y observar response
curl -A 'sqlmap' https://<target>/
curl 'https://<target>/?q=<script>alert(1)</script>'
```

Headers/responses indicativos:
- `Server: cloudflare`, `cf-ray:` → Cloudflare
- `Server: AkamaiGHost` → Akamai
- `X-Sucuri-ID:` → Sucuri
- `X-CDN: imperva` → Imperva / Incapsula
- `X-WAF: ModSecurity` → ModSec
- Response 403 con título "Request blocked", "Access denied" → varios

***

## Bypass techniques

| Técnica | Ejemplo |
|---|---|
| **Case variation** | `sELeCt` en lugar de `SELECT` |
| **Encoding** | URL (`%2F`), double URL (`%252F`), HTML, Unicode |
| **Comments inline** | `SEL/**/ECT`, `UNIO/*!*/N` (MySQL) |
| **Whitespace alt** | Tab, `+`, `%09`, `%0a` |
| **Concatenation** | `'a'+'d'+'min'` |
| **Polyglots** | XSS payloads que funcionan en múltiples contextos |
| **HTTP method swap** | POST vs GET, OPTIONS, PUT |
| **HPP** | `?id=1&id=2` — diff parser frontend/backend |
| **Origin bypass** | `Host:` header con CDN-bypassing |
| **IP whitelist abuse** | `X-Forwarded-For: 127.0.0.1` |
| **Path bypass** | `..;/`, `%00`, doble slash `//`, `;` (Tomcat) |
| **Fragmentación** | Split request en chunks |
| **HTTP smuggling** | TE/CL desync para slip past WAF |

Ver [[HTTP Request Smuggling]], [[HTTP Parameter Pollution]], [[CRLF Injection]].

***

## Origin discovery (bypass via direct)

```bash
# 1. Históricos DNS
curl 'https://api.viewdns.info/iphistory/?domain=<target>&apikey=...'

# 2. Cert Transparency con subdomains menos protected
crt.sh / Censys → subdomains que apunten a IPs reales

# 3. Email headers (SPF/DKIM enviado desde server real)
host -t TXT <target>

# 4. Shodan / Censys / FOFA query
shodan search 'ssl:"<target>"'

# 5. SSRF leak interno
```

***

## Notas Relacionadas

- [[HTTP Request Smuggling]]
- [[HTTP Parameter Pollution]]
- [[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]]
- [[XSS - Filtros XSS y WAF mediante Codificaciones Múltiples]]
