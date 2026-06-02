---
aliases:
  - Incompletos
  - Pendientes
tags:
  - meta/index
cssclasses:
  - dashboard
---

# Incompletos por Dominio

Notas con `estado/incompleto`. Priorizar por dominio (`asset/*`), luego por antigüedad.

---

## Resumen

```dataview
TABLE WITHOUT ID
  length(rows) as "Total incompletas"
FROM #estado/incompleto
WHERE !contains(file.path, "00 - Resources/Templates")
GROUP BY true
```

---

## Por Dominio (`asset/*`)

```dataview
TABLE WITHOUT ID
  length(rows) as "Cantidad"
FROM #estado/incompleto
WHERE !contains(file.path, "00 - Resources/Templates")
FLATTEN filter(file.tags, (t) => startswith(t, "#asset/")) as dominio
GROUP BY dominio as "Dominio"
SORT length(rows) DESC
```

---

## Por Carpeta

```dataview
TABLE WITHOUT ID
  length(rows) as "Cantidad"
FROM #estado/incompleto
WHERE !contains(file.path, "00 - Resources/Templates")
GROUP BY file.folder as "Carpeta"
SORT length(rows) DESC
```

---

## Por Tipo (`kind`)

```dataview
TABLE WITHOUT ID
  length(rows) as "Cantidad"
FROM #estado/incompleto
WHERE !contains(file.path, "00 - Resources/Templates")
GROUP BY kind as "Tipo"
SORT length(rows) DESC
```

---

## Todas las Incompletas (ordenadas por antigüedad)

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  file.folder as "Carpeta",
  dateformat(file.mtime, "yyyy-MM-dd") as "Última edición"
FROM #estado/incompleto
WHERE !contains(file.path, "00 - Resources/Templates")
SORT file.mtime ASC
```

---

## Sin Dominio (asset/*)

Incompletas sin tag `asset/*` — clasificar primero antes de trabajarlas.

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  file.folder as "Carpeta"
FROM #estado/incompleto
WHERE !contains(file.path, "00 - Resources/Templates")
  AND length(filter(file.tags, (t) => startswith(t, "#asset/"))) = 0
SORT file.name ASC
```
