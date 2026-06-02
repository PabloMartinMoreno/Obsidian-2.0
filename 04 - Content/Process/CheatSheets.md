---
aliases:
  - CheatSheets Index
tags:
  - meta/index
kind: Concept
cssclasses:
  - dashboard
---
# CheatSheets MOC

Índice de todas las notas `kind: CheatSheet` agrupadas por dominio.

---

## Stats

```dataview
TABLE WITHOUT ID
  length(rows) as "Total"
FROM ""
WHERE kind = "CheatSheet"
GROUP BY true
```

---

## AD

```dataview
TABLE WITHOUT ID
  file.link as "Cheatsheet",
  file.folder as "Carpeta"
FROM "04 - Content/AD"
WHERE kind = "CheatSheet"
SORT file.name ASC
```

---

## Web

```dataview
TABLE WITHOUT ID
  file.link as "Cheatsheet",
  split(file.folder, "/")[2] as "Subgrupo"
FROM "04 - Content/Web"
WHERE kind = "CheatSheet"
SORT file.folder ASC, file.name ASC
```

---

## Credentials

```dataview
TABLE WITHOUT ID
  file.link as "Cheatsheet",
  split(file.folder, "/")[2] as "Subgrupo"
FROM "04 - Content/Credentials"
WHERE kind = "CheatSheet"
SORT file.folder ASC, file.name ASC
```

---

## Services

```dataview
TABLE WITHOUT ID
  file.link as "Cheatsheet"
FROM "04 - Content/Services"
WHERE kind = "CheatSheet"
SORT file.name ASC
```

---

## Tools

```dataview
TABLE WITHOUT ID
  file.link as "Cheatsheet"
FROM "04 - Content/Tools"
WHERE kind = "CheatSheet"
SORT file.name ASC
```

---

## Recon / PrivEsc / Lateral / Payloads

```dataview
TABLE WITHOUT ID
  file.link as "Cheatsheet",
  file.folder as "Carpeta"
FROM "04 - Content/Recon" OR "04 - Content/PrivEsc" OR "04 - Content/Lateral" OR "04 - Content/Payloads"
WHERE kind = "CheatSheet"
SORT file.folder ASC, file.name ASC
```

---

## Sin clasificar

```dataview
TABLE WITHOUT ID
  file.link as "Cheatsheet",
  file.folder as "Carpeta"
FROM ""
WHERE kind = "CheatSheet"
  AND !startswith(file.folder, "04 - Content/AD")
  AND !startswith(file.folder, "04 - Content/Web")
  AND !startswith(file.folder, "04 - Content/Credentials")
  AND !startswith(file.folder, "04 - Content/Services")
  AND !startswith(file.folder, "04 - Content/Tools")
  AND !startswith(file.folder, "04 - Content/Recon")
  AND !startswith(file.folder, "04 - Content/PrivEsc")
  AND !startswith(file.folder, "04 - Content/Lateral")
  AND !startswith(file.folder, "04 - Content/Payloads")
  AND !contains(file.path, "00 - Resources/Templates")
SORT file.folder ASC, file.name ASC
```
