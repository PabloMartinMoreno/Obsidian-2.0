---
aliases:
tags:
  - tool/uniq
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
  - "[[sort]]"
---
# Comando `uniq`

> [!info] uniq
> Filtra o cuenta líneas únicas/duplicadas. Sintaxis: `uniq [opciones] [archivo]`.

> [!warning] Solo colapsa duplicados **consecutivos**
> `uniq` compara solo líneas adyacentes. Si los duplicados no están seguidos, **no** los detecta. Por eso casi siempre va con `sort` antes: `sort file | uniq`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `sort file \| uniq` | Líneas únicas (deduplicado real) | Quitar duplicados |
| `sort file \| uniq -c` | Cada línea con su nº de ocurrencias | Contar repeticiones |
| `sort file \| uniq -c \| sort -rn` | Ranking por frecuencia | Top de IPs/usuarios/errores |
| `sort file \| uniq -d` | Solo las que aparecen >1 vez | Hallar duplicados |
| `sort file \| uniq -u` | Solo las que aparecen 1 vez | Líneas únicas reales |
^uniq-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-c` | Antepone el conteo de ocurrencias |
| `-d` | Solo líneas duplicadas (consecutivas) |
| `-u` | Solo líneas no duplicadas |
| `-i` | Ignora mayúsculas/minúsculas |

---

## Por qué necesita `sort`

Archivo `frutas.txt`:
```
manzana
naranja
manzana
pera
```

- `uniq frutas.txt` → no colapsa nada (las "manzana" no están seguidas).
- `sort frutas.txt | uniq -c` → `2 manzana`, `1 naranja`, `1 pera` (correcto).
