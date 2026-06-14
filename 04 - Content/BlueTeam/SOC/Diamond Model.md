---
aliases:
  - Diamond Model of Intrusion Analysis
  - Modelo Diamante
tags:
  - topic/threat-intel
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
  - "[[Identificación]]"
tertiary categories:
  - "[[SOC Identificación]]"
kind: Concept
linked:
  - "[[MITRE ATT&CK]]"
  - "[[Cyber Kill Chain]]"
  - "[[Threat Intelligence]]"
---
# Diamond Model

> [!info] Overview
> Modelo de **análisis de intrusión** que describe cualquier evento malicioso con 4 vértices interconectados. La premisa central: **un adversario usa una capacidad sobre una infraestructura para atacar a una víctima.** Pivotar de un vértice a otro expande la comprensión del incidente.

---

## Los 4 Vértices

| **Vértice** | **Qué representa** | **Ejemplo** |
|:---|:---|:---|
| **Adversary** | Quién ataca (actor, grupo APT). | APT29, un insider, un grupo de ransomware. |
| **Capability** | Las TTPs/herramientas usadas. | Malware, exploit, phishing kit (mapea a [[MITRE ATT&CK]]). |
| **Infrastructure** | Activos físicos/lógicos del atacante. | Servidor C2, dominio, IP, cuenta de email. |
| **Victim** | El objetivo. | Persona, organización, activo, red. |
^diamond-vertices

```
        Adversary
           /\
          /  \
Infra ◀──┼────┼──▶ Capability
          \  /
           \/
         Victim
```

## Pivoteo (Analytic Pivoting)

El valor del modelo es **pivotar**: descubrir un vértice lleva a otros.

| **Desde** | **Pivot a** |
|:---|:---|
| Hash de malware (Capability) | → otras víctimas con el mismo malware |
| Dominio C2 (Infrastructure) | → otras campañas del mismo Adversary |
| Víctima comprometida (Victim) | → la Infrastructure usada para alcanzarla |
^diamond-pivot

## Relación con otros marcos

- **[[Cyber Kill Chain]]:** describe las *fases* de un ataque (eje temporal).
- **[[MITRE ATT&CK]]:** cataloga las *técnicas* concretas (la Capability).
- **Diamond Model:** relaciona los *actores/recursos* de un evento.

> Se combinan: un evento del Diamond (Capability) se mapea a una técnica ATT&CK, ubicada en una fase de la Kill Chain. Juntos dan el "quién, cómo, dónde y cuándo".
^diamond-relacion
