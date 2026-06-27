---
aliases:
  - CheatSheets
tags:
  - meta/index
cssclasses:
  - dashboard
kind: Concept
---

# CheatSheets

Índice auto-poblado de notas `kind: CheatSheet` y checklists del vault. Referencia rápida de comandos copy-paste.

---

## Resumen

```dataview
TABLE WITHOUT ID
  length(rows) as "Total CheatSheets"
FROM ""
WHERE kind = "CheatSheet" AND !contains(file.path, "00 - Resources/Templates")
GROUP BY true
```

---

## Por Dominio (`asset/*`)

```dataview
TABLE WITHOUT ID
  length(rows) as "Cantidad"
FROM ""
WHERE kind = "CheatSheet" AND !contains(file.path, "00 - Resources/Templates")
FLATTEN filter(file.tags, (t) => startswith(t, "#asset/")) as dominio
GROUP BY dominio as "Dominio"
SORT length(rows) DESC
```

---

## Por Carpeta

```dataview
TABLE WITHOUT ID
  length(rows) as "Cantidad"
FROM ""
WHERE kind = "CheatSheet" AND !contains(file.path, "00 - Resources/Templates")
GROUP BY file.folder as "Carpeta"
SORT length(rows) DESC
```

---

## Todas las CheatSheets

```dataview
TABLE WITHOUT ID
  file.link as "CheatSheet",
  file.folder as "Carpeta",
  dateformat(file.mtime, "yyyy-MM-dd") as "Última edición"
FROM ""
WHERE kind = "CheatSheet" AND !contains(file.path, "00 - Resources/Templates")
SORT file.name ASC
```

---

## Checklists (`meta/checklist`)

Notas operativas tipo checklist, separadas de las cheatsheets de comandos.

```dataview
TABLE WITHOUT ID
  file.link as "Checklist",
  file.folder as "Carpeta"
FROM #meta/checklist
WHERE !contains(file.path, "00 - Resources/Templates")
SORT file.name ASC
```
