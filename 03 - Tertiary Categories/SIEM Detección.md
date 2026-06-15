---
aliases:
  - SIEM Detect
tags:
  - topic/siem
  - topic/detection
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
kind: Tertiary Category
linked:
  - "[[SOC Detección]]"
---
# SIEM Detección

> SIEM × **NIST Detect**. Monitoreo continuo y correlación de logs: la tecnología, sus fuentes y la ingeniería de detección.

---

## 📚 Fundamentos
  Qué es un SIEM y cómo procesa los datos.

- [[Fundamentos de SIEM]] (Qué es, SIM+SEM, flujo de datos, casos de negocio, compliance.)


## 🖥️ Plataforma y Queries
  Las soluciones SIEM concretas y sus lenguajes de consulta.

- [[Elastic Stack]] (ELK: componentes, arquitectura, KQL, ECS.)
- [[Elastic Stack - KQL]] (Kibana Query Language — queries de hunting.)
- [[Splunk SPL]] (Search Processing Language — hunting en el SIEM más extendido.)


## 📋 Fuentes de Logs
  De dónde sale la telemetría que se analiza.

- [[Windows Event Logs]] (Canales, Event IDs críticos, XML queries — finding evil.)


## 🛠️ Detection Engineering
  Diseñar y mantener las reglas de detección.

- [[Casos de Uso de SIEM]] (Ciclo de vida del use case, ejemplos con mapeo MITRE.)
- [[Sigma]] (Reglas de detección agnósticas → convertir a cualquier SIEM.)
- [[YARA]] (Reglas para identificar malware en archivos, procesos y memoria.)


## 🌐 Network Detection
  Detección sobre tráfico de red.

- [[Suricata]] (NIDS/NIPS: reglas de firma sobre tráfico vivo o PCAP.)


---
