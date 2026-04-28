---
aliases:
  - Clickjacking Chains
  - UI Redress Chains
tags:
  - vuln/clickjacking
  - technique/chaining
  - technique/exploitation
primary: "[[Clickjacking]]"
---

# Clickjacking - Chains con Otras Vulns

Combinaciones donde Clickjacking eleva el impacto de otra vuln o sirve como vector de delivery. El click forzado del user activa la cadena.

## Clickjacking + XSS (Self-XSS → Stored)

Self-XSS aislado no escala (necesita que la víctima ejecute payload en su propia consola). Con clickjacking se convierte en stored al forzar el submit del input vulnerable.

| Combo | Mecanismo | Resultado |
|-------|-----------|-----------|
| Self-XSS form + iframe oculto | Pre-rellenar `value` del input via URL params + clickjack del submit | Stored XSS en perfil víctima |
| Reflected XSS en POST + CSRF token | Iframe con form auto-submit + click forzado del confirm | XSS ejecuta en contexto víctima |
| DOM XSS via `postMessage` | Iframe controlado envía postMessage tras click | RCE client-side |
| XSS en admin panel | Clickjack admin para hacer click en link malicioso | Admin ejecuta payload |

```html
<iframe src="https://victim.com/profile?bio=<svg/onload=alert(1)>" style="opacity:0.01"></iframe>
<button style="position:absolute;top:Xpx;left:Ypx;">Click para premio</button>
```

^cj-chain-xss

## Clickjacking + CSRF (Bypass SameSite Lax)

CSRF clásico bloqueado por `SameSite=Lax` (solo top-level navigation). Clickjacking dispara el form desde dentro del iframe → cookies se envían si el endpoint usa GET o si el browser permite el envío.

| Escenario | Bypass | Notas |
|-----------|--------|-------|
| `SameSite=Lax` + GET endpoint | Top-level nav via clickjack window.open | Cookies viajan en nav top-level |
| `SameSite=None` legacy | Iframe + POST normal | Funciona sin trucos |
| Doble Submit Cookie sin token check | Form auto-submit + click | Token leakeable via referer |
| OAuth implicit flow | Clickjack del "Authorize" → token en fragment | Token robado via window.opener |
| Password change sin re-auth | Clickjack del submit | Account takeover directo |

```html
<form action="https://victim.com/email/change" method="POST" target="_top">
  <input name="email" value="atk@evil.com">
</form>
<iframe name="_top"></iframe>
<!-- click forzado dispara form en top context -->
```

^cj-chain-csrf

## OAuth Consent Hijacking

OAuth authorization endpoints suelen permitir framing (no setean XFO/CSP). Clickjack del botón "Authorize" → atacante recibe el code/token de la víctima sin que se entere.

| Target | Prerequisito | Robo |
|--------|--------------|------|
| `/oauth/authorize?client_id=ATTACKER&...` | Endpoint frameable | code via redirect_uri controlado |
| Implicit flow `response_type=token` | App config permite | access_token directo en fragment |
| Scope escalation | App permite re-consent | Scopes adicionales sin alerta visual |
| Pre-consented apps | Click solo abre redirect | Token instantáneo sin botón |
| Logout + re-auth chain | Clickjack del re-login | Cookies post-logout sirven |

Burp: revisar `X-Frame-Options` en `/authorize`. Google/Microsoft/GitHub mitigaron — apps custom suelen estar expuestas.

^cj-chain-oauth

## WebRTC + getUserMedia Hijack

Clickjack del prompt "Allow camera/mic" — no en el prompt nativo del browser (no frameable) sino en custom permission UIs (Jitsi, Zoom web, BBB).

| Target | Vector | Resultado |
|--------|--------|-----------|
| App con custom "Enable Camera" button | Clickjack botón pre-prompt | Browser muestra prompt nativo, user confirma asumiendo otro contexto |
| Re-permission tras revoke | Click forzado | Re-grant sin user awareness |
| Screen capture API `getDisplayMedia` | Clickjack de "Share screen" | Captura pantalla completa |
| Auto-join Jitsi/meeting room | Clickjack del "Join with video" | Cam activa en sala atacante |
| Bluetooth/USB Web APIs | Clickjack permission | Pairing forzado |

Note: Chrome/Firefox bloquean prompt nativo en iframes cross-origin desde 2022 — viable solo en custom UIs intermedias.

^cj-chain-webrtc

## Subdomain Takeover Trust Transfer

Subdomain takeable (`abandoned.victim.com` → CNAME apunta a Heroku/S3 disponible). Atacante reclama el subdomain → ahora tiene `same-site` con `victim.com` → puede hacer iframe + clickjack saltando `frame-ancestors 'self'`.

| Step | Acción | Impacto |
|------|--------|---------|
| 1. Recon CNAMEs | `dnsrecon`, `subjack`, `nuclei takeover-templates` | Listar dangling DNS |
| 2. Claim subdomain | Crear app en provider | Control de `attacker.victim.com` |
| 3. Bypass SameSite cookies | Mismo eTLD+1 | Cookies fluyen en iframe |
| 4. Bypass CSP `frame-ancestors 'self'` | Same-origin desde subdomain | Framing permitido |
| 5. Clickjack target sensible | Account/password change | ATO completo |

CSP `frame-ancestors *.victim.com` (común) es trivial de explotar tras takeover.

^cj-chain-subtakeover
