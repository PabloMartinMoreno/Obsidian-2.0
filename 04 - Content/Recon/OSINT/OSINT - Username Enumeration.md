---
aliases:
  - OSINT - Búsqueda de Usuarios
  - Username Enumeration
tags:
  - technique/recon/passive
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: CheatSheet
linked:
  - "[[OSINT]]"
  - "[[OSINT - Reverse Image Search]]"
---
# OSINT - Username Enumeration

> [!info] Overview
> La gente **reutiliza** el mismo alias en todos lados. Con un username confirmado (la *semilla*) se rastrea dónde más existe esa cuenta y se reconstruye la huella digital. Núcleo de la fase de recolección del [[OSINT|ciclo de inteligencia]].

---

## Herramientas

| **Herramienta** | **Uso** | **Qué obtenés** |
|:---|:---|:---|
| **WhatsMyName** | `whatsmyname.app` (web) | Existencia de la cuenta en cientos de sitios. El estándar para arrancar. |
| **Sherlock** | `python3 sherlock usuario` | URLs donde existe la cuenta (CLI, `sherlock-project`). |
| **Maigret** | `maigret usuario` | Miles de sitios + extrae datos del perfil + reporte HTML/PDF (`soxoj/maigret`). |
| **Namechk / KnowEm** | web | Disponibilidad de marca → si está "ocupado", hay cuenta. |
^user-tools

## Cómo funcionan

Cada plataforma tiene URL de perfil predecible (`github.com/USER`). La herramienta arma la URL, hace la request y decide por el código HTTP / texto de "no encontrado". → Genera **falsos positivos** (sitios que devuelven 200 genérico). **Verificar siempre a mano.**
^user-funcionamiento

## Verificación y Pivote

Que el alias exista en 10 sitios **no** implica misma persona. Correlacionar para confirmar:

| **Señal** | **Cómo cruzar** |
|:---|:---|
| Foto de perfil | Búsqueda inversa → [[OSINT - Reverse Image Search]] |
| Bio (ubicación, nombre real, links, otros handles) | Comparar entre cuentas |
| Fecha de creación, estilo, intereses | Consistencia |

> **Pivote:** una cuenta confirmada revela nombre real (→ [[Google Dorking]]), email (→ [[OSINT - Email Intelligence]]), otros alias (→ nueva ronda).
^user-pivote

## Truco: Permutaciones

La gente varía el alias predeciblemente. Probar variantes: números (`jperez22`, `jperez_91`), separadores (`j.perez`, `j_perez`), sufijos (`jperezreal`, `jperez.oficial`), año. La cuenta "escondida" suele ser una variación de la obvia.
^user-permutaciones
