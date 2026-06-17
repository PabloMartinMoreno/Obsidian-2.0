---
aliases:
tags:
  - tool/less
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[more]]"
  - "[[Common Linux Utilities]]"
  - "[[Linux PrivEsc - SUID y SGID]]"
---
# Comando `less`

> [!info] less
> Pager para ver archivos largos **paginado**, con navegación bidireccional y búsqueda. Mejor que [[more]] (que solo va hacia adelante). No carga el archivo entero → rápido en archivos enormes. Sintaxis: `less [opciones] archivo`.
^definicion

---

## Navegación (dentro de less)

| **Tecla** | **Acción** |
|---|---|
| `Espacio` / `b` | Avanza / retrocede una página |
| `↓` / `↑` | Una línea |
| `g` / `G` | Inicio / fin del archivo |
| `/texto` / `?texto` | Buscar hacia adelante / atrás |
| `n` / `N` | Siguiente / anterior coincidencia |
| `F` | Modo follow (como `tail -f`) |
| `&patrón` | Solo líneas que matchean |
| `q` | Salir |
^less-nav

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-N` | Muestra números de línea |
| `-S` | No wrap (corta líneas largas) |
| `-i` | Búsqueda case-insensitive |
| `+F` | Arranca en modo follow |
| `-R` | Interpreta colores ANSI |

> [!tip] PrivEsc
> Si `less`/`more`/`man` corren con **SUID** o vía `sudo`, escapan a shell: dentro de `less`, tipear `!sh` o `!/bin/bash`. Ver [[Linux PrivEsc - SUID y SGID]].
^less-privesc
