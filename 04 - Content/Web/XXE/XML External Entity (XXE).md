---
aliases:
  - XXE
tags:
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[XXE - Clásico In-band]]"
  - "[[XXE - Clásico SSRF]]"
  - "[[XXE - Inyección Mediante XInclude]]"
  - "[[XXE - Blind Basado en Errores]]"
  - "[[XXE - Out-of-Band (OOB) y DTDs Externos]]"
  - "[[XXE - Carga de Archivos (Formatos XML Ocultos)]]"
  - "[[XXE - DTDs Locales]]"
---
# XML External Entity (XXE)

***

## Cheatsheet

### 1. In-Band (respuesta directa)

````tabs
tab: **Clásico (file:// + entity reflejada)**
![[XXE - Clásico In-band#^xxe-clasico-inband]]

tab: **SSRF (http/https/gopher en entity)**
![[XXE - Clásico SSRF#^xxe-clasico-ssrf]]
````

### 2. Blind & OOB

````tabs
tab: **Basado en Errores (parser verbose)**
![[XXE - Blind Basado en Errores#^xxe-blind-errores]]

tab: **OOB DTDs Externos (HTTP/FTP/DNS exfil)**
![[XXE - Out-of-Band (OOB) y DTDs Externos#^xxe-oob]]

tab: **DTDs Locales (egress filtering bypass)**
![[XXE - DTDs Locales#^xxe-dtds-locales]]
````

### 3. Vectores Indirectos

````tabs
tab: **XInclude (sin control del DOCTYPE)**
![[XXE - Inyección Mediante XInclude#^xxe-xinclude]]

tab: **Carga de Archivos (SVG/DOCX/XLSX/XMP)**
![[XXE - Carga de Archivos (Formatos XML Ocultos)#^xxe-carga-archivos]]
````

---

## Overview

**XML External Entity (XXE)** es una vulnerabilidad de _injection_ que afecta a parsers XML mal configurados. El atacante abusa de la capacidad del parser para resolver **entidades externas** declaradas en el `DOCTYPE`, logrando:

- **Lectura arbitraria de archivos** locales del servidor (`file:///etc/passwd`, `.env`, claves privadas).
- **SSRF** apuntando a red interna o endpoints de metadatos cloud (`http://169.254.169.254/`).
- **Exfiltración OOB** cuando el contenido no se refleja directamente.
- **DoS** mediante expansión recursiva (Billion Laughs).
- **RCE** en parsers con soporte de wrappers exóticos (`expect://`, `jar://`).

### Vectores de entrada

- Endpoints que aceptan `Content-Type: application/xml` o `text/xml`.
- Subida de archivos con formatos basados en XML: `.docx`, `.xlsx`, `.svg`, `.xml`, `.wsdl`, `.rss`.
- APIs SOAP, configuraciones internas, webhooks que consumen XML.
- Parámetros que pasan por deserialización XML (Java `XMLDecoder`, .NET `XmlDocument`).

### Identificación

1. Interceptar request con Burp, detectar XML en body o content-type.
2. Enviar payload de prueba con entidad simple (`<!ENTITY test "hola">` + `&test;`) — si se refleja, el parser resuelve entidades.
3. Escalar a entidad externa con `SYSTEM "file:///etc/hostname"`.
4. Si no se refleja nada, pivotar a **Blind** (errores) u **OOB** (DNS/HTTP callback).

### Prevención

- Deshabilitar resolución de DTDs externos y entidades externas en la config del parser.
- Java: `XMLInputFactory.setProperty("javax.xml.stream.supportDTD", false)`.
- PHP: `libxml_disable_entity_loader(true)` (obsoleto en PHP 8+, deshabilitado por default).
- .NET: `XmlReaderSettings { DtdProcessing = Prohibit }`.
- Preferir formatos alternativos (JSON) cuando sea posible.

***

## Notas Relacionadas

- [[Server-Side Request Forgery (SSRF)]] — XXE a menudo escala a SSRF.
- [[File Inclusion]] — técnica complementaria de lectura de archivos.
- [[Insecure Deserialization]] — mismo nivel de abuso de parsers.

***
