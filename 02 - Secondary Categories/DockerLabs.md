---
aliases:
tags:
  - meta/ctf
kind: Secondary Category
---
# DockerLabs

***

## Overview

Índice de writeups DockerLabs. Source: [05 - Writeups/DockerLabs/](05%20-%20Writeups/DockerLabs/).

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "05 - Writeups/DockerLabs"
GROUP BY true
```

### Por estado

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto") as "Estado",
  length(rows) as "Cantidad"
FROM "05 - Writeups/DockerLabs"
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto")
```

***

## Máquinas

```dataview
TABLE
  dificultad as "Dificultad",
  os as "OS",
  choice(contains(file.tags, "estado/completo"), "✅", "🔴") as "Estado"
FROM "05 - Writeups/DockerLabs"
SORT dificultad ASC, file.name ASC
```

***

## Recursos

- [DockerLabs](https://dockerlabs.es/)
- Template: [_dockerlabs](00%20-%20Resources/Templates/Writeup/_dockerlabs.md)
