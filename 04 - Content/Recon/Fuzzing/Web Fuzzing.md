---
aliases:
  - Web Content Discovery
  - Fuzzing Web
tags:
  - asset/web-app
  - technique/recon/active
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: CheatSheet
linked:
  - "[[Directory Fuzzing]]"
  - "[[Parameter Fuzzing]]"
  - "[[Subdomain & VHost Fuzzing]]"
  - "[[API Fuzzing]]"
  - "[[Filtrado de salida de fuzzing]]"
  - "[[ffuf]]"
---
# Web Fuzzing

Descubrir **contenido, parámetros y hosts ocultos** por fuerza bruta de nombres contra wordlists. Núcleo de la enumeración web activa: lo que no está linkeado en la app igual existe (paneles, backups, endpoints, params no documentados). Hub — cada tipo tiene su nota atómica.

---

## Tipos

| **Qué fuzzeás** | **Nota** | **Para qué** |
|---|---|---|
| Directorios / archivos | [[Directory Fuzzing]] | Endpoints, paneles admin, backups, `.git` |
| Parámetros | [[Parameter Fuzzing]] | Params ocultos → IDOR, mass assignment, debug |
| Subdominios / VHosts | [[Subdomain & VHost Fuzzing]] | Superficie extra, hosts internos por Host header |
| API | [[API Fuzzing]] | Endpoints/métodos REST/GraphQL no documentados |

---

## Herramientas

| **Tool** | **Fuerte en** |
|---|---|
| [[ffuf]] | Rápido, flexible, todo terreno (dir/param/vhost) |
| [[gobuster]] | dir / dns / vhost, simple y rápido |
| [[feroxbuster]] | Recursivo por defecto |
| `wfuzz` | Clásico, control granular |
| [[Burp Suite]] (Intruder) | Manual, sesiones autenticadas |

---

## ffuf — sintaxis base

```bash
# Directorios / archivos
ffuf -w wl.txt -u http://target/FUZZ

# Parámetro GET (filtrar respuestas vacías)
ffuf -w params.txt -u "http://target/?FUZZ=test" -fs 0

# Parámetro POST
ffuf -w params.txt -u http://target/ -X POST -d "FUZZ=test" -H "Content-Type: application/x-www-form-urlencoded"

# VHost (subdominios por Host header)
ffuf -w subs.txt -u http://target -H "Host: FUZZ.target.com" -fs <size-baseline>

# Extensiones + recursión
ffuf -w wl.txt -u http://target/FUZZ -e .php,.bak,.txt -recursion
```

^web-fuzzing-ffuf

> [!tip] Filtros (`-fc` código, `-fs` size, `-fw` words, `-fl` lines) y matchers (`-mc`) son lo que separa señal de ruido. Calibrá con una request a un path inexistente primero.

---

## Wordlists

- **SecLists** → `/usr/share/seclists/Discovery/Web-Content/` (`directory-list-2.3-medium`, `raft-*`), `Discovery/DNS/` (subdominios).
- Valores de parámetros: `rockyou.txt`, listas custom del target.

---

## Filtrar el ruido

El fuzzing genera miles de respuestas → filtrar por código/tamaño/palabras es obligatorio para no ahogarse. Técnicas y flags en [[Filtrado de salida de fuzzing]].

---

## Notas relacionadas
- [[Directory Fuzzing]] · [[Parameter Fuzzing]] · [[Subdomain & VHost Fuzzing]] · [[API Fuzzing]] · [[Filtrado de salida de fuzzing]] · [[Web Technology Enumeration]]
