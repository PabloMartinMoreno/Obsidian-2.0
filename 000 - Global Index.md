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

> [!tip] Cómo navegar
> Dominio → categoría → hub → notas. Atajos directos abajo; dashboards de estado al final.

---

## Dominios

- [[Red Team]] — [[Information Gathering]] · [[Resource Development]] · [[Explotación]] · [[Post-Explotación]] · [[Lateral Movement]] · [[Operational Tasks]]
- [[Blue Team]] — CDSA · SOC · SIEM · Incident Response · Forensics (contenido directo en el MOC)
- Sin desarrollar: [[Cryptography]] · [[Cloud Security]] · [[Development]] · [[Reporting]]

---

## Hubs frecuentes

- **Web** — [[Web Fundamentals]] · [[Web Enumeración]] · [[Web Explotación]] · [[Client-Side Exploitation]]
- **Active Directory** — [[Active Directory]] (mindmap) · [[Active Directory Enumeración]] · [[Active Directory Explotación]] · [[Active Directory Lateral Movement]]
- **Acceso** — [[Shells]] · [[Service Exploitation]] · [[Credentials Cracking]]
- **Post-Explotación** — [[Linux Post-Explotación]] · [[Windows Post-Explotación]] · [[Persistence Techniques]] · [[Defense Evasion]]
- **Payloads y C2** — [[Payload & Malware Engineering]] · [[C2 Infrastructure]] · [[Command & Control (C2)]] · [[Evasion & Obfuscation]]
- **Tooling** — [[Tools]] · [[Metasploit]] · [[PowerShell]] · [[Common Exploitation Tools]]

---

## Práctica y certs

- **Plataformas** — [[Hack the Box]] · [[PortSwigger]] · [[DockerLabs]] · [[HackMyVM]] · [[VulNyx]] · [[VulnHub]] · [[OverTheWire]]
- **Certs** — [[CWES]] · [[OffSec]]
- **Formación** — [[Online Courses]] · [[Learning Techniques]]

---

## Vault

- **Dashboards** — [[Incompletos]] · [[Todo Round-Up]] · [[CheatSheets]]
- **Meta** — [[Vault Administration]] · [[tags]] · [[Obsidian]]

---

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

---

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

---

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

---

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
