---
aliases:
tags:
  - type/concept
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### 🟢 Nivel 1: Very Easy (Calentamiento y Conceptos Base)

_Objetivo: Familiarizarse con la plataforma y logs individuales._
1. **Brutus:** (Linux) Análisis de `auth.log` y `wtmp`. Fundamental para entender accesos SSH.
2. **Recollection:** (Forense) Introducción al análisis de artefactos básicos.
3. **Crown Jewel 1:** (AD) Detección de robo de credenciales (NTDS dumping) vía `ntdsutil`.
4. **Crown Jewel 2:** (AD) Detección de NTDS dumping vía `vssadmin` (Volume Shadow Copy).
5. **Camp Fire 1:** (AD) Análisis de ataques **Kerberoasting**.
6. **Camp Fire 2:** (AD) Análisis de ataques **AS-REP Roasting**.
7. **SalineBreeze-1:** (General) Escenario introductorio reciente (2025).
8. **PhishNet:** (SOC) Investigación básica de una alerta de phishing.
9. **Einladen:** (DFIR) Introducción a la respuesta ante incidentes.
10. **BFT:** (Forense) Análisis de la Master File Table (MFT) de Windows para ver archivos borrados.

---

### 🔵 Nivel 2: Easy (El Estándar de la Industria)

_Objetivo: Aquí es donde vive el Analista SOC 1. Tienes que dominar TODOS estos._

**Logs & Endpoint (Windows/Linux)**
11. **Logjammer:** El "clásico" de logs de Windows. Imprescindible.
12. **Unit42:** Introducción a **Sysmon**. Vital porque Sysmon da mucha más info que los logs nativos.
13. **Whisper:** Persistencia en el Registro de Windows.
14. **Knock Knock:** Investigación de mecanismos de persistencia.
15. **Tracer:** Un caso completo de intrusión con movimiento lateral simple.
16. **i-like-to:** Análisis de explotación de vulnerabilidad (caso MOVEit).
17. **WorkFromHome:** Análisis de compromiso en entorno remoto.

**Red (Network Forensics)**
18. **Meerkat:** Análisis de PCAP con Wireshark y alertas de Suricata.
19. **Litter:** Detección de exfiltración de datos (DNS tunneling).
20. **Pikaptcha:** Tráfico web malicioso y capturas de red.

**Active Directory & Identidad**
21. **Noxious:** Envenenamiento LLMNR y ataques de red local.
22. **Reaper:** Ataques de NTLM Relay. Muy común en redes internas.

**Saga Navideña (Muy didácticos)**
23. **OpTinselTrace I:** El inicio de la intrusión.
24. **OpTinselTrace II:** Movimiento lateral y escalada.
25. **OpTinselTrace III:** Persistencia avanzada.
26. **OpTinselTrace IV (Neural Noel):** Temática de IA y logs.
27. **OpTinselTrace V:** El desenlace.

---

### 🟠 Nivel 3: Medium (Escenarios Complejos)

_Objetivo: Simular incidentes donde el atacante intenta esconderse._
28. **Unsupervised:** (Insider Threat) Empleado desleal sacando datos por USB.
29. **Safecracker:** Análisis de Ransomware (básico).
30. **Lockpick 2.0:** Análisis de Malware más avanzado.
31. **SecretPictures:** Esteganografía (malware oculto en imágenes).
32. **The Watchman's Residue:** Uso malicioso de herramientas de administración remota (RMM).
33. **NeuroSync-D:** Ataques a aplicaciones web vistos desde los logs del servidor.
34. **Psittaciformes:** Análisis de scripts maliciosos de Bash y minería de criptomonedas.
35. **Ghost Thread:** (Nuevo 2025) Inyección de procesos (Process Injection). Muy técnico.
36. **Phantom Check:** (Nuevo 2025) Malware que detecta si está en una máquina virtual (Anti-VM).

---

### 🔴 Nivel 4: Hard / Insane (Solo cuando te sientas muy seguro)

_Objetivo: Retos de ingeniería inversa o Hunting avanzado._
37. **Latus:** Movimiento lateral complejo.
38. **Hunter:** Threat Hunting puro. Requiere correlacionar muchos eventos.
39. **Constellation:** Incidente en la nube/híbrido.
40. **GroundWorm:** Análisis de Keyloggers y API Hooking (Win32 API).
41. **Lockpick 4.0:** Ransomware avanzado con ingeniería inversa.
42. **APTNightmare2:** Rootkits y análisis de memoria.

---

### 📅 Tu Plan de Batalla (Rutina de 3 Sherlocks/Día)

Para no quemarte, no hagas 3 de la misma categoría seguidos. Mézclalos para ejercitar diferentes partes del cerebro.

**Ejemplo de un "Día Tipo" balanceado:**
- **Mañana (Fresco):** Uno de **Logs/Endpoint** (Ej: _Logjammer_). Requiere mucha lectura y atención al detalle.
- **Tarde (Técnico):** Uno de **Red** (Ej: _Meerkat_). Wireshark es más visual y dinámico.
- **Noche (Cierre):** Uno **Very Easy** o de la saga **OpTinselTrace**. Son más guiados y narrativos, perfectos para cerrar el día con una victoria.

**Consejo final:**
Si logras terminar los niveles "Very Easy" y "Easy" (aprox. 25 Sherlocks) y entiendes lo que hiciste, ya estás técnicamente sobrecalificado para muchas entrevistas de L1. ¡Dale caña!