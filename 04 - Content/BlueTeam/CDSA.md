---
aliases:
tags:
  - cert/cdsa
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Ruta CDSA
### FASE 1: Los Cimientos (Mes 1)

_No toques un Sherlock todavía. Si no entiendes cómo funciona Windows por dentro, no sabrás qué buscar cuando lo hackeen._

1. **En HTB Academy (Job Role Path):**
    - Completa los módulos introductorios de **"Network Enumeration with Nmap"** y **"Linux/Windows Fundamentals"**.
    - **Clave:** Presta mucha atención al módulo **"Windows Event Logs"**. Es el "pan de cada día" del CDSA.
2. **Apoyo Gratuito (YouTube):**
    - Si los módulos de redes se ponen densos, busca en el canal **NetworkChuck** o **HackerSploit** los videos básicos de TCP/IP y DNS.
3. **Hito de control:** Saber qué es un proceso, un servicio, el registro de Windows y una dirección IP.

### FASE 2: El Ojo del Analista - Logs & SIEM (Mes 2)

_Aquí aprendes a detectar lo "raro"._

1. **En HTB Academy:**
    - Módulos de **Splunk** y **ELK (Elastic Stack)**.
    - Aprenderás el lenguaje de consulta (SPL para Splunk, KQL para Elastic).
    - **Importante:** En el examen tendrás que buscar agujas en un pajar de logs. Aprende a filtrar por "Event ID" (ej: el famoso 4624 de login exitoso).
2. **Práctica (Gratis):**
    - Instala **Splunk Free** en tu máquina (te dan 500mb de ingesta diaria gratis, suficiente para practicar con tus propios logs).

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


___

# Canales de YouTube
### 1. Para entender las Bases (Redes y Teoría)

Si HTB Academy te habla de "Subnetting" o "Protocolos TCP" y te pierdes, ve aquí primero.

- **Professor Messer (Inglés - Usa subtítulos):**
    - **Por qué:** Es el estándar de oro. Sus cursos de **Security+** y **Network+** son 100% gratuitos en YouTube.
    - **Tu uso:** No mires todo. Si en HTB no entiendes un concepto de redes, busca el video de Messer sobre ese tema. Es lento, claro y académico.

- **NetworkChuck (Inglés - Muy visual):**
    - **Por qué:** Explica redes (CCNA) con mucha energía, café y dibujos.
    - **Tu uso:** Ideal si te aburres fácil. Su serie "Free CCNA" te enseña todo lo que necesitas de redes para el CDSA (necesitas entender tráfico para analizarlo).

### 2. Para construir tu SOC y ver el trabajo real

Estos youtubers enseñan cómo montar las herramientas que usarás en el CDSA.

- **MyDFIR (Inglés - EL MEJOR para ti):**
    - **Por qué:** Este canal es **oro puro** para alguien sin dinero. Tiene una serie de videos donde **monta un SOC completo en casa** usando herramientas gratuitas.
    - **Tu uso:** Tiene proyectos de "Crear un Laboratorio de Detección de Malware". Haz uno de sus proyectos y entenderás más que leyendo 100 páginas de teoría.

- **Day Cyberwox:**
    - **Por qué:** Se enfoca mucho en la carrera de Analista SOC. Muestra cómo se ven los dashboards (paneles) y cómo se hace el triaje de alertas.

### 3. Para Forense y Malware (Apoyo directo al CDSA)

Además de **13Cubed** (que ya mencionamos y es el rey del forense), agrega este:

- **John Hammond:**
    - **Por qué:** Aunque hace mucho hacking ofensivo, tiene una lista de reproducción de **"Malware Analysis"**.
    - **Tu uso:** Míralo cuando llegues a la parte de analizar virus en HTB. Él muestra cómo "detonar" un virus de forma segura y ver qué hace, explicado de forma muy entretenida.

### 4. ¿Y en Español?

El problema del español en ciberseguridad es que el 90% es "Hacking Ofensivo" (como S4vitar, que es un genio, pero enseña a atacar, no a defender/forense). Para Blue Team específico, el contenido en español es escaso, pero para bases te sirve:

- **Nate Gentile (Español):** No es un canal de cursos, pero tiene videos sobre "Cómo funciona Internet", "Cómo funciona un procesador", etc. Muy buenos para cultura general técnica de altísima calidad.

- **Curso de Redes desde Cero (Cualquier canal educativo serio):** Busca listas de reproducción de "Fundamentos de Redes" en español si el inglés de NetworkChuck se te hace pesado.

___

## Recomendación estratégica para la ruta "Pobreza Zero":

1. **Mañanas (Teoría):** Estudia el módulo de **HTB Academy**.
2. **Tardes (Dudas):** Si no entendiste un concepto (ej: DNS), búscalo en **Professor Messer** o **NetworkChuck**.
3. **Fines de Semana (Práctica):** Mira un video de **MyDFIR** y trata de copiar lo que hace en tu computadora (instalar un SIEM, configurar una alerta).

___

# Arquitectura hibrida

#### A. En tu Linux Principal (Host) -> DOCKER

Usa Docker para la infraestructura de servidores (el "Cerebro").5
- Corre el contenedor de **Splunk** o **Elastic**.
- Corre el contenedor de **Wazuh Server**.
- _Ventaja:_ No gastas recursos en una VM de servidor pesado.

#### B. En VirtualBox/KVM -> WINDOWS 10 VM

Usa una VM ligera de Windows solo como "Punta de Lanza".
- Aquí instalas los agentes (Sysmon) que envían los logs al Docker de tu Host.
- Aquí descargas los Sherlocks y los analizas con las herramientas de Windows.
- _Seguridad:_ Si un malware explota aquí, solo rompe la VM, no toca tu Linux principal.

### Ejemplo Práctico: Levantar Splunk en Docker

1. Crea una carpeta para tu lab:
    ```Bash
    mkdir splunk-lab && cd splunk-lab
    ```
    
2. Crea un archivo llamado `docker-compose.yml`:
    ```Bash
    nano docker-compose.yml
    ```
    
3. Pega este contenido dentro:
```YAML
version: "3"
services:
  splunk:
    image: splunk/splunk:latest
    container_name: splunk-lab
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=Password123!
    ports:
      - "8000:8000"
      - "9997:9997"
    volumes:
      - ./opt/splunk/etc:/opt/splunk/etc
      - ./opt/splunk/var:/opt/splunk/var
```

4. Guarda (`Ctrl+O`, `Enter`) y sal (`Ctrl+X`).
    
5. Inícialo con:
    ```Bash
    sudo docker-compose up -d
    ```
    
6.   http://localhost:8000
	**Usuario:** `admin`
	**Contraseña:** `Password123!` (o la que hayas puesto).
