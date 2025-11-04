---
aliases:
tags:
  - type/command
primary categories:
secondary categories:
tertiary categories:
type: Command
linked:
---
# Whois

***

## Cheatsheet

| **Acción**                                                                                   | **Descripción**                                                                                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| <pre><code>`whois <target-FQDN>`</code></pre><pre><code>`whois <target-ip>`</code></pre><br> | <br><br><br>Realiza una búsqueda WHOIS para obtener los detalles de registro y contacto del dominio objetivo. |
| <pre><code>`whois -h <whois-server> …`</code></pre>                                          | <br>Realiza una búsqueda WHOIS utilizando un servidor WHOIS específico.                                       |
^whois-enum-subdominios

## Overview

**Es un protocolo de consulta y respuesta ampliamente utilizado diseñado para acceder a bases de datos que almacenan información sobre recursos de Internet registrados.** 

También proporciona detalles sobre bloques de direcciones IP, sistemas autónomos y la huella digital de la organización objetivo:

- **Identificación de personal clave:** los registros WHOIS suelen mostrar nombres, direcciones de correo y teléfonos de las personas responsables del dominio. Esta información puede aprovecharse en ataques de ingeniería social o para identificar objetivos potenciales de phishing.

- **Descubrimiento de infraestructura de red:** detalles técnicos como servidores de nombres y direcciones IP ofrecen pistas sobre la infraestructura de la organización, lo que ayuda a localizar puntos de entrada o configuraciones erróneas.

- **Análisis histórico:** acceder a registros WHOIS históricos mediante servicios especializados permite ver cambios en la propiedad, contactos o detalles técnicos a lo largo del tiempo, útil para rastrear la evolución de la presencia digital del objetivo.
