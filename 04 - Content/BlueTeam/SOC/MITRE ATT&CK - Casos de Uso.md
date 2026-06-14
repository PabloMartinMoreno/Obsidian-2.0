---
aliases:
  - ATT&CK Use Cases
  - ATT&CK en SecOps
tags:
  - topic/threat-intel
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
  - "[[Identificación]]"
tertiary categories:
  - "[[SOC Identificación]]"
kind: SubCheatSheet
linked:
  - "[[MITRE ATT&CK]]"
---
# MITRE ATT&CK - Casos de Uso

> Para qué usa un SOC el marco más allá de catalogar TTPs.

---

## Aplicaciones en Operaciones de Seguridad

| **Caso de uso** | **Qué aporta** |
|:---|:---|
| **Detección y Respuesta** | Diseñar reglas de detección basadas en TTPs reales de adversarios. |
| **Gap Analysis** | Identificar fortalezas/debilidades de la postura → priorizar inversiones en controles. |
| **Evaluación de Madurez del SOC** | Medir capacidad de detectar/responder/mitigar cada TTP. |
| **Threat Intelligence** | Lenguaje unificado para describir acciones del adversario; mejora colaboración. |
| **Enriquecimiento de CTI** | Contexto sobre TTPs, objetivos e IOCs → decisiones más informadas. |
| **Behavioral Analytics** | Mapear TTPs a comportamientos de usuario/sistema → detectar anomalías. |
| **Red Teaming / Pentest** | Replicar técnicas genuinas para evaluar defensas. |
| **Capacitación** | Recurso estructurado para entrenar analistas en TTPs actuales. |
^attack-usecases

## Mapeo en Plataformas de Casos (TheHive)

| **Acción** | **Detalle** |
|:---|:---|
| Importar TTPs de ATT&CK a las alertas | Asocia patrones de ataque a cada alerta/caso. |
| Vincular múltiples alertas en un caso | Centraliza la gestión del incidente. |
| Mapear evento → técnica/táctica | Comprende la intención del adversario y los próximos pasos probables. |
^attack-thehive

### Ejemplo de mapeo de un incidente

| **Táctica** | **Técnica** | **ID** | **Observado** |
|:---|:---|:---|:---|
| Initial Access | Exploit Public-Facing App | `T1190` | CVE de Confluence explotado |
| Execution | Scripting: PowerShell | `T1059.001` | PowerShell para descargar payload |
| Persistence | Windows Service | `T1543.003` | Servicio para persistencia |
| Credential Access | LSASS Memory | `T1003.001` | Credenciales extraídas |
| Lateral Movement | RDP | `T1021.001` | Movimiento lateral vía RDP |
| Impact | Data Encrypted for Impact | `T1486` | Ransomware LockBit |
^attack-ejemplo-mapeo
