---
aliases:
  - El Proceso de Triaje
  - Triaje de Alertas
  - Alert Triage
tags:
  - topic/soc
  - topic/triage
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
  - "[[SIEM]]"
  - "[[Threat Intelligence]]"
  - "[[Incident Response]]"
---
# Proceso de Triaje

> [!info] Overview
> **Triaje de alertas**: evaluar y priorizar las alertas que generan los sistemas de detección para asignar recursos según amenaza e impacto real. Es la tarea central del **Tier 1**, el filtro que separa el ruido (FP) de los incidentes reales y decide qué **escalar**.

---

## El Flujo de Triaje

| **#** | **Paso** | **Qué se hace** |
|:---:|:---|:---|
| 1 | **Revisión inicial** | Metadatos de la alerta: timestamp, IP origen/destino, sistemas afectados, regla/firma que disparó. Revisar logs asociados. |
| 2 | **Clasificación** | Categorizar por gravedad, impacto y urgencia según el esquema de la organización. |
| 3 | **Correlación** | Cruzar con alertas/eventos relacionados; buscar IOCs en el [[SIEM]]; verificar contra [[Threat Intelligence]]. |
| 4 | **Enriquecimiento** | Sumar contexto: PCAPs, volcados de memoria, OSINT, sandbox de archivos/URLs/IPs sospechosas. |
| 5 | **Evaluación de riesgo** | Valor del activo, sensibilidad de datos, compliance, probabilidad de éxito y movimiento lateral. |
| 6 | **Análisis contextual** | ¿Falla de control o evasión? Estado de firewalls/IDS/EDR; implicancias legales/regulatorias. |
| 7 | **Consulta con IT** | Validar con operaciones/IT si hubo cambios o mantenimiento que expliquen la alerta (descartar **FP**). |
| 8 | **Decisión de respuesta** | Si es benigno → cerrar sin escalar. Si es real → iniciar respuesta a incidente ([[Incident Response]]). |
| 9 | **Escalamiento** | Si cumple triggers (activo crítico, ataque en curso, técnica sofisticada, insider), notificar a Tier 2/3 con resumen completo. |
| 10 | **Monitoreo continuo** | Seguir el progreso, comunicar updates a los equipos escalados. |
| 11 | **Desescalamiento** | Cuando el riesgo se mitiga y el incidente se contiene, cerrar con resumen y lecciones aprendidas. |
^triaje-flujo

## Escalamiento

La **escalada** notifica a supervisores/IR con autoridad para coordinar la respuesta. El analista entrega gravedad, impacto potencial y hallazgos de la investigación inicial.

| **Trigger de escalada** | **Ejemplo** |
|:---|:---|
| Compromiso de activo crítico | Servidor de dominio, base de datos productiva |
| Ataque en curso | C2 activo, exfiltración detectada |
| Técnica desconocida/sofisticada | TTP no catalogada, 0-day |
| Impacto generalizado | Múltiples hosts afectados |
| Insider threat | Actividad anómala de cuenta privilegiada |
^triaje-escalada

> El triaje busca el balance: escalar lo crítico rápido sin saturar a Tier 2/3 con FP. Un buen triaje se mide por su **escalation rate** y su tasa de FP (ver [[Métricas del SOC]]).
^triaje-balance
