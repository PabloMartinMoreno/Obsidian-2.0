---
aliases:
tags:
  - type/cheatsheet
  - service/dns
  - protocol/dns
  - port/53
  - tool/nmap
  - tool/dnsrecon
  - tool/nslookup
  - tool/host
  - meta/zone-transfer
  - meta/records
  - technique/recon/active
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[Dig]]"
  - "[[nslookup]]"
---
# DNS Enumeration (53)

***

## Cheatsheet

````tabs
tab: **dig**
![[Dig#^dig-enum-pasiva]]

tab: **nslookup**

tab: **dnsrecon**

tab: **host**
````

| **Acción**                                                                                                                                                                                                                                                                                                                                                                                                        | **Descripción**                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br><br>`sudo nmap -p53 -sV -sC -T4 -v <target-ip>`                                                                                                                                                                                                                                                                                                                                                               | Escanea el objetivo buscando servicios DNS y proporciona información de versión y scripts.                                                                                                                                                        |
| <br>**Enumeración general:** <br>`dnsrecon -d <domain>`<br><br>**Brute-force (más profundo):** <br>`dnsrecon -d <domain> -D /usr/share/wordlists/seclists/Discovery/DNS/fierce-hostlist.txt -t brt`<br><br>**Usando nameserver personalizado:** <br>`dnsrecon ... -n <nameserver>`                                                                                                                                | <br><br>Realiza enumeración DNS automatizada y avanzada usando [DNSRecon](https://github.com/darkoperator/dnsrecon).                                                                                                                              |
| <br><br>**Recupera todos los tipos de registros:**<br>`host <domain> <optional-nameserver>`<br><br>**Consulta un tipo de registro específico (por ejemplo, A, TXT, NS, MX):**<br>`host -t <record-type> <domain> <optional-nameserver>`<br><br>**Intenta una transferencia de zona:**<br>`host -l <domain> <nameserver>`<br><br>**Resultados más fáciles de entender para los humanos:**<br>`host -v ...`<br><br> | <br><br>Utiliza el comando host, una herramienta nativa de Linux, para consultar registros DNS, incluidos tipos de registros específicos, e intentar transferencias de zona.                                                                      |
| <br><br><br>**Recupera todos los tipos de registros:**<br>`nslookup <domain> <optional-nameserver>`<br><br>**Consulta un tipo de registro específico (por ejemplo, A, TXT, NS, MX):**<br>`nslookup -type=<record-type> <domain> <optional-nameserver>`<br><br>**Intenta una transferencia de zona: **<br>`nslookup -type=AXFR <domain> <optional-nameserver>`                                                     | Utiliza nslookup, una herramienta nativa de Windows, para consultar registros DNS de forma interactiva o directamente desde la línea de comandos. También puede intentar transferencias de zona, aunque la mayoría de los servidores lo bloquean. |
**Notas importantes:**
- Según RFC 8482, las consultas `ANY` pueden estar deprecated; por eso conviene pedir tipos de registro específicos.
- AXFR se refiere a Asynchronous Full Transfer Zone (transferencia completa de zona).

## Enumeración DNS

| Comando                            | Descripción                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `nslookup $TARGET`                 | Identifica el registro **A** del dominio objetivo.             |
| `nslookup -query=A $TARGET`        | Identifica el registro **A** del dominio objetivo.             |
| `dig $TARGET @<nameserver/IP>`     | Identifica el registro **A** del dominio objetivo.             |
| `dig a $TARGET @<nameserver/IP>`   | Identifica el registro **A** del dominio objetivo.             |
| `nslookup -query=PTR <IP>`         | Identifica el registro **PTR** de la dirección IP objetivo.    |
| `dig -x <IP> @<nameserver/IP>`     | Identifica el registro **PTR** de la dirección IP objetivo.    |
| `nslookup -query=ANY $TARGET`      | Identifica **todos los registros (ANY)** del dominio objetivo. |
| `dig any $TARGET @<nameserver/IP>` | Identifica **todos los registros (ANY)** del dominio objetivo. |
| `nslookup -query=TXT $TARGET`      | Identifica los registros **TXT** del dominio objetivo.         |
| `dig txt $TARGET @<nameserver/IP>` | Identifica los registros **TXT** del dominio objetivo.         |
| `nslookup -query=MX $TARGET`       | Identifica los registros **MX** del dominio objetivo.          |
| `dig mx $TARGET @<nameserver/IP>`  | Identifica los registros **MX** del dominio objetivo.          |

dig inlanefreight.com
dig +short inlanefreight.com
dig -x 134.209.24.248
dig MX facebook.com


---

## Overview

El *Domain Name System (DNS)* **es un sistema descentralizado que traduce nombres de dominio a direcciones IP**, permitiendo acceder a sitios mediante direcciones legibles por humanos en lugar de números.

**El DNS no solo traduce nombres a IPs. Su verdadero propósito es almacenar y distribuir información sobre un dominio.**
Un dominio no solo necesita saber a qué IP apuntar (para la web), sino también:
- a dónde enviar correos,
- cómo validar identidades,
- qué servidores son los oficiales,
- qué servicios existen asociados,
- e incluso datos de verificación o seguridad.
Por eso el DNS tiene diferentes tipos de registros, no solo el de tipo A (IP).

**Puertos por defecto:** TCP/UDP `53`.

### Toda esta información puede revelar

- Infraestructura interna.
- Subdominios (pistas de hosts internos o paneles de administración).
- Servidores de correo y tecnología usada.
- Correos o contactos técnicos reales.
- Configuraciones débiles (por ejemplo, si el AXFR está abierto).
- Validaciones de seguridad (SPF, DKIM, DMARC en TXT).

```ad-attention
El tráfico DNS suele viajar sin cifrar, por lo que es susceptible a interceptación por ISPs o dispositivos locales. Alternativas cifradas son DNS over TLS (DoT), DNS over HTTPS (DoH) y DNSCrypt.
```

### Tipos de registros DNS

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
**Nota sobre el registro SOA** (Start of Authority) define información clave sobre la zona DNS de un dominio, incluyendo el servidor autoritativo principal, detalles de la versión, intervalos de actualización y ajustes de gestión de la zona. También incluye la dirección de correo electrónico del administrador del dominio.

**Nota sobre MX:** el número antes del FQDN en un registro MX indica la prioridad — menor número = mayor prioridad.

---
