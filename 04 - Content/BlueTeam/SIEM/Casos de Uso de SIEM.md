---
aliases:
  - Desarrollo de Casos de Uso de SIEM
  - SIEM Use Cases
  - Detection Engineering
tags:
  - topic/siem
  - topic/detection
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: CheatSheet
linked:
  - "[[Fundamentos de SIEM]]"
  - "[[MITRE ATT&CK]]"
  - "[[Tipos de Detección]]"
---
# Casos de Uso de SIEM

> [!info] Overview
> Un **caso de uso de SIEM** es un escenario que dispara detección/alerta: desde "10 logins fallidos" hasta un brote de ransomware. El SIEM **correlaciona** múltiples eventos en una alerta accionable. Desarrollarlos bien es el núcleo del **detection engineering**.

![[Desarrollo de Casos de Uso de SIEM-1.png]]

---

## Ciclo de Vida del Desarrollo

| **#** | **Etapa** | **Qué se hace** |
|:---:|:---|:---|
| 1 | **Requerimientos** | Definir el escenario y el umbral (ej. alerta tras 10 logins fallidos en 4 min). |
| 2 | **Data Points** | Identificar dónde se puede loguear el evento (Windows/Linux, endpoints, VPN, OWA). |
| 3 | **Validación de Logs** | Verificar que los logs traen usuario, timestamp, origen, destino, máquina, app. |
| 4 | **Diseño & Implementación** | Definir 3 parámetros: **Condición**, **Agregación**, **Prioridad**. |
| 5 | **Documentación (SOP)** | Procedimiento estándar + matriz de escalamiento para los analistas. |
| 6 | **Onboarding** | Probar en dev, cerrar gaps de FP, recién ahí pasar a producción. |
| 7 | **Fine-tuning** | Feedback continuo, whitelisting, refinar la regla. |
^uc-ciclo

![[Desarrollo de Casos de Uso de SIEM-2.png]]

## Buenas Prácticas al Construir

- Mapear cada alerta a la [[Cyber Kill Chain]] o [[MITRE ATT&CK]].
- Definir **TTD** (Time to Detect) y **TTR** (Time to Respond) — ver [[Métricas del SOC]].
- Crear SOP + IRP (Incident Response Plan) para verdaderos positivos.
- Establecer SLAs/OLAs entre equipos; auditar el proceso.
^uc-practicas

## Ejemplo: MSBuild iniciado por Office (LoLBin)

Detección de **MSBuild** (Microsoft Build Engine) lanzado por Excel/Word → posible ejecución de payload malicioso (Living-off-the-Land Binary).

| **Campo** | **Valor** |
|:---|:---|
| **Severidad** | ALTA (LoLBin de alto riesgo) |
| **Táctica** | Defense Evasion (`TA0005`) + Execution (`TA0002`) |
| **Técnica** | Trusted Developer Utilities Proxy Execution (`T1127`) |
| **Sub-técnica** | MSBuild (`T1127.001`) |
| **Tuning** | Excluir procesos padre legítimos (devs usan MSBuild; no-ingenieros no). |
^uc-ejemplo-msbuild

### Variante de severidad media: MSBuild con conexión de red

`MsBuild.exe` estableciendo conexión saliente a IP remota/maliciosa. **Severidad MEDIA** (más FP: puede conectar a IPs legítimas de Microsoft). Foco en `event.action`, IP destino y su reputación. Requiere threat intel robusto para reducir FP.
^uc-ejemplo-red
