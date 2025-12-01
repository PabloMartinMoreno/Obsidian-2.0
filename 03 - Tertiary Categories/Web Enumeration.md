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

## Enumeración Web General

### Enumeración Pasiva

* [[Subdomains Passive Enumeration]]
- [[Google Dorking]]

### DNS

* [[DNS Enumeration (53)| DNS Enumeration]]

### Descubrimiento y Fuzzing

* [[Directory & Page Fuzzing]]
* [[Parameter & Value Fuzzing]]
* [[Fuzzing Subdomain & Virtual Host]]

### Fingerprinting

* [[Web Technology Fingerprinting]]

### Crawling y Mapeo

- [[Seclists]]
- [[Crawling]]
- [[robots.txt]]
- [[Well-Known URIs]]

***

## Enumeración de Tecnologías Especificas

- [[ColdFusion Enumeration]]
- [[Drupal Enumeration]]
- [[GitLab Enumeration]]
- [[IIS Enumeration]]
- [[Jenkins Enumeration]]
- [[Joomla Enumeration]]
- [[Magento Enumeration]]
- [[osTicket Enumeration]]
- [[PRTG Network Monitor Enumeration]]
- [[Splunk Enumeration]]
- [[Tomcat Enumeration]]
- [[WordPress Enumeration]]

***

## Herramientas

- [[curl]]
- [[BurpSuite]]
- [[dig]]
- [[dnsenum]]
- [[ffuf]]
- [[gobuster]]
- [[RustScan]]
- [[FeroxBuster]]
- [[EyeWitness]]
- [[Git-Dumper]]
- [[Nikto]]
- [[Whois]]

### Comparaciones

- [[Comparación Comandos de Enumeración DNS]]
















## 🌍 Reconnaissance & Infrastructure
  Recolección inicial de información pasiva y análisis de infraestructura DNS.

   - [[Subdomains Passive Enumeration]] (Búsqueda de subdominios sin contacto directo.)
   - [[Google Dorking]] (Uso de motores de búsqueda para encontrar paneles y archivos expuestos.)
   - [[Enumerating DNS Records]] (Consulta de registros A, CNAME, TXT, transferencias de zona, etc.)
    - [[DNS Enumeration Command Comparison]] (Referencia rápida de comandos para distintas herramientas.)
   - [[Performing Whois Lookup]] (Información de registro de dominio y propietarios.)

## 🔍 Content Discovery & Fuzzing
  Búsqueda activa de directorios ocultos, archivos, parámetros y rutas virtuales.

   - [[Fuzzing Directories & Pages]] (Descubrimiento de recursos ocultos mediante fuerza bruta.)
   - [[Fuzzing Parameters & Values]] (Identificación de parámetros GET/POST ocultos para ampliar la superficie de ataque.)
   - [[Fuzzing Subdomains & Virtual Hosts]] (Búsqueda activa de VHosts en el servidor web mediante cabeceras Host.)
   - [[Crawling & Spidering]] (Mapeo automático de la estructura del sitio siguiendo enlaces.)
       - [[Inspecting robots.txt & Well-Known URIs]] (Revisión de archivos estándar que revelan rutas sensibles.)

## 🆔 Fingerprinting & Technology Analysis
  Identificación de tecnologías, frameworks y CMS utilizados.

   - [[Fingerprinting Web Technologies]] (Detección del stack tecnológico: Wappalyzer, cabeceras, cookies.)
   - [[Visual Reconnaissance with EyeWitness]] (Captura automatizada de capturas de pantalla para identificar servicios visualmente.)

## 🎯 Targeted Technology Enumeration
  Metodologías específicas según el software detectado.

### CMS & Web Apps
   - [[Enumerating WordPress]]
   - [[Enumerating Joomla]]
   - [[Enumerating Drupal]]
   - [[Enumerating Magento]]
   - [[Enumerating osTicket]]

### CI/CD & Management Tools
   - [[Enumerating Jenkins]]
   - [[Enumerating GitLab]]
   - [[Enumerating Splunk]]
   - [[Enumerating PRTG Network Monitor]]

###  Web Servers & Middleware
   - [[Enumerating IIS]]
   - [[Enumerating Tomcat]]
   - [[Enumerating ColdFusion]]

## 🛠 Tooling & Resources
  Arsenal de herramientas categorizado por función.

### Proxies & Clients
   - [[Using BurpSuite]] (Proxy de intercepción y análisis manual/automatizado.)
   - [[Using curl]] (Cliente de línea de comandos para peticiones HTTP crudas.)

### Fuzzers & Scanners
   - [[Using ffuf]] (Fuzzer web rápido para directorios, VHosts y parámetros.)
   - [[Using gobuster]] (Herramienta clásica para fuerza bruta de URIs y DNS.)
   - [[Using FeroxBuster]] (Fuzzer recursivo escrito en Rust.)
   - [[Using Nikto]] (Escáner de vulnerabilidades web y configuraciones por defecto.)
   - [[Using Git-Dumper]] (Herramienta para descargar repositorios `.git` expuestos.)

### Network & DNS Tools
   - [[Using dig]] (Consultas DNS manuales.)
   - [[Using dnsenum]] (Enumeración DNS automatizada.)
   - [[Using RustScan]] (Escaneo de puertos ultrarrápido.)

### Wordlists
  - [[Using Seclists]] (Colección de listas para fuzzing de usuarios, contraseñas y directorios.)
