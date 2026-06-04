---
aliases:
  - Fingerprinting Web Technologies
  - Detección de Tecnologías Web
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
kind: CheatSheet
linked:
  - "[[whatweb]]"
  - "[[wafw00f]]"
  - "[[nmap]]"
  - "[[nuclei]]"
  - "[[Favicon Hashing]]"
  - "[[Cookie Fingerprinting]]"
  - "[[WAF]]"
  - "[[HTTP - Headers]]"
  - "[[HTTP - Cookies y Sesiones]]"
  - "[[Certificate Transparency Logs]]"
  - "[[curl]]"
---
# Web Fingerprinting

Identificar el **stack** (webserver, lenguaje, framework, CMS, WAF y versiones) antes de atacar, combinando señales **pasivas** (headers, cookies, favicon, certificado) y **activas** (probes, herramientas). El objetivo: mapear la superficie y buscar CVEs de versiones conocidas.

---

## 🧰 Herramientas

| Herramienta | Para qué |
|---|---|
| [[whatweb]] | Fingerprint del stack (server, CMS, framework, versión) |
| [[nmap]] | `-sV` + scripts `http-server-header`, `http-headers` |
| [[nuclei]] | Templates `http/technologies/` (bulk) |
| [[wafw00f]] · [[WAF]] | Detección de WAF |
| [[curl]] · [[Curl - Fingerprinting]] | Inspección manual de headers/cookies/error pages |

---

## 📋 HTTP Headers

Inspección manual con [[curl]] — concepto en [[HTTP - Headers]].

![[Curl - Fingerprinting#^curl-fp-headers]]

---

## 🍪 Cookies → Tecnología

![[Cookie Fingerprinting#^cookie-fp]]

---

## 🎯 Favicon Hashing

![[Favicon Hashing#^favicon-hash]]

---

## 💥 Error Pages & Version Disclosure

![[Curl - Fingerprinting#^curl-fp-errors]]

---

## 🌐 Servicios Pasivos (sin tocar el target)

Shodan, Censys, Netcraft, BuiltWith, Wappalyzer online → banners, tech, CVEs, favicon hash, sin enviar una sola petición al target. Ver [[OSINT Methods]] · [[Certificate Transparency Logs]] (SANs del cert → subdominios + org).

---

## Notas relacionadas

- [[Web Enumeración]] (área padre) · [[Web Technology Enumeration]] (enum por-tecnología) · [[whatweb]] · [[wafw00f]] · [[Curl - Fingerprinting]] · [[Favicon Hashing]]
