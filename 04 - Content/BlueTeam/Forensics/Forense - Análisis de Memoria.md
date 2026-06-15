---
aliases:
  - Memory Forensics
  - Volatility
  - Volatility 3
tags:
  - topic/forensics
  - tool/volatility
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
  - "[[vol]]"
---
# Forense - Análisis de Memoria

> Análisis post-mortem del dump de RAM con **Volatility 3**. Orden lógico para reconstruir la escena: perfil → procesos → red → comandos → inyección → archivos. Referencia completa de plugins: [[vol|Volatility]].

---

## Volatility 3 — Reconstrucción

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `python3 vol.py -f dump.raw windows.info` | Build, OS, arquitectura de la imagen | Siempre primero — identificar el perfil |
| `python3 vol.py -f dump.raw windows.pstree` | Árbol de procesos (padre→hijo) | Ver relaciones anómalas (Office→PowerShell) |
| `python3 vol.py -f dump.raw windows.psscan` | Procesos vía pool scan (incluye ocultos) | Si está en `psscan` pero no en `pslist` = rootkit/DKOM |
| `python3 vol.py -f dump.raw windows.netscan` | Conexiones de red al momento del dump | Detectar C2 |
| `python3 vol.py -f dump.raw windows.cmdline` | Argumentos de línea de comandos por proceso | Intención del atacante |
| `python3 vol.py -f dump.raw windows.consoles` | Historial de consola (cmd/PowerShell) | Comandos tipeados |
| `python3 vol.py -f dump.raw windows.malfind` | Código inyectado (hollowing, DLL injection) | Hallar payloads en memoria |
^mem-volatility

## Extracción de Archivos

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `python3 vol.py -f dump.raw windows.filescan \| grep "sospechoso"` | Dirección virtual del archivo en memoria | Localizar un archivo concreto |
| `python3 vol.py -f dump.raw windows.dumpfiles --virtaddr <HEX>` | Vuelca el archivo a disco | Extraer para hash/VirusTotal |
^mem-dumpfiles
