---
aliases:
  - XSLT Detection
  - XSLT Fingerprint
  - XSLT Version Detection
tags:
  - type/technique
  - vuln/xslt-injection
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
---
# XSLT - Fingerprinting

***

## Detección Básica

| **Objetivo** | **Payload** | **Resultado esperado** |
|:---:|:---:|:---:|
| Reflexión literal | `<xsl:value-of select="'XSLT-OK'"/>` | String `XSLT-OK` en response → input procesado como XSLT. |
| Aritmética server-side | `<xsl:value-of select="7*7"/>` | `49` → expresiones XPath se evalúan en backend. |
| Concatenación | `<xsl:value-of select="concat('XS','LT','-',7*7)"/>` | `XSLT-49` confirma concat + aritmética. |
| Generate-id | `<xsl:value-of select="generate-id(.)"/>` | ID único del nodo → confirma parse + context. |
| Versión XSLT | `<xsl:value-of select="system-property('xsl:version')"/>` | `1.0` / `2.0` / `3.0` — define vocabulario disponible. |
| Stylesheet completo | `<?xml version="1.0"?><xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><xsl:value-of select="'XSLT-OK'"/></xsl:template></xsl:stylesheet>` | Si input acepta XSL completo, no fragmento. |
| Forzar parser fail | `<xsl:value-of select="bogusfunction()"/>` | Stack trace con namespace del motor. |
| XPath type error | `<xsl:value-of select="1 div 0"/>` | Error con código XPath estándar. |
^xslt-fp-detection

___

## Fingerprinting de Motores

| **Objetivo** | **Payload** | **Info extraída** |
|:---:|:---:|:---:|
| Vendor | `<xsl:value-of select="system-property('xsl:vendor')"/>` | `Saxonica` / `libxslt` / `Apache Software Foundation` / `Microsoft`. |
| Vendor URL | `<xsl:value-of select="system-property('xsl:vendor-url')"/>` | URL oficial — corrobora vendor. |
| Saxon product | `<xsl:value-of select="system-property('xsl:product-name')"/>` | `SAXON` / `Saxon-HE` / `Saxon-PE` / `Saxon-EE`. |
| Saxon version | `<xsl:value-of select="system-property('xsl:product-version')"/>` | Versión exacta → CVE lookup. |
| PHP extension | `<xsl:value-of select="function-available('php:function')"/>` | `true` → libxslt + `registerPHPFunctions()` → RCE PHP. |
| Saxon evaluate | `<xsl:value-of select="function-available('saxon:evaluate')"/>` | `true` → Saxon-PE/EE. |
| Java Runtime | `<xsl:value-of select="function-available('rt:exec')"/>` | `true` → Xalan o Saxon con `java:` namespace. |
| MSXML script | `<xsl:value-of select="function-available('msxsl:script')"/>` | `true` → MSXML con scripts habilitados. |
| document() | `<xsl:value-of select="function-available('document')"/>` | `true` → file read + SSRF (estándar 1.0+). |
| unparsed-text() | `<xsl:value-of select="function-available('unparsed-text')"/>` | `true` → XSLT 2.0+ → file read raw. |
| Pattern stack `net.sf.saxon.*` | Error verbose | Saxon (Java). |
| Pattern stack `org.apache.xalan.*` | Error verbose | Xalan-Java. |
| Pattern stack `Microsoft.XmlDom` / `System.Xml.Xsl` | Error verbose | MSXML / .NET. |
| Pattern stack `XSLTProcessor::transformToXml` | Warning PHP | libxslt vía PHP. |
^xslt-fp-engines

### Decisión por vendor

| Vendor | XSLT máx | RCE primario |
|---|---|---|
| `libxslt` | 1.0 | `php:function` (si registrado) |
| `Saxonica` | 2.0 / 3.0 | `java:` reflection (PE/EE only) |
| `Apache Software Foundation` | 1.0 | `java.lang.Runtime` static |
| `Microsoft` | 1.0 / 2.0 | `msxsl:script` (legacy) |

***
