---
aliases:
  - Fingerprinting Web
  - Web Technology Fingerprinting
tags:
  - technique/recon/active
  - technique/recon/passive
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Concept
linked:
  - "[[Web Fingerprinting]]"
  - "[[Web Technology Enumeration]]"
---
# Fingerprinting

Extraer detalles técnicos de las tecnologías que corren un sitio (webserver, OS, lenguaje, framework, CMS, WAF, versiones). Como una huella dactilar identifica a una persona, las "huellas" del stack revelan la infraestructura del target y sus debilidades → permite adaptar el ataque a vulnerabilidades específicas de lo identificado.

> [!tip] Concepto/teoría. La **práctica** (comandos, herramientas, favicon hashing, cookies, headers) vive en [[Web Fingerprinting]].

---

## Por qué importa

- **Ataques dirigidos:** conocer la tech en uso → concentrar esfuerzos en exploits/CVEs conocidos de esos sistemas.
- **Identificar misconfigs:** expone software desactualizado, mal configurado o con defaults.
- **Priorizar objetivos:** ante varios blancos, apuntar a los más probablemente vulnerables.
- **Perfil completo:** combinado con el resto del recon → visión integral de la superficie y vectores.

^fingerprinting-why

---

## Técnicas

| **Técnica** | **Qué hace** | **Señal** |
|---|---|---|
| **Banner Grabbing** | Leer banners del server/servicios | Software + versión |
| **Análisis de headers HTTP** | `Server`, `X-Powered-By`, `X-Generator` | Webserver, lenguaje, framework, CMS |
| **Sondeo (probing)** | Requests diseñadas → respuestas/errores únicos | Tech/versión por comportamiento |
| **Análisis del contenido** | Estructura, scripts, comentarios, `meta generator` | Framework/CMS subyacente |

^fingerprinting-tecnicas

Señales **pasivas** (headers, cookies, favicon, cert) vs **activas** (probes, herramientas) → ver [[Web Fingerprinting]] para el cómo.

---

## Notas relacionadas
- [[Web Fingerprinting]] (cheatsheet / hub práctico) · [[Web Technology Enumeration]] · [[whatweb]] · [[wafw00f]]
