---
aliases:
tags:
  - technique/recon/active
  - asset/network
  - service/dns
  - tool/dnsenum
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
kind: Tool
linked:
  - "[[DNS (53) - Enumeración]]"
---
# dnsenum

---

## Cheatsheet

| **Comando**                                                                                              | **Situación / Objetivo**                                                                                                            |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>`dnsenum dominio.com`</code></pre>                                                            | <br>**Reconocimiento inicial:** Lanza todo lo básico: intenta transferencia de zona (AXFR) y prueba la lista default.               |
| <pre><code>`dnsenum --noreverse -f seclists.txt dominio.com`</code></pre>                                | <br>**Escaneo estándar:** Usa una wordlist real (SecLists) y salta el reverse lookup para no perder tiempo.                         |
| <pre><code>dnsenum --enum -o reporte.xml dominio.com</code></pre>                                        | <br>**Atajo completo:** hace scraping, fuerza bruta, AXFR y reverse lookup.                                                         |
| <pre><code>`dnsenum --dnsserver 8.8.8.8 --threads 10 --file subdomain-list.txt dominio.com`</code></pre> | <br>**Uso personalizado:** define servidor DNS, aumenta hilos y usa wordlist propia.                                                |
| <pre><code>`dnsenum --axfr --rev dominio.com`</code></pre>                                               | <br>Intenta AXFR explícitamente y hace reverse lookups.                                                                             |
| <pre><code>`dnsenum --dnsserver 1.1.1.1 -f wordlist.txt dominio.com`</code></pre>                        | <br>**Evasión de filtros:** Fuerza la resolución por Cloudflare/Google para evitar bloqueos o lentitud del DNS local.               |
| <pre><code>`dnsenum -r -f wordlist.txt dominio.com`</code></pre>                                         | <br>**Enumeración profunda (Recursiva):** Si encuentra `dev.example.com`, busca subdominios dentro de ese también.                  |
| <pre><code>`dnsenum --private -f wordlist.txt dominio.com`</code></pre>                                  | <br>**Auditoría interna:** Muestra y guarda las IPs privadas detectadas (192.168.x.x, 10.x.x.x) para reportar fugas de información. |
| <pre><code>`dnsenum --subfile validos.txt -f wordlist.txt dominio.com`</code></pre>                      | <br>**Pipeline:** Genera un archivo limpio solo con los subdominios válidos para pasárselo a herramientas como `httpx` o `nmap`.    |
^dnsenum-enum


```ad-tip
**AXFR:** La herramienta intenta automáticamente una **Transferencia de Zona (AXFR)** en todos los Nameservers (NS) que encuentre. Si tiene éxito, obtendrá todos los subdominios sin necesidad de fuerza bruta.
```

---

## Overview

**Su objetivo principal es recopilar la mayor cantidad posible de información sobre un dominio para expandir la superficie de ataque.**

```ad-note
A diferencia de herramientas simples como `nslookup` o `dig`, DNSenum automatiza múltiples consultas y técnicas de recolección en un solo proceso.
```

### Funciones Principales

DNSenum no se limita a buscar la IP de un sitio; realiza una serie de pasos lógicos para "mapear" la infraestructura de red del objetivo:

- **Resolución de registros estándar:** Obtiene direcciones IPv4 (A), servidores de nombres (NS) y servidores de correo (MX).
- **Transferencia de Zona (AXFR):** Intenta replicar toda la base de datos de un servidor DNS. Si el servidor está mal configurado, esto revela todos los subdominios y direcciones IP internas.
- **Google Scraping:** Utiliza el motor de búsqueda de Google para encontrar subdominios adicionales que podrían no estar en los registros públicos directos.
- **Ataque de fuerza bruta:** Utiliza un diccionario de palabras para adivinar subdominios (ej: `dev.objetivo.com`, `vpn.objetivo.com`).
- **Búsqueda inversa (Reverse Lookup):** Dada una red o rango de IPs, busca qué nombres de dominio están asociados a ellas.
- **Cálculo de rangos de red:** Identifica y calcula rangos de red de clase C para realizar escaneos posteriores.


> [!IMPORTANT]
> 
> Nota de Seguridad: Realizar transferencias de zona o fuerza bruta agresiva puede ser detectado por sistemas de prevención de intrusos (IPS). Asegúrate de tener autorización antes de usar esta herramienta contra dominios que no te pertenecen.


---

## Notas Relacionadas

- [[DNS (53) - Enumeración]]


---