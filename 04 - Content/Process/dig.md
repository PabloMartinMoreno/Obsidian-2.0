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
