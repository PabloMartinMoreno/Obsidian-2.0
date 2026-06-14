---
aliases:
  - Kill Chain
  - Ciclo de Vida del Ataque
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
kind: Concept
linked:
  - "[[MITRE ATT&CK]]"
---
# Cyber Kill Chain

> [!info] Overview
> Modelo del **ciclo de vida de un ataque**: describe cómo se manifiesta una intrusión en 7 etapas. Sirve para ubicar qué tan lejos llegó el atacante y a qué accedió durante la investigación de un incidente. El objetivo defensivo es **cortar la cadena lo más temprano posible**.
>
> No es lineal en la práctica: las etapas tempranas (sobre todo Reconocimiento) se repiten tras cada compromiso para profundizar en la red. Para el detalle táctico de cada etapa, ver [[MITRE ATT&CK]].

![[Cyber Kill Chain y MITRE ATT&CK-1.png]]

---

## Las 7 Etapas

| **#** | **Etapa** | **Qué ocurre** |
|:---:|:---|:---|
| 1 | **Reconnaissance** | Elección del objetivo y recopilación de info (pasiva: LinkedIn, ofertas de trabajo, docs; activa: escaneo de webs/IPs externas). |
| 2 | **Weaponization** | Se desarrolla el malware y se incrusta en un exploit/payload entregable, liviano y evasivo de AV/EDR. |
| 3 | **Delivery** | Se entrega el payload: phishing con adjunto/enlace, web maliciosa, llamada con pretexto, USB "olvidado". |
| 4 | **Exploitation** | Se activa el exploit/payload — el atacante ejecuta código en el sistema objetivo. |
| 5 | **Installation** | El stager inicial persiste en la máquina: droppers, backdoors, rootkits. |
| 6 | **Command & Control (C2)** | Se establece acceso remoto. Grupos avanzados usan múltiples variantes para sobrevivir a la contención de una. |
| 7 | **Actions on Objectives** | El objetivo final: exfiltración de datos, despliegue de ransomware, máximo nivel de acceso. |
^ckc-etapas

### Detalle por etapa

**1. Reconnaissance** — El atacante elige el objetivo y recopila información para familiarizarse. Recon pasiva desde fuentes web (LinkedIn, Instagram, documentación corporativa); ofertas de trabajo y partners revelan tecnología (AV, OS, red). Otros escanean activamente aplicaciones web e IPs externas.

![[Cyber Kill Chain y MITRE ATT&CK-2.png]]

**2. Weaponization** — Se construye el malware de acceso inicial dentro de un exploit/payload entregable. Diseñado para ser liviano e indetectable. Su propósito: dar acceso remoto persistente (sobrevive reinicios) con capacidad de desplegar funcionalidad adicional bajo demanda.

**3. Delivery** — Entrega del payload. Phishing con adjunto malicioso o enlace; la web puede contener el exploit, alojar el payload (evade scanners de mail) o clonar un sitio legítimo para robar credenciales. Ingeniería social telefónica. Raramente requiere más que doble clic (`.bat`, `.cmd`, `.vbs`, `.js`, `.hta`). También entrega física vía USB.

**4. Exploitation** — Se activa el exploit/payload entregado. El atacante ejecuta código en el sistema objetivo para ganar acceso o control.

**5. Installation** — El stager inicial corre en la máquina comprometida. Técnicas comunes:

| **Técnica** | **Qué hace** |
|:---|:---|
| **Droppers** | Código pequeño que instala y ejecuta el malware (vía adjunto, web maliciosa, ingeniería social). |
| **Backdoors** | Acceso continuo al sistema; permite más ataques o robo de datos. |
| **Rootkits** | Oculta la presencia del malware para evadir AV y herramientas de seguridad. |
^ckc-installation

**6. Command & Control (C2)** — Se establece acceso remoto a la máquina. Suele usarse un stager modular que carga scripts on-the-fly. Grupos avanzados despliegan herramientas separadas: si una variante se detecta y contiene, mantienen otra vía de regreso.

**7. Actions on Objectives** — El objetivo del ataque, que varía: exfiltrar datos sensibles, escalar al máximo acceso, desplegar ransomware (inutiliza datos en endpoints/servidores hasta pagar rescate).

> **No es lineal:** tras la Instalación, lo lógico es volver a Reconocimiento para hallar nuevos objetivos y moverse más profundo. La meta defensiva es romper la cadena en una etapa temprana.
