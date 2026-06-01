---
aliases:
  - Reconnaissance
tags:
  - technique/discovery
kind: Concept
linked:
  - "[[Information Gathering]]"
  - "[[Passive Reconnaissance & OSINT]]"
---
# Recon

> [!info]
> Recopilación de información sobre target previo al ataque. Dos fases: **passive** (sin contacto directo) y **active** (envío de paquetes al target).

***

## Passive (sin tocar target)

- OSINT (Google Dorking, GitHub Dorking, social media)
- DNS records (público) + Certificate Transparency
- Whois, BGP, ASN
- Shodan / Censys / FOFA
- Wayback Machine (versiones históricas del site)
- LinkedIn / employee enum

Ver [[Passive Reconnaissance & OSINT]].

***

## Active (envía paquetes)

| Capa | Tools |
|---|---|
| **L3-L4 (network)** | nmap, masscan, rustscan |
| **DNS** | dig, dnsenum, dnsrecon, sublister |
| **Subdomain** | amass, subfinder, ffuf (vhost mode) |
| **HTTP** | curl, ffuf, feroxbuster, gobuster |
| **CMS specific** | wpscan, droopescan, joomscan |
| **AD** | nmap scripts, ldapsearch, BloodHound |

***

## MOCs relacionados

- [[Information Gathering]] — secondary MOC
- [[Web Enumeración]] — tertiary
- [[Active Directory Enumeración]] — tertiary
- [[Host & Network Enumeration]] — tertiary
- [[Cloud Enumeration]] — tertiary

***

## Recursos

- [Reconnaissance MITRE TA0043](https://attack.mitre.org/tactics/TA0043/)
- HackTricks recon flows
