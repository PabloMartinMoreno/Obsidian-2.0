---
aliases:
  - Dashboard
  - Home
tags:
  - type/moc/primary
  - meta/index
cssclasses:
  - dashboard
---

# Global Index

Punto de entrada del vault. Navegación, métricas y trabajo en curso.

***

## Stats Generales

```dataview
TABLE WITHOUT ID
  length(rows) as "Notas totales"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
GROUP BY true
```

```dataview
TABLE WITHOUT ID
  choice(contains(file.tags, "estado/completo"), "✅ Completo",
    choice(contains(file.tags, "estado/incompleto"), "🔴 Incompleto", "⚪ Sin estado")) as "Estado",
  length(rows) as "Cantidad"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
GROUP BY choice(contains(file.tags, "estado/completo"), "✅ Completo",
  choice(contains(file.tags, "estado/incompleto"), "🔴 Incompleto", "⚪ Sin estado"))
```

***

## Primary Categories

```dataview
LIST
FROM "01 - Primary Categories"
SORT file.name ASC
```

***

## Secondary Categories

```dataview
TABLE WITHOUT ID
  file.link as "MOC",
  length(file.outlinks) as "Outlinks"
FROM "02 - Secondary Categories"
SORT file.name ASC
```

***

## Writeups por Plataforma

```dataview
TABLE WITHOUT ID
  split(file.folder, "/")[2] as "Plataforma",
  length(rows) as "Writeups",
  length(filter(rows, (r) => contains(r.file.tags, "estado/completo"))) as "✅",
  length(filter(rows, (r) => contains(r.file.tags, "estado/incompleto"))) as "🔴"
FROM "05 - Writeups"
WHERE file.folder != "05 - Writeups"
GROUP BY split(file.folder, "/")[2]
SORT length(rows) DESC
```

***

## Actividad Reciente

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  dateformat(file.mtime, "yyyy-MM-dd HH:mm") as "Modificada"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
SORT file.mtime DESC
LIMIT 15
```

***

## Incompletos — Priorizar

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  file.folder as "Ubicación"
FROM #estado/incompleto
SORT file.mtime DESC
LIMIT 20
```

***

## Atajos

- [[Hack the Box]] — dashboard HTB
- [[Active Directory]] — MOC AD
- [[Web Enumeración]] — MOC web recon
- [[Web Explotación]] — MOC web exploit
- [[Active Directory Enumeración]] — MOC AD enum
- [[Active Directory Explotación]] — MOC AD exploit

***

## Templates

- [00 - Resources/Templates/](00%20-%20Resources/Templates/)
