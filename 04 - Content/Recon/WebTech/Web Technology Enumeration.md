---
aliases:
  - "whatweb"
  - Web Tech Enumeration
tags:
  - type/moc
  - asset/web-app
  - technique/recon/active
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Enumeration]]"
kind: Concept
linked:
  - "[[ColdFusion Enumeration]]"
  - "[[Drupal Enumeration]]"
  - "[[GitLab Enumeration]]"
  - "[[IIS Enumeration]]"
  - "[[Jenkins Enumeration]]"
  - "[[Joomla Enumeration]]"
  - "[[Magento Enumeration]]"
  - "[[PRTG Network Monitor Enumeration]]"
  - "[[Splunk Enumeration]]"
  - "[[Tomcat Enumeration]]"
  - "[[WordPress Enumeration]]"
  - "[[osTicket Enumeration]]"
  - "[[Fingerprinting Web Technologies]]"
---
# Web Technology Enumeration

***

## Overview

Índice de técnicas de enumeración para tecnologías y aplicaciones web específicas. Cada atómica cubre:
- Detección de la tecnología (headers, favicons, paths, rutas default).
- Endpoints administrativos y puntos de autenticación típicos.
- Versiones vulnerables conocidas y CVEs relevantes.
- Default credentials habituales.
- Rutas de escalada post-identificación.

El workflow general es: **fingerprinting → enumeración específica → búsqueda de CVEs → explotación**.

***

## CMS

- [[WordPress Enumeration]] — CMS más extendido, `wp-login.php`, `/wp-json/wp/v2/users/`, `wpscan`.
- [[Joomla Enumeration]] — `/administrator/`, `/api/index.php/v1/config/application`.
- [[Drupal Enumeration]] — `/CHANGELOG.txt`, `?q=admin`, módulos vulnerables.
- [[Magento Enumeration]] — e-commerce, `/admin/`, versión en `magento_version`.

## CI/CD y DevOps

- [[Jenkins Enumeration]] — `/script` (Groovy console → RCE si autenticado), `/asynchPeople/`.
- [[GitLab Enumeration]] — `/explore`, `/users/sign_in`, API `/api/v4/projects`.

## Application Servers

- [[Tomcat Enumeration]] — `/manager/html`, default creds `tomcat:tomcat`, war upload → RCE.
- [[IIS Enumeration]] — `Server:` header, `/trace.axd`, short-name enum, tildes bug.
- [[ColdFusion Enumeration]] — `/CFIDE/administrator/`, versiones pre-11 con deserialization.

## Monitoring / Support

- [[Splunk Enumeration]] — `/en-US/account/login`, Splunk REST API, custom apps.
- [[PRTG Network Monitor Enumeration]] — `:8080/public/login.htm`, CVE-2018-9276.
- [[osTicket Enumeration]] — `/scp/login.php`, file upload vulns.

## Recursos relacionados

- [[Fingerprinting Web Technologies]] — identificación inicial antes de enum específica.
- [[Crawling]] — descubrir endpoints administrativos.
- [[Web Fuzzing]] — fuerza bruta de paths cuando fingerprinting no revela.

***
