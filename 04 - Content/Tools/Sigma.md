---
aliases:
  - Sigma Rules
  - sigma-cli
tags:
  - tool/sigma
  - topic/detection
  - topic/siem
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: CheatSheet
linked:
  - "[[chainsaw]]"
  - "[[Casos de Uso de SIEM]]"
  - "[[Elastic Stack - KQL]]"
---
# Sigma

> [!abstract] TL;DR
> Formato **genérico y agnóstico** para reglas de detección sobre logs. Una regla en YAML se **convierte** al lenguaje de cualquier SIEM (Splunk SPL, Elastic KQL/EQL, Sentinel KQL, QRadar AQL...). El estándar de **detection engineering**: escribís una vez, desplegás en cualquier backend.

---

## Anatomía de una Regla

```yaml
title: Mimikatz Command Line
id: a642964e-bead-4bed-8910-1bb4d63e3b4d
status: stable
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        CommandLine|contains:
            - 'sekurlsa::'
            - 'lsadump::'
            - 'privilege::debug'
    condition: selection
level: high
tags:
    - attack.credential_access
    - attack.t1003.001
```

| **Campo** | **Qué define** |
|:---|:---|
| `logsource` | Qué telemetría matchea (`category`/`product`/`service`). |
| `detection` | Los `selection` (criterios) + `condition` (lógica booleana). |
| Modificadores | `\|contains`, `\|startswith`, `\|endswith`, `\|re` (regex), `\|all`. |
| `level` | `informational` → `critical`. |
| `tags` | Mapeo a [[MITRE ATT&CK]] (`attack.tXXXX`). |
^sigma-anatomia

## Conversión (sigma-cli + pySigma)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `pip install sigma-cli` | Instala la CLI | Setup |
| `sigma plugin list` | Backends disponibles (splunk, elasticsearch, ...) | Ver targets soportados |
| `sigma plugin install splunk` | Instala backend Splunk | Antes de convertir a SPL |
| `sigma convert -t splunk rule.yml` | Regla → query SPL | Desplegar en Splunk |
| `sigma convert -t elasticsearch -f dsl_lucene rule.yml` | Regla → Elastic | Desplegar en ELK |
| `sigma convert -t splunk -p sysmon ./rules/` | Convierte un dir con pipeline Sysmon | Bulk + field mapping |
| `sigma convert -t elasticsearch -f siem_rule rule.yml` | Regla de detección Kibana lista | Importar a Elastic Security |
^sigma-convert

## Pipelines y Backends

| **Concepto** | **Detalle** |
|:---|:---|
| **Backend** (`-t`) | El SIEM destino: `splunk`, `elasticsearch`, `microsoft365defender`, `qradar`... |
| **Pipeline** (`-p`) | Mapea campos genéricos a los del entorno: `sysmon`, `windows-audit`, `ecs_windows`. |
| **Format** (`-f`) | Forma de salida: `default`, `savedsearch` (Splunk), `dsl_lucene`, `siem_rule` (Elastic). |
^sigma-pipelines

> **Flujo típico:** regla Sigma → `sigma convert` con pipeline del entorno → deploy en SIEM. Para hunting offline en EVTX sin SIEM, [[chainsaw]] consume reglas Sigma directamente. Las reglas comunitarias están en el repo **SigmaHQ**.
^sigma-flujo
