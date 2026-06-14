---
aliases:
  - Caza de Amenazas
  - Hunting
tags:
  - topic/soc
  - topic/threat-hunting
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SOC Detección]]"
kind: Concept
linked:
  - "[[MITRE ATT&CK]]"
  - "[[Threat Intelligence]]"
  - "[[Tipos de Detección]]"
---
# Threat Hunting

> [!info] Overview
> Búsqueda **proactiva e iterativa** de amenazas que **evadieron** las detecciones automáticas. A diferencia del monitoreo reactivo (esperar la alerta), el hunter asume que el adversario ya está dentro y busca evidencia activamente. Tarea típica de **Tier 3**.

---

## Reactivo vs Proactivo

| | **Monitoreo (reactivo)** | **Threat Hunting (proactivo)** |
|:---|:---|:---|
| Disparador | Una alerta | Una hipótesis |
| Asunción | "Avisame si pasa algo" | "Asumo que ya pasó, lo busco" |
| Detecta | Lo conocido (firmas) | Lo que evadió las firmas |
| Quién | Tier 1/2 | Tier 3 / hunter |
^hunt-reactivo-proactivo

## Tipos de Hunting

| **Tipo** | **Punto de partida** |
|:---|:---|
| **Hypothesis-driven** | Una hipótesis ("si APT usa T1059, debería ver PowerShell anómalo"). Suele derivar de [[MITRE ATT&CK]]. |
| **Intel-driven (IOC)** | Un IOC nuevo de threat intel → buscarlo en el entorno. Ver [[Threat Intelligence]]. |
| **Anomaly/Baseline-driven** | Desvíos del comportamiento normal (análisis estadístico). |
| **Custom/Situational** | Adaptado a la organización (crown jewels, geopolítica, threat landscape propio). |
^hunt-tipos

## El Loop de Hunting

| **#** | **Fase** | **Qué se hace** |
|:---:|:---|:---|
| 1 | **Hipótesis** | Formular una suposición testeable (basada en intel, TTPs, anomalías). |
| 2 | **Investigar** | Recolectar y analizar datos (SIEM, EDR, logs) para probar/refutar. |
| 3 | **Descubrir** | Identificar TTPs, IOCs o patrones nuevos. |
| 4 | **Informar y Enriquecer** | Documentar; convertir hallazgos en **detecciones automáticas** nuevas. |
^hunt-loop

> El hunting exitoso **retroalimenta la detección**: cada TTP cazado debería volverse una regla de SIEM/EDR para que la próxima vez dispare sola. Convierte conocimiento tácito en cobertura permanente.
^hunt-feedback
