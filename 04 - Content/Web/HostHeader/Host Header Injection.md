---
aliases:
  - Host Header Injection
  - HHI
  - Host Header Attack
  - Password Reset Poisoning
tags:
  - vuln/host-header-injection
  - technique/initial-access
  - technique/credential-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[Host Header Injection - Deteccion y Reconocimiento]]"
  - "[[Host Header Injection - Vectores Comunes]]"
  - "[[Host Header Injection - Headers Alternativos]]"
  - "[[Host Header Injection - Bypass de Validacion]]"
  - "[[Host Header Injection - Chains y Variantes]]"
  - "[[Host Header Injection - Tooling]]"
  - "[[Web Cache Poisoning]]"
  - "[[HTTP Request Smuggling]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
  - "[[Burp Suite]]"
---
# Host Header Injection

---

## Cheatsheet

### 🎯 Vectores Comunes

````tabs
tab: **Password Reset Poisoning**
![[Host Header Injection - Vectores Comunes#^hhi-vector-reset]]

tab: **Cache Poisoning via Host**
![[Host Header Injection - Vectores Comunes#^hhi-vector-cache]]

tab: **SSRF a Virtual Hosts Internos**
![[Host Header Injection - Vectores Comunes#^hhi-vector-ssrf]]

tab: **Routing-Based Access Control Bypass**
![[Host Header Injection - Vectores Comunes#^hhi-vector-acl]]

tab: **Email Link Generation Hijack**
![[Host Header Injection - Vectores Comunes#^hhi-vector-email]]
````

### 📡 Headers Alternativos

````tabs
tab: **`X-Forwarded-Host` (XFH)**
![[Host Header Injection - Headers Alternativos#^hhi-altheader-xfh]]

tab: **`X-Forwarded-For` / `X-Real-IP`**
![[Host Header Injection - Headers Alternativos#^hhi-altheader-xff]]

tab: **`X-Forwarded-Server`**
![[Host Header Injection - Headers Alternativos#^hhi-altheader-xfs]]

tab: **`X-HTTP-Host-Override` / `X-Host`**
![[Host Header Injection - Headers Alternativos#^hhi-altheader-host-override]]

tab: **`X-Original-URL` / `X-Rewrite-URL`**
![[Host Header Injection - Headers Alternativos#^hhi-altheader-original]]

tab: **`Forwarded:` (RFC 7239)**
![[Host Header Injection - Headers Alternativos#^hhi-altheader-rfc7239]]
````

### 🔓 Bypass de Validación

````tabs
tab: **Multiple Host Headers**
![[Host Header Injection - Bypass de Validacion#^hhi-bypass-multiple]]

tab: **Port Injection**
![[Host Header Injection - Bypass de Validacion#^hhi-bypass-port]]

tab: **Indentation / Whitespace**
![[Host Header Injection - Bypass de Validacion#^hhi-bypass-whitespace]]

tab: **Absolute URL en Request Line**
![[Host Header Injection - Bypass de Validacion#^hhi-bypass-absolute]]

tab: **Path Injection en Host**
![[Host Header Injection - Bypass de Validacion#^hhi-bypass-path]]
````

### 🔗 Chains y Variantes

````tabs
tab: **Password Reset Poisoning Chain**
![[Host Header Injection - Chains y Variantes#^hhi-chain-reset]]

tab: **Cache Poisoning Combo**
![[Host Header Injection - Chains y Variantes#^hhi-chain-cache]]

tab: **Internal SSRF via Routing**
![[Host Header Injection - Chains y Variantes#^hhi-chain-ssrf]]

tab: **Auth / IP Allowlist Bypass**
![[Host Header Injection - Chains y Variantes#^hhi-chain-auth]]

tab: **HTTP Request Smuggling Combo**
![[Host Header Injection - Chains y Variantes#^hhi-chain-hrs]]
````

### 🛠️ Tooling

````tabs
tab: **Burp Param Miner**
![[Host Header Injection - Tooling#^hhi-tool-paramminer]]

tab: **Custom curl Scripts**
![[Host Header Injection - Tooling#^hhi-tool-curl]]

tab: **Wordlists (PayloadsAllTheThings)**
![[Host Header Injection - Tooling#^hhi-tool-wordlists]]

tab: **HTTP Smuggler Combo**
![[Host Header Injection - Tooling#^hhi-tool-smuggler]]

tab: **Otros Tools y Scripts**
![[Host Header Injection - Tooling#^hhi-tool-others]]
````

---

## Overview

**Host Header Injection (HHI)** = atacante manipula `Host` header (o variantes `X-Forwarded-Host`, `Forwarded`, etc.) para alterar comportamiento del backend que confía en este valor para tareas críticas: construir URLs (reset password, email links), routing virtual hosts, validar trust, generar canonical/base href.

Vector clase A — descubierto en práctica masiva post-2014 (PortSwigger James Kettle paper). Combinable con cache poisoning, HRS, password reset poisoning para impactos altos (account takeover masivo, mass phishing).

### Diferencia con vulns relacionadas

| | **Host Header Injection** | **Cache Poisoning** | **HTTP Request Smuggling** |
|---|---|---|---|
| Vector | `Host` / XFH header | Unkeyed input cached | Front/back parser desync |
| Trigger | Backend trusts Host | Cache stores poisoned | Request smuggling |
| Impact | Reset poisoning, SSRF, ACL bypass | Mass user impact | Multi-vector compound |
| Common combo | Cache poison + HHI | HHI as poison source | Smuggle HHI request |

HHI es vector base, frecuentemente combinable con cache poisoning para amplificar impact.

---

## Workflow de explotación

```
1. Identificar endpoint vulnerable:
   - Password reset: /forgot, /reset
   - Email confirmation: /verify
   - Magic link: /login/magic
   - OAuth callback URL gen
   - Cache headers reflexion (<base href>)

2. Probe Host injection:
   - Host: attacker.com
   - X-Forwarded-Host: attacker.com
   - Forwarded: host=attacker.com
   - Multiple alt headers

3. Verificar reflexion / behavior:
   - Email link a attacker?
   - Response includes <base href="attacker">?
   - Server fetches attacker URL (Collaborator)?

4. Bypass validation:
   - Multiple Host headers (front/back differential)
   - Port injection (target.com:1337)
   - Indentation / whitespace tricks
   - Absolute URL en request line
   - Userinfo (target.com@attacker.com)

5. Decidir explotación:
   a. Password reset poisoning → ATO via email link.
   b. Cache poisoning combo → mass impact.
   c. SSRF a internal vhost → admin panel access.
   d. ACL bypass via trusted Host → privesc.
   e. Email link hijack → token theft.

6. Chain combos:
   - HHI + cache poisoning = mass victim
   - HHI + HRS = bypass front-end validation
   - HHI + Subdomain Takeover = legitimate-looking attacker domain
   - HHI + Open Redirect = chained redirect chain
```

---

## Detección rápida

### Recon activo

````tabs
tab: **Identificar Endpoints que Reflejan / Dependen de Host**
![[Host Header Injection - Deteccion y Reconocimiento#^hhi-detect-endpoints]]

tab: **Probes con Valores Arbitrarios**
![[Host Header Injection - Deteccion y Reconocimiento#^hhi-detect-probes]]

tab: **Test Multi-Header Behavior**
![[Host Header Injection - Deteccion y Reconocimiento#^hhi-detect-multi-header]]
````

### Indicadores en código backend

```python
# Python — VULN (Flask)
from flask import request

@app.route('/forgot', methods=['POST'])
def forgot():
    email = request.form['email']
    # Constructs URL using Host header
    reset_url = f"https://{request.host}/reset?token={token}"  # ← BAD
    send_email(email, reset_url)

# Python — SAFE
SITE_URL = 'https://target.com'  # hardcoded
reset_url = f"{SITE_URL}/reset?token={token}"
```

```php
// PHP — VULN
$reset_link = "https://" . $_SERVER['HTTP_HOST'] . "/reset?token=" . $token;

// PHP — SAFE
$reset_link = "https://target.com/reset?token=" . $token;  // hardcoded
```

```javascript
// Node.js — VULN
app.post('/forgot', (req, res) => {
    const resetUrl = `https://${req.headers.host}/reset?token=${token}`;  // ← BAD
    sendEmail(email, resetUrl);
});

// Node.js — SAFE
const SITE_URL = process.env.SITE_URL || 'https://target.com';
const resetUrl = `${SITE_URL}/reset?token=${token}`;
```

### Probes mínimos

```bash
# 1. Reset poisoning probe
COLLABORATOR=$(./interactsh-client -url-only)
curl -X POST -H "Host: $COLLABORATOR" \
  -d "email=victim@target.com" \
  https://target.com/forgot

# Watch Collaborator for callback or check email link

# 2. Multi-header test
for h in 'Host' 'X-Forwarded-Host' 'X-Host' 'X-HTTP-Host-Override'; do
  curl -X POST -H "$h: $COLLABORATOR" \
    -d "email=victim@target.com" \
    https://target.com/forgot
done

# 3. Reflection probe (base href)
curl -s -H "Host: probemarker.com" https://target/ | \
  grep -i 'probemarker'
# If reflected → cache poisoning chain candidate

# 4. Internal vhost probe
for vh in 'localhost' 'admin' 'internal' 'jenkins' '127.0.0.1'; do
  echo "=== $vh ==="
  curl -s -H "Host: $vh" https://target.com/ | head -c 200
done
```

---

## Impacto

- **Account takeover via password reset poisoning** — atacante recibe reset token via spoofed Host email.
- **Mass cache poisoning** — `<base href>` poisoned por TTL completo del cache.
- **SSRF a internal admin panels** — virtual host routing reveal hidden apps.
- **Authentication bypass** — apps que confían en internal Host = no auth.
- **IP allowlist bypass** — `X-Forwarded-For: 127.0.0.1` skip checks.
- **Email link hijack** — welcome / invite / share tokens leaked.
- **Phishing via lookalike subdomain takeover** — legit-looking attacker domain.
- **OAuth code theft** — redirect_uri builder uses Host.
- **CSRF bypass via routing** — internal vhost CSRF accepted.
- **Compound impact via chains** — HHI + cache + HRS = high CVSS.

---

## Mitigación (defender)

- **Hardcoded site URL** — never construct URLs from `Host` header:
  ```python
  SITE_URL = config.SITE_URL  # 'https://target.com'
  reset_url = f"{SITE_URL}/reset?token={token}"
  ```
- **Whitelist Host validation** — backend rejects Hosts not in allowlist:
  ```python
  ALLOWED_HOSTS = {'target.com', 'www.target.com'}
  if request.host not in ALLOWED_HOSTS:
      return 400
  ```
- **Validate `X-Forwarded-Host`** solo si origen del proxy es trusted (specific IP).
- **Rejectar duplicate Host headers** — RFC 7230 mandata.
- **Strict regex on virtual host** — server_name nginx con regex anchored:
  ```nginx
  server_name ^target\.com$;
  ```
- **Disable absoluteURI in request line** — backend solo accepts origin-form (`/path`).
- **Strip `X-Original-URL` y `X-Rewrite-URL`** at frontend WAF.
- **Sign URL tokens** — even if URL injected, signed token validates target.
- **Cache key includes Host** — Cache normalizes Host or includes en key.
- **WAF rules anti-HHI** — ModSecurity OWASP CRS.
- **Audit con Burp Param Miner** en CI/CD.
- **HSTS + scheme verification** — force HTTPS, prevent downgrade.
- **Monitor email link domains** — alert si reset email contains non-canonical domain.

---

## Para entender Host Header Injection

**Por qué Host header existe:**

HTTP/1.1 introdujo virtual hosts: múltiples websites en una IP, distinguished by `Host` header. Server reads Host, routes a la app apropiada. Diseñado para multiplexing — vital en shared hosting + cloud era.

Trust del Host header surge de "well, the user told us which Host they want, so we use it for URL building". Anti-pattern: user input controla output → atacante manipula.

**Por qué `X-Forwarded-Host` (XFH) duplicates the issue:**

Reverse proxy chain. Frontend (CDN) recibe Host, forwarda al backend. Backend should trust frontend's Host... but how? Convention: front strips Host, sets `X-Forwarded-Host` con value validated. Backend trusts XFH.

Bug: si front no setea XFH (atacante envía direct con HTTP/1.1 to backend), o si front pasea atacante's XFH sin validar, backend trusts spoofed value.

**Por qué password reset es vector típico:**

Reset emails are stateless: backend solo construye link y envía. URL must include domain — for "convenience", devs use `request.host`. Atacante envía request con malicious Host → backend builds reset link → email sent to victim with malicious URL → victim clicks → attacker gets token → resets password → ATO.

Defense: hardcode site URL en config. Never use Host header for security-relevant URL building.

**Why this is hard to detect en black-box testing:**

Reset emails are out-of-band (atacante must intercept o ver email). Solutions:
- Use atacante's own email account.
- Burp Collaborator OOB confirms backend fetched attacker URL.
- Check email link domain post-poisoning.

---

## Recursos

- [PortSwigger - Host Header Attacks](https://portswigger.net/web-security/host-header) — labs.
- [PortSwigger Research - Practical HTTP Host Header Attacks (2013)](https://www.skeletonscribe.net/2013/05/practical-http-host-header-attacks.html) — paper original (James Kettle).
- [PayloadsAllTheThings - Web Cache Deception](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Web%20Cache%20Deception) — adjacent.
- [HackTricks - Hop-by-hop Headers / Host Header](https://book.hacktricks.xyz/pentesting-web/abusing-hop-by-hop-headers) — referencia.
- [OWASP - Testing for Host Header](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/) — methodology.
- [Param Miner](https://github.com/PortSwigger/param-miner) — Burp ext.
- [RFC 7230 - HTTP/1.1 Message Syntax](https://datatracker.ietf.org/doc/html/rfc7230) — Host header spec.
- [RFC 7239 - Forwarded HTTP Header](https://datatracker.ietf.org/doc/html/rfc7239) — Forwarded standard.
- [Nginx security advisory - Host header](https://nginx.org/en/security_advisories.html) — server-specific.
- [Cache poisoning + HHI labs (PortSwigger)](https://portswigger.net/web-security/web-cache-poisoning) — practical chains.

---
