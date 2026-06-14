---
aliases:
  - CTI Levels
  - Niveles de Threat Intel
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
---
# Threat Intelligence - Niveles

> CTI se produce y consume en 3 niveles según la audiencia y el horizonte temporal.

---

## Los 3 Niveles

| **Nivel** | **Audiencia** | **Qué responde** | **Ejemplo** |
|:---|:---|:---|:---|
| **Strategic** | Ejecutivos, CISO | Riesgo de negocio, tendencias a largo plazo, quién podría atacar y por qué | Informe: "APTs estatales apuntan a nuestro sector" |
| **Operational** | Gerentes SOC, IR | Campañas y TTPs de actores específicos; el "cómo" | "El grupo X usa spear-phishing + `T1059`" |
| **Tactical** | Analistas, herramientas | IOCs accionables para detección inmediata | Hashes, IPs, dominios → reglas de SIEM |
^cti-niveles

## Diferencias clave

| | **Strategic** | **Operational** | **Tactical** |
|:---|:---|:---|:---|
| Horizonte | Largo plazo | Mediano | Inmediato |
| Formato | Informes, briefings | Reportes de campañas | Feeds, IOCs (STIX/TAXII) |
| Vida útil | Meses/años | Semanas/meses | Horas/días (alta volatilidad) |
^cti-diferencias

> Lo tactical caduca rápido (IPs/hashes rotan); lo strategic perdura. Por eso lo accionable a largo plazo son los **TTPs** (operational), no los IOCs atómicos.
^cti-volatilidad
