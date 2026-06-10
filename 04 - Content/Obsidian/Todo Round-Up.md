---
aliases:
  - TODOs
  - Pendientes
tags:
  - meta/index
kind: Concept
cssclasses:
  - dashboard
---

# Todo Round-Up

Notas con callout `> [!todo]` activo. Útil para encontrar todo pendiente disperso, complementario a `[[Incompletos]]` (que filtra por tag).

---

## Notas con `[!todo]`

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  file.folder as "Carpeta",
  dateformat(file.mtime, "yyyy-MM-dd") as "Última edición"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
  AND regexmatch(">\\s*\\[!todo\\]", file.content)
SORT file.mtime DESC
```

---

## Por Carpeta

```dataview
TABLE WITHOUT ID
  file.folder as "Carpeta",
  length(rows) as "Notas con todo"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
  AND regexmatch(">\\s*\\[!todo\\]", file.content)
GROUP BY file.folder
SORT length(rows) DESC
```

---

## Notas

- Dataview detecta `[!todo]` via `regexmatch` sobre `file.content`.
- Para tracking más granular (checkboxes `- [ ]`), Dataview soporta nativo via `TASK FROM ""`.
- Ver también: [[Incompletos]] — pendientes via tag `estado/incompleto`.
