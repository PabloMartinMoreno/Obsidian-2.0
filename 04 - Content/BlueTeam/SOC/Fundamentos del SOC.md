---
aliases:
  - Definición y Fundamentos del SOC
tags:
  - topic/soc
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
  - "[[Identificación]]"
tertiary categories:
  - "[[SOC Identificación]]"
kind: Concept
linked:
  - "[[MITRE ATT&CK]]"
  - "[[Cyber Kill Chain]]"
---
# Fundamentos del SOC

> [!info] Overview
> Un **SOC** (Security Operations Center) es la instalación + equipo que **monitorea, detecta, investiga y responde** incidentes de ciberseguridad de forma continua, combinando tecnología (SIEM, IDS/IPS, EDR, threat intel) y procesos definidos (triaje, contención, erradicación, recuperación). Foco en la **operación** de seguridad, no en diseño de arquitectura ni estrategia.

---

## ¿Cómo funciona?

- Gestiona el aspecto **operativo continuo** de la seguridad: detectar, evaluar, responder, informar y prevenir incidentes.
- Colabora estrechamente con el equipo de **Incident Response** ([[Incident Response]]).
- SOCs maduros suman capacidades avanzadas: **análisis forense** ([[Metodología Forense]]) y **análisis de malware** para investigar causa raíz.
- Stack típico: **SIEM** ([[SIEM]]), **IDS/IPS**, **EDR**, plus threat intelligence y threat hunting proactivo.

## Roles

| **Rol** | **Responsabilidad** |
|:---|:---|
| **Director del SOC** | Gestión general y estrategia: presupuesto, dotación, alineación con objetivos. |
| **Gerente del SOC** | Operaciones diarias, gestión del equipo, coordinación de IR, enlace con otros departamentos. |
| **Analista Tier 1** | Monitorea alertas, triaje inicial, escala incidentes. "Primer respondedor". |
| **Analista Tier 2** | Análisis en profundidad de lo escalado, identifica patrones, desarrolla mitigaciones. |
| **Analista Tier 3** | Maneja incidentes complejos/alto perfil, threat hunting proactivo, prevención avanzada. |
| **Ingeniero de Detección** | Desarrolla y mantiene reglas/firmas de SIEM, IDS/IPS, EDR; cierra gaps de cobertura. |
| **Incident Responder** | Toma incidentes activos: forense, contención y remediación. |
| **Analista de Threat Intel** | Recopila, analiza y difunde inteligencia de amenazas. |
| **Ingeniero de Seguridad** | Despliega y mantiene herramientas, tecnología e infraestructura. |
| **Compliance & Governance** | Asegura adherencia a estándares y regulaciones. |
| **Security Awareness** | Programas de concientización para empleados. |
^soc-roles

## Estructura por Tiers

| **Tier** | **También llamado** | **Función** |
|:---:|:---|:---|
| **1** | Primeros respondedores | Identifican y priorizan incidentes rápidamente; triaje. |
| **2** | Analistas experimentados | Análisis profundo, estrategias de mitigación, tuning de herramientas (reducir falsos positivos). |
| **3** | Analistas senior | Incidentes complejos/alto perfil, threat hunting proactivo, prevención avanzada. |
^soc-tiers

> Los roles/responsabilidades por tier varían según tamaño de la organización, industria y requisitos de seguridad.

## Evolución del SOC

| **Generación** | **Foco** | **Características** |
|:---|:---|:---|
| **SOC 1.0** | Red y perímetro | Capas de seguridad aisladas sin integración → alertas no correlacionadas y backlog. Enfoque obsoleto, algunos aún lo usan. |
| **SOC 2.0** | Inteligencia | Responde a amenazas multivectoriales/persistentes (malware móvil, botnets). Integra telemetría + threat intel + análisis de flujo + detección de anomalías; análisis de capa 7; conciencia situacional pre/post-evento. |
| **SOC Cognitivo** | Next-gen | Sistemas de aprendizaje que compensan brechas de experiencia; reglas que detectan amenazas a procesos/sistemas específicos del negocio. |
^soc-evolucion
