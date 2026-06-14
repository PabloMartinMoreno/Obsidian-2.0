---
aliases:
  - SOC Tech Stack
  - Tecnologías del SOC
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
  - "[[SIEM]]"
---
# Stack Tecnológico del SOC

> [!info] Overview
> Las herramientas que el SOC opera para recolectar telemetría, detectar y responder. Cada capa cubre un dominio distinto (red, endpoint, identidad, casos) y alimenta a las demás. El **SIEM** suele ser el centro de correlación.

---

## Capas del Stack

| **Herramienta** | **Qué hace** | **Dominio** |
|:---|:---|:---|
| **SIEM** | Centraliza y correlaciona logs de todas las fuentes; genera alertas. Ver [[SIEM]]. | Logs / correlación |
| **EDR** (Endpoint Detection & Response) | Telemetría profunda de endpoints (procesos, registry, red); detección y respuesta en host. | Endpoint |
| **XDR** (Extended D&R) | Unifica EDR + red + cloud + identidad en una sola plataforma de detección. | Multi-dominio |
| **IDS** (Intrusion Detection System) | Detecta tráfico/actividad maliciosa y **alerta** (pasivo). | Red / host |
| **IPS** (Intrusion Prevention System) | Detecta y **bloquea** activamente (inline). | Red |
| **NDR** (Network Detection & Response) | Analiza tráfico de red en busca de anomalías y C2. | Red |
| **Firewall / NGFW** | Filtra tráfico por reglas; NGFW suma inspección de capa 7. | Perímetro |
| **TIP** (Threat Intelligence Platform) | Agrega, normaliza y distribuye feeds de threat intel. Ver [[Threat Intelligence]]. | Intel |
| **SOAR** (Security Orchestration, Automation & Response) | Automatiza respuesta vía playbooks; integra el resto del stack. Ver [[SOAR y Playbooks]]. | Orquestación |
| **Case Management** (ej. TheHive) | Gestiona alertas como casos/incidentes; colaboración y trazabilidad. | Casos |
| **Sandbox** | Detona archivos/URLs sospechosos en entorno aislado para análisis dinámico. | Malware |
| **Vulnerability Scanner** | Identifica vulnerabilidades en activos para gestión proactiva. | Vuln mgmt |
^stack-capas

## IDS vs IPS

| | **IDS** | **IPS** |
|:---|:---|:---|
| Acción | Detecta y **alerta** | Detecta y **bloquea** |
| Posición | Pasivo (fuera de línea, copia del tráfico) | Inline (en el camino del tráfico) |
| Riesgo | No frena el ataque | Falso positivo corta tráfico legítimo |
^stack-ids-ips

## Detección basada en firma vs anomalía

- **Firma (signature-based):** matchea patrones conocidos (reglas Snort/Suricata, YARA). Bajo FP, ciego a amenazas nuevas (0-day).
- **Anomalía (anomaly-based):** modela un baseline de "normal" y alerta desvíos. Detecta lo desconocido, mayor tasa de falsos positivos.

> Detalle de tipos de detección en [[Tipos de Detección]].
^stack-firma-anomalia
