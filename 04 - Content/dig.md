---
aliases:
  - Domain Information Groper
tags:
  - type/command
  - type/tool
  - technique/recon/active
  - asset/infrastructure
  - asset/network
  - service/dns
  - tool/dig
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: Command
linked:
  - "[[DNS (53) - Enumeración]]"
  - "[[DNS]]"
  - "[[DNS - Herramientas]]"
  - "[[nslookup]]"
---
# Dig - Domain Information Groper

***

## Cheatsheet

| **Comando**                                                                                   | **Descripción**                                                                                                |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| <pre><code>dig example.com</code></pre>                                                       | <br>Consulta estándar. Devuelve registros A (IPv4) y mucha info técnica (headers, flags).                      |
| <pre><code>dig example.com +short</code></pre>                                                | <br>Devuelve **solo la IP**. Ideal para scripts o pipelines (limpia toda la "basura" visual).                  |
| <pre><code>dig example.com MX +short</code></pre>                                             | <br>Obtiene solo los servidores de correo (Mail Exchange).                                                     |
| <pre><code>dig example.com NS +short</code></pre>                                             | <br>Obtiene los **Nameservers**. Vital para saber a quién atacar luego (ej: intentar AXFR).                    |
| <pre><code>dig example.com TXT</code></pre>                                                   | <br>Busca registros de texto. Fundamental en OSINT para ver SPF, DMARC o validaciones de dominio.              |
| <pre><code>dig @8.8.8.8 example.com</code></pre>                                              | <br>Realiza la consulta preguntándole a un servidor específico (Google) en vez de al local.                    |
| <pre><code>dig axfr inlanefreight.htb @10.129.187.216</code></pre>                            | <br>**Transferencia de Zona**. Solicita la base de datos completa del dominio al servidor específico.          |
| <pre><code>dig -x 192.168.1.10</code></pre>                                                   | <br>**Reverse Lookup**. Averigua qué dominio (PTR) corresponde a esa dirección IP.                             |
| <pre><code>dig +trace example.com</code></pre>                                                | <br>Traza el camino completo de la resolución DNS desde la raíz hasta el dominio (para debugging).             |
| <pre><code>dig example.com ANY +noall +answer</code></pre>                                    | <br>Intenta pedir "todo" lo que tenga (ANY) y formatea la salida limpia mostrando solo la respuesta.           |
^dig-enum

***

## Overview

Es una herramienta de diagnóstico que funciona como un "interrogador" de servidores. O sea, para realizar consultas a los servidores de nombres [[DNS]].

### Tipos de información que se puede obtener

* `dig example.com A` → dirección IPv4
* `dig example.com AAAA` → dirección IPv6
* `dig example.com MX` → servidores de correo
* `dig example.com NS` → servidores de nombres
* `dig example.com TXT` → registros de texto (SPF, verificación, etc.)

También se puede ver la **cadena completa de resolución**:
```bash
dig +trace example.com
```

Esto muestra todos los saltos desde los **root servers** hasta los **autoritativos**.

```ad-info
Es el sucesor moderno de herramientas más antiguas como `nslookup` y es la opción preferida por administradores de red y desarrolladores para diagnosticar problemas de resolución de nombres.
```


___
