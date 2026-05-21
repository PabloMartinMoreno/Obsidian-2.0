---
aliases:
tags:
  - type/command
  - type/tool
  - technique/recon/passive
  - asset/infrastructure
  - tool/whois
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: Command
linked:
  - "[[whois - Escenarios de Uso]]"
---
# Whois

***

## Cheatsheet

| **Acción**                                                                       | **Descripción**                                                                                       |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| <pre><code>`whois <domain>`</code></pre><pre><code>`whois <IP>`</code></pre><br> | <br>Realiza una búsqueda WHOIS para obtener los detalles de registro y contacto del dominio objetivo. |
| <pre><code>`whois -h <whois-server> <domain>`</code></pre>                       | <br>Realiza una búsqueda WHOIS utilizando un servidor WHOIS específico.                               |
^whois-enum-pasiva-subdominios

***

## Overview


Es un protocolo de red utilizado para consultar bases de datos que almacenan información sobre los responsables de un recurso de internet, como un **nombre de dominio** o una **dirección IP**. **En términos sencillos, es el "directorio telefónico" de internet que permite saber quién es el dueño de una web y cómo contactarlo.**

También proporciona detalles sobre bloques de direcciones IP, sistemas autónomos y la huella digital de la organización objetivo:

- **Identificación de personal clave:** los registros WHOIS suelen mostrar nombres, direcciones de correo y teléfonos de las personas responsables del dominio. Esta información puede aprovecharse en ataques de ingeniería social o para identificar objetivos potenciales de phishing.

- **Descubrimiento de infraestructura de red:** detalles técnicos como servidores de nombres y direcciones IP ofrecen pistas sobre la infraestructura de la organización, lo que ayuda a localizar puntos de entrada o configuraciones erróneas.

- **Análisis histórico:** acceder a registros WHOIS históricos mediante servicios especializados permite ver cambios en la propiedad, contactos o detalles técnicos a lo largo del tiempo, útil para rastrear la evolución de la presencia digital del objetivo.


```ad-attention
Los datos de WHOIS pueden ser inexactos o oscurecidos intencionalmente, por lo que siempre es prudente verificar la información de múltiples fuentes. Los servicios de privacidad también pueden enmascarar al verdadero propietario de un dominio, lo que hace más difícil obtener información precisa a través de WHOIS.
```

```ad-important 
El protocolo WHOIS es muy antiguo (data de los años 80) y tiene limitaciones técnicas (no soporta bien caracteres internacionales, por ejemplo). Por ello, está siendo reemplazado gradualmente por **RDAP** (_Registration Data Access Protocol_). 

**RDAP** es más seguro, permite búsquedas más estructuradas y facilita que los registradores controlen quién puede ver qué datos (acceso diferenciado).
```


---
