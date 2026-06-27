---
aliases:
  - Todo Round-Up
tags:
  - meta/index
cssclasses:
  - dashboard
kind: Concept
---

# Todo Round-Up

Agrega todos los checkboxes abiertos (`- [ ]`) de cualquier nota del vault. Complementa a [[Incompletos]] (que trackea notas con `estado/incompleto` enteras; esto trackea tareas sueltas dentro de notas).

---

## Resumen

```dataview
TABLE WITHOUT ID
  length(rows) as "Tareas abiertas"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
FLATTEN file.tasks as t
WHERE !t.completed
GROUP BY true
```

---

## Por Carpeta

```dataview
TABLE WITHOUT ID
  length(rows) as "Abiertas"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
FLATTEN file.tasks as t
WHERE !t.completed
GROUP BY file.folder as "Carpeta"
SORT length(rows) DESC
```

---

## Tareas abiertas por nota

```dataview
TASK
FROM ""
WHERE !completed AND !fullyCompleted AND !contains(file.path, "00 - Resources/Templates")
GROUP BY file.link
SORT file.mtime DESC
```
