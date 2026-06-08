---
aliases:
  - HSTS
  - Mecanismo HSTS (HTTP Strict Transport Security)
  - HTTP Strict Transport Security
  - Strict-Transport-Security
tags:
  - service/http
  - asset/web-app
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
  - "[[Web Fundamentals]]"
kind: Concept
linked:
  - "[[HTTP - Headers]]"
  - "[[HTTPS]]"
  - "[[Ataques Man-in-the-Middle (MitM)]]"
---
# HSTS — HTTP Strict Transport Security

Header de respuesta que **obliga al navegador a usar solo HTTPS** con un dominio durante un tiempo, aunque el usuario escriba `http://` o haga clic en un link `http`. Defensa directa contra **SSL strip** y downgrade a HTTP en claro.

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| **Directiva** | **Qué hace** |
|---|---|
| `max-age=<seg>` | Cuánto tiempo el browser fuerza HTTPS (ej. 1 año) |
| `includeSubDomains` | Aplica también a todos los subdominios |
| `preload` | Pide inclusión en la **HSTS preload list** (hardcodeada en los browsers) |

^hsts-header

---

## El Gap: First-Visit (TOFU)

HSTS es **Trust On First Use**: la primera visita (antes de recibir el header) sigue siendo vulnerable a downgrade. La **preload list** cierra ese hueco — el browser ya sabe que el dominio es HTTPS-only sin haberlo visitado.

---

## Recon / Ofensivo

| **Check** | **Comando** | **Implicancia** |
|---|---|---|
| ¿Hay HSTS? | `curl -sI https://target \| grep -i strict-transport` | Sin header → SSL strip / downgrade viable |
| `max-age=0` | (en el header) | HSTS desactivado de hecho |
| Sin `includeSubDomains` | (en el header) | Subdominios atacables por downgrade |
| ¿En preload list? | hstspreload.org | Si no, el first-visit es explotable |

^hsts-recon

> [!tip] "No HSTS" suele reportarse como finding Low, pero habilita **SSL strip** ([[Ataques Man-in-the-Middle (MitM)|MitM]]) → escala a robo de credenciales/cookies en claro.

---

## Notas relacionadas
- [[HTTP - Headers]] · [[HTTPS]] · [[Ataques Man-in-the-Middle (MitM)]] · [[SSL - TLS]]
