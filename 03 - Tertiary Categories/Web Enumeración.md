---
aliases:
  - Web Enumeration
  - Enumeración Web
tags:
  - technique/recon/active
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
kind: Tertiary Category
linked:
  - "[[Web Explotación]]"
  - "[[Passive Reconnaissance & OSINT]]"
  - "[[Web Technology Enumeration]]"
  - "[[Web Fingerprinting]]"
---
# Enumeración Web

---

## 🆔 Fingerprinting & Technology Analysis
  Identificación de tecnologías, frameworks, WAF y CMS utilizados.

- [[Web Fingerprinting]] (Detección del stack: WhatWeb, Wappalyzer, `wafw00f` para WAF.)
- [[SSL - TLS]] (Recon del certificado: los SANs revelan subdominios/hosts; enum de ciphers y versión TLS.)
- [[Visual Recon]] (Screenshots automatizados para identificar servicios visualmente.)


## 🔍 Content Discovery & Fuzzing
  Búsqueda activa de directorios ocultos, archivos, parámetros y rutas virtuales.

- [[Directory Fuzzing]] (Descubrimiento de recursos ocultos mediante fuerza bruta.)
- [[Parameter Fuzzing]] (Identificación de parámetros GET/POST ocultos para ampliar la superficie de ataque.)
- [[Subdomain & VHost Fuzzing]] (Descubrimiento **activo** de VHosts/subdominios vía cabecera Host y wordlists.)
- [[Subdomains Passive Enumeration]] & [[Certificate Transparency Logs]] (Descubrimiento **pasivo** de subdominios vía CT logs / crt.sh / OSINT — sin tocar el target.)
- [[Crawling]] (Mapeo automático de la estructura del sitio siguiendo enlaces.)
- [[robots.txt]] & [[Well-Known URIs]] (Archivos estándar que revelan rutas sensibles.)
- [[API Enumeration]] (Descubrir y mapear endpoints de API: REST, GraphQL, Swagger/`/docs`.)
- [[Cloud Enumeration]] (Buckets S3/Azure/GCP y metadatos cloud expuestos en assets web.)


## 🔓 Vulnerability & Leak Scanning
Búsqueda automatizada de fallos conocidos y exposiciones.

- [[Vulnerability Scanning]] ([[nikto]], Nuclei.)
- [[Source Code Disclosure]] ([[git-dumper]], [[.ds_store]], backups.)
- [[Source Code Review]] (Análisis del HTML/JS servido: secrets, API keys, endpoints internos, comentarios.)
- [[JavaScript Analysis]] (Enumerar archivos `.js` por endpoints, parámetros y credenciales hardcodeadas.)
- [[CORS Misconfiguration]] (Políticas CORS permisivas que habilitan lectura de datos cross-origin.)


## 🎯 Targeted Technology Enumeration
  Metodologías específicas según el software detectado.

- [[Web Technology Enumeration]] — índice por tecnología: CMS (WordPress, Joomla, Drupal, Magento), CI/CD (Jenkins, GitLab), app servers (Tomcat, IIS, ColdFusion) y monitoring (Splunk, PRTG, osTicket).


---

**Ver también:** [[Passive Reconnaissance & OSINT]] · [[Web Explotación]]
