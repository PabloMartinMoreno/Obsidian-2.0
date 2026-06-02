---
aliases:
  - HTB
tags:
primary categories:
kind: Secondary Category
---
# Hack the Box

---

## Overview

Índice automático de writeups HTB. Source: [05 - Writeups/HackTheBox/](05%20-%20Writeups/HackTheBox/).

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "05 - Writeups/HackTheBox"
GROUP BY true
```

### Por estado

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto") as "Estado",
  length(rows) as "Cantidad"
FROM "05 - Writeups/HackTheBox"
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto")
```

### Por OS

```dataview
TABLE WITHOUT ID
  os as "OS",
  length(rows) as "Cantidad"
FROM "05 - Writeups/HackTheBox"
GROUP BY os
SORT length(rows) DESC
```

### Por dificultad

```dataview
TABLE WITHOUT ID
  dificultad as "Dificultad",
  length(rows) as "Cantidad"
FROM "05 - Writeups/HackTheBox"
GROUP BY dificultad
```

---

## Máquinas

```dataview
TABLE
  dificultad as "Dificultad",
  os as "OS",
  ip as "IP",
  choice(contains(file.tags, "estado/completo"), "✅", "🔴") as "Estado"
FROM "05 - Writeups/HackTheBox"
SORT dificultad ASC, file.name ASC
```

---

## Recursos

- [HTB Labs](https://app.hackthebox.com/)
- Template: [_hack the box](00%20-%20Resources/Templates/Writeup/_hack%20the%20box.md)

---
