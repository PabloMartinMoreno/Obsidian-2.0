---
aliases:
  - CWES Exam
  - CWES Prep
tags:
  - cert/cwes
  - asset/web-app
primary categories:
  - "[[Red Team]]"
kind: Secondary Category
linked:
  - "[[CWES - Carta de Compromiso]]"
  - "[[CWES - Checklist]]"
  - "[[CWES - Maquinas]]"
  - "[[Web Enumeración]]"
  - "[[Web Explotación]]"
  - "[[CWES - Examen]]"
---
# CWES

Mapa alineado **1:1 con los módulos del path HTB** del examen *Certified Web Exploitation Specialist*. El orden sigue el path (fundamentos → recon → vulnerabilidades por clase → aplicaciones comunes). Cada sección = uno o más módulos.

---

## Temario

### 1. 🌐 Web Requests

> Módulo: *Web Requests*. Cómo viaja y se manipula una petición. Base de todo.

- [[HTTP]] · [[HTTPS]] · [[Flujo de Comunicación HTTP]] · [[Flujo de Comunicación HTTPS]]
- [[HTTP - Métodos]] · [[HTTP - Códigos de Estado]] · [[HTTP - Headers]] · [[HTTP - Cookies y Sesiones]]
- [[GET]] · [[POST]] · [[HTTP - Basic Auth]]
- [[URL]] · [[URL Encode - Characters]]
- Herramienta: [[curl]]

### 2. 🧱 Introduction to Web Applications

> Módulo: *Introduction to Web Applications*. Arquitectura front-end / back-end.

- [[Web]] (front-end vs back-end) · [[DOM]] · [[WebSockets]]
- [[API REST]] · [[Web Content Types]]
- Defensa relevante: [[Sanitización]] · [[WAF]] · [[HSTS]]

### 3. 🕵️ Using Web Proxies

> Módulo: *Using Web Proxies*. Interceptar, modificar y repetir tráfico.

- [[Burp Suite]] · [[Param Miner]]

### 4. 🆔 Information Gathering - Web Edition

> Módulo: *Information Gathering - Web Edition*. Identificar stack, contenido y superficie.

- Hub: [[Information Gathering - Web Edition]]
- Fingerprinting: [[Web Fingerprinting]] · [[Fingerprinting]] · [[Cookie Fingerprinting]] · [[Favicon Hashing]] · [[Web Technology Enumeration]]
- Contenido estándar: [[robots.txt]] · [[Well-Known URIs]] · [[Crawling]]
- Subdominios / VHosts: [[Subdomains Passive Enumeration]] · [[Subdomain Bruteforcing]] · [[Virtual Host]]
- Fugas / código: [[Information Leakage]] · [[Source Code Review]]
- Tools: [[whatweb]] · [[wafw00f]] · [[nikto]]

### 5. 🔀 Web Fuzzing

> Módulo: *Web Fuzzing*. Descubrir directorios, parámetros y vhosts ocultos.

- Hub: [[Web Fuzzing]]
- [[Directory Fuzzing]] · [[Parameter Fuzzing]] · [[Subdomain & VHost Fuzzing]] · [[Filtrado de salida de fuzzing]]
- Tools: [[ffuf]] · [[feroxbuster]] · [[gobuster]]

### 6. 📜 JavaScript Deobfuscation

> Módulo: *JavaScript Deobfuscation*. Revertir ofuscación de código client-side.

- Concepto: [[ReverseEngineering/JavaScript Deobfuscation|JavaScript Deobfuscation]]
- Tooling: [[JavaScript Deobfuscation - Tooling|JavaScript Deobfuscation (tooling)]] · [[deobfuscation simple]] · [[Detectar tipo de codificacion]]

### 7. 💥 Cross-Site Scripting (XSS)

> Módulo: *Cross-Site Scripting (XSS)*.

- [[Cross-Site Scripting (XSS)]]
- Relacionado: [[HTML Injection]]

### 8. 💉 SQL Injection (+ SQLMap)

> Módulos: *SQL Injection Fundamentals* + *SQLMap Essentials*.

- [[SQL Injection (SQLi)]] · [[Subverting Query Logic]]
- Otras inyecciones a DB/directorio: [[NoSQL Injection]] · [[LDAP Injection]]
- Tool: [[sqlmap]]
- Referencia SQL: [[SQL Commands]]

### 9. 🖥️ Command Injection

> Módulo: *Command Injections*.

- [[OS Command Injection]] · [[Remote Code Execution]]

### 10. 📂 File Upload & File Inclusion

> Módulos: *File Upload Attacks* + *File Inclusion*.

- Upload: [[File Upload - Vulnerabilidades]]
- Inclusion: [[File Inclusion]] (LFI) · [[Remote File Inclusion (RFI)]]
- [[Directory Traversal]] · [[Arbitrary File Read]]

### 11. 🔌 Server-Side Attacks

> Módulo: *Server-side Attacks*. SSRF, SSTI, SSI, XSLT.

- [[Server-Side Request Forgery (SSRF)]]
- [[Server-Side Template Injection (SSTI)]]
- [[Server-Side Includes (SSI) Injection]]
- [[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]

### 12. 🔑 Login Brute Forcing & Broken Authentication

> Módulos: *Login Brute Forcing* + *Broken Authentication*.

- Brute forcing: [[HTTP Brute Forcing]] · [[Default credentials]] · [[Password Reuse]]
- Bypass: [[Authentication & Authorization Bypass]]
- Sesiones / tokens: [[Session Hijacking]] · [[JWT Attacks]] · [[OAuth 2.0 Misconfigurations]]
- Tools: [[Hydra]] · [[Seclists]]

### 13. 🎯 Web Attacks

> Módulo: *Web Attacks*. HTTP Verb Tampering, IDOR, XXE.

- HTTP Verb Tampering → sección en [[Authentication & Authorization Bypass]]
- IDOR: [[BOLA - IDOR]]
- [[XML External Entity (XXE)]]

### 14. 🔗 Attacking GraphQL

> Módulo: *Attacking GraphQL*.

- [[GraphQL Injection]]

### 15. 🔌 API Attacks

> Módulo: *API Attacks*.

- [[API Security]] · [[API REST]]
- [[API Fuzzing]]
- [[Mass Assignment]] · [[HTTP Parameter Pollution]]

### 16. 📰 Attacking Common Applications

> Módulo: *Attacking Common Applications*. CMS, app servers, CI/CD, monitoring.

- CMS: [[WordPress Enumeration]] · [[WordPress Exploitation]] · [[Joomla Enumeration]] · [[Drupal Enumeration]] · [[Magento Enumeration]]
- App servers: [[Tomcat Enumeration]] · [[IIS Enumeration]] · [[IIS Exploitation]] · [[nginx]]
- CI/CD & DevOps: [[Jenkins Enumeration]] · [[Jenkins Exploitation]] · [[GitLab Enumeration]]
- Monitoring / otros: [[Splunk Enumeration]] · [[PRTG Network Monitor Enumeration]] · [[osTicket Enumeration]] · [[ColdFusion Enumeration]] · [[ActiveMQ]] · [[Log4J]]
- Tools: [[wpscan]] · [[searchsploit]]

---

## Complementario (fuera del temario CWES)

Notas del vault sobre clases de vuln **no cubiertas por los módulos del path** (origen PortSwigger). Útiles, pero no entran en el examen — separadas para mantener el temario honesto.

- [[Cross-Site Request Forgery (CSRF)]] · [[Clickjacking]] · [[Open Redirect]]
- [[CRLF Injection]] · [[Host Header Injection]] · [[HTTP Request Smuggling]]
- [[Web Cache Poisoning]] · [[Prototype Pollution]] · [[Race Conditions]]
- [[Subdomain Takeover]] · [[Insecure Deserialization]]

---

## Recursos

- Checklist operativo: [[CWES - Checklist]]
- Máquinas de práctica: [[CWES - Maquinas]]
- Hubs base: [[Web Enumeración]] · [[Web Explotación]] · [[Web Fundamentals]]
- Tracker de pendientes global: [[Incompletos]]
