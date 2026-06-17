---
aliases:
tags:
  - env/linux
  - tool/awk
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[grep]]"
  - "[[find]]"
---
# Comando `awk`

> [!info] awk
> Procesador de texto por **columnas**: para cada línea que matchea un `pattern`, ejecuta una `action`. Sintaxis: `awk 'pattern { action }' file`. Ideal para extraer/transformar datos tabulares.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `awk '{print $1}' file` | Primera columna | Separador default = whitespace |
| `awk -F',' '{print $2}' file` | Columna N por separador | Parseo CSV |
| `awk '{print $NF}' file` | **Última** columna | Largo variable |
| `awk '/pattern/{print}' file` | Líneas que matchean regex | Filtro |
| `awk 'NR==5' file` | Línea específica | Pinpoint |
| `awk 'NR>1' file` | Saltea el header | Cleanup |
| `awk '!seen[$0]++' file` | Dedup **preservando orden** | Unique sin `sort` |
| `awk '{sum+=$1} END {print sum}' file` | Suma de una columna | Stats |
| `awk -F: '{print $1}' /etc/passwd` | Usuarios del sistema | Enum Linux |
^awk-cheatsheet

---

## Variables y Bloques

| **Elemento** | **Qué es** |
|---|---|
| `$0` | Línea completa |
| `$1 $2 … $NF` | Campo 1, 2, … último |
| `NF` | **N**umber of **F**ields (campos en la línea) |
| `NR` | **N**umber of **R**ecord (nº de línea actual) |
| `FS` / `OFS` | Separador de campo de entrada / salida |
| `BEGIN { }` | Se ejecuta **antes** de procesar líneas |
| `END { }` | Se ejecuta **después** de todas las líneas |

```bash
awk 'BEGIN {FS=","; OFS="\t"} {print $1, $2}' file   # CSV → TSV
awk '{if ($3 > 100) print $0}' file                  # condicional
awk '{for (i=NF; i>0; i--) printf("%s ", $i); print ""}' file  # invertir campos
```

**Funciones:** `length()`, `substr(s,i,n)`, `toupper()`, `tolower()`.

---

## Patterns en Pentest

```bash
# Extraer IPs
awk '/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/ {print $0}' file

# nmap: puertos abiertos
nmap -p- <target> | awk '/open/ {print $1}' | cut -d/ -f1

# /etc/passwd: usuarios reales (UID > 1000)
awk -F: '$3 > 1000 {print $1}' /etc/passwd

# Solo el nombre del binario en una lista de paths SUID
find / -perm -4000 2>/dev/null | awk -F/ '{print $NF}'
```

---

## Notas Relacionadas

- [[grep]]
- [[find]]
