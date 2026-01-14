### FASE 1: Los Cimientos (Mes 1)

_No toques un Sherlock todavía. Si no entiendes cómo funciona Windows por dentro, no sabrás qué buscar cuando lo hackeen._

1. **En HTB Academy (Job Role Path):**
    - Completa los módulos introductorios de **"Network Enumeration with Nmap"** y **"Linux/Windows Fundamentals"**.
    - **Clave:** Presta mucha atención al módulo **"Windows Event Logs"**. Es el "pan de cada día" del CDSA.
2. **Apoyo Gratuito (YouTube):**
    - Si los módulos de redes se ponen densos, busca en el canal **NetworkChuck** o **HackerSploit** los videos básicos de TCP/IP y DNS.
3. **Hito de control:** Saber qué es un proceso, un servicio, el registro de Windows y una dirección IP.


---

### FASE 2: El Ojo del Analista - Logs & SIEM (Mes 2)

_Aquí aprendes a detectar lo "raro"._

1. **En HTB Academy:**
    - Módulos de **Splunk** y **ELK (Elastic Stack)**.
    - Aprenderás el lenguaje de consulta (SPL para Splunk, KQL para Elastic).
    - **Importante:** En el examen tendrás que buscar agujas en un pajar de logs. Aprende a filtrar por "Event ID" (ej: el famoso 4624 de login exitoso).
2. **Práctica (Gratis):**
    - Instala **Splunk Free** en tu máquina (te dan 500mb de ingesta diaria gratis, suficiente para practicar con tus propios logs).


---

### FASE 3: El Detective - DFIR & Forense (Mes 3)

_Aquí es donde entra lo que te confundía. Ya detectaste la alerta en la Fase 2, ahora investigas el incidente._

1. **En HTB Academy:**
    - **"Windows Forensics"** (Parte 1 y 2): Aquí verás MFT, Prefetch, Shimcache.
    - **"Network Traffic Analysis"**: Aprenderás a usar Wireshark para ver si robaron datos.
2. **Apoyo Gratuito (YouTube - Vital aquí):**
    - Canal **13Cubed**: Mira su serie "Introduction to Windows Forensics". Explica lo mismo que HTB pero con dibujos y ejemplos muy claros. Es el mejor recurso gratuito que existe.
3. **Herramientas a instalar (Gratis):**
    - **Eric Zimmerman's Tools:** (EZ Tools). Son el estándar de la industria. Gratuitas.
    - **Velociraptor:** Aprende a instalar el servidor y el cliente en tu propia VM.


---

### FASE 4: Entrenamiento de Combate - Sherlocks (Mes 4 en adelante)

_Ahora sí, a aplicar todo. No uses los Sherlocks antes de esto o te frustrarás._

Ordena los Sherlocks por dificultad y tema. Usa tu suscripción para acceder a ellos:

1. **Nivel "Very Easy" (Calentamiento):**
    - _Lium, Meerkat, Cunningham_.
    - **Objetivo:** Familiarizarte con descargar la evidencia y abrirla sin romper nada.
2. **Nivel "Easy/Medium" (Simulación CDSA):**
    - _Brio_ (Forense puro).
    - _OpTinselTrace_ (Serie completa - simula un ataque persistente).
    - _Ransomware Reaper_.
3. **La Regla de Oro:** Mientras los resuelves, **escribe un reporte**. No solo busques la "flag". Anota:
    - Hora del ataque.
    - Herramienta usada por el hacker.
    - Archivos afectados.
    - _Esto es lo que te hará aprobar el examen._


---

### Tu Setup de Laboratorio (Gratis)

Para estudiar, necesitas armar tu propia "estación de trabajo" en una Máquina Virtual (VM). No confíes solo en la pwnbox del navegador de HTB porque en el mundo real usarás tu PC.

Descarga una VM de **FlareVM** (es un script gratuito que instala todas las herramientas de seguridad en un Windows) o instala estas herramientas manualmente:

1. **Zimmerman Tools** (Analizar registro y artefactos).
2. **Wireshark** (Redes).
3. **Autopsy** (Análisis de disco completo - muy visual).
4. **Velociraptor** (Respuesta a incidentes).
5. **Notepad++ / Obsidian** (Para tomar notas y armar reportes).

### Resumen del Plan

1. Termina el **SOC Analyst Path** en HTB Academy (tienes la anual, úsala).
2. Cuando un tema forense te cueste, ve a **13Cubed** en YouTube.
3. Usa los **Sherlocks** como exámenes simulados.
4. Acostúmbrate a **documentar** todo lo que encuentras.
