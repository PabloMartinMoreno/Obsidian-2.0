---
aliases:
  - param-miner
tags:
  - tool/burpsuite
  - technique/discovery
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Tool
linked:
  - "[[Mass Assignment - Tooling]]"
  - "[[Web Cache Poisoning - Tooling]]"
  - "[[Burp Suite]]"
---
# Param Miner

Extensión de Burp (BApp) que descubre **parámetros, headers y cookies ocultos** por fuzzing diferencial: prueba miles de nombres y detecta cuáles cambian la respuesta. Clave para **Mass Assignment** (params no documentados) y **Web Cache Poisoning** (inputs *unkeyed*).

## Cheatsheet

| **Acción** | **Qué hace** | **Cuándo** |
|---|---|---|
| Right-click → Param Miner → **Guess params** | Bruteforce de query/body params ocultos | Mass assignment, features ocultas |
| **Guess headers** | Headers ocultos que alteran la respuesta | Web cache poisoning (unkeyed inputs) |
| **Guess cookies** | Nombres de cookie ocultos | Param mining completo |
| **Guess everything** (bulk) | Params + headers + cookies de una | Recon agresivo |
| Wordlist custom + *rinse/repeat* | Usa tu lista de nombres | Targets específicos |

^param-miner-cheatsheet

> [!tip] Inputs *unkeyed* (no entran en la cache key) detectados por Param Miner → vector directo de [[Web Cache Poisoning - Tooling|Web Cache Poisoning]]. Params ocultos que el backend bindea sin filtrar → [[Mass Assignment - Tooling|Mass Assignment]].

## Notas relacionadas
- [[Mass Assignment - Tooling]] · [[Web Cache Poisoning - Tooling]] · [[Burp Suite]]
