---
aliases:
  - Open Source Intelligence
  - Inteligencia de Fuentes Abiertas
tags:
  - technique/recon/passive
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: Concept
linked:
  - "[[OSINT Methods]]"
  - "[[Google Dorking]]"
  - "[[GitHub Dorking]]"
  - "[[OSINT - Username Enumeration]]"
  - "[[OSINT - Email Intelligence]]"
  - "[[OSINT - Reverse Image Search]]"
  - "[[OSINT - Metadata (EXIF)]]"
  - "[[OSINT - Domain & Infrastructure]]"
  - "[[OSINT - Geolocalización]]"
  - "[[OSINT - Automation Frameworks]]"
---
# OSINT

---

## ¿Qué es OSINT?

**OSINT** son las siglas en inglés de **Open Source Intelligence** (Inteligencia de Fuentes Abiertas). Básicamente, es el arte y el proceso de **recolectar, filtrar y analizar información pública** disponible en internet para convertirla en conocimiento útil o "inteligencia".

Para entenderlo de forma simple, se divide en dos grandes pilares:
- **Fuentes Abiertas (Open Source):** Se refiere a que los datos provienen de lugares accesibles para cualquiera, de manera 100% legal. No implica hackear sistemas ni robar contraseñas. Hablamos de redes sociales, foros, registros gubernamentales públicos, artículos de prensa, metadatos de archivos, fotos o incluso la _dark web_.
- **Inteligencia (Intelligence):** Conseguir un montón de datos sueltos no sirve de nada. La inteligencia consiste en cruzar esas piezas de información, aplicar el pensamiento lateral y armar un perfil completo o resolver una investigación.

### ¿En qué se diferencia de una búsqueda común de Google?

La diferencia está en la metodología y las herramientas. Mientras que una persona común busca "cómo hacer una tarta de manzana", un analista de OSINT utiliza técnicas específicas para rastrear información oculta a simple vista, como buscar servidores expuestos a internet (usando herramientas como _Shodan_) o identificar la identidad de alguien a partir de un fragmento de foto (_búsqueda inversa de imágenes_).

> **En resumen:** OSINT es conectar los puntos de la huella digital que personas, empresas o sistemas van dejando de forma pública en internet.

## Ciclo de OSINT

El ciclo de OSINT (Inteligencia de Fuentes Abiertas) se compone de **6 pasos o fases** fundamentales:

- **Fase 1: Definición de requerimientos**
    Consiste en determinar qué es lo que se quiere saber y para quién va dirigida la información (por ejemplo, identificar las necesidades del cliente que contrató la investigación). En esta etapa también se define el formato que tendrá el resultado final, determinando si se entregará mediante un informe detallado, si se adjuntarán pruebas, entre otros aspectos de formato.

- **Fase 2: Recolección de información**
    Es la etapa donde se inicia formalmente el rastreo. Se realizan consultas en redes sociales, foros y registros públicos, abarcando plataformas tanto de la _surface web_ (internet superficial), como de la _deep web_ o la _dark web_. Asimismo, se procede a revisar contenido multimedia y a extraer metadatos.

- **Fase 3: Procesamiento**
    Dado que en la fase anterior se recopila la mayor cantidad de datos posible, en este paso el objetivo principal es depurar los resultados. Consiste en filtrar toda la "información basura" o de relleno para quedarse únicamente con los datos que tengan valor potencial.

- **Fase 4: Análisis**
    En esta fase se pone en práctica el pensamiento lateral para lograr identificar patrones, relaciones, conexiones o tendencias entre los datos limpios. Aunque se pueden emplear herramientas tecnológicas de apoyo, se destaca que la intuición y el criterio humano siempre serán superiores a cualquier automatización en este punto.

- **Fase 5: Difusión**
    Es el proceso de plasmar los hallazgos de forma estructurada. Consiste en confeccionar y hacer la entrega formal del informe final, redactado de manera clara y comprensible, para presentárselo al cliente o a la parte interesada que solicitó la auditoría.

- **Fase 6: Revisión**
    Es el paso de validación final. Sirve para constatar y auditar si efectivamente se cumplieron los objetivos y requerimientos iniciales planteados por el cliente al principio del ciclo.


---

## Herramientas
### 1. Buscadores de Infraestructura y Activos en Internet

- **[Shodan](https://www.shodan.io/)**: El motor de búsqueda para encontrar dispositivos, servidores y servicios expuestos directamente a Internet.
- **[Censys](https://censys.com/)**: Plataforma de búsqueda y análisis de seguridad para escanear y rastrear la superficie de ataque global en la red.

### 2. Búsqueda Inversa de Imágenes y Rostros (IA)

- **[TinEye](https://tineye.com/)**: Buscador clásico de imágenes que rastrea duplicados exactos o patrones modificados de una misma foto en la web.
- **[PimEyes](https://pimeyes.com/)**: Buscador de reconocimiento facial que localiza en qué páginas web aparece el rostro de una persona.
- **[Lenso.ai](https://lenso.ai/)**: Herramientas que utiliza inteligencia artificial avanzada para analizar distancias biométricas y encontrar rostros similares o idénticos.
- **[FaceCheck.id](https://facecheck.id/)**: Plataforma de búsqueda de rostros altamente precisa, capaz de indexar fotos de redes sociales, blogs y miniaturas de video.

### 3. Plataformas de Investigación de Identidad Digital

- **[OSINT Industries](https://osint.industries/)**: Herramienta profesional de pago para rastrear correos o teléfonos y reconstruir toda la huella digital y perfiles sociales de un objetivo.


---


## Técnicas

Cada técnica encadena con las demás: una semilla (alias, email, foto, dominio) abre puertas a las otras.

### 🔍 Buscadores y Dorking
- [[Google Dorking]] — operadores avanzados de Google para hallar lo oculto a simple vista.
- [[GitHub Dorking]] — secretos y credenciales en repos públicos.

### 👤 Identidad y Personas
- [[OSINT - Username Enumeration]] — rastrear un alias por todas las plataformas (Sherlock, Maigret).
- [[OSINT - Email Intelligence]] — de un email a filtraciones, cuentas y dueño (HIBP, Holehe, Epieos).
- [[OSINT - Reverse Image Search]] — fotos robadas / catfishing (Yandex, TinEye).

### 🖼️ Imágenes y Ubicación
- [[OSINT - Metadata (EXIF)]] — GPS, autor y stack desde metadatos (ExifTool).
- [[OSINT - Geolocalización]] — deducir el lugar por pistas visuales (Bellingcat, Overpass).

### 🌐 Infraestructura y Automatización
- [[OSINT - Domain & Infrastructure]] — WHOIS, DNS, subdominios, hosting (crt.sh, Shodan).
- [[OSINT - Automation Frameworks]] — recolección a escala (SpiderFoot, Maltego, recon-ng).
