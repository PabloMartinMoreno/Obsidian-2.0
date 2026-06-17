---
aliases:
tags:
  - tool/head
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[tail]]"
  - "[[sort]]"
  - "[[Common Linux Utilities]]"
---
# Comando `head`

> [!info] head
> Muestra las **primeras** líneas de un archivo (default **10**). Opuesto de [[tail]]. Sin archivo, lee de stdin. Sintaxis: `head [opciones] [archivo]`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `head file` | Primeras 10 líneas | Vistazo rápido |
| `head -n 20 file` | Primeras 20 líneas | Más contexto |
| `head -c 100 file` | Primeros 100 **bytes** | Magic bytes / binarios |
| `head -n -5 file` | Todo **menos** las últimas 5 | Recortar el final |
| `sort -rn file \| head -n 10` | Top 10 | Ranking (con [[sort]]) |
| `head -n 1 *.txt` | 1ª línea de cada archivo | Comparar headers |
^head-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-n N` | Primeras N líneas (`-n -N` = todas menos las últimas N) |
| `-c N` | Primeros N bytes |
| `-q` | Sin encabezados (varios archivos) |

> Combo clásico **Top-N**: `... | sort -rn | head`. Para el final del archivo, [[tail]].
^head-opciones
