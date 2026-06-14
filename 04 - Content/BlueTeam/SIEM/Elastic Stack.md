---
aliases:
  - ELK Stack
  - Introducción al Elastic Stack
  - Elasticsearch
tags:
  - topic/siem
  - tool/elasticsearch
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: CheatSheet
linked:
  - "[[Elastic Stack - KQL]]"
  - "[[Fundamentos de SIEM]]"
  - "[[Casos de Uso de SIEM]]"
---
# Elastic Stack

> [!info] Overview
> **Elastic Stack** (ex ELK): suite open-source para búsqueda y visualización de logs en tiempo real. Usado como **SIEM** para recolectar, almacenar, analizar y visualizar datos de seguridad. Como analista SOC, la interfaz principal es **Kibana**.

![[Introducción al Elastic Stack-1.png]]

---

## Componentes

| **Componente** | **Rol** |
|:---|:---|
| **Elasticsearch** | Motor de búsqueda distribuido JSON con APIs RESTful. Indexa, almacena y consulta. Núcleo del stack. |
| **Logstash** | Recolecta, transforma y transporta logs. 3 fases: **Input** (ingesta) → **Filter** (transforma/enriquece) → **Output** (envía a Elasticsearch). |
| **Kibana** | Visualización: dashboards, gráficos, queries sobre documentos de Elasticsearch. |
| **Beats** | Data shippers livianos single-purpose (Filebeat, Metricbeat, Winlogbeat) instalados en máquinas remotas. |

## Arquitectura / Flujos de Datos

| **Flujo** | **Cuándo** |
|:---|:---|
| `Beats → Logstash → Elasticsearch → Kibana` | Procesamiento/transformación compleja. |
| `Beats → Elasticsearch → Kibana` | Ingestión directa y rápida. |

En entornos intensivos se suma **Kafka/RabbitMQ/Redis** (buffering, resiliencia) y **nginx** (seguridad).

![[Introducción al Elastic Stack-5.png]]

---

## Cheatsheet

### KQL — Kibana Query Language

````tabs
tab: **Sintaxis Esencial**
![[Elastic Stack - KQL#^kql-sintaxis]]

tab: **Identificar Campos**
![[Elastic Stack - KQL#^kql-campos]]
````

---

## Elastic Common Schema (ECS)

Vocabulario compartido y extensible para eventos/logs en todo el stack. Ventajas:

- **Vista unificada** across fuentes (Windows, red, nube) con los mismos nombres de campo.
- **Queries más simples**: no recordar nombres por fuente.
- **Correlación mejorada**: ej. una IP en logs de firewall vs endpoint.
- Interoperabilidad con Elastic Security y Machine Learning.
^elastic-ecs
