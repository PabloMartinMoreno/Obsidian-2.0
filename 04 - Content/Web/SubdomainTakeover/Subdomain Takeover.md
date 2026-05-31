---
aliases:
  - Subdomain Takeover
  - SDT
  - Dangling DNS
  - DNS Takeover
tags:
  - vuln/subdomain-takeover
  - technique/initial-access
  - technique/credential-access
  - technique/persistence
  - asset/web-app
  - asset/dns
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[Subdomain Takeover - Tipos por Servicio]]"
  - "[[Subdomain Takeover - NS Takeover y DNS-Level]]"
  - "[[Subdomain Takeover - Vectores de Explotacion]]"
  - "[[Subdomain Takeover - Chains con Otras Vulns]]"
  - "[[Subdomain Takeover - Tooling y Wordlists]]"
  - "[[Host Header Injection]]"
  - "[[Open Redirect]]"
  - "[[Web Cache Poisoning]]"
  - "[[Burp Suite]]"
---
# Subdomain Takeover

***

## Cheatsheet

### 🏗️ Tipos por Servicio

````tabs
tab: **Cloud Storage (S3 / Azure / GCS)**
![[Subdomain Takeover - Tipos por Servicio#^sdt-types-storage]]

tab: **PaaS (Heroku / Netlify / Vercel)**
![[Subdomain Takeover - Tipos por Servicio#^sdt-types-paas]]

tab: **SaaS (GitHub Pages / Tumblr / Shopify)**
![[Subdomain Takeover - Tipos por Servicio#^sdt-types-saas]]

tab: **CDN Dangling (CloudFront / Cloudflare)**
![[Subdomain Takeover - Tipos por Servicio#^sdt-types-cdn]]

tab: **Email / Domain Providers**
![[Subdomain Takeover - Tipos por Servicio#^sdt-types-email]]
````

### 🌐 NS Takeover y DNS-Level

````tabs
tab: **Nameserver Takeover (NS Records)**
![[Subdomain Takeover - NS Takeover y DNS-Level#^sdt-ns-takeover]]

tab: **Expired Domain Reclaim**
![[Subdomain Takeover - NS Takeover y DNS-Level#^sdt-ns-expired]]

tab: **SOA / NS Misconfig**
![[Subdomain Takeover - NS Takeover y DNS-Level#^sdt-ns-misconfig]]

tab: **DNS Provider Account Orphan**
![[Subdomain Takeover - NS Takeover y DNS-Level#^sdt-ns-account-orphan]]
````

### 💉 Vectores de Explotación / Impact

````tabs
tab: **Phishing con Subdomain Legítimo**
![[Subdomain Takeover - Vectores de Explotacion#^sdt-vector-phishing]]

tab: **Cookie Scope Abuse (Domain=.target.com)**
![[Subdomain Takeover - Vectores de Explotacion#^sdt-vector-cookie]]

tab: **OAuth `redirect_uri` Trust Transfer**
![[Subdomain Takeover - Vectores de Explotacion#^sdt-vector-oauth]]

tab: **CSP Subdomain Bypass**
![[Subdomain Takeover - Vectores de Explotacion#^sdt-vector-csp]]

tab: **SAML SP / IdP Trust**
![[Subdomain Takeover - Vectores de Explotacion#^sdt-vector-saml]]

tab: **CORS Allowlist Abuse**
![[Subdomain Takeover - Vectores de Explotacion#^sdt-vector-cors]]
````

### 🔗 Chains con Otras Vulns

````tabs
tab: **ATO via Cookie / OAuth Chain**
![[Subdomain Takeover - Chains con Otras Vulns#^sdt-chain-ato]]

tab: **XSS Persistente via Subdomain**
![[Subdomain Takeover - Chains con Otras Vulns#^sdt-chain-xss]]

tab: **HTTPS Cert Validation Bypass**
![[Subdomain Takeover - Chains con Otras Vulns#^sdt-chain-https]]

tab: **Email Spoofing (SPF / DKIM)**
![[Subdomain Takeover - Chains con Otras Vulns#^sdt-chain-email]]

tab: **Combine con HHI / OR / Cache Poisoning**
![[Subdomain Takeover - Chains con Otras Vulns#^sdt-chain-combos]]
````

### 🛠️ Tooling y Wordlists

````tabs
tab: **subjack / subzy / takeover (Detection)**
![[Subdomain Takeover - Tooling y Wordlists#^sdt-tool-detection]]

tab: **Subdomain Enumeration Tools**
![[Subdomain Takeover - Tooling y Wordlists#^sdt-tool-enum]]

tab: **DNS Probing y Resolution**
![[Subdomain Takeover - Tooling y Wordlists#^sdt-tool-dns]]

tab: **can-i-take-over-xyz (Reference)**
![[Subdomain Takeover - Tooling y Wordlists#^sdt-tool-canitakeover]]

tab: **Manual Verification**
![[Subdomain Takeover - Tooling y Wordlists#^sdt-tool-manual]]

tab: **Wordlists Comprehensivas**
![[Subdomain Takeover - Tooling y Wordlists#^sdt-tool-wordlists]]
````

___

## Overview

**Subdomain Takeover** = atacante toma control de subdomain de target via dangling DNS pointer. Causa raíz: DNS record (típicamente CNAME) apunta a recurso third-party (S3 bucket, Heroku app, GitHub Pages, etc.) que ya no existe. Atacante reclaim ese recurso → controla subdomain como si fuera propio.

Vector clase A en bug bounty — high-paid (HackerOne / Bugcrowd $500-$10000+). Combinable con virtually cualquier vector web amplificando impacto: ATO via cookies/OAuth, XSS persistente, email spoofing, phishing, cache poisoning.

### Por qué surge la vulnerabilidad

1. **Cloud / SaaS proliferation** — orgs use 100+ external services per app.
2. **Service deprovisioning gaps** — service deleted, DNS not updated.
3. **DevOps automation gaps** — CI/CD creates DNS records but tear-down often manual.
4. **Marketing campaigns** — temporary subdomains created/forgotten.
5. **Mergers / acquisitions** — DNS not transferred, services abandoned.
6. **Long-running orgs** — accumulated cruft over years.

### Diferencia con vulns relacionadas

| | **Subdomain Takeover** | **HHI** | **Open Redirect** |
|---|---|---|---|
| Vector | DNS dangling | Host header trust | URL parameter |
| Atacante owns | Subdomain (full) | Spoofed Host (transient) | Atacante's domain (URL only) |
| Persistence | Permanent (until DNS fixed) | Per-request | Per-link |
| Impact | Full subdomain control | Reset poisoning, cache | Phishing redirect |
| Defense | Monitor DNS + cleanup | Hardcode URLs | Whitelist redirects |

___

## Workflow de explotación

```
1. Reconocimiento subdomain:
   - subfinder + amass + crt.sh
   - Sort, dedupe → subs.txt

2. Resolve DNS records:
   - dnsx -l subs.txt -resp -cname
   - Filter CNAMEs apuntando a third-parties

3. Identify candidates:
   - subjack/subzy/takeover scan
   - nuclei takeover templates
   - Filter dangling indicators

4. Manual verification:
   - HTTP fingerprint (404 + service signature)
   - DNS verify CNAME target unresolved
   - Cross-reference can-i-take-over-xyz

5. Claim service:
   - Per-service: create account, configure custom domain
   - S3: create bucket
   - Heroku: heroku create + domains:add
   - GitHub Pages: create repo + CNAME file
   - etc.

6. Verify control:
   - Atacante content visible at subdomain
   - HTTPS cert valid (Let's Encrypt)

7. Decidir explotación / report:
   a. Stand-alone takeover → bug bounty report.
   b. Cookie scope abuse → ATO chain.
   c. OAuth code theft → ATO chain.
   d. CSP bypass → XSS chain.
   e. Email spoofing → phishing chain.
   f. Combine con HHI / cache → high CVSS compound.

8. Bug bounty PoC:
   - Document steps
   - Screenshot atacante's content visible at subdomain
   - Don't deface (ethics)
   - Coordinate disclosure
```

___

## Detección rápida

### Indicadores

- Subdomain con CNAME a known third-party service (S3, Heroku, GitHub, etc.)
- HTTP response includes service-specific dangling signature.
- DNS resolution: CNAME target NXDOMAIN o NoSuchBucket-style error.
- Subdomain abandoned but DNS still active.

### Probes mínimos

```bash
# 1. Subdomain enumeration
subfinder -d target.com -all -silent > subs.txt
amass enum -passive -d target.com -silent >> subs.txt

# 2. Identify CNAMEs
dnsx -l subs.txt -cname -resp -silent > cnames.txt

# 3. Auto-scan with subjack
subjack -w subs.txt -t 100 -timeout 30 -ssl -c fingerprints.json

# 4. Manual confirm
SUB="vulnerable.target.com"
curl -sI "https://$SUB"
curl -s "https://$SUB" | head -c 500
dig +short CNAME "$SUB"

# 5. nuclei takeover templates
nuclei -t takeovers/ -l subs.txt
```

___

## Impacto

- **Phishing legítimo** — atacante hostea contenido en `<dangling>.target.com` con HTTPS válido.
- **Account takeover** — cookie/OAuth/SAML trust transfer.
- **XSS persistente cross-subdomain** — CSP / cookie scope abuse.
- **Email spoofing** — MX / SPF / DKIM dangling permite enviar emails legítimos.
- **OAuth code/token theft** — redirect_uri whitelist + takeover.
- **CORS abuse** — origin trust + takeover origin.
- **Brand reputation damage** — defacement visible.
- **Compliance failure** — orgs ofen catch en pentests/audits.
- **Persistencia de larga duración** — until DNS fixed.
- **Combinable con HHI / Cache / OR** — compound chains High CVSS.

___

## Mitigación (defender)

- **DNS hygiene** — periodic audits de DNS records.
- **Provisioning + de-provisioning automation** — IaC ensures DNS deleted con resource.
- **Monitor third-party services** — alert when external service no longer responds.
- **Continuous CNAME monitoring** — automated tools detect dangling.
- **Strong process for sub creation/deletion** — change management.
- **Provider-side validation** — some services (CloudFront) validate domain ownership.
- **DNSSEC** — doesn't prevent takeover but adds integrity.
- **Use `__Host-` cookie prefix** — prevents domain attribute set wide.
- **Strict OAuth `redirect_uri`** — exact match, not wildcard.
- **CSP without subdomain wildcard** — `script-src 'self'` not `*.target.com`.
- **Bug bounty program** — incentive for community to report.
- **Continuous monitoring tools**:
  - DNStwist
  - subjack/subzy in pipeline
  - SecurityTrails alerts
  - Project Discovery cloud monitor
- **Inventory de third-party services** — central registry.
- **Subdomain expiration monitoring** — track lifecycle.
- **Common service deletion procedures** — checklist.

___

## Para entender Subdomain Takeover

**Por qué CNAME es vector primario:**

DNS CNAME (Canonical Name) es alias: `sub.target.com → external.cloudprovider.com`. Cuando user visits `sub.target.com`, DNS resolver follows CNAME → fetches IP de external.cloudprovider.com.

Si `external.cloudprovider.com` (resource) deja de existir pero CNAME persists, dangling state. Atacante registra mismo nombre en mismo provider → DNS resolver follows CNAME → fetches atacante's resource → atacante "es" `sub.target.com` desde perspectiva del browser.

Important: atacante NO modifica DNS de target. Solo claims el resource al que CNAME apunta.

**Por qué orgs lo dejan caer:**

Imagine timeline:
- Year 1: Marketing creates `promo2020.target.com` → uses Heroku app.
- Year 2: Promo over, marketing deletes Heroku app.
- Year 2-3: DNS team never notified. CNAME persists.
- Year 4: Atacante recon. Finds dangling CNAME. Creates Heroku app con same name. Takeover.

Surface grows over years. Larger orgs accumulate hundreds of dangling pointers.

**Por qué bug bounty paga tanto:**

Subdomain takeover típicamente = "I now legitimately control sub.target.com". Para attacker:
- Phish con HTTPS-valid trusted domain.
- Steal cookies / OAuth tokens via cross-subdomain trust.
- Persistent XSS source.
- Email spoofing.
- CSP bypass.

CVSS often 7-9 (High). Bug bounty pays $500-$10000+.

**Diferencia entre takeover y XSS / OR / HHI:**

XSS / OR / HHI son transient — atacante exploits per-request. Takeover es persistent — atacante owns subdomain hasta defender lo arregla. Persistence + trust = unique impact.

___

## Recursos

- [can-i-take-over-xyz](https://github.com/EdOverflow/can-i-take-over-xyz) — comprehensive list of takeover services.
- [HackerOne - Subdomain Takeover](https://www.hackerone.com/blog/Guide-Subdomain-Takeovers) — guide.
- [Detectify Labs - Subdomain Takeover Series](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) — original research (Frans Rosén).
- [PortSwigger - DNS Hijacking / Subdomain Takeover](https://portswigger.net/web-security) — labs.
- [PayloadsAllTheThings - Subdomain Takeover](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Subdomain%20Takeover) — payloads.
- [HackTricks - Subdomain Takeover](https://book.hacktricks.xyz/pentesting-web/domain-subdomain-takeover) — referencia.
- [subjack](https://github.com/haccer/subjack) — Go tool.
- [subzy](https://github.com/LukaSikic/subzy) — Modern alt.
- [Project Discovery nuclei templates](https://github.com/projectdiscovery/nuclei-templates/tree/master/http/takeovers) — auto-scan.
- [Frans Rosén - Hostile Subdomain Takeover Talk](https://www.youtube.com/watch?v=R5G0DQfGEjs) — original disclosure.
- [Patrik Hudak - Subdomain Takeover Series](https://0xpatrik.com/) — modern research.
- [DNS Hijacking case studies](https://blog.detectify.com/) — real-world examples.

***
