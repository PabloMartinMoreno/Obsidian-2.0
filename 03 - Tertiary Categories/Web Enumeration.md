---
aliases:
  - Enumeración Web
tags:
  - type/moc/tertiary
  - technique/recon/active
  - asset/web-app
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
type: Tertiary Category
---
# Enumeración Web

***

## 🌍 Reconnaissance & Infrastructure
  Recolección inicial de información pasiva y análisis de infraestructura DNS.

- [[Subdomains Passive Enumeration]] (Búsqueda de subdominios sin contacto directo.)
- [[Google Dorking]] (Uso de motores de búsqueda para encontrar paneles y archivos expuestos.)
- [[DNS Enumeration (53)]] (Consulta de registros A, CNAME, TXT, transferencias de zona, etc.)
    - [[DNS Enumeration Command Comparison]] (Referencia rápida de comandos para distintas herramientas.)
- [[Performing Whois Lookup]] (Información de registro de dominio y propietarios.)
- [[Certificate Transparency Logs]] (Uso de crt.sh u otras fuentes para encontrar subdominios y dominios relacionados a través de certificados SSL.)
- [[Cloud Enumeration for Web Assets]] (Detección de buckets S3, Azure Blobs, etc., que podrían contener activos web.)

## 🔍 Content Discovery & Fuzzing
  Búsqueda activa de directorios ocultos, archivos, parámetros y rutas virtuales.

- [[Fuzzing Directories & Pages]] (Descubrimiento de recursos ocultos mediante fuerza bruta.)
- [[Fuzzing Parameters & Values]] (Identificación de parámetros GET/POST ocultos para ampliar la superficie de ataque.)
- [[Fuzzing Subdomains & Virtual Hosts]] (Búsqueda activa de VHosts en el servidor web mediante cabeceras Host.)
- [[Crawling & Spidering]]] (Mapeo automático de la estructura del sitio siguiendo enlaces.)
       - [[robots.txt]] & [[Well-Known URIs]] (Revisión de archivos estándar que revelan rutas sensibles.)
- [[Asset Discovery & JavaScript Analysis]] (Análisis de archivos JS para encontrar endpoints, claves API, o información oculta.)
- [[CORS Misconfiguration Enumeration]] (Identificación de configuraciones de Cross-Origin Resource Sharing que pueden ser abusadas.)

## 🆔 Fingerprinting & Technology Analysis
  Identificación de tecnologías, frameworks y CMS utilizados.

- [[Fingerprinting Web Technologies]] (Detección del stack tecnológico: Wappalyzer, cabeceras, cookies.)
- [[Visual Reconnaissance with EyeWitness]] (Captura automatizada de capturas de pantalla para identificar servicios visualmente.)
- [[Wappalyzer]] (Herramienta común para el fingerprinting automático de tecnologías web.)


## 🎯 Targeted Technology Enumeration
  Metodologías específicas según el software detectado.

### CMS & Web Apps
- [[WordPress Enumeration]]
- [[Joomla Enumeration]]
- [[Drupal Enumeration]]
- [[Magento Enumeration]]
- [[osTicket Enumeration]]

### CI/CD & Management Tools
- [[Jenkins Enumeration]]
- [[GitLab Enumeration]]
- [[Splunk Enumeration]]
- [[PRTG Network Monitor Enumeration]]

###  Web Servers & Middleware
- [[IIS Enumeration]]
- [[Tomcat Enumeration]]
- [[ColdFusion Enumeration]]
- [[Nginx & Apache Enumeration]] (Enumeración específica para los servidores web más comunes.)


## 🛠 Tooling & Resources
  Arsenal de herramientas categorizado por función.

### Proxies & Clients
   - [[BurpSuite]] (Proxy de intercepción y análisis manual/automatizado.)
   - [[curl]] (Cliente de línea de comandos para peticiones HTTP crudas.)

### Fuzzers & Scanners
   - [[ffuf]] (Fuzzer web rápido para directorios, VHosts y parámetros.)
   - [[gobuster]] (Herramienta clásica para fuerza bruta de URIs y DNS.)
   - [[feroxbuster]] (Fuzzer recursivo escrito en Rust.)
   - [[nikto]] (Escáner de vulnerabilidades web y configuraciones por defecto.)
   - [[git-dumper]] (Herramienta para descargar repositorios `.git` expuestos.)

### Network & DNS Tools
   - [[dig]] (Consultas DNS manuales.)
   - [[dnsenum]] (Enumeración DNS automatizada.)
   - [[rustscan]] (Escaneo de puertos ultrarrápido.)

### Wordlists
  - [[ Seclists]] (Colección de listas para fuzzing de usuarios, contraseñas y directorios.)

***