---
aliases:
  - file
tags:
  - tool/file
  - env/linux
  - topic/forensics
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
  - "[[Hex Dump]]"
---
# Comando `file`

> [!info] file
> Determina el tipo de un archivo analizando su **contenido** (magic bytes), no su extensión. Clave para identificar archivos desconocidos o detectar extensiones falsas. Sintaxis: `file [opciones] archivo...`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `file archivo` | Tipo del archivo (`ASCII text`, `PNG image data`...) | Identificación básica |
| `file -b archivo` | Solo el tipo, sin el nombre | Para scripts/pipes |
| `file -i archivo` | Tipo **MIME** (`text/plain; charset=us-ascii`) | Detección programática |
| `file *` | Tipo de todos los archivos del dir | Triage rápido |
| `file -z comprimido.gz` | Mira **dentro** del comprimido | Sin descomprimir |
^file-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-b` / `--brief` | Solo el tipo, sin el nombre del archivo |
| `-i` / `--mime` | Muestra el tipo MIME |
| `-z` / `--uncompress` | Examina el contenido de archivos comprimidos |
| `-f lista.txt` | Lee los nombres a analizar desde un archivo |

> Detecta por **magic bytes** (firma del contenido), no por la extensión → revela archivos con extensión falsa. Para inspeccionar los bytes a mano: [[Hex Dump]].
^file-magic
