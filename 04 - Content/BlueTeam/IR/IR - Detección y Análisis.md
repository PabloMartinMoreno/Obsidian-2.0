---
aliases:
  - Etapa de Detección y Análisis
  - IR Detection and Analysis
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
  - "[[Threat Intelligence - IOCs e IOAs]]"
---
# IR - Detección y Análisis

> Etapa 2 del NIST IR lifecycle. Detectar el incidente, **establecer contexto** con una investigación inicial, y arrancar la investigación cíclica basada en IOCs. Los handlers pasan la mayor parte del tiempo aquí + Preparación.

---

## Fuentes y Niveles de Detección

| **Fuente de detección** | **Nivel de detección** |
|:---|:---|
| Empleado que nota algo anormal | **Perímetro** (firewall, IDS/IPS internet-facing, DMZ) |
| Alerta de herramienta (EDR/IDS/SIEM/FW) | **Red interna** (firewall local, HIDS) |
| Threat Hunting | **Endpoint** (AV, EDR) |
| Notificación de tercero | **Aplicación** (logs de app/servicio) |
^da-fuentes

## Investigación Inicial (establecer contexto)

Recopilar antes de convocar respuesta org-wide:

- Fecha/hora del reporte; quién detectó/reportó; **cómo** se detectó.
- Qué fue (phishing, indisponibilidad...); lista de sistemas impactados.
- Quién accedió a los sistemas y qué acciones tomó; ¿incidente en curso o detenido?
- Por sistema: ubicación, OS, IP, hostname, propietario, propósito, estado.
- Malware: IPs, hashes, copias de archivos, tipo, sistemas impactados.
^da-investigacion-inicial

## Línea de Tiempo del Incidente

Foco en el **comportamiento del atacante**. La evidencia no se descubre en orden cronológico, pero se ordena por cuándo ocurrió:

| **Fecha** | **Hora** | **Hostname** | **Descripción** | **Fuente de datos** |
|:---|:---|:---|:---|:---|
| 09/09/2021 | 13:31 CET | SQLServer01 | Mimikatz detectado | Software Antivirus |
^da-timeline

## Severidad y Alcance

Preguntas clave: impacto de la explotación, requisitos, ¿sistemas críticos afectados?, pasos de remediación, ¿cuántos sistemas?, ¿exploit *in the wild*?, ¿capacidad *worm-like*? (las últimas 2 indican sofisticación del adversario). Info confidencial → **need-to-know basis**.
^da-severidad

## La Investigación (ciclo de 3 pasos)

| **#** | **Paso** | **Detalle** |
|:---:|:---|:---|
| 1 | **Crear/usar IOCs** | Documentar artefactos (IP, hash, filename) en **OpenIOC**, **YARA**, **STIX** (CISA publica en STIX/JSON). |
| 2 | **Identificar nuevas pistas y sistemas** | Buscar IOCs en la org → hits. Eliminar **falsos positivos** (IOCs genéricos); priorizar. |
| 3 | **Recopilar y analizar datos** | Live response (RAM rica en artefactos) o apagar+analizar. Forense de disco/memoria + análisis de malware. Actualizar timeline. |
^da-ciclo-ioc

> **¡Cuidado con el cacheo de credenciales!** Conectarse a sistemas comprometidos con herramientas que cachean creds expone a usuarios privilegiados. Usar **WinRM** / Network Logon (tipo 3) que no cachea. `PsExec` con creds explícitas **cachea**; sin creds (sesión actual) **no**. Mantener **cadena de custodia** para admisibilidad legal.
^da-opsec

## IA en Detección

LLMs automatizan triaje y correlación. Ej: **Attack Discovery** de Elastic Security agrupa alertas relacionadas en una "historia de ataque" con mapeo MITRE. Casos de uso: triaje automatizado, reconstrucción de timeline, playbooks de respuesta, análisis post-incidente.
^da-ia
