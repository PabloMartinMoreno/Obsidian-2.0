---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
---
# XXE - Inyección Mediante XInclude

***

## Cheatsheet

|**Objetivo Estratégico**|**Descripción de la Técnica**|**Estructura del Payload**|
|---|---|---|
|**Extracción de Archivos Locales (Texto Plano)**|Utilizo el atributo `parse="text"` para indicar al parser que lea el recurso como texto sin procesar. Esto es fundamental para evitar errores sintácticos al leer archivos del sistema (como `/etc/passwd`) que contienen caracteres que romperían un documento XML.|`<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo>`|
|**Extracción de Archivos Locales (XML)**|Empleo `parse="xml"` (o simplemente omito el atributo, al ser el valor predeterminado) si el archivo que intento recuperar está estructurado como un XML válido. Si no lo es, el parser lanzará una excepción y detendrá el procesamiento.|`<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="xml" href="file:///var/www/config.xml"/></foo>`|
|**Ejecución de SSRF**|Modifico el atributo `href` para apuntar a una URL en lugar de una ruta de archivo. Esto obliga al analizador XML a realizar una petición HTTP/HTTPS desde el backend, abriendo la puerta a un ataque de [[SSRF]].|`<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="http://169.254.169.254/latest/meta-data/"/></foo>`|

## Requisitos y Limitaciones

- **Soporte Habilitado:** Para que la inyección sea exitosa, el parser XML subyacente (por ejemplo, en integraciones SOAP o arquitecturas Java subyacentes) debe tener la funcionalidad `XInclude` habilitada. Aunque no siempre está activa por defecto, es una característica ampliamente utilizada para la modularidad de documentos.
- **Declaración del Namespace:** Es un requisito estricto inyectar la URL exacta del espacio de nombres `http://www.w3.org/2001/XInclude`. Si la aplicación backend sanitiza los atributos o bloquea la cadena `xmlns`, el parser no reconocerá la instrucción `<xi:include>`.
- **Ausencia de Reflejo (Blind):** Si logro inyectar el payload pero la aplicación procesa el documento sin devolver el valor del nodo en la respuesta HTTP visible, la técnica _in-band_ falla. En este caso, el flujo de trabajo requiere pivotar hacia la exfiltración mediante [[XXE Out-of-Band (OOB)]].


***

## Overview

La inyección de XInclude es una técnica alternativa de [[XXE]] que se emplea cuando la aplicación objetivo recibe una entrada (incluso en formatos no XML, como JSON o parámetros POST convencionales) y la incrusta directamente dentro de un documento XML en el servidor antes de analizarlo. En este escenario, como no hay control sobre el inicio del documento ni acceso al preámbulo, resulta imposible declarar o modificar la etiqueta `DOCTYPE` para definir entidades externas.

Para eludir esta restricción y lograr el mismo impacto, se utiliza la especificación `XInclude`, diseñada para construir documentos XML a partir de fragmentos o archivos externos. Para que el ataque funcione en un nodo inyectado, se debe declarar explícitamente el espacio de nombres de XInclude (`xmlns:xi`) y luego invocar el archivo o recurso deseado.

***

## Notas Relacionadas


***
