---
aliases:
  - IOCs
  - Indicators of Compromise
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
  - "[[Threat Intelligence]]"
  - "[[Tipos de Detección]]"
---
# Threat Intelligence - IOCs e IOAs

> Los **indicadores** son la salida tactical de CTI. **IOC** = evidencia de compromiso ocurrido; **IOA** = comportamiento de ataque en curso.

---

## Tipos de IOC

| **IOC** | **Ejemplo** | **Volatilidad** |
|:---|:---|:---|
| Hash de archivo | `MD5/SHA256` de malware | Trivial de cambiar |
| Dirección IP | IP de C2 | Fácil de rotar |
| Dominio / URL | `evil-c2[.]com` | Fácil de re-registrar |
| Email | Remitente de phishing | Fácil |
| Clave de registro / Mutex | `HKLM\...\Run\malware` | Moderado |
| Nombre de archivo / ruta | `C:\Temp\svch0st.exe` | Moderado |
^ioc-tipos

> El orden de la tabla refleja la [[MITRE ATT&CK - Pyramid of Pain|Pyramid of Pain]]: cuanto más arriba, más cuesta al atacante cambiar el indicador.

## IOC vs IOA

| | **IOC** | **IOA** |
|:---|:---|:---|
| Qué prueba | Compromiso **ya ocurrido** | Ataque **en curso** |
| Naturaleza | Reactivo / forense | Proactivo / comportamental |
| Ejemplo | Hash de malware encontrado | Proceso de Office lanzando PowerShell |
| Mapea a | Artefactos | TTPs ([[MITRE ATT&CK]]) |
^ioc-vs-ioa

## Estándares de Intercambio

| **Estándar** | **Para qué** |
|:---|:---|
| **STIX** (Structured Threat Information eXpression) | Formato estructurado para describir CTI (objetos, relaciones). |
| **TAXII** (Trusted Automated eXchange) | Protocolo de transporte para compartir STIX entre organizaciones. |
| **MISP** | Plataforma open-source para compartir IOCs y CTI. |
^ioc-estandares

> Detalle de cómo se usan los indicadores en detección: [[Tipos de Detección]].
^ioc-deteccion
