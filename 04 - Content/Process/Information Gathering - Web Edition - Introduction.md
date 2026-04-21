---
aliases:
tags:
  - type/concept
  - asset/web-app
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Introducción

La recopilación de información web (Web Reconnaissance) es la base de una evaluación de seguridad exhaustiva. Este proceso implica recolectar de forma sistemática y meticulosa información sobre un sitio web o una aplicación web objetivo. Piénsalo como la fase preparatoria antes de profundizar en análisis y posibles explotaciones. Forma una parte crítica de la fase de "Recolección de Información" del proceso de pruebas de penetración.

Flujograma del proceso de pruebas de penetración: Pre-compromiso, Recolección de información, Evaluación de vulnerabilidades, Explotación, Post-explotación, Movimiento lateral, Prueba de concepto y Post-compromiso.

![[Pasted image 20251226153038.png]]

## Objetivos principales de la recolección web

- **Identificar activos:** descubrir todos los componentes accesibles públicamente del objetivo (páginas web, subdominios, direcciones IP, tecnologías usadas). Esto da una visión completa de la presencia online del objetivo.
- **Descubrir información oculta:** localizar información sensible expuesta por error (archivos de backup, ficheros de configuración, documentación interna). Estos hallazgos pueden revelar puntos de entrada valiosos.
- **Analizar la superficie de ataque:** revisar la superficie de ataque para identificar vulnerabilidades y debilidades (tecnologías, configuraciones y posibles vectores de explotación).
- **Recopilar inteligencia:** reunir información que pueda usarse para explotación posterior o ataques de ingeniería social (personas clave, correos, patrones de comportamiento).

Los atacantes aprovechan esta información para personalizar sus ataques y atacar debilidades específicas. Por el contrario, los defensores usan el recon para identificar y parchear vulnerabilidades antes de que actores maliciosos las exploten.

## Tipos de reconocimiento

La recolección web abarca dos metodologías fundamentales: reconocimiento activo y reconocimiento pasivo. Cada enfoque tiene ventajas y limitaciones; entender sus diferencias es crucial para una recolección adecuada.

### Reconocimiento activo

En el reconocimiento activo, el atacante interactúa directamente con el sistema objetivo para recopilar información. Estas interacciones pueden adoptar varias formas:

#### Escaneo de puertos

- **Descripción:** identificar puertos abiertos y servicios en ejecución.
- **Ejemplo:** usar Nmap para escanear un servidor web y detectar puertos 80 (HTTP) y 443 (HTTPS).
- **Herramientas:** Nmap, Masscan, Unicornscan.
- **Riesgo de detección:** Alto — la interacción directa puede activar IDS/IPS y firewalls.

#### Escaneo de vulnerabilidades

- **Descripción:** sondear el objetivo en busca de vulnerabilidades conocidas (software desactualizado, configuraciones erróneas).
- **Ejemplo:** ejecutar Nessus contra una aplicación web para buscar SQLi o XSS.
- **Herramientas:** Nessus, OpenVAS, Nikto.
- **Riesgo de detección:** Alto — los escáneres envían payloads detectables.

#### Mapeo de red

- **Descripción:** mapear la topología de red del objetivo (dispositivos conectados y relaciones).
- **Ejemplo:** usar traceroute para ver el camino que siguen los paquetes hasta el servidor objetivo.
- **Herramientas:** traceroute, Nmap.
- **Riesgo de detección:** Medio–Alto — tráfico excesivo o inusual puede levantar sospechas.

#### Banner grabbing

- **Descripción:** obtener información de banners que muestran los servicios (software y versión).
- **Ejemplo:** conectar al puerto 80 y examinar la cabecera HTTP para identificar el servidor web.
- **Herramientas:** Netcat, curl.
- **Riesgo de detección:** Bajo — interacción mínima, pero puede quedar registrada.

#### Detección de SO (OS fingerprinting)

- **Descripción:** identificar el sistema operativo del objetivo.
- **Ejemplo:** usar la detección de SO de Nmap (-O) para determinar si corre Windows o Linux.
- **Herramientas:** Nmap, Xprobe2.
- **Riesgo de detección:** Bajo — generalmente pasivo, aunque técnicas avanzadas pueden detectarse.

#### Enumeración de servicios

- **Descripción:** determinar versiones específicas de los servicios en puertos abiertos.
- **Ejemplo:** usar Nmap (-sV) para ver si un servidor corre Apache 2.4.50 o Nginx 1.18.0.
- **Herramientas:** Nmap.
- **Riesgo de detección:** Bajo — similar al banner grabbing, puede quedar registrada.

#### Rastreadores web (web spidering)

- **Descripción:** recorrer el sitio objetivo para identificar páginas, directorios y archivos.
- **Ejemplo:** usar el spider de Burp Suite o OWASP ZAP para mapear la estructura del sitio y descubrir recursos ocultos.
- **Herramientas:** Burp Suite Spider, OWASP ZAP Spider, Scrapy (personalizable).
- **Riesgo de detección:** Bajo–Medio — puede detectarse si el comportamiento del crawler no imita tráfico legítimo.

El reconocimiento activo ofrece una visión directa y a menudo más completa de la infraestructura y postura de seguridad del objetivo, pero con mayor riesgo de detección.

### Reconocimiento pasivo

El reconocimiento pasivo implica recopilar información sin interactuar directamente con el objetivo, basándose en fuentes públicas y análisis de datos ya disponibles. Entre las técnicas habituales están:

#### Consultas a motores de búsqueda

- **Descripción:** usar buscadores para encontrar información sobre el objetivo (sitios, perfiles sociales, noticias).
- **Ejemplo:** buscar en Google “[Nombre del objetivo] empleados” para localizar perfiles y datos públicos.
- **Herramientas:** Google, DuckDuckGo, Bing, y motores especializados como Shodan.
- **Riesgo de detección:** Muy bajo — actividad normal de navegación.

#### Búsquedas WHOIS

- **Descripción:** consultar bases WHOIS para obtener detalles de registro de dominios.
- **Ejemplo:** realizar una consulta WHOIS sobre un dominio objetivo para ver registrante, contactos y servidores de nombres.
- **Herramientas:** herramienta `whois` en línea de comandos, servicios WHOIS online.
- **Riesgo de detección:** Muy bajo — consultas legítimas y no sospechosas.

#### DNS

- **Descripción:** analizar registros DNS para identificar subdominios, servidores de correo e infraestructura.
- **Ejemplo:** usar `dig` para enumerar subdominios de un dominio.
- **Herramientas:** dig, nslookup, host, dnsenum, fierce, dnsrecon.
- **Riesgo de detección:** Muy bajo — consultas DNS son comunes.

#### Análisis de archivos archivados (web archive)

- **Descripción:** revisar snapshots históricos del sitio para identificar cambios o información oculta.
- **Ejemplo:** usar Wayback Machine para ver versiones antiguas del sitio objetivo.
- **Herramientas:** Wayback Machine.
- **Riesgo de detección:** Muy bajo — acceso normal a archivos públicos.

#### Análisis de redes sociales

- **Descripción:** recopilar información de plataformas públicas (LinkedIn, Twitter, Facebook).
- **Ejemplo:** buscar empleados en LinkedIn para entender roles y posibles objetivos de ingeniería social.
- **Herramientas:** LinkedIn, Twitter, Facebook, herramientas OSINT especializadas.
- **Riesgo de detección:** Muy bajo — acceso a perfiles públicos.

#### Repositorios de código

- **Descripción:** analizar repositorios públicos (GitHub, GitLab) en busca de credenciales o vulnerabilidades expuestas.
- **Ejemplo:** buscar snippets o proyectos relacionados con el objetivo que contengan secretos o configuraciones erróneas.    
- **Herramientas:** GitHub, GitLab.
- **Riesgo de detección:** Muy bajo — son repositorios públicos.

El reconocimiento pasivo es típicamente más sigiloso y con menor probabilidad de generar alertas, aunque puede ofrecer menos información que el enfoque activo porque depende de lo que ya está públicamente disponible.

## Contenido del módulo

En este módulo profundizaremos en las herramientas y técnicas esenciales para el reconocimiento web, empezando por WHOIS. Comprender el protocolo WHOIS abre la puerta a acceder a información clave sobre registros de dominio, datos de propiedad e infraestructura digital del objetivo. Este conocimiento fundamental prepara el terreno para métodos de recon más avanzados que veremos más adelante.