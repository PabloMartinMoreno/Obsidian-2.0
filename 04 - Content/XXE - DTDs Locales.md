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
type: Technique
linked:
  - '[[XML External Entity (XXE)]]'
---
# XXE - DTDs Locales

***

## Cheatsheet

| **Entorno / Objetivo**                      | **Ruta Común del DTD Local**             | **Estructura del Payload y Redefinición**                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sistemas Linux (Entornos con GNOME)**     | `/usr/share/yelp/dtd/docbookx.dtd`       | Inyecto el payload redefiniendo la entidad `ISOamso` declarada en `docbookx.dtd`.<br>`<!DOCTYPE foo [`<br>`<!ENTITY % local_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">`<br>`<!ENTITY % ISOamso '`<br>`<!ENTITY &#x25; file SYSTEM "file:///etc/passwd">`<br>`<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///inexistente/&#x25;file;&#x27;>">`<br>`&#x25;eval;`<br>`&#x25;error;`<br>`'>`<br>`%local_dtd;]><foo/>` |
| **Sistemas Linux (Entornos Debian/Ubuntu)** | `/usr/share/xml/fontconfig/fonts.dtd`    | Redefino la entidad `expr` o similar. La lógica de codificación de entidades (como `&#x25;` para `%`) es idéntica al payload anterior, cambiando únicamente la ruta del DTD y la entidad objetivo a sobrescribir.                                                                                                                                                                                                                                   |
| **Sistemas Windows**                        | `C:\Windows\System32\wbem\xml\wmi20.dtd` | Dependiendo del analizador y la versión de Windows, busco DTDs predeterminados. Alternativamente, si conozco el framework (ej. Java), apunto a archivos dentro del directorio de instalación, como `[RUTA_JAVA]\jre\lib\fontconfig.dtd`.                                                                                                                                                                                                            |
| **Cisco WebEx / Aplicaciones Específicas**  | `/opt/webex/bin/.../webex.dtd`           | Si la aplicación es un producto empaquetado conocido, investigo el sistema de archivos del appliance para identificar DTDs estáticos y construir la ruta absoluta en el vector `SYSTEM`.                                                                                                                                                                                                                                                            |

^xxe-dtds-locales

## Consideraciones Tácticas y Limitaciones

- **Codificación de Entidades:** Es un requisito estricto codificar los caracteres especiales (`%` como `&#x25;`, `&` como `&#x26;`, `'` como `&#x27;`) dentro de la entidad redefinida. Esto asegura que el analizador XML no intente evaluar la carga útil prematuramente en el subconjunto interno, sino que la procese correctamente solo cuando se expanda dentro del contexto del DTD local invocado.
- **Descubrimiento Ciego:** Encontrar un DTD local válido a menudo requiere fuerza bruta iterando sobre un diccionario de rutas comunes de DTDs para diferentes sistemas operativos. Si el servidor devuelve un error al intentar cargar una ruta, me sirve como indicador de que el archivo no existe; si no devuelve error, he encontrado un DTD válido para explotar.
- **Dependencia de Errores Visibles:** Si el objetivo es exfiltrar datos (y no solo ejecutar un SSRF), esta técnica asume que el servidor refleja las excepciones del parser XML en la respuesta HTTP, exponiendo la ruta malformada generada por la entidad `%error;`. Si los errores están suprimidos, la exfiltración directa de los datos fracasará.


***

## Overview

Cuando me enfrento a un entorno con un [[Firewall de Salida (Egress)]] estricto que bloquea la descarga de archivos DTD desde mi servidor, la técnica de exfiltración convencional mediante DTDs externos queda neutralizada. Para evadir esta restricción y lograr un ataque de [[Blind XXE]], recurro a la reutilización y redefinición de archivos DTD legítimos que ya existen en el sistema de archivos del servidor objetivo.

La especificación XML me prohíbe utilizar entidades de parámetros para definir dinámicamente otras entidades dentro del subconjunto DTD interno. Sin embargo, esta restricción no aplica a los DTDs externos. Al invocar un DTD local (presente en el servidor) como si fuera externo, y redefinir una de las entidades de parámetros que este DTD declara, puedo inyectar mi propia lógica maliciosa. Cuando el parser procesa el DTD local, evalúa mi entidad redefinida, permitiéndome encadenar la lectura de archivos con una [[Exfiltración Basada en Errores]] o forzar una interacción de red permitida.

***

## Notas Relacionadas


***
