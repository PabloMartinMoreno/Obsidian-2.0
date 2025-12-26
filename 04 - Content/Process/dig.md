---
aliases:
  - Domain Information Groper
tags:
  - type/command
  - technique/recon/active
  - asset/infrastructure
  - tool/dig
  - protocol/dns
  - port/53
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: Command
linked:
  - "[[DNS Enumeration (53)]]"
  - "[[DNS]]"
  - "[[DNS - Herramientas]]"
---
# Dig - Domain Information Groper

***

## Cheatsheet

| **Comando**                                                 | **Descripción**                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| <pre><code>`dig $TARGET @<nameserver/IP>`</code></pre>      | <br>Identifica el registro **A** del dominio objetivo.             |
| <pre><code>`dig a $TARGET @<nameserver/IP>`</code></pre>    | <br>Identifica el registro **A** del dominio objetivo.             |
| <pre><code>`dig -x <IP> @<nameserver/IP>`</code></pre>      | <br>Identifica el registro **PTR** de la dirección IP objetivo.    |
| <pre><code>`dig any $TARGET @<nameserver/IP>`</code></pre>  | <br>Identifica **todos los registros (ANY)** del dominio objetivo. |
| <pre><code>`dig txt $TARGET @<nameserver/IP>`</code></pre>  | <br>Identifica los registros **TXT** del dominio objetivo.         |
| <pre><code>`dig mx $TARGET @<nameserver/IP>`</code></pre>   | <br>Identifica los registros **MX** del dominio objetivo.          |
| <pre><code>`dig axfr $TARGET @<nameserver/IP>`</code></pre> | <br>Copia completa de todos los registros DNS.                     |
^dig-enum


| **Objetivo**                         | **Comando dig**                         | **Tipo / Flag** |
| ------------------------------------ | --------------------------------------- | --------------- |
| **Transferencia de Zona**            | `dig axfr @ns1.dominio.com dominio.com` | **AXFR**        |
| **Consultar Todos los Registros**    | `dig dominio.com ANY`                   | **ANY**         |
| **Consulta Básica**                  | `dig dominio.com`                       | **A**           |
| **Respuesta Corta (Solo la IP)**     | `dig dominio.com +short`                | **+short**      |
| **Consultar Servidor Específico**    | `dig @8.8.8.8 dominio.com`              | **@server**     |
| **Buscar Servidores de Correo**      | `dig dominio.com MX`                    | **MX**          |
| **Buscar Nameservers**               | `dig dominio.com NS`                    | **NS**          |
| **Rastreo Completo (Traza)**         | `dig dominio.com +trace`                | **+trace**      |
| **Resolución Inversa (IP a Nombre)** | `dig -x 8.8.8.8`                        | **-x**          |
| **Verificar Registros de Seguridad** | `dig dominio.com TXT`                   | **TXT**         |

***

## Overview


Envía una **consulta DNS** (query) a un **servidor de nombres** para resolver un dominio.
Ejemplo básico:
```bash
dig example.com
```

**Por defecto usa el DNS configurado en mi sistema** (por ejemplo, 8.8.8.8 de Google o el DNS de mi ISP) y devuelve los registros A (dirección IPv4) del dominio.

También se puede especificar un servidor DNS concreto:
```bash
dig @8.8.8.8 example.com
```

Ahí se le está pidiendo explícitamente a Google que resuelva `example.com`.

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


***

## Notas Relacionadas
