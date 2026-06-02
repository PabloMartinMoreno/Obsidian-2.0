---
aliases:
  - PortSwigger Academy
tags:
  - meta/ctf
  - asset/web-app
kind: Secondary Category
---
# PortSwigger

---

## Overview

Índice de labs PortSwigger Web Security Academy. Source: [05 - Writeups/PortSwigger/](05%20-%20Writeups/PortSwigger/).

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM "05 - Writeups/PortSwigger"
GROUP BY true
```

### Por estado

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto") as "Estado",
  length(rows) as "Cantidad"
FROM "05 - Writeups/PortSwigger"
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo", "🔴 Incompleto")
```

### Por vuln

```dataview
TABLE WITHOUT ID
  vuln as "Vuln",
  length(rows) as "Cantidad"
FROM "05 - Writeups/PortSwigger"
FLATTEN filter(file.tags, (t) => startswith(t, "#vuln/")) as vuln
GROUP BY vuln
SORT length(rows) DESC
```

---

## Labs

```dataview
TABLE
  dificultad as "Dificultad",
  choice(contains(file.tags, "estado/completo"), "✅", "🔴") as "Estado"
FROM "05 - Writeups/PortSwigger"
SORT file.name ASC
```

---

## Recursos

- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- Template: [_portswigger](00%20-%20Resources/Templates/Writeup/_portswigger.md)
