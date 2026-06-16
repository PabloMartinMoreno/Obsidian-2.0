---
aliases:
  - OSINT - Dominios, Sitios Web e Infraestructura
  - Domain OSINT
  - Infrastructure OSINT
tags:
  - technique/recon/passive
  - asset/domain
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: CheatSheet
linked:
  - "[[OSINT]]"
  - "[[OSINT - Reverse Image Search]]"
  - "[[Passive Infrastructure Identification]]"
---
# OSINT - Domain & Infrastructure

> [!info] Overview
> Reconocimiento **pasivo** de un dominio: WHOIS, DNS, certificados, subdominios, hosting y stack — todo sobre registros públicos, sin tocar el objetivo. Brute force activo de subdominios/directorios ya requiere autorización.

---

## WHOIS y DNS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `whois ejemplo.com` | Registrador, fecha de creación/expiración, name servers | Dominio recién creado + privacidad = bandera roja de estafa |
| `dig ejemplo.com ANY` | Todos los registros | Mapa general |
| `dig ejemplo.com MX` | Proveedor de correo (Google/Microsoft) | Stack de email |
| `dig ejemplo.com TXT` | Verificaciones SaaS (Workspace, M365) | Inteligencia gratis del stack |
^dom-whois-dns

> Desde GDPR el titular suele venir **redactado** (privacidad). Fecha de creación, registrador y NS siguen sirviendo. Web: **DNSdumpster**, **viewdns.info**, **SecurityTrails**.

## Subdominios (superficie de ataque)

| **Fuente** | **Uso** | **Qué obtenés** |
|:---|:---|:---|
| **crt.sh** | `%.ejemplo.com` (web) | Subdominios vía Certificate Transparency logs — **cero contacto** con el objetivo |
| **subfinder** | `subfinder -d ejemplo.com` | Agrega muchas fuentes pasivas |
| **amass** (passive) | `amass enum -passive -d ejemplo.com` | Enumeración pasiva amplia |
| **assetfinder** | `assetfinder ejemplo.com` | Subdominios desde fuentes públicas |
^dom-subdominios

## Infraestructura y Hosting

| **Recurso** | **Qué obtenés** |
|:---|:---|
| **bgp.he.net** (Hurricane Electric) | Rangos de IP y ASN del proveedor |
| **ipinfo.io** | Datos rápidos de una IP |
| **viewdns reverse IP** | Otros dominios en el mismo servidor |
| **Shodan / Censys** | Puertos, servicios y banners expuestos (ya escanearon internet) |
^dom-infra

## Tecnología e Historial

| **Recurso** | **Qué obtenés** |
|:---|:---|
| **Wappalyzer / BuiltWith** | Stack del sitio: CMS, frameworks, analytics, hosting |
| **SpyOnWeb** | Sitios con el mismo Google Analytics/AdSense ID → redes de sitios relacionados |
| **Wayback Machine** (`web.archive.org`) | Versiones históricas, contenido borrado |
| **urlscan.io** | Análisis aislado de una URL (screenshot, requests, tech) **sin visitarla** |
^dom-tech

> [!example] Verificar si un sitio es estafa
> WHOIS (fecha creación) + urlscan (qué hace por detrás) + reverse IP (vecinos) + BuiltWith (plantilla copiada) + el logo por [[OSINT - Reverse Image Search]] (¿a quién imitan?).
