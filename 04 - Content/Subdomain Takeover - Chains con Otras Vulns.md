---
aliases:
  - SDT Chains
  - Email Spoofing
  - HHI + Subdomain Takeover
  - Cookie Takeover Chain
tags:
  - type/cheatsheet
  - vuln/subdomain-takeover
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Subdomain Takeover]]'
  - '[[Host Header Injection]]'
  - '[[Open Redirect]]'
  - '[[Web Cache Poisoning]]'
  - '[[Cross-Site Scripting (XSS)]]'
---
# Subdomain Takeover - Chains con Otras Vulns

***

## ATO via Cookie / OAuth Chain

| **Workflow** | **Step** | **Notas** |
|:---:|:---:|:---:|
| Stage 1 | Subdomain takeover en `auth.target.com` | Authoritative-looking. |
| Stage 2 | Atacante hostea fake login UI | HTTPS valid. |
| Stage 3 | Phishing campaign con email | Trusted domain. |
| Stage 4 | Victim enters creds en fake page | Theft. |
| Stage 5 | ATO complete | Standard. |
| Variant: cookie steal | Takeover sub + JS reads parent cookies | If not HttpOnly. |
| Variant: OAuth code | OAuth IdP redirects code a takeover sub | Federated. |
| Variant: SSO callback | SAML AssertionConsumerService URL | SAML chain. |
| Variant: API key inject | Add atacante's API key via session | Persistencia. |
| Variant: 2FA reset | Force user to re-enroll 2FA | MFA bypass. |
| Variant: password reset | Reset link arrives a takeover sub email | If MX combo. |
| Combine con HHI | Force reset emails to attacker subdomain | Compound. |
| Combine con XSS | XSS en parent + cookie steal via takeover sub | Multi-stack. |
^sdt-chain-ato

___

## XSS Persistente via Subdomain

| **Workflow** | **Step** | **Notas** |
|:---:|:---:|:---:|
| Stage 1 | Subdomain takeover | Permanent control. |
| Stage 2 | Atacante hostea persistent XSS payload | Standard XSS. |
| Stage 3 | Cross-subdomain trust → main app accepts JS | If CSP trust. |
| Stage 4 | XSS persistente + privileged context | Compound. |
| CSP `*.target.com` allow | Direct script-src bypass | Standard. |
| `connect-src *.target.com` | Fetch from takeover sub | Data exfil. |
| `frame-src *.target.com` | Iframe takeover sub en main page | UI injection. |
| Cookie-based context | Same-origin policy permits some access | Edge. |
| `localStorage` access | Same-origin persists data | If subdomain matches. |
| `postMessage` listening | Atacante listens postMessages | Edge. |
| Service Worker scope | If SW registered con sub.target.com | Persistence at SW level. |
| Web Push abuse | Subscribe + push notifications | Edge mobile. |
| Combine con cache poisoning | Stored XSS + cache → mass impact | Standard chain. |
^sdt-chain-xss

___

## HTTPS Cert Validation Bypass

| **Workflow** | **Step** | **Notas** |
|:---:|:---:|:---:|
| Concept | Atacante owns subdomain → can issue valid HTTPS cert via Let's Encrypt | Trust chain. |
| Let's Encrypt DNS-01 | Use DNS challenge para issue cert | Standard. |
| Let's Encrypt HTTP-01 | If atacante controls HTTP server on sub | Trivial. |
| ACME challenge | Auto-solve | acme.sh / certbot. |
| Multi-domain cert | Cert con multiple SANs | Edge. |
| EV cert (rare) | Some sites require EV — usually no for subdomain | Edge. |
| Wildcard cert (rare) | Subdomain takeover ≠ full wildcard typically | Edge. |
| HSTS pinning | If main app pins specific cert → may not bypass | Defense. |
| HPKP (deprecated) | Public Key Pinning — limited adoption | Modern HSTS. |
| Combine con MITM | Takeover + MITM → full SSL bypass | Multi-vector. |
| Phishing trust badge | Padlock + valid cert → maximum trust | UX. |
| Mixed content abuse | Atacante con HTTPS sub serves "mixed" | Browser accepts. |
^sdt-chain-https

___

## Email Spoofing (SPF / DKIM)

| **Workflow** | **Step** | **Notas** |
|:---:|:---:|:---:|
| Concept | Subdomain con MX or SPF includes pointing a takeover | Email spoof. |
| MX takeover | Subdomain MX pointers a third-party | Receive emails. |
| SPF includes dead third-party | `v=spf1 include:dead-provider.com -all` → atacante registers provider | Send valid emails. |
| DKIM TXT dangling | DKIM signing key dangling | Sign atacante's emails. |
| DMARC alignment relaxed | `aspf=r` + subdomain takeover → spoof main | Standard. |
| MX-based password reset | Receive password reset emails con takeover MX | ATO. |
| Internal email comms | Receive internal communications | Lateral. |
| Phishing senders | Send legitimate-from `@target.com` emails | Bypass scanners. |
| OAuth provider email | OAuth flow emails (verify, etc) | Account verification. |
| Multi-factor email | If 2FA via email | Bypass MFA. |
| Newsletter takeover | Marketing email subdomain takeover | Bulk send. |
| Combine con HHI password reset | Reset link arrives + email goes to atacante | Compound. |
| Subdomain dedicated to email | `mail.target.com`, `smtp.target.com` | Specific. |
| Email header rewrite | Headers may include subdomain references | Edge. |
^sdt-chain-email

___

## Combine con HHI / Open Redirect / Cache Poisoning

| **Combo** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| HHI + Subdomain Takeover | Reset poisoning con `Host: takeover.target.com` → email link a takeover sub → atacante captures token | Standard chain. |
| Open Redirect + SDT | OAuth redirect_uri whitelist permite subdomain → takeover sub catches code | Federated. |
| Cache Poison + SDT | Cache stores response con takeover URL | Mass impact. |
| HRS + SDT | Smuggle request a internal vhost via takeover | Compound. |
| CORS misconfig + SDT | CORS trusts subdomain → takeover origin makes auth'd requests | API access. |
| CSP trust + SDT | CSP whitelist + takeover JS source | XSS upgrade. |
| OAuth scope + SDT | OAuth IdP grants scope to subdomain | Permission inherit. |
| SAML federation + SDT | SP/IdP trust + takeover | Federated. |
| Email spoof + reset poisoning | Both vectors → ATO | Compound. |
| Combine con Web Cache Deception | Path confusion + takeover host | Standard. |
| Multi-step scope expansion | Each chain expands surface | Bug bounty high payout. |
| Defender perspective | Multi-tier defense necessary | Per-organization. |
^sdt-chain-combos

### Compound chain example: HHI + SDT for ATO

```
1. Atacante recon:
   - Find dangling subdomain: docs.target.com → CNAME a deleted Heroku app
   - Find HHI vector: /forgot endpoint trusts X-Forwarded-Host

2. Atacante claims subdomain:
   - Create Heroku app con same name
   - Domain: docs.target.com
   - Deploy malicious endpoint

3. Atacante poisons reset:
   POST /forgot HTTP/1.1
   Host: target.com
   X-Forwarded-Host: docs.target.com
   email=victim@target.com

4. Email arrives at victim:
   "Reset password: https://docs.target.com/reset?token=..."
   - Domain looks legit (target.com subdomain)
   - HTTPS cert valid (Heroku auto-cert)
   - Email scanners see legit domain → no flag

5. Victim clicks link → atacante captures token

6. Atacante redirects victim to legit reset:
   Location: https://target.com/reset?token=...

7. Atacante uses token via legit endpoint → password reset → ATO

8. CVSS: Critical (9.8) — combined HHI + Subdomain Takeover.
```

***
