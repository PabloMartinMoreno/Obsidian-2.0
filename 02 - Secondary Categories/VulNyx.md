---
aliases:
tags:
  - meta/ctf
kind: Secondary Category
---
# VulNyx

***

## Overview

Índice de writeups VulNyx. Source: [05 - Writeups/VulNyx/](05%20-%20Writeups/VulNyx/).

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "05 - Writeups/VulNyx"
GROUP BY true
```

### Por estado

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto") as "Estado",
  length(rows) as "Cantidad"
FROM "05 - Writeups/VulNyx"
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto")
```

***

## Máquinas

```dataview
TABLE
  dificultad as "Dificultad",
  os as "OS",
  ip as "IP",
  choice(contains(file.tags, "estado/completo"), "✅", "🔴") as "Estado"
FROM "05 - Writeups/VulNyx"
SORT dificultad ASC, file.name ASC
```

***

## Recursos

- [VulNyx](https://vulnyx.com/)
- Template: [_vulnyx](00%20-%20Resources/Templates/Writeup/_vulnyx.md)
