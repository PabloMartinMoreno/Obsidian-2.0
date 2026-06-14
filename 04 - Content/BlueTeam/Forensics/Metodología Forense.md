---
aliases:
  - Forensic Methodology
  - Orden de Volatilidad
  - DFIR
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
kind: CheatSheet
linked:
  - "[[Forense - Adquisición]]"
  - "[[Forense - Análisis de Memoria]]"
  - "[[Forense - Análisis de Disco]]"
  - "[[Gestión de Incidentes]]"
---
# Metodología Forense

> [!info] Overview
> Adquirir y analizar evidencia digital de forma **defendible** (admisible en tribunal). Estándar **RFC 3227**. Regla de oro: recolectar de lo **más volátil a lo menos volátil**. Apoya la fase Respond del IR ([[Gestión de Incidentes]]).

---

## Orden de Volatilidad (RFC 3227)

Si la máquina está encendida, este orden estricto **antes de cualquier otra acción**:

| **#** | **Fuente** | **Nota** |
|:---:|:---|:---|
| 1 | **RAM** 🔥 | Passwords en claro, claves, conexiones, procesos inyectados. Se pierde al apagar. |
| 2 | **Estado de red / caché** | ARP, routing, conexiones activas. |
| 3 | **Procesos en ejecución** | Estado actual. |
| 4 | **Disco (HDD/SSD)** | Filesystem, logs, documentos. |
| 5 | **Medios externos** | Backups, DVDs, logs remotos. |

## Encendido vs Apagado

| **Caso** | **Regla** | **Acción** |
|:---|:---|:---|
| **ENCENDIDO** (Live) | **NO apagar** (se pierde RAM) | Dumpear RAM desde USB (`DumpIt`/`WinPMEM`/`FTK Imager`); mínima interacción |
| **APAGADO** (Dead) | **NO encender** (bootear altera metadatos/logs/registro) | Extraer disco + **Write Blocker** → estación forense |

## Adquisición de Imagen

- Clonación **bit-a-bit** (incluye espacio no asignado y borrado) — no es copy-paste.
- **Hashing** MD5/SHA256 del original y la imagen: si coinciden → válida.

## Herramientas Clave

| **Dominio** | **Herramientas** |
|:---|:---|
| RAM | Volatility 3 (análisis), FTK Imager / WinPMEM / AVML (adquisición) |
| Disco | Autopsy (suite), Eric Zimmerman Tools (artefactos), Guymager/dc3dd (imaging) |

---

## Cheatsheet

### 1. Adquisición (Live Response)

````tabs
tab: **Dump de RAM**
![[Forense - Adquisición#^acq-ram]]

tab: **Triage Rápido**
![[Forense - Adquisición#^acq-triage]]

tab: **Clonado de Disco**
![[Forense - Adquisición#^acq-clonado]]
````

### 2. Análisis de Memoria (Volatility 3)

````tabs
tab: **Reconstrucción**
![[Forense - Análisis de Memoria#^mem-volatility]]

tab: **Extracción de Archivos**
![[Forense - Análisis de Memoria#^mem-dumpfiles]]
````

### 3. Análisis de Disco

````tabs
tab: **Búsqueda y Montaje**
![[Forense - Análisis de Disco#^disk-busqueda]]

tab: **Timeline**
![[Forense - Análisis de Disco#^disk-timeline]]

tab: **Artefactos Windows**
![[Forense - Análisis de Disco#^disk-artefactos]]
````
