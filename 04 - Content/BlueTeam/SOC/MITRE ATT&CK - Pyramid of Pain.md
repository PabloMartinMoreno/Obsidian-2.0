---
aliases:
  - Pyramid of Pain
  - Pirámide del Dolor
tags:
  - topic/threat-intel
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[MITRE ATT&CK]]"
---
# MITRE ATT&CK - Pyramid of Pain

> Cuánto "duele" al adversario cambiar de táctica cuando el defensor detecta cada tipo de indicador. Cuanto más arriba, más caro para el atacante adaptarse.

---

## Niveles (de fácil a difícil de evadir)

| **Indicador** | **Dolor al atacante** | **Detalle** |
|:---|:---:|:---|
| Hash values | 😐 Trivial | Cambia el archivo y el hash cambia. |
| IP addresses | 😐 Fácil | Rota a un nuevo C2/IP. |
| Domain names | 🙂 Simple | Registra un dominio nuevo. |
| Network/Host artifacts | 😤 Molesto | Claves de registro, mutex, nombres de archivo (`T1547.001`). |
| Tools | 😣 Difícil | Re-desarrollar o conseguir otra herramienta. |
| **TTPs** | 😱 **Máximo** | Cambiar *cómo* opera (abuso de PowerShell `T1059`, process injection `T1055`). |
^pop-niveles

![[Cyber Kill Chain y MITRE ATT&CK-4.png]]

## Implicancia para Detección

- **Hash/IP** → fáciles de evadir, baja madurez defensiva.
- **TTPs (comportamiento, MITRE)** → difíciles de evadir, máximo costo para el atacante, alta madurez.

> Por eso las detecciones basadas en **comportamiento (TTPs MITRE)** valen mucho más que las basadas en IOCs atómicos (hash/IP). Bloquear una IP de C2 (`T1071`) solo ralentiza; detectar el patrón de abuso de PowerShell obliga a rediseñar el ataque.
^pop-deteccion
