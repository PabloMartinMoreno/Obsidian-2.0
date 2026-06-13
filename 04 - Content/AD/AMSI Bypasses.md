---
aliases:
  - AMSI Bypass
  - AMSI Patching
  - AMSI Evasion
  - Defender Bypass
tags:
  - technique/defense-evasion
  - technique/execution
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Payload Engineering]]"
kind: CheatSheet
linked:
  - "[[AMSI Bypasses - Reflection]]"
  - "[[AMSI Bypasses - Memory Patch]]"
  - "[[AMSI Bypasses - Evasión Alternativa]]"
  - "[[AD - Security Controls Enumeration]]"
---
# AMSI Bypasses

**AMSI (Antimalware Scan Interface)** es la API de Microsoft que intercepta contenido antes de ejecutarlo (PowerShell, VBA, JScript, .NET assemblies, WMI). El AV/EDR (Defender, CrowdStrike, Elastic…) lo consume vía `AmsiScanBuffer`. Bypassear = **desactivar o corromper la llamada** desde el proceso actual — `amsi.dll` vive in-process, manipulable desde userland sin privilegios especiales. **Afecta solo el proceso actual** (no persistente ni global).

---

## Cheatsheet

### 1. Reflection (amsiInitFailed)

````tabs
tab: **amsiInitFailed + ofuscación**
![[AMSI Bypasses - Reflection#^amsi-reflection]]
````

### 2. Memory Patch

````tabs
tab: **AmsiScanBuffer Patch**
![[AMSI Bypasses - Memory Patch#^amsi-patch]]
````

### 3. Evasión Alternativa

````tabs
tab: **Evitar AMSI por Completo**
![[AMSI Bypasses - Evasión Alternativa#^amsi-altevasion]]

tab: **CLM (Constrained Language)**
![[AMSI Bypasses - Evasión Alternativa#^amsi-clm]]
````

---

## Overview

| Bypass | Cuándo |
|:---|:---|
| **amsiInitFailed** (reflection) | Defender sin EDR moderno; ofuscar el classic |
| **AmsiScanBuffer patch** | EDR con detección reflection; más robusto |
| **PowerShell v2** | Legacy disponible; PSv2 no tiene AMSI |
| **DLL hijack `amsi.dll`** | Admin local |
| **Binary loader (Invoke-Binary/donut)** | Saltar PowerShell entero |

**Estrategia:** primero enumerar qué AV/EDR hay ([[AD - Security Controls Enumeration]]). Defender solo → reflection ofuscado alcanza. EDR moderno → memory patch o evitar PowerShell (binario + reflective loader).

> [!warning] AMSI ≠ logging
> **Script Block Logging (4104)** captura el script **antes** del scan de AMSI. Bypassear AMSI ejecuta el payload pero **no evita** que quede logueado. Para evasión completa hay que atacar también ETW/logging o evitar PowerShell.

---

## Recursos

- [rastamouse — Memory patching AMSI](https://rastamouse.me/memory-patching-amsi-bypass/)
- [amsi.fail](https://amsi.fail/) — generador de one-liners frescos.
- [S3cur3Th1sSh1t/Amsi-Bypass-Powershell](https://github.com/S3cur3Th1sSh1t/Amsi-Bypass-Powershell)
- [Invoke-Obfuscation](https://github.com/danielbohannon/Invoke-Obfuscation)
