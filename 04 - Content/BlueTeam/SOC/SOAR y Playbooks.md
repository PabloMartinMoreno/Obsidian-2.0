---
aliases:
  - SOAR
  - Playbooks
  - Security Orchestration Automation and Response
tags:
  - topic/soc
  - topic/automation
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[SOC Respuesta]]"
kind: Concept
linked:
  - "[[Stack Tecnológico del SOC]]"
  - "[[Proceso de Triaje]]"
  - "[[Métricas del SOC]]"
---
# SOAR y Playbooks

> [!info] Overview
> **SOAR** (Security Orchestration, Automation & Response) automatiza tareas repetitivas del SOC para reducir **MTTR** y la fatiga de alertas. Tres pilares: **orquestación** (integrar herramientas), **automatización** (ejecutar acciones sin humano) y **respuesta** (workflows de remediación). Los **playbooks** son la lógica que ejecuta.

---

## Los 3 Pilares

| **Pilar** | **Qué resuelve** |
|:---|:---|
| **Orchestration** | Conecta el stack (SIEM, EDR, TIP, firewall) para que actúen coordinados. |
| **Automation** | Ejecuta acciones sin intervención (enriquecer alerta, aislar host, bloquear IP). |
| **Response** | Workflows estructurados de remediación, repetibles y auditables. |
^soar-pilares

## Playbook vs Runbook

| | **Playbook** | **Runbook** |
|:---|:---|:---|
| Qué es | Workflow completo de respuesta a un tipo de incidente | Procedimiento operativo de una tarea puntual |
| Alcance | Estratégico, multi-paso, multi-herramienta | Táctico, una acción concreta |
| Ejemplo | "Respuesta a phishing" (de extremo a extremo) | "Cómo aislar un endpoint en EDR" |
^soar-playbook-runbook

## Ejemplo: Playbook de Phishing

| **#** | **Paso (automatizable)** |
|:---:|:---|
| 1 | Detección: usuario reporta / regla SIEM dispara |
| 2 | Enriquecer: extraer URLs/adjuntos, detonar en sandbox, consultar TIP ([[Threat Intelligence]]) |
| 3 | Decidir: ¿malicioso? scoring automático |
| 4 | Contener: borrar el mail de todos los buzones, bloquear el dominio en el proxy |
| 5 | Remediar: reset de credenciales si hubo click, aislar host si hubo ejecución |
| 6 | Cerrar: documentar el caso, actualizar detecciones |
^soar-ejemplo-phishing

> No todo se automatiza: decisiones de alto impacto (apagar un servidor productivo) suelen requerir **human-in-the-loop**. SOAR acelera lo repetitivo, no reemplaza el criterio del analista.
^soar-human-loop
