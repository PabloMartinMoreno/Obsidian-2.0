---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/services
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# DNS Enumeration (53)

***

## Cheatsheet

| Acción                                                                                                                                                                                                                                                             | Descripción                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `sudo nmap -p53 -sV -sC -T4 -v <target-ip>`                                                                                                                                                                                                                        | Escanea el objetivo buscando servicios DNS y proporciona información de versión y scripts.                       |
| **Enumeración general:** `dnsrecon -d <domain>`<br><br>**Brute-force (más profundo):** `dnsrecon -d <domain> -D /usr/share/wordlists/seclists/Discovery/DNS/fierce-hostlist.txt -t brt`<br><br>**Usando nameserver personalizado:** `dnsrecon ... -n <nameserver>` | <br>Realiza enumeración DNS automatizada y avanzada usando [DNSRecon](https://github.com/darkoperator/dnsrecon). |
|                                                                                                                                                                                                                                                                    | Intento exhaustivo de descubrimiento de subdominios/hostnames usando una wordlist.                               |
|                                                                                                                                                                                                                                                                    | Ejecuta DNSRecon contra un nameserver específico.                                                                |
| `host <domain> <optional-nameserver>`                                                                                                                                                                                                                              | Recupera todos los tipos de registros (usa la herramienta `host`, nativa en Linux).                              |
| `host -t <record-type> <domain> <optional-nameserver>`                                                                                                                                                                                                             | Consulta un tipo de registro específico (A, TXT, NS, MX, etc.) usando `host`.                                    |
| `host -l <domain> <nameserver>`                                                                                                                                                                                                                                    | Intenta una transferencia de zona (zone transfer) con `host`.                                                    |
| `host -v ...`                                                                                                                                                                                                                                                      | Salida más detallada (menos “amigable para humanos”) usando `host`.                                              |
| `nslookup <domain> <optional-nameserver>`                                                                                                                                                                                                                          | Recupera todos los tipos de registros usando `nslookup` (herramienta nativa en Windows).                         |
| `nslookup -type=<record-type> <domain> <optional-nameserver>`                                                                                                                                                                                                      | Consulta un tipo de registro específico con `nslookup`.                                                          |
| `nslookup -type=AXFR <domain> <optional-nameserver>`                                                                                                                                                                                                               | Intenta una transferencia de zona (AXFR) con `nslookup`.                                                         |

**Notas importantes:**
- Según RFC 8482, las consultas `ANY` pueden estar deprecated; por eso conviene pedir tipos de registro específicos.
- AXFR se refiere a Asynchronous Full Transfer Zone (transferencia completa de zona).

---

## Descripción general

El **Domain Name System (DNS)** es un sistema descentralizado que traduce nombres de dominio a direcciones IP, permitiendo acceder a sitios mediante direcciones legibles por humanos en lugar de números.

El tráfico DNS suele viajar sin cifrar, por lo que es susceptible a interceptación por ISPs o dispositivos locales. Alternativas cifradas son DNS over TLS (DoT), DNS over HTTPS (DoH) y DNSCrypt.

Si un servidor DNS está mal configurado y permite transferencias de zona anónimas (AXFR), esto puede exponer una copia completa de los registros DNS del dominio: subdominios, estructura interna y otros detalles sensibles.

**Puertos por defecto:** TCP/UDP `53`.

---

## Tipos de registros DNS

|Registro DNS|Descripción|Ejemplo|
|---|--:|---|
|`A`|Resuelve un dominio a una dirección IPv4.|`brunorochamoura.com IN A 203.0.113.45`|
|`AAAA`|Resuelve un dominio a una dirección IPv6.|`brunorochamoura.com IN AAAA 2001:0db8:85a3:0000:0000:8a2e:0370:1234`|
|`MX`|Especifica los servidores de correo responsables del dominio.|`brunorochamoura.com IN MX 10 mail.brunorochamoura.com`|
|`NS`|Lista los servidores DNS (nameservers) del dominio.|`brunorochamoura.com IN NS ns1.mydnsservice.com`|
|`TXT`|Almacena varios tipos de información (validación de dominio, políticas, SPF, etc.).|`brunorochamoura.com IN TXT "BRM"`|
|`CNAME`|Actúa como alias apuntando un nombre a otro dominio.|`www.brunorochamoura.com IN CNAME brunorochamoura.com`|
|`PTR`|Realiza búsquedas inversas (mapea IP → nombre de dominio).|`45.113.0.203.in-addr.arpa IN PTR brunorochamoura.com`|
|`SOA`|Contiene detalles de la zona DNS: servidor primario, contacto administrativo y parámetros de gestión de la zona.|`brunorochamoura.com IN SOA ns1.mydnsservice.com field-manual.brunorochamoura.com (2025010101 4h 2h 2w 1h)`|

**Nota sobre MX:** el número antes del FQDN en un registro MX indica la prioridad — menor número = mayor prioridad.

---

¿Querés que arme este mismo contenido en un cuadro (imagen) estilo cheatsheet listo para imprimir, o lo querés como un archivo Markdown/PDF para descargar?