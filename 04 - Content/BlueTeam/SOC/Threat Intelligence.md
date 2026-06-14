---
aliases:
  - CTI
  - Cyber Threat Intelligence
  - Inteligencia de Amenazas
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
  - "[[Threat Intelligence - Niveles]]"
  - "[[Threat Intelligence - Ciclo de Vida]]"
  - "[[Threat Intelligence - IOCs e IOAs]]"
  - "[[Threat Intelligence - TLP]]"
  - "[[Diamond Model]]"
  - "[[MITRE ATT&CK]]"
---
# Threat Intelligence

> [!info] Overview
> **CTI** (Cyber Threat Intelligence): conocimiento accionable sobre adversarios — quiénes son, qué buscan y cómo operan — para anticipar, detectar y responder mejor. Convierte datos crudos en decisiones vía el [[Threat Intelligence - Ciclo de Vida|ciclo de inteligencia]]. Alimenta detección ([[Tipos de Detección]]), hunting ([[Threat Hunting]]) y triaje ([[Proceso de Triaje]]).

---

## Cheatsheet

### 1. Niveles de CTI

````tabs
tab: **Los 3 Niveles**
![[Threat Intelligence - Niveles#^cti-niveles]]

tab: **Diferencias**
![[Threat Intelligence - Niveles#^cti-diferencias]]

tab: **Volatilidad**
![[Threat Intelligence - Niveles#^cti-volatilidad]]
````

### 2. Ciclo de Inteligencia

````tabs
tab: **Las 6 Fases**
![[Threat Intelligence - Ciclo de Vida#^cti-ciclo]]

tab: **Dato / Info / Inteligencia**
![[Threat Intelligence - Ciclo de Vida#^cti-dato-info-intel]]
````

### 3. Indicadores (IOC / IOA)

````tabs
tab: **Tipos de IOC**
![[Threat Intelligence - IOCs e IOAs#^ioc-tipos]]

tab: **IOC vs IOA**
![[Threat Intelligence - IOCs e IOAs#^ioc-vs-ioa]]

tab: **Estándares (STIX/TAXII)**
![[Threat Intelligence - IOCs e IOAs#^ioc-estandares]]
````

### 4. Traffic Light Protocol

````tabs
tab: **Niveles TLP**
![[Threat Intelligence - TLP#^tlp-niveles]]
````

---

## Marcos relacionados

- [[Diamond Model]] — relaciona Adversary/Capability/Infrastructure/Victim de un evento.
- [[MITRE ATT&CK]] — cataloga las TTPs (capability) que describe la CTI operational.
