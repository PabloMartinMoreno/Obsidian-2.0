---
aliases:
  - Registros de Eventos de Windows
  - Finding Evil
  - Event IDs
tags:
  - topic/siem
  - env/windows
  - asset/endpoint
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SIEM]]"
  - "[[Detección]]"
tertiary categories:
  - "[[SIEM Detección]]"
kind: CheatSheet
linked:
  - "[[Elastic Stack]]"
  - "[[Tipos de Detección]]"
---
# Windows Event Logs

> [!info] Overview
> Los **Windows Event Logs** registran actividad del sistema, aplicaciones y seguridad. Fuente primaria para detección de intrusiones ("finding evil"). Se acceden por **Event Viewer** o por API (Winlogbeat → SIEM). El archivo de eventos guardado es `.evtx`.

---

## Canales de Eventos

| **Canal** | **Qué registra** |
|:---|:---|
| **Application** | Errores de aplicaciones y eventos generales. |
| **Security** | Auditoría de seguridad: logins, acceso a objetos. |
| **Setup** | Configuración del sistema. |
| **System** | Componentes del SO: drivers, servicios. |
| **Forwarded Events** | Logs reenviados desde otras máquinas (vista consolidada). |
^wel-canales

## Event IDs Críticos

| **Event ID** | **Canal** | **Significado / Por qué importa** |
|:---:|:---|:---|
| **4624** | Security | Login exitoso. |
| **4625** | Security | Login fallido (fuerza bruta). |
| **4648** | Security | Login con credenciales explícitas (posible lateral movement). |
| **4672** | Security | Privilegios especiales asignados (escalada). |
| **4698/4700/4702** | Security | Creación/modificación de tarea programada (persistencia). |
| **4719** | Security | Cambio de política de auditoría. |
| **4771** | Security | Fallo de pre-auth Kerberos. |
| **5140/5145** | Security | Acceso a recursos compartidos de red. |
| **1102** | Security | **Audit log borrado** (encubrimiento). |
| **1116/1118/1119** | Security | Detección/remediación de Windows Defender. |
| **7045** | System | **Servicio instalado** (persistencia de malware). |
| **7040** | System | Cambio de estado de servicio. |
| **1074** | System | Apagado/reinicio del sistema. |
| **6005/6006** | System | Event log service iniciado/detenido (boot/shutdown). |
^wel-eventids

## XML Queries Personalizadas

En Event Viewer: *Filtrar registro actual → XML → Editar consulta manualmente*. Permite búsquedas granulares por `Logon ID`.

Ej: filtrar `SubjectLogonId = 0x3E7` para ver toda la actividad de esa sesión. Narrativa de ejemplo:

| **Evento** | **Significa** |
|:---|:---|
| **4907** | Cambio de política de auditoría (SACL de un objeto). |
| **4624** | Inicio de sesión. |
| **4672** | Privilegios especiales otorgados (ej. `SeDebugPrivilege` → SYSTEM/Admin). |
^wel-xml

> En el SIEM ([[Elastic Stack]]), estos Event IDs se consultan con [[Elastic Stack - KQL|KQL]]: `event.code:4625` para fuerza bruta, `event.code:7045` para servicios sospechosos.
^wel-siem
