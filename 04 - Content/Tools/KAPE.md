---
aliases:
  - Kroll Artifact Parser and Extractor
tags:
  - tool/kape
  - env/windows
  - topic/forensics
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
  - "[[Velociraptor]]"
---
# KAPE

> [!abstract] TL;DR
> **Kroll Artifact Parser and Extractor**: colecta y parsea artefactos forenses de Windows en minutos. Dos motores: **Targets** (qué recolectar — copia archivos bloqueados como `$MFT`, registry, EVTX) y **Modules** (cómo procesar — corre las Eric Zimmerman Tools sobre lo colectado). El estándar de triage forense rápido.

---

## Targets — Recolección

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `kape.exe --tsource C: --target !BasicCollection --tdest E:\out` | Artefactos esenciales a `E:\out` | Triage rápido de un host |
| `kape.exe --tsource C: --target KapeTriage --tdest E:\out --vhdx host01` | Triage completo a un VHDX | Evidencia consolidada en contenedor |
| `kape.exe --tsource C: --target EventLogs --tdest E:\out` | Solo los `.evtx` (incluso bloqueados) | Análisis de logs offline |
| `kape.exe --tsource C: --target RegistryHives --tdest E:\out` | SAM/SYSTEM/SOFTWARE/NTUSER | Análisis de registro |
^kape-targets

## Modules — Procesamiento

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `kape.exe --msource E:\out --module !EZParser --mdest E:\parsed` | Parsea todo con EZ Tools → CSV | Convertir artefactos crudos a analizables |
| `kape.exe ... --module EvtxECmd` | EVTX → CSV/JSON estructurado | Timeline de eventos |
| `kape.exe ... --module PECmd` | Prefetch parseado | Qué se ejecutó |
| `kape.exe ... --module RECmd_Kroll` | Registry parseado (batch) | Persistencia, USB, MRU |
^kape-modules

## Todo en uno (collect + process)

| **Comando** | **Qué obtenés** |
|:---|:---|
| `kape.exe --tsource C: --target KapeTriage --tdest E:\raw --module !EZParser --mdest E:\parsed` | Colecta + parsea en un solo paso → CSVs listos para revisar |
^kape-allinone

> KAPE recolecta artefactos *en vivo* (copia archivos bloqueados por el OS). Para colección remota a escala, [[Velociraptor]] (`Windows.KapeFiles.Targets` usa los mismos targets). Los CSVs resultantes se revisan con Timeline Explorer o se cargan al SIEM.
^kape-vs-velo
