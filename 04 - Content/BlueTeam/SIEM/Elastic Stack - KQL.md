---
aliases:
  - KQL
  - Kibana Query Language
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
kind: SubCheatSheet
linked:
  - "[[Elastic Stack]]"
---
# Elastic Stack - KQL

> **KQL** (Kibana Query Language): pares `campo:valor` para buscar/analizar en Kibana. Más intuitivo que el Query DSL nativo de Elasticsearch.

---

## Sintaxis Esencial

| **Operación** | **Query** | **Qué hace** |
|:---|:---|:---|
| Campo exacto | `event.code:4625` | Eventos con código 4625 (login fallido). |
| Texto libre | `"svc-sql1"` | La cadena en cualquier campo indexado. |
| AND | `event.code:4625 AND winlog.event_data.SubStatus:0xC0000072` | Login fallido a cuenta **deshabilitada**. |
| OR | `event.code:4624 OR event.code:4625` | Logins exitosos o fallidos. |
| NOT | `event.code:4625 AND NOT user.name:"admin"` | Fallidos excluyendo a admin. |
| Comparación | `event.code:4625 AND @timestamp >= "2023-03-03T00:00:00.000Z"` | Filtra por rango de fechas (`:>` `:>=` `:<` `:<=` `:!`). |
| Wildcard | `event.code:4625 AND user.name:admin*` | Usuarios que empiezan con "admin". |
^kql-sintaxis

## Identificar campos disponibles

| **Enfoque** | **Cómo** |
|:---|:---|
| **Discover + texto libre** | Buscar `"4625"` en Discover → ver campos devueltos (`event.code` ECS, `winlog.event_id` Winlogbeat). |
| **Documentación Elastic** | Consultar **ECS**, campos de Winlogbeat/Filebeat antes de explorar. |
^kql-campos

> Preferir campos **ECS** (`event.code`) sobre los específicos de beat (`winlog.event_id`): mismas queries funcionan across fuentes. Ver [[Elastic Stack#^elastic-ecs|ECS]].
^kql-ecs-tip
