---
aliases:
  - WhatWeb
tags:
  - tool/whatweb
  - technique/recon/active
  - technique/recon/passive
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
  - "[[Web Fingerprinting]]"
  - "[[Web Technology Enumeration]]"
---
# whatweb

Identifica el **stack** de un sitio (server, CMS, framework, librerías JS, analytics, versiones) por las huellas en la respuesta. Recon de fingerprinting por excelencia.

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `whatweb <target>` | Stack rápido (server, CMS, framework) | Primer fingerprint, pasivo |
| `whatweb -a3 <target>` | Agresividad 3 (más plugins, alguna petición extra) | Profundidad media |
| `whatweb -a4 -v <target>` | Máxima agresividad + verbose por plugin | Detalle completo (ruidoso) |
| `whatweb -i hosts.txt` | Bulk desde archivo de hosts | Muchos targets |
| `whatweb --log-json=out.json <target>` | Output JSON | Pipeline / parsing |
| `whatweb -U 'Mozilla/5.0' <target>` | User-Agent custom | Evadir filtros simples / blending |
| `whatweb --color=never <target> \| grep -i wordpress` | Filtrar una tech específica | Confirmar un CMS |
| `whatweb -a1 <target>` | Stealthy (solo lo que ya viene en la respuesta) | Mínimo ruido |

^whatweb-cheatsheet

---

## Niveles de agresividad

| Nivel | Comportamiento |
|---|---|
| `-a1` (Stealthy) | Una sola petición; solo analiza lo recibido |
| `-a3` (Aggressive) | Pocas peticiones extra para confirmar plugins |
| `-a4` (Heavy) | Muchas peticiones; máxima detección, más ruido |

---

## Notas relacionadas
- [[Web Fingerprinting]] · [[Web Technology Enumeration]] · [[Web Enumeración]]
