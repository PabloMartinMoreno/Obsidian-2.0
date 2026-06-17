---
aliases:
tags:
  - tool/diff
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
---
# Comando `diff`

> [!info] diff
> Compara archivos o directorios y muestra las diferencias. Sintaxis: `diff [opciones] archivo1 archivo2`. Base de los parches (patches).
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `diff a.txt b.txt` | Líneas que difieren | Comparación rápida |
| `diff -u a.txt b.txt` | Formato unificado (legible) | El más usado / parches |
| `diff --side-by-side a.txt b.txt` | Comparación en 2 columnas | Ver lado a lado |
| `diff -r dir1 dir2` | Recursivo entre directorios | Comparar árboles |
| `diff -w a.txt b.txt` | Ignora espacios en blanco | Cambios reales, no formato |
| `diff -u a.txt b.txt > cambios.patch` | Genera un parche | Distribuir cambios |
^diff-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-u` | Formato unificado (el estándar para patches) |
| `-c` | Formato de contexto |
| `--side-by-side` (`-y`) | Dos columnas |
| `-r` | Recursivo en directorios |
| `-w` | Ignora diferencias de espacios en blanco |
| `-B` | Ignora líneas en blanco |
| `-a` | Trata los archivos como texto (aunque sean binarios) |

---

## Formato unificado (ejemplo)

```diff
--- archivo1.txt
+++ archivo2.txt
@@ -1,3 +1,3 @@
-Línea en archivo1
+Línea modificada en archivo2
 Otra línea
 Una línea más
```

`-` = línea del original, `+` = línea del nuevo, sin prefijo = sin cambios. Aplicar con `patch < cambios.patch`.
