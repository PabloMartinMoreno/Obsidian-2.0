---
aliases:
  - CSRF Detection
  - CSRF Recon
tags:
  - vuln/csrf
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Cross-Site Request Forgery (CSRF)]]"
---
# CSRF - Detección y Reconocimiento

---

## Identificar Endpoints State-Changing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Endpoints POST/PUT/DELETE en historial Burp | Filtrar `Method:POST,PUT,DELETE` en historial | First step. |
| `grep -E '<form.*method="post"' burp-history.html` | Forms en HTML | HTML del frontend. |
| AJAX state-changing | XHR/fetch en JS files | Buscar `fetch(...{method:'POST'})`. |
| `/api/v1/users`, `/api/v2/admin` con verbos no-GET | Endpoints REST API | API explorer. |
| Acciones idempotentes "GET" | Anti-pattern: `GET /api/delete?id=42` | Usar GET para state-changing = CSRF trivial. |
| `/login`, `/logout`, `/password-reset` | Endpoints de auth | Login CSRF + logout CSRF. |
| `/profile`, `/email/change`, `/2fa/disable` | Endpoints de cuenta | Account takeover via CSRF. |
| `/admin/users`, `/admin/role` | Endpoints admin | Privesc si admin víctima. |
| `/transfer`, `/checkout`, `/buy` | Endpoints transferencias | Financial impact. |
| Webhooks settings | Cambiar URL de webhooks → captura datos | Persistencia. |
| Verbo "magic" | POST con `_method=PUT` o `_method=DELETE` | Method override. |
| `POST /graphql` con `mutation { ... }` | GraphQL mutations | Igual que REST POST. |
^csrf-detect-endpoints

---

## Análisis de Tokens Existentes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `grep -oE 'name="(csrf[_-]?token\|_token\|authenticity_token)"\s+value="[^"]+"'` | Buscar token en form | Patrones comunes. |
| `X-CSRF-Token`, `X-XSRF-TOKEN`, `Anti-CSRF-Token` | Buscar token en headers | Headers custom. |
| Buscar en cookies | Cookie con prefix `XSRF-` o `csrf` | Double-submit pattern. |
| Token presente en GET? | URL params con token | Leak via Referer. |
| `#token=...` | Token presente en URL fragment? | Solo cliente — útil bypass. |
| Length del token | Tokens cortos (<16 chars) → posible bruteforce / predicción | Entropy check. |
| Token entropy | Comparar 10 tokens — patrón? Counter? Timestamp? | Predictabilidad. |
| Token unique per session | Logout + login → token cambia? | Rotación. |
| Token unique per request | Cada form submit nueva token? | Sync token pattern strict. |
| Token tied to user | Cambiar cookie session → token aún válido? | Tied-to-session check. |
| Reuse de token old | Submit con token de 10 min atrás | Expiración. |
| Token signed | Formato JWT-like? Hash visible? | Crypto layer. |
^csrf-detect-tokens

### Patrón identificación rápida

```bash
# 1. Login + capturar todos forms
curl -c jar.txt -b jar.txt https://target/login -d "user=x&pass=y"

# 2. Inspect formularios state-changing
curl -b jar.txt https://target/profile/edit | grep -oE '<input[^>]*name="[^"]*"[^>]*value="[^"]*"'

# 3. Detectar headers CSRF
curl -v -b jar.txt -X POST https://target/api/profile -d "name=test" 2>&1 | grep -i csrf

# 4. Comparar tokens entre 2 requests
for i in 1 2 3; do
  curl -s -b jar.txt https://target/profile | grep -oE 'csrf_token.*value="[^"]*"'
done
```

---

## Verificar SameSite / Referer Protections

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -I -b jar.txt https://target/` | Inspect cookies SameSite | Buscar `SameSite=Lax/Strict/None`. |
| `SameSite=None` sin `Secure` | Inválido — browser ignora | Deja cookie vulnerable. |
| `SameSite` ausente | Default Lax (Chrome 80+) o None (browsers viejos) | Comportamiento varía. |
| `SameSite=Lax` permite GET top-level | Top-level navigation en GET con cookie | GET CSRF aún funcional. |
| `SameSite=Strict` | Bloquea cross-site totalmente | Más segura, romper con click directo. |
| Referer header check | Mandar request sin Referer → still works? | Si pasa = no Referer check. |
| `Referer:` vacío vs ausente | Referer empty allowed | Algunos backends solo validan presencia. |
| `Origin: https://attacker.com` → rejecta? | Origin header check | Modern protección. |
| `Origin: null` (sandboxed iframe) | Origin null allowed | Bypass de Origin check. |
| Custom anti-CSRF header (Synchronizer) | Header `X-Requested-With: XMLHttpRequest` requerido | XHR-only, easy bypass via fetch. |
| Double-submit cookie | Token en cookie + body comparado | Subdomain takeover bypass. |
| Encrypted token | Token cifrado server-side | Más fuerte pero edge cases. |
| HMAC sobre body | Body firmado con secret | Strong — pero secret leak rompe. |
^csrf-detect-protections

### Matriz de protecciones efectivas

| Protección | Bloquea POST cross-site | Bloquea GET cross-site | Bypass común |
|---|---|---|---|
| `SameSite=Strict` | ✓ | ✓ | Click directo del user |
| `SameSite=Lax` | ✓ | ✗ (top-level) | GET-based attack |
| `SameSite=None; Secure` | ✗ | ✗ | None — Sin protección de cookie |
| Sync token (form) | ✓ si validado | ✓ | Token leak / no validation |
| Double-submit cookie | ✓ | ✓ | Subdomain takeover |
| Origin/Referer check | ✓ | ✓ | Header strip / null Origin |
| Custom header (`X-Requested-With`) | ✓ (con CORS strict) | ✓ | CORS misconfig |
| HMAC firmado body | ✓ | ✓ | Secret leak |

---
