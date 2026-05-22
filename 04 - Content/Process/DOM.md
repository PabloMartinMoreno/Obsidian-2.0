---
aliases:
  - Document Object Model
tags:
  - estado/completo
  - asset/web-app
kind: Concept
linked:
  - "[[XSS - Manipulación de Sources y Sinks (DOM-based)]]"
  - "[[Cross-Site Scripting (XSS)]]"
---
# DOM

> [!info]
> **Document Object Model** — representación en árbol de un documento HTML/XML. APIs JS para leer/modificar nodos. En seguridad web: fuente de DOM-based XSS, sinks peligrosos, Prototype Pollution, mXSS.

***

## Sources peligrosos (input)

| Source | Notas |
|---|---|
| `location.hash` | Fragment URL — no se envía al server, sanitización solo en cliente |
| `location.search` | Query string |
| `location.pathname` | Path |
| `document.referrer` | Header Referer del request |
| `document.cookie` | Cookies legibles JS |
| `window.name` | Persiste cross-domain (vector legacy) |
| `postMessage` event.data | Cross-origin messaging |
| `localStorage` / `sessionStorage` | Persistencia client-side |
| `WebSocket` data | Cliente |

***

## Sinks peligrosos

Sinks documentados en [[XSS - Manipulación de Sources y Sinks (DOM-based)]]: HTML write APIs, string-based timers, `location` reassign, jQuery wrappers, contextual HTML parsing.

***

## Detección

- Burp DOM Invader extension.
- Browser DevTools → Sources → buscar sinks.
- Static analysis: grep en JS bundles.

***

## Notas Relacionadas

- [[XSS - Manipulación de Sources y Sinks (DOM-based)]]
- [[XSS - Explotación de Mutaciones del Navegador (mXSS)]]
- [[Prototype Pollution]]
