---
aliases:
  - VQL
tags:
  - tool/velociraptor
  - topic/forensics
  - topic/detection
  - asset/endpoint
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[Digital Forensics]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[Digital Forensics Respuesta]]"
kind: CheatSheet
linked:
  - "[[Metodología Forense]]"
  - "[[Threat Hunting]]"
  - "[[Get-WinEvent]]"
---
# Velociraptor

> [!abstract] TL;DR
> Plataforma open-source de **DFIR y hunting a escala**. Despliega un agente en endpoints y los consulta con **VQL** (Velociraptor Query Language) — como un SQL para artefactos forenses. Hunting de IOCs/TTPs en miles de hosts a la vez. El "EDR del Blue Team open source".

---

## Despliegue

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `velociraptor config generate -i` | Wizard de configuración server/client | Setup inicial |
| `velociraptor --config server.yaml frontend` | Levanta el servidor + GUI | Operación central |
| `velociraptor --config client.yaml client` | Conecta un endpoint | Enrolar hosts |
| `velociraptor gui` | Modo standalone (sin server) sobre el host local | Triage de un solo equipo |
^velo-deploy

## Recolección Offline (sin server)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `velociraptor artifacts collect Windows.KapeFiles.Targets --args Device=C:` | Colecta artefactos clave a un ZIP | Triage rápido de 1 host comprometido |
| `velociraptor artifacts collect Windows.System.Pslist` | Lista de procesos | Snapshot puntual |
| `velociraptor -v query "SELECT * FROM pslist()"` | VQL ad-hoc desde CLI | Consulta directa |
^velo-offline

## VQL — Hunting

| **Query** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `SELECT Name, Pid, CommandLine FROM pslist()` | Procesos + cmdline | Buscar ejecución sospechosa |
| `SELECT * FROM glob(globs='C:/Users/**/*.exe')` | Ejecutables en perfiles | Hunting de droppers |
| `SELECT * FROM yara(rules=R, files=F)` | Match de [[YARA]] en archivos | Detección de malware |
| `SELECT * FROM parse_evtx(filename=F) WHERE EventID=4624` | Eventos de logon parseados | Análisis de logins a escala |
^velo-vql

> **Hunt:** una VQL se despliega como *hunt* contra todos los endpoints enrolados → resultados centralizados. Es el equivalente defensivo a barrer toda la red buscando un TTP. Complementa [[Threat Hunting]] con ejecución real.
^velo-hunt
