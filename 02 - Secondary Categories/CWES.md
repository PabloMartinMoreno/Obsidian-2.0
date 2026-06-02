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
  - "[[CWES - Checklists]]"
  - "[[Web Enumeración]]"
  - "[[Web Explotación]]"
---
# CWES

---

## Temario

### 1. 🌐 Web Requests & Fundamentos

Cómo viaja una petición y cómo manipularla. Base de todo lo demás.

- [[HTTP]] · [[HTTPS]] 
- [[HTTP - Basic Auth]]
- [[GET]] · [[POST]]
- Extras: [[Web Content Types]] · [[URL Encode - Characters]]
- Herramienta: [[curl]]

### 2. 🆔 Footprinting & Fingerprinting

Identificar servidor, stack, CMS y contenido estándar antes de atacar.

- [[Web Fingerprinting]]
- [[robots.txt]] · [[Well-Known URIs]]
- [[Source Code Disclosure]] · [[Information Leakage]]
- [[Source Code Review]]

### 3. 🔑 Gestión de Identidad, Autenticación y Sesiones

- [[Authentication & Authorization Bypass]]
- [[HTTP - Basic Auth]]
- [[HTTP Brute Forcing]]
- [[Default credentials]] · [[Password Reuse]]
- [[Session Hijacking]]
- [[JWT Attacks]] · [[OAuth 2.0 Misconfigurations]]

### 4. 💉 Input Validation & Injection

- [[Cross-Site Scripting (XSS)]] · [[HTML Injection]]
- [[SQL Injection (SQLi)]] · [[NoSQL Injection]]
- [[OS Command Injection]]
- [[LDAP Injection]]

### 5. 📂 File Upload & Inclusion

- [[File Upload - Vulnerabilidades]]
- [[File Inclusion]] (LFI) · [[Remote File Inclusion (RFI)]]
- [[Directory Traversal]]

### 6. 🔌 Ataques del Lado del Servidor

- [[Server-Side Request Forgery (SSRF)]]
- [[Server-Side Includes (SSI) Injection]] · Edge Side Includes (ESI)
- [[Server-Side Template Injection (SSTI)]]
- [[XML External Entity (XXE)]]
- [[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]
- [[Insecure Deserialization]]

### 7. 🔗 API & Web Services

- [[API Security]]
- [[API Fuzzing]] · [[API Enumeration]]
- [[GraphQL Injection]]
- [[Mass Assignment]]
- [[HTTP Parameter Pollution]]
- SOAP

### 8. 📰 Explotación de WordPress

- [[WordPress Enumeration]]
- [[WordPress Exploitation]]

---

## Recursos

- Checklist operativo: [[CWES - Checklists]]
- Hubs base: [[Web Enumeración]] · [[Web Explotación]]
- Tracker de pendientes global: [[Incompletos]]
