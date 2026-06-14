---
aliases:
  - Forensic Acquisition
  - Live Response
tags:
  - topic/forensics
  - asset/endpoint
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[Digital Forensics]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[Digital Forensics Respuesta]]"
kind: SubCheatSheet
linked:
  - "[[Metodología Forense]]"
---
# Forense - Adquisición

> Extraer evidencia respetando el **orden de volatilidad** (RAM primero). Ejecutar desde USB externo con binarios estáticos, mínima interacción. **Nunca trabajar sobre el original.**

---

## Dump de Memoria (RAM)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `.\winpmem_mini_x64.exe memoria_dump.raw` | Imagen completa de RAM (Windows) | Equipo encendido — antes de nada |
| `./avml memoria_dump.lime` | Dump de RAM (Linux, Microsoft AVML, más seguro que `dd`) | Equipo Linux encendido |
^acq-ram

## Triage Rápido (Smash & Grab)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `netstat -ano > conexiones.txt` | Conexiones activas + PID asociado | Identificar C2/exfil en vivo |
| `tasklist /v > procesos.txt` | Procesos en ejecución | Snapshot del estado |
| `ipconfig /displaydns > dns_cache.txt` | Caché DNS (a dónde navegó) | Rastrear dominios contactados |
| `route print > tabla_rutas.txt` | Tabla de rutas | Pivoteo/red |
^acq-triage

## Clonado de Disco (Bit-a-Bit)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `sudo dc3dd if=/dev/sda of=/media/usb/imagen.img hash=sha256 log=clonado.log` | Imagen forense + hash al vuelo (incluye espacio no asignado) | Equipo apagado, booteado con Linux Live + write blocker |
^acq-clonado

> **Integridad:** `Hash(Original) == Hash(Imagen)` → evidencia válida. Si no coinciden, está contaminada. `dc3dd` > `dd` porque hashea durante el clonado.
^acq-integridad
