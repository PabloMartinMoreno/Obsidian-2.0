---
aliases:
tags:
  - type/command
  - tool/dnsenum
  - service/dns
  - protocol/dns
  - port/53
  - technique/recon/active
  - meta/zone-transfer
  - meta/brute-force
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: Command
linked:
  - "[[DNS Enumeration (53)]]"
---
# dnsenum

***

## Cheatsheet

| **Comando**                                                                                              | **Descripción**                                                       |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| <pre><code>`dnsenum example.com`</code></pre>                                                            | <br>Enumeración básica con brute force usando la wordlist por defecto |
| <pre><code>`dnsenum --dnsserver 8.8.8.8 --threads 10 --file subdomain-list.txt example.com`</code></pre> | <br>Con una wordlist personalizada y guarda los resultados            |
| <pre><code>`dnsenum --axfr --rev example.com`</code></pre>                                               | <br>Intenta AXFR explícitamente y hace reverse lookups                |
^dnsenum-enum

| **Comando**                                                                                                                           | **Descripción**                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre><code>dnsenum target.com</code></pre>                                                                                            | **Check Rápido de AXFR**<br>Ejecución por defecto. Lo usas _solo_ para ver si los Nameservers permiten Transferencia de Zona (Zone Transfer) y obtener los registros básicos (A, NS, MX).                      |
| <pre><code>dnsenum --noreverse -f /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt target.com</code></pre> | **Fuerza Bruta Estándar (Eficiente)**<br>El comando de batalla. Usa una wordlist decente (Seclists) y desactiva el _reverse lookup_ (`--noreverse`) para que no tarde una eternidad resolviendo PTRs inútiles. |
| <pre><code>dnsenum --threads 50 -f wordlist.txt target.com</code></pre>                                                               | **Modo Turbo (CTF/HTB)**<br>Sube los hilos a 50 (o más). Úsalo en entornos controlados donde no te importa el ruido y quieres resultados ya.                                                                   |
| <pre><code>dnsenum --dnsserver 1.1.1.1 -f wordlist.txt target.com</code></pre>                                                        | **Bypass de Filtros DNS**<br>Si el DNS de tu red local bloquea peticiones o va lento, fuerza la resolución a través de Cloudflare (1.1.1.1) o Google (8.8.8.8).                                                |
| <pre><code>dnsenum --enum -o output.xml target.com</code></pre>                                                                       | **Auditoría con Evidencia**<br>Guarda todo en XML. Vital si necesitas reportar o si vas a parsear las IPs encontradas luego con `nmap` o `masscan`.                                                            |


```ad-tip
**AXFR:** La herramienta intenta automáticamente una **Transferencia de Zona (AXFR)** en todos los Nameservers (NS) que encuentre. Si tiene éxito, obtendrá todos los subdominios sin necesidad de fuerza bruta.
```

***

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


***

## Notas Relacionadas

- [[DNS Enumeration (53)]]


***