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
  - "[[nslookup]]"
---
# Dig - Domain Information Groper

***

## Cheatsheet

| **Comando dig**                                                 | **Objetivo**                         |
| --------------------------------------------------------------- | ------------------------------------ |
| <pre><code>`dig dominio.com`</code></pre>                       | **Consulta Básica**                  |
| <pre><code>`dig dominio.com +short`</code></pre>                | **Respuesta Corta (Solo la IP)**     |
| <pre><code>`dig @8.8.8.8 dominio.com`</code></pre>              | **Consultar Servidor Específico**    |
| <pre><code>`dig dominio.com MX`</code></pre>                    | **Buscar Servidores de Correo**      |
| <pre><code>`dig dominio.com NS`</code></pre>                    | **Buscar Nameservers**               |
| <pre><code>`dig dominio.com +trace`</code></pre>                | **Rastreo Completo (Traza)**         |
| <pre><code>`dig -x 8.8.8.8`</code></pre>                        | **Resolución Inversa (IP a Nombre)** |
| <pre><code>`dig dominio.com TXT`</code></pre>                   | **Verificar Registros de Seguridad** |
| <pre><code>`dig axfr @ns1.dominio.com dominio.com`</code></pre> | **Transferencia de Zona**            |
| <pre><code>`dig dominio.com ANY`</code></pre>                   | **Consultar Todos los Registros**    |
^dig-enum


***

## Overview

Permite preguntar a un servidor DNS: _"¿cuál es la dirección IP de este dominio?"_ o _"¿Quién gestiona el correo de esta empresa?"_.

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

## ¿Por qué usar `dig` en lugar de [[nslookup]]?

- **Precisión:** `dig` utiliza las bibliotecas de resolución de nombres de BIND (el estándar de internet), por lo que es más fiel a cómo se comporta el tráfico real.
- **Flexibilidad:** Permite ver todo el proceso de "recursión" (cómo se llega desde los servidores raíz hasta el dominio final) usando `+trace`.
- **Detalle:** Proporciona información técnica sobre el TTL (Time To Live) y las cabeceras de respuesta que otras herramientas ocultan.


___
