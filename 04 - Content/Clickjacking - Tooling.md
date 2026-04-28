---
aliases:
  - Clickjacking Tooling
  - UI Redress Tooling
tags:
  - vuln/clickjacking
  - technique/tooling
primary: "[[Clickjacking]]"
---

# Clickjacking - Tooling

Herramientas y workflows para detectar, generar PoCs y explotar clickjacking.

## Burp Suite — Clickbandit + Manual

Burp incluye **Clickbandit** (extensión nativa, BApp Store) que graba clicks reales sobre el target y genera HTML PoC automáticamente con iframe + overlay.

| Workflow | Comando/Acción | Output |
|----------|---------------|--------|
| Activar Clickbandit | Burp Pro → Extensions → Clickbandit | JS overlay en navegador |
| Grabar sesión | Click "Start" → interactuar con target → "Finish" | HTML PoC generado |
| Header check Proxy | Filter → `X-Frame-Options absent`, `Content-Security-Policy frame-ancestors absent` | Lista targets frameables |
| Repeater test | Add header `Origin: https://attacker.com` + observar response | Confirma policies |
| Match & Replace | Borrar `X-Frame-Options` en response | Test bypass local |

Burp Community: no tiene Clickbandit, hacerlo manual con Repeater + HTML PoC.

^cj-tool-burp

## Generadores de PoC

Templates listos sin escribir HTML desde cero.

| Tool | Tipo | Use case |
|------|------|----------|
| **Clickbandit** (Burp) | Auto-generador | PoC realista con clicks grabados |
| [PortSwigger Lab Generator](https://portswigger.net/web-security/clickjacking) | Templates educativos | Aprender variantes |
| **clickjacker.io** | Online generator | Quick PoC con URL target |
| Manual `<iframe + opacity>` template | HTML básico | PoCs custom con full control |
| **OWASP HTML5 Clickjacking PoC** | GitHub repos | Variantes drag&drop, cursor jacking |

Template mínimo manual:

```html
<style>
  iframe { opacity: 0.3; position:absolute; top:-100px; left:-200px; width:1000px; height:800px; }
  button { position:absolute; top:200px; left:300px; z-index:1; }
</style>
<iframe src="https://victim.com/sensitive-action"></iframe>
<button>CLICK PARA PREMIO</button>
```

^cj-tool-generators

## Scanners y Recon Automatizado

Detectar al por mayor qué sitios son frameables.

| Tool | Foco | Comando ejemplo |
|------|------|----------------|
| **nuclei** + templates clickjacking | Bulk scan headers | `nuclei -u https://target -t http/misconfiguration/clickjacking/` |
| **clickjacker** (CLI Go) | XFO/CSP check | `clickjacker -u https://target -v` |
| **WhatWeb** + plugin | Fingerprint + headers | `whatweb -v https://target` |
| Header check con curl | Manual rápido | `curl -sI https://target \| grep -iE 'frame-options\|frame-ancestors'` |
| **Wappalyzer** browser ext | Visual headers | Ver tab "Security" |

Para masivo: feed `subfinder` → `httpx -title -web-server` → filtrar `X-Frame-Options absent`.

^cj-tool-scanners

## Browser DevTools y Frame Testing

Verificación local antes de armar PoC público.

| Acción | DevTools | Resultado |
|--------|----------|-----------|
| Test framing local | Console: `document.body.innerHTML='<iframe src=URL>'` | Si carga → frameable |
| Inspect XFO header | Network tab → Response Headers | XFO presente o no |
| CSP check | Console errors `Refused to frame` | CSP bloqueando |
| Touch emulation mobile | DevTools → Toggle device toolbar | Test touchjacking |
| Disable JS test | Settings → Disable JavaScript | Verifica frame-busting JS-only |
| Cookie inspection | Application → Cookies | SameSite values |

Firefox: `about:config` → `security.csp.enable=false` para testear sin CSP local (NO usar para producción).

^cj-tool-devtools

## Wordlists y Payload Repos

Vectores y bypasses curados para automation.

| Repo | Contenido |
|------|-----------|
| **PayloadsAllTheThings/Clickjacking** | Templates, bypass tricks, sandbox attrs |
| **SecLists** → `Fuzzing/clickjacking-payloads.txt` | URL params para auto-fill forms |
| **HackTricks** → Pentesting Web → Clickjacking | Variantes + chains |
| **OWASP Cheat Sheet — Clickjacking Defense** | Mitigaciones (útil para reverse engineer) |
| **Bug bounty writeups** (HackerOne disclosed) | PoCs reales reportados |

^cj-tool-wordlists
