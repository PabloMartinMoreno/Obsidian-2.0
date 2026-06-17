---
aliases:
  - sort
tags:
  - tool/sort
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
  - "[[uniq]]"
---
# Comando `sort`

> [!info] sort
> Ordena líneas de texto de un archivo o de stdin. Por defecto ordena alfabéticamente. Sintaxis: `sort [opciones] [archivo]`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `sort file` | Orden alfabético | Básico |
| `sort -u file` | Ordenado + **sin duplicados** | Dedup rápido |
| `sort -n file` | Orden numérico | Números (no lexicográfico) |
| `sort -rn file` | Numérico descendente | Top-N (con `head`) |
| `comando \| sort \| uniq -c \| sort -rn` | Frecuencia ordenada | Contar y rankear ([[uniq]]) |
| `sort -t',' -k2,2n datos.csv` | Por la 2ª columna, numérico | CSV/TSV |
| `sort -k2,2 file` | Por el 2º campo (sep. por espacios) | Columnas |
^sort-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-n` | Orden numérico (no alfabético) |
| `-r` | Orden inverso (descendente) |
| `-u` | Elimina líneas duplicadas (unique) |
| `-f` | Ignora mayúsculas/minúsculas |
| `-k N,N` | Ordena por el campo N |
| `-t C` | Define el separador de campo (ej. `-t','`) |
| `-o file` | Guarda la salida en un archivo (puede ser el mismo) |
| `-h` | Orden numérico "humano" (`2K`, `1G`) |

---

## Ejemplos

```bash
# Números (no lexicográfico)
echo -e "5\n2\n10\n1\n8" | sort -n        # → 1 2 5 8 10

# Ordenar in-place / a archivo nuevo (sin modificar el original con redirección)
sort -r archivo.txt -o archivo_ordenado.txt

# CSV: ordenar por la 2ª columna (edades) numéricamente
sort -t',' -k2,2n datos.csv
```

> `-o` permite sobrescribir el mismo archivo de forma segura (`sort file -o file`), cosa que `sort file > file` **rompe**.
