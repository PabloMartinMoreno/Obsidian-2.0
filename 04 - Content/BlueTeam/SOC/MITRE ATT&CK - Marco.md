---
aliases:
  - Tácticas Técnicas Sub-técnicas
  - ATT&CK Matrix
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
# MITRE ATT&CK - Marco

> **MITRE ATT&CK** (Adversarial Tactics, Techniques & Common Knowledge): base de conocimiento de TTPs adversarios observados en el mundo real. Matrices por contexto (Enterprise, Mobile, Cloud, ICS). Columnas = tácticas (objetivos), celdas = técnicas.

![[Cyber Kill Chain y MITRE ATT&CK-3.png]]

---

## Tácticas / Técnicas / Sub-técnicas

| **Nivel** | **Qué es** | **Ejemplo** |
|:---|:---|:---|
| **Táctica** | El *objetivo* del adversario en una etapa (el "por qué") | Initial Access, Persistence, Privilege Escalation |
| **Técnica** | El *método* para lograr la táctica (el "cómo") | `T1105` Ingress Tool Transfer, `T1021` Remote Services |
| **Sub-técnica** | Implementación concreta de una técnica | `T1003.001` LSASS Memory, `T1021.002` SMB/Admin Shares |
^attack-niveles

> La granularidad permite detección/atribución precisa: "Detectamos `T1003.001` — dump de LSASS" en vez de solo `T1003`.

## Ejemplos de Técnicas

| **ID** | **Técnica** | **Detalle** |
|:---|:---|:---|
| `T1105` | Ingress Tool Transfer | Descarga de herramientas (`wget`, `curl`, LOLBins) |
| `T1021` | Remote Services | Movimiento lateral vía SSH/RDP/SMB |
| `T1003.001` | OS Credentials: LSASS Memory | Dump de credenciales de LSASS |
| `T1021.002` | Remote Services: SMB/Admin Shares | Interacción con shares usando creds válidas |
| `T1059.001` | Command & Scripting: PowerShell | Ejecución de payloads vía PowerShell |
| `T1486` | Data Encrypted for Impact | Ransomware |
^attack-tecnicas

## Las 14 Tácticas (Enterprise)

`Reconnaissance` → `Resource Development` → `Initial Access` → `Execution` → `Persistence` → `Privilege Escalation` → `Defense Evasion` → `Credential Access` → `Discovery` → `Lateral Movement` → `Collection` → `Command and Control` → `Exfiltration` → `Impact`
^attack-tacticas-lista
