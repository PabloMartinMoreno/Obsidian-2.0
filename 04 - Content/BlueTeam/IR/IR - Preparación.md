---
aliases:
  - Etapa de Preparación
  - IR Preparation
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
kind: SubCheatSheet
linked:
  - "[[Gestión de Incidentes]]"
---
# IR - Preparación

> Etapa 1 del NIST IR lifecycle. Dos objetivos: **(1)** establecer la capacidad de IH (equipo, políticas, herramientas) y **(2)** protegerse/prevenir incidentes (hardening). La protección no es responsabilidad directa del equipo IH, pero deben conocerla.

---

## Capacidad de IH

| **Pilar** | **Qué incluye** |
|:---|:---|
| **Equipo cualificado** | Miembros con capacidad básica de IH in-house (aunque haya tercerización). |
| **Fuerza laboral capacitada** | Security awareness y formación continua. |
| **Políticas y documentación** | Contactos del equipo + legal/compliance/medios/fuerzas; plan y procedimientos IR; baselines (golden image); diagramas de red; CMDB; cuentas privilegiadas on-demand; cheat sheets forenses. |
| **Herramientas (jump bag)** | Workstation forense, herramientas de imaging/memoria/live-response/logs/red, write blockers, discos, formularios de cadena de custodia, creador de IOCs, ticketing. |
^prep-capacidad

> **Jump bag:** mochila siempre lista con las herramientas, para responder en minutos, no semanas. El sistema de documentación/comunicación debe ser **independiente de la infraestructura de la organización** — asumir que todo el dominio está comprometido y los adversarios leen el email.
^prep-jumpbag

## Medidas de Protección (alto impacto)

| **Área** | **Medidas** |
|:---|:---|
| **Email (anti-phishing)** | **DMARC** (sobre SPF + DKIM) rechaza spoofing del propio dominio. Requiere testing exhaustivo (riesgo de bloquear mail legítimo). |
| **Hardening de Endpoints** | Baselines CIS/Microsoft: deshabilitar LLMNR/NetBIOS, LAPS, PowerShell ConstrainedLanguage, ASR rules, whitelisting (bloquear ejecución desde Downloads/Desktop/AppData y `.hta/.vbs/.cmd/.bat/.js`), host firewall, **EDR con AMSI**. |
| **Red** | Segmentación, aislar sistemas críticos, no exponer interno a Internet (DMZ), **IDS/IPS con SSL/TLS interception**, **802.1x** (anti-BYOD), Conditional Access en cloud. |
| **Identidad** | **MFA** para todo acceso admin, **PAM**, passphrases en vez de passwords débiles-pero-complejas (`Password1!`). |
| **Vuln Management** | Escaneo continuo, remediar High/Critical; si no se puede parchear, segmentar. |
| **Awareness** | Formación + phishing tests sorpresa, USBs dropeados. |
| **AD Security Assessment** | Revisar desde la perspectiva del atacante; eliminar low-hanging fruit de escalada. |
| **Purple Team** | Red Team informa al Blue Team: prueba logging/detección/respuesta y los playbooks. |
^prep-proteccion
