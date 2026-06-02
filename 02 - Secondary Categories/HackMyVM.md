---
aliases:
  - HMV
tags:
  - meta/ctf
kind: Secondary Category
---
# HackMyVM

---

## Overview

Índice automático de writeups HMV. Source: [05 - Writeups/HackMyVM/](05%20-%20Writeups/HackMyVM/).

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "05 - Writeups/HackMyVM"
GROUP BY true
```

### Por estado

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto") as "Estado",
  length(rows) as "Cantidad"
FROM "05 - Writeups/HackMyVM"
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto")
```

### Por OS

```dataview
TABLE WITHOUT ID
  os as "OS",
  length(rows) as "Cantidad"
FROM "05 - Writeups/HackMyVM"
GROUP BY os
SORT length(rows) DESC
```

---

## Máquinas

```dataview
TABLE
  dificultad as "Dificultad",
  os as "OS",
  ip as "IP",
  choice(contains(file.tags, "estado/completo"), "✅", "🔴") as "Estado"
FROM "05 - Writeups/HackMyVM"
SORT dificultad ASC, file.name ASC
```

---

## Recursos

- [HackMyVM](https://hackmyvm.eu/)
- Template: [_hackmyvm](00%20-%20Resources/Templates/Writeup/_hackmyvm.md)
