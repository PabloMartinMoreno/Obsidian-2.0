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
| <pre><code>`dnsenum --dnsserver 8.8.8.8 --threads 10 --file subdomain-list.txt example.com`</code></pre> | <br>Con una wordlist personalizada y guardando resultados             |
| <pre><code>`dnsenum --axfr --rev example.com`</code></pre>                                               | <br>Intenta AXFR explícitamente y hace reverse lookups                |
^dnsenum-enum

|**Acción**|**Comando**|**¿Por qué usarlo?**|
|---|---|---|
|**Escaneo Total**|`dnsenum --enum dom.com`|Es el "modo automático". Hace todo lo importante de una vez.|
|**Fuerza Bruta**|`-f /ruta/dict.txt`|Encuentra subdominios ocultos que no aparecen en registros públicos.|
|**Velocidad**|`--threads 10`|Reduce el tiempo de espera. Por defecto es lento; 10 es un buen balance.|
|**Ahorro de Tiempo**|`--noreverse`|Evita la búsqueda inversa de IPs. Útil si solo te interesan los nombres.|
|**Sigilo (Google)**|`-p 0`|Desactiva el raspado de Google para evitar bloqueos de IP o captchas.|
|**Exportar**|`-o reporte.xml`|Fundamental para guardar la evidencia y usarla en otras herramientas.|
|**DNS Específico**|`--dnsserver 8.8.8.8`|Útil si el servidor DNS local está filtrando o bloqueando tus consultas.|

### 💡 El comando "definitivo" para Pentesting:

Bash

```
dnsenum --enum -f /usr/share/dnsenum/dns.txt --threads 12 -o resultado.xml objetivo.com
```

**Tip:** En Kali Linux, el mejor diccionario para empezar está en: `/usr/share/dnsenum/dns.txt`
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



***