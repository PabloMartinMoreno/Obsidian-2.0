---
aliases:
  - SIEM
  - Security Information and Event Management
  - Definición y Fundamentos de SIEM
tags:
  - topic/siem
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: Concept
linked:
  - "[[Stack Tecnológico del SOC]]"
  - "[[Casos de Uso de SIEM]]"
  - "[[Elastic Stack]]"
---
# Fundamentos de SIEM

> [!info] Overview
> **SIEM** (Security Information and Event Management): centraliza, normaliza y **correlaciona** logs de toda la infraestructura para detectar y alertar amenazas en tiempo real. Es la base de la capacidad de detección del SOC — no reemplaza IDS/IPS/EDR, los **integra** y correlaciona. Surge (Gartner 2005) de fusionar **SIM** (gestión de logs) + **SEM** (gestión de eventos).

---

## SIM + SEM = SIEM

| **Tecnología** | **Aporta** |
|:---|:---|
| **SIM** (Security Information Mgmt) | Almacenamiento extendido, análisis y reporting de logs + threat intel. |
| **SEM** (Security Event Mgmt) | Consolidación, correlación y notificación de eventos en tiempo real (AV, firewall, IDS). |
| **SIEM** | Fusión de ambos: agregar + preservar + correlacionar logs y eventos de múltiples fuentes. |
^siem-sim-sem

## Flujo de Datos en un SIEM

| **#** | **Etapa** | **Qué ocurre** |
|:---:|:---|:---|
| 1 | **Ingesta** | Recolecta logs de PCs, red, servidores, apps (data collection). |
| 2 | **Procesamiento & Normalización** | Convierte raw data a un formato común que entiende el motor de correlación. |
| 3 | **Análisis** | El SOC crea reglas de detección, dashboards, visualizaciones, alertas e incidentes. |
^siem-flujo

## Requisitos de Negocio / Casos de Uso

| **Capacidad** | **Qué resuelve** |
|:---|:---|
| **Agregación y Normalización de Logs** | Visibilidad centralizada; correlación entre fuentes dispares. |
| **Alerta de Amenazas** | Notifica al SOC en tiempo real con análisis avanzado + threat intel. |
| **Contextualización** | Clasifica alertas (actores, activos, momento) para reducir falsos positivos. |
| **Compliance** | Reporting y auditoría para PCI DSS, HIPAA, GDPR. |
^siem-casos-negocio

## Por qué importa el fine-tuning

Un SIEM genera **cientos a miles de eventos por hora**. Sin ajuste, el SOC se ahoga en falsos positivos. La capacidad de identificar con precisión **eventos de alto riesgo** es lo que distingue al SIEM de IDS/IPS: no solo registra, **correlaciona** datos de muchas fuentes para reconocer lo que podría llevar a explotación.

> Ejemplo: 5 logins fallidos en un firewall → bloqueo de cuenta admin. El SIEM correlaciona los logs dispersos en un único evento accionable en un dashboard central.
^siem-finetuning
