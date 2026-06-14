---
aliases:
  - ATT&CK
  - MITRE ATT&CK Framework
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
kind: CheatSheet
linked:
  - "[[MITRE ATT&CK - Marco]]"
  - "[[MITRE ATT&CK - Pyramid of Pain]]"
  - "[[MITRE ATT&CK - Casos de Uso]]"
  - "[[Cyber Kill Chain]]"
---
# MITRE ATT&CK

> [!info] Overview
> Base de conocimiento de **TTPs** (Tácticas, Técnicas y Procedimientos) adversarios observados en el mundo real. A diferencia de la [[Cyber Kill Chain]] (lineal, 7 etapas de alto nivel), ATT&CK es una **matriz granular** que mapea cada comportamiento concreto del atacante a un objetivo. El SOC lo usa para detección basada en comportamiento, gap analysis, medición de madurez y threat intel.
>
> **Por qué importa:** detectar TTPs (cima de la [[MITRE ATT&CK - Pyramid of Pain|Pyramid of Pain]]) obliga al adversario a rediseñar el ataque — mucho más costoso que rotar una IP o un hash.

---

## Cheatsheet

### 1. El Marco

````tabs
tab: **Tácticas / Técnicas / Sub-técnicas**
![[MITRE ATT&CK - Marco#^attack-niveles]]

tab: **Ejemplos de Técnicas**
![[MITRE ATT&CK - Marco#^attack-tecnicas]]

tab: **Las 14 Tácticas**
![[MITRE ATT&CK - Marco#^attack-tacticas-lista]]
````

### 2. Pyramid of Pain

````tabs
tab: **Niveles**
![[MITRE ATT&CK - Pyramid of Pain#^pop-niveles]]

tab: **Implicancia para Detección**
![[MITRE ATT&CK - Pyramid of Pain#^pop-deteccion]]
````

### 3. Casos de Uso en SecOps

````tabs
tab: **Aplicaciones**
![[MITRE ATT&CK - Casos de Uso#^attack-usecases]]

tab: **Mapeo en TheHive**
![[MITRE ATT&CK - Casos de Uso#^attack-thehive]]

tab: **Ejemplo de Incidente**
![[MITRE ATT&CK - Casos de Uso#^attack-ejemplo-mapeo]]
````

---

## Relación con la Cyber Kill Chain

| **Cyber Kill Chain** | **MITRE ATT&CK** |
|:---|:---|
| 7 etapas lineales de alto nivel | 14 tácticas + cientos de técnicas, no lineal |
| "¿Qué tan lejos llegó el atacante?" | "¿Exactamente *qué* hizo y *cómo*?" |
| Visión estratégica del ataque | Detección, atribución y mapeo táctico |

> Se usan juntas: la Kill Chain ubica la fase del compromiso, ATT&CK detalla las técnicas concretas dentro de cada fase. Ver [[Cyber Kill Chain]].
