---
aliases:
  - OTW
tags:
  - meta/ctf
kind: Secondary Category
---
# OverTheWire

***

## Overview

Índice de wargames OverTheWire (Bandit, Narnia, etc.). Source: [05 - Writeups/OverTheWire/](05%20-%20Writeups/OverTheWire/).

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "05 - Writeups/OverTheWire"
GROUP BY true
```

### Por estado

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto") as "Estado",
  length(rows) as "Cantidad"
FROM "05 - Writeups/OverTheWire"
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto")
```

***

## Wargames

```dataview
TABLE
  wargame as "Wargame",
  dificultad as "Dificultad",
  choice(contains(file.tags, "estado/completo"), "✅", "🔴") as "Estado"
FROM "05 - Writeups/OverTheWire"
SORT file.name ASC
```

***

## Recursos

- [OverTheWire Wargames](https://overthewire.org/wargames/)
- Template: [_overthewire](00%20-%20Resources/Templates/Writeup/_overthewire.md)
