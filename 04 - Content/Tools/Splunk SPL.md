---
aliases:
  - SPL
  - Search Processing Language
  - Splunk
tags:
  - tool/splunk
  - topic/siem
  - topic/detection
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: CheatSheet
linked:
  - "[[Sigma]]"
  - "[[Elastic Stack - KQL]]"
  - "[[Threat Hunting]]"
---
# Splunk SPL

> [!abstract] TL;DR
> **SPL** (Search Processing Language): el lenguaje de Splunk, el SIEM más extendido. Pipeline estilo Unix (`|`): buscás eventos y los encadenás por transformaciones. Equivalente Splunk de [[Elastic Stack - KQL|KQL]]. Las reglas [[Sigma]] convierten a SPL con `sigma convert -t splunk`.

---

## Búsqueda y Filtrado

| **Query** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `index=windows EventCode=4625` | Logins fallidos | Fuerza bruta |
| `index=windows EventCode=4625 \| stats count by Account_Name` | Conteo de fallos por cuenta | Identificar la cuenta atacada |
| `index=windows EventCode=4625 \| stats count by src_ip \| where count > 10` | IPs con >10 fallos | Threshold de brute force |
| `index=* "powershell" "-enc"` | PowerShell codificado | Hunting de payloads ofuscados |
| `... \| rex field=_raw "User: (?<user>\w+)"` | Extrae campo con regex | Parsear logs no estructurados |
^spl-busqueda

## Transformaciones (Hunting)

| **Query** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `... \| stats count by host, user` | Agregación por campos | Resumir actividad |
| `... \| timechart span=1h count by EventCode` | Serie temporal | Detectar picos/beacons |
| `... \| top limit=20 process_name` | Top 20 valores | Procesos más frecuentes |
| `... \| rare process_name` | Valores raros | **Long tail** = lo anómalo |
| `... \| eventstats avg(bytes) as avg \| where bytes > avg*3` | Outliers estadísticos | Exfil / anomalías de volumen |
| `... \| transaction src_ip maxpause=5m` | Agrupa eventos en sesiones | Reconstruir actividad de una IP |
^spl-transform

## Detección de Patrones

| **Query** | **Qué detecta** |
|:---|:---|
| `EventCode=4688 \| stats dc(Process_Name) by Parent_Process \| where dc>20` | Proceso padre lanzando muchos hijos distintos (LOLBin abuse) |
| `EventCode=4624 Logon_Type=3 \| stats count by Account_Name, dest \| where count>50` | Lateral movement (logins de red masivos) |
| `\| tstats count where index=* by _time span=1m \| anomalydetection` | Anomalías de volumen | 
^spl-deteccion

> SPL invertido vs KQL: Splunk usa `EventCode`, Elastic usa `event.code`. Las reglas [[Sigma]] abstraen esa diferencia. Para hunting estructurado, mapear las búsquedas a [[MITRE ATT&CK]] (ver [[Threat Hunting]]).
^spl-vs-kql
