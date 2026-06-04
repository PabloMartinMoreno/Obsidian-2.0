---
aliases:
  - WAFW00F
tags:
  - tool/wafw00f
  - technique/recon/active
  - asset/web-app
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Tool
linked:
  - "[[WAF]]"
  - "[[Web Fingerprinting]]"
---
# wafw00f

Detecta si un target está detrás de un **WAF** y cuál (Cloudflare, Akamai, AWS WAF, F5, etc.) analizando cómo responde a peticiones maliciosas. Paso previo a tirar payloads — saber qué te va a filtrar.

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `wafw00f <URL>` | ¿Hay WAF? cuál | Antes de payloads |
| `wafw00f -v <URL>` | Verbose: cómo lo detectó | Entender la firma |
| `wafw00f -a <URL>` | Prueba TODOS los WAFs (no para en el primero) | Stacks con múltiples WAFs |
| `wafw00f -l` | Lista los WAFs que sabe detectar | Referencia |
| `wafw00f -i hosts.txt` | Bulk desde archivo | Muchos targets |
| `wafw00f -p proxy.txt <URL>` | Vía proxy | Rotación / Burp |
| `wafw00f -o out.json --format json` | Output JSON | Pipeline |

^wafw00f-cheatsheet

> [!tip] Si hay WAF → ajustá la estrategia: bypass por encoding/case, fragmentación, o atacar el origin directo si se filtra la IP real. Ver [[WAF]].

---

## Notas relacionadas
- [[WAF]] · [[Web Fingerprinting]] · [[Web Enumeración]]
