---
aliases:
tags:
  - meta/ctf
kind: Secondary Category
---
# VulnHub

***

## Overview

Índice de writeups VulnHub. Source: [05 - Writeups/VulnHub/](05%20-%20Writeups/VulnHub/).

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "05 - Writeups/VulnHub"
GROUP BY true
```

### Por estado

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto") as "Estado",
  length(rows) as "Cantidad"
FROM "05 - Writeups/VulnHub"
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto")
```

### Por OS

```dataview
TABLE WITHOUT ID
  os as "OS",
  length(rows) as "Cantidad"
FROM "05 - Writeups/VulnHub"
GROUP BY os
SORT length(rows) DESC
```

***

## Máquinas

```dataview
TABLE
  dificultad as "Dificultad",
  os as "OS",
  ip as "IP",
  choice(contains(file.tags, "estado/completo"), "✅", "🔴") as "Estado"
FROM "05 - Writeups/VulnHub"
SORT dificultad ASC, file.name ASC
```

***

## Recursos

- [VulnHub](https://www.vulnhub.com/)
- Template: [_vulnhub](00%20-%20Resources/Templates/Writeup/_vulnhub.md)
