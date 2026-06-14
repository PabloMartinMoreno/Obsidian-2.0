---
aliases:
  - Detection Types
  - IOC vs IOA
tags:
  - topic/soc
  - topic/detection
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
  - "[[Stack Tecnológico del SOC]]"
  - "[[MITRE ATT&CK]]"
  - "[[Threat Intelligence]]"
---
# Tipos de Detección

> [!info] Overview
> Cómo decide el SOC que algo es malicioso. Dos ejes: **qué se busca** (firma vs anomalía vs comportamiento) y **qué tipo de evidencia** (IOC vs IOA). El resultado de cada alerta se clasifica en la matriz de confusión (TP/FP/TN/FN).

---

## Métodos de Detección

| **Método** | **Cómo funciona** | **Fortaleza / Debilidad** |
|:---|:---|:---|
| **Signature-based** | Matchea patrones conocidos (reglas IDS, hashes, YARA). | + Bajo FP / − Ciego a lo nuevo (0-day). |
| **Anomaly-based** | Baseline de "normal", alerta desvíos. | + Detecta lo desconocido / − Más FP. |
| **Behavior-based** | Detecta secuencias de acciones (TTPs MITRE), no artefactos. | + Difícil de evadir / − Requiere contexto y tuning. |
| **Heuristic** | Reglas/scoring para inferir malicia sin firma exacta. | + Detecta variantes / − FP moderados. |
^det-metodos

## IOC vs IOA

| | **IOC** (Indicator of Compromise) | **IOA** (Indicator of Attack) |
|:---|:---|:---|
| Qué es | Artefacto que prueba un compromiso **ya ocurrido** | Comportamiento que indica un ataque **en curso** |
| Ejemplos | Hash de malware, IP/dominio C2, mutex, clave de registro | PowerShell ofuscado lanzando descarga, LSASS dump, lateral movement |
| Naturaleza | Reactivo, forense | Proactivo, en tiempo real |
| Evasión | Fácil (rotar hash/IP) | Difícil (cambiar TTPs) — ver [[MITRE ATT&CK - Pyramid of Pain\|Pyramid of Pain]] |
^det-ioc-ioa

## Matriz de Confusión (clasificación de alertas)

| | **Es malicioso** | **Es benigno** |
|:---|:---|:---|
| **Alerta dispara** | True Positive (TP) ✅ | False Positive (FP) — ruido |
| **No dispara** | False Negative (FN) — ⚠️ el peligroso | True Negative (TN) ✅ |
^det-matriz

> El objetivo del tuning es minimizar **FP** (fatiga de alertas) sin generar **FN** (amenazas que pasan). Un FN es el peor caso: ataque no detectado.
^det-tuning
