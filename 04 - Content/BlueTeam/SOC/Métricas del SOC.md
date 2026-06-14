---
aliases:
  - SOC Metrics
  - KPIs del SOC
  - MTTD MTTR
tags:
  - topic/soc
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
  - "[[Fundamentos del SOC]]"
---
# Métricas del SOC

> [!info] Overview
> KPIs que miden la **eficacia y madurez** del SOC. El par central es **MTTD/MTTR** (qué tan rápido se detecta y se responde). El objetivo estratégico es reducir el **dwell time** — cuánto vive el atacante sin ser detectado.

---

## KPIs Principales

| **Métrica** | **Qué mide** | **Objetivo** |
|:---|:---|:---|
| **MTTD** (Mean Time to Detect) | Tiempo promedio desde que ocurre la intrusión hasta detectarla. | ↓ Minimizar |
| **MTTA** (Mean Time to Acknowledge) | Tiempo desde que dispara la alerta hasta que un analista la toma. | ↓ Minimizar |
| **MTTR** (Mean Time to Respond/Resolve) | Tiempo desde detección hasta contención/resolución. | ↓ Minimizar |
| **Dwell Time** | Tiempo total que el atacante estuvo en la red sin ser detectado. | ↓ Minimizar |
| **False Positive Rate** | % de alertas que resultan benignas. | ↓ Reduce fatiga |
| **False Negative Rate** | % de amenazas reales no detectadas. | ↓ Crítico |
| **Alert Volume** | Cantidad de alertas por período. | Gestionar carga |
| **Escalation Rate** | % de alertas Tier 1 escaladas a Tier 2/3. | Indica calidad de triaje |
| **Coverage (MITRE)** | % de técnicas ATT&CK con detección. | ↑ Maximizar |
^metricas-kpis

## Relación entre métricas

```
Intrusión ──MTTD──▶ Detección ──MTTA──▶ Triaje ──MTTR──▶ Contención
└──────────────────── Dwell Time ────────────────────────┘
```

- **Dwell time** alto = el atacante tuvo tiempo de moverse lateral, escalar y exfiltrar.
- Reducir MTTD/MTTR depende de buena detección ([[Tipos de Detección]]), automatización ([[SOAR y Playbooks]]) y triaje eficiente ([[Proceso de Triaje]]).
^metricas-relacion

> Cuidado con métricas vanidosas: "cantidad de alertas cerradas" no mide seguridad. Lo que importa es detectar lo relevante rápido y con bajo FN.
^metricas-cuidado
