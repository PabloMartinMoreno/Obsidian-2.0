---
aliases:
  - Get-WinEvent
  - wevtutil
  - PowerShell DFIR
tags:
  - tool/powershell
  - env/windows
  - topic/forensics
  - topic/detection
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[Digital Forensics]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[Digital Forensics Respuesta]]"
kind: CheatSheet
linked:
  - "[[Windows Event Logs]]"
  - "[[chainsaw]]"
  - "[[Metodología Forense]]"
---
# Get-WinEvent

> [!abstract] TL;DR
> Análisis de **Event Logs de Windows** nativo, sin instalar nada. `Get-WinEvent` (PowerShell, soporta `.evtx` y XPath/hashtable filtering) y `wevtutil` (CLI). El primer recurso en cualquier endpoint comprometido. IDs de referencia en [[Windows Event Logs]].

---

## Get-WinEvent (PowerShell)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-WinEvent -ListLog * \| ? RecordCount -gt 0` | Logs con eventos + conteo | Inventario inicial |
| `Get-WinEvent -LogName Security -MaxEvents 50` | Últimos 50 eventos de Security | Vista rápida |
| `Get-WinEvent -Path .\Security.evtx` | Leer un `.evtx` exportado | Análisis offline en estación forense |
| `Get-WinEvent -FilterHashtable @{LogName='Security';Id=4625}` | Solo logins fallidos | Hunting de fuerza bruta (filtro eficiente) |
| `Get-WinEvent -FilterHashtable @{LogName='Security';Id=4624;StartTime=(Get-Date).AddDays(-1)}` | Logins exitosos últimas 24h | Recortar ventana temporal |
| `... @{LogName='System';Id=7045}` | Servicios instalados | Persistencia de malware |
| `Get-WinEvent -FilterXPath "*[System[EventID=4688]]" -LogName Security` | Process creation vía XPath | Filtros complejos |
^gwe-getwinevent

## Parsing del mensaje

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `... \| Select TimeCreated, Id, @{n='Msg';e={$_.Message}}` | Tabla legible | Triage rápido |
| `($evt).ToXml()` | XML completo del evento | Extraer campos no mostrados |
| `... \| % { [xml]$_.ToXml() } \| % { $_.Event.EventData.Data }` | Campos `EventData` parseados | Sacar usuario/IP/proceso de cada evento |
| `Get-WinEvent -FilterHashtable @{...} \| Group-Object Id \| Sort Count -Desc` | Conteo por Event ID | Ver qué predomina |
^gwe-parsing

## wevtutil (CLI clásico)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `wevtutil el` | Lista todos los canales | Enumerar |
| `wevtutil qe Security /c:20 /rd:true /f:text` | Últimos 20 de Security (texto) | Vista CLI sin PowerShell |
| `wevtutil qe Security /q:"*[System[(EventID=1102)]]" /f:text` | Eventos de **log limpiado** (1102) | Detectar anti-forense |
| `wevtutil epl Security C:\out\sec.evtx` | Exportar canal a `.evtx` | Recolección de evidencia |
| `wevtutil gli Security` | Info del log (tamaño, último write) | Estado del logging |
^gwe-wevtutil

> Para triage masivo de muchos `.evtx` con reglas, usar [[chainsaw]] (Sigma sobre EVTX). `Get-WinEvent` brilla para análisis interactivo y dirigido en un host vivo.
^gwe-vs-chainsaw
