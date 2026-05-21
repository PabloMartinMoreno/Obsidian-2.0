---
aliases:
  - Dashboard
  - Home
tags:
  - meta/index
cssclasses:
  - dashboard
---

# Global Index

***

## Atajos

### Dashboards
- [[Incompletos]] — MOC pendientes por dominio
- [[Hack the Box]] — dashboard HTB

### Web
- [[Web Enumeración]] — MOC web recon
- [[Web Explotación]] — MOC web exploit

### Active Directory
- [[Active Directory]] — MOC AD
- [[Active Directory Enumeración]] — MOC AD enum
- [[Active Directory Explotación]] — MOC AD exploit

### Process
- [04 - Content/Process/](04%20-%20Content/Process/) — meta-notas y workflows

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

## Incompletos — Teaser

> [!todo] 5 más recientes
> Ver lista completa en [[Incompletos]].

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  file.folder as "Carpeta"
FROM #estado/incompleto
WHERE !contains(file.path, "00 - Resources/Templates")
SORT file.mtime DESC
LIMIT 5
```

***

## Writeups por Plataforma

```dataview
TABLE WITHOUT ID
  plataforma as "Plataforma",
  length(rows) as "Total",
  length(filter(rows, (r) => contains(r.file.tags, "estado/completo"))) as "✅",
  length(filter(rows, (r) => contains(r.file.tags, "estado/incompleto"))) as "🔴"
FROM "05 - Writeups"
FLATTEN split(file.folder, "/")[1] as plataforma
WHERE plataforma != null
GROUP BY plataforma
SORT length(rows) DESC
```

***

## Notas por Dominio (`asset/*`)

```dataview
TABLE WITHOUT ID
  regexreplace(dominio, "#asset/", "") as "Dominio",
  length(rows) as "Notas"
FROM ""
WHERE !contains(file.path, "00 - Resources/Templates")
FLATTEN filter(file.tags, (t) => startswith(t, "#asset/")) as dominio
GROUP BY dominio
SORT length(rows) DESC
```
