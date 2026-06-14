---
aliases:
  - Incident Handling
  - Proceso de Gestión de Incidentes
  - Resumen del Proceso de Gestión de Incidentes
  - IR Lifecycle
tags:
  - topic/incident-response
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[Incident Response]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[IR Respuesta]]"
kind: CheatSheet
linked:
  - "[[IR - Preparación]]"
  - "[[IR - Detección y Análisis]]"
  - "[[IR - Contención, Erradicación y Recuperación]]"
  - "[[IR - Actividad Post-Incidente]]"
  - "[[Análisis de la Brecha de Insight Nexus]]"
  - "[[Cyber Kill Chain]]"
---
# Gestión de Incidentes

> [!info] Overview
> **Incident Handling (IH):** conjunto de procedimientos para gestionar y responder a incidentes de seguridad. Mapea a la fase **Respond** de NIST CSF. El proceso (NIST) tiene 4 etapas **cíclicas, no lineales** — nueva evidencia cambia los pasos siguientes. Cubre no solo intrusiones: también insiders, disponibilidad y pérdida de IP.

---

## Conceptos Base

| **Término** | **Definición** | **Ejemplo** |
|:---|:---|:---|
| **Evento** | Acción que ocurre en un sistema/red | Login, clic, firewall permite conexión |
| **Incidente** | Evento con consecuencia negativa | Caída de sistema, acceso no autorizado |
| **Incidente de seguridad** | Evento con intención clara de causar daño | Robo de datos/fondos, malware, RAT |

- **Incident Manager:** líder del equipo (gerente SOC, CISO/CIO o proveedor externo). Punto único de comunicación; rastrea actividades y su estado.
- **Priorización:** los de mayor gravedad → atención y recursos inmediatos.
- Referencia central: **NIST Computer Security Incident Handling Guide**.

## Las 2 Actividades Principales

| **Actividad** | **Objetivo** |
|:---|:---|
| **Investigar** | Hallar al "paciente cero", crear timeline, determinar herramientas/malware del adversario, documentar sistemas comprometidos. |
| **Recuperar** | Crear e implementar plan de recuperación; reanudar operaciones normales. |

![[Resumen del Proceso de Gestión de Incidentes.png]]

---

## Cheatsheet — Las 4 Etapas (NIST)

### 1. Preparación

````tabs
tab: **Capacidad de IH**
![[IR - Preparación#^prep-capacidad]]

tab: **Medidas de Protección**
![[IR - Preparación#^prep-proteccion]]
````

### 2. Detección y Análisis

````tabs
tab: **Fuentes y Niveles**
![[IR - Detección y Análisis#^da-fuentes]]

tab: **Investigación Inicial**
![[IR - Detección y Análisis#^da-investigacion-inicial]]

tab: **Ciclo de IOCs**
![[IR - Detección y Análisis#^da-ciclo-ioc]]
````

### 3. Contención, Erradicación y Recuperación

````tabs
tab: **Contención**
![[IR - Contención, Erradicación y Recuperación#^cer-contencion]]

tab: **Erradicación**
![[IR - Contención, Erradicación y Recuperación#^cer-erradicacion]]

tab: **Recuperación**
![[IR - Contención, Erradicación y Recuperación#^cer-recuperacion]]
````

### 4. Actividad Post-Incidente

````tabs
tab: **Informe Final**
![[IR - Actividad Post-Incidente#^post-informe]]
````

---

## Tipos de Incidentes del Mundo Real

| **Vector** | **Caso** |
|:---|:---|
| Credenciales filtradas | **Colonial Pipeline** — password de VPN inactiva sin MFA, hallada en dark web. |
| Credenciales default/débiles | **Mirai (2016)** — IoT con admin/admin → botnet DDoS. **LogicMonitor (2023)**. |
| Software sin parchear | **Equifax (2017)** — Apache Struts CVE-2017-5638. **WannaCry (2017)** — EternalBlue/MS17-010. |
| Insider | **Cash App / Block (2022)** — ex-empleado accede a datos de 8.2M usuarios. |
| Phishing / Ing. social | **Twitter 2020** — admin tools vía social engineering. Evil twin Wi-Fi (DoI EE.UU.). |
| Supply chain | **SolarWinds Orion (2020)** — backdoor en updates, miles de clientes. |

> Documentar incidentes secuencialmente alineado a [[Cyber Kill Chain]] / [[MITRE ATT&CK]] (acceso inicial → impacto), estilo reportes de Mandiant / Unit 42.

## Escenario de Referencia

**Insight Nexus** (firma de market research) atacada por 2 grupos simultáneos: default creds `admin/admin` en ManageEngine ADManager Plus → recon → cuentas AD privilegiadas → lateral vía RDP expuesto → GPO para desplegar spyware MSI. Caso completo en [[Análisis de la Brecha de Insight Nexus]].
